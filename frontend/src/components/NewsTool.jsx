import { useState } from 'react'
import { api } from '../api'
import { examples } from '../data/examples'
import InputPanel from './InputPanel'
import ScoreBars from './ScoreBars'

export default function NewsTool() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true); setError(''); setResult(null)
    try {
      setResult(await api.news(text))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="tool-desc">Paste a Nepali news headline or article to detect its topic.</p>
      <InputPanel
        value={text} onChange={setText} onRun={run} loading={loading} error={error}
        examples={examples.news} buttonLabel="Classify"
        placeholder="समाचार यहाँ टाइप गर्नुहोस्…"
      />
      {result && (
        <div className="result">
          <div className="headline">
            <span className="big-label">{result.label}</span>
            <span className={`tier tier-${result.model}`}>{result.model}</span>
          </div>
          <ScoreBars scores={result.scores} />
        </div>
      )}
    </div>
  )
}
