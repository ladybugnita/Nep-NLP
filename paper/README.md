# Paper — outline only

Target: a low-resource NLP or student research workshop (ACL-family). **No LaTeX yet**: it
starts once E1–E5 have human-labelled results (see `research/experiment_plan.md`).
Tables and figures will be generated from `ml-service/results/*.json` by script — no number
is typed by hand.

## Working title
*How robust are Nepali text classifiers to the way Nepali is actually written — and can
script-aware normalization help?* (placeholder)

## Sections and sources

| Section | Content | Source in repo | Status |
|---------|---------|----------------|--------|
| Abstract | RQ, data, main finding | — | after results |
| 1 Introduction | how Nepali is written online (Devanagari, Romanized, code-mixed, Preeti) | `research/README.md` | TODO(human) evidence for prevalence claims |
| 2 Related work | Nepali resources, romanized/code-mixed text, robustness, normalization | `research/related_work_queries.md` | TODO(human) |
| 3 Dataset (C1) | collection, anonymization, guidelines, κ per script, splits, datasheet | `research/data_collection_plan.md`, `annotation_guidelines.md`, `results/iaa.json`, `manifest.json` | TODO(human) data |
| 4 Method (C3) | nepnorm: unicode, legacy, detect, transliterate, spell | `ml-service/nepnorm/README.md` | can be drafted |
| 5 Benchmark (C2) | NepEval-Robust perturbations + natural subset | `ml-service/eval/README.md` | can be drafted |
| 6 Experimental setup | models, seeds, metrics, tests | `research/experiment_plan.md` | can be drafted |
| 7 Results | E1–E6 tables/figures | `results/robustness_*.json` | after results |
| 8 Analysis (C4) | ablations, error taxonomy, detector errors | `results/errors_*.csv`, `research/error_taxonomy.md` | after results |
| Limitations | circular perturbations, dataset size, domains, wordlist quality | `research/self_review.md` | can be drafted |
| Ethics | public data only, anonymization, consent for volunteer data, licence | `docs/DATA_COLLECTION.md` | can be drafted |
| Conclusion | | | after results |

## Figures planned
1. Drop per variation type per model (no normalization).
2. Recovery with nepnorm per variation type.
3. Ablation chart (one step removed).
4. κ by script type.
