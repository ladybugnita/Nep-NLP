import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import BeforeAfter from '../components/BeforeAfter'
import { ErrorBox, Loading } from '../components/Status'
import { showcase } from '../data/examples'

function ShowcaseCard({ item }) {
  const [state, setState] = useState({ loading: false, error: '', result: null })
  async function run() {
    setState({ loading: true, error: '', result: null })
    try {
      setState({ loading: false, error: '', result: await api.analyze(item.text, { task: item.task }) })
    } catch (e) {
      setState({ loading: false, error: e.message, result: null })
    }
  }
  return (
    <article className="show-card" data-testid={`show-${item.id}`}>
      <header>
        <h3>{item.title} <span className="ne" lang="ne">{item.ne}</span></h3>
        <p className="sub">{item.why}</p>
      </header>
      <div className="show-example">
        <code lang="ne">{item.text}</code>
        <button className="run small" onClick={run} disabled={state.loading}>
          {state.result ? 'Run again' : 'Run example'}
        </button>
      </div>
      <Loading loading={state.loading} />
      <ErrorBox error={state.error} onRetry={run} />
      {state.result && (
        <>
          <BeforeAfter result={state.result} compact />
          <Link className="linkish" to={`/how-it-works?text=${encodeURIComponent(item.text)}`}>
            See every step →
          </Link>
        </>
      )}
    </article>
  )
}

export default function Landing() {
  return (
    <div className="page landing">
      <section className="pitch">
        <h1 className="display">Nepali NLP for Nepali <em>as it is actually typed</em>.</h1>
        <p className="lead">
          Online, Nepali is written in Latin letters, mixed with English, misspelled, and sometimes
          still in the old Preeti font. NepNLP’s <strong>nepnorm</strong> pipeline turns all of that
          into clean Devanagari <em>before</em> a model sees it and shows every step, the words the
          prediction relied on, and when it isn’t sure.
        </p>
        <div className="cta">
          <Link className="run" to="/tools">Try the tools</Link>
          <Link className="ghost" to="/how-it-works">How it works</Link>
          <Link className="ghost" to="/evaluation">Evaluation</Link>
        </div>
      </section>

      <div className="demo-note" role="note">
        <strong>Demo model.</strong> The sentiment classifier here is a TF-IDF baseline trained on 252
        template-generated sentences, so its predictions are illustrative and can be wrong. The normalization pipeline is the focus. Measured results
        with sample sizes are on the <Link to="/evaluation">Evaluation</Link> page.
      </div>

      <section className="showcase" aria-label="One-click examples">
        {showcase.map((item) => <ShowcaseCard key={item.id} item={item} />)}
      </section>

      <section className="stack">
        <h2 className="sec">Built with</h2>
        <div className="stack-chips">
          {['React + Vite', 'Spring Boot (Java 17)', 'FastAPI (Python)', 'MongoDB', 'scikit-learn', 'Hugging Face (optional tier)', 'nepnorm — stdlib-only library'].map((s) => (
            <span key={s} className="pill">{s}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
