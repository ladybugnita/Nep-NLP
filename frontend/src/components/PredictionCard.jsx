import ScoreBars from './ScoreBars'
import { labelInfo, pct } from '../lib/labels'

export default function PredictionCard({ prediction, task = 'sentiment', compact = false, title }) {
  if (!prediction) return null
  const info = labelInfo(prediction.label, task)
  const uncertain = prediction.uncertain

  return (
    <div className={`pred ${uncertain ? 'uncertain' : info.cls}`} data-testid="prediction">
      {title && <div className="pred-title">{title}</div>}
      <div className="pred-head">
        {info.emoji && !uncertain && <span className="pred-emoji" aria-hidden>{info.emoji}</span>}
        {uncertain && <span className="pred-emoji" aria-hidden>🤔</span>}
        <div className="pred-main">
          {uncertain ? (
            <>
              <div className="pred-label">Not sure</div>
              <div className="sub">
                best guess <span lang="ne">{prediction.label}</span> ({info.en}) · {pct(prediction.confidence)}
              </div>
            </>
          ) : (
            <>
              <div className="pred-label" lang="ne">{prediction.label}</div>
              <div className="sub">{info.en} · {pct(prediction.confidence)} model score</div>
            </>
          )}
        </div>
        <span className={`tier tier-${prediction.model}`}>{prediction.model}</span>
      </div>
      {uncertain && (
        <p className="pred-why" role="note">
          The model is not confident enough to give an answer ({prediction.uncertain_reason}).
        </p>
      )}
      {!compact && <ScoreBars scores={prediction.scores} />}
      {!compact && !prediction.calibrated && (
        <p className="fine-left">Scores are raw model outputs, not yet calibrated probabilities.</p>
      )}
    </div>
  )
}
