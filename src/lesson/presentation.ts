import type { SimulationEvent, SimulationSnapshot } from '../simulation/types.ts';

export type LessonStage = 'PROBLEM' | 'PREDICTION' | 'UNSAFE_RUN' | 'RACE_EXPLANATION' | 'LOCK_INTRODUCTION' | 'SAFE_RUN' | 'COMPARISON';
export const stages: LessonStage[] = ['PROBLEM', 'PREDICTION', 'UNSAFE_RUN', 'RACE_EXPLANATION', 'LOCK_INTRODUCTION', 'SAFE_RUN', 'COMPARISON'];
export const stageLabels = ['The problem', 'Your prediction', 'Watch it happen', 'The discovery', 'One shared key', 'Try with a lock', 'What changed'];
export const stageContent: Record<LessonStage, { eyebrow: string; title: string; body: string }> = {
  PROBLEM: { eyebrow: '01 / A SMALL FACTORY PROBLEM', title: 'Two packages. Two threads. One counter.', body: 'Our factory has finished 10 packages. Two workers each finish one more, and both update the same counter. Let’s see what happens when they work at almost the same time.' },
  PREDICTION: { eyebrow: '02 / MAKE A PREDICTION', title: 'What will the counter say?', body: 'The counter starts at 10. Thread A adds 1. Thread B adds 1. Pick the value you think this program will produce. We’ll compare your prediction after running it.' },
  UNSAFE_RUN: { eyebrow: '03 / FOLLOW THE THREADS', title: 'A little overlap changes everything.', body: 'Advance one small operation at a time. Watch each thread’s private copy of the number, then watch what it writes to the shared whiteboard.' },
  RACE_EXPLANATION: { eyebrow: '04 / THE DISCOVERY', title: 'One update disappeared.', body: 'Both threads read 10 before either wrote back. Each calculated 11, and each wrote 11. The second write replaced the first instead of adding to it. This lost update is a race condition: the result depends on how the operations interleave.' },
  LOCK_INTRODUCTION: { eyebrow: '05 / INTRODUCE A LOCK', title: 'One key to the whiteboard.', body: 'A Lock lets only one thread enter the critical section at a time. Here, that section includes reading, calculating, and writing the counter. The other thread waits until the key is released.' },
  SAFE_RUN: { eyebrow: '06 / FOLLOW THE KEY', title: 'Waiting makes the update safe.', body: 'Thread A takes the lock first. Thread B will try to take it too. Watch B become BLOCKED, then READY when A releases it. Becoming READY does not give B the lock; the scheduler must select it again.' },
  COMPARISON: { eyebrow: '07 / WHAT CHANGED', title: 'Same work. Both updates counted.', body: 'The lock kept each read–calculate–write sequence together. Thread B read the value that A had already updated, so both completed packages were counted.' },
};

export function describeEvent(event: SimulationEvent, snapshot: SimulationSnapshot): string {
  const name = snapshot.workers.find(worker => worker.id === event.workerId)?.name ?? 'Thread';
  const owner = snapshot.workers.find(worker => worker.id === event.ownerId)?.name ?? 'another thread';
  switch (event.type) {
    case 'SIMULATION_STARTED': if (snapshot.packages.length && !snapshot.queues.length) return 'The workers are ready to process their packages.'; return snapshot.queues.length ? 'The threads start with an empty jobs queue.' : `The program starts with counter = ${snapshot.events.find(item => item.type === 'SHARED_VALUE_READ')?.value ?? snapshot.sharedVariables[0].value}.`;
    case 'SIMULATION_FINISHED': {
      const count = snapshot.events.filter(event => event.type === 'QUEUE_ITEM_REMOVED').length;
      return snapshot.packages.length && !snapshot.queues.length ? `All workers finished processing ${snapshot.packages.filter(item => item.state === 'COMPLETED').length} packages.` : snapshot.queues.length ? `Both threads finished. The consumer received ${count} package${count === 1 ? '' : 's'}.` : `Both threads finished. The counter is ${snapshot.sharedVariables[0].value}.`;
    }
    case 'PROCESS_STARTED': return `${name} starts processing ${packageName(snapshot, event.packageId)}.`;
    case 'PROCESS_COMPLETED': return `${name} finishes processing ${packageName(snapshot, event.packageId)}.`;
    case 'SEMAPHORE_ACQUIRED': return `${name} acquired one machine permit. ${event.value} permits remain available.`;
    case 'SEMAPHORE_RELEASED': return `${name} released its machine permit. ${event.value} permits are available.`;
    case 'THREAD_RUNNING': return `${name} is selected to run.`;
    case 'THREAD_READY': return `${name} is READY for another turn.`;
    case 'THREAD_FINISHED': return `${name} has finished its work.`;
    case 'THREAD_BLOCKED': return event.reason === 'NO_PERMITS' ? `${name} is BLOCKED because no machine permits are available.` : event.reason === 'QUEUE_EMPTY' ? `${name} is BLOCKED because ${event.resourceId} is empty. A producer must add work before it can continue.` : `${name} is BLOCKED, waiting for ${event.resourceId}. ${owner} holds the key.`;
    case 'THREAD_UNBLOCKED': return snapshot.semaphores.some(resource => resource.id === event.resourceId) ? `${name} is READY because a machine permit is available. It has not acquired it yet.` : snapshot.queues.some(queue => queue.id === event.resourceId) ? `${name} is READY again because work is available in ${event.resourceId}. It must be scheduled to take the item.` : `${name} is READY again because ${event.resourceId} is available. It has not acquired the lock yet.`;
    case 'LOCK_REQUESTED': return `${name} requests ${event.resourceId}.`;
    case 'LOCK_ACQUIRED': return `${name} acquired ${event.resourceId}. It holds the only key.`;
    case 'LOCK_RELEASED': return `${name} released ${event.resourceId}. The key is available.`;
    case 'SHARED_VALUE_READ': return `${name} reads ${event.value} from the shared counter into its own local_counter.`;
    case 'SHARED_VALUE_WRITTEN': return `${name} writes ${event.value} to the shared counter (${event.previousValue} → ${event.value}).`;
    case 'LOCAL_VALUE_CHANGED': return `${name} changes its private ${event.local} to ${event.value}.`;
    case 'CALCULATION_COMPLETED': return `${name} adds ${(snapshot.workers.find(worker => worker.id === event.workerId)?.instructions.find(instruction => instruction.type === 'CALCULATE') as { right?: number } | undefined)?.right ?? 1} to its private local_counter. The result is ${event.value}.`;
    case 'QUEUE_PUT_REQUESTED': return `${name} requests to add ${packageName(snapshot, event.packageId)} to ${event.resourceId}.`;
    case 'QUEUE_GET_REQUESTED': return `${name} requests the next item from ${event.resourceId}.`;
    case 'QUEUE_ITEM_ADDED': return `${name} puts ${packageName(snapshot, event.packageId)} into ${event.resourceId}. ${event.queueLength} package${event.queueLength === 1 ? '' : 's'} now waiting.`;
    case 'QUEUE_ITEM_REMOVED': return `${name} takes ${packageName(snapshot, event.packageId)} from the front of ${event.resourceId}. ${event.queueLength} package${event.queueLength === 1 ? '' : 's'} still waiting.`;
  }
}
export function visibleEvents(snapshot: SimulationSnapshot): SimulationEvent[] {
  return snapshot.events.filter(event => !['THREAD_RUNNING', 'THREAD_READY', 'LOCAL_VALUE_CHANGED', 'LOCK_REQUESTED', 'QUEUE_PUT_REQUESTED', 'QUEUE_GET_REQUESTED', 'SIMULATION_STARTED'].includes(event.type));
}
export function currentExplanation(snapshot: SimulationSnapshot): string {
  const current = visibleEvents(snapshot).filter(event => event.step === snapshot.step);
  return current.map(event => describeEvent(event, snapshot)).join(' ') || 'The threads are ready. Take the first step to choose a thread and execute one operation.';
}
export function operationLabel(type?: string): string {
  return ({ BEGIN_PROCESS: 'Start processing', END_PROCESS: 'Finish processing', ACQUIRE_SEMAPHORE: 'Request a machine permit', RELEASE_SEMAPHORE: 'Release a machine permit', READ_SHARED: 'Read the counter', CALCULATE: 'Add locally', WRITE_SHARED: 'Write to the counter', ACQUIRE_LOCK: 'Request the lock', RELEASE_LOCK: 'Release the lock', QUEUE_PUT: 'Put work in the queue', QUEUE_GET: 'Take work from the queue', FINISH: 'Finish the thread' } as Record<string, string>)[type ?? ''] ?? 'Ready to start';
}

/** Describe the operation just executed, rather than implying a paused thread is still running. */
export function workerActivity(snapshot: SimulationSnapshot, workerId: string): string | null {
  if (snapshot.activeWorkerId !== workerId) return null;
  const worker = snapshot.workers.find(item => item.id === workerId);
  const value = worker?.localVariables.local_counter;
  switch (snapshot.lastInstruction?.type) {
    case 'READ_SHARED': return `Read ${value}`;
    case 'CALCULATE': return `Calculated ${value}`;
    case 'WRITE_SHARED': return `Wrote ${value}`;
    case 'ACQUIRE_LOCK': return worker?.state === 'BLOCKED' ? 'Waiting for key' : 'Acquired key';
    case 'RELEASE_LOCK': return 'Released key';
    case 'FINISH': return 'Finished';
    case 'QUEUE_PUT': return `Queued ${packageName(snapshot, snapshot.lastInstruction.packageId)}`;
    case 'QUEUE_GET': {
      if (worker?.state === 'BLOCKED') return 'Waiting for work';
      const event = snapshot.events.find(event => event.step === snapshot.step && event.workerId === workerId && event.type === 'QUEUE_ITEM_REMOVED');
      return `Took ${packageName(snapshot, event?.packageId)}`;
    }
    default: return null;
  }
}

export function packageName(snapshot: SimulationSnapshot, id?: string): string {
  return snapshot.packages.find(item => item.id === id)?.label ?? '—';
}
