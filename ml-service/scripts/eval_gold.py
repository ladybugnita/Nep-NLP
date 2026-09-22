"""Evaluate the news models on a HAND-LABELLED gold test set — the credible accuracy number.

Reports accuracy, per-class precision/recall/F1 and a confusion matrix for BOTH tiers
(classical baseline and, if present, the fine-tuned transformer) on gold labels you created
with the labelling tool. Only the five known topics are scored; 'other'/'skip' rows are
excluded (the 5-class model can't be right on those, so counting them would be unfair).

    python scripts/eval_gold.py --gold data/gold/gold.csv
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config  # noqa: E402
from app.models.base import BaselineTextClassifier, TransformerTextClassifier  # noqa: E402

KNOWN = {"राजनीति", "खेलकुद", "प्रविधि", "अर्थतन्त्र", "मनोरञ्जन"}


def load_gold(path: Path):
    texts, labels = [], []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            lab = (r.get("label") or "").strip()
            if lab in KNOWN and r.get("text"):
                texts.append(r["text"])
                labels.append(lab)
    return texts, labels


def report(name, y_true, y_pred):
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    labels_sorted = sorted(KNOWN)
    print(f"\n===== {name} =====")
    print(f"gold accuracy: {accuracy_score(y_true, y_pred)*100:.1f}%  (n={len(y_true)})")
    print(classification_report(y_true, y_pred, labels=labels_sorted, digits=3, zero_division=0))
    print("confusion matrix (rows=true, cols=pred):")
    print("labels:", labels_sorted)
    print(confusion_matrix(y_true, y_pred, labels=labels_sorted))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--gold", type=Path, default=Path("data/gold/gold.csv"))
    args = ap.parse_args()

    texts, gold = load_gold(args.gold)
    if not texts:
        print("No gold rows with a known label found. Label some articles first.")
        return
    print(f"Loaded {len(texts)} gold items across {len(set(gold))} topics.")

    # Baseline
    bpath = config.NEWS_MODEL_DIR / "baseline.joblib"
    if bpath.exists():
        clf = BaselineTextClassifier.load(bpath)
        report("Baseline (TF-IDF + char n-grams)", gold, [clf.predict(t)[0] for t in texts])
    else:
        print("(no baseline.joblib found)")

    # Transformer (if fine-tuned model present)
    if (config.NEWS_MODEL_DIR / "config.json").exists():
        try:
            tf = TransformerTextClassifier(config.NEWS_MODEL_DIR).load()
            report("Transformer (fine-tuned)", gold, [tf.predict(t)[0] for t in texts])
        except Exception as e:
            print(f"(transformer eval skipped: {e})")
    else:
        print("(no fine-tuned transformer present)")


if __name__ == "__main__":
    main()
