
export function segments(text, explanation = []) {
  const spans = [...explanation].filter((e) => e.end > e.start).sort((a, b) => a.start - b.start)
  const max = Math.max(1e-9, ...spans.map((e) => Math.abs(e.weight)))
  const out = []
  let pos = 0
  for (const e of spans) {
    if (e.start < pos) continue 
    if (e.start > pos) out.push({ text: text.slice(pos, e.start) })
    out.push({ text: text.slice(e.start, e.end), dir: e.direction, strength: Math.abs(e.weight) / max, weight: e.weight })
    pos = e.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos) })
  return out
}

export default function ExplainedText({ text, explanation, method }) {
  if (!text) return null
  const segs = segments(text, explanation)
  const any = segs.some((s) => s.dir)
  return (
    <div className="explained">
      <p className="explained-text" lang="ne">
        {segs.map((s, i) => s.dir ? (
          <mark key={i} className={`xw ${s.dir}`}
                style={{ '--s': (0.25 + 0.75 * s.strength).toFixed(2) }}
                title={`${s.dir === 'supports' ? 'supports' : 'goes against'} the prediction (Δ ${s.weight.toFixed(3)})`}>
            {s.text}
          </mark>
        ) : <span key={i}>{s.text}</span>)}
      </p>
      <p className="fine-left">
        {any
          ? <>Highlighted: words whose removal changes the model’s score most (<span className="xw supports xw-key">supports</span> <span className="xw against xw-key">against</span>) — method: {method}. This shows what <em>this model</em> relies on, not linguistic truth.</>
          : `No single word changed the score noticeably (${method}).`}
      </p>
    </div>
  )
}
