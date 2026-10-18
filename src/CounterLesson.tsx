import CounterExperiment from './CounterExperiment.tsx';
import { Factory, Python } from './components/CounterFactory.tsx';
import FactoryControls from './components/FactoryControls.tsx';
import { usePageRead } from './hooks/usePageRead.ts';
import LessonAdvanceButton from './components/LessonAdvanceButton.tsx';
import { useRef, useState } from 'react';
import { SimulationController } from './simulation/controller.ts';
import { counterScenario } from './simulation/scenarios.ts';
import type { SimulationSnapshot } from './simulation/types.ts';
import { currentExplanation, describeEvent, operationLabel, stageContent, stageLabels, stages, visibleEvents } from './lesson/presentation.ts';
import type { LessonStage } from './lesson/presentation.ts';
import LessonHeader from './components/LessonHeader.tsx';
import type { LessonId } from './components/LessonHeader.tsx';

export default function CounterLesson({ onSwitch }: { onSwitch: (lesson: LessonId) => void }) {
  const [experiment, setExperiment] = useState(() => new URLSearchParams(window.location.search).get('exercise') === 'edit');
  function changeExperiment(open: boolean) { const url = new URL(window.location.href); if (open) url.searchParams.set('exercise', 'edit'); else url.searchParams.delete('exercise'); window.history.replaceState(null, '', url); setExperiment(open); window.scrollTo(0, 0); }
  const controller = useRef(new SimulationController(counterScenario(false)));
  const [snapshot, setSnapshot] = useState(() => controller.current.snapshot());
  const [stage, setStage] = useState<LessonStage>('PROBLEM');
  const [prediction, setPrediction] = useState<number | null>(null);
  const [unsafeResult, setUnsafeResult] = useState<SimulationSnapshot | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const stageIndex = stages.indexOf(stage);
  const safe = snapshot.scenarioId === 'counter-safe';
  const stepping = stage === 'UNSAFE_RUN' || stage === 'SAFE_RUN';
  const content = stageContent[stage];
  const pageRead = usePageRead(stage);
  const runComplete = snapshot.status === 'FINISHED';
  const canContinue = pageRead && (!stepping || runComplete) && (stage !== 'PREDICTION' || prediction !== null);
  const navigationHint = !pageRead ? 'Scroll down to continue' : stepping && !runComplete ? 'Complete the factory steps' : stage === 'PREDICTION' && prediction === null ? 'Choose your prediction' : stageLabels[stageIndex];
  function resetFactory() { setSnapshot(controller.current.reset()); setSelected(null); setHistoryOpen(false); }


  function introduceLock() {
    setUnsafeResult(snapshot);
    controller.current = new SimulationController(counterScenario(true));
    setSnapshot(controller.current.snapshot());
    setSelected(null); setHistoryOpen(false); setStage('LOCK_INTRODUCTION');
  }
  function restart() {
    controller.current = new SimulationController(counterScenario(false));
    setSnapshot(controller.current.snapshot()); setStage('PROBLEM'); setPrediction(null);
    setUnsafeResult(null); setSelected(null); setHistoryOpen(false);
  }

  if (experiment) return <CounterExperiment onSwitch={onSwitch} onBack={() => changeExperiment(false)}/>;
  return <div className={`app-shell ${stepping ? 'is-stepping' : ''}`}>
    <LessonHeader lesson="counter" onSwitch={onSwitch} onRestart={restart}/>
    <main>
      <div className="lesson-topline"><span><span className="small-square"/> RACE CONDITION → LOCK</span><span>{String(stageIndex + 1).padStart(2, '0')} <span className="muted">/ 07</span></span></div>
      <h1>Something went wrong<br/>with our counter<span className="accent-dot">.</span></h1>
      <nav className="progress" aria-label="Lesson progress">{stages.map((item, i) => <div key={item} className={`progress-item ${i === stageIndex ? 'current' : ''} ${i < stageIndex ? 'completed' : ''}`} aria-current={i === stageIndex ? 'step' : undefined}><span className="progress-track"/><span className="progress-label"><b>{i < stageIndex ? '✓' : String(i + 1).padStart(2, '0')}</b>{stageLabels[i]}</span></div>)}</nav>

      <section className="lesson-card" aria-labelledby="stage-title"><div className="lesson-copy"><div className="eyebrow">{content.eyebrow}</div><h2 id="stage-title">{content.title}</h2><p>{content.body}</p></div>
        {stage === 'PREDICTION' && <div className="prediction-area"><div role="group" aria-label="Predicted final counter" className="prediction-options">{[10, 11, 12].map(value => <button key={value} aria-pressed={prediction === value} className={prediction === value ? 'picked' : ''} onClick={() => setPrediction(value)}>{value}</button>)}</div><small>No grades here. Just a hypothesis.</small></div>}
        {stage === 'RACE_EXPLANATION' && <div className="discovery-actions"><div className="result-strip"><div><small>YOUR PREDICTION</small><strong>{prediction}</strong></div><div><small>EXPECTED</small><strong>12</strong></div><div className="lost"><small>ACTUAL</small><strong>{snapshot.sharedVariables[0].value}</strong></div></div></div>}
        {stepping && <div className="run-summary"><span className={`mode-chip ${safe ? 'safe' : ''}`}>{safe ? '⚿ WITH LOCK' : 'WITHOUT LOCK'}</span><span className="step-count">STEP <b>{String(snapshot.step).padStart(2, '0')}</b></span></div>}
      </section>

      {stage === 'COMPARISON' ? <section className="comparison" aria-label="Before and after comparison">
        <div className="comparison-column"><div className="comparison-result lost"><span>WITHOUT LOCK</span><strong>{unsafeResult?.sharedVariables[0].value}</strong><p>One lost update</p></div><Python safe={false} comparison/></div>
        <div className="comparison-column"><div className="comparison-result correct"><span>WITH LOCK</span><strong>{snapshot.sharedVariables[0].value}</strong><p>Both updates counted</p></div><Python safe comparison/></div>
        <div className="lesson-takeaway"><span className="takeaway-icon">✓</span><div><h3>You just learned why Locks exist.</h3><p>Shared state → concurrent access → race condition → critical section → Lock.</p><p><code>with counter_lock:</code> protects the entire update. A blocked thread waits; a ready thread can be scheduled to try again.</p></div></div>
      </section> : <>
        <button className="secondary" onClick={() => changeExperiment(true)}>Edit counter numbers →</button><div className="workspace"><Python safe={safe} snapshot={snapshot}/><Factory snapshot={snapshot} selected={selected} onSelect={id => setSelected(id || null)}/><div className="lesson-notes">        {(stepping || stage === 'RACE_EXPLANATION') && <section className="execution" aria-label="Execution controls"><div className="current-event"><span className={`event-icon ${snapshot.workers.some(worker => worker.state === 'BLOCKED') ? 'blocked-icon' : ''}`}>{snapshot.step ? '↳' : '▷'}</span><div><span className="eyebrow">{snapshot.activeWorkerId ? `${snapshot.workers.find(worker => worker.id === snapshot.activeWorkerId)?.name} / ` : ''}{operationLabel(snapshot.lastInstruction?.type)}</span><p role="status" aria-live="polite">{currentExplanation(snapshot)}</p></div></div>
        </section>}
        {(stepping || stage === 'RACE_EXPLANATION') && <section className="history-section"><button className="history-toggle" onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen}><span>{historyOpen ? '−' : '+'} Execution history</span><span>{visibleEvents(snapshot).length} events</span></button>{historyOpen && <ol className="timeline">{visibleEvents(snapshot).map(event => <li key={event.id} className={event.type === 'THREAD_BLOCKED' ? 'blocked-event' : ''}><span className="timeline-step">{String(event.step).padStart(2, '0')}</span><span>{describeEvent(event, snapshot)}</span></li>)}{!snapshot.events.length && <li>No operations yet. Start with Next Step.</li>}</ol>}</section>}
</div>{stepping && <FactoryControls onStep={() => setSnapshot(controller.current.nextStep())} onReset={resetFactory} finished={runComplete} step={snapshot.step}/>}</div>
      </>}
      <footer><span>A small model of a big idea.</span><span>CONCURRENCY FACTORY <span className="footer-dot">·</span> VERTICAL SLICE 01</span></footer>
    </main>
    <section className="lesson-actions" aria-label="Lesson navigation"><div className="lesson-actions-inner">
      <div className="action-context"><span className="eyebrow">SECTION {stageIndex + 1} OF 7</span><span id="navigation-hint">{navigationHint}</span></div>
      <div className="action-buttons">
        {stage === 'PROBLEM' && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={() => setStage('PREDICTION')}>Make a prediction <span>→</span></LessonAdvanceButton>}
        {stage === 'PREDICTION' && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={() => setStage('UNSAFE_RUN')}>Continue <span>→</span></LessonAdvanceButton>}
        {stage === 'RACE_EXPLANATION' && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={introduceLock}>Continue <span>→</span></LessonAdvanceButton>}
        {stage === 'LOCK_INTRODUCTION' && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={() => setStage('SAFE_RUN')}>Continue <span>→</span></LessonAdvanceButton>}
        {stepping && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={() => setStage(safe ? 'COMPARISON' : 'RACE_EXPLANATION')}>Continue <span>→</span></LessonAdvanceButton>}
        {stage === 'COMPARISON' && <LessonAdvanceButton disabled={!canContinue} aria-describedby="navigation-hint" onClick={restart}>Try the lesson again <span>↺</span></LessonAdvanceButton>}
      </div>
    </div></section>
  </div>;
}
