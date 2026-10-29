import { useState } from 'react'
import { api } from '../api'
import { examples } from '../data/examples'
import { useAsync } from '../lib/hooks'
import AnalyzeResult from './AnalyzeResult'
import { ErrorBox, Loading } from './Status'

export default function AnalyzeTool({ initialText = '' }) {
  const [text, setText] = useState(initialText)
  const [task, setTask] = useState('sentiment')
  const [{ loading, error, result }, run] = useAsync()
  const go = () => text.trim() && run(() => api.analyze(text, { task }))

  return (
    <div>
      <p className="tool-desc">
        Type Nepali the way people actually write it — Devanagari, Romanized (“timro naam k ho”),
        mixed with English, misspelled, or even in the old Preeti font. NepNLP normalizes it,
        classifies it, and shows every step.
      </p>
      <div className="panel">
        <textarea className="input" lang="ne" rows={3} value={text} aria-label="Text to analyze"
                  placeholder="e.g. service ekdam dhilo ra naramro thiyo"
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') go() }} />
        <div className="examples">
          <span className="examples-label">Try:</span>
          {examples.analyze.map((ex) => (
            <button key={ex.text} className="chip" onClick={() => { setText(ex.text); setTask(ex.task) }}>
              {ex.tag}: {ex.text.length > 30 ? ex.text.slice(0, 30) + '…' : ex.text}
            </button>
          ))}
        </div>
        <div className="controls">
          <button className="run" onClick={go} disabled={loading || !text.trim()}>{loading ? 'Analyzing…' : 'Analyze'}</button>
          <div className="dir-toggle" role="group" aria-label="Task">
            <button className={task === 'sentiment' ? 'active' : ''} onClick={() => setTask('sentiment')}>Sentiment</button>
            <button className={task === 'news' ? 'active' : ''} onClick={() => setTask('news')}>News topic</button>
          </div>
        </div>
        <Loading loading={loading} label="Normalizing and classifying…" />
        <ErrorBox error={error} onRetry={go} />
      </div>
      <AnalyzeResult result={result} />
    </div>
  )
}
