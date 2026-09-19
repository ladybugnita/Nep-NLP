import { useState } from 'react'
import { api } from '../api'
import { examples } from '../data/examples'
import InputPanel from './InputPanel'

export default function TranslateTool() {
  const [text, setText] = useState('')
  const [dir, setDir] = useState('ne-en') 
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [source, target] = dir.split('-')

  async function run() {
    setLoading(true); setError(''); setResult(null)
    try {
      setResult(await api.translate(text, source, target))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="tool-desc">Translate between Nepali and English.</p>
      <InputPanel
        value={text} onChange={setText} onRun={run} loading={loading} error={error}
        examples={dir === 'ne-en' ? examples.translate : ['Nepal is a beautiful country.', 'How are you?']}
        buttonLabel="Translate"
        placeholder={source === 'ne' ? 'नेपाली वाक्य…' : 'English sentence…'}
      >
        <div className="dir-toggle">
          <button className={dir === 'ne-en' ? 'active' : ''} onClick={() => setDir('ne-en')}>ने → EN</button>
          <button className={dir === 'en-ne' ? 'active' : ''} onClick={() => setDir('en-ne')}>EN → ने</button>
        </div>
      </InputPanel>
      {result && (
        result.available
          ? <div className="result"><div className="translation">{result.translation}</div>
              <div className="sub">model: {result.model}</div></div>
          : <div className="result notice">
              <strong>Translation model not loaded.</strong>
              <p className="sub">{result.detail}</p>
            </div>
      )}
    </div>
  )
}
