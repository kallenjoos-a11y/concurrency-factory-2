import type { Instruction, Scenario } from './types.ts';

export const queuePython = [
  'from queue import Queue', '', 'jobs = Queue()', '', 'def producer():',
  '    jobs.put("Package A")', '    jobs.put("Package B")', '    jobs.put("Package C")', '',
  'def consumer():', '    item = jobs.get()', '    item = jobs.get()', '    item = jobs.get()',
];

export function queueScenario(): Scenario {
  const location = (line: number) => ({ file: 'lesson.py', line });
  const packages = ['A', 'B', 'C'].map(letter => ({ id: `package-${letter.toLowerCase()}`, label: `Package ${letter}`, value: `Package ${letter}` }));
  const producer: Instruction[] = packages.map((item, i) => ({ type: 'QUEUE_PUT', queue: 'jobs', packageId: item.id, sourceLocation: location(6 + i) }));
  const consumer: Instruction[] = packages.map((_, i) => ({ type: 'QUEUE_GET', queue: 'jobs', storeAs: 'item', sourceLocation: location(11 + i) }));
  producer.push({ type: 'FINISH', sourceLocation: location(5) });
  consumer.push({ type: 'FINISH', sourceLocation: location(10) });
  return {
    id: 'queue-fifo', sharedVariables: [], locks: [], queues: [{ id: 'jobs', name: 'jobs' }], packages,
    workers: [{ id: 'a', name: 'Producer', instructions: producer }, { id: 'b', name: 'Consumer', instructions: consumer }],
    schedule: ['a', 'a', 'a', 'b', 'b', 'b', 'a', 'b'],
  };
}
