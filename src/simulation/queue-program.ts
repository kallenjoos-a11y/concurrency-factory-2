import type { Instruction, Scenario } from './types.ts';

export const originalQueueBody = ['    jobs.put("Package A")', '    jobs.put("Package B")', '    jobs.put("Package C")'].join('\n');
export const queueEditorLimits = { packages: 12, name: 40, source: 4000 } as const;
export class QueueProgramError extends Error {
  readonly line?: number;
  constructor(message: string, line?: number) { super(message); this.name = 'QueueProgramError'; this.line = line; }
}
export interface QueueProgram { body: string; python: string[]; scenario: Scenario }

/** Translate a small, explicit teaching subset. No user text is evaluated as JavaScript or Python. */
export function compileQueueProgram(body: string, emptyFirst = false): QueueProgram {
  if (body.length > queueEditorLimits.source) throw new QueueProgramError('This exercise supports up to 4,000 characters. Try a shorter producer.');
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const entries: { label: string; line: number }[] = [];
  lines.forEach((source, index) => {
    const line = index + 6;
    const statement = source.trim();
    if (!statement || statement.startsWith('#')) return;
    const call = /^jobs\.put\(\s*((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))\s*\)\s*(?:#.*)?$/.exec(statement);
    if (!call) throw new QueueProgramError('Use jobs.put("a package name") on each line. This exercise supports package names, order, and extra put() lines.', line);
    const literal = call[1];
    let label = '';
    for (let i = 1; i < literal.length - 1; i++) {
      if (literal[i] === '\\') {
        const escaped = literal[++i];
        if (!['\\', '"', "'"].includes(escaped)) throw new QueueProgramError('Use plain names. Only escaped quotes and backslashes are supported.', line);
        label += escaped;
      } else label += literal[i];
    }
    if (!label.trim() || label.length > queueEditorLimits.name || /[\u0000-\u001f\u007f]/.test(label)) throw new QueueProgramError('Give the package a name between 1 and 40 characters, without line breaks.', line);
    entries.push({ label, line });
    if (entries.length > queueEditorLimits.packages) throw new QueueProgramError('This exercise supports up to 12 packages. The queue itself is still unbounded.', line);
  });
  if (!entries.length) throw new QueueProgramError('Add at least one jobs.put("a package name") line.');
  const consumerLine = lines.length + 7;
  const python = ['from queue import Queue', '', 'jobs = Queue()', '', 'def producer():', ...lines.map(source => source.trim() ? `    ${source.trim()}` : ''), '', 'def consumer():', ...entries.map(() => '    item = jobs.get()')];
  const location = (line: number) => ({ file: 'lesson.py', line });
  const packages = entries.map((entry, i) => ({ id: `edited-package-${i + 1}`, label: entry.label, value: entry.label }));
  const producer: Instruction[] = entries.map((entry, i) => ({ type: 'QUEUE_PUT', queue: 'jobs', packageId: packages[i].id, sourceLocation: location(entry.line) }));
  const consumer: Instruction[] = entries.map((_, i) => ({ type: 'QUEUE_GET', queue: 'jobs', storeAs: 'item', sourceLocation: location(consumerLine + i + 1) }));
  producer.push({ type: 'FINISH', sourceLocation: location(5) });
  consumer.push({ type: 'FINISH', sourceLocation: location(consumerLine) });
  return { body, python, scenario: {
    id: emptyFirst ? 'empty-queue-edited' : 'queue-edited', sharedVariables: [], locks: [], queues: [{ id: 'jobs', name: 'jobs' }], packages,
    workers: [{ id: 'a', name: 'Producer', instructions: producer }, { id: 'b', name: 'Consumer', instructions: consumer }],
    schedule: [...(emptyFirst ? ['b'] : []), ...entries.map(() => 'a'), ...entries.map(() => 'b'), 'a', 'b'],
  } };
}
