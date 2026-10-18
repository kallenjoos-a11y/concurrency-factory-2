# There’s Nothing on the Conveyor

Core lesson 3 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Explain empty-queue blocking and distinguish waking READY from actually receiving an item.

Prerequisites: PUT, GET, and FIFO.

Misconception to address: An empty GET returns an empty item, stops the whole program, or a woken consumer already owns the item.

## 1 Meet the problem

Consumer gets the first turn. Producer has a package ready but has not put it on the conveyor. The shared queue is empty.

Learner action: Make a prediction.

## 2 Make a prediction

What will the default jobs.get() do when the queue is empty?

- Return an empty item
- Wait for work
- Stop the entire program

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

First let Consumer attempt GET. Then let Producer PUT. Inspect the queue and private item before Consumer gets another turn.

Starting run: Consumer arrives first.

```python
from queue import Queue

jobs = Queue()

def producer():
    jobs.put("Package A")

def consumer():
    item = jobs.get()
```

Evidence checkpoints:

- Empty GET blocks Consumer at the same instruction.
- Producer can still run.
- PUT makes Consumer READY without taking the package.
- A later GET retries and receives the item.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

Blocking pauses the thread that needs a resource. It does not pause every thread. READY means eligible to run, not already running or already holding an item.

Python connection: By default jobs.get() waits when the queue is empty. Producer’s jobs.put() supplies work, allowing the waiting consumer to try again when scheduled.

## 5 Try it yourself

Add more boxes while preserving a consumer-first start. Predict what changes after the first PUT and which box is taken on the later GET.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

Producer just added a box and Consumer changed from BLOCKED to READY. Where is the box now?

- Still in the queue until Consumer runs GET
- Already in Consumer’s private item

Correct answer: Still in the queue until Consumer runs GET

Feedback: Wake-up changes eligibility to run. Receipt happens only when GET executes successfully.

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
