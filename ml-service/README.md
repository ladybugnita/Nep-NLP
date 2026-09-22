# NepNLP : ML service (Python / FastAPI)

The model server for the four Nepali NLP tools. Exposes a small JSON API consumed by the
Java backend (and usable directly from notebooks or `curl`).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | liveness probe |
| GET | `/info` | which tools are loaded and at which tier |
| POST | `/news/classify` | `{text}` → topic label + scores |
| POST | `/sentiment` | `{text}` → polarity label + scores |
| POST | `/sentiment/explain` | as above **+** polarity words found |
| POST | `/spellcheck` | `{text}` → per-token correctness + suggestions |
| POST | `/translate` | `{text, source, target}` → translation (opt-in) |

Interactive docs (Swagger UI) at <http://localhost:8000/docs> when running.

## Two-tier models

Each tool has a **baseline** (works instantly, CPU-only) and an optional **transformer**
(fine-tuned on Colab). The service auto-detects a fine-tuned model in `models_store/<tool>/`
and uses it; otherwise it falls back to the baseline. No code change needed to upgrade.

## Run locally (without Docker)

```bash
cd ml-service
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> Uses Python 3.11–3.12 ideally. The bundled baselines need only the base requirements.

### Enable the transformer / translation tier

```bash
pip install -r requirements-ml.txt
export NEPNLP_ENABLE_TRANSLATION=1   
```

## Run with Docker

```bash
docker build -t nepnlp-ml .
docker run -p 8000:8000 -v "$PWD/models_store:/app/models_store" nepnlp-ml
```

Or just `docker compose up` from the repo root to run the whole stack.

## Train models

See [`training/train_classifier.py`](training/train_classifier.py). Quick baseline:

```bash
python -m training.train_classifier --task sentiment --model baseline
```

Fine-tune a transformer (best on Colab GPU) with your own labelled CSV (`text,label`):

```bash
python -m training.train_classifier --task news --model transformer \
    --data data/news_full.csv --base-model xlm-roberta-base --epochs 4
```

The script prints accuracy, per-class precision/recall/F1, and a confusion matrix on a
held-out test set, then saves the model where the service will auto-load it.

## Collect real data (scraper) + fine-tune

Bootstrap a **real** Nepali news dataset from public RSS feeds, labelled by topic via
distant supervision (keyword/category voting), honouring robots.txt + crawl-delay:

```bash
python scripts/scrape_news.py --pages 20 --out data/raw/news_scraped.csv
```

Then train. Two tiers, measured honestly on a held-out split of the **real** data:

| Model | Data | Held-out accuracy |
|-------|------|-------------------|
| TF-IDF + char n-grams + LogReg (baseline) | ~650 real articles | **~85%** |
| baseline | real + generated seed | **~86%** |
| distilbert-base-nepali (fine-tuned) | real + seed | *see training log* |

Fine-tune a transformer (works on CPU; faster on Colab GPU):

```bash
python -m training.train_classifier --task news --model transformer \
    --data data/news_train_full.csv --base-model Sakonii/distilbert-base-nepali --epochs 3
```

> **Honest note on accuracy:** distant-supervision labels are ~85–90% precise, which *caps*
> model accuracy around there. Reaching a trustworthy **95%** needs hand-verified labels and
> more balanced data (esp. tech/entertainment) — that hand-labelling is the real
> standout work, and the pipeline here is built to reach it once you add clean labels.

### Gold test set — the credible accuracy number

Distant-supervision labels are noisy, so measuring on them is circular. Build a small
**hand-labelled gold set** sampled from *all* articles (including the hard ones the keyword
rule skips) and evaluate on that:

```bash
# 1. dump an unbiased pool of ALL fetched articles
python scripts/scrape_news.py --pages 20 --dump-all data/gold/pool.csv
# 2. sample N and generate the labelling tool
python scripts/make_gold_sample.py --pool data/gold/pool.csv --n 300
# 3. open tools/label_news.html in your browser; label with keys 1–5 (o=other, s=skip),
#    then "Download gold.csv" and save it to data/gold/gold.csv
# 4. the credible number, for BOTH tiers:
python scripts/eval_gold.py --gold data/gold/gold.csv
```

Report that gold accuracy in your write-up / model card — it's the honest, defensible figure
(and reporting inter-annotator agreement if a friend labels an overlap is even stronger).

## Tests

```bash
python tests/test_preprocessing.py   
python tests/test_api.py             
# or: pytest
```

## Layout

```
app/
  main.py            FastAPI app + routes
  preprocessing.py   Nepali (Devanagari) normalization  ← the language depth
  stopwords.py       curated Nepali stopwords
  schemas.py         request/response contract
  config.py          paths + env config
  registry.py        lazy model singletons
  models/
    base.py          shared TF-IDF baseline + transformer classifier
    news_classifier.py, sentiment.py, spellcheck.py, translation.py
data/samples/        tiny bundled datasets so baselines run offline
training/            training scripts + (Colab) notebooks
tests/
```
