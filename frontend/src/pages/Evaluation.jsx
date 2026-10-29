import { useEffect, useState } from 'react'
import { fetchResults } from '../api'
import { pct, sampleLabel } from '../lib/labels'

function Provenance({ p }) {
  if (!p) return null
  return (
    <p className="fine-left prov">
      {p.run_at && <>run {p.run_at.slice(0, 10)}</>}
      {p.git_commit && <> · commit <code>{p.git_commit}</code></>}
      {p.data_file && <> · data <code>{p.data_file}</code></>}
      {p.data_sha256 && <> · sha256 <code>{p.data_sha256.slice(0, 10)}…</code></>}
    </p>
  )
}

function SampleBadge({ n }) {
  const label = sampleLabel(n)
  return (
    <span className="sample">
      n = {n}{label && <span className="badge warn">{label}</span>}
    </span>
  )
}

function PerfResult({ data }) {
  const rows = Object.entries(data.endpoints || {})
  return (
    <>
      <p className="sub">
        Cold start {(data.cold_start_ms / 1000).toFixed(1)} s · first /analyze {data.first_analyze_ms} ms ·
        {' '}{data.machine?.platform} · Python {data.machine?.python} · {data.note}
      </p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Endpoint</th><th>n</th><th>p50 ms</th><th>p95 ms</th><th>max ms</th></tr></thead>
          <tbody>
            {rows.map(([path, r]) => (
              <tr key={path}><td><code>{path}</code></td><td>{r.n}</td><td>{r.p50_ms}</td><td>{r.p95_ms}</td><td>{r.max_ms}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine-left prov">measured {data.run_at?.slice(0, 10)} · commit <code>{data.git_commit}</code></p>
    </>
  )
}

function MetricResult({ data, metrics }) {
  return (
    <>
      <SampleBadge n={data.n} />
      <div className="metrics">
        {metrics.filter(([k]) => data[k] != null).map(([k, name, fmt]) => (
          <div key={k} className="metric"><span className="metric-v">{fmt(data[k])}</span><span className="sub">{name}</span></div>
        ))}
      </div>
      <Provenance p={data.provenance} />
    </>
  )
}

function SystemsResult({ data }) {
  return (
    <>
      <SampleBadge n={data.n} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>System</th><th>CER ↓</th><th>Word acc. ↑</th><th>Exact ↑</th></tr></thead>
          <tbody>
            {Object.entries(data.systems || {}).map(([name, r]) => (
              <tr key={name}><td><code>{name}</code></td><td>{r.cer.toFixed(4)}</td><td>{pct(r.word_accuracy, 1)}</td><td>{pct(r.exact_match, 1)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Provenance p={data.provenance} />
    </>
  )
}

function IaaResult({ data }) {
  const k = (a) => (a.kappa == null ? 'n/a (too few)' : `${a.kappa.toFixed(3)} [${a.kappa_ci95[0].toFixed(2)}, ${a.kappa_ci95[1].toFixed(2)}]`)
  return (
    <>
      <SampleBadge n={data.n} />
      {Object.entries(data.pairs || {}).map(([pair, p]) => (
        <div key={pair} className="table-wrap">
          <table>
            <thead><tr><th>{pair.replace('~', ' vs ')}</th><th>n</th><th>agreement</th><th>Cohen’s κ [95% CI]</th></tr></thead>
            <tbody>
              <tr><td><strong>overall</strong></td><td>{p.overall.n}</td><td>{pct(p.overall.observed_agreement, 1)}</td><td>{k(p.overall)}</td></tr>
              {Object.entries(p.by_script || {}).map(([s, a]) => (
                <tr key={s}><td>script: {s}</td><td>{a.n}</td><td>{pct(a.observed_agreement, 1)}</td><td>{k(a)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Provenance p={data.provenance} />
    </>
  )
}

const f3 = (x) => (x == null ? '—' : x.toFixed(3))
const fmtP = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3))

function RobustnessResult({ data }) {
  const test = (m, c, cmp) => data.tests?.find((t) => t.model === m && t.condition === c && t.comparison === cmp)
  const ablations = (data.config?.normalization_variants || []).filter((v) => v.startsWith('ablate:'))
  return (
    <>
      <SampleBadge n={data.n} /> <span className="sample"> · train {data.n_train} · labels: {data.labels?.join(', ')}</span>
      {data.warnings?.length > 0 && (
        <ul className="warn-list" role="note">{data.warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>
      )}
      {Object.entries(data.results || {}).map(([model, conds]) => (
        <div key={model}>
          <h4 className="sec">{model} macro-F1, mean ± std over perturbation seeds</h4>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Condition</th><th>Achieved</th><th>No nepnorm</th><th>With nepnorm [95% CI]</th><th>Δ</th><th>Recovery</th><th>p (Holm)</th></tr></thead>
              <tbody>
                {Object.entries(conds).map(([c, r]) => {
                  const none = r.variants.none, full = r.variants.full
                  const t = test(model, c, 'perturbed: nepnorm vs none')
                  return (
                    <tr key={c}>
                      <td>{c}{r.circular && <span className="badge warn" title="generated from resources nepnorm also uses — optimistic">circular</span>}</td>
                      <td className="sub">{r.perturbation_meta?.achieved_rate != null ? `${pct(r.perturbation_meta.achieved_rate, 1)} words` : '—'}</td>
                      <td>{f3(none.macro_f1)} ± {f3(none.macro_f1_std)}</td>
                      <td>{f3(full.macro_f1)} ± {f3(full.macro_f1_std)} <span className="sub">[{f3(full.macro_f1_ci95[0])}, {f3(full.macro_f1_ci95[1])}]</span></td>
                      <td>{(full.macro_f1 - none.macro_f1 >= 0 ? '+' : '') + (full.macro_f1 - none.macro_f1).toFixed(3)}</td>
                      <td>{r.recovery == null ? '—' : pct(r.recovery)}</td>
                      <td>{t ? <>{fmtP(t.p_holm)}{t['significant_0.05'] && ' *'}</> : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {ablations.length > 0 && (
            <>
              <h4 className="sec">Ablation. Macro-F1 with one step removed </h4>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Condition</th><th>full</th>{ablations.map((a) => <th key={a}>− {a.split(':')[1]}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(conds).map(([c, r]) => (
                      <tr key={c}><td>{c}</td><td>{f3(r.variants.full.macro_f1_seed0 ?? r.variants.full.macro_f1)}</td>
                        {ablations.map((a) => <td key={a}>{f3(r.variants[a]?.macro_f1_seed0 ?? r.variants[a]?.macro_f1)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ))}
      {data.latency_full_pipeline_ms && (
        <p className="sub">nepnorm latency per text (p50 / p95 ms): {Object.entries(data.latency_full_pipeline_ms)
          .map(([c, l]) => `${c} ${l.p50_ms}/${l.p95_ms}`).join(' · ')}</p>
      )}
      <p className="fine-left">Recovery = share of the drop (clean → perturbed, no nepnorm) won back by nepnorm; shown only when the drop exceeds 0.01. p = McNemar exact test, nepnorm vs none on the same perturbed items, Holm-corrected across all tests in the run; * = significant at 0.05.</p>
      <Provenance p={data.provenance} />
    </>
  )
}

const RENDERERS = {
  robustness: { title: 'Robustness: performance drop and recovery with nepnorm', render: (d) => <RobustnessResult data={d} /> },
  inter_annotator_agreement: { title: 'Inter-annotator agreement', render: (d) => <IaaResult data={d} /> },
  perf: { title: 'Latency & cold start', render: (d) => <PerfResult data={d} /> },
  preeti_to_unicode: {
    title: 'Preeti → Unicode (human-typed gold set)',
    render: (d) => <MetricResult data={d} metrics={[['exact_match', 'exact match', (v) => pct(v, 1)], ['cer', 'char. error rate', (v) => v.toFixed(4)], ['word_accuracy', 'word accuracy', (v) => pct(v, 1)]]} />,
  },
  roman_to_devanagari: { title: 'Romanized → Devanagari (human-typed gold set)', render: (d) => <SystemsResult data={d} /> },
  spelling_correction: {
    title: 'Spelling correction (real misspellings)',
    render: (d) => <MetricResult data={d} metrics={[['top1', 'top-1', (v) => pct(v, 1)], ['top5', 'top-5', (v) => pct(v, 1)], ['detection', 'flagged', (v) => pct(v, 1)], ['false_alarm_rate', 'false alarms on correct words', (v) => pct(v, 1)]]} />,
  },
}

export function ResultCard({ file }) {
  const kind = file.kind || (file.data?.endpoints ? 'perf' : file.data?.task)
  const r = RENDERERS[kind]
  return (
    <article className="card result-card" data-testid="result-card">
      <h3>{r?.title || kind || file.file}</h3>
      {r ? r.render(file.data) : <pre className="details">{JSON.stringify(file.data, null, 2)}</pre>}
    </article>
  )
}

const PENDING = [
  'Robustness on a HUMAN-labelled sentiment test set, including naturally occurring Romanized / code-mixed text, for several models (TF-IDF, MuRIL, XLM-R, a Nepali model, an LLM). The run above uses silver news labels and one model.',
  'Preeti conversion accuracy. Needs human-typed Preeti samples.',
  'Transliteration accuracy. Needs volunteers’ real Romanized typing.',
  'Spelling correction accuracy. Needs real misspellings (dictation).',
  'Calibration of confidence scores. Until then scores are shown as raw model outputs.',
]

export default function Evaluation() {
  const [state, setState] = useState({ loading: true, files: [] })
  useEffect(() => {
    fetchResults().then((r) => setState({ loading: false, files: r.files }))
      .catch(() => setState({ loading: false, files: [] }))
  }, [])

  return (
    <div className="page">
      <h1 className="display small">Evaluation</h1>
      <p className="lead">
        Every number on this page is read from a result file produced by a script, with its sample
        size, data hash and git commit. Nothing is typed in by hand, and nothing is shown that
        hasn’t been measured.
      </p>

      {state.loading && <p className="sub">Loading results…</p>}
      {!state.loading && state.files.length === 0 && (
        <div className="card empty" data-testid="no-results">
          <strong>No evaluation results published yet.</strong>
          <p className="sub">Run the evaluation scripts and <code>scripts/export_results.py</code> to publish them here.</p>
        </div>
      )}
      <div className="results">
        {state.files.map((f) => <ResultCard key={f.file} file={f} />)}
      </div>

      <section className="card pending">
        <h2 className="sec">Not measured yet — and why</h2>
        <ul>{PENDING.map((p) => <li key={p}>{p}</li>)}</ul>
        <p className="fine-left">
          The bundled sentiment model is trained on 252 template-generated sentences; any accuracy measured on
          a split of that data would be inflated by near-duplicates, so none is reported.
        </p>
      </section>
    </div>
  )
}
