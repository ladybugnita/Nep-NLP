import { useState } from 'react'
import { api } from '../api'
import { examples } from '../data/examples'
import InputPanel from './InputPanel'

export default function SpellTool() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true); setError(''); setResult(null)
    try {
      setResult(await api.spellcheck(text))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function applySuggestion(wrong, right) {
    setText((t) => t.replace(wrong, right))
    setResult(null)
  }

  const errors = result?.tokens?.filter((t) => !t.is_correct) ?? []

  return (
    <div>
      <p className="tool-desc">Check Nepali spelling and get suggested corrections.</p>
      <InputPanel
        value={text} onChange={setText} onRun={run} loading={loading} error={error}
        examples={examples.spell} buttonLabel="Check spelling"
        placeholder="वाक्य यहाँ लेख्नुहोस्…"
      />
      {result && (
        <div className="result">
          <div className="spell-line">
            {result.tokens.map((t, i) => (
              <span key={i} className={t.is_correct ? 'tok ok' : 'tok bad'} title={
                t.is_correct ? '' : `Suggestions: ${t.suggestions.join(', ') || '—'}`
              }>{t.token}</span>
            ))}
          </div>
          <div className="spell-summary">
            {result.num_errors === 0
              ? '✓ No misspellings found.'
              : `${result.num_errors} possible misspelling${result.num_errors > 1 ? 's' : ''}:`}
          </div>
          {errors.map((t, i) => (
            <div className="correction" key={i}>
              <span className="tok bad">{t.token}</span>
              <span className="arrow">→</span>
              {t.suggestions.length
                ? t.suggestions.map((s) => (
                    <button key={s} className="chip suggest" onClick={() => applySuggestion(t.token, s)}>
                      {s}
                    </button>
                  ))
                : <span className="sub">no suggestion</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
