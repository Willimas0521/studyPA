#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Generate data/price_action_books.js (and structured source/units JSON) from the
three Al Brooks 'Trading Price Action' PDFs (Trends / Ranges / Reversals).

This is the price-action sibling of _gen_wyckoff_book2.py. Structure is driven by
each PDF's embedded table of contents (get_toc) instead of font-size heuristics,
because Al Brooks books have a clean PART / CHAPTER hierarchy:

    book-root (H2) -> [ front matter (H3), PART (H2) -> [ CHAPTER (H3) ... ] ]

Deliverables:
  assets/pa-images/paK/paK-img-NNN.jpg     illustrations (all charts, per book)
  data/price_action_books.js               window.PRICE_ACTION_BOOKS_BODY + _CHAPTERS
  data/price_action_books_source.json      meta (counts)
  data/price_action_books_units.json       per-unit {id,type,book,label,parent,html_en}
                                           (the translation source for _translate_pa.py)

Translation: populate data/price_action_books_zh.json as {unit_id: html_or_{html,label}};
the generator overrides html_en and/or label when present, then re-run.
"""
import fitz, re, os, json, html, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "pa-images")
OUT_JS = os.path.join(ROOT, "data", "price_action_books.js")
SRC_JSON = os.path.join(ROOT, "data", "price_action_books_source.json")
UNITS_JSON = os.path.join(ROOT, "data", "price_action_books_units.json")
EN_JSON = os.path.join(ROOT, "data", "price_action_books_en.json")
ZH_JSON = os.path.join(ROOT, "data", "price_action_books_zh.json")

BOOKS = [
    {"key": "trends", "img": "pa1",
     "pdf": r"C:/Users/Administrator/Downloads/高级篇著作/1. Trading Price Action_Trends价格行为交易之趋势篇.pdf",
     "title": "Trading Price Action: Trends", "zh": "价格行为交易之趋势篇"},
    {"key": "ranges", "img": "pa2",
     "pdf": r"C:/Users/Administrator/Downloads/高级篇著作/2. Trading Price Action_Ranges价格行为交易之区间篇.pdf",
     "title": "Trading Price Action: Trading Ranges", "zh": "价格行为交易之区间篇"},
    {"key": "reversals", "img": "pa3",
     "pdf": r"C:/Users/Administrator/Downloads/高级篇著作/3. Trading Price Action_Reversals价格行为交易之反转篇.pdf",
     "title": "Trading Price Action: Reversals", "zh": "价格行为交易之反转篇"},
]

SKIP_TITLES = {"CONTENTS", "ACKNOWLEDGMENTS", "ABOUT THE AUTHOR", "ABOUT THE WEBSITE",
               "INDEX", "ALSO BY THIS AUTHOR", "PRAISE FOR"}
FRONT_OK = {"INTRODUCTION", "LIST OF TERMS USED IN THIS BOOK", "PREFACE", "FOREWORD"}

LIG = {'\ufb00':'ff','\ufb01':'fi','\ufb02':'fl','\ufb03':'ffi','\ufb04':'ffl',
       '\ufb05':'ft','\ufb06':'st','\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"',
       '\u2013':'-','\u2014':'-','\u2026':'...'}

PART_RE = re.compile(r'^\s*PART\s+([IVXLC]+|\d+)\b', re.I)
CHAP_RE = re.compile(r'^\s*CHAPTER\s+(\d+)\b', re.I)
NUM_RE = re.compile(r'^\s*\d+\s*$')

def clean(text):
    for k, v in LIG.items():
        text = text.replace(k, v)
    text = re.sub(r'-\n(?=[a-z])', '', text)
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = re.sub(r'\n{2,}', '\n', text)
    return text.strip()

def esc(t):
    return html.escape(t, quote=False)

# --------------------------- per-book extraction ---------------------------
def extract_book(cfg, limit_books=None):
    doc = fitz.open(cfg["pdf"])
    n = doc.page_count
    img_prefix = cfg["img"]
    book_dir = os.path.join(IMG_DIR, img_prefix)
    os.makedirs(book_dir, exist_ok=True)

    # ---- pass 1: extract all images (stable names) ----
    xref_name = {}
    img_counter = 0
    for pno in range(n):
        for im in doc[pno].get_images(full=True):
            xr = im[0]
            if xr in xref_name:
                continue
            try:
                img = doc.extract_image(xr)
            except Exception:
                continue
            ext = (img.get('ext') or 'png').lower()
            if ext not in ('jpg', 'jpeg', 'png', 'gif', 'webp'):
                ext = 'png'
            if ext == 'jpeg':
                ext = 'jpg'
            img_counter += 1
            fn = "%s-img-%03d.%s" % (img_prefix, img_counter, ext)
            with open(os.path.join(book_dir, fn), 'wb') as f:
                f.write(img['image'])
            xref_name[xr] = fn
    print("[%s] extracted %d unique images" % (cfg["key"], img_counter))

    # ---- TOC -> structure ----
    toc = doc.get_toc()
    # each toc entry: (level, title, page). Build ordered content nodes.
    nodes = []  # (kind, raw_title, page1)
    for level, title, page in toc:
        t = title.strip()
        up = re.sub(r'\s+', ' ', t).upper()
        if level == 2:
            if up in SKIP_TITLES:
                continue
            if PART_RE.match(t):
                nodes.append(("part", t, page))
            elif up in FRONT_OK:
                nodes.append(("front", t, page))
            else:
                # e.g. About the Author etc. -> skip
                continue
        elif level == 3:
            if CHAP_RE.match(t):
                nodes.append(("chapter", t, page))
            # else ignore sub-sub entries
    # de-dup by (kind,page) keeping first
    seen = set(); uniq = []
    for nd in nodes:
        k = (nd[0], nd[2])
        if k in seen:
            continue
        seen.add(k); uniq.append(nd)
    nodes = uniq

    # assign each node an end page (next node's page, or doc end)
    for i, nd in enumerate(nodes):
        end = nodes[i + 1][2] if i + 1 < len(nodes) else n + 1
        nodes[i] = nd + (end,)  # (kind, title, start, end)

    # ---- build units ----
    units = []           # ordered translatable units (doc order)
    chapters_tree = []   # nested nav: book-root -> [front, part->[chapters]]

    book_id = "%s-book" % cfg["img"]
    book_label = "%s · Al Brooks" % cfg["zh"]
    units.append({"id": book_id, "type": "root", "book": cfg["key"],
                  "label": book_label,
                  "html_en": '<h2 id="%s">%s</h2>' % (book_id, esc(book_label))})

    book_kids = []

    # front matter
    front_kids = []
    for nd in nodes:
        if nd[0] != "front":
            continue
        fid = "%s-fm%d" % (cfg["img"], len(front_kids) + 1)
        label = clean(nd[1])
        html_en = build_html(doc, nd[2], nd[3], xref_name, cfg["img"], title_override=None)
        html_en = '<h3 id="%s">%s</h3>' % (fid, esc(label)) + html_en
        units.append({"id": fid, "type": "front", "book": cfg["key"],
                      "label": label, "parent": book_id, "html_en": html_en})
        front_kids.append({"id": fid, "label": label})

    # parts + chapters
    part_nodes = [nd for nd in nodes if nd[0] == "part"]
    chap_nodes = [nd for nd in nodes if nd[0] == "chapter"]
    ci = 0
    for pi, pnd in enumerate(part_nodes):
        pid = "%s-p%d" % (cfg["img"], pi + 1)
        plabel = clean(pnd[1])
        # part intro text (between part title page and first chapter of this part)
        first_chap_of_part = None
        for cnd in chap_nodes:
            if cnd[2] > pnd[2]:
                first_chap_of_part = cnd
                break
        part_end = first_chap_of_part[2] if first_chap_of_part else pnd[3]
        part_html = build_html(doc, pnd[2], part_end, xref_name, cfg["img"], title_override=plabel)
        part_html = '<h2 id="%s">%s</h2>' % (pid, esc(plabel)) + part_html
        units.append({"id": pid, "type": "part", "book": cfg["key"],
                      "label": plabel, "parent": book_id, "html_en": part_html})
        part_kids = []
        for cnd in chap_nodes:
            if cnd[2] <= pnd[2]:
                continue
            # belongs to this part until next part starts
            nxt = next((x for x in part_nodes if x is not pnd and x[2] > pnd[2]), None)
            if nxt and cnd[2] >= nxt[2]:
                continue
            cid = "%s-c%s" % (cfg["img"], CHAP_RE.match(cnd[1]).group(1))
            clabel = clean(cnd[1])
            chtml = build_html(doc, cnd[2], cnd[3], xref_name, cfg["img"], title_override=clabel)
            chtml = '<h3 id="%s">%s</h3>' % (cid, esc(clabel)) + chtml
            units.append({"id": cid, "type": "chapter", "book": cfg["key"],
                          "label": clabel, "parent": pid, "html_en": chtml})
            part_kids.append({"id": cid, "label": clabel})
        book_kids.append({"id": pid, "label": plabel, "kids": part_kids})

    doc.close()

    tree = {"id": book_id, "label": book_label, "kids": front_kids + book_kids}
    return units, tree

# --------------------------- page -> html ---------------------------
def build_html(doc, start1, end1, xref_name, img_prefix, title_override=None):
    """Extract pages [start1, end1) into an HTML fragment with figures interleaved.
    Uses word-level extraction (better word spacing than block dict) and rebuilds
    paragraphs by line gaps. Drops chapter title lines + running headers and
    handles the large drop-cap initial on the chapter's first page.
    """
    out = []
    title_norm = re.sub(r'\s+', '', title_override).upper() if title_override else ""
    for pno in range(start1 - 1, min(end1 - 1, doc.page_count)):
        H = doc[pno].rect.height
        is_first = (pno == start1 - 1)
        # ---- images ----
        img_items = []
        for im in doc[pno].get_images(full=True):
            xr = im[0]
            name = xref_name.get(xr)
            if not name:
                continue
            try:
                bbox = doc[pno].get_image_bbox(im)
            except Exception:
                continue
            img_items.append((bbox[1], bbox[0], name))
        # ---- words -> lines ----
        try:
            words = doc[pno].get_text("words")
        except Exception:
            words = []
        lines = []  # [y0, x0, [words]]
        cur = None
        for w in sorted(words, key=lambda w: (round(w[1]), w[0])):
            y0, x0, word = w[1], w[0], w[4]
            if cur is None or abs(y0 - cur[0]) > 4:
                cur = [y0, x0, [word]]
                lines.append(cur)
            else:
                cur[2].append(word)
        lines.sort(key=lambda L: (L[0], L[1]))
        # ---- paragraph grouping by line gaps ----
        paras = []  # [y0, x0, text]
        cap_fixed = False
        for y0, x0, wl in lines:
            text = ' '.join(wl).strip()
            if not text:
                continue
            norm = re.sub(r'\s+', '', text).upper()
            # drop chapter title lines / running headers (multi-char, matches title)
            if title_norm and len(norm) >= 8 and ('CHAPTER' in norm or norm in title_norm or title_norm in norm):
                continue
            # page-number / header-footer margin
            if (y0 < 60 or y0 > H - 50) and len(text) < 70:
                continue
            if NUM_RE.match(text) and len(text) <= 4:
                continue
            # first-page drop cap: a lone initial letter glued to the first word
            # (e.g. "W henever") -> drop the leading letter, capitalize the word.
            if is_first and not cap_fixed:
                m = re.match(r'^([A-Z]) (.*)$', text)
                if m and m.group(2) and m.group(2)[:1].islower():
                    text = m.group(2)[0].upper() + m.group(2)[1:]
                    cap_fixed = True
            if paras and (y0 - paras[-1][0]) > 15:
                paras.append([y0, x0, text])
            elif paras:
                paras[-1][2] += ' ' + text
            else:
                paras.append([y0, x0, text])
        # ---- first-page drop cap: a lone initial letter followed by lowercase text ----
        if is_first and len(paras) >= 2 and len(paras[0][2]) <= 2 and paras[0][2][:1].isalpha() and paras[1][2][:1].islower():
            paras.pop(0)
            paras[0][2] = paras[0][2][0].upper() + paras[0][2][1:]
        # ---- interleave figures (by y) with the paragraph flow ----
        items = []
        for y, x, name in img_items:
            items.append((y, x, 'img', name))
        for y, x, text in paras:
            items.append((y, x, 'txt', text))
        items.sort(key=lambda t: (t[0], t[1]))
        for it in items:
            if it[2] == 'img':
                fn = it[3]
                out.append('<figure class="book-fig"><img loading="lazy" src="assets/pa-images/%s/%s" alt="原书图表"></figure>' % (img_prefix, fn))
            else:
                t = clean(it[3])
                if not t:
                    continue
                out.append('<p>%s</p>' % esc(t))
    return "".join(out)

# --------------------------- assemble ---------------------------
def assemble(only=None):
    all_units = []
    all_trees = []
    for cfg in BOOKS:
        if only and cfg["key"] != only:
            continue
        u, tree = extract_book(cfg)
        all_units.extend(u)
        all_trees.append(tree)
        print("[%s] units=%d" % (cfg["key"], len(u)))

    # ---- emit immutable English source (never overridden; translation input) ----
    # This is the source-of-truth the translator reads, so a corrupted zh.json can
    # never poison the English text. Written BEFORE any zh override is applied.
    en_map = {u["id"]: {"label": u["label"], "html_en": u["html_en"]} for u in all_units}
    with open(EN_JSON, 'w', encoding='utf-8') as f:
        json.dump(en_map, f, ensure_ascii=False, indent=1)

    # apply translation overrides
    zh = {}
    if os.path.exists(ZH_JSON):
        with open(ZH_JSON, encoding='utf-8') as f:
            zh = json.load(f)

    def zh_html(uid, default):
        o = zh.get(uid)
        if o is None:
            return default
        if isinstance(o, dict):
            return o.get('html', default)
        return o

    def zh_label(uid, default):
        o = zh.get(uid)
        if isinstance(o, dict) and 'label' in o:
            return o['label']
        return default

    # override labels + html where provided
    for u in all_units:
        u["label"] = zh_label(u["id"], u["label"])
        u["html_en"] = zh_html(u["id"], u["html_en"])

    body_blocks = [u["html_en"] for u in all_units]

    js = "// AUTO-GENERATED from Al Brooks Trading Price Action PDFs. Do not edit by hand.\n"
    js += "window.PRICE_ACTION_BOOKS_BODY = [\n"
    js += ",\n".join(repr(b) for b in body_blocks)
    js += "\n];\n\n"
    js += "window.PRICE_ACTION_BOOKS_CHAPTERS = " + json.dumps(all_trees, ensure_ascii=False, indent=1) + ";\n"
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write(js)
    with open(UNITS_JSON, 'w', encoding='utf-8') as f:
        json.dump([{"id": u["id"], "type": u["type"], "book": u["book"],
                    "label": u["label"], "parent": u.get("parent"),
                    "html_en": u["html_en"]} for u in all_units],
                  f, ensure_ascii=False, indent=1)
    counts = collections.Counter(u["type"] for u in all_units)
    with open(SRC_JSON, 'w', encoding='utf-8') as f:
        json.dump({"counts": dict(counts), "books": len(all_trees)}, f, ensure_ascii=False, indent=1)
    print("TOTAL units=%d -> %s" % (len(all_units), OUT_JS))
    print("counts:", dict(counts))

if __name__ == '__main__':
    only = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('trends', 'ranges', 'reversals') else None
    assemble(only=only)
