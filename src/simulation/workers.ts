import type { Worker, WorkerDefinition } from './types.ts';

/** Programs are scenario data; each initialized worker owns its program and locals. */
export function createWorker(definition: WorkerDefinition): Worker {
  if (!definition.instructions.length || definition.instructions.at(-1)?.type !== 'FINISH') {
    throw new Error('Workers require a program ending in FINISH');
  }
  return {
    ...structuredClone(definition), state: 'READY', instructionPointer: 0,
    localVariables: {}, blockedOn: null, heldResources: [], sourceLocation: null,
  };
}
