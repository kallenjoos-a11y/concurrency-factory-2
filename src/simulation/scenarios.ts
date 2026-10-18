import type { Instruction, Scenario } from './types.ts';

export const unsafePython = ['counter = 10', '', 'def finish_package():', '    global counter', '    counter += 1'];
export const safePython = ['import threading', '', 'counter = 10', 'counter_lock = threading.Lock()', '', 'def finish_package():', '    global counter', '    with counter_lock:', '        counter += 1'];

export function counterScenario(safe: boolean): Scenario {
  const location = (line: number) => ({ file: 'lesson.py', line });
  const updateLine = safe ? 9 : 5;
  const instructions: Instruction[] = [
    ...(safe ? [{ type: 'ACQUIRE_LOCK' as const, lock: 'counter_lock', sourceLocation: location(8) }] : []),
    { type: 'READ_SHARED', variable: 'counter', storeAs: 'local_counter', sourceLocation: location(updateLine) },
    { type: 'CALCULATE', operation: 'ADD', left: { local: 'local_counter' }, right: 1, storeAs: 'local_counter', sourceLocation: location(updateLine) },
    { type: 'WRITE_SHARED', variable: 'counter', value: { local: 'local_counter' }, sourceLocation: location(updateLine) },
    ...(safe ? [{ type: 'RELEASE_LOCK' as const, lock: 'counter_lock', sourceLocation: location(8) }] : []),
    { type: 'FINISH', sourceLocation: location(safe ? 6 : 3) },
  ];
  return {
    id: safe ? 'counter-safe' : 'counter-unsafe',
    workers: ['a', 'b'].map(id => ({ id, name: `Thread ${id.toUpperCase()}`, instructions: structuredClone(instructions) })),
    sharedVariables: [{ id: 'counter', name: 'counter', value: 10 }],
    locks: safe ? [{ id: 'counter_lock', name: 'counter_lock' }] : [],
    schedule: safe ? ['a', 'b', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b', 'b', 'a', 'b'] : ['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'],
  };
}
