"""Runtime configuration for the ML service (env-overridable)."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLES_DIR = DATA_DIR / "samples"

MODELS_DIR = Path(os.getenv("NEPNLP_MODELS_DIR", BASE_DIR / "models_store"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)

NEWS_MODEL_DIR = MODELS_DIR / "news_classifier"
SENTIMENT_MODEL_DIR = MODELS_DIR / "sentiment"
TRANSLATION_MODEL_DIR = MODELS_DIR / "translation"

NEWS_SAMPLE_CSV = SAMPLES_DIR / "news_sample.csv"
SENTIMENT_SAMPLE_CSV = SAMPLES_DIR / "sentiment_sample.csv"
SENTIMENT_LEXICON_CSV = SAMPLES_DIR / "sentiment_lexicon.csv"
NEPALI_WORDLIST = SAMPLES_DIR / "nepali_wordlist.txt"

DEFAULT_TRANSLATION_MODEL = os.getenv(
    "NEPNLP_TRANSLATION_MODEL", "facebook/nllb-200-distilled-600M"
)
ENABLE_TRANSLATION_DOWNLOAD = os.getenv("NEPNLP_ENABLE_TRANSLATION", "0") == "1"

APP_TITLE = "NepNLP ML Service"
APP_VERSION = "0.1.0"
