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
        self._pipe_cache: dict[tuple[str, str], object] = {}
        self._model_source: str | None = None

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

    def _get_pipe(self, src: str, tgt: str):
        key = (src, tgt)
        if key not in self._pipe_cache:
            from transformers import pipeline  

            self._pipe_cache[key] = pipeline(
                "translation",
                model=self._model_source,
                src_lang=_LANG_CODE[src],
                tgt_lang=_LANG_CODE[tgt],
                max_length=512,
            )
        return self._pipe_cache[key]

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
            out = self._get_pipe(source, target)(clean(text))[0]["translation_text"]
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
