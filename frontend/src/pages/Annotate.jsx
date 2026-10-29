import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { annotationApi } from '../api'
import { ErrorBox, Loading } from '../components/Status'
import { SCRIPTS } from '../lib/labels'
import { load, save } from '../lib/storage'

export const LABELS = [
  { key: '1', value: 'सकारात्मक', en: 'Positive' },
  { key: '2', value: 'नकारात्मक', en: 'Negative' },
  { key: '3', value: 'तटस्थ', en: 'Neutral' },
]
export const FLAGS = [
  { value: 'sarcasm', en: 'Sarcasm / irony' },
  { value: 'mixed', en: 'Mixed sentiment' },
  { value: 'needs_context', en: 'Needs context' },
  { value: 'contains_name', en: 'Contains a person’s name' },
  { value: 'not_nepali', en: 'Not Nepali' },
]
const ID_RE = /^[A-Za-z0-9_-]{1,32}$/

function SignIn({ onDone }) {
  const [id, setId] = useState('')
  const [token, setToken] = useState('')
  const ok = ID_RE.test(id.trim()) 
  return (
    <form className="card annot-signin" onSubmit={(e) => { e.preventDefault(); if (ok) onDone(id.trim(), token) }}>
      <h2 className="sec">Who is annotating?</h2>
      <p className="sub">Use a pseudonymous ID (e.g. <code>A1</code>) — never your real name. Each annotator
        labels every item independently; you will not see anyone else’s labels.</p>
      <label className="field">Annotator ID
        <input className="input small" value={id} onChange={(e) => setId(e.target.value)}
               placeholder="A1" aria-invalid={id !== '' && !ok} />
      </label>
      <label className="field">Access token <span className="sub">(only if the server requires one)</span>
        <input className="input small" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
      </label>
      <button className="run" disabled={!ok}>Start</button>
    </form>
  )
}

export function Guidelines() {
  return (
    <details className="card guidelines">
      <summary><strong>Guidelines (summary)</strong> — read before you start</summary>
      <ul>
        <li><strong lang="ne">सकारात्मक</strong> praise, satisfaction, joy · <strong lang="ne">नकारात्मक</strong> criticism, anger, disappointment · <strong lang="ne">तटस्थ</strong> factual, no clear opinion.</li>
        <li>Label the <em>writer’s</em> sentiment, as intended: sarcasm is labelled by its intended meaning (and flagged).</li>
        <li>Mixed sentiment → the dominant one; flag “mixed”. Questions are neutral unless clearly loaded.</li>
        <li>Romanized or code-mixed text is labelled exactly like Devanagari; spelling errors don’t matter.</li>
        <li>Emoji count as sentiment signals when the words are neutral.</li>
        <li>Unsure after reading twice, or not Nepali → <strong>Skip</strong> (and flag why).</li>
      </ul>
      <p className="fine-left">Full guidelines: <code>research/annotation_guidelines.md</code></p>
    </details>
  )
}

export default function Annotate() {
  const [annotator, setAnnotator] = useState(() => load('nepnlp-annotator'))
  const [token, setToken] = useState(() => load('nepnlp-annot-token'))
  const [state, setState] = useState({ loading: false, error: '', data: null })
  const [flags, setFlags] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchNext = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const data = await annotationApi.next(annotator, token)
      setState({ loading: false, error: '', data })
      setFlags([]); setNote('')
    } catch (e) {
      setState({ loading: false, error: e.message, data: null })
    }
  }, [annotator, token])

  useEffect(() => { if (annotator) fetchNext() }, [annotator, fetchNext])

  const item = state.data?.item
  const submit = useCallback(async (label) => {
    if (!item || saving) return
    setSaving(true)
    try {
      await annotationApi.label({ item_id: item.id, annotator_id: annotator, label, flags, note: note || null }, token)
      await fetchNext()
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }))
    } finally {
      setSaving(false)
    }
  }, [item, saving, annotator, flags, note, token, fetchNext])

  useEffect(() => {
    function onKey(e) {
      if (e.target.closest?.('textarea, input:not([type="checkbox"])')) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const hit = LABELS.find((l) => l.key === e.key)
      if (hit) submit(hit.value)
      else if (e.key.toLowerCase() === 's') submit('skip')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit])

  if (!annotator) {
    return (
      <div className="page">
        <h1 className="display small">Annotate</h1>
        <SignIn onDone={(id, t) => { save('nepnlp-annotator', id); save('nepnlp-annot-token', t); setToken(t); setAnnotator(id) }} />
        <Guidelines />
      </div>
    )
  }

  const pctDone = state.data?.total ? Math.round((100 * state.data.done) / state.data.total) : 0
  return (
    <div className="page">
      <div className="annot-top">
        <h1 className="display small">Annotate</h1>
        <span className="sub">as <strong>{annotator}</strong> · <button className="linkish" onClick={() => { save('nepnlp-annotator', ''); setAnnotator('') }}>switch</button>
          {' '}· <Link to="/annotate/adjudicate">adjudicate</Link></span>
      </div>
      {state.data && (
        <div className="progress" aria-label={`${state.data.done} of ${state.data.total} labelled`}>
          <div className="progress-bar"><div style={{ width: `${pctDone}%` }} /></div>
          <span className="sub">{state.data.done} / {state.data.total}</span>
        </div>
      )}
      <Loading loading={state.loading && !state.data} />
      <ErrorBox error={state.error} onRetry={fetchNext} />

      {state.data && !item && (
        <div className="card empty" data-testid="annot-done"><strong>All done — thank you!</strong>
          <p className="sub">Every item has your label. Disagreements go to adjudication.</p></div>
      )}

      {item && (
        <section className="card annot-item" data-testid="annot-item">
          <div className="annot-meta">
            {item.script && <span className={`sc ${SCRIPTS[item.script]?.cls}`}><small>{SCRIPTS[item.script]?.short}</small>{SCRIPTS[item.script]?.name}</span>}
            {item.code_mixed && <span className="badge">code-mixed</span>}
          </div>
          <p className="annot-text" lang="ne">{item.text}</p>
          <div className="annot-labels" role="group" aria-label="Sentiment label">
            {LABELS.map((l) => (
              <button key={l.value} className="annot-btn" onClick={() => submit(l.value)} disabled={saving}>
                <kbd>{l.key}</kbd> <span lang="ne">{l.value}</span> <small>{l.en}</small>
              </button>
            ))}
            <button className="annot-btn skip" onClick={() => submit('skip')} disabled={saving}><kbd>S</kbd> Skip</button>
          </div>
          <fieldset className="step-toggles">
            <legend className="sub">Flags (optional)</legend>
            {FLAGS.map((f) => (
              <label key={f.value} className="toggle">
                <input type="checkbox" checked={flags.includes(f.value)}
                       onChange={() => setFlags(flags.includes(f.value) ? flags.filter((x) => x !== f.value) : [...flags, f.value])} />
                {f.en}
              </label>
            ))}
          </fieldset>
          <textarea className="input small" rows={2} placeholder="Note (optional)" value={note}
                    onChange={(e) => setNote(e.target.value)} aria-label="Note" />
        </section>
      )}
      <Guidelines />
    </div>
  )
}
