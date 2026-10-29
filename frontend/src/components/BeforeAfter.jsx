import PredictionCard from './PredictionCard'

export default function BeforeAfter({ result, compact = false }) {
  if (!result) return null
  const raw = result.without_normalization
  return (
    <div className="before-after">
      <div className="ba-col">
        <div className="ba-title">Without nepnorm</div>
        <div className="ba-text" lang="ne">{result.original}</div>
        {raw && <PredictionCard prediction={raw} task={result.task} compact />}
      </div>
      <div className="ba-arrow" aria-hidden>→</div>
      <div className="ba-col">
        <div className="ba-title">With nepnorm</div>
        <div className="ba-text strong" lang="ne">{result.model_input}</div>
        <PredictionCard prediction={result.prediction} task={result.task} compact={compact} />
      </div>
      {result.changed_by_normalization && !compact && (
        <p className="fine-left ba-note">Normalization changed this prediction.</p>
      )}
    </div>
  )
}
