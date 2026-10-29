# eval — NepEval-Robust harness

One command runs the whole robustness evaluation from a config:

```bash
cd ml-service
python -m eval.run_all --config configs/demo.json      
python -m eval.run_all --config configs/paper.json     
python scripts/export_results.py                       
```

Outputs (in `results/`, git-ignored):
- `robustness_<name>.json`  every number, with provenance (dataset sha256, config sha256,
  git commit, seeds, machine) and automatic warnings.
- `errors_<name>.csv` misclassified items with an empty `error_category` column for manual
  analysis (taxonomy: `research/error_taxonomy.md`).

## What it does

1. **Data & split** group-aware stratified split: exact/near-duplicate clusters never cross
   train/test (the bundled data is template-heavy; see `research/data_collection_plan.md`).
   Or use a predefined `split` column (e.g. from `scripts/export_dataset.py`).
2. **Models** (`models.py`) trained on clean train text: `tfidf_baseline`; `hf_transformer`
   (fine-tune on Colab on the same split, point `model_dir` at it); `PromptedLLM` (zero-shot,
   inject your own completion function no provider is wired in).
3. **Conditions** (`perturb.py`) clean · unicode noise · Preeti · spelling @ rates ·
   Romanized · code-mixed. Each records what it actually did (`achieved_rate`).
4. **Normalization variants** `none`, `full`, and `ablate:<step>` for each nepnorm step.
5. **Metrics** (`metrics.py`) accuracy, macro-F1 (mean ± std over perturbation seeds, 95 %
   bootstrap CI), per-class F1, ECE; McNemar exact tests (nepnorm vs none; clean vs perturbed),
   Holm-corrected across the run; recovery = share of the drop won back; per-text latency of
   the full pipeline with a cold spell cache per condition.

## Honest limits (read before quoting any number)

- **Circular perturbations**: spelling (nepnorm's confusion model), Preeti (inverse of
  nepnorm's key map), Romanized / code-mixed (nepnorm's romanizer), recovery on them is an
  upper bound. The paper needs the natural Romanized/code-mixed test subset.
- **Code-mixing** is limited by `data/en_subs.tsv` (≈70 words): the achieved rate is what is
  reported, not the target.
- **Silver labels** in the demo run; test n = 197 → "preliminary".
- `ece` with the TF-IDF model reflects an uncalibrated model; `PromptedLLM` outputs one-hot
  probabilities, so its ECE is not meaningful.

## Tests

`tests/test_eval.py` metrics equal scikit-learn; McNemar against a hand-computed value; Holm;
perturbations deterministic; the Unicode perturbation is exactly undone by nepnorm; the Preeti
perturbation round-trips; an end-to-end run on the bundled sample.
