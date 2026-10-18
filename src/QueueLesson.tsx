import CodeViewport from './components/CodeViewport.tsx';
import FactoryControls from './components/FactoryControls.tsx';
import { usePageRead } from './hooks/usePageRead.ts';
import LessonAdvanceButton from './components/LessonAdvanceButton.tsx';
import { useState } from 'react';
import LessonHeader from './components/LessonHeader.tsx';
import type { LessonId } from './components/LessonHeader.tsx';
import QueueFactory from './components/QueueFactory.tsx';
import QueueExperiment from './QueueExperiment.tsx';
import { SimulationController } from './simulation/controller.ts';
import { queuePython, queueScenario } from './simulation/queue-scenario.ts';
import { describeEvent, operationLabel, packageName, visibleEvents } from './lesson/presentation.ts';
import { queueStageContent, queueStageLabels, queueStages, queueStepExplanation, receivedPackages } from './lesson/queue-presentation.ts';
import type { QueueStage } from './lesson/queue-presentation.ts';
import { emptyQueueScenario, emptyQueuePython } from './simulation/empty-queue-scenario.ts';
import { emptyQueueStageContent, emptyQueueStageLabels, emptyQueuePredictions, emptyQueueExplanation } from './lesson/empty-queue-presentation.ts';

export default function QueueLesson({ onSwitch, variant = 'queue' }: { onSwitch: (lesson: LessonId) => void; variant?: 'queue' | 'empty-queue' }) {
  const emptyLesson = variant === 'empty-queue';
  const labels = emptyLesson ? emptyQueueStageLabels : queueStageLabels;
  const python = emptyLesson ? emptyQueuePython : queuePython;
  const choices = emptyLesson ? emptyQueuePredictions : null;
  const [controller] = useState(() => new SimulationController(emptyLesson ? emptyQueueScenario() : queueScenario()));
  const [snapshot, setSnapshot] = useState(() => controller.snapshot());
  const [stage, setStage] = useState<QueueStage>('PROBLEM');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [experiment, setExperiment] = useState(() => new URLSearchParams(window.location.search).get('exercise') === 'edit');
  const index = queueStages.indexOf(stage);
  const content = (emptyLesson ? emptyQueueStageContent : queueStageContent)[stage];
  const stepping = stage === 'FILL' || stage === 'DRAIN';
  const filled = emptyLesson ? snapshot.step >= 1 : snapshot.queues[0].items.length === snapshot.packages.length;
  const pageRead = usePageRead(stepping ? 'RUN' : stage);
  const runComplete = stage === 'DRAIN' && snapshot.status === 'FINISHED';
  const received = receivedPackages(snapshot);
  const activeName = snapshot.workers.find(worker => worker.id === snapshot.activeWorkerId)?.name;
  const highlight = snapshot.lastInstruction?.type === 'FINISH' ? null : snapshot.lastInstruction?.sourceLocation.line;

  function reset() { setSnapshot(controller.reset()); setSelected(null); setHistoryOpen(false); setStage('FILL'); }
  function restart() { setSnapshot(controller.reset()); setSelected(null); setHistoryOpen(false); setPrediction(null); setStage('PROBLEM'); }
  function advance() {
    if (stage === 'PROBLEM') setStage('PREDICTION');
    else if (stage === 'PREDICTION') setStage('FILL');
    else if (stage === 'DRAIN' && snapshot.status === 'FINISHED') setStage('SUMMARY');
    else if (stage === 'SUMMARY') restart();
  }
  function stepFactory() {
    if (stage === 'FILL' && filled) setStage('DRAIN');
    else setSnapshot(controller.nextStep());
  }
  const action = stage === 'PROBLEM' ? 'Make a prediction' : stage === 'SUMMARY' ? 'Try the lesson again' : 'Continue';
  const canContinue = pageRead && (!stepping || runComplete) && (stage !== 'PREDICTION' || prediction !== null);
  const navigationHint = !pageRead ? 'Scroll down to continue' : stepping && !runComplete ? 'Complete the factory steps' : stage === 'PREDICTION' && prediction === null ? 'Choose your prediction' : labels[index];
  const factoryAction = stage === 'FILL' && filled ? emptyLesson ? 'Let the producer run' : 'Let the consumer run' : 'Next Step';

  function openExperiment() {
    const url = new URL(window.location.href);
    url.searchParams.set('exercise', 'edit');
    window.history.replaceState(null, '', url);
    setExperiment(true);
    window.scrollTo(0, 0);
  }
  function backToLesson() {
    const url = new URL(window.location.href);
    url.searchParams.delete('exercise');
    window.history.replaceState(null, '', url);
    setExperiment(false);
  }
  if (experiment) return <QueueExperiment empty={emptyLesson} onSwitch={onSwitch} onBack={backToLesson}/>;

  return <div className={`app-shell ${stepping ? 'is-stepping' : ''}`}>
    <LessonHeader lesson={variant} onSwitch={onSwitch} onRestart={restart}/>
    <main>
      <div className="lesson-topline"><span><span className="small-square"/> LESSON {emptyLesson ? '03 / WAITING THREADS' : '02 / WAITING WORK'}</span><span>{String(index + 1).padStart(2, '0')} <span className="muted">/ 05</span></span></div>
      <h1>{emptyLesson ? <>What if<br/>the queue is empty</> : <>Where does<br/>the work wait</>}<span className="accent-dot">?</span></h1>
      <nav className="progress queue-progress" aria-label="Lesson progress">{queueStages.map((item, i) => <div className={`progress-item ${i === index ? 'current' : ''} ${i < index ? 'completed' : ''}`} key={item} aria-current={i === index ? 'step' : undefined}><span className="progress-track"/><span className="progress-label"><b>{i < index ? '✓' : String(i + 1).padStart(2, '0')}</b>{labels[i]}</span></div>)}</nav>
      <section className="lesson-card" aria-labelledby="stage-title"><div className="lesson-copy"><div className="eyebrow">{content.eyebrow}</div><h2 id="stage-title">{content.title}</h2><p>{content.body}</p></div>
        {stage === 'PREDICTION' && <div className="prediction-area"><div className={`prediction-options ${emptyLesson ? 'empty-queue-predictions' : ''}`} role="group" aria-label={emptyLesson ? 'What happens on an empty get?' : 'Which package comes out first?'}>{(choices ?? snapshot.packages).map(item => <button key={item.id} onClick={() => setPrediction(item.id)} aria-pressed={prediction === item.id} className={prediction === item.id ? 'picked' : ''} aria-label={item.label}>{item.label.replace('Package ', '')}</button>)}</div><small>No grades here. Just a hypothesis.</small></div>}
        {stepping && <div className="run-summary"><span className="mode-chip safe">{emptyLesson ? stage === 'FILL' ? 'CONSUMER → EMPTY QUEUE' : 'BLOCKED → READY → RECEIVE' : stage === 'FILL' ? 'PRODUCER → QUEUE' : 'QUEUE → CONSUMER'}</span><span className="step-count">STEP <b>{String(snapshot.step).padStart(2, '0')}</b></span></div>}
      </section>
      {stage === 'SUMMARY' && !emptyLesson && <section className="queue-discovery" aria-label="Queue lesson results"><div><span className="eyebrow">YOUR PREDICTION / FIRST OUT</span><strong>{packageName(snapshot, prediction ?? '')}</strong></div><div><span className="eyebrow">ACTUAL / FIRST OUT</span><strong>{packageName(snapshot, received[0])}</strong></div><div><span className="eyebrow">THE FULL RECEIVING ORDER</span><strong>{received.map(id => packageName(snapshot, id).replace('Package ', '')).join(' → ')}</strong></div></section>}
      {emptyLesson && stage === 'SUMMARY' && <section className="empty-queue-discovery" aria-label="Empty queue lesson results"><div><span className="eyebrow">YOUR PREDICTION</span><strong>{choices?.find(choice => choice.id === prediction)?.label}</strong></div><div><span className="eyebrow">WHAT HAPPENED</span><strong>Wait for work</strong></div><p>BLOCKED → READY → Receive Package A</p></section>}
      <div className="workspace queue-workspace">
        <div className="code-panel"><div className="panel-heading"><span className="file-icon">⌘</span><span>lesson.py</span><span className="panel-meta">PYTHON</span>{<button className="edit-packages" onClick={openExperiment}>Edit packages</button>}</div><CodeViewport label="Python queue example" activeLine={highlight} step={snapshot.step}>{python.map((line, i) => <div key={i} className={`code-line ${highlight === i + 1 ? 'highlight' : ''} ${stage === 'SUMMARY' && (line.includes('.put(') || line.includes('.get(')) ? 'addition' : ''}`}><span className="line-number" aria-hidden="true">{i + 1}</span><code>{line || ' '}</code>{highlight === i + 1 && <span className="line-thread">{activeName}</span>}</div>)}</CodeViewport><div className="code-footnote"><span>ⓘ</span><p>Two thread bodies share <code>jobs</code>. Each <code>put()</code> adds one item; each <code>get()</code> takes one. Taking work and processing work are separate steps.</p></div></div>
        <QueueFactory snapshot={snapshot} selected={selected} onSelect={setSelected}/>
        <div className="lesson-notes">      {stepping && <section className="execution" aria-label="Current queue operation"><div className="current-event"><span className="event-icon">↳</span><div><span className="eyebrow">{activeName && `${activeName} / `}{operationLabel(snapshot.lastInstruction?.type)}</span>{emptyLesson && <span className={`consumer-note-state state-tag state-${snapshot.workers[1].state.toLowerCase()}`}>Consumer: {snapshot.workers[1].state}</span>}<p role="status" aria-live="polite">{emptyLesson ? emptyQueueExplanation(snapshot) : queueStepExplanation(snapshot)}</p></div></div></section>}
      {(stepping || stage === 'SUMMARY') && <section className="history-section"><button className="history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><span>{historyOpen ? '−' : '+'} Execution history</span><span>{visibleEvents(snapshot).length} events</span></button>{historyOpen && <ol className="timeline">{visibleEvents(snapshot).map(event => <li key={event.id}><span className="timeline-step">{String(event.step).padStart(2, '0')}</span><span>{describeEvent(event, snapshot)}</span></li>)}{!snapshot.events.length && <li>No operations yet. Start with Next Step.</li>}</ol>}</section>}
        </div>
        {stepping && <FactoryControls onStep={stepFactory} onReset={reset} finished={runComplete} label={factoryAction} step={snapshot.step}/>}
      </div>
      {stage === 'SUMMARY' && !emptyLesson && <div className="lesson-takeaway queue-takeaway"><span className="takeaway-icon">✓</span><div><h3>A queue gives work a place to wait.</h3><button className="secondary" onClick={openExperiment}>Try editing the packages →</button><p><code>put()</code> adds to the back. <code>get()</code> takes from the front. The waiting items are shared; the item a consumer takes belongs to that thread.</p><p>This lesson shows receiving order. Explore waiting on an empty queue in lesson 03. Processing and completion tracking come later.</p></div></div>}
      {emptyLesson && stage === 'SUMMARY' && <div className="lesson-takeaway queue-takeaway"><span className="takeaway-icon">✓</span><div><h3>Waiting pauses one thread.</h3><p>By default, Python Queue.get() blocks when there is no item. It does not return an empty item or keep checking in a loop. Other READY threads can run.</p><p>Adding work wakes the waiting consumer. READY means it can be scheduled; it does not mean it has already taken the package. This lesson uses one consumer and an unbounded queue.</p></div></div>}
      <footer><span>A small model of a big idea.</span><span>CONCURRENCY FACTORY <span className="footer-dot">·</span> VERTICAL SLICE {emptyLesson ? '03' : '02'}</span></footer>
    </main>
    <section className="lesson-actions" aria-label="Lesson navigation"><div className="lesson-actions-inner"><div className="action-context"><span className="eyebrow">SECTION {index + 1} OF 5</span><span id="navigation-hint">{navigationHint}</span></div><div className="action-buttons"><LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={advance}>{action}<span>{stage === 'SUMMARY' ? '↺' : '→'}</span></LessonAdvanceButton></div></div></section>
  </div>;
}
