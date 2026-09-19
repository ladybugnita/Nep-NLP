"""Train a NepNLP text classifier (news or sentiment).

Supports two model types:

  * ``baseline``     — TF-IDF + Logistic Regression (scikit-learn). Fast, CPU-only.
  * ``transformer``  — fine-tune a multilingual/Nepali encoder with Hugging Face Trainer.

The script always prints a proper evaluation (accuracy, per-class precision/recall/F1, and a
confusion matrix) on a held-out test set — the rigor that makes results credible. Saved
models go to ``models_store/<task>/`` where the running ML service auto-detects them.

Examples
--------
Baseline on the bundled sample data:
    python -m training.train_classifier --task sentiment --model baseline

Fine-tune a transformer (on Colab GPU) with your own dataset:
    python -m training.train_classifier --task news --model transformer \\
        --data data/news_full.csv --base-model xlm-roberta-base --epochs 4

Good Nepali-friendly base checkpoints to try for --base-model:
    xlm-roberta-base            (robust multilingual default)
    google/muril-base-cased     (strong on South-Asian languages)
    Sakonii/distilbert-base-nepali
    NepBERTa/NepBERTa
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

# Make `app` importable whether run as a module or a script.
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config  # noqa: E402
from app.preprocessing import clean  # noqa: E402


DEFAULT_DATA = {
    "news": config.NEWS_SAMPLE_CSV,
    "sentiment": config.SENTIMENT_SAMPLE_CSV,
}
OUTPUT_DIR = {
    "news": config.NEWS_MODEL_DIR,
    "sentiment": config.SENTIMENT_MODEL_DIR,
}


def load_data(path: Path) -> tuple[list[str], list[str]]:
    df = pd.read_csv(path).dropna(subset=["text", "label"])
    return df["text"].astype(str).tolist(), df["label"].astype(str).tolist()

def train_baseline(task, texts, labels, test_size, seed, out_dir):
    from app.models.base import BaselineTextClassifier

    X_tr, X_te, y_tr, y_te = train_test_split(
        texts, labels, test_size=test_size, random_state=seed, stratify=labels
    )
    clf = BaselineTextClassifier().fit(X_tr, y_tr)
    y_pred = [clf.predict(t)[0] for t in X_te]

    print(f"\n=== Baseline ({task}) — held-out test ===")
    print(classification_report(y_te, y_pred, digits=3, zero_division=0))
    print("Confusion matrix (rows=true, cols=pred):")
    print("labels:", clf.labels)
    print(confusion_matrix(y_te, y_pred, labels=clf.labels))

    out = out_dir / "baseline.joblib"
    clf.save(out)
    print(f"\nSaved baseline -> {out}")

def train_transformer(task, texts, labels, base_model, epochs, batch_size,
                      lr, test_size, seed, out_dir):
    import numpy as np
    import evaluate
    from datasets import Dataset
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        DataCollatorWithPadding,
        Trainer,
        TrainingArguments,
    )

    label_list = sorted(set(labels))
    label2id = {l: i for i, l in enumerate(label_list)}
    id2label = {i: l for l, i in label2id.items()}

    texts = [clean(t) for t in texts]
    y = [label2id[l] for l in labels]

    X_tr, X_te, y_tr, y_te = train_test_split(
        texts, y, test_size=test_size, random_state=seed, stratify=y
    )

    tok = AutoTokenizer.from_pretrained(base_model)

    def tokenize(batch):
        return tok(batch["text"], truncation=True, max_length=256)

    ds_tr = Dataset.from_dict({"text": X_tr, "label": y_tr}).map(tokenize, batched=True)
    ds_te = Dataset.from_dict({"text": X_te, "label": y_te}).map(tokenize, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        base_model, num_labels=len(label_list), id2label=id2label, label2id=label2id
    )

    acc = evaluate.load("accuracy")
    f1 = evaluate.load("f1")

    def compute_metrics(eval_pred):
        logits, gold = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": acc.compute(predictions=preds, references=gold)["accuracy"],
            "f1_macro": f1.compute(predictions=preds, references=gold, average="macro")["f1"],
        }

    args = TrainingArguments(
        output_dir=str(out_dir / "_checkpoints"),
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        learning_rate=lr,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        logging_steps=20,
        report_to="none",
        seed=seed,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=ds_tr,
        eval_dataset=ds_te,
        tokenizer=tok,
        data_collator=DataCollatorWithPadding(tok),
        compute_metrics=compute_metrics,
    )
    trainer.train()

    preds = np.argmax(trainer.predict(ds_te).predictions, axis=-1)
    print(f"\n=== Transformer ({task}, {base_model}) — held-out test ===")
    print(classification_report(y_te, preds, target_names=label_list, digits=3,
                                zero_division=0))
    print("Confusion matrix (rows=true, cols=pred):")
    print("labels:", label_list)
    print(confusion_matrix(y_te, preds))

    out_dir.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(out_dir))
    tok.save_pretrained(str(out_dir))
    print(f"\nSaved transformer -> {out_dir}")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--task", required=True, choices=["news", "sentiment"])
    p.add_argument("--model", default="baseline", choices=["baseline", "transformer"])
    p.add_argument("--data", type=Path, default=None, help="CSV with text,label columns")
    p.add_argument("--base-model", default="xlm-roberta-base")
    p.add_argument("--epochs", type=int, default=4)
    p.add_argument("--batch-size", type=int, default=16)
    p.add_argument("--lr", type=float, default=2e-5)
    p.add_argument("--test-size", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--output-dir", type=Path, default=None)
    args = p.parse_args()

    data_path = args.data or DEFAULT_DATA[args.task]
    out_dir = args.output_dir or OUTPUT_DIR[args.task]
    out_dir.mkdir(parents=True, exist_ok=True)

    texts, labels = load_data(data_path)
    print(f"Loaded {len(texts)} rows from {data_path}  |  classes: {sorted(set(labels))}")

    if args.model == "baseline":
        train_baseline(args.task, texts, labels, args.test_size, args.seed, out_dir)
    else:
        train_transformer(args.task, texts, labels, args.base_model, args.epochs,
                          args.batch_size, args.lr, args.test_size, args.seed, out_dir)


if __name__ == "__main__":
    main()
