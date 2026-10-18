import type { Worker } from './types.ts';

export interface Scheduler { selectNext(workers: readonly Worker[]): string | null }

/** Consume script entries until one is READY; then fall back to stable round-robin. */
export class DeterministicScheduler implements Scheduler {
  private cursor = 0;
  private lastIndex = -1;
  private readonly script: readonly string[];
  constructor(script: readonly string[] = []) { this.script = [...script]; }
  selectNext(workers: readonly Worker[]): string | null {
    if (!workers.some(worker => worker.state === 'READY')) return null;
    while (this.cursor < this.script.length) {
      const requested = this.script[this.cursor++];
      const index = workers.findIndex(worker => worker.id === requested && worker.state === 'READY');
      if (index >= 0) { this.lastIndex = index; return workers[index].id; }
    }
    for (let offset = 1; offset <= workers.length; offset++) {
      const index = (this.lastIndex + offset) % workers.length;
      if (workers[index].state === 'READY') { this.lastIndex = index; return workers[index].id; }
    }
    return null;
  }
}
