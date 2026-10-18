import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counterScenario } from '../src/simulation/scenarios.ts';
import { Simulation } from '../src/simulation/simulation.ts';
import { SimulationController } from '../src/simulation/controller.ts';
import { DeterministicScheduler } from '../src/simulation/scheduler.ts';
import type { SimulationSnapshot } from '../src/simulation/types.ts';

function finish(simulation: Simulation | SimulationController) {
  let state = simulation.snapshot();
  for (let i = 0; i < 100 && state.status !== 'FINISHED'; i++) {
    state = simulation.nextStep();
    assert.notEqual(state.status, 'STALLED');
  }
  assert.equal(state.status, 'FINISHED');
  return state;
}
const worker = (state: SimulationSnapshot, id: string) => state.workers.find(item => item.id === id)!;

test('unsafe interleaving reads twice, calculates twice, writes twice and loses one update', () => {
  const simulation = new Simulation(counterScenario(false));
  const states = Array.from({ length: 8 }, () => simulation.nextStep());
  assert.deepEqual(states.map(state => [state.activeWorkerId, state.lastInstruction?.type]), [
    ['a', 'READ_SHARED'], ['b', 'READ_SHARED'], ['a', 'CALCULATE'], ['b', 'CALCULATE'],
    ['a', 'WRITE_SHARED'], ['b', 'WRITE_SHARED'], ['a', 'FINISH'], ['b', 'FINISH'],
  ]);
  assert.deepEqual(states.map(state => state.sharedVariables[0].value), [10, 10, 10, 10, 11, 11, 11, 11]);
  assert.equal(worker(states[1], 'a').localVariables.local_counter, 10);
  assert.equal(worker(states[1], 'b').localVariables.local_counter, 10);
  assert.equal(worker(states[2], 'a').localVariables.local_counter, 11);
  assert.equal(worker(states[2], 'b').localVariables.local_counter, 10);
  assert.equal(states[7].status, 'FINISHED');
  assert.equal(states[7].sharedVariables[0].lastReadBy, 'b');
  assert.equal(states[7].sharedVariables[0].lastWrittenBy, 'b');
});

test('lock blocks B without advancing its pointer and release wakes it READY before acquisition', () => {
  const simulation = new Simulation(counterScenario(true));
  const acquired = simulation.nextStep();
  assert.equal(acquired.locks[0].owner, 'a');
  assert.deepEqual(worker(acquired, 'a').heldResources, ['counter_lock']);
  const blocked = simulation.nextStep();
  assert.equal(worker(blocked, 'b').state, 'BLOCKED');
  assert.equal(worker(blocked, 'b').instructionPointer, 0);
  assert.equal(worker(blocked, 'b').blockedOn, 'counter_lock');
  assert.deepEqual(blocked.locks[0].waitingWorkers, ['b']);
  const attempted = blocked.events.filter(event => event.workerId === 'b').map(event => event.type);
  assert.deepEqual(attempted, ['THREAD_RUNNING', 'LOCK_REQUESTED', 'THREAD_BLOCKED']);
  for (let i = 0; i < 3; i++) {
    const state = simulation.nextStep();
    assert.equal(state.activeWorkerId, 'a');
    assert.deepEqual(worker(state, 'b').localVariables, {});
    assert.equal(worker(state, 'b').instructionPointer, 0);
  }
  const released = simulation.nextStep();
  assert.equal(released.locks[0].owner, null);
  assert.equal(worker(released, 'b').state, 'READY');
  assert.equal(worker(released, 'b').blockedOn, null);
  assert.deepEqual(worker(released, 'b').heldResources, []);
  assert.deepEqual(worker(released, 'a').heldResources, []);
  assert.ok(released.events.some(event => event.type === 'THREAD_UNBLOCKED' && event.workerId === 'b'));
  const bAcquires = simulation.nextStep();
  assert.equal(bAcquires.locks[0].owner, 'b');
  assert.equal(worker(bAcquires, 'b').instructionPointer, 1);
  const bReads = simulation.nextStep();
  assert.equal(worker(bReads, 'b').localVariables.local_counter, 11);
  const final = finish(simulation);
  assert.equal(final.sharedVariables[0].value, 12);
  assert.equal(final.locks[0].owner, null);
  assert.ok(final.workers.every(item => item.state === 'FINISHED'));
});

test('scripted scheduler skips BLOCKED and FINISHED workers; fallback is repeatable', () => {
  const scenario = counterScenario(true);
  scenario.schedule = ['a', 'b', 'b', 'b', 'a'];
  const simulation = new Simulation(scenario);
  simulation.nextStep(); simulation.nextStep();
  const third = simulation.nextStep();
  assert.equal(third.activeWorkerId, 'a');
  assert.equal(third.lastInstruction?.type, 'READ_SHARED');
  assert.equal(worker(third, 'b').instructionPointer, 0);
  const scheduler = new DeterministicScheduler(['b', 'a']);
  const workers = third.workers.map(item => ({ ...item, state: 'FINISHED' as const }));
  assert.equal(scheduler.selectNext(workers), null);
  assert.deepEqual(finish(new Simulation(scenario)), finish(new Simulation(scenario)));
});

test('replaceable scheduler can serialize unsafe workers, proving results come from execution', () => {
  const simulation = new Simulation(counterScenario(false), {
    selectNext(workers) { return workers.find(item => item.state === 'READY')?.id ?? null; },
  });
  assert.equal(finish(simulation).sharedVariables[0].value, 12);
});

test('engine rejects a scheduler that tries to execute a blocked worker', () => {
  let call = 0;
  const simulation = new Simulation(counterScenario(true), { selectNext: () => ++call === 1 ? 'a' : 'b' });
  simulation.nextStep(); simulation.nextStep();
  const before = simulation.snapshot();
  assert.throws(() => simulation.nextStep(), /READY/);
  assert.deepEqual(simulation.snapshot(), before);
});

test('events are ordered, structured, source-linked and snapshots cannot mutate engine state', () => {
  const simulation = new Simulation(counterScenario(false));
  const state = finish(simulation);
  assert.equal(state.events[0].type, 'SIMULATION_STARTED');
  assert.equal(state.events.at(-1)?.type, 'SIMULATION_FINISHED');
  assert.deepEqual(state.events.map(event => event.sequence), state.events.map((_, i) => i + 1));
  const writes = state.events.filter(event => event.type === 'SHARED_VALUE_WRITTEN');
  assert.deepEqual(writes.map(event => [event.previousValue, event.value]), [[10, 11], [11, 11]]);
  assert.equal(writes[0].sourceLocation?.line, 5);
  state.workers[0].localVariables.local_counter = 900;
  state.sharedVariables[0].value = 900;
  state.events.length = 0;
  const actual = simulation.snapshot();
  assert.equal(actual.workers[0].localVariables.local_counter, 11);
  assert.equal(actual.sharedVariables[0].value, 11);
  assert.ok(actual.events.length > 0);
  assert.deepEqual(simulation.nextStep(), actual);
});

for (const safe of [false, true]) test(`reset reconstructs ${safe ? 'safe' : 'unsafe'} simulation and reproduces history`, () => {
  const scenario = counterScenario(safe);
  const controller = new SimulationController(scenario);
  const first = finish(controller);
  // Changing the caller's definition must not change a later reset.
  scenario.sharedVariables[0].value = 900;
  const reset = controller.reset();
  assert.equal(reset.step, 0);
  assert.equal(reset.status, 'IDLE');
  assert.equal(reset.sharedVariables[0].value, 10);
  assert.deepEqual(reset.events, []);
  assert.equal(reset.activeWorkerId, null);
  assert.ok(reset.workers.every(item => item.state === 'READY' && item.instructionPointer === 0 && item.blockedOn === null && Object.keys(item.localVariables).length === 0 && item.heldResources.length === 0));
  assert.ok(reset.locks.every(lock => lock.owner === null && lock.waitingWorkers.length === 0));
  assert.deepEqual(finish(controller), first);
});

test('reset while a lock is held and another worker is blocked clears all waiting state', () => {
  const controller = new SimulationController(counterScenario(true));
  controller.nextStep(); controller.nextStep();
  const reset = controller.reset();
  assert.equal(reset.locks[0].owner, null);
  assert.deepEqual(reset.locks[0].waitingWorkers, []);
  assert.ok(reset.workers.every(item => item.blockedOn === null && item.state === 'READY'));
});

test('non-owner release is rejected without executing the instruction', () => {
  const scenario = counterScenario(true);
  scenario.workers[1].instructions[0] = { type: 'RELEASE_LOCK', lock: 'counter_lock', sourceLocation: { file: 'lesson.py', line: 8 } };
  const simulation = new Simulation(scenario);
  simulation.nextStep();
  const before = simulation.snapshot();
  assert.throws(() => simulation.nextStep(), /owner/);
  assert.deepEqual(simulation.snapshot(), before);
});

test('undefined locals are rejected before changing worker state or emitting instruction events', () => {
  const scenario = counterScenario(false);
  scenario.workers[0].instructions[1] = { type: 'CALCULATE', operation: 'ADD', left: { local: 'missing' }, right: 1, storeAs: 'local_counter', sourceLocation: { file: 'lesson.py', line: 5 } };
  const simulation = new Simulation(scenario);
  simulation.nextStep(); simulation.nextStep();
  const before = simulation.snapshot();
  assert.throws(() => simulation.nextStep(), /defined finite/);
  assert.deepEqual(simulation.snapshot(), before);
});

test('a non-reentrant self-acquisition stalls instead of executing blocked instructions', () => {
  const scenario = counterScenario(true);
  scenario.workers = [scenario.workers[0]];
  scenario.workers[0].instructions.splice(1, 0, structuredClone(scenario.workers[0].instructions[0]));
  const simulation = new Simulation(scenario);
  simulation.nextStep();
  const state = simulation.nextStep();
  assert.equal(state.status, 'STALLED');
  assert.equal(state.workers[0].state, 'BLOCKED');
  assert.equal(state.workers[0].instructionPointer, 1);
  assert.deepEqual(simulation.nextStep(), state);
});
