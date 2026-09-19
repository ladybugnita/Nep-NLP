# NepNLP : a Nepali (नेपाली) Natural-Language Toolkit

> An open toolkit that brings four everyday NLP tools to Nepali, an under-served language:
> **news classification · sentiment analysis · spell-checking · machine translation**.
>
> Built as a full-stack, polyglot system  **React** frontend, **Java / Spring Boot** API,
> **MongoDB** storage, and a **Python / Hugging Face** ML service — with models fine-tuned
> on **Google Colab** and an openly published, self-collected dataset.

<p align="center">
  <em>भाषा सबैका लागि : language technology for everyone.</em>
</p>

---

## Why this project

Most NLP tooling assumes English (or a handful of high-resource languages). Nepali, spoken
by ~30 million people, has very few ready-to-use, open tools. NepNLP is a small step toward
closing that gap, and a demonstration that production-grade language technology can be built
for a low-resource language by one motivated student.

See [`docs/STANDOUT.md`](docs/STANDOUT.md) for how this project is designed to be original,
rigorous, and impactful — the parts that make it a strong personal-statement anchor.

## The four tools

| Tool | What it does | Input → Output |
|------|--------------|----------------|
| 📰 **News classifier** | Tags a Nepali article by topic | text → `राजनीति / खेलकुद / प्रविधि / …` |
| 😊 **Sentiment analyzer** | Detects opinion polarity | text → `सकारात्मक / नकारात्मक / तटस्थ` |
| ✍️ **Spell-checker** | Flags & fixes misspellings | text → per-word suggestions |
| 🌐 **Translator** | Nepali ↔ English | text → translated text |

Each tool ships with a **fast baseline** (works immediately, no GPU) and a path to a
**fine-tuned transformer** (trained on Colab) for higher accuracy — see
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Architecture (at a glance)

```
  ┌───────────┐      ┌────────────────────┐      ┌──────────────┐
  │  React    │ ───► │  Java / Spring Boot │ ───► │   MongoDB    │
  │ (frontend)│ ◄─── │   (API + logic)     │ ◄─── │  (storage)   │
  └───────────┘      └─────────┬──────────┘      └──────────────┘
                               │ REST
                               ▼
                     ┌────────────────────┐
                     │  Python / FastAPI  │  ◄── Hugging Face models
                     │    (ML service)    │      (fine-tuned on Colab)
                     └────────────────────┘
```

Full details and the rationale for a polyglot design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start (one command)

Requires **Docker Desktop** only.

```bash
docker compose up --build
```

Then open:

- Frontend: <http://localhost:5173>
- Java API docs (Swagger): <http://localhost:8080/swagger-ui.html>
- ML service docs: <http://localhost:8000/docs>

> The ML service starts with lightweight **baselines** so everything works out of the box.
> Drop fine-tuned models into `ml-service/models_store/` to upgrade accuracy — no code change.

### Running services individually (for development)

- **ML service** — [`ml-service/README.md`](ml-service/README.md)
- **Backend (Java)** — [`backend/README.md`](backend/README.md)  *(added in a later step)*
- **Frontend (React)** — [`frontend/README.md`](frontend/README.md)  *(added in a later step)*

## Repository layout

```
.
├── ml-service/      Python + FastAPI + Hugging Face  (the NLP substance)
├── backend/         Java + Spring Boot  (REST API, auth, MongoDB orchestration)
├── frontend/        React + Vite  (the demo UI)
├── docs/            Architecture, standout strategy, roadmap, dataset datasheet
├── docker-compose.yml
└── README.md
```

## Data & models

- Curated **sample data** lives in `ml-service/data/samples/` so the pipeline runs offline.
- The **full self-collected dataset** and its collection methodology are documented in
  [`docs/DATA_COLLECTION.md`](docs/DATA_COLLECTION.md) and
  [`docs/datasheet.md`](docs/datasheet.md), and are intended to be published openly
  (Hugging Face Datasets / Kaggle) — this is a core part of what makes the project stand out.

## License

- **Code:** MIT (see `LICENSE`)
- **Dataset:** CC BY 4.0 (attribution) — see the datasheet.

## Status

🚧 Actively being built. Current progress and next steps: [`docs/ROADMAP.md`](docs/ROADMAP.md).
