# Error taxonomy (proposed) — for manual error analysis (C4)

`python -m eval.run_all` writes `ml-service/results/errors_<run>.csv`: every misclassified test
item (for the `none` and `full` normalization variants, first perturbation seed) with the
original text, the perturbed text, the text the model actually saw, gold and predicted
label. The `error_category` column is left **empty for you** (TODO(human)).

Assign exactly one primary category per row (add `;secondary` if really needed). Sample
at least 100 rows stratified by condition, and have a second person categorize 30 of them
to report agreement on the taxonomy itself.

| Code | Category | Typical sign |
|------|----------|--------------|
| `translit` | Transliteration failure | `text_model_input` has a wrong/garbled Devanagari word where the original was clear |
| `detect` | Script-detection error | an English word was transliterated, or a Romanized Nepali word left in Latin |
| `legacy` | Legacy-font conversion error | residual Preeti characters or wrong conjuncts after conversion |
| `spell_ambig` | Spelling ambiguity / wrong correction | the corrector changed a correct word, or a misspelling survived and matters |
| `oov` | Out-of-vocabulary content word | key word unseen in training (after normalization) |
| `english_carrier` | English-only sentiment/topic carrier | the decisive word is English and the model has no English features |
| `sarcasm` | Sarcasm / irony | literal words contradict the intended label |
| `mixed` | Mixed or weak signal | several labels defensible |
| `label_noise` | Gold label looks wrong | especially for silver (keyword-rule) labels |
| `truncation` | Perturbation destroyed the meaning | e.g. code-mixing replaced every content word |
| `other` | none of the above | describe in a note |

Report: counts per category × condition × variant, and 2–3 real examples per category
(anonymized). Categories that shrink from `none` → `full` are what normalization fixes;
categories that remain are the limitations section.
