"""Collect REAL Nepali news via public RSS feeds, labelled by topic (distant supervision).

Approach
--------
Nepali news portals publish RSS feeds whose items carry <category> tags. We don't trust a
single messy tag; instead we score each article's (title + categories + summary) against a
keyword lexicon for our five topics and keep it only when ONE topic clearly wins. Ambiguous
items are skipped -> higher label precision (what a classifier needs).

This is "distant supervision": labels are derived from metadata instead of hand-annotation.
It is a legitimate, citable way to bootstrap a real dataset (document it in the datasheet),
and a great complement to a small hand-labelled gold set.

Etiquette
---------
* Only public RSS feeds are fetched (never full-article scraping here).
* robots.txt is honoured; requests are rate-limited; a descriptive User-Agent is sent.
* Store only title + short summary + source URL, not full copyrighted article bodies.

Usage
-----
    python scripts/scrape_news.py --pages 15 --out data/raw/news_scraped.csv
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
import time
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

UA = "NepNLP-research/0.1 (+student NLP project; contact via repo)"

# Public RSS feeds. WordPress-style feeds accept ?paged=N for more history.
SOURCES = [
    # max_pages caps how many pages we pull; sites with a big crawl-delay get fewer.
    {"name": "onlinekhabar", "feed": "https://www.onlinekhabar.com/feed", "paged": True, "max_pages": 20},
    {"name": "ratopati", "feed": "https://www.ratopati.com/feed", "paged": True, "max_pages": 1},
]

# Topic lexicon (Devanagari). Keyword hit in title/category/summary -> vote for that label.
LEXICON = {
    "राजनीति": ["सरकार", "मन्त्री", "प्रधानमन्त्री", "संसद", "निर्वाचन", "दल", "राष्ट्रपति",
                 "सभा", "अध्यादेश", "गठबन्धन", "राजनीति", "सांसद", "मन्त्रिपरिषद", "विधेयक",
                 "काँग्रेस", "एमाले", "माओवादी", "प्रतिपक्ष", "मतदान"],
    "खेलकुद": ["खेल", "फुटबल", "क्रिकेट", "भलिबल", "खेलाडी", "प्रतियोगिता", "ओलम्पिक",
                "विश्वकप", "गोल", "टोली", "कप्तान", "म्याच", "लिग", "रनौट", "विकेट", "पदक"],
    "अर्थतन्त्र": ["अर्थ", "बजार", "शेयर", "बैंक", "व्यापार", "मूल्य", "राजस्व", "बजेट",
                    "लगानी", "रेमिट्यान्स", "अर्थतन्त्र", "वित्त", "उद्योग", "निर्यात", "आयात",
                    "मुद्रा", "ब्याजदर", "महँगी"],
    "मनोरञ्जन": ["चलचित्र", "फिल्म", "गीत", "गायक", "गायिका", "कलाकार", "अभिनेता",
                  "अभिनेत्री", "संगीत", "नाटक", "सिनेमा", "मनोरञ्जन", "म्युजिक", "एल्बम",
                  "निर्देशक", "मोडल"],
    "प्रविधि": ["प्रविधि", "मोबाइल", "एप", "इन्टरनेट", "कम्प्युटर", "सफ्टवेयर", "स्मार्टफोन",
                 "गुगल", "फेसबुक", "एआई", "कृत्रिम बुद्धिमत्ता", "डिजिटल", "ल्यापटप", "टेलिकम",
                 "एप्पल", "च्याटजिपिटी"],
}

_TAG_RE = re.compile(r"<[^>]+>")


def strip_html(s: str) -> str:
    return _TAG_RE.sub(" ", s or "").strip()


def robots_check(feed_url: str) -> tuple[bool, float]:
    """Return (allowed, crawl_delay_seconds). Fetch robots.txt with OUR user-agent so the
    site doesn't block the default urllib UA and make us fail closed on a permissive file."""
    parsed = urlparse(feed_url)
    robots = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = urllib.robotparser.RobotFileParser()
    txt = fetch(robots, timeout=15)
    if txt is None:
        return True, 0.0  # robots.txt unreachable -> allowed for a public feed
    rp.parse(txt.splitlines())
    allowed = rp.can_fetch(UA, feed_url)
    try:
        delay = rp.crawl_delay(UA) or 0.0
    except Exception:
        delay = 0.0
    return allowed, float(delay)


def fetch(url: str, timeout: int = 20) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  ! fetch failed: {url} ({e})")
        return None


def parse_items(xml_text: str):
    """Yield (title, summary, [categories]) from an RSS document."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return
    for item in root.iter("item"):
        title = item.findtext("title", default="") or ""
        summary = strip_html(item.findtext("description", default="") or "")
        cats = [c.text or "" for c in item.findall("category")]
        yield title.strip(), summary.strip(), cats


def label_for(title: str, summary: str, cats: list[str]) -> str | None:
    """Vote by keyword hits and return a label only when one topic clearly wins.

    We score the TITLE and the CATEGORY tags (the reliable signals) and ignore the summary
    for labelling — summary-only matches were the main source of wrong labels (e.g. an
    accident story that merely mentions a price). Requiring a clear margin raises precision,
    which is what a classifier needs, at the cost of some recall.
    """
    cat_hay = " ".join(cats)
    scores = {label: 0 for label in LEXICON}
    for label, kws in LEXICON.items():
        for kw in kws:
            if kw in cat_hay:
                scores[label] += 3          # category tag = strongest signal
            if kw in title:
                scores[label] += 2          # title hit = strong
            if kw in summary:
                scores[label] += 1          # summary hit = weak (supporting only)
    ranked = sorted(scores.values(), reverse=True)
    top = ranked[0]
    if top < 2:                              # need a title or category hit (not summary alone)
        return None
    if len(ranked) > 1 and ranked[1] >= top:  # require a strict winner
        return None
    return max(scores, key=scores.get)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pages", type=int, default=15, help="pages per paged feed")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between requests")
    ap.add_argument("--out", type=Path, default=Path("data/raw/news_scraped.csv"))
    ap.add_argument("--dump-all", type=Path, default=None,
                    help="also write EVERY fetched article (no label filter) here — the "
                         "unbiased pool to sample a hand-labelled gold test set from")
    args = ap.parse_args()

    out = args.out
    out.parent.mkdir(parents=True, exist_ok=True)

    seen_titles: set[str] = set()
    rows = []  # (text, label, source, title)
    pool = []  # (id, text, source) — ALL articles, for gold sampling
    per_label = {label: 0 for label in LEXICON}

    for src in SOURCES:
        allowed, crawl_delay = robots_check(src["feed"])
        if not allowed:
            print(f"[{src['name']}] disallowed by robots.txt — skipping")
            continue
        delay = max(args.delay, crawl_delay)
        n_pages = min(args.pages, src.get("max_pages", args.pages)) if src["paged"] else 1
        print(f"[{src['name']}] fetching {n_pages} page(s), delay {delay:g}s "
              f"(robots crawl-delay {crawl_delay:g}s)...")
        for p in (range(1, n_pages + 1) if src["paged"] else [1]):
            url = f"{src['feed']}?paged={p}" if src["paged"] else src["feed"]
            xml_text = fetch(url)
            time.sleep(delay)
            if not xml_text:
                continue
            got = 0
            for title, summary, cats in parse_items(xml_text):
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                text = (title + ". " + summary).strip()
                text = re.sub(r"\s+", " ", text)
                # Pool = every article (used to sample an unbiased gold test set).
                aid = hashlib.md5(title.encode("utf-8")).hexdigest()[:10]
                pool.append((aid, text, src["name"]))
                # Labelled set = only clearly-topical articles (distant supervision).
                label = label_for(title, summary, cats)
                if label:
                    rows.append((text, label, src["name"], title))
                    per_label[label] += 1
                    got += 1
            print(f"  page {p}: +{got} labelled (total {len(rows)}, pool {len(pool)})")

    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "source"])
        for text, label, source, _ in rows:
            w.writerow([text, label, source])

    if args.dump_all:
        args.dump_all.parent.mkdir(parents=True, exist_ok=True)
        with open(args.dump_all, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["id", "text", "source"])
            for aid, text, source in pool:
                w.writerow([aid, text, source])
        print(f"Pool of {len(pool)} unlabelled articles -> {args.dump_all}")

    print(f"\nSaved {len(rows)} labelled articles -> {out}")
    print("Per-label counts:", per_label)
    print("NOTE: distant-supervision labels are noisy; hand-verify a sample and document it.")


if __name__ == "__main__":
    main()
