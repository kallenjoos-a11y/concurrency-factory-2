import { useRef, useState } from 'react';
import { indentProducerKey } from './components/ProducerEditor.tsx';
import LessonHeader from './components/LessonHeader.tsx';
import type { LessonId } from './components/LessonHeader.tsx';
import QueueFactory from './components/QueueFactory.tsx';
import CodeViewport from './components/CodeViewport.tsx';
import FactoryControls from './components/FactoryControls.tsx';
import LessonAdvanceButton from './components/LessonAdvanceButton.tsx';
import { compileQueueProgram, originalQueueBody, QueueProgramError } from './simulation/queue-program.ts';
import { SimulationController } from './simulation/controller.ts';
import { describeEvent, operationLabel, packageName, visibleEvents } from './lesson/presentation.ts';
import { receivedPackages } from './lesson/queue-presentation.ts';

export default function QueueExperiment({ onSwitch, onBack, empty = false }: { empty?: boolean; onSwitch: (lesson: LessonId) => void; onBack: () => void }) {
  const initialBody = empty ? '    jobs.put("Package A")' : originalQueueBody;
  const compile = (body: string) => compileQueueProgram(body, empty);
  const [program, setProgram] = useState(() => compile(initialBody));
  const controller = useRef(new SimulationController(program.scenario));
  const [snapshot, setSnapshot] = useState(() => controller.current.snapshot());
  const [draft, setDraft] = useState(initialBody);
  const [editing, setEditing] = useState(true);
  const [phase, setPhase] = useState<'WAIT' | 'FILL' | 'DRAIN'>(empty ? 'WAIT' : 'FILL');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const received = receivedPackages(snapshot);
  const filled = snapshot.queues[0].items.length === snapshot.packages.length;
  const finished = snapshot.status === 'FINISHED';
  const highlight = snapshot.lastInstruction?.type === 'FINISH' ? null : snapshot.lastInstruction?.sourceLocation.line;
  const activeName = snapshot.workers.find(worker => worker.id === snapshot.activeWorkerId)?.name;

  function runMyVersion() {
    try {
      const next = compile(draft);
      controller.current = new SimulationController(next.scenario);
      setProgram(next); setSnapshot(controller.current.snapshot()); setPhase(empty ? 'WAIT' : 'FILL');
      setEditing(false); setError(null); setSelected(null); setHistoryOpen(false);
    } catch (issue) {
      if (!(issue instanceof QueueProgramError)) throw issue;
      setError(`${issue.line ? `lesson.py, line ${issue.line}: ` : ''}${issue.message}`);
    }
  }
  function resetOriginal() {
    const original = compile(initialBody);
    controller.current = new SimulationController(original.scenario);
    setProgram(original); setDraft(initialBody); setSnapshot(controller.current.snapshot());
    setPhase(empty ? 'WAIT' : 'FILL'); setEditing(true); setError(null); setSelected(null); setHistoryOpen(false);
  }
  function stepFactory() {
    if (phase === 'WAIT') { setSnapshot(controller.current.nextStep()); setPhase('FILL'); }
    else if (phase === 'FILL' && filled) setPhase('DRAIN');
    else setSnapshot(controller.current.nextStep());
  }
  const explanation = empty && !snapshot.step ? 'The queue starts empty. Try get() first: Consumer will wait while Producer is free to add your packages.' : snapshot.workers[1].state === 'BLOCKED' ? 'Consumer tried get() on the empty queue and is BLOCKED. Producer can still add your packages.' : empty && snapshot.lastInstruction?.type === 'QUEUE_PUT' && snapshot.step === 2 ? 'The first package made Consumer READY. It has not taken a package yet. Keep adding work, then let Consumer run.' : !snapshot.step ? `Your producer has ${snapshot.packages.length} package${snapshot.packages.length === 1 ? '' : 's'}. Use Next Step to add them in the order you wrote the put() lines.`
    : snapshot.lastInstruction?.type === 'QUEUE_PUT' ? `${activeName} added ${packageName(snapshot, snapshot.lastInstruction.packageId)}. The queue holds it until the consumer gets a turn.`
    : snapshot.lastInstruction?.type === 'QUEUE_GET' ? `${activeName} received ${packageName(snapshot, String(snapshot.workers[1].localVariables.item))}. It was the oldest waiting package.`
    : finished ? `All ${received.length} package${received.length === 1 ? '' : 's'} were received in your arrival order.` : `${activeName} finished its part of this run.`;

  return <div className="app-shell is-stepping queue-experiment">
    <LessonHeader lesson={empty ? 'empty-queue' : 'queue'} onSwitch={onSwitch} onRestart={resetOriginal}/>
    <main>
      <div className="lesson-topline"><span><span className="small-square"/> THE QUEUE / TRY YOUR OWN CODE</span><span>GUIDED EXERCISE</span></div>
      <h1>{empty ? 'Start empty.' : 'Your queue.'}<br/>{empty ? 'Add your work' : 'Your work'}<span className="accent-dot">.</span></h1>
      <section className="lesson-card"><div className="lesson-copy"><div className="eyebrow">{editing ? 'EDIT THE PRODUCER' : finished ? 'YOUR RESULTS' : phase === 'FILL' ? 'LET YOUR PRODUCER RUN' : phase === 'WAIT' ? 'TRY THE EMPTY QUEUE' : 'LET YOUR CONSUMER RUN'}</div><h2>{editing ? 'Change the work. Watch the order.' : finished ? empty ? 'Waiting paused one thread.' : 'Your code set the receiving order.' : 'One queue operation at a time.'}</h2><p>{editing ? `Rename packages, reorder the put() lines, or add more. ${empty ? 'Consumer will try the empty queue first and wait for your work. ' : ''}Each line adds one package. We match the number of consumer get() calls for you. Run my version starts a fresh stepped run.` : finished ? empty ? 'Consumer waited on the empty queue. Your first put() made it READY; only a later turn took a package. Every extra box then came out in arrival order. Edit and try again, or reset to the original example.' : 'The first item you added was the first item received. Edit your packages to try a different order, or reset to restore the original example.' : 'Step through your version beside the factory. Then let the consumer take the waiting work. Reset restores the original example.'}</p></div><span className="mode-chip safe">{editing ? '1–12 PACKAGES' : `${snapshot.packages.length} PACKAGES`}</span></section>
      <div className="workspace queue-workspace">
        <div className="code-panel"><div className="panel-heading"><span className="file-icon">⌘</span><span>lesson.py</span><span className="panel-meta">{editing ? 'EDIT PRODUCER' : 'YOUR VERSION'}</span>{!editing && <button className="edit-packages" onClick={() => setEditing(true)}>Edit packages</button>}</div>
          {editing ? <div className="queue-editor"><pre className="editor-context">{'from queue import Queue\n\njobs = Queue()\n\ndef producer():'}</pre><label htmlFor="producer-code">Producer put() lines · starts at line 6</label><textarea id="producer-code" aria-describedby="editor-help editor-error" value={draft} onKeyDown={event => { indentProducerKey(event, draft, setDraft); setError(null); }} onChange={event => { setDraft(event.target.value); setError(null); }} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off"/><p id="editor-help">Use <code>jobs.put("a package name")</code>. Names can be up to 40 characters. Duplicate names are separate packages. The consumer receives one item for each put() line.</p><p id="editor-error" className="editor-error" role="alert">{error}</p><div className="editor-actions"><button className="reset" onClick={resetOriginal}>↺ Reset original</button><button className="primary" onClick={runMyVersion}>Run my version <span>→</span></button></div>{snapshot.step > 0 && <button className="back-to-run" onClick={() => { setEditing(false); setError(null); }}>Back to the current run</button>}</div>
          : <CodeViewport label="Your Python queue program" activeLine={highlight} step={snapshot.step}>{program.python.map((line, i) => <div key={i} className={`code-line ${highlight === i + 1 ? 'highlight' : ''}`}><span className="line-number" aria-hidden="true">{i + 1}</span><code>{line || ' '}</code>{highlight === i + 1 && <span className="line-thread">{activeName}</span>}</div>)}</CodeViewport>}
          <div className="code-footnote"><span>ⓘ</span><p>{editing ? 'This guided editor supports put() lines with quoted names, blank lines, and comments. Changes apply when you run your version.' : 'The consumer program is generated to receive every package you added. Taking work and processing work are separate steps.'}</p></div>
        </div>
        <QueueFactory snapshot={snapshot} selected={selected} onSelect={setSelected}/>
        <div className="lesson-notes"><section className="execution" aria-label="Your queue run"><div className="current-event"><span className="event-icon">↳</span><div><span className="eyebrow">{editing ? 'EDITS APPLY ON RUN' : operationLabel(snapshot.lastInstruction?.type)}</span><p role="status" aria-live="polite">{editing ? snapshot.step ? 'The factory still shows your last run. Run my version starts again with the edited packages.' : 'The factory shows the original example until you run your version.' : explanation}</p></div></div></section>
          {finished && !editing && <section className="experiment-results" aria-label="Your receiving order"><span className="eyebrow">RECEIVED IN ORDER</span><ol>{received.map(id => <li key={id}>{packageName(snapshot, id)}</li>)}</ol><button className="secondary" onClick={() => setEditing(true)}>Edit and try again</button></section>}
          {!!snapshot.events.length && <section className="history-section"><button className="history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><span>{historyOpen ? '−' : '+'} Execution history</span><span>{visibleEvents(snapshot).length} events</span></button>{historyOpen && <ol className="timeline">{visibleEvents(snapshot).map(event => <li key={event.id}><span className="timeline-step">{String(event.step).padStart(2, '0')}</span><span>{describeEvent(event, snapshot)}</span></li>)}</ol>}</section>}
        </div>
        {!editing && <FactoryControls onStep={stepFactory} onReset={resetOriginal} finished={finished} completionMessage="Run complete. Edit packages to try again, or reset to the original example." label={phase === 'WAIT' ? 'Try get() on the empty queue' : phase === 'FILL' && filled ? 'Let the consumer run' : 'Next Step'} step={snapshot.step}/>}
      </div>
      <footer><span>Change a line. Follow the work.</span><span>CONCURRENCY FACTORY · GUIDED QUEUE EDITOR</span></footer>
    </main>
    <section className="lesson-actions" aria-label="Lesson navigation"><div className="lesson-actions-inner"><div className="action-context"><span className="eyebrow">QUEUE EXPERIMENT</span><span>{editing ? 'Edit your producer, then run it' : 'Your code drives the conveyor'}</span></div><LessonAdvanceButton onClick={onBack}>Back to lesson <span>←</span></LessonAdvanceButton></div></section>
  </div>;
}
