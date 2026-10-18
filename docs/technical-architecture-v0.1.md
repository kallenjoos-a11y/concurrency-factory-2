# Concurrency Factory
## Technical Architecture Specification v0.1

**Status:** Pre-development architecture specification  
**Companion Document:** Product Specification v0.2  
**Architecture Goal:** Define the technical foundation required to implement Learn, Playground, and eventually Code Lab using one deterministic, inspectable concurrency simulation engine.

---

# 1. Purpose

This document defines the initial technical architecture for Concurrency Factory.

The architecture must support an educational concurrency simulator capable of:

- representing Python threads as simulated workers,
- representing synchronization primitives,
- modeling blocking and unblocking,
- controlling thread scheduling,
- representing simulated time,
- generating inspectable execution events,
- driving synchronized visualizations,
- supporting deterministic lesson scenarios,
- supporting variable scheduling,
- generating Python from Playground scenarios,
- and eventually interpreting a constrained subset of Python.

The architecture should prioritize:

1. Correct conceptual concurrency behavior.
2. Deterministic reproducibility when requested.
3. Complete inspectability.
4. Separation of simulation and presentation.
5. Extensibility.
6. Testability.
7. Educational usefulness.

---

# 2. Fundamental Architecture Principle

The **simulation engine is the source of truth**.

Neither Python source nor factory animation should directly control execution.

Conceptually:

```text
                    INPUT LAYER

       Learn        Playground        Code Lab
         │              │                │
         │              │           Python Parser
         │              │                │
         └──────────────┼────────────────┘
                        ↓
                PROGRAM / INSTRUCTIONS
                        ↓
                 SIMULATION ENGINE
                        │
               ┌────────┼────────┐
               │        │        │
            State    Scheduler   Time
               │        │        │
               └────────┼────────┘
                        ↓
                      EVENTS
                        ↓
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
     Factory         Inspector        Timeline
        ↓
   Animation

                 Additional Consumers
                        ↓
                 Code Highlighting
                 Lesson Controller
                 Debugging Tools
```

All visible behavior must ultimately derive from simulation state and simulation events.

---

# 3. Architectural Layers

The application should be divided conceptually into five layers.

## Layer 1 — User Experience

Responsible for:

- Learn
- Playground
- Code Lab
- Navigation
- Controls
- Lesson presentation
- Predictions
- Inspectors
- Timeline

This layer does not implement concurrency rules.

---

## Layer 2 — Scenario / Program Construction

Responsible for translating user intent into a simulation program.

Sources include:

```text
Learn Scenario
      ↓
Instruction Program

Playground Configuration
      ↓
Instruction Program

Python
      ↓
Parser / Compiler
      ↓
Instruction Program
```

All three modes converge here.

---

## Layer 3 — Simulation Engine

Responsible for:

- workers,
- resources,
- instructions,
- synchronization,
- blocking,
- scheduling,
- simulated time,
- state transitions,
- program execution.

This is the heart of the application.

---

## Layer 4 — Event System

Responsible for describing meaningful simulation changes.

Examples:

```text
THREAD_BLOCKED
QUEUE_ITEM_REMOVED
LOCK_ACQUIRED
SEMAPHORE_RELEASED
SHARED_VALUE_WRITTEN
```

Events are immutable historical records.

---

## Layer 5 — Presentation

Responsible for converting simulation state and events into:

- factory graphics,
- animations,
- explanations,
- Python highlighting,
- inspectors,
- timelines.

Presentation must never determine simulation results.

---

# 4. Recommended Technology Direction

The initial product should be implemented as a web application.

Recommended stack:

```text
Frontend
React
TypeScript

Simulation Engine
TypeScript

Application State
React-facing state adapter around simulation state

Styling
CSS / selected component styling system

Testing
Unit tests for simulation engine
Integration tests for scenarios
UI tests for critical learning flows
```

The simulation engine should be written as framework-independent TypeScript.

It should **not depend on React**.

For example:

```text
React UI
   ↓
SimulationController
   ↓
SimulationEngine
```

not:

```text
React Component
   ↓
Concurrency Logic
```

This allows the engine to be tested independently and potentially reused elsewhere.

---

# 5. Why the Initial Engine Should Run Client-Side

Learn and Playground do not require actual Python execution.

The simulation engine can therefore run entirely in the browser.

Benefits include:

- immediate interaction,
- no network latency,
- simpler deployment,
- deterministic simulation,
- inexpensive hosting,
- easier playback,
- easier stepping,
- easier state inspection.

A backend should not be introduced until a feature genuinely requires one.

Code Lab's Python strategy remains a later architectural decision.

---

# 6. Core Domain Objects

The initial simulation domain consists of:

```text
Simulation
Worker
Instruction
QueueResource
Package
LockResource
SemaphoreResource
SharedVariable
Scheduler
Event
```

Additional objects may be introduced later.

---

# 7. Simulation

`Simulation` represents the complete simulated concurrent system.

Conceptual model:

```text
Simulation
├── id
├── state
├── simulationTime
├── workers
├── queues
├── locks
├── semaphores
├── sharedVariables
├── packages
├── scheduler
├── eventLog
├── configuration
└── programMetadata
```

Possible simulation states:

```text
NOT_STARTED
RUNNING
PAUSED
FINISHED
WAITING
DEADLOCKED
ERROR
```

`WAITING` should not automatically mean `DEADLOCKED`.

A simulation may have no immediately runnable workers while still having future activity.

---

# 8. Worker

A Worker represents one simulated Python thread.

Conceptual structure:

```text
Worker
├── id
├── name
├── state
├── instructions
├── instructionPointer
├── localVariables
├── blockedOn
├── heldResources
├── wakeTime
├── currentPackage
├── sourceLocation
└── metadata
```

Worker states:

```text
READY
RUNNING
BLOCKED
SLEEPING
FINISHED
```

Potential future states may include:

```text
NEW
CANCELLED
ERROR
```

but these are not required initially.

---

# 9. Worker State Semantics

## READY

The Worker is capable of executing but has not currently been selected by the scheduler.

## RUNNING

The Worker has been selected and is executing its current simulation operation.

## BLOCKED

The Worker cannot proceed because a required condition is currently unavailable.

Examples:

```text
Queue empty
Queue full
Lock unavailable
Semaphore unavailable
Waiting for another thread
```

## SLEEPING

The Worker cannot run until a specified simulation time.

## FINISHED

No further instructions remain.

---

# 10. Worker Local Variables

Each Worker owns a local variable environment.

Example:

```text
Thread 1

locals:
    item = Package A
    result = 34
```

Thread 2 may simultaneously contain:

```text
Thread 2

locals:
    item = Package B
    result = 72
```

Local variables are distinct from SharedVariables.

This distinction is both architecturally important and educationally valuable.

---

# 11. Package

A Package represents a unit of work.

Conceptual structure:

```text
Package
├── id
├── label
├── value
├── state
├── createdAt
├── currentOwner
└── metadata
```

Possible states:

```text
CREATED
QUEUED
ASSIGNED
PROCESSING
COMPLETED
```

The MVP does not require complex payload types.

Simple values such as:

```text
number
string
label
```

are sufficient.

---

# 12. QueueResource

A QueueResource models the behavior required from Python's `queue.Queue`.

Conceptual structure:

```text
QueueResource
├── id
├── name
├── capacity
├── items
├── waitingConsumers
├── waitingProducers
├── unfinishedTasks
└── metadata
```

Capacity may be:

```text
UNBOUNDED
```

or a positive integer.

---

# 13. Queue GET Semantics

When a Worker executes:

```text
QUEUE_GET queue → localVariable
```

the engine checks the Queue.

## If an item exists

1. Remove the next item.
2. Store it in the Worker's local variable.
3. Update package ownership.
4. Increment or preserve relevant task accounting according to queue semantics.
5. Generate appropriate events.
6. Advance the Worker's instruction pointer.

Example events:

```text
QUEUE_GET_REQUESTED
QUEUE_ITEM_REMOVED
WORKER_LOCAL_UPDATED
```

---

## If the Queue is empty

1. Do not advance beyond the blocking operation.
2. Set:

```text
Worker.state = BLOCKED
Worker.blockedOn = queue
```

3. Register the Worker as a waiting consumer.
4. Generate:

```text
QUEUE_GET_REQUESTED
THREAD_BLOCKED
```

The Worker remains blocked until queue state makes progress possible.

---

# 14. Queue PUT Semantics

When a Worker executes:

```text
QUEUE_PUT queue ← package
```

## If capacity exists

1. Add the package.
2. Update package state.
3. Advance the Worker.
4. Generate queue events.
5. Reevaluate waiting consumers.

---

## If the bounded Queue is full

The producer becomes BLOCKED.

Example:

```text
Worker.state = BLOCKED
Worker.blockedOn = queue
```

The Worker should retain the package it was attempting to enqueue.

The queue registers the Worker as a waiting producer.

---

# 15. Queue Wake-Up Semantics

When queue state changes, blocked workers may become eligible.

Example:

```text
Consumer removes item
        ↓
Queue gains capacity
        ↓
Blocked producer can proceed
```

or:

```text
Producer adds item
        ↓
Queue becomes non-empty
        ↓
Blocked consumer can proceed
```

The engine should generally transition an eligible blocked Worker to:

```text
READY
```

rather than immediately to:

```text
RUNNING
```

The Scheduler determines when the Worker actually executes.

This distinction is essential.

---

# 16. LockResource

A LockResource represents exclusive ownership.

Conceptual structure:

```text
LockResource
├── id
├── name
├── owner
├── waitingWorkers
└── metadata
```

At most one Worker may own a Lock.

---

# 17. Lock Acquisition

Instruction:

```text
ACQUIRE_LOCK lock
```

## Lock available

```text
lock.owner = worker
worker.heldResources += lock
```

Worker continues.

Events:

```text
LOCK_REQUESTED
LOCK_ACQUIRED
```

---

## Lock unavailable

Worker becomes:

```text
BLOCKED
```

with:

```text
blockedOn = lock
```

Events:

```text
LOCK_REQUESTED
THREAD_BLOCKED
```

---

# 18. Lock Release

Instruction:

```text
RELEASE_LOCK lock
```

The Worker must own the Lock.

The engine:

1. Removes ownership.
2. Removes the Lock from `heldResources`.
3. Generates `LOCK_RELEASED`.
4. Reevaluates waiting workers.
5. Makes an eligible waiter READY.

The scheduler determines when that Worker runs.

---

# 19. SemaphoreResource

A SemaphoreResource represents a limited number of simultaneous permits.

Conceptual structure:

```text
SemaphoreResource
├── id
├── name
├── maxPermits
├── availablePermits
├── holders
├── waitingWorkers
└── metadata
```

Invariant:

```text
0 <= availablePermits <= maxPermits
```

---

# 20. Semaphore Acquisition

Instruction:

```text
ACQUIRE_SEMAPHORE semaphore
```

## Permit available

```text
availablePermits -= 1
holders += worker
worker.heldResources += semaphore
```

Worker continues.

---

## No permit available

Worker becomes BLOCKED.

```text
worker.blockedOn = semaphore
```

The worker joins the semaphore's waiting set/queue.

---

# 21. Semaphore Release

Instruction:

```text
RELEASE_SEMAPHORE semaphore
```

The Worker releases one permit it currently holds.

The engine updates:

```text
holders
availablePermits
heldResources
```

and reevaluates blocked workers.

An eligible blocked worker becomes READY.

---

# 22. Waiting Order

The simulation engine should explicitly define waiting-order behavior.

For MVP, waiting queues should use deterministic FIFO ordering unless a lesson requires otherwise.

Example:

```text
Waiting:
Thread 3
Thread 5
Thread 7
```

When one permit becomes available, Thread 3 becomes eligible first.

This makes lessons reproducible.

Future realistic scheduling may vary CPU scheduling while still preserving synchronization-object semantics.

---

# 23. SharedVariable

SharedVariable represents state visible to multiple Workers.

Conceptual structure:

```text
SharedVariable
├── id
├── name
├── value
├── valueType
├── lastReadBy
├── lastWrittenBy
└── metadata
```

A SharedVariable should not inherently own a Lock.

Python does not intrinsically associate variables with synchronization primitives.

Any visual relationship such as:

```text
counter protected by counter_lock
```

should be treated as scenario/presentation metadata unless execution actually enforces it.

---

# 24. Shared Variable Instructions

Initial instructions:

```text
READ_SHARED
WRITE_SHARED
```

Example:

```text
READ_SHARED counter → temp
```

stores the current shared value into the Worker's local state.

Example:

```text
WRITE_SHARED counter ← temp
```

updates the SharedVariable.

This enables race-condition visualization.

---

# 25. Conceptual Race Expansion

For educational purposes:

```python
counter += 1
```

may be translated into conceptual micro-operations:

```text
READ_SHARED counter → temp
CALCULATE temp + 1 → temp
WRITE_SHARED counter ← temp
```

This allows interleavings such as:

```text
Thread A READ 10
Thread B READ 10

Thread A CALCULATE 11
Thread B CALCULATE 11

Thread A WRITE 11
Thread B WRITE 11
```

The engine should distinguish between:

- conceptual educational operations,
- and claims about exact Python interpreter implementation.

The UI should not imply that this sequence is necessarily the literal bytecode execution of every Python implementation/version.

---

# 26. Instruction Model

Workers execute a sequence of Instructions.

Conceptual instruction structure:

```text
Instruction
├── id
├── type
├── arguments
├── sourceLocation
├── educationalMetadata
└── visualizationMetadata
```

`sourceLocation` may eventually contain:

```text
file
line
column
```

For Learn and Playground, it may reference generated Python.

---

# 27. Initial Instruction Set

Recommended MVP instructions:

```text
CREATE_PACKAGE

QUEUE_PUT
QUEUE_GET
QUEUE_TASK_DONE

ACQUIRE_LOCK
RELEASE_LOCK

ACQUIRE_SEMAPHORE
RELEASE_SEMAPHORE

READ_SHARED
WRITE_SHARED

CALCULATE

PROCESS

SLEEP

FINISH
```

Potential near-term additions:

```text
JOIN_THREAD
JOIN_QUEUE
```

Future instructions:

```text
WAIT_EVENT
SET_EVENT

WAIT_CONDITION
NOTIFY_CONDITION

BARRIER_WAIT
```

---

# 28. Instruction Pointer

Each Worker has an `instructionPointer`.

Example:

```text
Thread 2

0 QUEUE_GET jobs → item
1 ACQUIRE_SEMAPHORE machines
2 PROCESS item
3 RELEASE_SEMAPHORE machines
4 QUEUE_TASK_DONE jobs
5 FINISH
```

If:

```text
instructionPointer = 2
```

then the Worker's next instruction is:

```text
PROCESS item
```

Blocked instructions should not incorrectly advance the pointer.

The Worker advances only when the instruction has successfully completed according to its semantics.

---

# 29. Process Instruction

`PROCESS` represents application work.

Example:

```text
PROCESS $item duration=3
```

It may:

1. Mark package as PROCESSING.
2. Occupy simulated time.
3. Produce start/end events.
4. Optionally transform package data.
5. Advance when processing completes.

This is an educational abstraction rather than a Python built-in.

Generated Python may represent it through an educational helper such as:

```python
process(item)
```

---

# 30. Sleep Instruction

Example:

```text
SLEEP 2
```

The Worker becomes:

```text
SLEEPING
```

with:

```text
wakeTime = simulationTime + 2
```

It becomes READY when simulation time reaches the wake time.

---

# 31. Scheduler

The Scheduler determines which READY Worker executes next.

Conceptual interface:

```text
Scheduler
├── selectNext(readyWorkers)
├── seed
└── strategyMetadata
```

Scheduling should use a strategy abstraction.

---

# 32. Predictable Scheduler

The Predictable Scheduler should produce repeatable behavior.

Recommended initial strategy:

**deterministic round-robin**

Example:

```text
Thread 1
Thread 2
Thread 3
Thread 1
Thread 2
...
```

Blocked, sleeping, and finished Workers are skipped.

Given the same:

- initial state,
- instructions,
- scheduler configuration,

execution should be reproducible.

---

# 33. Realistic Scheduler

Realistic mode may choose among READY Workers in varying order.

The initial implementation can use seeded pseudorandom selection.

Example:

```text
Ready:
Thread 1
Thread 2
Thread 3

Selected:
Thread 2
```

On the next scheduler turn, Thread 2 may be selected again if still READY.

Realistic scheduling should demonstrate nondeterminism without claiming to exactly reproduce a particular operating system scheduler.

---

# 34. Scheduling Seed

The architecture should support a scheduling seed even if it is not initially visible to users.

Benefits:

- reproduce race conditions,
- replay lessons,
- debug simulations,
- write deterministic tests.

Example:

```text
seed = 84721
```

should reproduce the same randomized scheduling decisions.

---

# 35. Scheduler Visualization

Scheduler state should be inspectable internally from the beginning.

However, a dedicated scheduler UI is not required for MVP.

Future UI may expose:

```text
Ready:
Thread A
Thread B
Thread D

Selected:
Thread B
```

The engine should not require architectural changes to support this.

---

# 36. Simulation Time

Simulation time is independent from real browser time.

Example:

```text
simulationTime = 12.5 seconds
```

Playback speed controls how quickly simulated time is displayed.

For example:

```text
Simulation operation = 4 seconds

0.5× playback → slower visual playback
2× playback   → faster visual playback
```

Simulation correctness must not depend on animation duration.

---

# 37. Time Advancement

When runnable Workers exist, the scheduler continues execution.

If no Worker is READY but one or more are SLEEPING:

```text
Current time = 3

Thread A wakes at 5
Thread B wakes at 8
```

the engine may advance directly:

```text
3 → 5
```

Then:

```text
Thread A
SLEEPING → READY
```

This avoids simulating meaningless empty time.

---

# 38. Waiting State

If no Workers are READY:

1. Check sleeping Workers.
2. Check scheduled future simulation activity.
3. Check blocked Workers.
4. Determine whether future progress is possible.

Possible results:

```text
ADVANCE_TIME
WAIT_FOR_EXTERNAL_SCENARIO_EVENT
FINISHED
POSSIBLE_DEADLOCK
```

Learn/Playground scenarios should avoid indefinite external waiting unless explicitly teaching it.

---

# 39. Deadlock Architecture

Full deadlock detection is not required for MVP.

However, the architecture should preserve enough information to support it.

Specifically:

```text
Worker.blockedOn
Worker.heldResources
Resource.owner / holders
```

allow creation of a wait-for graph.

Example:

```text
Thread A
  holds Lock A
  waits for Lock B

Thread B
  holds Lock B
  waits for Lock A
```

creates a cycle.

Future deadlock detection can operate on this graph without redesigning Worker or Resource objects.

---

# 40. Event System

Events are immutable records describing meaningful simulation activity.

Conceptual structure:

```text
SimulationEvent
├── id
├── sequence
├── type
├── simulationTime
├── workerId
├── resourceId
├── packageId
├── sourceLocation
├── before
├── after
└── metadata
```

Not every field is required for every event.

---

# 41. Initial Event Types

Recommended initial event vocabulary:

```text
SIMULATION_STARTED
SIMULATION_PAUSED
SIMULATION_FINISHED

THREAD_CREATED
THREAD_READY
THREAD_RUNNING
THREAD_BLOCKED
THREAD_UNBLOCKED
THREAD_SLEEPING
THREAD_WOKE
THREAD_FINISHED

PACKAGE_CREATED
PACKAGE_PROCESSING
PACKAGE_COMPLETED

QUEUE_PUT_REQUESTED
QUEUE_ITEM_ADDED
QUEUE_GET_REQUESTED
QUEUE_ITEM_REMOVED
QUEUE_FULL
QUEUE_EMPTY
QUEUE_TASK_DONE

LOCK_REQUESTED
LOCK_ACQUIRED
LOCK_RELEASED

SEMAPHORE_REQUESTED
SEMAPHORE_ACQUIRED
SEMAPHORE_RELEASED

SHARED_VALUE_READ
SHARED_VALUE_WRITTEN

PROCESS_STARTED
PROCESS_FINISHED

TIME_ADVANCED
```

Future:

```text
DEADLOCK_DETECTED
THREAD_JOIN_REQUESTED
QUEUE_JOIN_REQUESTED
```

---

# 42. Events vs. Explanations

Simulation events should contain structured facts.

For example:

```text
type:
THREAD_BLOCKED

workerId:
thread-3

resourceId:
machines

reason:
NO_SEMAPHORE_PERMITS
```

The simulation engine should **not** be responsible for generating beginner-friendly prose.

A presentation/explanation layer can translate the event into:

> Thread 3 is blocked because all workstation permits are currently in use.

This allows the same event to support:

- beginner explanations,
- advanced technical explanations,
- timeline entries,
- accessibility text,
- localization.

---

# 43. State vs. Events

Current state answers:

> What is true now?

Example:

```text
Thread 3.state = BLOCKED
```

Events answer:

> How did we get here?

Example:

```text
SEMAPHORE_REQUESTED
THREAD_BLOCKED
```

Both are required.

UI components should inspect current state while using events for transitions, timelines, and animations.

---

# 44. Event-Driven Visualization

The factory renderer should receive:

1. Current simulation state.
2. Newly produced events.

Example:

```text
THREAD_BLOCKED
       ↓
Factory renderer
       ↓
Worker changes visual state
       ↓
Waiting connection appears
```

The renderer does not decide whether the Worker should block.

The engine already decided that.

---

# 45. Animation Architecture

Animations should visualize state transitions but must not own simulation state.

Incorrect architecture:

```text
Animation finishes
       ↓
Now release semaphore
```

Correct architecture:

```text
Simulation releases semaphore
       ↓
SEMAPHORE_RELEASED event
       ↓
UI animates release
```

Animation can delay presentation but never determine correctness.

---

# 46. Simulation Controller

A `SimulationController` should sit between UI controls and the engine.

Responsibilities may include:

```text
run()
pause()
reset()
nextEvent()
stepLine()
setPlaybackSpeed()
setSchedulingMode()
```

The controller orchestrates execution without implementing resource semantics.

---

# 47. Next Event

`nextEvent()` should advance execution until the next event considered meaningful for the learner.

Internal micro-events may exist without necessarily becoming stopping points.

A configurable event-visibility policy may eventually determine what counts as a user-visible event.

---

# 48. Step Line

`stepLine()` should use the same engine as normal execution.

Conceptually:

```text
startingSourceLocation = current source location

continue simulation

until:
    visible source location changes
OR
    Worker blocks
OR
    Worker finishes
OR
    significant event requires stopping
```

Exact stopping rules should be refined during implementation.

There must not be a separate "line execution engine."

---

# 49. Playback Speed

Playback speed belongs to the presentation/controller layer.

It should not alter scheduling or concurrency semantics.

Given identical:

```text
scenario
seed
scheduler
```

running at:

```text
0.25×
```

and:

```text
2×
```

must produce the same simulation history.

Only visual playback duration differs.

---

# 50. Learn Scenario Architecture

A lesson should define a scenario rather than directly manipulating UI elements.

Conceptually:

```text
LessonScenario
├── id
├── title
├── initialSimulation
├── program
├── schedulerConfiguration
├── lessonStages
├── predictions
├── explanationRules
└── completionCriteria
```

Example:

```text
race-condition-lock
```

creates:

- two Workers,
- one SharedVariable,
- deterministic scheduling,
- a deliberately unsafe instruction sequence.

The lesson controller observes simulation events and determines which educational stage is active.

---

# 51. Lesson Controller

The Lesson Controller handles:

```text
Problem
Prediction
Execution
Discovery
Explanation
Solution
Retry
Completion
```

It should not implement concurrency behavior.

Example:

```text
Lesson Controller
        ↓
Start unsafe simulation
        ↓
Simulation produces shared-write events
        ↓
Lesson detects final counter = 11
        ↓
Show race-condition explanation
```

Then the lesson may load a second program using a Lock.

---

# 52. Playground Architecture

Playground configuration should compile into the same simulation program used by Learn.

Example:

```text
Consumers = 3
Queue Capacity = 5
Semaphore Permits = 2
```

becomes:

```text
SimulationConfiguration
        +
Instruction Program
```

The factory renderer does not need to know whether the program originated from Playground or Learn.

---

# 53. Generated Python

Playground should generate Python from the same conceptual program/configuration.

Conceptually:

```text
Playground Configuration
          ↓
     Program Model
       ↙       ↘
Simulation    Python Generator
```

This is preferable to generating Python independently from UI settings.

It reduces the chance that displayed Python and simulated behavior diverge.

---

# 54. Code Lab Architecture

Code Lab should eventually follow:

```text
Python Source
      ↓
Parser
      ↓
Validation
      ↓
Supported Python AST
      ↓
Concurrency Compiler
      ↓
Instruction Program
      ↓
Simulation Engine
```

The first Code Lab should not attempt to visualize arbitrary Python.

---

# 55. Python Execution Strategy

For the initial product, do not make actual CPython thread execution a dependency of Learn or Playground.

Possible future Code Lab strategies include:

### Strategy A — Parse and interpret supported Python

Advantages:

- maximum simulation control,
- deterministic execution,
- safe,
- easy stepping,
- direct source mapping.

### Strategy B — Browser Python runtime

Potentially useful later.

### Strategy C — Backend sandbox

Potentially required for broader Python support.

The architecture should initially favor **Strategy A**.

A final decision can be made during Code Lab implementation.

---

# 56. Supported Python Boundary

Code Lab should classify source into:

```text
SUPPORTED
PYTHON_ERROR
UNSUPPORTED
```

Example:

```python
with lock:
    counter += 1
```

→ supported.

Example:

```python
def worker(
```

→ Python syntax error.

Example:

```python
requests.get(url)
```

→ valid Python but unsupported by the simulator.

This distinction belongs in the parser/compiler boundary.

---

# 57. Factory Layout Architecture

Factory layout should be derived from simulation structure.

Conceptually:

```text
Simulation State
       ↓
Factory View Model
       ↓
Automatic Layout
       ↓
Rendered Factory
```

The layout engine should understand educational roles such as:

```text
Producer
Queue
Consumer
Workstation
Shared State
```

rather than attempting arbitrary graph layout in MVP.

---

# 58. Factory View Model

Presentation should ideally use a derived view model rather than reading raw engine objects everywhere.

Example:

```text
FactoryViewModel
├── workers
├── conveyors
├── packages
├── workstations
├── sharedBoards
├── waitingConnections
└── statusIndicators
```

This keeps rendering concerns separate from simulation concerns.

---

# 59. Blocking Visualization

Blocked state should derive from:

```text
Worker.state
Worker.blockedOn
```

The view model can produce:

```text
BlockedWorkerView
├── worker
├── reason
├── targetResource
└── explanation
```

The UI may then draw:

```text
👷 🔴 - - - - → 🔧
```

without understanding semaphore logic.

---

# 60. Inspector Architecture

Inspectors should read from current state.

Worker inspector:

```text
Worker
→ state
→ locals
→ current instruction
→ held resources
→ blockedOn
```

Resource inspectors similarly derive directly from engine state.

No duplicate inspector-specific state should be maintained unless necessary for UI selection.

---

# 61. Replayability

The engine should support reconstructing a simulation from:

```text
Scenario
Initial Configuration
Scheduler Strategy
Scheduler Seed
```

This enables future:

- replay,
- bug reproduction,
- lesson reset,
- comparison,
- debugging.

Event logs may additionally be serializable.

---

# 62. Reset

Reset should reconstruct the initial simulation rather than attempting to manually undo every state mutation.

Preferred:

```text
InitialScenario
      ↓
createSimulation()
```

rather than:

```text
manually clear every Worker
manually refill queue
manually reset semaphore
...
```

This greatly reduces reset bugs.

---

# 63. State Mutation

Simulation state changes should occur through engine operations.

UI code should never directly perform:

```text
worker.state = BLOCKED
```

Instead:

```text
engine.executeInstruction(...)
```

causes the state transition.

This preserves invariants.

---

# 64. Important Invariants

The engine should enforce invariants such as:

### Lock

```text
owner count <= 1
```

### Semaphore

```text
0 <= availablePermits <= maxPermits
```

### Finished Worker

```text
FINISHED Worker cannot execute further instructions
```

### Blocked Worker

```text
BLOCKED Worker cannot be selected by scheduler
```

### Sleeping Worker

```text
SLEEPING Worker cannot run before wakeTime
```

### Queue

```text
boundedQueue.items.length <= capacity
```

### Package

A package should not simultaneously belong to incompatible locations.

---

# 65. Testing Strategy

The simulation engine requires extensive automated tests because subtle concurrency-model errors could teach incorrect concepts.

Testing should focus heavily on engine behavior.

---

# 66. Unit Tests

Examples:

```text
queue get succeeds when item exists
queue get blocks when empty
queue put blocks when full
queue get wakes waiting producer

lock acquisition succeeds when free
lock acquisition blocks when occupied
lock release wakes waiter

semaphore allows N holders
N+1 worker blocks
release makes waiter READY

sleeping worker wakes at correct simulation time
```

---

# 67. Deterministic Scenario Tests

Example:

```text
Given:
counter = 10
Thread A unsafe increment
Thread B unsafe increment
specific scheduler

Expect:
counter = 11
```

Then:

```text
Given:
same workers
same scheduler
Lock around increment

Expect:
counter = 12
```

This test effectively validates the first vertical slice.

---

# 68. Event Tests

Tests should verify not only final state but event history.

Example:

```text
LOCK_REQUESTED
LOCK_ACQUIRED
SHARED_VALUE_READ
SHARED_VALUE_WRITTEN
LOCK_RELEASED
```

This matters because the event stream drives education and visualization.

---

# 69. Scheduler Tests

Predictable scheduler:

```text
same state
same program
same result
same event order
```

Realistic scheduler with seed:

```text
same seed
same event order
```

Different seed:

```text
may produce different valid order
```

---

# 70. Presentation Tests

Critical UI behavior should verify:

- blocked state appears,
- waiting resource is identified,
- selected worker inspector is accurate,
- source line corresponds to current instruction,
- Reset reconstructs scenario,
- speed does not change simulation results.

---

# 71. Error Handling

Simulation errors should be explicit.

Examples:

```text
RELEASE_UNOWNED_LOCK
INVALID_SEMAPHORE_RELEASE
UNKNOWN_RESOURCE
INVALID_INSTRUCTION
INVALID_LOCAL_REFERENCE
```

Errors should contain technical information internally.

Presentation may translate them into educational language.

---

# 72. Logging and Debugging

Development builds should support a technical execution trace.

Example:

```text
[12.0] scheduler selected thread-2
[12.0] thread-2 ACQUIRE_SEMAPHORE machines
[12.0] permit 1 → 0
[12.0] thread-2 instructionPointer 3 → 4
```

This trace is distinct from the learner-facing timeline.

It will be valuable while debugging the engine.

---

# 73. Accessibility

Concurrency understanding must not depend exclusively on:

- color,
- animation,
- spatial position.

Worker state should include text labels.

Example:

```text
🔴 BLOCKED
Waiting for machine permit
```

Animations should respect reduced-motion preferences.

Stepping controls should allow the experience to remain understandable without animation.

---

# 74. Performance Expectations

MVP scenarios are intentionally small.

Expected typical scale:

```text
1–10 Workers
1–3 Queues
1–3 synchronization resources
tens of packages
hundreds or low thousands of events
```

The architecture should favor clarity over premature optimization.

Large-scale thread simulation is not an MVP goal.

---

# 75. Persistence

Persistent accounts or cloud state are not required for MVP.

Lesson progress may initially remain local or be omitted.

Simulation state should nevertheless be serializable where practical to support future:

- saved scenarios,
- replay,
- shareable examples,
- lesson progress.

---

# 76. Security Boundary

Learn and Playground do not execute arbitrary user code.

This significantly reduces risk.

Future Code Lab must treat arbitrary Python execution as a separate security problem.

The initial constrained parser/interpreter approach should never evaluate user-provided Python through unrestricted JavaScript or server execution.

---

# 77. Project Structure — Recommended Direction

A conceptual source structure might be:

```text
src/
│
├── simulation/
│   ├── engine/
│   ├── instructions/
│   ├── schedulers/
│   ├── resources/
│   ├── events/
│   └── tests/
│
├── programs/
│   ├── compiler/
│   ├── scenarios/
│   └── python-generator/
│
├── learn/
│   ├── lessons/
│   ├── lesson-controller/
│   └── components/
│
├── playground/
│   ├── configuration/
│   └── components/
│
├── codelab/
│   ├── parser/
│   ├── validation/
│   └── components/
│
├── factory/
│   ├── view-model/
│   ├── layout/
│   ├── renderer/
│   └── components/
│
├── timeline/
├── inspector/
└── app/
```

Exact directories may change during implementation.

The important requirement is separation of responsibilities.

---

# 78. Dependency Direction

Dependencies should generally flow inward toward the simulation model.

Preferred:

```text
UI
 ↓
Controllers
 ↓
Program / Scenario
 ↓
Simulation Engine
```

The simulation engine should know nothing about:

```text
React
HTML
CSS
animations
lesson screens
```

This is an important architectural boundary.

---

# 79. First Vertical Slice

The first implementation should **not** attempt to build the entire MVP.

Build one complete educational scenario:

> Something Went Wrong With Our Counter

The vertical slice should include:

1. Two Workers.
2. One SharedVariable.
3. Unsafe increment instructions.
4. Predictable scheduler.
5. Deliberately selected interleaving.
6. Event generation.
7. Race-condition result.
8. Factory visualization.
9. Python visualization.
10. Step-through execution.
11. Prediction UI.
12. Explanation.
13. LockResource.
14. Safe version of the program.
15. Re-run.
16. Correct final result.

---

# 80. First Vertical Slice Execution

Unsafe version:

```text
counter = 10

Thread A:
READ counter → temp
CALCULATE temp + 1
WRITE counter

Thread B:
READ counter → temp
CALCULATE temp + 1
WRITE counter
```

Scheduler intentionally produces:

```text
A READ 10
B READ 10
A CALCULATE 11
B CALCULATE 11
A WRITE 11
B WRITE 11
```

Result:

```text
counter = 11
```

---

# 81. First Vertical Slice — Safe Version

Program becomes:

```text
Thread A:
ACQUIRE lock
READ counter
CALCULATE
WRITE counter
RELEASE lock

Thread B:
ACQUIRE lock
READ counter
CALCULATE
WRITE counter
RELEASE lock
```

Possible execution:

```text
A ACQUIRE
B ACQUIRE → BLOCKED

A READ 10
A CALCULATE 11
A WRITE 11
A RELEASE

B BLOCKED → READY
B ACQUIRE
B READ 11
B CALCULATE 12
B WRITE 12
B RELEASE
```

Result:

```text
counter = 12
```

This validates:

- Workers
- Instructions
- Scheduler
- SharedVariable
- Lock
- Blocking
- Local variables
- Events
- Step execution
- UI synchronization
- educational lesson architecture

That makes it an excellent architectural proof.

---

# 82. Development Sequence After Vertical Slice

After the race-condition vertical slice:

## Step 1

Generalize Worker and instruction execution.

## Step 2

Add QueueResource.

Build:

> Where Does the Work Wait?

## Step 3

Add empty-queue blocking.

Build:

> There's Nothing on the Conveyor.

## Step 4

Add Package processing and factory flow.

## Step 5

Add SemaphoreResource.

Build:

> One Key Is Slowing Us Down.

## Step 6

Build general Playground configuration.

## Step 7

Add generated Python.

## Step 8

Add Realistic scheduler.

## Step 9

Complete MVP Learn curriculum.

## Step 10

Begin Code Lab parser work.

---

# 83. Decisions Made in v0.1

The following architectural decisions are considered established unless implementation reveals a significant problem:

- Web application.
- React-based UI direction.
- TypeScript simulation engine.
- Engine runs client-side initially.
- Engine independent of React.
- One engine shared by all modes.
- Instruction-based simulation.
- Event-driven presentation.
- Explicit Worker states.
- Blocking modeled explicitly.
- Local variables modeled separately from shared state.
- Queues, Locks, and Semaphores are first-class resources.
- Simulation time is independent of wall-clock time.
- Scheduling is replaceable.
- Predictable scheduling is deterministic.
- Realistic scheduling supports seeded variation.
- Animations do not determine simulation state.
- Playground compiles configuration into simulation programs.
- Generated Python derives from the program model.
- Code Lab eventually compiles supported Python into the same program representation.
- Arbitrary Python execution is not required for MVP.
- Reset reconstructs the simulation.
- First vertical slice is race condition → Lock.

---

# 84. Intentionally Deferred Decisions

The following should remain open until implementation provides more information:

- Exact React framework/build tooling.
- Exact styling/component library.
- Exact state-management library, if any.
- Whether immutable state structures are used internally.
- Exact event serialization format.
- Exact instruction class/type representation.
- Exact animation technology.
- Exact factory layout algorithm.
- Exact Python parser implementation.
- Whether Pyodide is ever used.
- Whether Code Lab eventually requires a backend.
- Authentication.
- Persistence.
- Hosting platform.
- Database.
- Analytics.
- Localization infrastructure.

These should not block the first vertical slice.

---

# 85. Architecture Success Criteria

The architecture is successful if the same simulation engine can power:

```text
Learn lesson
Playground experiment
Code Lab program
```

without duplicating concurrency logic.

It should be possible to run a simulation without any UI and inspect:

```text
final state
worker states
resource states
event history
```

A deterministic test should be able to prove:

```text
unsafe shared increment → incorrect result
```

and:

```text
same scenario + Lock → correct result
```

The UI should then merely make those facts understandable.

---

# 86. Guiding Engineering Principle

When deciding where logic belongs, ask:

> **Would this still need to exist if Concurrency Factory had no graphics?**

If yes, it probably belongs in the simulation/domain layer.

Examples:

```text
Thread becomes BLOCKED       → engine
Semaphore has no permits     → engine
Queue is full                → engine
Scheduler selects Thread 2   → engine
```

If the answer is no, it probably belongs in presentation.

Examples:

```text
Worker turns visually red    → presentation
Dashed line points to lock   → presentation
Package slides down belt     → presentation
Explanation says “waiting”   → presentation
```

This boundary should remain strict.

---

# 87. Final Architectural Objective

Concurrency Factory should ultimately behave like a small, inspectable virtual concurrency machine.

The machine understands:

- Workers,
- instructions,
- state,
- resources,
- scheduling,
- blocking,
- time,
- and events.

The factory visualization then makes that machine understandable to a beginner.

Learn provides the reason to care.

Playground provides experimentation.

Code Lab connects the mental model back to actual Python.

All three depend on the same underlying system.

That shared simulation engine is the technical foundation of Concurrency Factory.