"""Nepali spell-checker (baseline).

A dictionary + edit-distance corrector in the classic Norvig style, adapted for Devanagari.
Given a word not in the dictionary, we generate candidates within edit distance 1–2 and keep
those that ARE in the dictionary, ranked by (distance, frequency).

Known limitation (documented on purpose, see docs/STANDOUT.md): character-level edits treat
a base consonant and its combining vowel sign (matra) as separate units, so some edits are
linguistically odd. A stretch upgrade is a syllable-aware or seq2seq corrector; the baseline
is still genuinely useful and honest about its bounds.
"""

from __future__ import annotations

from pathlib import Path

from ..preprocessing import clean, tokenize
from ..schemas import SpellCheckResponse, TokenCheck

_DEV_RANGE = range(0x0900, 0x097F + 1)


def _is_devanagari(token: str) -> bool:
    return any(ord(c) in _DEV_RANGE for c in token)


class SpellChecker:
    def __init__(self) -> None:
        self.freq: dict[str, int] = {}
        self.alphabet: set[str] = set()
        self.ready = False

    def load(self, wordlist_path: Path) -> "SpellChecker":
        if not wordlist_path.exists():
            self.ready = False
            return self
        with open(wordlist_path, encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split("\t")
                if not parts or not parts[0]:
                    continue
                word = parts[0]
                count = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
                self.freq[word] = self.freq.get(word, 0) + count
        self.alphabet = {c for w in self.freq for c in w}
        self.ready = bool(self.freq)
        return self

    def _edits1(self, word: str) -> set[str]:
        splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
        deletes = [l + r[1:] for l, r in splits if r]
        transposes = [l + r[1] + r[0] + r[2:] for l, r in splits if len(r) > 1]
        replaces = [l + c + r[1:] for l, r in splits if r for c in self.alphabet]
        inserts = [l + c + r for l, r in splits for c in self.alphabet]
        return set(deletes + transposes + replaces + inserts)

    def _edits2(self, word: str) -> set[str]:
        return {e2 for e1 in self._edits1(word) for e2 in self._edits1(e1)}

    def _known(self, words) -> set[str]:
        return {w for w in words if w in self.freq}

    def suggest(self, word: str, limit: int = 5) -> list[str]:
        if word in self.freq:
            return []
        cands = self._known(self._edits1(word))
        if not cands:
            cands = self._known(self._edits2(word))
        return sorted(cands, key=lambda w: self.freq.get(w, 0), reverse=True)[:limit]

    def check_word(self, token: str) -> TokenCheck:
        if not _is_devanagari(token):
            return TokenCheck(token=token, is_correct=True, suggestions=[])
        if token in self.freq:
            return TokenCheck(token=token, is_correct=True, suggestions=[])
        return TokenCheck(token=token, is_correct=False, suggestions=self.suggest(token))

    def check_text(self, text: str) -> SpellCheckResponse:
        cleaned = clean(text)
        checks = [self.check_word(tok) for tok in tokenize(cleaned)]
        return SpellCheckResponse(
            tokens=checks,
            num_errors=sum(1 for c in checks if not c.is_correct),
        )
