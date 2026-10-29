import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { annotationApi } from '../api'
import { ErrorBox, Loading } from '../components/Status'
import { load, save } from '../lib/storage'
import { FLAGS, LABELS } from './Annotate'

const flagName = (f) => FLAGS.find((x) => x.value === f)?.en || f

function Disagreement({ d, adjudicator, token, onDone }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  async function decide(label) {
    try {
      await annotationApi.adjudicate({ item_id: d.item.id, adjudicator_id: adjudicator.trim(), label, note: note || null }, token)
      onDone(d.item.id)
    } catch (e) { setError(e.message) }
  }
  const ownItem = d.labels.some((l) => l.annotator_id === adjudicator.trim())
  return (
    <article className="card annot-item" data-testid="disagreement">
      <p className="annot-text" lang="ne">{d.item.text}</p>
      {ownItem && <p className="pred-why" role="note">You labelled this item yourself — ideally someone else adjudicates it.</p>}
      <ul className="labels-by">
        {d.labels.map((l) => (
          <li key={l.annotator_id}><strong>{l.annotator_id}</strong>: <span lang="ne">{l.label}</span>
            {l.flags?.length > 0 && <span className="sub"> · {l.flags.map(flagName).join(', ')}</span>}
            {l.note && <span className="sub"> · “{l.note}”</span>}</li>
        ))}
      </ul>
      <div className="annot-labels">
        {LABELS.map((l) => (
          <button key={l.value} className="annot-btn" onClick={() => decide(l.value)} disabled={!adjudicator}>
            <span lang="ne">{l.value}</span> <small>{l.en}</small>
          </button>
        ))}
      </div>
      <textarea className="input small" rows={1} placeholder="Reason (optional)" value={note}
                onChange={(e) => setNote(e.target.value)} aria-label="Reason" />
      <ErrorBox error={error} />
    </article>
  )
}

export default function Adjudicate() {
  const token = load('nepnlp-annot-token')
  const [adjudicator, setAdjudicator] = useState(() => load('nepnlp-adjudicator'))
  const [state, setState] = useState({ loading: true, error: '', list: [], progress: null })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const [list, progress] = await Promise.all([annotationApi.disagreements(token), annotationApi.progress(token)])
      setState({ loading: false, error: '', list, progress })
    } catch (e) {
      setState({ loading: false, error: e.message, list: [], progress: null })
    }
  }, [token])
  useEffect(() => { refresh() }, [refresh])

  const p = state.progress
  return (
    <div className="page">
      <div className="annot-top">
        <h1 className="display small">Adjudicate</h1>
        <Link to="/annotate">← annotate</Link>
      </div>
      <p className="lead">Items the annotators labelled differently. Choose the final label; unresolved items are
        left out of the dataset rather than guessed.</p>
      {p && (
        <p className="sub" data-testid="annot-progress">
          {p.items} items · labels by annotator: {Object.entries(p.labels_by_annotator).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'} ·
          {' '}{p.items_with_two_or_more_labels} double-labelled · {p.disagreements} open disagreements · {p.adjudicated} adjudicated
        </p>
      )}
      <label className="field">Adjudicator ID
        <input className="input small" value={adjudicator} onChange={(e) => { setAdjudicator(e.target.value); save('nepnlp-adjudicator', e.target.value.trim()) }} placeholder="ADJ" />
      </label>
      <Loading loading={state.loading} />
      <ErrorBox error={state.error} onRetry={refresh} />
      {!state.loading && !state.error && state.list.length === 0 && (
        <div className="card empty"><strong>No open disagreements.</strong></div>
      )}
      {state.list.map((d) => (
        <Disagreement key={d.item.id} d={d} adjudicator={adjudicator} token={token}
                      onDone={(id) => setState((s) => ({ ...s, list: s.list.filter((x) => x.item.id !== id) }))} />
      ))}
    </div>
  )
}
