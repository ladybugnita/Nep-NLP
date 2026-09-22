"""Runtime configuration for the ML service (env-overridable)."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLES_DIR = DATA_DIR / "samples"
DICT_DIR = DATA_DIR / "dictionaries"

MODELS_DIR = Path(os.getenv("NEPNLP_MODELS_DIR", BASE_DIR / "models_store"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)

NEWS_MODEL_DIR = MODELS_DIR / "news_classifier"
SENTIMENT_MODEL_DIR = MODELS_DIR / "sentiment"
TRANSLATION_MODEL_DIR = MODELS_DIR / "translation"

# Training data: prefer the larger generated seed corpus (data/*_train.csv) if present,
# otherwise the tiny bundled sample. Replace *_train.csv with your own COLLECTED data to
# actually push accuracy up (see docs/ROADMAP.md).
_NEWS_TRAIN = DATA_DIR / "news_train.csv"
_SENT_TRAIN = DATA_DIR / "sentiment_train.csv"
NEWS_SAMPLE_CSV = _NEWS_TRAIN if _NEWS_TRAIN.exists() else SAMPLES_DIR / "news_sample.csv"
SENTIMENT_SAMPLE_CSV = _SENT_TRAIN if _SENT_TRAIN.exists() else SAMPLES_DIR / "sentiment_sample.csv"
SENTIMENT_LEXICON_CSV = SAMPLES_DIR / "sentiment_lexicon.csv"

# Spell-check dictionary: prefer the large (~15k) frequency-filtered word list, fall back to
# the small curated sample if it is missing. Override the path with NEPNLP_WORDLIST.
_FULL_WORDLIST = DICT_DIR / "nepali_words.txt"
NEPALI_WORDLIST = Path(
    os.getenv(
        "NEPNLP_WORDLIST",
        _FULL_WORDLIST if _FULL_WORDLIST.exists() else SAMPLES_DIR / "nepali_wordlist.txt",
    )
)

DEFAULT_TRANSLATION_MODEL = os.getenv(
    "NEPNLP_TRANSLATION_MODEL", "facebook/nllb-200-distilled-600M"
)
ENABLE_TRANSLATION_DOWNLOAD = os.getenv("NEPNLP_ENABLE_TRANSLATION", "0") == "1"

APP_TITLE = "NepNLP ML Service"
APP_VERSION = "0.1.0"
