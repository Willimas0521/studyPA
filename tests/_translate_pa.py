#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Translate the Al Brooks price-action books into Chinese via MyMemory (the only
reachable free MT route in this environment; DeepSeek key returns 402).

What this does:
  1. Translates every unit's LABEL (book / part / chapter title) to Chinese so the
     navigation rail and the chapter headings render in Chinese. The chapter body,
     when not yet translated, keeps its English text (Chinese title + English body).
  2. With --body, also machine-translates the chapter bodies in <=400-char chunks.
     MyMemory's free quota is tiny (~5k words/day), so full body translation across
     three ~1,600-page books is NOT achievable in one session; the script translates
     as much as the quota allows, stops cleanly on quota, and is resumable — just
     re-run it later / with a funded API to continue filling data/price_action_books_zh.json.

Output: data/price_action_books_zh.json  ({unit_id: {"label": zh, "html": zh_html}})
The generator (_gen_price_action_books.py) reads this file and overrides labels/html.

Run:
  python tests/_translate_pa.py            # labels only (fast, ~100 calls)
  python tests/_translate_pa.py --body     # also attempt body translation (quota-limited)
  python tests/_translate_pa.py --force    # re-translate even if already present
"""
import json, re, sys, time, urllib.parse, urllib.request

ROOT = os_dir = None
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
EN_JSON = _os.path.join(ROOT, "data", "price_action_books_en.json")
ZH_JSON = _os.path.join(ROOT, "data", "price_action_books_zh.json")

# ---- manual Chinese for books + parts (better quality than MT) ----
BOOK_ZH = {
    "pa1": "价格行为交易之趋势篇 · Al Brooks",
    "pa2": "价格行为交易之区间篇 · Al Brooks",
    "pa3": "价格行为交易之反转篇 · Al Brooks",
}
PART_ZH = {
    "pa1-p1": "第一部分 · 价格行为",
    "pa1-p2": "第二部分 · 趋势线与通道",
    "pa1-p3": "第三部分 · 趋势",
    "pa1-p4": "第四部分 · 常见趋势形态",
    "pa2-p1": "第一部分 · 突破：转入新趋势",
    "pa2-p2": "第二部分 · 磁吸：支撑与阻力",
    "pa2-p3": "第三部分 · 回调：趋势转为交易区间",
    "pa2-p4": "第四部分 · 交易区间",
    "pa2-p5": "第五部分 · 订单与交易管理",
    "pa3-p1": "第一部分 · 趋势反转：趋势变为反向趋势",
    "pa3-p2": "第二部分 · 日内交易",
    "pa3-p3": "第三部分 · 第一个小时（开盘区间）",
    "pa3-p4": "第四部分 · 综合应用",
}

API = "https://api.mymemory.translated.net/get?%s"

class QuotaError(Exception):
    pass

def translate(text, tries=4):
    if not text or not text.strip():
        return text
    q = text.strip()
    url = API % urllib.parse.urlencode({"q": q, "langpair": "en|zh-CN"})
    delay = 1.0
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            r = urllib.request.urlopen(req, timeout=20)
            data = json.loads(r.read().decode("utf-8", "replace"))
            status = data.get("responseStatus")
            txt = (data.get("responseData") or {}).get("translatedText", "")
            if status == 200 and txt and "MYMEMORY WARNING" not in txt:
                time.sleep(0.35)  # be polite to the free endpoint
                return txt
            if status == 429 or "MYMEMORY WARNING" in txt or status in (402, 403, 500, 503):
                raise QuotaError("status=%s details=%s" % (status, data.get("responseDetails")))
            # other non-200: retry
        except QuotaError:
            raise
        except Exception as e:
            pass
        time.sleep(delay)
        delay *= 1.8
    raise QuotaError("retries exhausted")

def split_text(text, size=380):
    """Split into <=size chunks at sentence/space boundaries."""
    out = []
    buf = ""
    for seg in re.split(r'(?<=[.!?])\s+', text):
        if len(buf) + len(seg) + 1 <= size:
            buf = (buf + " " + seg).strip()
        else:
            if buf:
                out.append(buf)
            buf = seg
            while len(buf) > size:
                out.append(buf[:size])
                buf = buf[size:]
    if buf:
        out.append(buf)
    return out

def translate_html(html):
    """Translate only text outside tags, preserving tag positions."""
    tokens = re.split(r'(<[^>]+>)', html)
    # merge consecutive text tokens into translation batches
    batches = []
    cur = ""
    for tok in tokens:
        if tok.startswith("<"):
            if cur:
                batches.append(("t", cur)); cur = ""
            batches.append(("tag", tok))
        else:
            if not cur:
                cur = tok
            elif len(cur) + len(tok) <= 380:
                cur += tok
            else:
                batches.append(("t", cur)); cur = tok
    if cur:
        batches.append(("t", cur))
    out = []
    for kind, val in batches:
        if kind == "tag":
            out.append(val)
        else:
            zh = translate(val)
            out.append(zh)
    return "".join(out)

def patch_title(html, zh_label):
    """Replace the unit's heading (first <h2>/<h3>) text with the Chinese label."""
    def repl(m):
        return m.group(1) + zh_label + m.group(3)
    return re.sub(r'(<h[23][^>]*>)([\s\S]*?)(</h[23]>)', repl, html, count=1)

def main():
    do_body = "--body" in sys.argv
    force = "--force" in sys.argv
    # Read from the IMMUTABLE English source so a poisoned zh.json can never
    # corrupt the text we translate.
    en = json.load(open(EN_JSON, encoding="utf-8"))
    zh = {}
    if _os.path.exists(ZH_JSON):
        zh = json.load(open(ZH_JSON, encoding="utf-8"))

    label_count = 0
    body_count = 0
    for uid, u in en.items():
        label_en = u["label"]
        existing = zh.get(uid)
        have_label = isinstance(existing, dict) and "label" in existing
        have_html = isinstance(existing, dict) and "html" in existing

        # ---- label ----
        if have_label and not force:
            label_zh = existing["label"]
        else:
            if uid in BOOK_ZH:
                label_zh = BOOK_ZH[uid]
            elif uid in PART_ZH:
                label_zh = PART_ZH[uid]
            else:
                try:
                    label_zh = translate(label_en)
                except QuotaError:
                    print("QUOTA reached during labels at %s; stopping." % uid)
                    break
            label_count += 1

        # ---- body ----
        html_zh = None
        if do_body:
            if have_html and not force:
                html_zh = existing["html"]
            else:
                try:
                    html_zh = translate_html(u["html_en"])
                    body_count += 1
                except QuotaError:
                    print("QUOTA reached during body at %s; stopping. (labels done, body partial)")
                    html_zh = None
                    # still persist label below, then break
                    zh[uid] = {"label": label_zh, "html": u["html_en"]}
                    break
        else:
            # labels-only mode: patch the English heading with the Chinese title,
            # keep the English body so the chapter reads Chinese-title + English text.
            if not have_html or force:
                html_zh = patch_title(u["html_en"], label_zh)

        # persist
        if html_zh is not None:
            zh[uid] = {"label": label_zh, "html": html_zh}
        else:
            zh[uid] = {"label": label_zh}

        if label_count and label_count % 20 == 0:
            json.dump(zh, open(ZH_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print("  ... %d labels, %d bodies translated" % (label_count, body_count))

    json.dump(zh, open(ZH_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("DONE: %d labels, %d bodies translated -> %s" % (label_count, body_count, ZH_JSON))
    print("total zh entries:", len(zh))

if __name__ == "__main__":
    main()
