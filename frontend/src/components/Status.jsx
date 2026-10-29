import { useSlowHint } from '../lib/hooks'

export function Loading({ loading, label = 'Working…' }) {
  const slow = useSlowHint(loading)
  if (!loading) return null
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      <span>{slow ? 'Waking up the server — the free-tier demo sleeps when idle, the first request can take up to a minute…' : label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="error" role="alert">
      <span>⚠ {error}</span>
      {onRetry && <button className="linkish" onClick={onRetry}>Retry</button>}
    </div>
  )
}
