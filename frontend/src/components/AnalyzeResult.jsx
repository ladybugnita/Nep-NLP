import BeforeAfter from './BeforeAfter'
import ExplainedText from './ExplainedText'
import Feedback from './Feedback'
import PipelineTrace from './PipelineTrace'
import PredictionCard from './PredictionCard'
import ScriptTokens from './ScriptTokens'

export default function AnalyzeResult({ result, showTrace = true }) {
  if (!result) return null
  const norm = result.normalization
  return (
    <div className="result analyze-result">
      <section>
        <h3 className="sec">Prediction</h3>
        {norm ? <BeforeAfter result={result} /> : <PredictionCard prediction={result.prediction} task={result.task} />}
      </section>

      <section>
        <h3 className="sec">Why — words that drove it</h3>
        <ExplainedText text={result.model_input} explanation={result.explanation} method={result.explanation_method} />
      </section>

      {norm?.detection && (
        <section>
          <h3 className="sec">Detected script, word by word</h3>
          <ScriptTokens detection={norm.detection} />
        </section>
      )}

      {showTrace && norm && (
        <section>
          <h3 className="sec">Pipeline steps</h3>
          <PipelineTrace original={result.original} steps={norm.steps} />
        </section>
      )}

      <p className="fine-left">
        Timing: normalize {result.timing_ms.normalize?.toFixed(1)} ms · predict {result.timing_ms.predict?.toFixed(1)} ms
        {result.timing_ms.explain != null && <> · explain {result.timing_ms.explain.toFixed(1)} ms</>} (server-side)
      </p>
      <Feedback recordId={result.record_id} labels={result.prediction.scores.map((s) => s.label)}
                currentLabel={result.prediction.label} />
    </div>
  )
}
