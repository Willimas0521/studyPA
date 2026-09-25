#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Generate data/wyckoff_book2.js (and a structured source JSON) from the
Wyckoff 2.0 PDF.

Pipeline:
  1. extract text per page with font sizes + images (positions via get_image_info)
  2. classify blocks by font size + numbering into part / section / sub / body
  3. build an ordered `flow`: translatable units (part, section) each accumulate
     their own paragraphs, h4 sub-headings and <figure>s; preamble/back matter stays raw
  4. emit:
       assets/book2-images/bk2-img-NNN.{ext}   illustrations
       data/wyckoff_book2_source.json          structured English, ids for ZH injection
       data/wyckoff_book2.js                    window.WYCKOFF_BOOK2_BODY + WYCKOFF_BOOK2_CHAPTERS

Translation: populate data/wyckoff_book2_zh.json as {unit_id: zh_html} (typically the
5 core parts), then re-run. Until then the English source is emitted.
"""
import fitz, glob, re, os, json, html, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "book2-images")
OUT_JS = os.path.join(ROOT, "data", "wyckoff_book2.js")
SRC_JSON = os.path.join(ROOT, "data", "wyckoff_book2_source.json")
ZH_JSON = os.path.join(ROOT, "data", "wyckoff_book2_zh.json")
UNITS_JSON = os.path.join(ROOT, "data", "wyckoff_book2_units.json")
PDF = glob.glob(r"C:/Users/Administrator/Downloads/*Wyckoff 2.0*.pdf")[0]

PART_RE = re.compile(r'^\s*PART\s+(\d+)\.?\s*(.*)$', re.I)
SEC_RE  = re.compile(r'^\s*(\d{1,2})\.(\d{1,2})\s+([A-Z].*)$')
SUB_RE  = re.compile(r'^\s*(\d{1,2})\.(\d{1,2})\.(\d{1,2})(?:[.\w-]*)\s+([A-Z].*)$')
LIST_RE = re.compile(r'^\s*([•·\-\u2013\u2014\*]|\d+[.)]|[a-z][.)]|\(?\d+\))\s+')

LIG = {'\ufb00':'ff','\ufb01':'fi','\ufb02':'fl','\ufb03':'ffi','\ufb04':'ffl',
       '\ufb05':'ft','\ufb06':'st','\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"',
       '\u2013':'-','\u2014':'-','\u2026':'...'}

def clean(text):
    for k,v in LIG.items(): text = text.replace(k,v)
    text = re.sub(r'-\n(?=[a-z])', '', text)        # de-hyphenate line breaks
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = re.sub(r'\n{2,}', '\n', text)
    return text.strip()

def esc(t): return html.escape(t, quote=False)

# ----------------------------- extraction -----------------------------
def extract(limit=None):
    doc = fitz.open(PDF)
    n = doc.page_count
    if limit: n = min(n, limit)
    os.makedirs(IMG_DIR, exist_ok=True)
    xref_name = {}
    img_counter = 0
    for pno in range(doc.page_count):
        for im in doc[pno].get_images(full=True):
            xr = im[0]
            if xr in xref_name: continue
            try: img = doc.extract_image(xr)
            except Exception: continue
            ext = (img.get('ext') or 'png').lower()
            if ext not in ('jpg','jpeg','png','gif','webp'): ext = 'png'
            if ext == 'jpeg': ext = 'jpg'
            img_counter += 1
            fn = "bk2-img-%03d.%s" % (img_counter, ext)
            with open(os.path.join(IMG_DIR, fn), 'wb') as f:
                f.write(img['image'])
            xref_name[xr] = fn
    print("extracted %d unique images" % img_counter)
    pages_items = []
    for pno in range(n):
        page = doc[pno]; H = page.rect.height
        items = []
        for b in page.get_text("dict")["blocks"]:
            if "lines" not in b: continue
            y0 = b["bbox"][1]
            txt = "".join(s["text"] for l in b["lines"] for s in l["spans"]).strip()
            if not txt: continue
            maxsz = max((s["size"] for l in b["lines"] for s in l["spans"]), default=0)
            bold = any(s["flags"] & 16 for l in b["lines"] for s in l["spans"])
            items.append((y0, 0, 'text', (txt, maxsz, bold)))
        for im in page.get_images(full=True):
            xr = im[0]
            try: bbox = page.get_image_bbox(im)
            except Exception: continue
            items.append((bbox[1], bbox[0], 'img', xref_name.get(xr)))
        items.sort(key=lambda t:(t[0], t[1]))
        pages_items.append((H, items))
    doc.close()
    return pages_items

# ----------------------------- classify -----------------------------
def starts_heading(txt):
    return bool(PART_RE.match(txt) or SEC_RE.match(txt) or SUB_RE.match(txt))

def classify(txt, maxsz, bold):
    # numbering pattern + heading font size: TOC listings are body-size (15) and
    # must NOT be treated as headings, so require a heading size.
    if PART_RE.match(txt) and maxsz >= 23: return 'part'
    if SUB_RE.match(txt) and maxsz >= 15.5: return 'sub'
    if SEC_RE.match(txt) and maxsz >= 16: return 'sec'
    if maxsz >= 25: return 'top'          # Preface / Bibliography / etc (unnumbered h2)
    return 'body'

# ----------------------------- build flow -----------------------------
def build_flow(pages_items):
    flow = []          # ordered entries: {'u': unit} or {'raw': html}
    units = []         # translatable units (part/section) in order
    back = []          # raw html (back matter, English)
    ROOT = "Wyckoff 2.0 · 原著（二）"
    # The book root is a real unit so it has a non-empty slice buffer:
    # front matter (Preface, etc.) is folded into it as h3 content.
    current = {"id": "bk2-book", "type": "root", "label": ROOT,
               "html_en": '<h2 id="bk2-book">%s</h2>' % ROOT}
    cur_part_id = None
    in_back = False
    seen_head = set()
    unit_count = {'part':0, 'section':0, 'sub':0}

    def flush():
        nonlocal current
        if current is not None:
            flow.append({'u': current}); units.append(current); current = None

    def target_raw():
        return back

    def is_head_sz(sz, ref):  # is this block heading-sized relative to ref heading
        return sz >= 15.5 and (ref*0.8) <= sz <= (ref*1.2)

    for pno, (H, items) in enumerate(pages_items):
        if pno < 3:            # cover / title / copyright
            continue
        page_has_content = any(it[2]=='text' and it[3][0].strip().upper()=='CONTENT' for it in items)
        listing = sum(1 for it in items if it[2]=='text' and re.match(r'^\s*\d+\.\d+', it[3][0]))
        skip = page_has_content or listing >= 5   # skip TOC / index pages
        list_open = False
        def close_list():
            nonlocal list_open
            if list_open:
                if current is not None: current['html_en'] += '</ul>'
                else: target_raw().append('</ul>')
                list_open = False
        i = 0
        while i < len(items):
            it = items[i]
            if it[2] == 'img':
                fn = it[3]
                if fn:
                    fig = '<figure class="book-fig"><img loading="lazy" src="assets/book2-images/%s" alt="原书插图"></figure>' % fn
                    if current is not None: current['html_en'] += fig
                    else: target_raw().append(fig)
                i += 1; continue
            txt, maxsz, bold = it[3]; y0 = it[0]
            if (y0 < 70 or y0 > H-60) and maxsz < 20 and len(txt) < 70:
                i += 1; continue
            kind = classify(txt, maxsz, bold)
            norm = txt.strip().upper()
            if kind in ('part','sec','sub','top'):
                if norm in seen_head:
                    i += 1; continue
                seen_head.add(norm)
            if skip:
                if kind == 'top' and norm == 'CONTENT':
                    i += 1; continue
                if kind == 'body':
                    i += 1; continue
            # merge consecutive heading-sized blocks (wrapped titles)
            head_text = txt
            head_sz = maxsz
            j = i + 1
            while j < len(items):
                if items[j][2] != 'text': break
                jt, jsz, _ = items[j][3]
                if not is_head_sz(jsz, head_sz): break
                if len(jt) > 90: break
                if starts_heading(jt): break
                head_text += ' ' + jt
                j += 1
            # re-classify merged text
            mkind = classify(head_text, head_sz, bold)
            if mkind in ('part','sec','sub','top') and head_text.strip().upper() in seen_head and head_text.strip().upper()!=norm:
                i = j; continue
            if mkind == 'part':
                flush()
                unit_count['part'] += 1
                cur_part_id = "bk2-p%d" % unit_count['part']
                label = clean(head_text)
                current = {"id": cur_part_id, "type":"part", "label": label,
                           "html_en": '<h2 id="%s">%s</h2>' % (cur_part_id, esc(label))}
            elif mkind == 'top':
                label = clean(head_text)
                if norm in ('BIBLIOGRAPHY','ACKNOWLEDGEMENTS','ABOUT THE AUTHOR','BOOKS BY THIS AUTHOR'):
                    flush(); current = None; in_back = True
                    back.append('<h2>%s</h2>' % esc(label))
                else:
                    # front matter (Preface etc.): fold into the book root as h3 so
                    # the root's slice buffer is non-empty (an id-less <h2> would
                    # reset cur and drop everything that follows).
                    if current is not None:
                        current['html_en'] += '<h3>%s</h3>' % esc(label)
                    else:
                        back.append('<h3>%s</h3>' % esc(label))
            elif mkind == 'sec':
                flush()
                unit_count['section'] += 1
                sid = "bk2-c%d" % unit_count['section']
                label = clean(head_text)
                current = {"id": sid, "type":"section", "parent": cur_part_id, "label": label,
                           "html_en": '<h3 id="%s">%s</h3>' % (sid, esc(label))}
            elif mkind == 'sub':
                unit_count['sub'] += 1
                h = '<h4>%s</h4>' % esc(clean(head_text))
                if current is not None: current['html_en'] += h
                else: target_raw().append(h)
            else:  # body
                t = clean(txt)
                if not t:
                    i = j; continue
                if LIST_RE.match(txt):
                    if current is not None:
                        if not list_open: current['html_en'] += '<ul>'
                        current['html_en'] += '<li>%s</li>' % esc(t)
                    else:
                        if not list_open: target_raw().append('<ul>')
                        target_raw().append('<li>%s</li>' % esc(t))
                    list_open = True
                else:
                    close_list()
                    if current is not None: current['html_en'] += '<p>%s</p>' % esc(t)
                    else: target_raw().append('<p>%s</p>' % esc(t))
            i = j
        close_list()
    flush()

    if back: flow.append({'raw': "".join(back)})
    return flow, units, unit_count

# ----------------------------- assemble -----------------------------
def assemble(limit=None):
    pages_items = extract(limit)
    flow, units, unit_count = build_flow(pages_items)

    zh = {}
    if os.path.exists(ZH_JSON):
        with open(ZH_JSON, encoding='utf-8') as f: zh = json.load(f)

    # override may be a plain string (html) or {"html":..., "label":...}
    def zh_html(uid, default):
        o = zh.get(uid)
        if o is None: return default
        if isinstance(o, dict): return o.get('html', default)
        return o
    def zh_label(uid, default):
        o = zh.get(uid)
        if isinstance(o, dict) and 'label' in o: return o['label']
        return default

    body_blocks = []
    for e in flow:
        if 'u' in e:
            u = e['u']
            body_blocks.append(zh_html(u['id'], u['html_en']))
        else:
            body_blocks.append(e['raw'])

    # nested chapters: part -> its sections.
    # Emit the SAME FLAT shape as book 1: [book-root, part1{kids:sections}, ...]
    # so buildChapIndex()'s one-level loop captures every section id.
    sec_by_parent = collections.OrderedDict()
    for u in units:
        if u['type'] == 'section':
            sec_by_parent.setdefault(u['parent'], []).append(u)
    chapters = [{"id": "bk2-book", "label": "Wyckoff 2.0 · 原著（二）", "kids": []}]
    for u in units:
        if u['type'] == 'part':
            kids = [{"id": s['id'], "label": zh_label(s['id'], s['label'])} for s in sec_by_parent.get(u['id'], [])]
            chapters.append({"id": u['id'], "label": zh_label(u['id'], u['label']), "kids": kids})

    js = "// AUTO-GENERATED from Wyckoff 2.0 PDF. Do not edit by hand.\n"
    js += "window.WYCKOFF_BOOK2_BODY = [\n"
    js += ",\n".join(repr(b) for b in body_blocks)
    js += "\n];\n\n"
    js += "window.WYCKOFF_BOOK2_CHAPTERS = " + json.dumps(chapters, ensure_ascii=False, indent=1) + ";\n"
    with open(OUT_JS, 'w', encoding='utf-8') as f: f.write(js)
    with open(SRC_JSON, 'w', encoding='utf-8') as f:
        json.dump({"units": units, "parts": unit_count['part'],
                   "sections": unit_count['section'], "subs": unit_count['sub']},
                  f, ensure_ascii=False, indent=1)
    # per-unit source dump for translation (full html_en incl. figures)
    with open(UNITS_JSON, 'w', encoding='utf-8') as f:
        json.dump([{"id": u['id'], "type": u['type'], "label": u['label'],
                    "parent": u.get('parent'), "html_en": u['html_en']} for u in units],
                  f, ensure_ascii=False, indent=1)
    print("parts=%d sections=%d sub=%d -> %s" % (unit_count['part'], unit_count['section'], unit_count['sub'], OUT_JS))

if __name__ == '__main__':
    lim = int(sys.argv[1]) if len(sys.argv)>1 and sys.argv[1].isdigit() else None
    assemble(limit=lim)
