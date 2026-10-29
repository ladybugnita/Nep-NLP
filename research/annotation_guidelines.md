# Annotation guidelines — NepNLP 3-class sentiment (v0.1, draft)

> Status: draft rules written 2026-09-27. **Examples are TODO(human)**: fill each slot with a
> real (anonymized) sentence from the collected pool, agreed by at least two annotators.
> Freeze a version number before the κ study; record every change in the changelog below.

## 1. Task

Label the sentiment the **writer** expresses in the text:

| Label | Meaning |
|-------|---------|
| **सकारात्मक** (positive) | praise, satisfaction, gratitude, joy, approval, hope |
| **नकारात्मक** (negative) | criticism, complaint, anger, disappointment, sadness, contempt |
| **तटस्थ** (neutral) | factual statement, neutral question, announcement, no clear opinion |
| **skip** | unreadable, not Nepali, or still unsure after reading twice — flag the reason |

Label the text as a whole, as a native reader would understand it. Do not look up the
source, and do not discuss items with the other annotator before both have labelled them.

## 2. General rules

1. **Intended meaning wins.** Label what the writer means, not the literal words.
2. **Dominant sentiment.** If both positive and negative are present, choose the one the
   text as a whole leans to and set the `mixed` flag. If they are truly balanced → तटस्थ + `mixed`.
3. **Target doesn't matter.** Negative about a bad thing ("भ्रष्टाचार अन्त्य होस्") can be
   an overall positive/hopeful stance — label the writer's attitude.
4. **Reported speech.** Neutral reporting of someone else's opinion ("मन्त्रीले ... भने")
   is तटस्थ unless the writer adds their own evaluation.
5. **Spelling, grammar and script never change the label.**

## 3. Hard cases

| Case | Rule | Example (TODO(human)) |
|------|------|-----------------------|
| Sarcasm / irony | intended meaning; flag `sarcasm` | TODO(human) |
| Mixed sentiment | dominant; flag `mixed` | TODO(human) |
| Questions | तटस्थ unless rhetorical/loaded ("यो पनि सेवा हो?" → नकारात्मक) | TODO(human) |
| Emoji only / emoji + neutral words | emoji polarity decides (😊 → सकारात्मक, 😡 → नकारात्मक) | TODO(human) |
| Wishes, greetings ("शुभकामना") | सकारात्मक | TODO(human) |
| Requests, instructions | तटस्थ unless they carry complaint | TODO(human) |
| News headline about a bad event, no opinion | तटस्थ | TODO(human) |
| Needs outside context (reply fragment) | best reading + flag `needs_context`; skip if impossible | TODO(human) |

## 4. Romanized Nepali and code-mixed text

Nepali written in Latin letters and Nepali–English mixing are labelled **exactly like
Devanagari**. Specific rules:

1. **Read it aloud.** Chat spellings (`k xa`, `kasto chha`, `ramro cha`) are ordinary
   Nepali; do not penalise or reward the spelling.
2. **English words carry sentiment too.** In "service ekdam slow thiyo" the English word
   *slow* is the sentiment carrier → नकारात्मक.
3. **English-only text** (no Nepali word) → `skip` + flag `not_nepali` (out of scope).
4. **Hindi/other-language words** mixed in: label if the text is recognisably Nepali
   overall; otherwise skip + `not_nepali`.
5. **Ambiguous romanization** (`pani` = also / water): use context; if it changes the
   sentiment and context doesn't decide → skip.
6. **Legacy-font gibberish** (e.g. `g]kfn`): it has been converted for you; if it still looks
   broken, skip and note "encoding".

| Case | Example (TODO(human)) | Label |
|------|-----------------------|-------|
| Romanized, positive | TODO(human) | |
| Romanized, negative | TODO(human) | |
| Code-mixed, English word carries sentiment | TODO(human) | |
| Code-mixed, neutral | TODO(human) | |
| English only → skip | TODO(human) | skip |

## 5. Privacy

Texts are anonymized automatically (e-mails, URLs, @handles, phone numbers). **Names are
not** — if you see a private person's name, set the `contains_name` flag so it can be
removed before publication. Public figures in news are fine.

## 6. Procedure

1. Use a pseudonymous ID (A1, A2 …) in the annotation tool (`/annotate`). Never a real name.
2. Both annotators label the **same** items independently (the tool never shows the other's label).
3. After a first batch of ~100 items, compute κ (`python scripts/iaa.py`). If κ < 0.6
   overall or on any script type, discuss disagreements, refine these rules, bump the
   version, and **re-label a fresh batch** (never re-label the same items to raise κ).
4. Remaining disagreements are adjudicated in `/annotate/adjudicate`; unresolved items are
   excluded from the dataset, not guessed.
5. Report κ overall **and per script type** (Devanagari / Romanized / code-mixed).

## Changelog

- v0.1 (2026-09-27) — first draft (rules only; examples pending).
