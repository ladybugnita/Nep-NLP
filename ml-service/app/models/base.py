"""Shared text-classification logic for the news and sentiment tools.

Two tiers:

* ``BaselineTextClassifier`` — TF-IDF + Logistic Regression (scikit-learn). Trains in
  milliseconds on the bundled sample data, runs on CPU, needs no downloads. This is the
  strong classical baseline every serious NLP project should report against.

* ``TransformerTextClassifier`` — a fine-tuned Hugging Face model (e.g. xlm-roberta / muril)
  loaded from disk if present. Heavy deps (torch/transformers) are imported lazily so the
  service starts fast and the baseline works even if they aren't installed.

``TextClassificationModel`` picks the transformer when a fine-tuned model exists in its
model directory, otherwise falls back to the baseline — so the app is useful immediately and
"upgrades" automatically when you drop in a trained model.
"""

from __future__ import annotations

import csv
from pathlib import Path

from ..preprocessing import clean, preprocess_for_baseline
from ..schemas import ClassificationResponse, LabelScore


# --------------------------------------------------------------------------- baseline

class BaselineTextClassifier:
    def __init__(self) -> None:
        self.pipeline = None
        self.labels: list[str] = []

    def fit(self, texts: list[str], labels: list[str]) -> "BaselineTextClassifier":
        # Imported here so the module loads even before sklearn is installed.
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline

        # Word 1–2 grams on preprocessed (stopword-removed) text. For production, adding
        # char_wb (3,5) n-grams noticeably helps morphologically rich Devanagari.
        self.pipeline = Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        preprocessor=preprocess_for_baseline,
                        ngram_range=(1, 2),
                        min_df=1,
                        sublinear_tf=True,
                    ),
                ),
                (
                    "clf",
                    LogisticRegression(max_iter=1000, C=4.0, class_weight="balanced"),
                ),
            ]
        )
        self.pipeline.fit(texts, labels)
        self.labels = list(self.pipeline.named_steps["clf"].classes_)
        return self

    def predict(self, text: str) -> tuple[str, list[LabelScore]]:
        proba = self.pipeline.predict_proba([text])[0]
        scores = sorted(
            (LabelScore(label=l, score=float(p)) for l, p in zip(self.labels, proba)),
            key=lambda s: s.score,
            reverse=True,
        )
        return scores[0].label, scores

    def save(self, path: Path) -> None:
        import joblib

        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"pipeline": self.pipeline, "labels": self.labels}, path)

    @classmethod
    def load(cls, path: Path) -> "BaselineTextClassifier":
        import joblib

        obj = cls()
        data = joblib.load(path)
        obj.pipeline = data["pipeline"]
        obj.labels = data["labels"]
        return obj


# ------------------------------------------------------------------------ transformer

class TransformerTextClassifier:
    def __init__(self, model_dir: Path) -> None:
        self.model_dir = model_dir
        self._pipe = None
        self.labels: list[str] = []

    def load(self) -> "TransformerTextClassifier":
        from transformers import pipeline  # lazy, heavy

        self._pipe = pipeline(
            "text-classification",
            model=str(self.model_dir),
            tokenizer=str(self.model_dir),
            top_k=None,  # return all class scores
            truncation=True,
        )
        # Recover label order from the model config.
        id2label = self._pipe.model.config.id2label
        self.labels = [id2label[i] for i in sorted(id2label)]
        return self

    def predict(self, text: str) -> tuple[str, list[LabelScore]]:
        raw = self._pipe(clean(text))[0]  # list[{label, score}]
        scores = sorted(
            (LabelScore(label=r["label"], score=float(r["score"])) for r in raw),
            key=lambda s: s.score,
            reverse=True,
        )
        return scores[0].label, scores


# ------------------------------------------------------------------- orchestrator

def _has_transformer_model(model_dir: Path) -> bool:
    return model_dir.exists() and (model_dir / "config.json").exists()


def load_sample_dataset(csv_path: Path) -> tuple[list[str], list[str]]:
    texts, labels = [], []
    with open(csv_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            texts.append(row["text"])
            labels.append(row["label"])
    return texts, labels


class TextClassificationModel:
    """Chooses the transformer tier if available, else the baseline."""

    def __init__(self, name: str, model_dir: Path, sample_csv: Path) -> None:
        self.name = name
        self.model_dir = model_dir
        self.sample_csv = sample_csv
        self.tier = "unavailable"
        self._impl = None

    def load(self) -> "TextClassificationModel":
        if _has_transformer_model(self.model_dir):
            try:
                self._impl = TransformerTextClassifier(self.model_dir).load()
                self.tier = "transformer"
                return self
            except Exception as exc:  # fall back gracefully
                print(f"[{self.name}] transformer load failed ({exc}); using baseline")

        # Baseline: load a saved pipeline if present, else train on sample data now.
        saved = self.model_dir / "baseline.joblib"
        if saved.exists():
            self._impl = BaselineTextClassifier.load(saved)
        else:
            texts, labels = load_sample_dataset(self.sample_csv)
            self._impl = BaselineTextClassifier().fit(texts, labels)
        self.tier = "baseline"
        return self

    @property
    def labels(self) -> list[str]:
        return self._impl.labels if self._impl else []

    @property
    def ready(self) -> bool:
        return self._impl is not None

    def predict(self, text: str) -> ClassificationResponse:
        label, scores = self._impl.predict(text)
        return ClassificationResponse(
            label=label,
            confidence=scores[0].score,
            scores=scores,
            model=self.tier,
        )
