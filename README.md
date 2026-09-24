# NepNLP : a Nepali (नेपाली) Natural-Language Toolkit

> An open toolkit that brings four everyday NLP tools to Nepali, an under-served language:
> **news classification · sentiment analysis · spell-checking · machine translation**.
>
> Built as a full-stack, polyglot system: **React** frontend, **Java / Spring Boot** API,
> **MongoDB** storage, and a **Python / Hugging Face** ML service.

<p align="center">
  <em>भाषा सबैका लागि : language technology for everyone.</em>
</p>

---

## Why this project

Most NLP tooling assumes English (or a handful of high-resource languages). Nepali, spoken
by ~30 million people, has very few ready-to-use, open tools. NepNLP is a small step toward
closing that gap.

## The four tools

| Tool | What it does | Input → Output |
|------|--------------|----------------|
| **News classifier** | Tags a Nepali article by topic | text → `राजनीति / खेलकुद / प्रविधि / …` |
| **Sentiment analyzer** | Detects opinion polarity | text → `सकारात्मक / नकारात्मक / तटस्थ` |
| **Spell-checker** | Flags & fixes misspellings | text → per-word suggestions |
| **Translator** | Nepali ↔ English | text → translated text |

Each tool ships with a **fast baseline** (works immediately, no GPU) and a path to a
**fine-tuned transformer** (trained on Colab) for higher accuracy.

## Architecture (at a glance)

```
  ┌───────────┐      ┌────────────────────┐      ┌──────────────┐
  │  React    │ ───► │  Java / Spring Boot│ ───► │   MongoDB    │
  │ (frontend)│ ◄─── │   (API + logic)    │ ◄─── │  (storage)   │
  └───────────┘      └─────────┬──────────┘      └──────────────┘
                               │ REST
                               ▼
                     ┌────────────────────┐
                     │  Python / FastAPI  │  ◄── Hugging Face models
                     │    (ML service)    │      
                     └────────────────────┘
```

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
> Drop fine-tuned models into `ml-service/models_store/` to upgrade accuracy.

## Repository layout

```
.
├── ml-service/      Python + FastAPI + Hugging Face  (the NLP substance)
├── backend/         Java + Spring Boot  (REST API, auth, MongoDB orchestration)
├── frontend/        React + Vite  (the demo UI)
├── docker-compose.yml
└── README.md
```

## Data & models

- Curated **sample data** lives in `ml-service/data/samples/` so the pipeline runs offline.

## License

- **Code:** MIT (see `LICENSE`)
- **Sample data:** a small sample collected from publicly available Nepali sources, included for educational and research purposes only.
  
## Author

**Nita Dangol**

[GitHub](https://github.com/ladybugnita) · [LinkedIn](https://linkedin.com/in/nitadangol) · [Portfolio](https://nitadangol.com.np)

