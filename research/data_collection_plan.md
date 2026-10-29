# Data collection plan — sentiment dataset (C1)

> Targets and procedure. All collection, source approval and annotation are TODO(human).

## Targets

| Subset | Target | Why |
|--------|-------:|-----|
| Devanagari Nepali | ≥ 2,000 | clean in-domain train/test |
| **Naturally occurring** Romanized / code-mixed | ≥ 500 | the paper must not rely on synthetic perturbations alone |
| Double-annotated (κ study) | ≥ 300, stratified by script | agreement overall and per script type |
| Human-typed Preeti / transliteration / misspelling gold sets | see `ml-service/data/nepnorm_gold/README.md` | component evaluation |

Balance classes where possible; record the natural distribution before any balancing.

## Sources (TODO(human): choose and approve)

For each candidate record in `ml-service/datatools/sources.json` (and the table below): the
ToS check date, robots.txt result, licence of the text, and why it is appropriate.

| Source | Type | Script mix expected | ToS / robots checked | Approved |
|--------|------|--------------------|----------------------|----------|
| TODO(human) | public feed | | | ☐ |

Romanized / code-mixed text is most common in comments and social media, where ToS are
strictest. Options to consider (verify each yourself): public comment sections that permit
research use, openly licensed corpora, and **volunteer contributions** (people typing their
own opinions in the style they normally use — consented and cleanest legally).

## Procedure

1. Collect with `python -m datatools.collect` (feeds; rate-limited; robots.txt respected;
   contact in User-Agent) or gather consented volunteer text. Raw data stays in
   `ml-service/data/raw/` (git-ignored).
2. `python scripts/import_annotation_items.py --input … --batch b1` — anonymizes, removes
   exact/near duplicates, tags scripts, imports into the annotation tool.
3. Annotate per `research/annotation_guidelines.md`; κ with `python scripts/iaa.py --out results/iaa.json`.
4. Adjudicate; export with `python scripts/export_dataset.py` → stratified, duplicate-safe
   train/dev/test + `manifest.json` (hashes).
5. Fill `docs/datasheet.md` from the manifest and κ results only.

## Data-quality findings so far (measured)

- The bundled `data/sentiment_train.csv` (252 rows) collapses to **119** near-duplicate
  clusters and `data/news_train.csv` (560 rows) to **220** (`datatools.dedup`, Jaccard ≥ 0.8
  on character 5-grams, 2026-09-27). Neither is suitable for reporting test accuracy.
