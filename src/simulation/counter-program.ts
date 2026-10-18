import { counterScenario } from './scenarios.ts';

export const originalCounterSettings = { start: 10, a: 1, b: 1 };
export type CounterSettings = typeof originalCounterSettings;
export function compileCounterProgram(settings: CounterSettings, safe: boolean) {
  if (!Number.isInteger(settings.start) || settings.start < 0 || settings.start > 999 || ![settings.a, settings.b].every(value => Number.isInteger(value) && value >= 1 && value <= 20)) throw new Error('Use a starting count from 0–999 and whole-number increases from 1–20.');
  const scenario = counterScenario(safe);
  scenario.sharedVariables[0].value = settings.start;
  const python = safe ? ['import threading', '', `counter = ${settings.start}`, 'counter_lock = threading.Lock()', ''] : [`counter = ${settings.start}`, ''];
  scenario.workers.forEach((worker, index) => {
    const amount = index === 0 ? settings.a : settings.b;
    const definitionLine = python.length + 1;
    python.push(`def thread_${worker.id}():`, '    global counter');
    const lockLine = python.length + 1;
    if (safe) python.push('    with counter_lock:');
    const updateLine = python.length + 1;
    python.push(`${safe ? '        ' : '    '}counter += ${amount}`, '');
    worker.instructions.forEach(instruction => {
      if (instruction.type === 'CALCULATE') instruction.right = amount;
      instruction.sourceLocation.line = instruction.type === 'FINISH' ? definitionLine : instruction.type === 'ACQUIRE_LOCK' || instruction.type === 'RELEASE_LOCK' ? lockLine : updateLine;
    });
  });
  return { scenario, python, expected: settings.start + settings.a + settings.b };
}
