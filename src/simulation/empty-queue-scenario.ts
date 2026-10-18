import type { Scenario } from './types.ts';

export const emptyQueuePython = [
  'from queue import Queue', '', 'jobs = Queue()', '',
  'def producer():', '    jobs.put("Package A")', '',
  'def consumer():', '    item = jobs.get()',
];

/** The first GET waits at its current instruction until PUT makes work available. */
export function emptyQueueScenario(): Scenario {
  const location = (line: number) => ({ file: 'lesson.py', line });
  return {
    id: 'queue-empty-wait', sharedVariables: [], locks: [],
    queues: [{ id: 'jobs', name: 'jobs' }],
    packages: [{ id: 'package-a', label: 'Package A', value: 'Package A' }],
    workers: [
      { id: 'a', name: 'Producer', instructions: [
        { type: 'QUEUE_PUT', queue: 'jobs', packageId: 'package-a', sourceLocation: location(6) },
        { type: 'FINISH', sourceLocation: location(5) },
      ] },
      { id: 'b', name: 'Consumer', instructions: [
        { type: 'QUEUE_GET', queue: 'jobs', storeAs: 'item', sourceLocation: location(9) },
        { type: 'FINISH', sourceLocation: location(8) },
      ] },
    ],
    schedule: ['b', 'a', 'b', 'a', 'b'],
  };
}
