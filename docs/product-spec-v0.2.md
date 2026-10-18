# Concurrency Factory
## Product Specification v0.2

**Status:** Pre-development product specification  
**Product Type:** Interactive educational web application  
**Primary Language Taught:** Python  
**Primary Audience:** Students who understand basic Python but are new to concurrency

---

# 1. Product Vision

Concurrency Factory is an interactive learning environment that makes Python concurrency visible, understandable, and explorable.

Concurrency is difficult for beginners because much of what matters is invisible. Threads execute independently, execution order changes, threads block while waiting for resources, shared state can be modified unexpectedly, and synchronization primitives affect behavior that students cannot normally see.

Concurrency Factory represents these concepts as a simulated factory.

- Threads become workers.
- Queues become conveyor belts.
- Queue items become packages.
- Semaphores become workstations with limited capacity.
- Locks become keys.
- Shared variables become shared whiteboards.
- Blocking causes workers to visibly wait for the thing preventing them from continuing.

The factory is not intended to literally represent computer hardware.

It represents the **mental model a beginner needs to understand concurrent execution**.

The long-term goal is for learners to eventually look at concurrent Python code and mentally understand what is happening without needing the factory visualization.

---

# 2. Primary Goal

The primary goal of Concurrency Factory is:

> Help students who already understand basic Python develop an intuitive and technical understanding of concurrency in Python.

Students should gradually become capable of:

1. Reading concurrent Python.
2. Predicting how concurrent programs may behave.
3. Understanding thread states.
4. Understanding blocking.
5. Understanding queues and producer/consumer patterns.
6. Recognizing shared state.
7. Recognizing race conditions.
8. Understanding synchronization.
9. Understanding locks and semaphores.
10. Recognizing basic concurrency bugs.
11. Writing simple concurrent Python.
12. Debugging basic concurrent programs.

Writing and debugging are important outcomes, but **understanding is the primary objective**.

---

# 3. Target User

The target learner understands basic Python concepts such as:

- Variables
- Functions
- Parameters
- Return values
- Loops
- Conditional statements
- Lists
- Imports
- Basic classes and objects

The learner is assumed to have little or no understanding of:

- Threads
- Thread scheduling
- Queues
- Blocking
- Shared state
- Race conditions
- Locks
- Critical sections
- Semaphores
- Deadlocks
- Synchronization

The application should therefore introduce concurrency terminology gradually and only when the learner has a reason to understand it.

---

# 4. Educational Philosophy

Concurrency Factory should not primarily teach concurrency by presenting definitions.

It should teach through **problems**.

Rather than:

> "A Lock is a synchronization primitive providing mutual exclusion."

the learner should first encounter a problem:

> "Two workers updated our counter, but one update disappeared. Why?"

The learner observes the race condition before being introduced to the Lock that solves it.

The primary learning sequence is:

**Problem → Prediction → Visualization → Discovery → Name the concept → Introduce a solution → Run again → Connect to Python → Experiment**

Concepts should generally appear because the learner **needs them to solve a problem**.

---

# 5. Standard Lesson Structure

Guided lessons should normally follow a consistent progression.

## Stage 1 — Problem

Present a concrete factory problem.

Example:

> Two workers finished packages at almost the same time, but our completed-package counter only increased once.

Avoid introducing terminology prematurely.

---

## Stage 2 — Prediction

Ask the learner what they think will happen.

Example:

> Counter starts at 10. Thread A increments it once and Thread B increments it once. What should the result be?

Prediction encourages the learner to construct a mental model before seeing the answer.

Wrong predictions should be treated as opportunities for discovery rather than failures.

---

## Stage 3 — Step Through

Slow execution down.

Synchronize:

- Python
- worker state
- factory state
- local variables
- shared state

Example:

```text
Thread A reads 10.
Thread B reads 10.
Thread A calculates 11.
Thread B calculates 11.
Thread A writes 11.
Thread B writes 11.
```

---

## Stage 4 — Discover

Reveal the unexpected result.

Example:

```text
Expected: 12
Actual:   11
```

Allow the learner to reason about what happened before introducing terminology.

---

## Stage 5 — Name the Concept

Once the behavior is understood, introduce its technical name.

Example:

> This is a race condition.

Terminology should attach to an already-understood behavior.

---

## Stage 6 — Introduce the Solution

Introduce the Python concurrency feature that addresses the problem.

Example:

```python
with counter_lock:
    counter += 1
```

Connect the visual metaphor directly to Python.

---

## Stage 7 — Run Again

Repeat the same scenario using the solution.

The learner should visibly see how behavior changes.

---

## Stage 8 — What Changed in Python?

Highlight only the important code introduced by the lesson.

For example:

```python
counter_lock = threading.Lock()
```

and:

```python
with counter_lock:
    counter += 1
```

This prevents the factory metaphor from becoming disconnected from actual programming.

---

## Stage 9 — Experiment

Where appropriate, allow the learner to open the scenario in Playground and modify it.

This bridges guided learning into independent exploration.

---

# 6. Core Visual Language

The application uses a consistent factory metaphor.

| Python / Concurrency Concept | Factory Representation |
|---|---|
| Thread | Worker |
| Queue | Conveyor belt |
| Queue item | Package |
| Producer | Worker adding packages |
| Consumer | Worker taking packages |
| Shared variable | Shared whiteboard |
| Lock | Key |
| Critical section | Protected work area |
| Semaphore | Workstation with limited slots |
| Semaphore permit | Available workstation slot |
| Blocking | Worker visibly waiting |
| `sleep()` | Worker taking a timed break |
| Thread `join()` | Waiting for worker completion |
| `queue.join()` | Waiting for all queued work to finish |
| Race condition | Workers incorrectly overlapping access to shared state |
| Deadlock | Workers holding resources while waiting on each other |

The metaphor should remain consistent across Learn, Playground, and Code Lab.

---

# 7. Visual Labels and Progressive Familiarity

The product should not require beginners to memorize the metaphor before using it.

Early lessons should explicitly pair factory objects with Python terminology.

Example:

```text
QUEUE / CONVEYOR BELT

📦 ═══ 📦 ═══ □ ═══ □

Python:
jobs = Queue()
```

Workers should initially be labeled:

```text
👷 Thread 2
Python Thread
```

Shared state:

```text
📋 SHARED VARIABLE

counter = 7
```

Semaphore:

```text
🔧 SEMAPHORE WORKSTATION

machine = Semaphore(2)

2 permits
```

As learners progress, explanatory labels can become less prominent.

The goal is for learners to gradually stop needing the metaphor explained.

---

# 8. Application Modes

Concurrency Factory has three primary modes:

1. Learn
2. Playground
3. Code Lab

These are not separate simulation systems.

They are different interfaces into the same underlying concurrency model.

---

# 9. Learn Mode

Learn is the primary onboarding and teaching experience.

It is:

- Problem-driven
- Guided
- Progressive
- Prediction-based
- Highly controlled

The learner should not initially be presented with a large dashboard.

Each lesson should focus attention on:

- one problem,
- the relevant Python,
- the relevant factory state,
- and one decision or prediction.

Advanced information should appear only when it becomes useful.

Learn answers:

> **Why does this concurrency concept exist?**

---

# 10. Playground Mode

Playground is the experimentation environment.

It answers:

> **What happens if I change this?**

Users configure a factory without needing to write Python.

Initial controls should include:

- Producers
- Consumers
- Threads
- Queue capacity
- Semaphore enabled/disabled
- Semaphore permits
- Shared state
- Lock enabled/disabled
- Processing duration
- Production rate where useful

The factory should automatically adapt to the configuration.

Manual drag-and-drop factory construction is not required for MVP.

---

# 11. Code Lab

Code Lab allows the learner to control the factory through Python.

It answers:

> **Can I make this happen by writing the Python myself?**

Code Lab should synchronize:

- Python source
- Factory visualization
- Thread states
- Event timeline
- Inspector information

The initial version should support a constrained subset of Python rather than arbitrary Python execution.

The supported subset should expand over time.

---

# 12. Relationship Between Modes

The intended learner progression is:

```text
LEARN
Understand why concepts exist
        ↓
PLAYGROUND
Experiment with those concepts
        ↓
CODE LAB
Express those concepts in Python
```

However, users are not required to follow this sequence.

The home screen should allow users to enter any mode directly.

Experienced learners should be able to bypass introductory lessons.

---

# 13. Show Python

Learn and Playground should prominently connect factory behavior to Python.

A **Show Python** feature should reveal code corresponding to the current scenario.

Example configuration:

```text
Consumers: 3
Queue Capacity: 5
Semaphore Permits: 2
```

could produce:

```python
from queue import Queue
from threading import Thread, Semaphore

jobs = Queue(maxsize=5)
machines = Semaphore(2)

def worker():
    while True:
        item = jobs.get()

        with machines:
            process(item)

        jobs.task_done()
```

The purpose is not merely code generation.

It creates the progression:

**See it → Understand it → See the Python → Write the Python**

---

# 14. Worker Model

Every simulated Python thread is represented by a worker.

Workers may occupy these conceptual states:

- **READY** — capable of running
- **RUNNING** — currently executing
- **BLOCKED** — cannot proceed until something changes
- **SLEEPING** — intentionally waiting for simulated time
- **FINISHED** — execution completed

The state should be visually obvious.

---

# 15. Blocking as a Core Concept

Blocking is a central teaching feature, not a minor animation state.

The product should make invisible waiting visible.

Whenever a worker blocks, the interface should answer:

1. Who is blocked?
2. What is the worker waiting for?
3. Why is it unavailable?
4. What must happen before the worker can continue?

Examples include:

### Empty Queue

```text
👷 Thread 2
🔴 BLOCKED

Waiting for:
Package from jobs Queue
```

### Full Queue

```text
👷 Producer
🔴 BLOCKED

Holding:
Package D

Waiting for:
Available queue space
```

### Lock

```text
👷 Thread 2
🔴 BLOCKED

Waiting for:
counter_lock

Currently held by:
Thread 1
```

### Semaphore

```text
👷 Thread 4
🔴 BLOCKED

Waiting for:
machine permit

Available:
0 / 3
```

Blocked workers should visually point toward or otherwise identify the resource they are waiting for.

A core product principle is:

> **Blocking should never look like nothing happening.**

---

# 16. Local State vs. Shared State

The application should help learners distinguish between data belonging to one thread and data shared among threads.

Example worker inspector:

```text
Thread 2

Local variables:
item = Package B
result = 34
```

Shared state appears separately:

```text
SHARED WHITEBOARD

counter = 7
```

This distinction becomes especially important when teaching race conditions.

---

# 17. Packages and Data

Packages should have identities.

Examples:

```text
Package A
Package B
Package C
```

Packages may eventually contain visible values:

```text
Package #4
value = 17
```

This allows the application to later visualize actual processing:

```text
📦 17
  ↓
👷
  ↓
📦 34
```

Package identity and simple data should be supported from the beginning even if early lessons use simple labels.

---

# 18. Dynamic Factory Layout

The factory should automatically adapt to the simulated program.

Examples:

Increasing consumers:

```text
2 consumers → 4 consumers
```

should automatically display additional workers.

Changing:

```python
Semaphore(1)
```

to:

```python
Semaphore(3)
```

should increase visible workstation capacity.

Adding shared state should introduce a whiteboard.

Adding a Lock should introduce protected access.

Automatic dynamic layout is part of the MVP.

Manual positioning is a possible future feature.

---

# 19. Interaction and Inspection

Factory objects should be clickable.

## Worker Inspector

Should expose:

- Thread name
- State
- Current instruction
- Current Python line where available
- Local variables
- Current package
- Resources held
- Resource being waited on

## Queue Inspector

Should expose:

- Queue name
- Items
- Capacity
- Available capacity
- Waiting consumers
- Waiting producers
- Unfinished tasks where applicable

## Lock Inspector

Should expose:

- Lock name
- Current owner
- Waiting threads

## Semaphore Inspector

Should expose:

- Name
- Maximum permits
- Available permits
- Current holders
- Waiting workers

## Shared Variable Inspector

Should expose:

- Name
- Current value
- Relevant reads/writes
- Protection information where appropriate

---

# 20. Simulation Controls

The simulator should support:

- Run
- Pause
- Reset
- Next Event
- Step Line
- Speed control

Suggested speeds:

- 0.25×
- 0.5×
- 1×
- 2×

---

# 21. Next Event

Next Event advances to the next meaningful concurrency event.

Examples:

- Package enters queue.
- Thread requests a lock.
- Thread blocks.
- Thread acquires a semaphore.
- Thread releases a resource.
- Sleeping thread wakes.

This answers:

> **What changed in the concurrent system?**

---

# 22. Step Line

Step Line advances execution from the perspective of Python source code.

It answers:

> **What Python code executes next?**

Step Line and Next Event should use the same underlying simulation engine.

They should differ only in where execution pauses.

This prevents the two stepping systems from producing inconsistent states.

---

# 23. Scheduling

The simulation engine should support multiple scheduling strategies.

## Predictable

Produces reproducible scheduling decisions.

Preferred for guided lessons.

## Realistic

Scheduling may vary between runs when multiple threads are eligible.

This teaches:

> Concurrent programs should generally not depend on an assumed thread execution order unless that order is explicitly synchronized.

The term **Realistic** is preferred for the learner-facing mode.

---

# 24. Scheduler Visualization

A scheduler must exist internally in the MVP.

A dedicated visual scheduler panel is **not required for MVP**.

Later, an advanced view may show:

```text
SCHEDULER

Ready:
Thread 1
Thread 3
Thread 4

Selected:
Thread 3
```

This can support deeper lessons about nondeterminism and scheduling.

---

# 25. Event Timeline

Users should be able to inspect meaningful execution events.

Example:

```text
12.0 — Thread 1 acquired machine permit.
12.1 — Thread 2 acquired machine permit.
12.2 — Thread 3 requested machine permit.
12.2 — Thread 3 BLOCKED.
14.5 — Thread 1 released machine permit.
14.5 — Thread 3 became READY.
14.6 — Thread 3 acquired machine permit.
```

Language should be understandable to beginners.

Technical details may be available through inspection.

---

# 26. Curriculum Roadmap

The initial full curriculum should tell a continuous story in which each new concurrency concept solves a problem introduced by previous lessons.

## Lesson 1 — One Worker Isn't Enough

**Concepts:**
- Sequential execution
- Concurrent execution
- Threads

**Problem:** One worker cannot process incoming work quickly enough.

**New idea:** Multiple threads can make progress on independent work.

---

## Lesson 2 — Where Does the Work Wait?

**Concepts:**
- Queue
- Producer
- Consumer
- FIFO

**Problem:** Work arrives while workers are already busy.

**New idea:** Put waiting work into a Queue.

**Factory object introduced:** Conveyor belt.

---

## Lesson 3 — There's Nothing on the Conveyor

**Concepts:**
- Blocking
- READY vs BLOCKED

**Problem:** A consumer calls `get()` when no work exists.

**New idea:** The thread waits until work becomes available.

---

## Lesson 4 — The Conveyor Is Full

**Concepts:**
- Bounded queue
- Blocking producers
- Backpressure

**Problem:** Producers create work faster than consumers process it.

**New idea:** Queue capacity can limit pending work, causing producers to wait.

---

## Lesson 5 — Something Went Wrong With Our Counter

**Concepts:**
- Shared state
- Interleaving
- Race condition

**Problem:** Two workers update a shared counter, but an update disappears.

**New idea:** Shared state can become incorrect when operations overlap.

---

## Lesson 6 — One Key to the Whiteboard

**Concepts:**
- Lock
- Mutual exclusion
- Critical section

**Problem:** Multiple workers must safely update shared state.

**New idea:** Only one worker may hold the key at a time.

---

## Lesson 7 — One Key Is Slowing Us Down

**Concepts:**
- Semaphore
- Limited shared resources

**Problem:** The factory owns three machines, but a Lock allows only one worker to use them.

**New idea:** A Semaphore allows up to N workers to access a limited resource.

---

## Lesson 8 — Who Goes Next?

**Concepts:**
- Scheduling
- Nondeterminism

**Problem:** Multiple threads are ready, but execution order changes.

**New idea:** Do not assume which runnable thread executes next.

---

## Lesson 9 — Wait Until Everyone Is Finished

**Concepts:**
- Thread `join()`
- Main-thread blocking

**Problem:** The program announces completion while workers are still running.

**New idea:** Wait for thread completion.

---

## Lesson 10 — Is Every Package Actually Finished?

**Concepts:**
- `queue.task_done()`
- `queue.join()`

**Problem:** Thread completion and work completion are not necessarily the same thing.

**New idea:** Track whether queued work itself has been completed.

---

## Lesson 11 — Everybody Is Waiting Forever

**Concepts:**
- Deadlock
- Resource dependency cycles

**Problem:** Threads each hold something another thread needs.

**New idea:** Waiting relationships can create a cycle where nobody can continue.

---

## Lesson 12 — Build the Factory Yourself

**Concepts:**
- Integration
- Independent problem solving

**Problem:** Design a concurrent processing system using the concepts learned.

Learners select appropriate:

- Threads
- Queue
- Lock
- Semaphore

The resulting system can then be opened in Playground and viewed as Python.

---

# 27. MVP Curriculum

The initial product should not require all 12 lessons.

The MVP Learn experience should focus on:

1. One Worker Isn't Enough
2. Where Does the Work Wait?
3. There's Nothing on the Conveyor
4. Something Went Wrong With Our Counter
5. One Key to the Whiteboard
6. One Key Is Slowing Us Down

This validates:

- Threads
- Queues
- Blocking
- Shared state
- Race conditions
- Locks
- Semaphores

These concepts are sufficient to prove the primary educational model.

---

# 28. Race Condition Visualization

The application may conceptually expand:

```python
counter += 1
```

into:

```text
READ counter
CALCULATE counter + 1
WRITE counter
```

This allows learners to understand how overlapping access can lose an update.

Example:

```text
counter = 10

Thread A reads 10.
Thread B reads 10.

Thread A calculates 11.
Thread B calculates 11.

Thread A writes 11.
Thread B writes 11.

Final value = 11
Expected value = 12
```

Where exact Python implementation details differ from the conceptual model, the application should make clear that the visualization is illustrating the concurrency principle rather than claiming to display exact interpreter internals.

---

# 29. Lock Visualization

Locks should appear as keys protecting access to critical sections.

Example:

```text
             🔑 Thread A
                  ↓
             WHITEBOARD
            ┌────────────┐
            │ counter=10 │
            └────────────┘

Thread B
🔴 BLOCKED
Waiting for key
```

When Thread A releases the Lock, Thread B becomes eligible to continue.

---

# 30. Semaphore Visualization

Semaphores should normally appear as workstations with limited capacity.

For:

```python
Semaphore(3)
```

the workstation should contain three available positions.

Up to three workers may occupy the workstation.

Additional workers block until a permit becomes available.

This should visually reinforce the difference between:

**Lock → one at a time**

and:

**Semaphore → up to N at a time**

---

# 31. Queue Visualization

Queues appear as conveyor belts.

For:

```python
Queue(maxsize=5)
```

the conveyor should visibly contain five package positions.

An empty queue can block consumers.

A full bounded queue can block producers.

The same metaphor therefore demonstrates:

- storage,
- ordering,
- producer/consumer coordination,
- and blocking.

---

# 32. Supported Python — Initial Direction

Code Lab should initially support a constrained concurrency-oriented subset of Python.

Likely concurrency support includes:

```python
threading.Thread
threading.Lock
threading.Semaphore

queue.Queue

time.sleep

queue.put()
queue.get()
queue.task_done()
queue.join()

lock.acquire()
lock.release()

semaphore.acquire()
semaphore.release()
```

Context-manager syntax should be supported:

```python
with lock:
    ...
```

and:

```python
with semaphore:
    ...
```

Basic Python constructs necessary to express supported examples should also be handled.

Exact parser/interpreter boundaries belong in the Technical Architecture Specification.

---

# 33. Code Lab Error Categories

Code Lab should distinguish:

## Python Error

The Python itself is invalid.

Example:

> SyntaxError: expected `:`

## Simulation Error

The supported program performs an invalid simulated operation.

Example:

> Thread attempted to release a Lock it does not hold.

## Unsupported Visualization

The code may be valid Python, but Concurrency Factory does not support visualizing it.

Example:

> This is valid Python, but Concurrency Factory does not currently support visualizing `requests.get()`.

This distinction is important educationally.

The product should never teach learners that valid Python is invalid simply because the simulator cannot represent it.

---

# 34. Core Architecture Principle

The simulation model is the source of truth.

The architecture should conceptually follow:

```text
Learn ─────────────┐
                   │
Playground ────────┼──→ Instructions
                   │          ↓
Code Lab → Parser ─┘    Simulation Engine
                              ↓
                           Events
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
           Factory          Python          Timeline
           Visuals         Highlight       / Explanation
```

Python should not directly control animations.

Animations should not contain simulation logic.

All modes should share the same simulation engine.

---

# 35. MVP Product Scope

## MVP includes:

### Learn

- Six core guided lessons
- Prediction questions
- Step-through execution
- Concept introduction
- Python connection

### Playground

- Producers
- Consumers
- Threads
- Queue
- Queue capacity
- Semaphore
- Semaphore permits
- Shared state
- Lock
- Processing timing
- Automatic layout
- Show Python

### Simulation

- READY
- RUNNING
- BLOCKED
- SLEEPING
- FINISHED
- Queue blocking
- Lock blocking
- Semaphore blocking
- Predictable scheduling
- Basic realistic scheduling
- Simulation time
- Event generation

### Visualization

- Workers
- Packages
- Conveyor belts
- Workstations
- Whiteboards
- Locks
- Visible package identity/data
- Basic worker/local-variable inspector
- Resource inspection
- Event timeline

### Controls

- Run
- Pause
- Reset
- Speed
- Next Event
- Step Line

### Code Lab

The application should reserve a clear place for Code Lab and its architecture should support it.

A polished arbitrary-code experience is not required before validating Learn and Playground.

---

# 36. Explicitly Outside Initial MVP

The following should not block the initial release:

- Arbitrary Python execution
- Full Python syntax
- Drag-and-drop factory construction
- Manual factory layout
- Exact operating-system scheduler simulation
- Advanced scheduler visualization
- `asyncio`
- Multiprocessing
- Network concurrency
- Conditions
- Events
- Barriers
- Starvation
- Livelock
- Thread pools
- Advanced deadlock analysis
- Performance profiling
- User accounts
- Cloud synchronization
- Collaboration

These may be added later.

---

# 37. Future Learning Features

Possible expansions include:

## Debugging Challenges

> This factory sometimes produces the wrong counter value. Fix it.

## Deadlock Challenges

> These workers have stopped forever. Determine why.

## Scheduling Experiments

Allow learners to deliberately choose which READY thread executes next.

## Execution Replay

Store a scheduling seed so a particular concurrency failure can be reproduced.

## Compare Mode

Run two implementations side-by-side:

```text
Without Lock        With Lock
```

or:

```text
Lock                Semaphore(3)
```

## Advanced Scheduler View

Expose:

- READY threads
- Selected thread
- Blocked threads
- Scheduling decisions

## Additional Python Models

Eventually teach:

- `concurrent.futures`
- `asyncio`
- `multiprocessing`

These may require extensions to the factory metaphor.

---

# 38. Product Principles

## 1. Problems before terminology

Learners should usually experience why a concept is needed before being given its name.

## 2. Prediction before explanation

Where useful, learners should commit to a prediction before seeing execution.

## 3. Understanding before realism

Prefer an accurate educational model over unnecessary implementation detail.

## 4. State should be visible

Users should be able to determine what every relevant worker is doing.

## 5. Blocking should never look like nothing

Waiting must have a visible reason.

## 6. Connect every metaphor to Python

The factory is a bridge to understanding code, not an alternative vocabulary learners are expected to use forever.

## 7. Shared and local state should be distinguishable

Learners should understand which values belong to individual threads and which are shared.

## 8. One simulation engine

Learn, Playground, and Code Lab must not evolve into separate simulation implementations.

## 9. Progressive complexity

Do not expose advanced concurrency information until it becomes useful.

## 10. Encourage experimentation

Learners should be able to safely ask:

> What happens if I change this?

## 11. Unexpected behavior is educational

Race conditions, blocking, incorrect results, and eventually deadlocks should be experiences learners can inspect rather than simply error messages.

## 12. The end goal is independence from the metaphor

Success means the learner eventually understands the Python without needing the factory.

---

# 39. Success Criteria

A learner completing the core curriculum should be able to explain:

- What a thread represents.
- Why multiple threads are useful.
- What a Queue does.
- Why producer/consumer systems use queues.
- What blocking means.
- Why `queue.get()` may block.
- Why a bounded `queue.put()` may block.
- What shared state is.
- Why race conditions happen.
- What a critical section is.
- What a Lock accomplishes.
- Why a blocked Lock requester is not broken.
- How a Semaphore differs conceptually from a Lock.
- Why thread execution order should not normally be assumed.

A strong indicator of success is that a learner can look at:

```python
def worker():
    item = jobs.get()

    with machines:
        process(item)

    jobs.task_done()
```

and mentally understand:

> The thread waits for work if necessary, takes an item from the queue, waits for access to the limited processing resource if necessary, processes the item, releases that resource, and marks the queued task as completed.

The learner should no longer need the conveyor belt to understand that code.

---

# 40. Long-Term Vision

Concurrency Factory should become an interactive bridge between:

**Python source code**

and:

**a learner's mental model of concurrent execution.**

A learner should eventually be able to:

1. Encounter a concurrency problem.
2. Predict program behavior.
3. Watch individual threads execute.
4. Inspect local and shared state.
5. See why a thread is blocked.
6. Understand scheduling interleavings.
7. Reproduce concurrency bugs.
8. Experiment with synchronization.
9. See the corresponding Python.
10. Write the Python themselves.

The product succeeds when concurrency stops feeling like invisible magic and starts feeling like a system whose behavior the learner can reason about.