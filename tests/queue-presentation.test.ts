import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation/simulation.ts';
import { queueScenario } from '../src/simulation/queue-scenario.ts';
import { describeEvent, packageName, workerActivity } from '../src/lesson/presentation.ts';
import { receivedPackages, queueStepExplanation } from '../src/lesson/queue-presentation.ts';

test('history explanations retain the queue length at each event after the queue has emptied', () => {
  const simulation = new Simulation(queueScenario());
  for (let i = 0; i < 8; i++) simulation.nextStep();
  const state = simulation.snapshot();
  const added = state.events.find(event => event.type === 'QUEUE_ITEM_ADDED')!;
  const removed = state.events.find(event => event.type === 'QUEUE_ITEM_REMOVED')!;
  assert.match(describeEvent(added, state), /Package A.*1 package now waiting/);
  assert.match(describeEvent(removed, state), /Package A.*2 packages still waiting/);
  assert.equal(state.queues[0].items.length, 0);
});

test('worker emphasis and private-item explanations follow the executed worker and package', () => {
  const simulation = new Simulation(queueScenario());
  const first = simulation.nextStep();
  assert.equal(workerActivity(first, 'a'), 'Queued Package A');
  assert.equal(workerActivity(first, 'b'), null);
  assert.match(queueStepExplanation(first), /shared jobs queue/);
  simulation.nextStep(); simulation.nextStep();
  const taking = simulation.nextStep();
  assert.equal(workerActivity(taking, 'b'), 'Took Package A');
  assert.equal(workerActivity(taking, 'a'), null);
  assert.equal(packageName(taking, String(taking.workers[1].localVariables.item)), 'Package A');
  assert.deepEqual(receivedPackages(taking), ['package-a']);
  assert.match(queueStepExplanation(taking), /does not mean.*processed/);
});
