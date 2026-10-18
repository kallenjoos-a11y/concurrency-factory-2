# Concurrency Factory six core lessons

This course teaches threads, queues, blocking, shared-state races, Locks, and Semaphores through a continuous factory story. Each lesson uses Problem, Prediction, Investigation, Explanation and comparison, and Experiment with a transfer question.

1. [One Worker Isn’t Enough](01-threads.md)
2. [Where Does the Work Wait?](02-queue.md)
3. [There’s Nothing on the Conveyor](03-empty-queue.md)
4. [Something Went Wrong With Our Counter](04-race.md)
5. [One Key to the Whiteboard](05-lock.md)
6. [One Key Is Slowing Us Down](06-semaphore.md)

## Scope and lesson numbering

These six are the MVP selection from Product Specification v0.2. Core lessons 4, 5, and 6 correspond to full-roadmap lessons 5, 6, and 7. Bounded queues, thread join, task completion tracking, deadlock, and the integrated capstone remain later lessons. The original specifications remain unchanged.

## Shared lesson requirements

Every plan identifies an objective, prerequisite, misconception, prediction, observed checkpoints, Python connection, editable experiment, transfer question, and acceptance criteria. Comparison runs are used where they clarify the concept; the empty-queue lesson demonstrates normal waiting rather than inventing a broken program. Wrong predictions are retained as hypotheses. Exit questions provide feedback and allow retries.

## Engine boundaries

One engine supplies worker states, package ownership, shared values, Lock owners, Semaphore permits, and event history. React selects educational sections and renders engine snapshots; it never invents concurrency results. Processing begins and completes in separate conceptual operations, enabling visible overlapping progress without claiming an elapsed-time speedup. Semaphore ownership is intentionally tracked per worker in this teaching model; permits are not individual machine identities.
