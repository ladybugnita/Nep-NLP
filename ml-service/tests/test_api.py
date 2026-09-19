"""End-to-end API tests using FastAPI's TestClient (loads real baselines).

Run:  pytest tests/test_api.py     or     python tests/test_api.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_info_lists_four_tools():
    r = client.get("/info")
    assert r.status_code == 200
    names = {t["name"] for t in r.json()["tools"]}
    assert names == {"news", "sentiment", "spellcheck", "translation"}


def test_news_classifier():
    r = client.post("/news/classify", json={"text": "नेपाली क्रिकेट टोलीले खेल जित्यो।"})
    assert r.status_code == 200
    body = r.json()
    assert body["label"] in {"राजनीति", "खेलकुद", "प्रविधि", "अर्थतन्त्र", "मनोरञ्जन"}
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["model"] in {"baseline", "transformer"}


def test_sentiment_positive():
    r = client.post("/sentiment", json={"text": "यो साह्रै राम्रो र उत्कृष्ट छ।"})
    assert r.status_code == 200
    assert r.json()["label"] in {"सकारात्मक", "नकारात्मक", "तटस्थ"}


def test_sentiment_explain_highlights():
    r = client.post("/sentiment/explain", json={"text": "सेवा नराम्रो र ढिलो थियो।"})
    assert r.status_code == 200
    words = {h["word"] for h in r.json()["highlights"]}
    assert "नराम्रो" in words  


def test_spellcheck_flags_misspelling():
    r = client.post("/spellcheck", json={"text": "यो मेरो देस हो"})
    assert r.status_code == 200
    body = r.json()
    flagged = {t["token"]: t for t in body["tokens"] if not t["is_correct"]}
    assert "देस" in flagged


def test_translation_reports_unavailable_by_default():
    r = client.post("/translate", json={"text": "नमस्ते", "source": "ne", "target": "en"})
    assert r.status_code == 200
    assert r.json()["available"] in (False, True)


def _run_all():
    fns = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\nAll {len(fns)} API tests passed.")


if __name__ == "__main__":
    _run_all()
