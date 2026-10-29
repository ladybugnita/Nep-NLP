
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.transliterate import transliterate  # noqa: E402


def test_basic_phrase():
    assert transliterate("timro naam ke ho") == "तिम्रो नाम के हो"


def test_inherent_vowel_and_clusters():
    assert transliterate("kasto") == "कस्तो"       
    assert transliterate("ramro") == "रम्रो"        
    assert transliterate("laagyo") == "लाग्यो"      


def test_aspirates_and_long_vowels():
    assert transliterate("khana") == "खन"          
    assert transliterate("khaanaa") == "खाना"      
    assert transliterate("chha") == "छ"


def test_passthrough_non_latin():
    assert transliterate("म ठिक छु।") == "म ठिक छु।"
    assert transliterate("2024 saal") == "2024 साल"


def _run_all():
    fns = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\nAll {len(fns)} transliteration tests passed.")


if __name__ == "__main__":
    _run_all()
