import type { EventType, Instruction, LocalValue, LockResource, Operand, Package, QueueResource, SemaphoreResource, SharedVariable, SimulationEvent, Worker } from './types.ts';

type EventDetails = Pick<SimulationEvent, 'resourceId' | 'value' | 'previousValue' | 'local' | 'ownerId' | 'reason' | 'packageId' | 'queueLength'>;

/** Operations receive domain resources and an event sink, without scheduler or UI access. */
export interface ExecutionContext {
  variable(id: string): SharedVariable;
  lock(id: string): LockResource;
  semaphore(id: string): SemaphoreResource;
  queue(id: string): QueueResource;
  package(id: string): Package;
  worker(id: string): Worker;
  emit(type: EventType, worker?: Worker, details?: EventDetails): void;
}

export interface InstructionHandler<I extends Instruction = Instruction> {
  validate?(worker: Worker, instruction: I, context: ExecutionContext): void;
  /** false means the operation is blocked and must be retried at the same instruction pointer. */
  execute(worker: Worker, instruction: I, context: ExecutionContext): boolean;
}
export type InstructionHandlers = {
  readonly [T in Instruction['type']]: InstructionHandler<Extract<Instruction, { type: T }>>;
};

function resolve(worker: Worker, operand: Operand): number {
  const value = typeof operand === 'number' ? operand : worker.localVariables[operand.local];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Operand must be a defined finite number');
  return value;
}
function setLocal(worker: Worker, local: string, value: LocalValue, context: ExecutionContext): void {
  const previousValue = worker.localVariables[local];
  worker.localVariables[local] = value;
  context.emit('LOCAL_VALUE_CHANGED', worker, { local, value, previousValue });
}

/** Every supported instruction has a typed handler. New instruction types must supply one. */
export const defaultInstructionHandlers: InstructionHandlers = {
  ACQUIRE_SEMAPHORE: {
    validate(worker, instruction, context) { if (context.semaphore(instruction.semaphore).holders.includes(worker.id)) throw new Error('This lesson permits one permit per worker'); },
    execute(worker, instruction, context) {
      const resource = context.semaphore(instruction.semaphore);
      if (!resource.availablePermits) {
        worker.state = 'BLOCKED'; worker.blockedOn = resource.id;
        if (!resource.waitingWorkers.includes(worker.id)) resource.waitingWorkers.push(worker.id);
        context.emit('THREAD_BLOCKED', worker, { resourceId: resource.id, reason: 'NO_PERMITS' }); return false;
      }
      resource.availablePermits--; resource.holders.push(worker.id); worker.heldResources.push(resource.id); worker.blockedOn = null;
      resource.waitingWorkers = resource.waitingWorkers.filter(id => id !== worker.id);
      context.emit('SEMAPHORE_ACQUIRED', worker, { resourceId: resource.id, value: resource.availablePermits }); return true;
    },
  },
  RELEASE_SEMAPHORE: {
    validate(worker, instruction, context) { if (!context.semaphore(instruction.semaphore).holders.includes(worker.id)) throw new Error('Worker must hold a permit before releasing'); },
    execute(worker, instruction, context) {
      const resource = context.semaphore(instruction.semaphore);
      resource.holders = resource.holders.filter(id => id !== worker.id); resource.availablePermits++;
      worker.heldResources = worker.heldResources.filter(id => id !== resource.id);
      context.emit('SEMAPHORE_RELEASED', worker, { resourceId: resource.id, value: resource.availablePermits });
      const id = resource.waitingWorkers.shift();
      if (id !== undefined) { const waiting = context.worker(id); waiting.state = 'READY'; waiting.blockedOn = null; context.emit('THREAD_UNBLOCKED', waiting, { resourceId: resource.id }); context.emit('THREAD_READY', waiting); }
      return true;
    },
  },
  BEGIN_PROCESS: {
    validate(worker, instruction, context) { const item = context.package(instruction.packageId); if (!(item.state === 'CREATED' || item.state === 'ASSIGNED' && item.currentOwner === worker.id)) throw new Error('Package must be new or assigned to this worker'); if (worker.localVariables.processing) throw new Error('Worker already processing a package'); },
    execute(worker, instruction, context) { const item = context.package(instruction.packageId); item.state = 'PROCESSING'; item.currentOwner = worker.id; worker.localVariables.processing = item.id; context.emit('PROCESS_STARTED', worker, { packageId: item.id }); return true; },
  },
  END_PROCESS: {
    validate(worker, instruction, context) { const item = context.package(instruction.packageId); if (item.state !== 'PROCESSING' || item.currentOwner !== worker.id || worker.localVariables.processing !== item.id) throw new Error('Worker must be processing this package'); },
    execute(worker, instruction, context) { const item = context.package(instruction.packageId); item.state = 'COMPLETED'; delete worker.localVariables.processing; context.emit('PROCESS_COMPLETED', worker, { packageId: item.id }); return true; },
  },
  READ_SHARED: {
    validate(_worker, instruction, context) { context.variable(instruction.variable); },
    execute(worker, instruction, context) {
      const variable = context.variable(instruction.variable);
      variable.lastReadBy = worker.id;
      context.emit('SHARED_VALUE_READ', worker, { resourceId: variable.id, value: variable.value });
      setLocal(worker, instruction.storeAs, variable.value, context);
      return true;
    },
  },
  CALCULATE: {
    validate(worker, instruction) {
      const sum = resolve(worker, instruction.left) + resolve(worker, instruction.right);
      if (!Number.isFinite(sum)) throw new Error('Calculation overflow');
    },
    execute(worker, instruction, context) {
      const value = resolve(worker, instruction.left) + resolve(worker, instruction.right);
      setLocal(worker, instruction.storeAs, value, context);
      context.emit('CALCULATION_COMPLETED', worker, { local: instruction.storeAs, value });
      return true;
    },
  },
  WRITE_SHARED: {
    validate(worker, instruction, context) {
      context.variable(instruction.variable);
      resolve(worker, instruction.value);
    },
    execute(worker, instruction, context) {
      const variable = context.variable(instruction.variable);
      const previousValue = variable.value;
      variable.value = resolve(worker, instruction.value);
      variable.lastWrittenBy = worker.id;
      context.emit('SHARED_VALUE_WRITTEN', worker, { resourceId: variable.id, previousValue, value: variable.value });
      return true;
    },
  },
  ACQUIRE_LOCK: {
    validate(_worker, instruction, context) { context.lock(instruction.lock); },
    execute(worker, instruction, context) {
      const lock = context.lock(instruction.lock);
      context.emit('LOCK_REQUESTED', worker, { resourceId: lock.id });
      if (lock.owner !== null) {
        worker.state = 'BLOCKED'; worker.blockedOn = lock.id;
        if (!lock.waitingWorkers.includes(worker.id)) lock.waitingWorkers.push(worker.id);
        context.emit('THREAD_BLOCKED', worker, { resourceId: lock.id, ownerId: lock.owner, reason: 'LOCK_UNAVAILABLE' });
        return false;
      }
      lock.owner = worker.id; worker.heldResources.push(lock.id); worker.blockedOn = null;
      lock.waitingWorkers = lock.waitingWorkers.filter(id => id !== worker.id);
      context.emit('LOCK_ACQUIRED', worker, { resourceId: lock.id });
      return true;
    },
  },
  RELEASE_LOCK: {
    validate(worker, instruction, context) {
      if (context.lock(instruction.lock).owner !== worker.id) throw new Error('Only the owner may release a lock');
    },
    execute(worker, instruction, context) {
      const lock = context.lock(instruction.lock);
      lock.owner = null; worker.heldResources = worker.heldResources.filter(id => id !== lock.id);
      context.emit('LOCK_RELEASED', worker, { resourceId: lock.id });
      // Wake one FIFO waiter. Availability makes it READY; scheduling lets it acquire.
      const waitingId = lock.waitingWorkers.shift();
      if (waitingId !== undefined) {
        const waiting = context.worker(waitingId);
        waiting.state = 'READY'; waiting.blockedOn = null;
        context.emit('THREAD_UNBLOCKED', waiting, { resourceId: lock.id });
        context.emit('THREAD_READY', waiting);
      }
      return true;
    },
  },
  FINISH: {
    validate(worker) {
      if (worker.localVariables.processing) throw new Error('Worker must complete its package before FINISH');
      if (worker.heldResources.length) throw new Error('Worker must release its resources before FINISH');
    },
    execute(worker, _instruction, context) {
      worker.state = 'FINISHED'; context.emit('THREAD_FINISHED', worker); return true;
    },
  },
  QUEUE_PUT: {
    validate(_worker, instruction, context) {
      context.queue(instruction.queue);
      if (context.package(instruction.packageId).state !== 'CREATED') throw new Error('Only a new package may be queued in this slice');
    },
    execute(worker, instruction, context) {
      const queue = context.queue(instruction.queue);
      const item = context.package(instruction.packageId);
      context.emit('QUEUE_PUT_REQUESTED', worker, { resourceId: queue.id, packageId: item.id });
      queue.items.push(item.id); queue.unfinishedTasks++;
      item.state = 'QUEUED'; item.currentOwner = queue.id;
      context.emit('QUEUE_ITEM_ADDED', worker, { resourceId: queue.id, packageId: item.id, queueLength: queue.items.length });
      const waitingId = queue.waitingConsumers.shift();
      if (waitingId !== undefined) {
        const waiting = context.worker(waitingId);
        waiting.state = 'READY'; waiting.blockedOn = null;
        context.emit('THREAD_UNBLOCKED', waiting, { resourceId: queue.id });
        context.emit('THREAD_READY', waiting);
      }
      return true;
    },
  },
  QUEUE_GET: {
    validate(_worker, instruction, context) { context.queue(instruction.queue); },
    execute(worker, instruction, context) {
      const queue = context.queue(instruction.queue);
      context.emit('QUEUE_GET_REQUESTED', worker, { resourceId: queue.id });
      if (!queue.items.length) {
        worker.state = 'BLOCKED'; worker.blockedOn = queue.id;
        if (!queue.waitingConsumers.includes(worker.id)) queue.waitingConsumers.push(worker.id);
        context.emit('THREAD_BLOCKED', worker, { resourceId: queue.id, reason: 'QUEUE_EMPTY' });
        return false;
      }
      const id = queue.items.shift()!;
      const item = context.package(id);
      item.state = 'ASSIGNED'; item.currentOwner = worker.id;
      worker.blockedOn = null;
      queue.waitingConsumers = queue.waitingConsumers.filter(id => id !== worker.id);
      setLocal(worker, instruction.storeAs, item.id, context);
      context.emit('QUEUE_ITEM_REMOVED', worker, { resourceId: queue.id, packageId: item.id, queueLength: queue.items.length, local: instruction.storeAs });
      return true;
    },
  },
};

export class InstructionExecutor {
  private readonly handlers: InstructionHandlers;
  constructor(handlers: InstructionHandlers = defaultInstructionHandlers) {
    // Keep a per-executor registry so callers cannot replace handlers during a run.
    this.handlers = Object.freeze(Object.fromEntries(Object.entries(handlers).map(([type, handler]) => [type, Object.freeze({ ...handler })]))) as InstructionHandlers;
  }
  validate(worker: Worker, instruction: Instruction, context: ExecutionContext): void {
    this.handler(instruction).validate?.(worker, instruction, context);
  }
  execute(worker: Worker, instruction: Instruction, context: ExecutionContext): boolean {
    return this.handler(instruction).execute(worker, instruction, context);
  }
  private handler(instruction: Instruction): InstructionHandler {
    // Dispatch preserves the discriminator/handler relationship checked by InstructionHandlers.
    const handler = this.handlers[instruction.type] as InstructionHandler;
    if (!handler) throw new Error(`Unsupported instruction: ${instruction.type}`);
    return handler;
  }
}
