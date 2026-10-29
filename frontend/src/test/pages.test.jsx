import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { api, friendlyError } from '../api'
import Evaluation from '../pages/Evaluation'
import Landing from '../pages/Landing'
import { analyzeResponse, mockFetch } from './fixtures'

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('api client', () => {
  it('maps failures to actionable messages', () => {
    expect(friendlyError(0)).toMatch(/free hosting/)
    expect(friendlyError(503)).toMatch(/waking up/)
    expect(friendlyError(400, { message: 'task: bad' })).toBe('task: bad')
  })
  it('throws the friendly message on HTTP errors and network failures', async () => {
    mockFetch({ '/api/analyze': { status: 503, body: { message: 'down' } } })
    await expect(api.analyze('x')).rejects.toThrow(/waking up/)
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api.analyze('x')).rejects.toThrow(/Can’t reach the server/)
  })
  it('sends the task and disabled steps', async () => {
    const spy = mockFetch({ '/api/analyze': analyzeResponse })
    await api.analyze('k xa', { task: 'news', disable: ['spell'] })
    const [url, opts] = spy.mock.calls[0]
    expect(url).toBe('/api/analyze')
    expect(JSON.parse(opts.body)).toEqual({ text: 'k xa', task: 'news', disable: ['spell'], normalize: true })
  })
})

describe('Landing', () => {
  it('runs a one-click example and shows without/with nepnorm', async () => {
    const spy = mockFetch({ '/api/analyze': analyzeResponse })
    inRouter(<Landing />)
    const card = screen.getByTestId('show-codemixed')
    await userEvent.click(within(card).getByRole('button', { name: 'Run example' }))
    await waitFor(() => expect(within(card).getByText('With nepnorm')).toBeInTheDocument())
    expect(within(card).getByText(analyzeResponse.model_input)).toBeInTheDocument()
    expect(JSON.parse(spy.mock.calls[0][1].body).text).toBe('service ekdam dhilo ra naramro thiyo')
    expect(within(card).getByRole('link', { name: /See every step/ })).toHaveAttribute('href', expect.stringContaining('/how-it-works?text='))
  })
  it('shows the honest demo-model note', () => {
    inRouter(<Landing />)
    expect(screen.getByRole('note')).toHaveTextContent(/template-generated/)
  })
  it('shows a friendly error when the API is down', async () => {
    mockFetch({ '/api/analyze': { status: 503, body: {} } })
    inRouter(<Landing />)
    const card = screen.getByTestId('show-preeti')
    await userEvent.click(within(card).getByRole('button', { name: 'Run example' }))
    await waitFor(() => expect(within(card).getByRole('alert')).toHaveTextContent(/waking up/))
  })
})

describe('Evaluation', () => {
  it('says so when no results are published — and invents nothing', async () => {
    mockFetch({ 'results/index.json': { files: [] } })
    inRouter(<Evaluation />)
    expect(await screen.findByTestId('no-results')).toBeInTheDocument()
    expect(screen.queryByTestId('result-card')).not.toBeInTheDocument()
  })
  it('renders numbers only from result files, with sample-size labels', async () => {
    mockFetch({
      'results/index.json': { files: [{ file: 'perf.json', kind: 'perf' }, { file: 'tr.json', kind: 'roman_to_devanagari' }] },
      'results/perf.json': { cold_start_ms: 5463.3, first_analyze_ms: 27.2, endpoints: { '/analyze': { n: 100, p50_ms: 20.67, p95_ms: 40.39, max_ms: 48.3 } }, machine: {}, git_commit: 'abc1234', run_at: '2026-09-27T00:00:00' },
      'results/tr.json': { task: 'roman_to_devanagari', n: 42, systems: { pipeline: { cer: 0.1234, word_accuracy: 0.8, exact_match: 0.5 } }, provenance: { git_commit: 'abc1234', data_sha256: 'f'.repeat(64) } },
    })
    inRouter(<Evaluation />)
    const cards = await screen.findAllByTestId('result-card')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('20.67')).toBeInTheDocument()
    expect(within(cards[1]).getByText('0.1234')).toBeInTheDocument()
    expect(within(cards[1]).getByText(/very small sample/)).toBeInTheDocument()
  })

  it('renders a robustness result with its warnings, circular flag and Holm p-values', async () => {
    const v = (f1) => ({ macro_f1: f1, macro_f1_std: 0.01, macro_f1_ci95: [f1 - 0.05, f1 + 0.05], accuracy: f1, ece: 0.1, per_class_f1: {}, n_seeds: 3 })
    mockFetch({
      'results/index.json': { files: [{ file: 'rob.json', kind: 'robustness' }] },
      'results/rob.json': {
        task: 'robustness', n: 196, n_train: 457, labels: ['a', 'b'],
        warnings: ['silver labels (keyword rules)'],
        config: { normalization_variants: ['none', 'full', 'ablate:legacy'] },
        results: { 'tfidf-lr': {
          clean: { variants: { none: v(0.8), full: v(0.8), 'ablate:legacy': v(0.8) }, recovery: null, circular: false },
          preeti: { variants: { none: v(0.1), full: v(0.78), 'ablate:legacy': v(0.1) }, recovery: 0.97, circular: true },
        } },
        tests: [{ model: 'tfidf-lr', condition: 'preeti', comparison: 'perturbed: nepnorm vs none', p: 0.0001, p_holm: 0.0002, 'significant_0.05': true }],
        latency_full_pipeline_ms: { preeti: { n: 10, p50_ms: 1.2, p95_ms: 2.5 } },
        provenance: { git_commit: 'abc', data_sha256: 'e'.repeat(64) },
      },
    })
    inRouter(<Evaluation />)
    const [card] = await screen.findAllByTestId('result-card')
    expect(within(card).getByRole('note')).toHaveTextContent('silver labels')
    expect(within(card).getByText('circular')).toBeInTheDocument()
    expect(within(card).getByText('+0.680')).toBeInTheDocument()
    expect(within(card).getByText('97%')).toBeInTheDocument()
    expect(within(card).getByText(/<0.001/)).toBeInTheDocument()
    expect(within(card).getByText(/preliminary — small sample/)).toBeInTheDocument()
  })
})
