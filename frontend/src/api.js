async function post(path, body) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.detail || `Request failed (${res.status})`)
  }
  return data
}

async function get(path) {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export const api = {
  news: (text) => post('/news', { text }),
  sentiment: (text) => post('/sentiment', { text }),
  spellcheck: (text) => post('/spellcheck', { text }),
  translate: (text, source, target) => post('/translate', { text, source, target }),
  mlInfo: () => get('/ml-info'),
}
