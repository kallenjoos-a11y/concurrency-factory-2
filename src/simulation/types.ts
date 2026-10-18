export type WorkerState = 'READY' | 'RUNNING' | 'BLOCKED' | 'FINISHED';
export interface SourceLocation { file: string; line: number }
export type Operand = number | { local: string };
export type LocalValue = number | string;
type Located = { sourceLocation: SourceLocation };
export type Instruction = Located & (
  | { type: 'READ_SHARED'; variable: string; storeAs: string }
  | { type: 'CALCULATE'; operation: 'ADD'; left: Operand; right: Operand; storeAs: string }
  | { type: 'WRITE_SHARED'; variable: string; value: Operand }
  | { type: 'ACQUIRE_LOCK'; lock: string }
  | { type: 'RELEASE_LOCK'; lock: string }
  | { type: 'QUEUE_PUT'; queue: string; packageId: string }
  | { type: 'QUEUE_GET'; queue: string; storeAs: string }
  | { type: 'ACQUIRE_SEMAPHORE'; semaphore: string }
  | { type: 'RELEASE_SEMAPHORE'; semaphore: string }
  | { type: 'BEGIN_PROCESS'; packageId: string }
  | { type: 'END_PROCESS'; packageId: string }
  | { type: 'FINISH' }
);
export interface WorkerDefinition { id: string; name: string; instructions: Instruction[] }
export interface Worker extends WorkerDefinition {
  state: WorkerState;
  instructionPointer: number; localVariables: Record<string, LocalValue>;
  blockedOn: string | null; heldResources: string[]; sourceLocation: SourceLocation | null;
}
export interface SharedVariable {
  id: string; name: string; value: number; lastReadBy: string | null; lastWrittenBy: string | null;
}
export interface LockResource { id: string; name: string; owner: string | null; waitingWorkers: string[] }
export interface SemaphoreResource { id: string; name: string; maxPermits: number; availablePermits: number; holders: string[]; waitingWorkers: string[] }
export interface Package {
  id: string; label: string; value: LocalValue; state: 'CREATED' | 'QUEUED' | 'ASSIGNED' | 'PROCESSING' | 'COMPLETED'; currentOwner: string | null;
}
/** This slice uses an unbounded FIFO queue. Bounded capacity and processing come later. */
export interface QueueResource {
  id: string; name: string; capacity: null; items: string[]; waitingConsumers: string[]; unfinishedTasks: number;
}
export type EventType =
  | 'SIMULATION_STARTED' | 'SIMULATION_FINISHED'
  | 'THREAD_RUNNING' | 'THREAD_READY' | 'THREAD_BLOCKED' | 'THREAD_UNBLOCKED' | 'THREAD_FINISHED'
  | 'LOCK_REQUESTED' | 'LOCK_ACQUIRED' | 'LOCK_RELEASED'
  | 'SHARED_VALUE_READ' | 'SHARED_VALUE_WRITTEN' | 'LOCAL_VALUE_CHANGED' | 'CALCULATION_COMPLETED'
  | 'SEMAPHORE_ACQUIRED' | 'SEMAPHORE_RELEASED' | 'PROCESS_STARTED' | 'PROCESS_COMPLETED'
  | 'QUEUE_PUT_REQUESTED' | 'QUEUE_GET_REQUESTED' | 'QUEUE_ITEM_ADDED' | 'QUEUE_ITEM_REMOVED';
export interface SimulationEvent {
  readonly id: string; readonly sequence: number; readonly step: number; readonly type: EventType;
  readonly workerId?: string; readonly resourceId?: string; readonly sourceLocation?: Readonly<SourceLocation>;
  readonly value?: LocalValue; readonly previousValue?: LocalValue; readonly local?: string;
  readonly packageId?: string; readonly queueLength?: number;
  readonly ownerId?: string; readonly reason?: 'LOCK_UNAVAILABLE' | 'QUEUE_EMPTY' | 'NO_PERMITS';
}
export interface Scenario {
  id: string; workers: WorkerDefinition[];
  sharedVariables: { id: string; name: string; value: number }[];
  locks: { id: string; name: string }[]; schedule: string[];
  semaphores?: { id: string; name: string; permits: number }[];
  queues?: { id: string; name: string }[];
  packages?: { id: string; label: string; value: LocalValue }[];
}
export interface SimulationSnapshot {
  scenarioId: string; step: number; status: 'IDLE' | 'ACTIVE' | 'FINISHED' | 'STALLED';
  activeWorkerId: string | null; lastInstruction: Instruction | null;
  workers: Worker[]; sharedVariables: SharedVariable[]; locks: LockResource[];
  queues: QueueResource[]; packages: Package[];
  semaphores: SemaphoreResource[];
  events: SimulationEvent[];
}
