"""News topic classifier — a thin wrapper over the shared text classifier."""

from __future__ import annotations

from .. import config
from .base import TextClassificationModel


def build() -> TextClassificationModel:
    return TextClassificationModel(
        name="news_classifier",
        model_dir=config.NEWS_MODEL_DIR,
        sample_csv=config.NEWS_SAMPLE_CSV,
    )
