import { describe, expect, it } from 'vitest'
import { labelInfo, pct, sampleLabel, summarizeStep } from '../lib/labels'
import { analyzeResponse } from './fixtures'

const step = (name, details, extra = {}) => ({ name, enabled: true, changed: false, details, ...extra })

describe('summarizeStep', () => {
  it('describes every step of a real trace without throwing', () => {
    for (const s of analyzeResponse.normalization.steps) {
      expect(summarizeStep(s)).toEqual(expect.any(String))
    }
  })
  it('unicode', () => {
    expect(summarizeStep(step('unicode', { nfc_changed: false, zero_width_removed: 0, danda_fixed: 0 }))).toBe('Already clean')
    expect(summarizeStep(step('unicode', { zero_width_removed: 2, danda_fixed: 1 }))).toBe('2 invisible chars removed · 1 danda fixed')
  })
  it('legacy', () => {
    expect(summarizeStep(step('legacy', { lines_converted: [0] }))).toMatch(/Preeti detected — 1 line converted/)
    expect(summarizeStep(step('legacy', { lines_converted: [] }))).toBe('No legacy-font text')
  })
  it('detect reports code-mixing', () => {
    const s = summarizeStep(step('detect', { counts: { devanagari: 0, roman_nepali: 4, english: 1 }, is_code_mixed: true }))
    expect(s).toBe('4 romanized nepali · 1 english — code-mixed')
  })
  it('transliterate explains the no-detection ablation', () => {
    expect(summarizeStep(step('transliterate', { converted: 3, kept_english: 1, mode: 'script-aware' })))
      .toBe('3 words transliterated, 1 English kept')
    expect(summarizeStep(step('transliterate', { converted: 2, mode: 'all-latin' }))).toMatch(/no script detection/)
  })
  it('spell separates fixes from flags', () => {
    const s = summarizeStep(step('spell', {
      unknown: 2,
      flagged: [{ word: 'देस', corrected: true, suggestions: [{ text: 'देश' }] }, { word: 'x', corrected: false, suggestions: [] }],
    }))
    expect(s).toBe('fixed देस → देश · 1 flagged, not changed')
  })
  it('disabled steps say so', () => {
    expect(summarizeStep({ name: 'spell', enabled: false })).toBe('Skipped')
  })
})

describe('helpers', () => {
  it('labelInfo maps sentiment and topics', () => {
    expect(labelInfo('सकारात्मक').en).toBe('Positive')
    expect(labelInfo('खेलकुद', 'news').en).toBe('Sports')
    expect(labelInfo('unknown', 'news').en).toBe('unknown')
  })
  it('sampleLabel is honest about small samples', () => {
    expect(sampleLabel(40)).toMatch(/very small/)
    expect(sampleLabel(200)).toMatch(/small sample/)
    expect(sampleLabel(1000)).toBeNull()
  })
  it('pct', () => { expect(pct(0.4567, 1)).toBe('45.7%') })
})
