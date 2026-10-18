import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../src/simulation/workers.ts';
import { InstructionExecutor, defaultInstructionHandlers } from '../src/simulation/instructions.ts';
import { counterScenario } from '../src/simulation/scenarios.ts';
import { Simulation } from '../src/simulation/simulation.ts';
import { SimulationController } from '../src/simulation/controller.ts';
import type { ExecutionContext, InstructionHandlers } from '../src/simulation/instructions.ts';
import type { SimulationEvent } from '../src/simulation/types.ts';

test('workers initialized from one definition own independent programs, locals, and resources', () => {
  const definition = counterScenario(false).workers[0];
  const first = createWorker(definition);
  const second = createWorker(definition);
  first.instructions[0].sourceLocation.line = 999;
  first.localVariables.local_counter = 42;
  first.heldResources.push('lock');
  assert.equal(second.instructions[0].sourceLocation.line, 5);
  assert.equal(definition.instructions[0].sourceLocation.line, 5);
  assert.deepEqual(second.localVariables, {});
  assert.deepEqual(second.heldResources, []);
  assert.equal(second.state, 'READY');
});

test('instruction handlers execute independently of the simulation or scheduler', () => {
  const worker = createWorker(counterScenario(false).workers[0]);
  const variable = { id: 'counter', name: 'counter', value: 20, lastReadBy: null as string | null, lastWrittenBy: null as string | null };
  const events: { type: SimulationEvent['type']; value?: SimulationEvent['value'] }[] = [];
  const context: ExecutionContext = {
    variable: () => variable,
    semaphore: () => { throw new Error('No semaphore in this test'); },
    lock: () => { throw new Error('No lock used in this program'); },
    queue: () => { throw new Error('No queue used in this program'); },
    package: () => { throw new Error('No package used in this program'); },
    worker: () => worker,
    emit(type, _worker, details) { events.push({ type, value: details?.value }); },
  };
  const executor = new InstructionExecutor();
  for (const instruction of worker.instructions) {
    executor.validate(worker, instruction, context);
    assert.equal(executor.execute(worker, instruction, context), true);
  }
  assert.equal(variable.value, 21);
  assert.equal(worker.localVariables.local_counter, 21);
  assert.equal(worker.state, 'FINISHED');
  assert.deepEqual(events.filter(event => ['SHARED_VALUE_READ', 'CALCULATION_COMPLETED', 'SHARED_VALUE_WRITTEN'].includes(event.type)).map(event => event.value), [20, 21, 21]);
});

test('a handler registry can be replaced without changing scheduling or the simulation loop', () => {
  const calculatedBy: string[] = [];
  const executor = new InstructionExecutor({
    ...defaultInstructionHandlers,
    CALCULATE: {
      validate: defaultInstructionHandlers.CALCULATE.validate,
      execute(worker, instruction, context) {
        calculatedBy.push(worker.id);
        return defaultInstructionHandlers.CALCULATE.execute(worker, instruction, context);
      },
    },
  });
  const simulation = new Simulation(counterScenario(false), undefined, executor);
  for (let i = 0; i < 8; i++) simulation.nextStep();
  assert.deepEqual(calculatedBy, ['a', 'b']);
  assert.equal(simulation.snapshot().sharedVariables[0].value, 11);
});

test('controller creates a fresh executor on reset, preserving reproducible event history', () => {
  let factories = 0;
  const controller = new SimulationController(counterScenario(true), undefined, () => {
    factories++;
    return new InstructionExecutor();
  });
  for (let i = 0; i < 13; i++) controller.nextStep();
  const first = controller.snapshot();
  assert.equal(first.status, 'FINISHED');
  controller.reset();
  assert.equal(factories, 2);
  for (let i = 0; i < 13; i++) controller.nextStep();
  assert.deepEqual(controller.snapshot(), first);
});

test('the same execution loop works with three workers and arbitrary names and local variables', () => {
  const scenario = counterScenario(false);
  const program = structuredClone(scenario.workers[0].instructions);
  for (const instruction of program) {
    if ('storeAs' in instruction) instruction.storeAs = 'my_count';
    if (instruction.type === 'CALCULATE') instruction.left = { local: 'my_count' };
    if (instruction.type === 'WRITE_SHARED') instruction.value = { local: 'my_count' };
  }
  scenario.workers = ['shipping', 'packing', 'loading'].map(id => ({ id, name: id, instructions: program }));
  scenario.schedule = [];
  const simulation = new Simulation(scenario, {
    selectNext(workers) { return workers.find(worker => worker.state === 'READY')?.id ?? null; },
  });
  for (let i = 0; i < 12; i++) simulation.nextStep();
  const state = simulation.snapshot();
  assert.equal(state.status, 'FINISHED');
  assert.equal(state.sharedVariables[0].value, 13);
  assert.deepEqual(state.workers.map(worker => worker.localVariables.my_count), [11, 12, 13]);
});

test('changing a caller-owned handler registry cannot replace behavior mid-run', () => {
  const handlers: InstructionHandlers = { ...defaultInstructionHandlers, READ_SHARED: { ...defaultInstructionHandlers.READ_SHARED } };
  const executor = new InstructionExecutor(handlers);
  handlers.READ_SHARED.execute = () => { throw new Error('Caller replaced the handler'); };
  const simulation = new Simulation(counterScenario(false), undefined, executor);
  assert.doesNotThrow(() => simulation.nextStep());
  assert.equal(simulation.snapshot().workers[0].localVariables.local_counter, 10);
});
