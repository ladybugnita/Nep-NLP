import { useState } from 'react'
import { STEPS, summarizeStep } from '../lib/labels'

export default function PipelineTrace({ original, steps = [] }) {
  const [open, setOpen] = useState(null)
  return (
    <ol className="trace">
      <li className="trace-step origin">
        <div className="trace-head"><span className="trace-num">0</span><strong>Original input</strong></div>
        <div className="trace-out" lang="ne">{original}</div>
      </li>
      {steps.map((s, i) => {
        const state = !s.enabled ? 'off' : s.changed ? 'changed' : 'same'
        return (
          <li key={s.name} className={`trace-step ${state}`} data-testid={`step-${s.name}`}>
            <div className="trace-head">
              <span className="trace-num">{i + 1}</span>
              <strong>{STEPS[s.name]?.title || s.name}</strong>
              <span className={`state ${state}`}>{state === 'off' ? 'off' : state === 'changed' ? 'changed' : 'no change'}</span>
              {s.enabled && <span className="ms">{s.elapsed_ms.toFixed(2)} ms</span>}
            </div>
            <div className="trace-sum">{summarizeStep(s)}</div>
            {state === 'changed' && <div className="trace-out" lang="ne">{s.output}</div>}
            {s.enabled && Object.keys(s.details || {}).length > 0 && (
              <button className="linkish" onClick={() => setOpen(open === s.name ? null : s.name)}
                      aria-expanded={open === s.name}>
                {open === s.name ? 'hide details' : 'details'}
              </button>
            )}
            {open === s.name && <pre className="details">{JSON.stringify(s.details, null, 2)}</pre>}
          </li>
        )
      })}
    </ol>
  )
}
