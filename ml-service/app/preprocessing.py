"""Nepali (Devanagari) text preprocessing.

Cleaning Devanagari text well is one of the parts of this project that shows real
language understanding rather than just calling a library. The same Nepali word can be
represented by several different byte sequences (composed vs. decomposed forms, stray
zero-width joiners, ASCII vs. Devanagari digits). If we don't normalize these, the model
sees them as different tokens and accuracy suffers.

References:
- Unicode Devanagari block: U+0900–U+097F
- Danda (।) U+0964, Double danda (॥) U+0965
- Devanagari digits ० U+0966 … ९ U+096F
- ZWJ U+200D, ZWNJ U+200C  (frequently inserted inconsistently by keyboards)
"""

from __future__ import annotations

import re
import unicodedata

from .stopwords import NEPALI_STOPWORDS

ZERO_WIDTH = "".join(
    [
        "​",  
        "‌",  
        "‍",  
        "﻿",  
        "­",  
    ]
)
_ZERO_WIDTH_RE = re.compile(f"[{ZERO_WIDTH}]")

_DEVANAGARI_DIGITS = "०१२३४५६७८९"
_ASCII_DIGITS = "0123456789"
_DEV_TO_ASCII = {ord(d): a for d, a in zip(_DEVANAGARI_DIGITS, _ASCII_DIGITS)}
_ASCII_TO_DEV = {ord(a): d for d, a in zip(_DEVANAGARI_DIGITS, _ASCII_DIGITS)}

DANDA = "।"          # ।
DOUBLE_DANDA = "॥"   # ॥

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_HTML_RE = re.compile(r"<[^>]+>")
_MULTISPACE_RE = re.compile(r"\s+")

_DEVANAGARI_BLOCK = r"ऀ-ॿ"
_KEEP_RE = re.compile(rf"[^{_DEVANAGARI_BLOCK}A-Za-z0-9\s।॥?!.,;:%\-]")

_SENT_SPLIT_RE = re.compile(r"[।॥?!]+|(?<!\d)\.(?!\d)")

# Word tokens: Devanagari LETTERS/matras only (U+0900–U+0963, U+0971–U+097F) plus ASCII
# letters/digits. Deliberately excludes danda (।), double danda (॥) and Devanagari digits
# so punctuation is never treated as a word (which would be flagged as a misspelling).
_DEV_LETTERS = r"ऀ-ॣॱ-ॿ"  # Devanagari letters/matras (no danda/digits)
_TOKEN_RE = re.compile(rf"[{_DEV_LETTERS}A-Za-z0-9]+")

def normalize_unicode(text: str) -> str:
    """Canonical composition (NFC) so equivalent forms become identical."""
    return unicodedata.normalize("NFC", text)


def remove_zero_width(text: str) -> str:
    """Strip zero-width joiners/spaces that keyboards insert inconsistently."""
    return _ZERO_WIDTH_RE.sub("", text)


def devanagari_digits_to_ascii(text: str) -> str:
    return text.translate(_DEV_TO_ASCII)


def ascii_digits_to_devanagari(text: str) -> str:
    return text.translate(_ASCII_TO_DEV)


def remove_urls_emails(text: str) -> str:
    text = _URL_RE.sub(" ", text)
    text = _EMAIL_RE.sub(" ", text)
    return text


def remove_html(text: str) -> str:
    return _HTML_RE.sub(" ", text)


def normalize_punctuation(text: str) -> str:
    """Collapse repeated danda and normalize common punctuation spacing."""
    text = re.sub(r"।{2,}", DOUBLE_DANDA, text)   # ।। -> ॥
    text = re.sub(r"\s*।\s*", " । ", text)
    text = re.sub(r"\s*॥\s*", " ॥ ", text)
    return text


def normalize_whitespace(text: str) -> str:
    return _MULTISPACE_RE.sub(" ", text).strip()


def remove_non_nepali_noise(text: str) -> str:
    """Drop emoji / symbols we don't model, keeping letters, digits, basic punctuation."""
    return _KEEP_RE.sub(" ", text)


def tokenize(text: str) -> list[str]:
    """Word-level tokens (Devanagari or ASCII runs)."""
    return _TOKEN_RE.findall(text)


def sentence_split(text: str) -> list[str]:
    """Split into sentences on danda / double danda / . ? !."""
    parts = _SENT_SPLIT_RE.split(text)
    return [p.strip() for p in parts if p and p.strip()]


def remove_stopwords(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t not in NEPALI_STOPWORDS]


def clean(text: str, *, digits_to_ascii: bool = True) -> str:
    """Full cleaning pipeline used before feeding text to a model.

    Order matters: strip markup/urls first, normalize unicode, remove zero-width chars,
    then punctuation and whitespace.
    """
    if not text:
        return ""
    text = remove_html(text)
    text = remove_urls_emails(text)
    text = normalize_unicode(text)
    text = remove_zero_width(text)
    if digits_to_ascii:
        text = devanagari_digits_to_ascii(text)
    text = remove_non_nepali_noise(text)
    text = normalize_punctuation(text)
    text = normalize_whitespace(text)
    return text


def preprocess_for_baseline(text: str, *, drop_stopwords: bool = True) -> str:
    """Cleaning + tokenization + optional stopword removal, re-joined for TF-IDF.

    Transformer models get `clean()` text directly (they have their own tokenizer and
    benefit from stopwords); the classical baseline benefits from stopword removal.
    """
    cleaned = clean(text)
    tokens = tokenize(cleaned)
    if drop_stopwords:
        tokens = remove_stopwords(tokens)
    return " ".join(tokens)


__all__ = [
    "normalize_unicode",
    "remove_zero_width",
    "devanagari_digits_to_ascii",
    "ascii_digits_to_devanagari",
    "remove_urls_emails",
    "remove_html",
    "normalize_punctuation",
    "normalize_whitespace",
    "remove_non_nepali_noise",
    "tokenize",
    "sentence_split",
    "remove_stopwords",
    "clean",
    "preprocess_for_baseline",
]
