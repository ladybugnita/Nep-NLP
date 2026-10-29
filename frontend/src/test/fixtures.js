import { vi } from 'vitest'

import analyze from '../../../backend/src/test/resources/fixtures/analyze_response.json'

export const analyzeResponse = { ...analyze, record_id: null }

export function mockFetch(routes) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts = {}) => {
    const key = Object.keys(routes).find((k) => String(url).includes(k))
    if (!key) return new Response('{}', { status: 404 })
    const r = typeof routes[key] === 'function' ? routes[key](url, opts) : routes[key]
    return new Response(JSON.stringify(r.body ?? r), { status: r.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  })
}
