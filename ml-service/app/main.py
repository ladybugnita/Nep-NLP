"""FastAPI entrypoint for the NepNLP ML service.

Exposes a small, language-agnostic JSON API consumed by the Java backend (and usable
directly from notebooks / curl). Interactive docs at /docs.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, registry
from .models.sentiment import highlight_polarity_words
from .transliterate import transliterate as romanize_to_devanagari
from .schemas import (
    ClassificationResponse,
    InfoResponse,
    SpellCheckResponse,
    TextRequest,
    ToolStatus,
    TranslationRequest,
    TranslationResponse,
    TransliterationResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry.warmup()  
    yield


app = FastAPI(title=config.APP_TITLE, version=config.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/info", response_model=InfoResponse)
def info() -> InfoResponse:
    news = registry.get_news()
    sent = registry.get_sentiment()
    spell = registry.get_spellchecker()
    trans = registry.get_translation()
    return InfoResponse(
        service=config.APP_TITLE,
        version=config.APP_VERSION,
        tools=[
            ToolStatus(name="news", tier=news.tier, ready=news.ready, labels=news.labels),
            ToolStatus(name="sentiment", tier=sent.tier, ready=sent.ready, labels=sent.labels),
            ToolStatus(name="spellcheck",
                       tier="baseline" if spell.ready else "unavailable",
                       ready=spell.ready),
            ToolStatus(name="translation", tier=trans.tier, ready=trans.ready,
                       labels=["ne", "en"]),
        ],
    )


@app.post("/news/classify", response_model=ClassificationResponse)
def classify_news(req: TextRequest) -> ClassificationResponse:
    return registry.get_news().predict(req.text)


@app.post("/sentiment", response_model=ClassificationResponse)
def analyze_sentiment(req: TextRequest) -> ClassificationResponse:
    result = registry.get_sentiment().predict(req.text)
    return result


@app.post("/sentiment/explain")
def analyze_sentiment_explain(req: TextRequest) -> dict:
    """Sentiment + the polarity words that drove it (for the UI's 'why?' view)."""
    result = registry.get_sentiment().predict(req.text)
    highlights = highlight_polarity_words(req.text, registry.get_lexicon())
    return {**result.model_dump(), "highlights": highlights}


@app.post("/spellcheck", response_model=SpellCheckResponse)
def spellcheck(req: TextRequest) -> SpellCheckResponse:
    return registry.get_spellchecker().check_text(req.text)


@app.post("/translate", response_model=TranslationResponse)
def translate(req: TranslationRequest) -> TranslationResponse:
    return registry.get_translation().translate(req.text, req.source, req.target)


@app.post("/transliterate", response_model=TransliterationResponse)
def transliterate_ep(req: TextRequest) -> TransliterationResponse:
    """Romanized Nepali -> Devanagari (e.g. 'timro naam' -> 'तिम्रो नाम')."""
    return TransliterationResponse(input=req.text, output=romanize_to_devanagari(req.text))
