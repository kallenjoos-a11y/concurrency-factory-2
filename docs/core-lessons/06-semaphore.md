# One Key Is Slowing Us Down

Core lesson 6 of 6. A guided lesson for learners who know basic Python and are new to concurrency.

## Learning objective

Distinguish one-owner exclusion from a limit of N concurrent resource users.

Prerequisites: Locks, blocking, and independent package processing.

Misconception to address: A Semaphore permits unrestricted access, or three permits make a shared counter update safe.

## 1 Meet the problem

Four workers need to use three machines. One Lock lets only one worker enter, leaving two machines unused. We need a limit that matches the available machines.

Learner action: Make a prediction.

## 2 Make a prediction

With one shared Lock around all three machines, how many workers can hold access at once?

- One
- Three
- Four

Keep the learner’s choice for the results comparison. Do not mark a prediction wrong before execution.

## 3 Investigate

Start with the one-key run. Then use three machine permits: A, B, and C acquire; D blocks. When A releases, D becomes READY before acquiring its own permit.

Starting run: One shared Lock.

```python
import threading

machines = threading.Lock()

def worker(item):
    with machines:
        process(item)
```

Evidence checkpoints:

- One Lock allows one holder.
- Three permits allow at most three holders.
- The fourth worker blocks when no permits remain.
- Release wakes a waiter without assigning a permit.
- All packages finish with every permit returned.

Next Step executes one engine instruction or attempted operation. It does not represent elapsed time. Synchronize the highlighted Python line, active worker, visible resource states, private values, and event explanation. A failed resource attempt leaves the worker at the same instruction.

## 4 Explain and compare

A Semaphore limits concurrent access to a resource pool. Three permits allow three workers to use machines. It is not a replacement for exclusive protection of a counter update.

Comparison action: Use three machine permits.

Second run: 3 machine permits. Use a fresh simulation; preserve the first run’s observed result.

```python
import threading

machines = threading.Semaphore(3)

def worker(item):
    with machines:
        process(item)
```

Python connection: machines = threading.Semaphore(3) defines three permits. with machines: holds one permit during process(item) and releases it on leaving. This model counts access; it does not assign individual machine identities.

## 5 Try it yourself

Change permits from one to three while keeping four workers. Predict the peak holders and which workers must wait.

Before each edited run, ask the learner to predict the changed behavior. Apply changes only on Run my version. Invalid edits retain the current valid run. Reset restores the current scenario; Reset original in an editor restores the lesson defaults.

Check understanding:

Two workers enter a shared counter update under Semaphore(3). Is that update mutually exclusive?

- Yes, any Semaphore prevents overlap
- No, up to three workers may enter together

Correct answer: No, up to three workers may enter together

Feedback: Use one shared Lock for an exclusive counter update. Multiple permits are appropriate for a pool of independently usable resources.

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
