import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queueScenario } from '../src/simulation/queue-scenario.ts';
import { Simulation } from '../src/simulation/simulation.ts';
import { SimulationController } from '../src/simulation/controller.ts';

test('packages wait in a real unbounded FIFO queue and each take removes the oldest exactly once', () => {
  const simulation = new Simulation(queueScenario());
  assert.deepEqual(simulation.snapshot().queues[0].items, []);
  assert.equal(simulation.snapshot().queues[0].capacity, null);
  for (let i = 0; i < 3; i++) simulation.nextStep();
  const waiting = simulation.snapshot();
  assert.deepEqual(waiting.queues[0].items, ['package-a', 'package-b', 'package-c']);
  assert.ok(waiting.packages.every(item => item.state === 'QUEUED' && item.currentOwner === 'jobs'));
  assert.equal(waiting.queues[0].unfinishedTasks, 3);
  for (const id of ['package-a', 'package-b', 'package-c']) {
    const state = simulation.nextStep();
    assert.equal(state.workers[1].localVariables.item, id);
    assert.equal(state.packages.find(item => item.id === id)?.currentOwner, 'b');
    assert.equal(state.packages.find(item => item.id === id)?.state, 'ASSIGNED');
    assert.ok(!state.queues[0].items.includes(id));
  }
  simulation.nextStep(); simulation.nextStep();
  const final = simulation.snapshot();
  assert.equal(final.status, 'FINISHED');
  assert.deepEqual(final.queues[0].items, []);
  assert.deepEqual(final.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => event.packageId), ['package-a', 'package-b', 'package-c']);
  assert.deepEqual(final.events.filter(event => event.type === 'QUEUE_ITEM_ADDED').map(event => event.queueLength), [1, 2, 3]);
  assert.deepEqual(final.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => event.queueLength), [2, 1, 0]);
  // Getting work does not mark it processed or completed.
  assert.equal(final.queues[0].unfinishedTasks, 3);
});

test('reset reconstructs package ownership, queue contents, worker locals and history', () => {
  const controller = new SimulationController(queueScenario());
  const initial = controller.snapshot();
  for (let i = 0; i < 8; i++) controller.nextStep();
  const final = controller.snapshot();
  assert.deepEqual(controller.reset(), initial);
  for (let i = 0; i < 8; i++) controller.nextStep();
  assert.deepEqual(controller.snapshot(), final);
});

test('FIFO follows the actual put order, rather than sorting or hard-coding package labels', () => {
  const scenario = queueScenario();
  const order = ['package-c', 'package-a', 'package-b'];
  scenario.workers[0].instructions.forEach((instruction, i) => {
    if (instruction.type === 'QUEUE_PUT') instruction.packageId = order[i];
  });
  const simulation = new Simulation(scenario);
  for (let i = 0; i < 8; i++) simulation.nextStep();
  assert.deepEqual(simulation.snapshot().events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => event.packageId), order);
});

test('an empty get blocks at the same instruction, and put wakes it READY without taking an item', () => {
  const scenario = queueScenario();
  scenario.schedule = ['b', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'];
  const simulation = new Simulation(scenario);
  const blocked = simulation.nextStep();
  assert.equal(blocked.workers[1].state, 'BLOCKED');
  assert.equal(blocked.workers[1].instructionPointer, 0);
  assert.equal(blocked.workers[1].blockedOn, 'jobs');
  assert.deepEqual(blocked.queues[0].waitingConsumers, ['b']);
  assert.ok(blocked.events.some(event => event.type === 'THREAD_BLOCKED' && event.reason === 'QUEUE_EMPTY'));
  const put = simulation.nextStep();
  assert.equal(put.activeWorkerId, 'a');
  assert.equal(put.workers[1].state, 'READY');
  assert.equal(put.workers[1].blockedOn, null);
  assert.deepEqual(put.workers[1].localVariables, {});
  assert.deepEqual(put.queues[0].items, ['package-a']);
  assert.equal(simulation.nextStep().workers[1].localVariables.item, 'package-a');
  for (let i = 0; i < 10 && simulation.snapshot().status !== 'FINISHED'; i++) simulation.nextStep();
  assert.equal(simulation.snapshot().status, 'FINISHED');
});

test('queue and package snapshots cannot mutate live simulation state', () => {
  const simulation = new Simulation(queueScenario());
  const snapshot = simulation.nextStep();
  snapshot.queues[0].items.length = 0;
  snapshot.packages[0].currentOwner = 'corrupted';
  assert.deepEqual(simulation.snapshot().queues[0].items, ['package-a']);
  assert.equal(simulation.snapshot().packages[0].currentOwner, 'jobs');
});

test('invalid references and duplicate packages are rejected rather than losing or duplicating work', () => {
  const bad = queueScenario();
  bad.queues = [];
  assert.throws(() => new Simulation(bad), /Unknown queue/);
  const duplicate = queueScenario();
  duplicate.packages!.push(duplicate.packages![0]);
  assert.throws(() => new Simulation(duplicate), /Duplicate entity/);
  const scenario = queueScenario();
  scenario.workers[0].instructions[1] = structuredClone(scenario.workers[0].instructions[0]);
  const simulation = new Simulation(scenario);
  const before = simulation.nextStep();
  assert.throws(() => simulation.nextStep(), /Only a new package/);
  assert.deepEqual(simulation.snapshot(), before);
});

test('numeric operations reject package references before mutating worker or shared state', () => {
  const scenario = queueScenario();
  scenario.workers[1].instructions[1] = { type: 'CALCULATE', operation: 'ADD', left: { local: 'item' }, right: 1, storeAs: 'number', sourceLocation: { file: 'lesson.py', line: 12 } };
  const simulation = new Simulation(scenario);
  for (let i = 0; i < 4; i++) simulation.nextStep();
  const before = simulation.snapshot();
  assert.throws(() => simulation.nextStep(), /defined finite number/);
  assert.deepEqual(simulation.snapshot(), before);
});
