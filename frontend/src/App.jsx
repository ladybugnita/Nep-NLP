import { useEffect, useState } from 'react'
import { api } from './api'
import NewsTool from './components/NewsTool'
import SentimentTool from './components/SentimentTool'
import SpellTool from './components/SpellTool'
import TranslateTool from './components/TranslateTool'

const TABS = [
  { id: 'news', icon: '📰', label: 'News', ne: 'समाचार', comp: NewsTool },
  { id: 'sentiment', icon: '😊', label: 'Sentiment', ne: 'भावना', comp: SentimentTool },
  { id: 'spell', icon: '✍️', label: 'Spell-check', ne: 'हिज्जे', comp: SpellTool },
  { id: 'translate', icon: '🌐', label: 'Translate', ne: 'अनुवाद', comp: TranslateTool },
]

export default function App() {
  const [active, setActive] = useState('news')
  const [info, setInfo] = useState(null)
  const ActiveComp = TABS.find((t) => t.id === active).comp

  useEffect(() => {
    api.mlInfo().then(setInfo).catch(() => setInfo(null))
  }, [])

  return (
    <div className="app">
      <header className="hero">
        <h1>Nep<span className="accent">NLP</span></h1>
        <p className="tagline">नेपाली भाषाका लागि प्राकृतिक भाषा प्रशोधन उपकरण</p>
        <p className="tagline-en">An open NLP toolkit for Nepali, an under-served language.</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? 'active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            <span className="tab-ne">{t.ne}</span>
          </button>
        ))}
      </nav>

      <main className="card">
        <ActiveComp />
      </main>

      <footer className="footer">
        {info?.tools ? (
          <div className="status">
            {info.tools.map((t) => (
              <span key={t.name} className={`pill ${t.ready ? 'up' : 'down'}`}>
                {t.name}: {t.tier}
              </span>
            ))}
          </div>
        ) : (
          <div className="status"><span className="pill down">backend/ML not reachable</span></div>
        )}
        <p className="fine">
          Baselines run instantly; drop a Colab-trained transformer into the model store to
          upgrade any tool. Built with React · Spring Boot · MongoDB · FastAPI + Hugging Face.
        </p>
      </footer>
    </div>
  )
}
