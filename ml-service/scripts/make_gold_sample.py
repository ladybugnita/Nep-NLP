"""Sample an unbiased set of articles and generate a self-contained HTML labelling tool.

Why: the distant-supervision labels are ~85-90% precise, so evaluating on them is circular.
A small HAND-LABELLED gold test set — sampled from ALL articles (including the hard ones the
keyword rule skipped) — gives a *credible* accuracy number to report.

Pipeline:
    1. python scripts/scrape_news.py --pages 20 --dump-all data/gold/pool.csv
    2. python scripts/make_gold_sample.py --pool data/gold/pool.csv --n 300
    3. open tools/label_news.html in your browser, label with keys 1-5 (o = other, s = skip),
       then click "Download gold.csv" and save it to data/gold/gold.csv
    4. python scripts/eval_gold.py --gold data/gold/gold.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path

LABELS = ["राजनीति", "खेलकुद", "प्रविधि", "अर्थतन्त्र", "मनोरञ्जन"]

HTML_TEMPLATE = r"""<!doctype html>
<html lang="ne"><head><meta charset="utf-8"><title>NepNLP — Gold labelling</title>
<style>
  :root{font-family:'Mukta','Inter',system-ui,sans-serif}
  body{margin:0;background:#0f1117;color:#e8eaf0;display:flex;flex-direction:column;
       min-height:100vh;align-items:center}
  .wrap{max-width:760px;width:100%;padding:24px}
  h1{font-size:22px;margin:0 0 4px} .muted{color:#9aa1b0;font-size:13px}
  .card{background:#171a22;border:1px solid #262a35;border-radius:14px;padding:22px;margin:16px 0;
        font-size:20px;line-height:1.7;min-height:120px}
  .bar{height:8px;background:#262a35;border-radius:99px;overflow:hidden;margin:10px 0}
  .fill{height:100%;background:linear-gradient(90deg,#003893,#c8102e)}
  .btns{display:flex;flex-wrap:wrap;gap:8px}
  button{font-family:inherit;font-size:15px;padding:10px 14px;border-radius:10px;border:1px solid #262a35;
         background:#1f2330;color:#e8eaf0;cursor:pointer}
  button:hover{border-color:#003893}
  .k{display:inline-block;min-width:18px;color:#9aa1b0;font-size:12px}
  .counts{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;font-size:13px;color:#9aa1b0}
  .dl{background:#16a34a;border:none;font-weight:700;margin-top:8px}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  a{color:#8ab4ff}
</style></head><body><div class="wrap">
<h1>Gold labelling — Nepali news</h1>
<div class="muted">Read each article and press the key for its TRUE topic. Progress saves in your
browser; you can close and resume. When done, click <b>Download gold.csv</b> and save it to
<code>data/gold/gold.csv</code>.</div>
<div class="bar"><div class="fill" id="fill"></div></div>
<div class="row"><span class="muted" id="prog"></span><span class="muted" id="srcinfo"></span></div>
<div class="card" id="text"></div>
<div class="btns" id="btns"></div>
<div class="row" style="margin-top:12px">
  <button onclick="prev()"><span class="k">←</span> Back</button>
  <button onclick="skip()"><span class="k">s</span> Skip / unsure</button>
  <button onclick="other()"><span class="k">o</span> Other topic</button>
  <button class="dl" onclick="download()">⬇ Download gold.csv</button>
</div>
<div class="counts" id="counts"></div>
<p class="muted">Keys: <b>1</b>=राजनीति &nbsp; <b>2</b>=खेलकुद &nbsp; <b>3</b>=प्रविधि &nbsp;
 <b>4</b>=अर्थतन्त्र &nbsp; <b>5</b>=मनोरञ्जन &nbsp; <b>o</b>=other &nbsp; <b>s</b>=skip &nbsp; <b>←</b>=back</p>
<script>
const DATA = __DATA__;          // [{id,text,source}]
const LABELS = __LABELS__;      // ["राजनीति",...]
const KEY = "nepnlp-gold-labels";
let i = 0, labels = {};
try { labels = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){}
// resume at first unlabelled
i = DATA.findIndex(d => !(d.id in labels)); if (i < 0) i = DATA.length - 1;

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(labels)); }catch(e){} }
function render(){
  const d = DATA[i];
  document.getElementById('text').textContent = d ? d.text : '';
  document.getElementById('prog').textContent = `Article ${i+1} / ${DATA.length}`;
  document.getElementById('srcinfo').textContent = d ? `· source: ${d.source} · current: ${labels[d.id]||'—'}` : '';
  document.getElementById('fill').style.width = (Object.keys(labels).length/DATA.length*100)+'%';
  const btns = document.getElementById('btns'); btns.innerHTML='';
  LABELS.forEach((l,idx)=>{ const b=document.createElement('button');
    b.innerHTML=`<span class="k">${idx+1}</span> ${l}`; b.onclick=()=>set(l); btns.appendChild(b); });
  const c={}; Object.values(labels).forEach(v=>c[v]=(c[v]||0)+1);
  document.getElementById('counts').innerHTML = Object.entries(c).map(([k,v])=>`${k}: ${v}`).join(' &nbsp; ');
}
function set(l){ const d=DATA[i]; if(!d) return; labels[d.id]=l; save(); if(i<DATA.length-1)i++; render(); }
function other(){ set('other'); }
function skip(){ if(i<DATA.length-1)i++; render(); }
function prev(){ if(i>0)i--; render(); }
function download(){
  let csv = "id,text,label\n";
  DATA.forEach(d=>{ if(labels[d.id]){ const t='"'+d.text.replace(/"/g,'""')+'"';
    csv += `${d.id},${t},${labels[d.id]}\n`; }});
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='gold.csv'; a.click();
}
document.addEventListener('keydown',e=>{
  if(e.key>='1'&&e.key<='5'){ set(LABELS[+e.key-1]); }
  else if(e.key==='o'){ other(); } else if(e.key==='s'){ skip(); }
  else if(e.key==='ArrowLeft'){ prev(); }
});
render();
</script></div></body></html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pool", type=Path, default=Path("data/gold/pool.csv"))
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out-html", type=Path, default=Path("tools/label_news.html"))
    args = ap.parse_args()

    with open(args.pool, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r.get("text")]
    random.Random(args.seed).shuffle(rows)
    sample = rows[: args.n]

    data = [{"id": r["id"], "text": r["text"], "source": r.get("source", "")} for r in sample]
    html = (HTML_TEMPLATE
            .replace("__DATA__", json.dumps(data, ensure_ascii=False))
            .replace("__LABELS__", json.dumps(LABELS, ensure_ascii=False)))

    args.out_html.parent.mkdir(parents=True, exist_ok=True)
    args.out_html.write_text(html, encoding="utf-8")
    print(f"Sampled {len(sample)} of {len(rows)} pool articles.")
    print(f"Labelling tool -> {args.out_html}  (open it in your browser)")


if __name__ == "__main__":
    main()
