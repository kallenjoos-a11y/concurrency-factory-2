import { useLayoutEffect, useRef } from 'react';
import WorkerAvatar from './WorkerAvatar.tsx';
import type { SimulationSnapshot } from '../simulation/types.ts';
import { packageName, workerActivity } from '../lesson/presentation.ts';
import { receivedPackages } from '../lesson/queue-presentation.ts';

function PackageToken({ id, snapshot, onSelect, latest = false }: { id: string; snapshot: SimulationSnapshot; onSelect: (id: string) => void; latest?: boolean }) {
  const item = snapshot.packages.find(item => item.id === id)!;
  return <button className={`package-token ${latest ? 'latest-package' : ''}`} aria-label={`Inspect ${item.label}`} onClick={() => onSelect(id)}><span className="package-box" aria-hidden="true"><span>{item.label.replace('Package ', '').slice(0, 3)}</span></span><small title={item.label}>{item.label}</small></button>;
}

export default function QueueFactory({ snapshot, selected, onSelect }: { snapshot: SimulationSnapshot; selected: string | null; onSelect: (id: string | null) => void }) {
  const queue = snapshot.queues[0];
  const beltRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const lane = beltRef.current;
    if (!lane) return;
    const follow = () => { lane.scrollLeft = lane.scrollWidth; };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(lane);
    return () => observer.disconnect();
  }, [snapshot.step]);
  const received = receivedPackages(snapshot);
  const latest = snapshot.events.find(event => event.step === snapshot.step && ['QUEUE_ITEM_ADDED', 'QUEUE_ITEM_REMOVED'].includes(event.type))?.packageId;
  const taking = snapshot.lastInstruction?.type === 'QUEUE_GET' && latest !== undefined;
  const departing = taking ? snapshot.packages.find(item => item.id === latest) : undefined;
  return <div className="factory-panel queue-factory">
    <div className="panel-heading"><span className="factory-dot"/><span>The factory floor</span><span className="panel-meta">LIVE STATE</span></div>
    <div className="factory-floor queue-floor">
      <div className="queue-workers">{snapshot.workers.map(worker => <div className={`queue-worker position-${worker.id === 'a' ? 0 : 1} ${snapshot.activeWorkerId === worker.id ? 'just-acted' : ''}`} key={worker.id}>
        <button className={`worker-object thread-${worker.id} ${snapshot.activeWorkerId === worker.id ? 'active' : ''} ${worker.state === 'BLOCKED' ? 'blocked' : ''} ${selected === worker.id ? 'selected' : ''}`} aria-label={`Inspect ${worker.name}`} onClick={() => onSelect(worker.id)}><WorkerAvatar/><strong>{worker.name}</strong><span className="worker-kind">PYTHON THREAD · {worker.id === 'a' ? 'ADDS WORK' : 'TAKES WORK'}</span><span className={`state-tag state-${worker.state.toLowerCase()}`}>{worker.state}</span></button>
        <div className="worker-activity">{(worker.state === 'BLOCKED' || snapshot.events.some(event => event.step === snapshot.step && event.workerId === worker.id && event.type === 'THREAD_UNBLOCKED') || workerActivity(snapshot, worker.id)) && <span>{worker.state === 'BLOCKED' ? 'Waiting for work' : snapshot.events.some(event => event.step === snapshot.step && event.workerId === worker.id && event.type === 'THREAD_UNBLOCKED') ? 'Woke up · ready to run' : workerActivity(snapshot, worker.id)}</span>}</div>
      </div>)}</div>
      <div className="queue-flow-labels"><span>PUT ↓</span><span>GET ↑</span></div>
      <div className={`conveyor ${snapshot.lastInstruction?.type === 'QUEUE_PUT' || snapshot.lastInstruction?.type === 'QUEUE_GET' ? 'conveyor-active' : ''}`}>
        <div className="belt-label"><button className={selected === queue.id ? 'selected' : ''} aria-label="Inspect jobs queue" onClick={() => onSelect(queue.id)}>SHARED QUEUE <strong>jobs</strong></button><span aria-label={`${queue.items.length} packages waiting`}><b data-testid="queue-count">{queue.items.length}</b> WAITING</span></div>
        <div className="queue-direction"><span>NEW WORK ENTERS</span><span>NEXT OUT →</span></div>
        <div key={`belt-${snapshot.step}`} className={`belt-track ${latest ? 'belt-moving' : ''} ${taking ? 'belt-taking' : ''}`} aria-label="Packages waiting on the conveyor">
          <div ref={beltRef} className="belt-lane" tabIndex={0} aria-label="Scroll through waiting packages" style={{ gridTemplateColumns: `repeat(${Math.max(3, queue.items.length)}, minmax(80px, 1fr))` }}>
          {Array.from({ length: Math.max(0, 3 - queue.items.length) }, (_, i) => <div className="belt-slot" key={`empty-${i}`} aria-hidden="true"><div className="empty-package-slot">·</div></div>)}
          {[...queue.items].reverse().map(id => <div className={`belt-slot ${id === latest ? 'belt-arrival' : ''}`} key={id}><PackageToken id={id} snapshot={snapshot} onSelect={onSelect} latest={id === latest}/></div>)}
          </div>
          {departing && <span className="belt-departure package-token" aria-hidden="true"><span className="package-box"><span>{departing.label.replace('Package ', '').slice(0, 3)}</span></span><small>{departing.label}</small></span>}
        </div>
        <div key={`rollers-${snapshot.step}`} className={`belt-rollers ${latest ? 'rollers-moving' : ''}`} aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i}/>)}</div>
        <div className="queue-capacity">{queue.items.length > 3 ? 'Scroll along the belt to see every waiting package' : 'Room for waiting work · no capacity limit in this lesson'}</div>
      </div>
      <div className="queue-shelves"><div><span className="eyebrow">READY TO ADD</span><div className="shelf-packages">{snapshot.packages.filter(item => item.state === 'CREATED').map(item => <PackageToken key={item.id} id={item.id} snapshot={snapshot} onSelect={onSelect}/>)}{snapshot.packages.every(item => item.state !== 'CREATED') && <span className="empty-shelf">All packages added</span>}</div></div><div><span className="eyebrow">RECEIVED IN ORDER</span><div className="shelf-packages">{received.map(id => <PackageToken key={id} id={id} snapshot={snapshot} onSelect={onSelect} latest={id === latest}/>)}{!received.length && <span className="empty-shelf">Nothing taken yet</span>}</div></div></div>
      <div className="queue-local"><span>CONSUMER’S PRIVATE VARIABLE</span><code>item = <b>{packageName(snapshot, String(snapshot.workers[1].localVariables.item ?? ''))}</b></code></div>
      <div className="floor-caption">Select a thread, package, or the jobs label to inspect it.</div>
    </div>

    <QueueInspector snapshot={snapshot} selected={selected} onSelect={onSelect}/>
  </div>;
}

function QueueInspector({ snapshot, selected, onSelect }: { snapshot: SimulationSnapshot; selected: string | null; onSelect: (id: string | null) => void }) {
  const queue = snapshot.queues[0];
  const selectedWorker = snapshot.workers.find(worker => worker.id === selected);
  const selectedPackage = snapshot.packages.find(item => item.id === selected);
  const ownerName = (owner: string | null) => owner === queue.id ? 'jobs queue' : snapshot.workers.find(worker => worker.id === owner)?.name ?? 'Not assigned';
  return <>{selected && <div className="inspector" aria-label="Object inspector"><div className="inspector-heading"><strong>Inspect / {selected === queue.id ? 'jobs queue' : selectedWorker?.name ?? selectedPackage?.label}</strong><button aria-label="Close inspector" onClick={() => onSelect(null)}>×</button></div>
      {selected === queue.id && <dl><dt>Queue order</dt><dd>{queue.items.map(id => packageName(snapshot, id)).join(' → ') || 'Empty'}</dd><dt>Next out</dt><dd>{packageName(snapshot, queue.items[0])}</dd><dt>Waiting packages</dt><dd>{queue.items.length}</dd><dt>Capacity</dt><dd>Unbounded</dd><dt>Waiting threads</dt><dd>{queue.waitingConsumers.map(id => ownerName(id)).join(', ') || 'None'}</dd></dl>}
      {selectedWorker && <dl><dt>State</dt><dd>{selectedWorker.state}</dd><dt>Next instruction</dt><dd>{selectedWorker.instructions[selectedWorker.instructionPointer]?.type ?? 'None · finished'}</dd><dt>Last Python line</dt><dd>{selectedWorker.sourceLocation?.line ?? '—'}</dd><dt>Private item</dt><dd>{packageName(snapshot, String(selectedWorker.localVariables.item ?? ''))}</dd><dt>Waiting for</dt><dd>{selectedWorker.blockedOn ?? 'None'}</dd></dl>}
      {selectedPackage && <dl><dt>Value</dt><dd>{selectedPackage.value}</dd><dt>State</dt><dd>{selectedPackage.state}</dd><dt>Owner</dt><dd>{ownerName(selectedPackage.currentOwner)}</dd><dt>Meaning</dt><dd>{selectedPackage.state === 'ASSIGNED' ? 'Taken by consumer; not processed yet' : selectedPackage.state === 'QUEUED' ? 'Waiting for a consumer' : 'Ready for producer to add'}</dd></dl>}
    </div>}</>;
}

