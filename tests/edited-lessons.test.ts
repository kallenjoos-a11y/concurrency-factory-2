import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileCounterProgram } from '../src/simulation/counter-program.ts';
import { compileQueueProgram } from '../src/simulation/queue-program.ts';
import { SimulationController } from '../src/simulation/controller.ts';
import { describeEvent } from '../src/lesson/presentation.ts';

function finish(controller: SimulationController) {
  let snapshot = controller.snapshot();
  for (let i = 0; i < 100 && snapshot.status !== 'FINISHED'; i++) snapshot = controller.nextStep();
  assert.equal(snapshot.status, 'FINISHED');
  return snapshot;
}

test('edited counter amounts lose A’s update without a lock and preserve both with it', () => {
  for (const settings of [{ start: 20, a: 2, b: 1 }, { start: 0, a: 1, b: 2 }, { start: 999, a: 20, b: 20 }]) {
    for (const safe of [false, true]) {
      const program = compileCounterProgram(settings, safe);
      const controller = new SimulationController(program.scenario);
      const snapshot = finish(controller);
      assert.equal(snapshot.sharedVariables[0].value, safe ? program.expected : settings.start + settings.b);
      assert.equal(snapshot.events.some(event => event.type === 'THREAD_BLOCKED'), safe);
      for (const worker of program.scenario.workers) for (const instruction of worker.instructions) {
        const source = program.python[instruction.sourceLocation.line - 1];
        if (instruction.type === 'CALCULATE') assert.ok(source.includes(`+= ${worker.id === 'a' ? settings.a : settings.b}`));
      }
      const calculation = snapshot.events.find(event => event.type === 'CALCULATION_COMPLETED' && event.workerId === 'a')!;
      assert.ok(describeEvent(calculation, snapshot).includes(`adds ${settings.a} `));
      assert.equal(controller.reset().sharedVariables[0].value, settings.start);
      assert.deepEqual(finish(controller), snapshot);
    }
  }
});

test('counter editor rejects invalid starting counts and increases', () => {
  for (const settings of [{ start: -1, a: 1, b: 1 }, { start: 1000, a: 1, b: 1 }, { start: 10.5, a: 1, b: 1 }, { start: 10, a: 0, b: 1 }, { start: 10, a: 1, b: 21 }, { start: NaN, a: 1, b: 1 }]) assert.throws(() => compileCounterProgram(settings, false));
});

test('edited empty queue blocks first, wakes without taking, then receives all packages FIFO', () => {
  for (const count of [1, 4, 12]) {
    const program = compileQueueProgram(Array.from({ length: count }, (_, i) => `    jobs.put("Box ${i}")`).join('\n'), true);
    const controller = new SimulationController(program.scenario);
    let snapshot = controller.nextStep();
    assert.equal(snapshot.workers[1].state, 'BLOCKED');
    assert.equal(snapshot.workers[1].instructionPointer, 0);
    assert.equal(snapshot.workers[1].localVariables.item, undefined);
    snapshot = controller.nextStep();
    assert.equal(snapshot.workers[1].state, 'READY');
    assert.equal(snapshot.workers[1].instructionPointer, 0);
    assert.equal(snapshot.queues[0].items.length, 1);
    assert.equal(snapshot.workers[1].localVariables.item, undefined);
    snapshot = finish(controller);
    assert.deepEqual(snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => event.packageId), program.scenario.packages!.map(item => item.id));
    assert.equal(controller.reset().queues[0].items.length, 0);
    assert.equal(controller.nextStep().workers[1].state, 'BLOCKED');
  }
});
