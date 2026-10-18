export type CoreLessonId = 'threads' | 'queue' | 'empty-queue' | 'race' | 'lock' | 'semaphore';
export interface LessonPlan {
  id: CoreLessonId; title: string; short: string; objective: string; prerequisite: string; misconception: string;
  problem: string; prediction: string; choices: string[]; investigation: string; checkpoints: string[];
  discovery: string; pythonConnection: string; experiment: string;
  exit: { question: string; choices: string[]; answer: number; explanation: string };
  compare?: string;
}
export const coreLessons: LessonPlan[] = [
  {
    id: 'threads', title: "One Worker Isn’t Enough", short: 'Threads',
    objective: 'Distinguish sequential work from overlapping progress by independent threads, without assuming automatic speedups.',
    prerequisite: 'Python variables and functions.', misconception: 'A second worker must wait until the first worker finishes everything, or adding threads always makes any program faster.',
    problem: 'Four packages need processing. One worker starts and finishes each package before moving to the next. What changes when we give half the work to a second worker?',
    prediction: 'With just one worker, can it start a second package while it is still processing the first?', choices: ['No, it finishes its current package first', 'Yes, it processes both at once'],
    investigation: 'Watch the processing start and finish separately. In the second run, look for two packages in progress at the same time. Each step is a teaching operation, not a unit of elapsed time.',
    checkpoints: ['One worker never has two packages in progress.', 'Two workers can each have their own package in progress.', 'Each package is completed exactly once in both runs.'],
    discovery: 'A thread is a flow of execution. Two threads can make overlapping progress on independent work. This model demonstrates concurrency; it does not establish that two threads execute Python simultaneously or that every workload becomes faster.',
    pythonConnection: 'Each worker body calls process(). Thread creation and start() arrange for those bodies to run as threads; calling a function by itself does not create a thread. The startup lines create and start each thread; process() is the conceptual package-work function.',
    experiment: 'Change the number of workers and packages. Predict the largest number of packages in progress. Keep track of which worker owns each package.',
    compare: 'Give half the work to a second thread',
    exit: { question: 'Worker A is still processing its package. Does that alone require independent Worker B to wait?', choices: ['Yes, all threads must wait together', 'No, B can make progress on its own work'], answer: 1, explanation: 'Independent threads can make overlapping progress. A dependency or shared resource may introduce waiting, but A being busy alone does not.' },
  },
  {
    id: 'queue', title: 'Where Does the Work Wait?', short: 'The Queue',
    objective: 'Predict FIFO receiving order and distinguish queued work from an item owned by a consumer.', prerequisite: 'Threads can make independent progress.', misconception: 'A queue sorts packages by their names, or receiving a package means processing is complete.',
    problem: 'Producer has packages A, B, and C. Consumer is not taking work yet. The work needs a shared place to wait.',
    prediction: 'Producer adds A, then B, then C. Which package will Consumer receive first?', choices: ['Package A', 'Package B', 'Package C'],
    investigation: 'Step through the puts first, then the gets. Watch the next-out end of the conveyor and Consumer’s private item variable.',
    checkpoints: ['PUT adds an item to the queue.', 'GET removes the oldest waiting item.', 'A received package belongs to Consumer; receiving is not processing.'],
    discovery: 'A Queue holds waiting work. FIFO means first in, first out: arrival order determines receiving order, not alphabetical order or processing speed.',
    pythonConnection: 'Queue() creates the shared queue, jobs.put(name) adds one item, and item = jobs.get() takes one. This lesson does not process the received items.',
    experiment: 'Rename, reorder, and add packages. Predict the first item and full receiving order before running your version.',
    exit: { question: 'Producer adds Z, then A. What comes out first?', choices: ['A, because the queue sorts names', 'Z, because it arrived first'], answer: 1, explanation: 'The queue preserves arrival order. Labels do not determine priority.' },
  },
  {
    id: 'empty-queue', title: 'There’s Nothing on the Conveyor', short: 'Empty Queue',
    objective: 'Explain empty-queue blocking and distinguish waking READY from actually receiving an item.', prerequisite: 'PUT, GET, and FIFO.', misconception: 'An empty GET returns an empty item, stops the whole program, or a woken consumer already owns the item.',
    problem: 'Consumer gets the first turn. Producer has a package ready but has not put it on the conveyor. The shared queue is empty.',
    prediction: 'What will the default jobs.get() do when the queue is empty?', choices: ['Return an empty item', 'Wait for work', 'Stop the entire program'],
    investigation: 'First let Consumer attempt GET. Then let Producer PUT. Inspect the queue and private item before Consumer gets another turn.',
    checkpoints: ['Empty GET blocks Consumer at the same instruction.', 'Producer can still run.', 'PUT makes Consumer READY without taking the package.', 'A later GET retries and receives the item.'],
    discovery: 'Blocking pauses the thread that needs a resource. It does not pause every thread. READY means eligible to run, not already running or already holding an item.',
    pythonConnection: 'By default jobs.get() waits when the queue is empty. Producer’s jobs.put() supplies work, allowing the waiting consumer to try again when scheduled.',
    experiment: 'Add more boxes while preserving a consumer-first start. Predict what changes after the first PUT and which box is taken on the later GET.',
    exit: { question: 'Producer just added a box and Consumer changed from BLOCKED to READY. Where is the box now?', choices: ['Still in the queue until Consumer runs GET', 'Already in Consumer’s private item'], answer: 0, explanation: 'Wake-up changes eligibility to run. Receipt happens only when GET executes successfully.' },
  },
  {
    id: 'race', title: 'Something Went Wrong With Our Counter', short: 'Race Conditions',
    objective: 'Trace a lost update through shared reads, private calculations, and overlapping writes.', prerequisite: 'Threads and private versus shared state.', misconception: 'counter += 1 must behave as one indivisible action, or one correct run proves safety.',
    problem: 'Our whiteboard already counts 10 completed packages. Two workers finish one more each and update the same counter. We expect 12.',
    prediction: 'In this run both workers read before either writes. What final counter do you predict?', choices: ['10', '11', '12'],
    investigation: 'Watch both private copies before any write. Then watch the second write overwrite the first. Try a different valid order with the same code.',
    checkpoints: ['Both workers read 10.', 'Both independently calculate 11.', 'Both write 11, so one update is lost.', 'A serial order produces 12 with the same unsafe code.'],
    discovery: 'A race condition makes correctness depend on execution order. The overlapping run loses an update. A different schedule happens to count both; that successful run does not protect future runs.',
    pythonConnection: 'We expose counter += 1 as conceptual read, calculate, and write operations. This is a teaching model rather than an exact CPython trace. The code has no synchronization.',
    experiment: 'Change the starting count and each worker’s increase. Predict the expected total and which increase disappears in the B-writes-last schedule.',
    compare: 'Try a different execution order',
    exit: { question: 'The same unprotected code produced the right count once. Is it now safe from lost updates?', choices: ['Yes, the correct result proves safety', 'No, another order can still lose an update'], answer: 1, explanation: 'Correctness on one schedule does not establish correctness on other schedules. The next lesson protects the update.' },
  },
  {
    id: 'lock', title: 'One Key to the Whiteboard', short: 'Locks',
    objective: 'Explain why the whole read–calculate–write update needs mutual exclusion, including BLOCKED to READY transitions.', prerequisite: 'Race conditions and lost updates.', misconception: 'Lock only the final write, or releasing a lock immediately gives it to the waiting thread.',
    problem: 'The last lesson lost an update. Keep the same two workers and completed packages, but protect the entire update with one shared key.',
    prediction: 'Thread A holds counter_lock. What happens when Thread B tries to enter the same protected update?', choices: ['B also takes the key', 'B waits while A holds the key', 'The counter automatically increases'],
    investigation: 'The first run uses the Lock. Watch B block, A update and release, B become READY, and B acquire on a later turn. Compare it with the same work without protection.',
    checkpoints: ['Only one worker owns the Lock.', 'B blocks before reading shared state.', 'Release makes B READY but does not grant ownership.', 'B later reads A’s updated value and the final count is 12.'],
    discovery: 'A critical section is the code protected by the Lock. Here it includes reading, calculating, and writing. Waiting keeps conflicting updates from overlapping.',
    pythonConnection: 'counter_lock = threading.Lock() creates the shared Lock. with counter_lock: acquires it before the update and releases it afterward. Every writer must use the same Lock.',
    experiment: 'Change the starting count and increases. Run the same work without and with the Lock, then compare the expected and actual totals.',
    compare: 'Compare with the same work without a Lock',
    exit: { question: 'Both threads read the old count outside the Lock, then lock only their writes. Is the whole update protected?', choices: ['Yes, protecting the writes is enough', 'No, both can still calculate from the same old count'], answer: 1, explanation: 'The whole read–calculate–write sequence must be protected. Locking only the final write does not prevent stale reads.' },
  },
  {
    id: 'semaphore', title: 'One Key Is Slowing Us Down', short: 'Semaphores',
    objective: 'Distinguish one-owner exclusion from a limit of N concurrent resource users.', prerequisite: 'Locks, blocking, and independent package processing.', misconception: 'A Semaphore permits unrestricted access, or three permits make a shared counter update safe.',
    problem: 'Four workers need to use three machines. One Lock lets only one worker enter, leaving two machines unused. We need a limit that matches the available machines.',
    prediction: 'With one shared Lock around all three machines, how many workers can hold access at once?', choices: ['One', 'Three', 'Four'],
    investigation: 'Start with the one-key run. Then use three machine permits: A, B, and C acquire; D blocks. When A releases, D becomes READY before acquiring its own permit.',
    checkpoints: ['One Lock allows one holder.', 'Three permits allow at most three holders.', 'The fourth worker blocks when no permits remain.', 'Release wakes a waiter without assigning a permit.', 'All packages finish with every permit returned.'],
    discovery: 'A Semaphore limits concurrent access to a resource pool. Three permits allow three workers to use machines. It is not a replacement for exclusive protection of a counter update.',
    pythonConnection: 'machines = threading.Semaphore(3) defines three permits. with machines: holds one permit during process(item) and releases it on leaving. This model counts access; it does not assign individual machine identities.',
    experiment: 'Change permits from one to three while keeping four workers. Predict the peak holders and which workers must wait.',
    compare: 'Use three machine permits',
    exit: { question: 'Two workers enter a shared counter update under Semaphore(3). Is that update mutually exclusive?', choices: ['Yes, any Semaphore prevents overlap', 'No, up to three workers may enter together'], answer: 1, explanation: 'Use one shared Lock for an exclusive counter update. Multiple permits are appropriate for a pool of independently usable resources.' },
  },
];
export function getCoreLesson(id: CoreLessonId) { return coreLessons.find(lesson => lesson.id === id)!; }
