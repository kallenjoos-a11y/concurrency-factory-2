# One Key to the Whiteboard

Core lesson 5 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Explain why the whole read–calculate–write update needs mutual exclusion, including BLOCKED to READY transitions.

Prerequisites: Race conditions and lost updates.

Misconception to address: Lock only the final write, or releasing a lock immediately gives it to the waiting thread.

## 1 Meet the problem

The last lesson lost an update. Keep the same two workers and completed packages, but protect the entire update with one shared key.

Learner action: Make a prediction.

## 2 Make a prediction

Thread A holds counter_lock. What happens when Thread B tries to enter the same protected update?

- B also takes the key
- B waits while A holds the key
- The counter automatically increases

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

The first run uses the Lock. Watch B block, A update and release, B become READY, and B acquire on a later turn. Compare it with the same work without protection.

Starting run: With Lock.

```python
import threading

counter = 10
counter_lock = threading.Lock()

def finish_package():
    global counter
    with counter_lock:
        counter += 1
```

Evidence checkpoints:

- Only one worker owns the Lock.
- B blocks before reading shared state.
- Release makes B READY but does not grant ownership.
- B later reads A’s updated value and the final count is 12.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

A critical section is the code protected by the Lock. Here it includes reading, calculating, and writing. Waiting keeps conflicting updates from overlapping.

Comparison action: Compare with the same work without a Lock.

Second run: Without Lock. Use a fresh simulation; preserve the first run’s observed result.

```python
counter = 10

def finish_package():
    global counter
    counter += 1
```

Python connection: counter_lock = threading.Lock() creates the shared Lock. with counter_lock: acquires it before the update and releases it afterward. Every writer must use the same Lock.

## 5 Try it yourself

Change the starting count and increases. Run the same work without and with the Lock, then compare the expected and actual totals.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

Both threads read the old count outside the Lock, then lock only their writes. Is the whole update protected?

- Yes, protecting the writes is enough
- No, both can still calculate from the same old count

Correct answer: No, both can still calculate from the same old count

Feedback: The whole read–calculate–write sequence must be protected. Locking only the final write does not prevent stale reads.

A learner completes the lesson after the guided run and any comparison, reading the final section, and correctly answering this transfer question. Experiments can be repeated.

## Acceptance criteria

- The demonstrated state and outcome come from the framework-independent simulation engine.
- Each evidence checkpoint can be observed in the factory, Python, inspector, or event history.
- Predicted and observed results remain distinct.
- Local factory steps keep the page position; section navigation returns to the top.
- Continue stays at the bottom and unlocks after reaching the page bottom and meeting the section requirements.
- Python is internally scrollable; inspectors remain in the factory panel.
- Worker states and waiting reasons are written in text, not conveyed by color alone.
- Reset reconstructs worker, resource, package, and event state deterministically.
- The next lesson is reachable after completion.

## Implementation references

Content: src/lesson/core-curriculum.ts. Scenarios: src/simulation/core-programs.ts and existing queue/counter scenarios. Shared screen: src/CoreLesson.tsx. Verification: tests/core-course.test.ts plus existing engine tests.

Python reference: [threading](https://docs.python.org/3/library/threading.html) and [queue](https://docs.python.org/3/library/queue.html). The simulator implements a constrained teaching model rather than running arbitrary Python.
