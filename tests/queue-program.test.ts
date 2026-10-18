import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileQueueProgram, originalQueueBody, QueueProgramError } from '../src/simulation/queue-program.ts';
import { SimulationController } from '../src/simulation/controller.ts';

function run(body: string) {
  const program = compileQueueProgram(body);
  const controller = new SimulationController(program.scenario);
  for (let i = 0; i < program.scenario.packages!.length * 2 + 2; i++) controller.nextStep();
  return { program, controller, snapshot: controller.snapshot() };
}

test('edited names, added packages, and arrival order drive the real FIFO engine', () => {
  const { snapshot, program } = run('jobs.put("Blue")\njobs.put("Red")\njobs.put("Green")\njobs.put("Gold")');
  assert.equal(snapshot.status, 'FINISHED');
  assert.equal(snapshot.packages.length, 4);
  assert.deepEqual(snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => snapshot.packages.find(item => item.id === event.packageId)!.label), ['Blue', 'Red', 'Green', 'Gold']);
  assert.equal(program.scenario.workers[1].instructions.filter(item => item.type === 'QUEUE_GET').length, 4);
  assert.deepEqual(snapshot.queues[0].items, []);
});

test('duplicate labels remain separate package identities and are each received once', () => {
  const { snapshot } = run('jobs.put("Same")\njobs.put("Same")');
  assert.equal(new Set(snapshot.packages.map(item => item.id)).size, 2);
  assert.equal(snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').length, 2);
  assert.ok(snapshot.packages.every(item => item.currentOwner === 'b'));
});

test('comments, blank lines, CRLF, and quoted names preserve generated Python source locations', () => {
  const { program } = run("# arrivals\r\n\r\n    jobs.put('Café') # first\r\n    jobs.put(\"A\\\"B\")\r\n");
  for (const worker of program.scenario.workers) for (const instruction of worker.instructions) {
    const source = program.python[instruction.sourceLocation.line - 1];
    assert.ok(source.includes(instruction.type === 'QUEUE_PUT' ? 'jobs.put(' : instruction.type === 'QUEUE_GET' ? 'jobs.get()' : 'def '));
  }
  assert.deepEqual(program.scenario.packages!.map(item => item.label), ['Café', 'A"B']);
});

test('invalid or unsupported code gives actionable errors instead of executing code', () => {
  for (const body of ['', '# no items', 'jobs.put(42)', 'jobs.put("x"); jobs.put("y")', 'import os', 'for i in range(3):', 'jobs.get()', 'jobs.put(" ")', 'jobs.put("\\n")', `jobs.put("${'a'.repeat(41)}")`, Array(13).fill('jobs.put("A")').join('\n'), 'a'.repeat(4001)]) {
    assert.throws(() => compileQueueProgram(body), QueueProgramError, body);
  }
  try { compileQueueProgram('# comment\njobs.put(1)'); assert.fail('expected validation error'); }
  catch (error) { assert.ok(error instanceof QueueProgramError); assert.equal(error.line, 7); }
});

test('one and twelve packages both complete, and original example is reproducible', () => {
  for (const count of [1, 12]) {
    const { snapshot } = run(Array.from({ length: count }, (_, i) => `jobs.put("${i}")`).join('\n'));
    assert.equal(snapshot.status, 'FINISHED');
    assert.equal(snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').length, count);
  }
  const { controller, snapshot } = run(originalQueueBody);
  assert.equal(controller.reset().step, 0);
  for (let i = 0; i < 8; i++) controller.nextStep();
  assert.deepEqual(controller.snapshot(), snapshot);
  assert.deepEqual(compileQueueProgram(originalQueueBody).scenario.packages!.map(item => item.label), ['Package A', 'Package B', 'Package C']);
});
