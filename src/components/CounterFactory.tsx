import CodeViewport from './CodeViewport.tsx';
import { safePython, unsafePython } from '../simulation/scenarios.ts';
import type { SimulationSnapshot } from '../simulation/types.ts';
import { workerActivity } from '../lesson/presentation.ts';

export function Python({ safe, snapshot, comparison = false, lines: customLines }: { lines?: string[]; safe: boolean; snapshot?: SimulationSnapshot; comparison?: boolean }) {
  const lines = customLines ?? (safe ? safePython : unsafePython);
  const activeLine = snapshot?.lastInstruction?.type === 'FINISH' ? undefined : snapshot?.lastInstruction?.sourceLocation.line;
  return <div className="code-panel">
    <div className="panel-heading"><span className="file-icon">⌘</span><span>lesson.py</span><span className="panel-meta">PYTHON</span></div>
    <CodeViewport label={safe ? 'Python with a lock' : 'Python without a lock'} activeLine={activeLine} step={snapshot?.step}>{lines.map((line, i) => <div key={i} className={`code-line ${activeLine === i + 1 ? 'highlight' : ''} ${comparison && line.includes('with counter_lock:') ? 'addition' : ''}`}><span className="line-number" aria-hidden="true">{i + 1}</span><code>{line || ' '}</code>{activeLine === i + 1 && <span className="line-thread">{snapshot?.workers.find(worker => worker.id === snapshot.activeWorkerId)?.name}</span>}</div>)}</CodeViewport>
    {!comparison && <div className="code-footnote"><span>ⓘ</span><p>We slow each <code>counter +=</code> update into conceptual read, calculate, and write steps. This is a teaching model, not a claim about exact CPython bytecode or scheduling.</p></div>}
  </div>;
}

export function Factory({ snapshot, selected, onSelect }: { snapshot: SimulationSnapshot; selected: string | null; onSelect: (id: string) => void }) {
  const lock = snapshot.locks[0];
  const name = (id: string | null) => snapshot.workers.find(worker => worker.id === id)?.name ?? 'None';
  const variable = snapshot.sharedVariables[0];
  const sharedOperation = snapshot.lastInstruction?.type === 'READ_SHARED' ? 'reading' : snapshot.lastInstruction?.type === 'WRITE_SHARED' ? 'writing' : '';
  return <div className="factory-panel">
    <div className="panel-heading"><span className="factory-dot"/><span>The factory floor</span><span className="panel-meta">LIVE STATE</span></div>
    <div className={`factory-floor ${lock ? 'protected' : ''}`}>
      <div className="floor-label">{lock ? 'PROTECTED WORK AREA' : 'SHARED WORK AREA'}</div>
      {lock && <button className={`lock-object ${selected === lock.id ? 'selected' : ''}`} onClick={() => onSelect(lock.id)} aria-label="Inspect counter lock"><span aria-hidden="true">⚿</span><div><strong>counter_lock</strong><small>{lock.owner ? `Key held by ${name(lock.owner)}` : 'Key available'}</small></div></button>}
      <div className="factory-objects">
        {snapshot.workers.map((worker, i) => <div className={`worker-position position-${i} ${snapshot.activeWorkerId === worker.id ? 'just-acted' : ''}`} key={worker.id}>
          <button className={`worker-object thread-${worker.id} ${snapshot.activeWorkerId === worker.id ? 'active' : ''} ${worker.state === 'BLOCKED' ? 'blocked' : ''} ${selected === worker.id ? 'selected' : ''}`} onClick={() => onSelect(worker.id)} aria-label={`Inspect ${worker.name}`}>
            <span className="worker-avatar" aria-hidden="true"><span className="helmet"/><span className="face"/><span className="body"/>{worker.heldResources.length > 0 && <span className="worker-key">⚿</span>}</span>
            <strong>{worker.name}</strong><span className="worker-kind">PYTHON THREAD</span>
            <span className={`state-tag state-${worker.state.toLowerCase()}`}>{worker.state === 'READY' && snapshot.activeWorkerId === worker.id ? 'READY · just ran' : worker.state}</span>
          </button>
          <div className="local-value"><small>PRIVATE COPY</small><code>local_counter = <b>{worker.localVariables.local_counter ?? '—'}</b></code></div>
          <div className="worker-activity">{workerActivity(snapshot, worker.id) && <span className={worker.state === 'BLOCKED' ? 'waiting-activity' : ''}>{workerActivity(snapshot, worker.id)}</span>}</div>
          {worker.blockedOn && <p className="waiting-label">Waiting for <strong>{worker.blockedOn}</strong><br/>{name(lock?.owner ?? null)} must release the key.</p>}
        </div>)}
        <div className="counter-position"><div className={`connection left ${snapshot.activeWorkerId === 'a' ? sharedOperation : ''}`}/><button onClick={() => onSelect(variable.id)} className={`whiteboard ${sharedOperation ? 'in-use' : ''} ${selected === variable.id ? 'selected' : ''}`} aria-label="Inspect shared counter"><span className="board-clips"/><small>SHARED VARIABLE</small><code>counter</code><strong data-testid="counter-value">{variable.value}</strong><span>completed packages</span></button><div className={`connection right ${snapshot.activeWorkerId === 'b' ? sharedOperation : ''}`}/></div>
      </div>
      <div className="floor-caption">{snapshot.step ? 'Select a worker, whiteboard, or key to inspect it.' : 'Two private copies. One shared counter.'}</div>
    </div>

    <CounterInspector snapshot={snapshot} selected={selected} onSelect={onSelect}/>
  </div>;
}

function CounterInspector({ snapshot, selected, onSelect }: { snapshot: SimulationSnapshot; selected: string | null; onSelect: (id: string) => void }) {
  const lock = snapshot.locks[0];
  const name = (id: string | null) => snapshot.workers.find(worker => worker.id === id)?.name ?? 'None';
  const variable = snapshot.sharedVariables[0];
  return <>{selected && <div className="inspector" aria-label="Object inspector"><div className="inspector-heading"><strong>Inspect / {selected === 'counter' ? 'Shared counter' : selected === 'counter_lock' ? 'Lock' : name(selected)}</strong><button aria-label="Close inspector" onClick={() => onSelect('')}>×</button></div>
      {selected === 'counter' ? <dl><dt>Value</dt><dd>{variable.value}</dd><dt>Last read by</dt><dd>{name(variable.lastReadBy)}</dd><dt>Last written by</dt><dd>{name(variable.lastWrittenBy)}</dd></dl>
        : selected === 'counter_lock' && lock ? <dl><dt>Owner</dt><dd>{name(lock.owner)}</dd><dt>Waiting</dt><dd>{lock.waitingWorkers.map(id => name(id)).join(', ') || 'None'}</dd></dl>
          : snapshot.workers.filter(worker => worker.id === selected).map(worker => <dl key={worker.id}><dt>State</dt><dd>{worker.state}</dd><dt>Next instruction</dt><dd>{worker.instructions[worker.instructionPointer]?.type ?? 'None · finished'}</dd><dt>Last Python line</dt><dd>{worker.sourceLocation?.line ?? '—'}</dd><dt>Waiting for</dt><dd>{worker.blockedOn ?? 'None'}</dd><dt>Private local_counter</dt><dd>{worker.localVariables.local_counter ?? '—'}</dd><dt>Held resources</dt><dd>{worker.heldResources.join(', ') || 'None'}</dd></dl>)}
    </div>}</>;
}

