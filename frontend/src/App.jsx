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

function getStoredTheme() {
  try { return localStorage.getItem('nepnlp-theme') } catch { return null }
}

export default function App() {
  const [active, setActive] = useState('news')
  const [info, setInfo] = useState(null)
  const [theme, setTheme] = useState(getStoredTheme) // 'light' | 'dark' | null (=follow system)
  const ActiveComp = TABS.find((t) => t.id === active).comp

  useEffect(() => {
    api.mlInfo().then(setInfo).catch(() => setInfo(null))
  }, [])

  // Apply + persist the theme. null removes the attribute so the OS preference wins.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')
    try {
      if (theme) localStorage.setItem('nepnlp-theme', theme)
      else localStorage.removeItem('nepnlp-theme')
    } catch { /* storage may be unavailable */ }
  }, [theme])

  const systemDark = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  const effectiveDark = theme ? theme === 'dark' : systemDark

  return (
    <div className="app">
      <button
        className="theme-toggle"
        onClick={() => setTheme(effectiveDark ? 'light' : 'dark')}
        title={`Switch to ${effectiveDark ? 'light' : 'dark'} mode`}
        aria-label="Toggle color theme"
      >
        {effectiveDark ? '☀️' : '🌙'}
      </button>
      <header className="hero">
        <div className="brand">
          <svg className="flag" viewBox="0 0 90 108" xmlns="http://www.w3.org/2000/svg" aria-label="Nepal flag">
            {/* crimson field with thick blue border (double pennant) */}
            <path className="field" d="M10 6 L68 40 L36 46 L74 74 L10 100 Z"
                  strokeWidth="6" strokeLinejoin="round" />
            {/* white crescent moon — upper pennant */}
            <path className="ink" d="M23 31 A10 10 0 0 0 41 31 A13 13 0 0 1 23 31 Z" />
            {/* white 12-point sun — lower pennant */}
            <path className="ink" d="M46 72 L39.8 73.8 L44.3 78.5 L38 77 L39.5 83.3 L34.8 78.8
              L33 85 L31.2 78.8 L26.5 83.3 L28.1 77 L21.7 78.5 L26.2 73.8 L20 72 L26.2 70.2
              L21.7 65.5 L28.1 67 L26.5 60.7 L31.2 65.2 L33 59 L34.8 65.2 L39.5 60.7 L38 67
              L44.3 65.5 L39.8 70.2 Z" />
          </svg>
          <h1><span className="brand-blue">Nep</span><span className="brand-red">NLP</span></h1>
        </div>
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
