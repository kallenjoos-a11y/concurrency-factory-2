import type { QueueStage } from './queue-presentation.ts';
import type { SimulationSnapshot } from '../simulation/types.ts';

export const emptyQueueStageLabels = ['The problem', 'Your prediction', 'Wait for work', 'Wake and take', 'The discovery'];
export const emptyQueueStageContent: Record<QueueStage, { eyebrow: string; title: string; body: string }> = {
  PROBLEM: { eyebrow: '01 / THE CONSUMER ARRIVES FIRST', title: 'The conveyor is empty.', body: 'This time the consumer gets the first turn. The producer has a package ready, but has not added it yet. What happens when the consumer calls get() with no work waiting?' },
  PREDICTION: { eyebrow: '02 / MAKE A PREDICTION', title: 'What will get() do?', body: 'Will it return an empty item, stop the program with an error, or wait for a package? Choose your prediction, then let the real simulation show you.' },
  FILL: { eyebrow: '03 / LET THE CONSUMER RUN', title: 'No work yet. One thread waits.', body: 'Use Next Step to call get() on the empty queue. Watch the consumer’s state and private item variable. The producer can still run while the consumer waits.' },
  DRAIN: { eyebrow: '04 / WORK MAKES A THREAD READY', title: 'Ready first. Receive on the next turn.', body: 'Let the producer add Package A. The consumer becomes READY, but the package still waits in the queue. On the next turn, the consumer retries the same get() and takes the package.' },
  SUMMARY: { eyebrow: '05 / NAME THE PATTERN', title: 'A thread can wait for work.', body: 'An empty blocking get() paused the consumer, not the whole program. The producer’s put() made it READY. Only a later scheduler turn let the consumer receive the package.' },
};

export const emptyQueuePredictions = [
  { id: 'empty', label: 'Return an empty item' },
  { id: 'error', label: 'Raise an error' },
  { id: 'wait', label: 'Wait for work' },
];

export function emptyQueueExplanation(snapshot: SimulationSnapshot): string {
  if (!snapshot.step) return 'The queue is empty. The consumer will get the first turn.';
  if (snapshot.workers[1].state === 'BLOCKED') return 'Consumer called get() and became BLOCKED. Its item is still unset, and it stays at the same Python line. Producer is READY and can add work.';
  if (snapshot.lastInstruction?.type === 'QUEUE_PUT') return 'Producer added Package A. Consumer changed from BLOCKED to READY. It has not received anything yet: Package A is still on the conveyor, and item is still unset.';
  if (snapshot.lastInstruction?.type === 'QUEUE_GET') return 'The scheduler selected Consumer again. It retried the same get(), took Package A, and stored it in its private item variable.';
  return snapshot.status === 'FINISHED' ? 'Both threads finished. Consumer received one package after waiting for it. Receiving work is still separate from processing it.' : 'Producer finished. Consumer has already received Package A and can finish on its next turn.';
}
