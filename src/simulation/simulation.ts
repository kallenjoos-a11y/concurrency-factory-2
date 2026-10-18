import { DeterministicScheduler } from './scheduler.ts';
import type { Scheduler } from './scheduler.ts';
import { InstructionExecutor } from './instructions.ts';
import type { ExecutionContext } from './instructions.ts';
import { createWorker } from './workers.ts';
import type { EventType, Instruction, LockResource, Package, QueueResource, Scenario, SemaphoreResource, SharedVariable, SimulationEvent, SimulationSnapshot, Worker } from './types.ts';

/** Framework-independent state machine. One call executes one instruction, including a failed lock attempt. */
export class Simulation {
  private readonly workers: Worker[];
  private readonly sharedVariables: SharedVariable[];
  private readonly locks: LockResource[];
  private readonly queues: QueueResource[];
  private readonly semaphores: SemaphoreResource[];
  private readonly packages: Package[];
  private readonly events: SimulationEvent[] = [];
  private readonly scenarioId: string;
  private readonly scheduler: Scheduler;
  private readonly executor: InstructionExecutor;
  private readonly context: ExecutionContext;
  private step = 0;
  private status: SimulationSnapshot['status'] = 'IDLE';
  private activeWorkerId: string | null = null;
  private lastInstruction: Instruction | null = null;

  constructor(scenario: Scenario, scheduler: Scheduler = new DeterministicScheduler(scenario.schedule), executor: InstructionExecutor = new InstructionExecutor()) {
    this.scenarioId = scenario.id;
    this.scheduler = scheduler;
    this.executor = executor;
    this.workers = scenario.workers.map(createWorker);
    this.sharedVariables = scenario.sharedVariables.map(variable => ({ ...variable, lastReadBy: null, lastWrittenBy: null }));
    this.locks = scenario.locks.map(lock => ({ ...lock, owner: null, waitingWorkers: [] }));
    this.queues = (scenario.queues ?? []).map(queue => ({ ...queue, capacity: null, items: [], waitingConsumers: [], unfinishedTasks: 0 }));
    this.semaphores = (scenario.semaphores ?? []).map(resource => {
      if (!Number.isInteger(resource.permits) || resource.permits < 1) throw new Error('Semaphore permits must be a positive integer');
      return { id: resource.id, name: resource.name, maxPermits: resource.permits, availablePermits: resource.permits, holders: [], waitingWorkers: [] };
    });
    this.packages = (scenario.packages ?? []).map(item => ({ ...item, state: 'CREATED', currentOwner: null }));
    for (const list of [this.workers, this.sharedVariables, this.locks, this.queues, this.packages, this.semaphores]) {
      if (new Set(list.map(item => item.id)).size !== list.length) throw new Error('Duplicate entity ID');
    }
    if (!this.workers.length) throw new Error('Simulation requires at least one worker');
    this.context = {
      variable: id => this.variable(id),
      lock: id => this.lock(id),
      semaphore: id => this.semaphore(id),
      queue: id => this.queue(id),
      package: id => this.package(id),
      worker: id => {
        const worker = this.workers.find(item => item.id === id);
        if (!worker) throw new Error(`Unknown worker: ${id}`);
        return worker;
      },
      emit: (type, worker, details) => this.emit(type, worker, details),
    };
    for (const worker of this.workers) for (const instruction of worker.instructions) {
      if ('variable' in instruction) this.variable(instruction.variable);
      if ('lock' in instruction) this.lock(instruction.lock);
      if ('semaphore' in instruction) this.semaphore(instruction.semaphore);
      if ('queue' in instruction) this.queue(instruction.queue);
      if ('packageId' in instruction) this.package(instruction.packageId);
    }
  }

  snapshot(): SimulationSnapshot {
    // Snapshots are detached: consumers cannot mutate engine state or event history.
    return structuredClone({ scenarioId: this.scenarioId, step: this.step, status: this.status, activeWorkerId: this.activeWorkerId, lastInstruction: this.lastInstruction, workers: this.workers, sharedVariables: this.sharedVariables, locks: this.locks, queues: this.queues, packages: this.packages, semaphores: this.semaphores, events: this.events });
  }

  nextStep(): SimulationSnapshot {
    if (this.status === 'FINISHED' || this.status === 'STALLED') return this.snapshot();
    if (this.status === 'IDLE') { this.status = 'ACTIVE'; this.emit('SIMULATION_STARTED'); }
    const id = this.scheduler.selectNext(structuredClone(this.workers));
    const worker = this.workers.find(item => item.id === id);
    if (id === null) { this.status = 'STALLED'; return this.snapshot(); }
    if (!worker || worker.state !== 'READY') throw new Error('Scheduler must select a READY worker');
    const instruction = worker.instructions[worker.instructionPointer];
    this.executor.validate(worker, instruction, this.context);
    this.step++;
    this.activeWorkerId = worker.id;
    this.lastInstruction = instruction;
    worker.sourceLocation = instruction.sourceLocation;
    worker.state = 'RUNNING';
    this.emit('THREAD_RUNNING', worker);
    const completed = this.executor.execute(worker, instruction, this.context);
    if (completed) worker.instructionPointer++;
    if (worker.state === 'RUNNING') { worker.state = 'READY'; this.emit('THREAD_READY', worker); }
    if (this.workers.every(item => item.state === 'FINISHED')) { this.status = 'FINISHED'; this.emit('SIMULATION_FINISHED'); }
    else if (!this.workers.some(item => item.state === 'READY')) this.status = 'STALLED';
    return this.snapshot();
  }

  private semaphore(id: string): SemaphoreResource {
    const resource = this.semaphores.find(item => item.id === id);
    if (!resource) throw new Error(`Unknown semaphore: ${id}`);
    return resource;
  }
  private variable(id: string): SharedVariable {
    const variable = this.sharedVariables.find(item => item.id === id);
    if (!variable) throw new Error(`Unknown shared variable: ${id}`);
    return variable;
  }
  private lock(id: string): LockResource {
    const lock = this.locks.find(item => item.id === id);
    if (!lock) throw new Error(`Unknown lock: ${id}`);
    return lock;
  }
  private emit(type: EventType, worker?: Worker, details: Partial<SimulationEvent> = {}): void {
    const sequence = this.events.length + 1;
    this.events.push(Object.freeze({ ...details, id: `event-${sequence}`, sequence, step: this.step, type,
      ...(worker ? { workerId: worker.id, sourceLocation: Object.freeze({ ...worker.sourceLocation! }) } : {}) }));
  }
  private queue(id: string): QueueResource {
    const queue = this.queues.find(item => item.id === id);
    if (!queue) throw new Error(`Unknown queue: ${id}`);
    return queue;
  }
  private package(id: string): Package {
    const item = this.packages.find(item => item.id === id);
    if (!item) throw new Error(`Unknown package: ${id}`);
    return item;
  }
}
