import { useRef, useState } from 'react';
import LessonHeader, { type LessonId } from './components/LessonHeader.tsx';
import LessonAdvanceButton from './components/LessonAdvanceButton.tsx';
import FactoryControls from './components/FactoryControls.tsx';
import { Factory, Python } from './components/CounterFactory.tsx';
import { compileCounterProgram, originalCounterSettings } from './simulation/counter-program.ts';
import { SimulationController } from './simulation/controller.ts';
import { currentExplanation, describeEvent, visibleEvents } from './lesson/presentation.ts';

export default function CounterExperiment({ onSwitch, onBack, allowLock = true, lessonId = 'counter' }: { lessonId?: 'counter' | 'race' | 'lock'; allowLock?: boolean; onSwitch: (id: LessonId) => void; onBack: () => void }) {
  const [draft, setDraft] = useState({ start: '10', a: '1', b: '1' });
  const [settings, setSettings] = useState(originalCounterSettings);
  const [safe, setSafe] = useState(false);
  const [program, setProgram] = useState(() => compileCounterProgram(originalCounterSettings, false));
  const controller = useRef(new SimulationController(program.scenario));
  const [snapshot, setSnapshot] = useState(() => controller.current.snapshot());
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState('');
  const [unsafeResult, setUnsafeResult] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  function run(nextSettings = settings, withLock = false) {
    const next = compileCounterProgram(nextSettings, withLock);
    controller.current = new SimulationController(next.scenario);
    setProgram(next); setSettings(nextSettings); setSafe(withLock); setSnapshot(controller.current.snapshot()); setSelected(null); setHistoryOpen(false); setEditing(false); setError('');
  }
  function reset() {
    setDraft({ start: '10', a: '1', b: '1' }); setUnsafeResult(null);
    run(originalCounterSettings); setEditing(true);
  }
  function apply() {
    try {
      if (Object.values(draft).some(value => !value.trim())) throw new Error('Fill in all three numbers.');
      run({ start: Number(draft.start), a: Number(draft.a), b: Number(draft.b) }); setUnsafeResult(null);
    } catch (issue) { setError((issue as Error).message); }
  }
  const finished = snapshot.status === 'FINISHED';
  return <div className="app-shell is-stepping"><LessonHeader lesson={lessonId} onSwitch={onSwitch} onRestart={reset}/><main>
    <div className="lesson-topline"><span>THE WHITEBOARD / TRY YOUR OWN NUMBERS</span><span>GUIDED EXERCISE</span></div>
    <h1>Same counter.<br/>Different work<span className="accent-dot">.</span></h1>
    <section className="lesson-card"><div className="lesson-copy"><div className="eyebrow">{editing ? 'EDIT THE NUMBERS' : safe ? 'WITH LOCK' : 'WITHOUT LOCK'}</div><h2>Will every package be counted?</h2><p>Change how many packages are already counted and how many each thread finishes. {allowLock ? 'First observe the overlapping updates, then rerun the same work with a Lock.' : 'Follow the overlapping updates and identify which increase disappears.'} This schedule makes Thread B write last; other schedules can produce different results.</p></div></section>
    <div className="workspace">
      {editing ? <div className="code-panel"><div className="panel-heading"><span className="file-icon">⌘</span><span>lesson.py / numbers</span></div><div className="queue-editor counter-editor">
        {(['start', 'a', 'b'] as const).map(key => <label key={key}>{key === 'start' ? 'Starting counter · 0–999' : `Thread ${key.toUpperCase()} increase · 1–20`}<input type="number" min={key === 'start' ? 0 : 1} max={key === 'start' ? 999 : 20} step="1" value={draft[key]} onChange={event => { setDraft({ ...draft, [key]: event.target.value }); setError(''); }}/><code>{key === 'start' ? `counter = ${draft[key]}` : `counter += ${draft[key]}`}</code></label>)}
        <p className="editor-error" role="alert">{error}</p><div className="editor-actions"><button className="reset" onClick={reset}>↺ Reset original</button><button className="primary" onClick={apply}>Run my version →</button></div>
      </div></div> : <Python safe={safe} snapshot={snapshot} lines={program.python}/>}
      <Factory snapshot={snapshot} selected={selected} onSelect={id => setSelected(id || null)}/>
      <div className="lesson-notes"><section className="execution"><div className="current-event"><span className="event-icon">↳</span><div><span className="eyebrow">EXPECTED COUNTER: {program.expected}</span><p role="status">{editing ? 'Your changes apply when you run your version.' : currentExplanation(snapshot)}</p></div></div></section>
        {finished && !editing && <section className="experiment-results"><p>Expected: <strong>{program.expected}</strong> · Actual: <strong>{snapshot.sharedVariables[0].value}</strong></p>{safe ? <p>Without Lock: {unsafeResult}. With Lock: {snapshot.sharedVariables[0].value}. The Lock kept both updates.</p> : <><p>Both threads read {settings.start}. B’s final write replaced A’s increase of {settings.a}, losing that work.</p>{allowLock && <button className="primary" onClick={() => { setUnsafeResult(Number(snapshot.sharedVariables[0].value)); run(settings, true); }}>Run the same work with a Lock →</button>}</>}<button className="secondary" onClick={() => setEditing(true)}>Edit numbers</button></section>}
        {!!snapshot.events.length && <section className="history-section"><button className="history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}>Execution history {historyOpen ? '−' : '+'}</button>{historyOpen && <ol className="timeline">{visibleEvents(snapshot).map(event => <li key={event.id}><span className="timeline-step">{event.step}</span><span>{describeEvent(event, snapshot)}</span></li>)}</ol>}</section>}
      </div>
      {!editing && <FactoryControls onStep={() => setSnapshot(controller.current.nextStep())} onReset={reset} finished={finished} step={snapshot.step} completionMessage={safe ? 'Compare the results, or edit your numbers.' : 'Try the same work with a Lock using the button beside the results.'}/>}
    </div><footer><span>Different amounts. The same need to protect shared state.</span></footer>
  </main><section className="lesson-actions"><div className="lesson-actions-inner"><span>COUNTER EXPERIMENT</span><LessonAdvanceButton onClick={onBack}>Back to lesson ←</LessonAdvanceButton></div></section></div>;
}
