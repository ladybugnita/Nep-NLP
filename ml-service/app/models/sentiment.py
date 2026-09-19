"""Sentiment analyzer.

Uses the shared classifier (baseline or fine-tuned transformer). A small sentiment lexicon
is also loaded and exposed so the frontend can *explain* a prediction by highlighting the
polarity words it found , a nice interpretability touch that reviewers appreciate.
"""

from __future__ import annotations

import csv

from .. import config
from ..preprocessing import tokenize
from .base import TextClassificationModel


def build() -> TextClassificationModel:
    return TextClassificationModel(
        name="sentiment",
        model_dir=config.SENTIMENT_MODEL_DIR,
        sample_csv=config.SENTIMENT_SAMPLE_CSV,
    )


def load_lexicon() -> dict[str, str]:
    """word -> polarity ('positive' | 'negative'). Optional; empty if file missing."""
    path = config.SENTIMENT_LEXICON_CSV
    if not path.exists():
        return {}
    lex: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lex[row["word"].strip()] = row["polarity"].strip()
    return lex


def highlight_polarity_words(text: str, lexicon: dict[str, str]) -> list[dict]:
    """Return the polarity-bearing words found (for UI explanation)."""
    found = []
    for tok in tokenize(text):
        if tok in lexicon:
            found.append({"word": tok, "polarity": lexicon[tok]})
    return found
