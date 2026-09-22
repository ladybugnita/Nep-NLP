"""Nepali ↔ English translation.

Translation needs a large seq2seq model, so unlike the other tools it is *opt-in*: it loads
a fine-tuned model from ``models_store/translation`` if you've trained one, or the default
NLLB-200 distilled checkpoint if ``NEPNLP_ENABLE_TRANSLATION=1`` (this downloads ~2.4 GB).
Otherwise the endpoint reports ``available: false`` with guidance, so the rest of the app
still runs on a laptop.

NLLB language codes: Nepali = ``npi_Deva``, English = ``eng_Latn``.
"""

from __future__ import annotations

from .. import config
from ..preprocessing import clean
from ..schemas import TranslationResponse

_LANG_CODE = {"ne": "npi_Deva", "en": "eng_Latn"}


class TranslationModel:
    def __init__(self) -> None:
        self.tier = "unavailable"
        self.model_name = ""
        self._model_source: str | None = None
        self._tok = None
        self._model = None

    def load(self) -> "TranslationModel":
        if (config.TRANSLATION_MODEL_DIR / "config.json").exists():
            self._model_source = str(config.TRANSLATION_MODEL_DIR)
            self.model_name = config.TRANSLATION_MODEL_DIR.name
            self.tier = "transformer"
        elif config.ENABLE_TRANSLATION_DOWNLOAD:
            self._model_source = config.DEFAULT_TRANSLATION_MODEL
            self.model_name = config.DEFAULT_TRANSLATION_MODEL
            self.tier = "transformer"
        else:
            self.tier = "unavailable"
        return self

    @property
    def ready(self) -> bool:
        return self.tier != "unavailable"

    def _ensure_loaded(self) -> None:
        # Lazily load tokenizer + model on first use. We call the model directly rather than
        # pipeline("translation"), which newer transformers versions no longer register.
        if self._model is None:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            self._tok = AutoTokenizer.from_pretrained(self._model_source)
            self._model = AutoModelForSeq2SeqLM.from_pretrained(self._model_source)
            self._model.eval()

    def _target_bos_id(self, target_code: str) -> int:
        tok = self._tok
        tid = tok.convert_tokens_to_ids(target_code)
        unk = getattr(tok, "unk_token_id", None)
        if tid is None or tid == unk:  # older NLLB tokenizers expose a lookup map instead
            tid = getattr(tok, "lang_code_to_id", {}).get(target_code)
        return tid

    def translate(self, text: str, source: str, target: str) -> TranslationResponse:
        if source not in _LANG_CODE or target not in _LANG_CODE or source == target:
            return TranslationResponse(
                translation="", source=source, target=target, model=self.model_name,
                available=False, detail="Supported directions: ne↔en.",
            )
        if not self.ready:
            return TranslationResponse(
                translation="", source=source, target=target, model="",
                available=False,
                detail=(
                    "Translation model not loaded. Set NEPNLP_ENABLE_TRANSLATION=1 to use "
                    "NLLB-200, or place a fine-tuned model in models_store/translation."
                ),
            )
        try:
            import torch

            self._ensure_loaded()
            self._tok.src_lang = _LANG_CODE[source]
            enc = self._tok(clean(text), return_tensors="pt", truncation=True, max_length=512)
            with torch.no_grad():
                gen = self._model.generate(
                    **enc,
                    forced_bos_token_id=self._target_bos_id(_LANG_CODE[target]),
                    max_new_tokens=256,
                    num_beams=1,  # greedy: fast enough on CPU
                )
            out = self._tok.batch_decode(gen, skip_special_tokens=True)[0].strip()
            return TranslationResponse(
                translation=out, source=source, target=target, model=self.model_name,
                available=True,
            )
        except Exception as exc:
            return TranslationResponse(
                translation="", source=source, target=target, model=self.model_name,
                available=False, detail=f"Inference error: {exc}",
            )


def build() -> TranslationModel:
    return TranslationModel()
