export default function FactoryControls({ onStep, onReset, finished, label = 'Next Step', step, completionMessage = 'This run is complete. Continue to the next section below.' }: { onStep: () => void; onReset: () => void; finished: boolean; label?: string; step: number; completionMessage?: string }) {
  return <section className="factory-controls" aria-label="Factory simulation controls">
    <div><span className="eyebrow">FACTORY / STEP {String(step).padStart(2, '0')}</span><p>{finished ? completionMessage : 'Advance the factory without leaving this section.'}</p></div>
    <div className="factory-control-buttons"><button className="reset" onClick={onReset}>↺ Reset</button><button className="primary" disabled={finished} onClick={onStep}>{finished ? 'Run complete' : label}<span aria-hidden="true">→</span></button></div>
  </section>;
}
