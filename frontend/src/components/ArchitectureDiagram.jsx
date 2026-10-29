export default function ArchitectureDiagram() {
  return (
    <figure className="arch">
      <svg viewBox="0 0 760 330" role="img" aria-labelledby="arch-title arch-desc">
        <title id="arch-title">NepNLP architecture</title>
        <desc id="arch-desc">
          The React frontend calls the Spring Boot API, which stores analyses in MongoDB and
          calls the Python FastAPI ML service. The ML service runs the nepnorm pipeline —
          unicode, legacy font, script detection, transliteration, spelling — then the classifier.
        </desc>
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arch-arrowhead" />
          </marker>
        </defs>

        <g className="arch-box">
          <rect x="10" y="40" width="150" height="86" rx="12" />
          <text x="85" y="74" className="arch-h">React + Vite</text>
          <text x="85" y="96" className="arch-s">UI · 4 pages</text>
          <text x="85" y="112" className="arch-s">browser</text>
        </g>
        <g className="arch-box">
          <rect x="220" y="40" width="170" height="86" rx="12" />
          <text x="305" y="74" className="arch-h">Spring Boot API</text>
          <text x="305" y="96" className="arch-s">validation · persistence</text>
          <text x="305" y="112" className="arch-s">Java 17</text>
        </g>
        <g className="arch-box db">
          <rect x="220" y="232" width="170" height="70" rx="12" />
          <text x="305" y="262" className="arch-h">MongoDB</text>
          <text x="305" y="283" className="arch-s">analyses · feedback</text>
        </g>
        <g className="arch-box ml">
          <rect x="450" y="10" width="300" height="306" rx="14" />
          <text x="600" y="38" className="arch-h">FastAPI ML service</text>
          <text x="600" y="56" className="arch-s">Python · CPU-only</text>
          {['Unicode cleanup', 'Legacy font (Preeti)', 'Script detection', 'Transliteration', 'Spelling'].map((s, i) => (
            <g key={s} className="arch-step">
              <rect x="475" y={70 + i * 36} width="250" height="28" rx="7" />
              <text x="600" y={89 + i * 36} className="arch-t">{i + 1}. {s}</text>
            </g>
          ))}
          <text x="600" y="265" className="arch-s">nepnorm pipeline ↑  ·  classifier ↓</text>
          <g className="arch-step model">
            <rect x="475" y="274" width="250" height="30" rx="7" />
            <text x="600" y="294" className="arch-t">TF-IDF baseline / transformer</text>
          </g>
        </g>

        <line x1="160" y1="83" x2="218" y2="83" className="arch-line" markerEnd="url(#ah)" />
        <text x="189" y="74" className="arch-l">REST</text>
        <line x1="390" y1="83" x2="448" y2="83" className="arch-line" markerEnd="url(#ah)" />
        <text x="419" y="74" className="arch-l">REST</text>
        <line x1="305" y1="126" x2="305" y2="230" className="arch-line" markerEnd="url(#ah)" markerStart="url(#ah)" />
        <text x="314" y="182" className="arch-l start">save / feedback</text>
      </svg>
      <figcaption className="fine-left">
        Why a separate Python model server? The NLP ecosystem (Hugging Face, PyTorch, scikit-learn)
        is Python-first, while Java/Spring is a strong application tier (typing, validation,
        persistence). Splitting them lets the heavy, slow-starting model server scale and restart
        independently. The usual “application server + model server” pattern.
      </figcaption>
    </figure>
  )
}
