"""Lazy singletons for the loaded models.

Lightweight tools (news, sentiment, spell-check baselines) are loaded eagerly at startup so
the first request is fast. Translation is loaded lazily since it may pull a large model.
"""

from __future__ import annotations

from . import config
from .models import news_classifier, sentiment, translation
from .models.spellcheck import SpellChecker

_news = None
_sentiment = None
_spell = None
_translation = None
_lexicon: dict[str, str] | None = None


def get_news():
    global _news
    if _news is None:
        _news = news_classifier.build().load()
    return _news


def get_sentiment():
    global _sentiment
    if _sentiment is None:
        _sentiment = sentiment.build().load()
    return _sentiment


def get_lexicon() -> dict[str, str]:
    global _lexicon
    if _lexicon is None:
        _lexicon = sentiment.load_lexicon()
    return _lexicon


def get_spellchecker() -> SpellChecker:
    global _spell
    if _spell is None:
        _spell = SpellChecker().load(config.NEPALI_WORDLIST)
    return _spell


def get_translation():
    global _translation
    if _translation is None:
        _translation = translation.build().load()
    return _translation


def warmup() -> None:
    """Eagerly load the cheap models at startup."""
    get_news()
    get_sentiment()
    get_lexicon()
    get_spellchecker()
    get_translation()  
