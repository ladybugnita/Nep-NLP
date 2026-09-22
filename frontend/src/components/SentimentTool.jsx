import { useState } from 'react'
import { api } from '../api'
import { examples } from '../data/examples'
import InputPanel from './InputPanel'
import ScoreBars from './ScoreBars'
import Feedback from './Feedback'

const STYLE = {
  'सकारात्मक': { emoji: '😊', cls: 'pos', en: 'Positive' },
  'नकारात्मक': { emoji: '😞', cls: 'neg', en: 'Negative' },
  'तटस्थ': { emoji: '😐', cls: 'neu', en: 'Neutral' },
}

export default function SentimentTool() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true); setError(''); setResult(null)
    try {
      setResult(await api.sentiment(text))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const s = result ? STYLE[result.label] || { emoji: '❓', cls: 'neu', en: result.label } : null

  return (
    <div>
      <p className="tool-desc">Detect the emotional tone (positive / negative / neutral) of Nepali text.</p>
      <InputPanel
        value={text} onChange={setText} onRun={run} loading={loading} error={error}
        examples={examples.sentiment} buttonLabel="Analyze"
        placeholder="समीक्षा वा टिप्पणी यहाँ लेख्नुहोस्…"
      />
      {result && (
        <div className="result">
          <div className={`sentiment-card ${s.cls}`}>
            <span className="sentiment-emoji">{s.emoji}</span>
            <div>
              <div className="big-label">{result.label}</div>
              <div className="sub">{s.en} · {(result.confidence * 100).toFixed(1)}% confident</div>
            </div>
            <span className={`tier tier-${result.model}`}>{result.model}</span>
          </div>
          <ScoreBars scores={result.scores} />
          {result.highlights?.length > 0 && (
            <div className="highlights">
              <span className="sub">Why: words that signalled sentiment —</span>
              {result.highlights.map((h, i) => (
                <span key={i} className={`hl ${h.polarity}`}>{h.word}</span>
              ))}
            </div>
          )}
          <Feedback
            recordId={result.recordId}
            labels={result.scores.map((x) => x.label)}
            currentLabel={result.label}
          />
        </div>
      )}
    </div>
  )
}
