import { useSearchParams } from 'react-router-dom'
import AnalyzeTool from '../components/AnalyzeTool'
import NewsTool from '../components/NewsTool'
import SentimentTool from '../components/SentimentTool'
import SpellTool from '../components/SpellTool'
import TranslateTool from '../components/TranslateTool'

const TABS = [
  { id: 'analyze', label: 'Analyze', ne: 'विश्लेषण', comp: AnalyzeTool },
  { id: 'news', label: 'News', ne: 'समाचार', comp: NewsTool },
  { id: 'sentiment', label: 'Sentiment', ne: 'भावना', comp: SentimentTool },
  { id: 'spell', label: 'Spell-check', ne: 'हिज्जे', comp: SpellTool },
  { id: 'translate', label: 'Translate', ne: 'अनुवाद', comp: TranslateTool },
]

export default function Tools() {
  const [params, setParams] = useSearchParams()
  const active = TABS.find((t) => t.id === params.get('tool')) || TABS[0]
  const Active = active.comp
  return (
    <div className="page">
      <nav className="tabs" role="tablist" aria-label="Tools">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={active.id === t.id}
                  className={`tab ${active.id === t.id ? 'active' : ''}`}
                  onClick={() => setParams({ tool: t.id })}>
            <span className="tab-label">{t.label}</span>
            <span className="tab-ne" lang="ne">{t.ne}</span>
          </button>
        ))}
      </nav>
      <main className="card" role="tabpanel">
        <Active />
      </main>
    </div>
  )
}
