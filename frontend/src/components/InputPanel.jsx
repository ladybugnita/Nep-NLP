import { useState } from 'react'

export default function InputPanel({
  value,
  onChange,
  onRun,
  loading,
  error,
  examples = [],
  placeholder,
  buttonLabel = 'Run',
  children,
}) {
  const [showExamples] = useState(true)
  return (
    <div className="panel">
      <textarea
        className="input"
        lang="ne"
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {showExamples && examples.length > 0 && (
        <div className="examples">
          <span className="examples-label">Try:</span>
          {examples.map((ex, i) => (
            <button key={i} className="chip" onClick={() => onChange(ex)} title={ex}>
              {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
            </button>
          ))}
        </div>
      )}
      <div className="controls">
        <button className="run" onClick={onRun} disabled={loading || !value.trim()}>
          {loading ? 'Working…' : buttonLabel}
        </button>
        {children}
      </div>
      {error && <div className="error">⚠ {error}</div>}
    </div>
  )
}
