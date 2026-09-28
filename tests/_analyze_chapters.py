import re, sys

path = 'data/theories.js'
src = open(path, encoding='utf-8').read()

# 只分析 price-action 这一段：从 priceAction 定义到其后闭合
# 简单策略：按 '<h2 id="' 切分，统计每个 h2 段的内部组件
# 但要先定位 price-action body。用 'priceAction' 之后的第一个 'body: [' 起。
# 这里直接对整文件扫描所有 '<h2 id=' 段，用户只看 PA 段即可（id 集合已知）。
PA_IDS = {'origin','candles','states','trend','pressure','always-in','range',
          'breakout','gap','channel','wedge','support-resistance','reversal',
          'entries','concepts','workflow','tools','risk','pitfalls'}

# 切分成 (h2id, body_text) 列表（基于 '<h2 id="' 边界）
parts = re.split(r"(<h2 id=\"([^\"]+)\">)", src)
# parts: [pre, delim, id, delim, id, ...] -> 实际 re.split 捕获组
# 重新组织
chapters = []
i = 1
cur_id = None
buf = ''
# 用 finditer 更稳
for m in re.finditer(r"<h2 id=\"([^\"]+)\">", src):
    if cur_id is not None:
        chapters.append((cur_id, buf))
    cur_id = m.group(1)
    start = m.end()
    # 找到下一个 <h2 id=
    nm = re.search(r"<h2 id=\"", src[start:])
    end = start + nm.start() if nm else len(src)
    buf = src[start:end]
    # 暂存
    chapters.append((cur_id, buf))
# 去重：上面写法会重复，修正：
chapters = []
for m in re.finditer(r"<h2 id=\"([^\"]+)\">", src):
    sid = m.group(1)
    start = m.end()
    nm = re.search(r"<h2 id=\"", src[start:])
    end = start + nm.start() if nm else len(src)
    chapters.append((sid, src[start:end]))

def stat(t):
    h3 = len(re.findall(r"<h3[ >]", t))
    h4 = len(re.findall(r"<h4[ >]", t))
    callout = len(re.findall(r"class=\"callout", t))
    concept = len(re.findall(r"class=\"concept", t))
    svg = len(re.findall(r"<svg", t))
    ul = len(re.findall(r"<ul[ >]", t))
    li = len(re.findall(r"<li[ >]", t))
    table = len(re.findall(r"<table", t))
    return h3, h4, callout, concept, svg, ul, li, table

print(f"{'id':22} {'h3':>3} {'h4':>3} {'cal':>4} {'con':>4} {'svg':>4} {'ul':>3} {'li':>4} {'tbl':>4}")
for cid, body in chapters:
    if cid not in PA_IDS:
        continue
    h3,h4,ca,co,sv,ul,li,tb = stat(body)
    print(f"{cid:22} {h3:3} {h4:3} {ca:4} {co:4} {sv:4} {ul:3} {li:4} {tb:4}")
