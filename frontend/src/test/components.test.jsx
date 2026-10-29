import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ExplainedText, { segments } from '../components/ExplainedText'
import PipelineTrace from '../components/PipelineTrace'
import PredictionCard from '../components/PredictionCard'
import ScriptTokens from '../components/ScriptTokens'
import { analyzeResponse } from './fixtures'

const pred = (over = {}) => ({
  label: 'नकारात्मक', confidence: 0.9, model: 'baseline', uncertain: false, uncertain_reason: null,
  calibrated: false, scores: [{ label: 'नकारात्मक', score: 0.9 }, { label: 'तटस्थ', score: 0.1 }], ...over,
})

describe('PredictionCard', () => {
  it('shows a confident label with its English name', () => {
    render(<PredictionCard prediction={pred()} />)
    expect(screen.getByText('नकारात्मक', { selector: '.pred-label' })).toBeInTheDocument()
    expect(screen.getByText(/Negative · 90% model score/)).toBeInTheDocument()
    expect(screen.getByText(/not yet calibrated/)).toBeInTheDocument()
  })
  it('shows "Not sure" with the reason instead of a label when uncertain', () => {
    render(<PredictionCard prediction={pred({ uncertain: true, confidence: 0.45, uncertain_reason: 'confidence 0.45 < 0.50' })} />)
    expect(screen.getByText('Not sure')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('confidence 0.45 < 0.50')
    expect(screen.getByTestId('prediction')).toHaveClass('uncertain')
  })
})

describe('ExplainedText', () => {
  it('segments text by explanation spans, ignoring overlaps', () => {
    const segs = segments('ab cd ef', [
      { word: 'cd', start: 3, end: 5, weight: 0.4, direction: 'supports' },
      { word: 'd e', start: 4, end: 7, weight: 0.1, direction: 'against' }, 
      { word: 'ab', start: 0, end: 2, weight: -0.2, direction: 'against' },
    ])
    expect(segs.map((s) => s.text).join('')).toBe('ab cd ef')
    expect(segs.filter((s) => s.dir).map((s) => [s.text, s.dir])).toEqual([['ab', 'against'], ['cd', 'supports']])
    expect(segs.find((s) => s.text === 'cd').strength).toBe(1)
  })
  it('highlights the real explanation words of an API response', () => {
    const { model_input, explanation, explanation_method } = analyzeResponse
    const { container } = render(<ExplainedText text={model_input} explanation={explanation} method={explanation_method} />)
    const marks = [...container.querySelectorAll('mark')].map((m) => m.textContent)
    expect(marks.sort()).toEqual(explanation.map((e) => e.word).sort())
    expect(container.querySelector('.explained-text')).toHaveTextContent(model_input)
  })
})

describe('PipelineTrace', () => {
  it('lists every step with its state and reveals details on demand', async () => {
    const steps = analyzeResponse.normalization.steps
    render(<PipelineTrace original={analyzeResponse.original} steps={steps} />)
    for (const s of steps) expect(screen.getByTestId(`step-${s.name}`)).toBeInTheDocument()
    const tr = screen.getByTestId('step-transliterate')
    expect(within(tr).getByText('changed')).toBeInTheDocument()
    await userEvent.click(within(tr).getByRole('button', { name: 'details' }))
    expect(within(tr).getByText(/script-aware/)).toBeInTheDocument()
  })
  it('marks disabled steps as off', () => {
    render(<PipelineTrace original="x" steps={[{ name: 'spell', enabled: false, changed: false, input: 'x', output: 'x', details: {}, elapsed_ms: 0 }]} />)
    expect(within(screen.getByTestId('step-spell')).getByText('off')).toBeInTheDocument()
  })
})

describe('ScriptTokens', () => {
  it('tags each word and flags code-mixing', () => {
    render(<ScriptTokens detection={analyzeResponse.normalization.detection} />)
    expect(screen.getByText('service').parentElement).toHaveClass('eng')
    expect(screen.getByText('code-mixed')).toBeInTheDocument()
  })
})
