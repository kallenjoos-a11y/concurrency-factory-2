import { Simulation } from './simulation.ts';
import type { InstructionExecutor } from './instructions.ts';
import type { Scenario } from './types.ts';
import type { Scheduler } from './scheduler.ts';

/** Reset creates a fresh engine and fresh scheduler, never reverses mutations. */
export class SimulationController {
  private simulation: Simulation;
  private readonly definition: Scenario;
  private readonly schedulerFactory?: () => Scheduler;
  private readonly executorFactory?: () => InstructionExecutor;
  constructor(scenario: Scenario, schedulerFactory?: () => Scheduler, executorFactory?: () => InstructionExecutor) {
    this.definition = structuredClone(scenario);
    this.schedulerFactory = schedulerFactory;
    this.executorFactory = executorFactory;
    this.simulation = new Simulation(this.definition, schedulerFactory?.(), executorFactory?.());
  }
  snapshot() { return this.simulation.snapshot(); }
  nextStep() { return this.simulation.nextStep(); }
  reset() {
    this.simulation = new Simulation(this.definition, this.schedulerFactory?.(), this.executorFactory?.());
    return this.snapshot();
  }
}
