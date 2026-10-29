import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import ArchitectureDiagram from '../components/ArchitectureDiagram'
import AnalyzeResult from '../components/AnalyzeResult'
import { ErrorBox, Loading } from '../components/Status'
import { useAsync } from '../lib/hooks'
import { STEPS } from '../lib/labels'

const STEP_ORDER = ['unicode', 'legacy', 'detect', 'transliterate', 'spell']

export default function HowItWorks() {
  const [params] = useSearchParams()
  const [text, setText] = useState(params.get('text') || 'yo movie ramro thiyo, service chai dhilo')
  const [disabled, setDisabled] = useState([])
  const [{ loading, error, result }, run] = useAsync()
  const go = (t = text, d = disabled) => t.trim() && run(() => api.analyze(t, { disable: d }))

  useEffect(() => { if (params.get('text')) go(params.get('text'), []) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(step) {
    const next = disabled.includes(step) ? disabled.filter((s) => s !== step) : [...disabled, step]
    setDisabled(next)
    if (result) go(text, next)
  }

  return (
    <div className="page">
      <h1 className="display small">How it works</h1>
      <p className="lead">
        Every request goes <strong>original → detected script → transliterated → normalized → prediction</strong>.
        Below is the real pipeline running on your input — switch steps off to see what each one contributes
        (this is the same ablation the research evaluation uses).
      </p>

      <ArchitectureDiagram />

      <section className="card">
        <h2 className="sec">Run the pipeline</h2>
        <div className="panel">
          <textarea className="input" lang="ne" rows={2} value={text} aria-label="Text for the pipeline"
                    onChange={(e) => setText(e.target.value)} />
          <fieldset className="step-toggles">
            <legend className="sub">Pipeline steps</legend>
            {STEP_ORDER.map((s, i) => (
              <label key={s} className={`toggle ${disabled.includes(s) ? 'off' : ''}`} title={STEPS[s].what}>
                <input type="checkbox" checked={!disabled.includes(s)} onChange={() => toggle(s)} />
                {i + 1}. {STEPS[s].title}
              </label>
            ))}
          </fieldset>
          <div className="controls">
            <button className="run" onClick={() => go()} disabled={loading || !text.trim()}>Run pipeline</button>
          </div>
          <Loading loading={loading} />
          <ErrorBox error={error} onRetry={() => go()} />
        </div>
        <AnalyzeResult result={result} />
      </section>

      <section>
        <h2 className="sec">The steps</h2>
        <dl className="step-list">
          {STEP_ORDER.map((s, i) => (
            <div key={s}><dt>{i + 1}. {STEPS[s].title}</dt><dd>{STEPS[s].what}</dd></div>
          ))}
          <div><dt>6. Classifier + explanation</dt>
            <dd>The normalized text goes to the model (TF-IDF baseline, or a fine-tuned transformer when one is installed). Explanation words come from occlusion: remove a word, measure how much the score drops.</dd></div>
        </dl>
      </section>
    </div>
  )
}
