# One Worker Isn’t Enough

Core lesson 1 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Distinguish sequential work from overlapping progress by independent threads, without assuming automatic speedups.

Prerequisites: Python variables and functions.

Misconception to address: A second worker must wait until the first worker finishes everything, or adding threads always makes any program faster.

## 1 Meet the problem

Four packages need processing. One worker starts and finishes each package before moving to the next. What changes when we give half the work to a second worker?

Learner action: Make a prediction.

## 2 Make a prediction

With just one worker, can it start a second package while it is still processing the first?

- No, it finishes its current package first
- Yes, it processes both at once

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

Watch the processing start and finish separately. In the second run, look for two packages in progress at the same time. Each step is a teaching operation, not a unit of elapsed time.

Starting run: 1 worker.

```python
import threading

# process() represents independent package work

def worker_a():
    process("Package A")
    process("Package B")
    process("Package C")
    process("Package D")

thread_a = threading.Thread(target=worker_a)
thread_a.start()
```

Evidence checkpoints:

- One worker never has two packages in progress.
- Two workers can each have their own package in progress.
- Each package is completed exactly once in both runs.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

A thread is a flow of execution. Two threads can make overlapping progress on independent work. This model demonstrates concurrency; it does not establish that two threads execute Python simultaneously or that every workload becomes faster.

Comparison action: Give half the work to a second thread.

Second run: 2 workers. Use a fresh simulation; preserve the first run’s observed result.

```python
import threading

# process() represents independent package work

def worker_a():
    process("Package A")
    process("Package C")

def worker_b():
    process("Package B")
    process("Package D")

thread_a = threading.Thread(target=worker_a)
thread_a.start()
thread_b = threading.Thread(target=worker_b)
thread_b.start()
```

Python connection: Each worker body calls process(). Thread creation and start() arrange for those bodies to run as threads; calling a function by itself does not create a thread. The startup lines create and start each thread; process() is the conceptual package-work function.

## 5 Try it yourself

Change the number of workers and packages. Predict the largest number of packages in progress. Keep track of which worker owns each package.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

Worker A is still processing its package. Does that alone require independent Worker B to wait?

- Yes, all threads must wait together
- No, B can make progress on its own work

Correct answer: No, B can make progress on its own work

Feedback: Independent threads can make overlapping progress. A dependency or shared resource may introduce waiting, but A being busy alone does not.

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
