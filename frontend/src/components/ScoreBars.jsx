export default function ScoreBars({ scores }) {
  if (!scores?.length) return null
  return (
    <div className="bars">
      {scores.map((s) => (
        <div className="bar-row" key={s.label}>
          <span className="bar-label">{s.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.round(s.score * 100)}%` }} />
          </div>
          <span className="bar-pct">{(s.score * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}
