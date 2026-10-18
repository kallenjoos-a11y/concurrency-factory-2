# Concurrency Factory project context

## Current core course

The six MVP lessons are implemented in a shared course screen. Read [the lesson plans](core-lessons/README.md) for objectives, predictions, factory evidence, Python connections, experiments, and exit questions. The original Product Specification and Technical Architecture documents remain unchanged. The prior prototypes below record the foundation; the six core lessons now provide the course’s default navigation.

The engine now supports package processing and Semaphore permits. A one-worker versus two-worker example shows overlapping progress without claiming an elapsed-time speedup. A one-Lock versus three-permit example shows resource capacity and explicit blocking. Race conditions and Locks are separate lessons. All course outcomes come from the same engine.


This project implements three focused prototypes: Vertical Slice 01, “Something Went Wrong With Our Counter,” and Vertical Slice 02, “Where Does the Work Wait?”, and Vertical Slice 03, “What if the Queue Is Empty?” Use the product and architecture references to understand the broader design, and the current scope and decisions below to guide further work.

## Earlier specifications

- [Product Specification v0.2](product-spec-v0.2.md): product vision, audience, learning philosophy, factory metaphor, modes, and curriculum.
- [Technical Architecture Specification v0.1](technical-architecture-v0.1.md): simulation model, instruction semantics, resources, worker state, and scheduler.

Both complete originals are preserved verbatim from the user-provided documents: Product Specification v0.2 contains sections 1–40, and Technical Architecture Specification v0.1 contains sections 1–87. They originated in [Create Concurrency Simulator](https://chatgpt.com/c/6ac50fdb-3528-83e8-bde2-2b5f39fa14bd). Later project decisions are recorded below rather than rewriting these reference specifications.

The references describe future modes and resources. Their presence in the roadmap does not expand the current implementation scope.

## Current implementation scope

- React and TypeScript lesson interface with a framework-independent simulation engine.
- Worker, SharedVariable, LockResource, Instruction, SimulationEvent, Simulation, replaceable Scheduler, and SimulationController.
- Worker definitions initialize independent worker programs and state through `createWorker`. A typed, replaceable instruction-handler registry executes operations independently of scheduling; reset constructs fresh executors as well as fresh simulation state.
- READ_SHARED, CALCULATE, WRITE_SHARED, FINISH, ACQUIRE_LOCK, RELEASE_LOCK, QUEUE_PUT, and QUEUE_GET.
- Package identity, shared unbounded FIFO QueueResource, ownership transfer, and numeric or package-reference worker locals. Queue GET leaves unfinished task accounting unchanged: receiving work is not completing it.
- One Next Step executes one instruction, including an unsuccessful lock acquisition or empty-queue GET.
- Only READY workers can be selected. A blocked acquire or GET keeps its instruction pointer unchanged.
- Releasing a lock wakes an eligible waiting worker from BLOCKED to READY. The worker acquires the lock only when scheduled to try again.
- Structured event history, detached snapshots, and reset by constructing a fresh simulation.
- The queue lesson shows filling and draining an unbounded queue. The empty-queue lesson shows a consumer block at GET, a producer PUT waking it READY without assigning work, and a later consumer turn retrying the same GET.
- Bounded queues, package processing, completion instructions, semaphores, Playground, Code Lab, backend, accounts, and persistence remain outside these prototypes.

## Lesson contract

The counter starts at 10. Two threads each increment it once; the expected result is 12.

Without a lock, the scripted sequence is A reads 10, B reads 10, A calculates 11, B calculates 11, A writes 11, B writes 11. Both threads then finish. The actual result is 11, produced by the engine.

With a lock, A acquires it and B becomes BLOCKED when attempting acquisition. A reads, calculates, writes 11, and releases the lock. B becomes READY, then acquires the lock on a subsequent scheduler selection. B reads 11, calculates and writes 12, and releases the lock. Both threads finish with the counter at 12.

The learner proceeds through problem, prediction, stepped unsafe execution, race explanation, lock introduction, stepped safe execution, and before/after comparison. Worker, counter, and lock inspectors expose engine state. Python highlighting and event explanations follow the executed instruction.

The read–calculate–write expansion is a conceptual teaching model, not a claim about exact CPython bytecode or interpreter scheduling.

## Later decisions from this chat

- Keep the original factory visual design. Place live commentary and expandable history below the code on desktop, using the spare left-column space. On mobile, place commentary between the factory and its controls. Object inspectors expand inside the factory panel again, following the user’s preference to restore their original placement. Tighten headings and spacing during simulation runs instead of redesigning the page. Cap the Python code viewport at 320 pixels on desktop and 280 pixels on phone widths; longer programs scroll within it. Follow highlighted instructions inside that viewport without moving the page.
- Keep every main lesson action in one fixed bar at the bottom of the viewport. Continuing to a new lesson section returns the page to the top after rendering. Section navigation unlocks after reaching the bottom, or immediately when all content fits on screen. Each new section resets the reading requirement. Factory Next Step and phase controls stay near the scene and preserve the current view; they do not require repeated scrolling. Continue also waits for a required prediction or completion of the factory run.
- Emphasize the active worker through a slightly larger character, stronger color, an operation label, and read/write direction cues.
- Name each worker’s private copy `local_counter`, replacing the earlier `temp`. The original specifications retain their historical wording.
- The working project has moved to Documents → Fall 2026 → concurrency-factory.

## Implementation map

| Location | Responsibility |
| --- | --- |
| `src/simulation/` | Domain types, scenarios, scheduling, instruction execution, state and events |
| `src/lesson/presentation.ts` | Lesson stages and learner-facing explanations |
| `src/App.tsx` | Chooses the three lessons; supports `?lesson=counter`, `?lesson=queue`, and `?lesson=empty-queue` |
| `src/CounterLesson.tsx` and `src/QueueLesson.tsx` | Lesson rendering and engine controls |
| `src/lesson/queue-presentation.ts` | Queue lesson stages and event-derived outcomes |
| `src/styles.css` | Visual design, worker emphasis and bottom action bar |
| `tests/simulation.test.ts` | Engine behavior, unsafe/safe outcomes, lock transitions, scheduling and reset |
| `tests/instructions.test.ts` | Independent instruction execution, handler replacement, worker isolation and general programs |

## Running and verifying

From the project folder, run `npm run dev` to start the local app, `npm test` to run the engine tests, and `npm run build` to check types and build production assets. The latest verification passed 43 engine, translation, and presentation tests and the production build. Browser walkthroughs verified queue predictions, fill/drain order, ownership inspection, reset, the original counter comparison, and the fixed bottom action bar at desktop and 390-pixel widths.


## Next development step

Technical Architecture Specification v0.1, section 82, lists generalizing Worker and instruction execution before adding QueueResource. That foundation step is now complete.

Vertical Slice 02 is now implemented. It adds a queue as a conveyor belt, identifiable packages entering and leaving in FIFO order, and source highlighting for Python `put()` and `get()`. The producer adds A, B, C, then the consumer takes A, B, C. The learner predicts the first package, steps through both phases, and compares their prediction with event-derived results.

All three prototypes are reachable through the lesson selector. The default opening lesson is the queue prototype; `?lesson=counter` opens the original counter lesson directly. Switching lessons starts the selected lesson fresh.

Vertical Slice 03 is now implemented as “What if the Queue Is Empty?” It uses one package and a consumer-first schedule. The lesson follows problem → prediction → blocked consumer → producer wake-up and later receipt → discovery. A dedicated consumer status panel, thread badges, Python highlighting, object inspector, and event history distinguish BLOCKED, READY, and received. Reset clears both blocked and awakened states. The scenario runs through the existing engine with no concurrency logic in React.

Browser verification covered an incorrect prediction retained in the comparison, BLOCKED at the same GET line, wake-up without receiving, receipt on the next turn, complete event history, reset, lesson switching, and desktop/mobile layouts. Conveyor motion is driven by completed queue events and respects reduced-motion preferences.

The default blocking behavior was checked against [Python Queue.get documentation](https://docs.python.org/3/library/queue.html#queue.Queue.get). The model shows discrete teaching steps rather than an exact runtime trace of Python internals.

The guided queue editor is now implemented. It supports renaming packages, changing PUT order, and adding 1–12 packages through a restricted Python-to-instruction translator. Quoted names, blank lines, and comments are accepted; unsupported code returns a line-specific error without replacing the active run. Consumer GET calls are generated to match the producer. Duplicate labels keep unique package IDs. Reset restores A/B/C. The 12-package exercise limit does not make the queue bounded. Longer queues scroll horizontally on the conveyor. Access the exercise through Edit packages in the queue lesson or `?lesson=queue&exercise=edit`. This focused exercise does not implement general-purpose Python execution or the broader Code Lab. Keep package processing, bounded-queue backpressure, Semaphore, Playground, and broader Code Lab in the later development sequence.

Latest navigation and layout checks verified bottom-of-page unlocking, re-locking on the next section, automatic unlocking when the whole page fits, local simulation and phase changes without scrolling to the top, reset, and complete counter/lock and FIFO walkthroughs at desktop and phone widths.

Queue, package, worker, and counter inspectors retain their original factory-panel placement. The FIFO example exceeds the code viewport; its last GET line remains visible through internal scrolling while the page stays in place.

Guided editor validation covered source-line mapping, escapes and Unicode, duplicate package names, 1 and 12 packages, invalid statements, engine receiving order, and reset. Browser checks covered a four-package custom run, validation retaining that run, generated source highlighting, results, original reset, and phone-width queue scrolling.

All three lessons now have focused editing exercises. Counter settings generate two separate source-linked thread bodies and drive the independent engine; the same numbers are used in the Lock comparison. Empty-queue editing uses the shared restricted PUT translator with a consumer-first script. The first GET blocks; the first PUT wakes the consumer without taking an item; subsequent scheduled GETs receive all edited packages in FIFO order. Auto-indentation is shared by both producer editors. New tests cover unequal increments, starting-count limits, source mapping, Lock blocking, reset, 1–12 packages, and wake-up without receipt. The original product and architecture specifications remain unchanged.
