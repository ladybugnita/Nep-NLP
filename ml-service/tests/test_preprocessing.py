"""Tests for Nepali preprocessing. Pure-Python (no ML deps) so they run anywhere.

Run with pytest, or directly:  python tests/test_preprocessing.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.preprocessing import ( 
    clean,
    devanagari_digits_to_ascii,
    normalize_unicode,
    preprocess_for_baseline,
    remove_zero_width,
    sentence_split,
    tokenize,
)


def test_remove_zero_width():
    dirty = "नम‍स्ते"  
    assert remove_zero_width(dirty) == "नमस्ते"


def test_devanagari_digits():
    assert devanagari_digits_to_ascii("सन् २०२४ मा") == "सन् 2024 मा"


def test_clean_strips_urls_and_noise():
    out = clean("राम्रो 😀 http://example.com खबर!!!")
    assert "http" not in out
    assert "😀" not in out
    assert "राम्रो" in out and "खबर" in out


def test_normalize_unicode_idempotent():
    s = "नेपाल"
    assert normalize_unicode(normalize_unicode(s)) == normalize_unicode(s)


def test_sentence_split_on_danda():
    sents = sentence_split("म घर जान्छु। तिमी कहाँ जान्छौ? राम्रो छ।")
    assert len(sents) == 3


def test_tokenize():
    toks = tokenize("नेपाल एउटा सुन्दर देश हो")
    assert "नेपाल" in toks and "देश" in toks


def test_preprocess_for_baseline_removes_stopwords():
    out = preprocess_for_baseline("देश र समाज राम्रो छ")
    assert "देश" in out and "राम्रो" in out
    assert " र " not in f" {out} "
    assert "छ" not in out.split()


def _run_all():
    fns = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\nAll {len(fns)} preprocessing tests passed.")


if __name__ == "__main__":
    _run_all()
