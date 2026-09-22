# Dictionary attribution

`nepali_words.txt` is a Nepali word list used by the spell-checker. It was derived from the
**Tesseract OCR `langdata` Nepali word list** (`nep/nep.wordlist`), which is licensed under
the **Apache License 2.0**.

- Source: https://github.com/tesseract-ocr/langdata (nep)
- License: Apache-2.0 (see https://www.apache.org/licenses/LICENSE-2.0)

Processing applied (see `../../scripts/` and the project history):
- Kept only Devanagari letter tokens (dropped punctuation, danda, digits, mixed tokens).
- Kept the **top ~15,000 by frequency rank** to drop the noisy low-frequency tail (OCR
  artifacts and common misspellings), then merged a small hand-curated common-word list.

The frequency rank is used to order spell-correction suggestions. This derived list is
redistributed under the same Apache-2.0 terms as the source.
