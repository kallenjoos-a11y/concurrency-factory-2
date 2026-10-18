# Where Does the Work Wait?

Core lesson 2 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Predict FIFO receiving order and distinguish queued work from an item owned by a consumer.

Prerequisites: Threads can make independent progress.

Misconception to address: A queue sorts packages by their names, or receiving a package means processing is complete.

## 1 Meet the problem

Producer has packages A, B, and C. Consumer is not taking work yet. The work needs a shared place to wait.

Learner action: Make a prediction.

## 2 Make a prediction

Producer adds A, then B, then C. Which package will Consumer receive first?

- Package A
- Package B
- Package C

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

Step through the puts first, then the gets. Watch the next-out end of the conveyor and Consumer’s private item variable.

Starting run: Producer then Consumer.

```python
from queue import Queue

jobs = Queue()

def producer():
    jobs.put("Package A")
    jobs.put("Package B")
    jobs.put("Package C")

def consumer():
    item = jobs.get()
    item = jobs.get()
    item = jobs.get()
```

Evidence checkpoints:

- PUT adds an item to the queue.
- GET removes the oldest waiting item.
- A received package belongs to Consumer; receiving is not processing.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

A Queue holds waiting work. FIFO means first in, first out: arrival order determines receiving order, not alphabetical order or processing speed.

Python connection: Queue() creates the shared queue, jobs.put(name) adds one item, and item = jobs.get() takes one. This lesson does not process the received items.

## 5 Try it yourself

Rename, reorder, and add packages. Predict the first item and full receiving order before running your version.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

Producer adds Z, then A. What comes out first?

- A, because the queue sorts names
- Z, because it arrived first

Correct answer: Z, because it arrived first

Feedback: The queue preserves arrival order. Labels do not determine priority.

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
