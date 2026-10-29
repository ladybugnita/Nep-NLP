import { SCRIPTS, pct } from '../lib/labels'

export default function ScriptTokens({ detection }) {
  if (!detection) return null
  const words = detection.tokens.filter((t) => t.is_word)
  const used = [...new Set(words.map((t) => t.script))]
  return (
    <div className="scripts">
      <div className="script-chips">
        {words.map((t, i) => (
          <span key={i} className={`sc ${SCRIPTS[t.script]?.cls || 'oth'}`}
                title={`${SCRIPTS[t.script]?.name || t.script} · ${pct(t.confidence)} confidence`}>
            <span lang="ne">{t.text}</span><small>{SCRIPTS[t.script]?.short}</small>
          </span>
        ))}
      </div>
      <div className="legend">
        {used.map((s) => <span key={s} className={`sc ${SCRIPTS[s]?.cls}`}><small>{SCRIPTS[s]?.short}</small>{SCRIPTS[s]?.name}</span>)}
        {detection.is_code_mixed && <span className="badge">code-mixed</span>}
      </div>
    </div>
  )
}
