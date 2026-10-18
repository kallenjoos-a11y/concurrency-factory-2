# Something Went Wrong With Our Counter

Core lesson 4 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Trace a lost update through shared reads, private calculations, and overlapping writes.

Prerequisites: Threads and private versus shared state.

Misconception to address: counter += 1 must behave as one indivisible action, or one correct run proves safety.

## 1 Meet the problem

Our whiteboard already counts 10 completed packages. Two workers finish one more each and update the same counter. We expect 12.

Learner action: Make a prediction.

## 2 Make a prediction

In this run both workers read before either writes. What final counter do you predict?

- 10
- 11
- 12

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

Watch both private copies before any write. Then watch the second write overwrite the first. Try a different valid order with the same code.

Starting run: Overlapping updates.

```python
counter = 10

def finish_package():
    global counter
    counter += 1
```

Evidence checkpoints:

- Both workers read 10.
- Both independently calculate 11.
- Both write 11, so one update is lost.
- A serial order produces 12 with the same unsafe code.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

A race condition makes correctness depend on execution order. The overlapping run loses an update. A different schedule happens to count both; that successful run does not protect future runs.

Comparison action: Try a different execution order.

Second run: Same code, serial order. Use a fresh simulation; preserve the first run’s observed result.

```python
counter = 10

def finish_package():
    global counter
    counter += 1
```

Python connection: We expose counter += 1 as conceptual read, calculate, and write operations. This is a teaching model rather than an exact CPython trace. The code has no synchronization.

## 5 Try it yourself

Change the starting count and each worker’s increase. Predict the expected total and which increase disappears in the B-writes-last schedule.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

The same unprotected code produced the right count once. Is it now safe from lost updates?

- Yes, the correct result proves safety
- No, another order can still lose an update

Correct answer: No, another order can still lose an update

Feedback: Correctness on one schedule does not establish correctness on other schedules. The next lesson protects the update.

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
