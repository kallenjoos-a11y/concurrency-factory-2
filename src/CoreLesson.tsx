import { useRef, useState } from 'react';
import LessonHeader, {type LessonId} from './components/LessonHeader.tsx';
import LessonAdvanceButton from './components/LessonAdvanceButton.tsx';
import FactoryControls from './components/FactoryControls.tsx';
import CodeViewport from './components/CodeViewport.tsx';
import QueueFactory from './components/QueueFactory.tsx';
import {Factory as CounterFactory} from './components/CounterFactory.tsx';
import ProcessingFactory from './components/ProcessingFactory.tsx';
import QueueExperiment from './QueueExperiment.tsx';
import CounterExperiment from './CounterExperiment.tsx';
import {coreLessons,getCoreLesson,type CoreLessonId} from './lesson/core-curriculum.ts';
import {coreProgram,machineProgram,processingProgram,type CoreProgram} from './simulation/core-programs.ts';
import {SimulationController} from './simulation/controller.ts';
import {currentExplanation,describeEvent,visibleEvents} from './lesson/presentation.ts';
import {usePageRead} from './hooks/usePageRead.ts';
const sections=['The problem','Your prediction','Investigate','Explain and compare','Try it yourself'];
export default function CoreLesson({id,onSwitch}:{id:CoreLessonId;onSwitch:(id:LessonId)=>void}) {
  const lesson=getCoreLesson(id); const index=coreLessons.findIndex(item=>item.id===id);
  const [stage,setStage]=useState(0); const [prediction,setPrediction]=useState<number|null>(null);
  const [program,setProgram]=useState(()=>coreProgram(id));
  const controller=useRef(new SimulationController(program.scenario));
  const [snapshot,setSnapshot]=useState(()=>controller.current.snapshot());
  const [second,setSecond]=useState(false); const [results,setResults]=useState<string[]>([]);
  const [selected,setSelected]=useState<string|null>(null); const [history,setHistory]=useState(false);
  const [editor,setEditor]=useState(()=>new URLSearchParams(window.location.search).get('exercise')==='edit');
  const [permits,setPermits]=useState('3'); const [workers,setWorkers]=useState('2'); const [packages,setPackages]=useState('4'); const [error,setError]=useState('');
  const [exit,setExit]=useState<number|null>(null); const [complete,setComplete]=useState(false);
  const pageRead=usePageRead(`${id}-${stage}-${second}`);
  const finished=snapshot.status==='FINISHED';
  function outcome() { let active = 0; let peak = 0; for (const event of snapshot.events) { if (event.type === 'PROCESS_STARTED') active++; if (event.type === 'PROCESS_COMPLETED') active--; peak = Math.max(peak, active); } return snapshot.sharedVariables.length ? `counter = ${snapshot.sharedVariables[0].value}` : snapshot.queues.length ? `${snapshot.events.filter(event=>event.type==='QUEUE_ITEM_REMOVED').length} packages received` : `${snapshot.packages.filter(item=>item.state==='COMPLETED').length} packages completed · peak ${peak} in progress`;}
  function load(next:CoreProgram) {controller.current=new SimulationController(next.scenario);setProgram(next);setSnapshot(controller.current.snapshot());setSelected(null);setHistory(false);setError('');}
  function restart() {const url=new URL(window.location.href);url.searchParams.delete('exercise');window.history.replaceState(null,'',url);load(coreProgram(id));setStage(0);setSecond(false);setPrediction(null);setResults([]);setExit(null);setComplete(false);setEditor(false);setPermits('3');setWorkers('2');setPackages('4');window.scrollTo(0,0);}
  function advance() { if(stage===2) setResults(previous=>[...previous,`${program.label}: ${outcome()}`]);setStage(stage+1); }
  function compare() {setSecond(true);load(coreProgram(id,true));setStage(2);window.scrollTo(0,0);}
  function setEditing(open:boolean) {const url=new URL(window.location.href);if(open)url.searchParams.set('exercise','edit');else url.searchParams.delete('exercise');window.history.replaceState(null,'',url);setEditor(open);window.scrollTo(0,0);}
  function apply() {try{if(id==='threads'){if(!workers.trim()||!packages.trim())throw new Error('Fill in both numbers.');load(processingProgram(Number(workers),Number(packages)));}else{if(!permits.trim())throw new Error('Choose the number of permits.');load(machineProgram(Number(permits)));}}catch(issue){setError((issue as Error).message);}}
  if(editor && (id==='queue'||id==='empty-queue')) return <QueueExperiment empty={id==='empty-queue'} onSwitch={onSwitch} onBack={()=>setEditing(false)}/>;
  if(editor && (id==='race'||id==='lock')) return <CounterExperiment lessonId={id} allowLock={id==='lock'} onSwitch={onSwitch} onBack={()=>setEditing(false)}/>;
  const canContinue=pageRead && (stage!==1||prediction!==null) && (stage!==2||finished) && (stage!==3||!lesson.compare||second);
  const highlight=snapshot.lastInstruction?.type==='FINISH'?null:snapshot.lastInstruction?.sourceLocation.line;
  const showFactory=stage===2||stage===3||stage===4;
  const activeName=snapshot.workers.find(worker=>worker.id===snapshot.activeWorkerId)?.name;
  return <div className={`app-shell ${showFactory?'is-stepping':''}`}><LessonHeader lesson={id} onSwitch={onSwitch} onRestart={restart}/><main>
    <div className="lesson-topline"><span>CORE LESSON {index+1} OF 6</span><span>{complete?'COMPLETE':sections[stage].toUpperCase()}</span></div><h1>{lesson.title}<span className="accent-dot">.</span></h1>
    <nav className="progress queue-progress" aria-label="Lesson progress">{sections.map((label,i)=><div key={label} className={`progress-item ${i===stage?'current':''} ${i<stage?'completed':''}`} aria-current={i===stage?'step':undefined}><span className="progress-track"/><span className="progress-label"><b>{i<stage?'✓':i+1}</b>{label}</span></div>)}</nav>
    <section className="lesson-card"><div className="lesson-copy"><div className="eyebrow">{sections[stage]}</div><h2>{stage===0?'A problem to investigate':stage===1?lesson.prediction:stage===2?program.label:stage===3?'What did the run show?':'Change something. Explain what happens.'}</h2><p>{stage===0?lesson.problem:stage===1?'Choose a prediction. You can revise your understanding after seeing the evidence.':stage===2?lesson.investigation:stage===3?lesson.discovery:lesson.experiment}</p>{stage===0&&<p className="learning-objective"><strong>You will learn to:</strong> {lesson.objective}</p>}</div>
      {stage===1&&<div className="prediction-area"><div role="group" aria-label="Your prediction" className="prediction-options core-predictions">{lesson.choices.map((choice,i)=><button key={choice} aria-pressed={prediction===i} className={prediction===i?'picked':''} onClick={()=>setPrediction(i)}>{choice}</button>)}</div><small>No grades here. Just a hypothesis.</small></div>}
      {stage===2&&<span className="mode-chip safe">STEP {snapshot.step}</span>}
    </section>
    {stage===3&&<section className="core-discovery"><div><span className="eyebrow">YOUR PREDICTION</span><p>{lesson.choices[prediction??0]}</p></div><div><span className="eyebrow">OBSERVED RESULTS</span>{results.map((result,i)=><p key={i}>{result}</p>)}</div><div><span className="eyebrow">WHAT TO NOTICE</span><ul>{lesson.checkpoints.map(item=><li key={item}>{item}</li>)}</ul></div>{lesson.compare&&!second&&<button className="primary" onClick={compare}>{lesson.compare} →</button>}</section>}
    {stage===4&&<section className="practice-tools"><span className="eyebrow">GUIDED EXPERIMENT</span>{id==='threads'?<><label>Workers · 1–2<input type="number" min="1" max="2" step="1" value={workers} onChange={event=>setWorkers(event.target.value)}/></label><label>Packages · 1–6<input type="number" min="1" max="6" step="1" value={packages} onChange={event=>setPackages(event.target.value)}/></label><button className="primary" onClick={apply}>Run my version →</button></>:id==='semaphore'?<><label>Machine permits · 1–3<input type="number" min="1" max="3" step="1" value={permits} onChange={event=>setPermits(event.target.value)}/></label><button className="primary" onClick={apply}>Run my version →</button></>:<button className="primary" onClick={()=>setEditing(true)}>{id==='race'||id==='lock'?'Edit counter numbers':'Edit packages'} →</button>}<p className="editor-error" role="alert">{error}</p></section>}
    {showFactory&&<div className="workspace queue-workspace"><div className="code-panel"><div className="panel-heading"><span className="file-icon">⌘</span><span>lesson.py</span><span className="panel-meta">PYTHON BODY</span></div><CodeViewport label="Lesson Python" activeLine={highlight} step={snapshot.step}>{program.python.map((line,i)=><div key={i} className={`code-line ${highlight===i+1?'highlight':''}`}><span className="line-number">{i+1}</span><code>{line||' '}</code>{highlight===i+1&&<span className="line-thread">{activeName}</span>}</div>)}</CodeViewport><div className="code-footnote"><span>ⓘ</span><p>{lesson.pythonConnection}</p></div></div>
      {snapshot.sharedVariables.length ? <CounterFactory snapshot={snapshot} selected={selected} onSelect={value=>setSelected(value||null)}/> : snapshot.queues.length ? <QueueFactory snapshot={snapshot} selected={selected} onSelect={setSelected}/> : <ProcessingFactory snapshot={snapshot} selected={selected} onSelect={setSelected}/>}
      <div className="lesson-notes"><section className="execution"><div className="current-event"><span className="event-icon">↳</span><div><span className="eyebrow">{activeName??'READY TO START'}</span><p role="status" aria-live="polite">{currentExplanation(snapshot)}</p></div></div></section><section className="history-section"><button className="history-toggle" aria-expanded={history} onClick={()=>setHistory(!history)}>Execution history {history?'−':'+'}</button>{history&&<ol className="timeline">{visibleEvents(snapshot).map(event=><li key={event.id}><span className="timeline-step">{event.step}</span><span>{describeEvent(event,snapshot)}</span></li>)}</ol>}</section></div>
      {(stage===2||stage===4)&&<FactoryControls onStep={()=>setSnapshot(controller.current.nextStep())} onReset={()=>{setSnapshot(controller.current.reset());setSelected(null);setHistory(false);}} finished={finished} step={snapshot.step} completionMessage={stage===2?'Observe the result, then continue to the explanation.':'Your run is complete. Try another version or answer the check below.'}/>}
    </div>}
    {stage===4&&<section className="exit-check"><span className="eyebrow">CHECK YOUR UNDERSTANDING</span><h2>{lesson.exit.question}</h2><div className="prediction-options core-predictions">{lesson.exit.choices.map((choice,i)=><button key={choice} aria-pressed={exit===i} className={exit===i?'picked':''} onClick={()=>{setExit(i);setComplete(false);}}>{choice}</button>)}</div>{exit!==null&&<p role="status">{exit===lesson.exit.answer?'Yes. ': 'Take another look. '}{lesson.exit.explanation}</p>}{complete&&<p className="lesson-complete" role="status">✓ Lesson complete. You explained the key idea.</p>}</section>}
    <footer><span>A small model of a big idea.</span><span>CONCURRENCY FACTORY · SIX CORE LESSONS</span></footer>
  </main><section className="lesson-actions" aria-label="Lesson navigation"><div className="lesson-actions-inner"><div className="action-context"><span className="eyebrow">LESSON {index+1} / SECTION {stage+1} OF 5</span><span>{!pageRead?'Scroll down to continue':stage===2&&!finished?'Complete the factory steps':stage===3&&lesson.compare&&!second?'Try the comparison run':stage===4?'Explain the key idea':sections[stage]}</span></div><div className="action-buttons">{stage<4?<LessonAdvanceButton disabled={!canContinue} onClick={advance}>{stage===0?'Make a prediction':'Continue'} →</LessonAdvanceButton>:!complete?<LessonAdvanceButton disabled={!pageRead||exit!==lesson.exit.answer||!finished} onClick={()=>setComplete(true)}>Finish lesson ✓</LessonAdvanceButton>:<LessonAdvanceButton onClick={()=>index<5?onSwitch(coreLessons[index+1].id):restart()}>{index<5?'Next lesson →':'Try the course again ↺'}</LessonAdvanceButton>}</div></div></section></div>;
}
