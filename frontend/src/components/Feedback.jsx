import { useState } from 'react'
import { api } from '../api'

// 👍/👎 feedback on a prediction. A 👎 lets the user pick the correct label; both are saved
// to MongoDB (via the backend) as labelled data for future retraining — the virtuous loop.
export default function Feedback({ recordId, labels = [], currentLabel }) {
  const [state, setState] = useState('idle') // idle | correcting | done | error
  if (!recordId) return null // not persisted (e.g. MongoDB offline) -> no feedback control

  async function send(modelWasCorrect, correctLabel = null) {
    try {
      await api.feedback(recordId, correctLabel, modelWasCorrect)
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') return <div className="feedback done">🙏 Thanks — saved as training data.</div>
  if (state === 'error') return <div className="feedback err">Couldn’t save feedback (is MongoDB running?)</div>

  return (
    <div className="feedback">
      {state === 'idle' ? (
        <>
          <span className="sub">Was this right?</span>
          <button className="fb-btn" onClick={() => send(true)}>👍 Yes</button>
          <button className="fb-btn" onClick={() => setState('correcting')}>👎 No</button>
        </>
      ) : (
        <>
          <span className="sub">Correct label?</span>
          {labels.filter((l) => l !== currentLabel).map((l) => (
            <button key={l} className="chip suggest" onClick={() => send(false, l)}>{l}</button>
          ))}
          <button className="fb-btn" onClick={() => setState('idle')}>cancel</button>
        </>
      )}
    </div>
  )
}
