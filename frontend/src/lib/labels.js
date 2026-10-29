
export const SENTIMENT = {
  'सकारात्मक': { en: 'Positive', cls: 'pos', emoji: '😊' },
  'नकारात्मक': { en: 'Negative', cls: 'neg', emoji: '😞' },
  'तटस्थ': { en: 'Neutral', cls: 'neu', emoji: '😐' },
}

export const TOPICS = {
  'राजनीति': 'Politics',
  'खेलकुद': 'Sports',
  'प्रविधि': 'Technology',
  'अर्थतन्त्र': 'Economy',
  'मनोरञ्जन': 'Entertainment',
}

export function labelInfo(label, task = 'sentiment') {
  if (task === 'sentiment' && SENTIMENT[label]) return SENTIMENT[label]
  return { en: TOPICS[label] || label, cls: 'topic', emoji: '' }
}

export const SCRIPTS = {
  devanagari: { name: 'Devanagari', short: 'DEV', cls: 'dev' },
  roman_nepali: { name: 'Romanized Nepali', short: 'ROM', cls: 'rom' },
  english: { name: 'English', short: 'ENG', cls: 'eng' },
  other: { name: 'Other', short: '—', cls: 'oth' },
}

export const STEPS = {
  unicode: {
    title: 'Unicode cleanup',
    what: 'NFC composition, invisible zero-width characters removed, “|” → “।”, split vowel signs (ा+े → ो) merged.',
  },
  legacy: {
    title: 'Legacy font (Preeti)',
    what: 'Detects text typed in the pre-Unicode Preeti font (stored as Latin bytes, e.g. नेपाल = “g]kfn”) and converts it.',
  },
  detect: {
    title: 'Script detection',
    what: 'Tags every word: Devanagari, Romanized Nepali, English or other — so English words in mixed text are left alone.',
  },
  transliterate: {
    title: 'Transliteration',
    what: 'Romanized Nepali → Devanagari using a shorthand lexicon, a dictionary-guided search and suffix splitting.',
  },
  spell: {
    title: 'Spelling',
    what: 'Akshara-aware correction (श/ष/स, इ/ई, ँ/ं …). Only a single, clear, cheap fix is applied; everything else is just flagged.',
  },
}

export function summarizeStep(step) {
  if (!step.enabled) return 'Skipped'
  const d = step.details || {}
  switch (step.name) {
    case 'unicode': {
      const parts = []
      if (d.nfc_changed) parts.push('composed forms fixed')
      if (d.zero_width_removed) parts.push(`${d.zero_width_removed} invisible char${d.zero_width_removed > 1 ? 's' : ''} removed`)
      if (d.danda_fixed) parts.push(`${d.danda_fixed} danda fixed`)
      if (d.vowel_sequences_fixed) parts.push(`${d.vowel_sequences_fixed} vowel sign${d.vowel_sequences_fixed > 1 ? 's' : ''} merged`)
      return parts.length ? parts.join(' · ') : 'Already clean'
    }
    case 'legacy': {
      const n = (d.lines_converted || []).length
      return n ? `Preeti detected ${n} line${n > 1 ? 's' : ''} converted` : 'No legacy-font text'
    }
    case 'detect': {
      const c = d.counts || {}
      const parts = Object.entries(c).filter(([, v]) => v > 0)
        .map(([k, v]) => `${v} ${(SCRIPTS[k]?.name || k).toLowerCase()}`)
      return (parts.join(' · ') || 'No words') + (d.is_code_mixed ? ' — code-mixed' : '')
    }
    case 'transliterate': {
      if (!d.converted) return 'Nothing to transliterate'
      const kept = d.kept_english ? `, ${d.kept_english} English kept` : ''
      const mode = d.mode === 'all-latin' ? ' (no script detection: every Latin word converted)' : ''
      return `${d.converted} word${d.converted > 1 ? 's' : ''} transliterated${kept}${mode}`
    }
    case 'spell': {
      if (!d.unknown) return 'No unknown words'
      const fixed = (d.flagged || []).filter((f) => f.corrected).map((f) => `${f.word} → ${f.suggestions[0]?.text}`)
      const flagged = d.unknown - fixed.length
      return [fixed.length ? `fixed ${fixed.join(', ')}` : null,
        flagged ? `${flagged} flagged, not changed` : null].filter(Boolean).join(' · ')
    }
    default:
      return step.changed ? 'Changed' : 'No change'
  }
}

export const pct = (x, digits = 0) => `${(x * 100).toFixed(digits)}%`

export function sampleLabel(n) {
  if (n == null) return null
  if (n < 100) return 'preliminary, very small sample'
  if (n < 500) return 'preliminary, small sample'
  return null
}
