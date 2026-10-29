# Annotation runbook — first batch, step by step

Every command below was run end to end on 2026-09-27 (with fake test annotators in a
throwaway database). Replace the test input with your real, approved texts.

## 0. Start MongoDB (pick one)

```bash
docker run -d --name nepnlp-mongo -p 27017:27017 -v nepnlp_mongo:/data/db mongo:7   # Docker
"C:/Program Files/MongoDB/Server/7.0/bin/mongod.exe" --dbpath D:/nepnlp-mongo --bind_ip 127.0.0.1   # installed MongoDB, own data folder
```

Keep the data folder somewhere backed up — it holds the annotations. Back up with
`mongodump --db nepnlp --out backups/<date>`.

## 1. Start the stack

```bash
cd ml-service && uvicorn app.main:app --port 8000
cd backend && mvn spring-boot:run            # or java -jar target/nepnlp-backend-0.1.0.jar
cd frontend && npm run dev                   # http://localhost:5173
```

Check: `http://localhost:8080/actuator/health` shows `"status":"UP"` (Mongo connected).
If annotators work from other computers, set `NEPNLP_ANNOTATION_TOKEN` on the backend and
give them the token; never expose the annotation API without it.

## 2. Import items

Input: a CSV with a `text` column (optional `source`, `url`) or the JSONL from
`python -m datatools.collect`.

```bash
cd ml-service
python scripts/import_annotation_items.py --input data/raw/batch1.csv --batch b1 --dry-run --out prepared.json   # inspect first
python scripts/import_annotation_items.py --input data/raw/batch1.csv --batch b1
```

The script prints what it did: rows in, duplicates dropped, personal data removed. Re-running
is safe (already-imported texts are skipped). Aim for a first batch of ~100 items, with
Devanagari and Romanized/code-mixed both represented.

## 3. Annotate

- Each annotator opens `http://<host>:5173/annotate`, enters a pseudonymous ID (A1, A2 …;
  never a name), reads the guidelines, and labels: keys **1 / 2 / 3**, **S** = skip; flags
  and a note are optional.
- Both annotators label **every** item independently; do not discuss items until both are done.
- Progress: `http://<host>:8080/api/annotation/progress`.

## 4. Agreement

```bash
python scripts/iaa.py --out results/iaa.json      # κ overall, per script type, per code-mixed
python scripts/export_results.py                  # show it on the Evaluation page
```

If κ < 0.6 overall or for any script type: discuss the disagreements, refine
`research/annotation_guidelines.md` (bump the version), and label a **fresh** batch — never
re-label the same items to raise κ.

## 5. Adjudicate

A third person (or the more experienced annotator, but not on items they labelled — the
page warns) opens `/annotate/adjudicate` with their own ID and decides each disagreement.
Unresolved items are left out of the dataset.

## 6. Export the dataset

```bash
python scripts/export_dataset.py --out data/annotated --name sentiment
```

Writes `sentiment_{train,dev,test}.csv` + `manifest.json` (counts, label resolution, sha256
per file, git commit). It warns if a split has fewer than 100 items — keep annotating until
the warnings disappear before reporting any result. Then point `configs/paper.json` at the data
and run `python -m eval.run_all --config configs/paper.json`.

## What the walkthrough found (fixed)

- A focused flag checkbox swallowed the keyboard shortcuts → fixed + regression test.
- The adjudicator ID defaulted to the annotator's own ID → now separate, with a warning on
  self-adjudication.
- Tiny datasets produced a 1-item test split silently → export now warns (< 100 items).
