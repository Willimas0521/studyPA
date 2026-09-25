"""Diagnostic: inspect PDF heading structure & font sizes before writing the real generator."""
import fitz, glob, re, collections, sys

PATH = glob.glob(r"C:/Users/Administrator/Downloads/*Wyckoff 2.0*.pdf")[0]
doc = fitz.open(PATH)

PART_RE = re.compile(r'^\s*PART\s+(\d+)\.?\s*(.*)$', re.I)
SEC_RE  = re.compile(r'^\s*(\d{1,2})\.(\d{1,2})\s+([A-Z].*)$')
SUB_RE  = re.compile(r'^\s*(\d{1,2})\.(\d{1,2})\.(\d{1,2})\s+([A-Z].*)$')

# font size stats
sizes = collections.Counter()
for p in doc:
    for b in p.get_text("dict")["blocks"]:
        if "lines" not in b: continue
        for l in b["lines"]:
            for s in l["spans"]:
                sizes[round(s["size"],1)] += 1
body_size = sizes.most_common(1)[0][0]
print("body (modal) font size:", body_size)
print("top sizes:", sizes.most_common(8))

parts=[]; secs=[]; subs=[]; unmatched_big=[]
footer_candidates = collections.Counter()
for pno in range(doc.page_count):
    page = doc[pno]
    d = page.get_text("dict")
    for b in d["blocks"]:
        if "lines" not in b: continue
        # join block text
        txt = "".join(s["text"] for l in b["lines"] for s in l["spans"]).strip()
        if not txt: continue
        # footer/header heuristic: short text repeated near top/bottom margins
        y0 = b["bbox"][1]
        if y0 < 60 or y0 > page.rect.height-60:
            if len(txt) < 60:
                footer_candidates[txt]+=1
        # bold?
        bold = any(s["flags"] & 16 for l in b["lines"] for s in l["spans"])
        maxsz = max((s["size"] for l in b["lines"] for s in l["spans"]), default=0)
        m = PART_RE.match(txt); 
        if m: parts.append((pno, txt[:80])); continue
        m = SUB_RE.match(txt)
        if m: subs.append((pno, txt[:70])); continue
        m = SEC_RE.match(txt)
        if m: secs.append((pno, txt[:70])); continue
        # unmatched but looks like a heading: big & bold & short
        if maxsz >= body_size*1.25 and bold and len(txt) < 70:
            unmatched_big.append((pno, round(maxsz,1), txt[:70]))

print(f"\nPART matches: {len(parts)}")
for x in parts[:12]: print("   ", x)
print(f"\nSEC (X.Y) matches: {len(secs)}")
for x in secs[:15]: print("   ", x)
print(f"\nSUB (X.Y.Z) matches: {len(subs)}")
for x in subs[:10]: print("   ", x)
print(f"\nUNMATCHED big/bold headings (sample 20): {len(unmatched_big)}")
for x in unmatched_big[:20]: print("   ", x)
print("\nTOP repeated short texts (possible footers/headers):")
for t,c in footer_candidates.most_common(10):
    if c>20: print(f"   [{c}] {t[:50]!r}")
