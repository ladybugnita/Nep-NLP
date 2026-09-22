"""Romanized Nepali -> Devanagari phonetic transliteration.

Lets people type Nepali the way they actually do on phones — in Latin letters, e.g.
``timro naam k ho`` -> ``तिम्रो नाम क हो`` — and then use every tool in the toolkit.

This is a deterministic, rule-based syllable engine (no ML, instant, works offline). It does
greedy longest-match over consonant/vowel spellings and handles the Devanagari essentials:
the inherent 'a' vowel, vowel signs (matras), and the halant (्) that joins consonant
clusters. Non-Latin characters (existing Devanagari, digits, punctuation) pass through
untouched, so it's safe to run on mixed or already-Nepali text.

Known limits (documented on purpose): it's phonetic, so it can't know chat shorthand
(``k`` -> क, not the slang के), long vowels need doubling (``naam``, ``kaam``), and it does
not guess retroflex vs dental (ट vs त). A learned transliterator (e.g. IndicXlit) is the
stretch upgrade; this covers the common cases well and needs no download.
"""

from __future__ import annotations

HALANT = "्"  # ्

# Consonants (Latin spelling -> base consonant, which carries the inherent 'a').
CONSONANTS = {
    "chh": "छ", "kh": "ख", "gh": "घ", "ch": "च", "jh": "झ", "ph": "फ", "bh": "भ",
    "dh": "ध", "th": "थ", "sh": "श",
    # NB: gy/ny/ng are intentionally NOT special conjuncts — in Romanized Nepali they are
    # almost always plain clusters (laagyo -> लाग्यो, dhanyabaad -> धन्यबाद), handled by the
    # generic consonant+halant logic below.
    "k": "क", "g": "ग", "c": "च", "j": "ज", "t": "त", "d": "द", "n": "न", "p": "प",
    "b": "ब", "m": "म", "y": "य", "r": "र", "l": "ल", "v": "व", "w": "व", "s": "स",
    "h": "ह", "f": "फ", "z": "ज", "q": "क", "x": "क्स",
}

# Vowels as independent letters (start of a syllable).
VOWELS_INDEPENDENT = {
    "aa": "आ", "ai": "ऐ", "au": "औ", "ee": "ई", "ii": "ई", "oo": "ऊ", "uu": "ऊ",
    "a": "अ", "i": "इ", "u": "उ", "e": "ए", "o": "ओ",
}

# Vowels as signs (matra) after a consonant. 'a' is the inherent vowel -> no sign.
VOWELS_MATRA = {
    "aa": "ा", "ai": "ै", "au": "ौ", "ee": "ी", "ii": "ी", "oo": "ू", "uu": "ू",
    "a": "", "i": "ि", "u": "ु", "e": "े", "o": "ो",
}

_CONS_KEYS = sorted(CONSONANTS, key=len, reverse=True)
_VOWEL_KEYS = sorted(VOWELS_MATRA, key=len, reverse=True)


def _is_ascii_letter(ch: str) -> bool:
    return "a" <= ch.lower() <= "z"


def transliterate(text: str) -> str:
    if not text:
        return ""
    s = text
    n = len(s)
    out: list[str] = []
    i = 0
    pending_consonant = False  # a consonant was emitted, still awaiting a vowel or a cluster

    while i < n:
        ch = s[i]
        if not _is_ascii_letter(ch):
            out.append(ch)
            pending_consonant = False
            i += 1
            continue

        # 1) consonant (longest match first)
        matched = False
        for key in _CONS_KEYS:
            if s[i : i + len(key)].lower() == key:
                if pending_consonant:
                    out.append(HALANT)  # join into a consonant cluster
                out.append(CONSONANTS[key])
                pending_consonant = True
                i += len(key)
                matched = True
                break
        if matched:
            continue

        # 2) vowel (longest match first)
        for key in _VOWEL_KEYS:
            if s[i : i + len(key)].lower() == key:
                if pending_consonant:
                    out.append(VOWELS_MATRA[key])  # '' for inherent 'a'
                    pending_consonant = False
                else:
                    out.append(VOWELS_INDEPENDENT[key])
                i += len(key)
                matched = True
                break
        if matched:
            continue

        # 3) anything else (shouldn't really happen) — pass through
        out.append(ch)
        pending_consonant = False
        i += 1

    return "".join(out)


__all__ = ["transliterate"]
