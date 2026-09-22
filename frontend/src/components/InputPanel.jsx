import { useState } from 'react'
import { api } from '../api'

// Shared input area: textarea + example chips + run button. Also offers a one-click
// "Romanize" that converts Romanized Nepali (e.g. "timro naam") in the box to Devanagari,
// so every tool becomes usable without a Nepali keyboard.
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
  const [romanizing, setRomanizing] = useState(false)
  const canRun = !loading && value.trim()

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canRun) {
      e.preventDefault()
      onRun()
    }
  }

  async function romanize() {
    if (!value.trim()) return
    setRomanizing(true)
    try {
      const r = await api.transliterate(value)
      if (r?.output) onChange(r.output)
    } catch {
      /* leave the text as-is on failure */
    } finally {
      setRomanizing(false)
    }
  }

  return (
    <div className="panel">
      <textarea
        className="input"
        lang="ne"
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="input-meta">
        <span>{[...value].length} characters</span>
        <span><span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> to run</span>
      </div>
      {examples.length > 0 && (
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
        <button
          type="button"
          className="romanize"
          onClick={romanize}
          disabled={romanizing || !value.trim()}
          title="Typed Nepali in English letters (e.g. 'timro naam ke ho')? Convert it to Devanagari."
        >
          {romanizing ? 'Converting…' : 'अ  Romanized → नेपाली'}
        </button>
        {children}
      </div>
      {error && <div className="error">⚠ {error}</div>}
    </div>
  )
}
