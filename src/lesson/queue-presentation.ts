import type { SimulationSnapshot } from '../simulation/types.ts';
import { packageName } from './presentation.ts';

export const queueStages = ['PROBLEM', 'PREDICTION', 'FILL', 'DRAIN', 'SUMMARY'] as const;
export type QueueStage = typeof queueStages[number];
export const queueStageLabels = ['The problem', 'Your prediction', 'Let work wait', 'Take the next job', 'The discovery'];
export const queueStageContent: Record<QueueStage, { eyebrow: string; title: string; body: string }> = {
  PROBLEM: { eyebrow: '01 / WORK KEEPS ARRIVING', title: 'Work arrives before it can be taken.', body: 'Packages A, B, and C are ready before the consumer takes its turn. The producer needs somewhere to leave them until that thread runs. A shared Queue gives the work a place to wait.' },
  PREDICTION: { eyebrow: '02 / MAKE A PREDICTION', title: 'Which package will come out first?', body: 'The producer will put Package A into the queue, then B, then C. When the consumer is ready to take work, which package do you think it will receive first?' },
  FILL: { eyebrow: '03 / LET THE PRODUCER RUN', title: 'The conveyor holds the waiting work.', body: 'Use Next Step to add one package at a time. The producer calls put(), and the package stays in the shared queue until a consumer takes it. The queue can grow as work arrives.' },
  DRAIN: { eyebrow: '04 / NOW IT’S THE CONSUMER’S TURN', title: 'Take one job. Leave the rest waiting.', body: 'Both threads can be READY, but the scheduler gives one a turn at a time. Each get() removes one package and gives it to the consumer. Watch NEXT OUT, its private item variable, and the work left waiting.' },
  SUMMARY: { eyebrow: '05 / NAME THE PATTERN', title: 'First in. First out.', body: 'A arrived first, so A was taken first. Then B, then C. This order is called FIFO: first in, first out. The producer adds work; the consumer takes it when ready. A Queue lets their turns happen at different times.' },
};

export function receivedPackages(snapshot: SimulationSnapshot): string[] {
  return snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').map(event => event.packageId!);
}
export function queueStepExplanation(snapshot: SimulationSnapshot): string {
  if (!snapshot.step) return 'The queue starts empty. The producer has three packages ready to add.';
  const worker = snapshot.workers.find(worker => worker.id === snapshot.activeWorkerId);
  const instruction = snapshot.lastInstruction;
  if (instruction?.type === 'QUEUE_PUT') return `${worker?.name} added ${packageName(snapshot, instruction.packageId)}. It is waiting in the shared jobs queue, not in the consumer’s private item variable.`;
  if (instruction?.type === 'QUEUE_GET') {
    if (worker?.state === 'BLOCKED') return 'The consumer is waiting because the queue is empty.';
    return `${worker?.name} took ${packageName(snapshot, String(worker?.localVariables.item))}. That package now belongs to this thread. Taking it out does not mean the work has been processed yet.`;
  }
  return snapshot.status === 'FINISHED' ? 'Both threads finished. All three packages were received in the order they arrived.' : `${worker?.name} finished its part of this demonstration.`;
}
