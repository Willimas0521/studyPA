# -*- coding: utf-8 -*-
# 从《The Wyckoff Methodology in Depth》(Rubén Villahermosa Chaves, 2019) 中文译本提取
# 生成 data/wyckoff_book.js：
#   - 按 Part(h2) -> Chapter(h3) -> Section(h4) 分层
#   - 27 章各自带 bk-cN id，并嵌套进所属 Part 的 kids（用于独立章节页 + 细纲嵌套）
#   - 提取 DOCX 全部插图到 assets/book-images/，用 <figure><img> 替换「原书配图略」占位
#   - 术语已归一化
import docx, re, json, os
from docx import Document
from docx.oxml.ns import qn

SRC = r"C:/Users/Administrator/Downloads/The Wyckoff Methodology in Depth How to Trade Financial Markets Logically (Rubén Villahermosa Chaves)2019 (z-library.sk, 1lib.sk, z-lib.sk)_translated.docx"
OUT = r"C:/Users/Administrator/WorkBuddy/2026-09-22-01-32-25/studyPA/data/wyckoff_book.js"
IMG_DIR = r"C:/Users/Administrator/WorkBuddy/2026-09-22-01-32-25/studyPA/assets/book-images"

doc = Document(SRC)

# ---------------- 插图提取 ----------------
EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
       'image/bmp': 'bmp', 'image/svg+xml': 'svg'}
if os.path.isdir(IMG_DIR):
    for f in os.listdir(IMG_DIR):
        try:
            os.remove(os.path.join(IMG_DIR, f))
        except OSError:
            pass
os.makedirs(IMG_DIR, exist_ok=True)

img_counter = [0]
seen_rId = {}

def para_images(par):
    res = []
    for blip in par._p.findall('.//' + qn('a:blip')):
        rId = blip.get(qn('r:embed'))
        if not rId:
            continue
        if rId in seen_rId:
            res.append(seen_rId[rId])
            continue
        try:
            rel = par.part.related_parts[rId]
        except Exception:
            continue
        ct = rel.content_type
        if ct not in EXT:
            continue
        img_counter[0] += 1
        fn = 'bk-img-%03d.%s' % (img_counter[0], EXT[ct])
        with open(os.path.join(IMG_DIR, fn), 'wb') as fh:
            fh.write(rel.blob)
        seen_rId[rId] = fn
        res.append(fn)
    return res

def fig_html(fns):
    if not fns:
        return ''
    parts = []
    for fn in fns:
        parts.append('<figure class="book-fig"><img loading="lazy" '
                     'src="assets/book-images/%s" alt="原书插图"></figure>' % fn)
    return ''.join(parts)

# ---------------- 文本工具 ----------------
def runs_info(par):
    bold = False
    maxsz = 0.0
    for r in par.runs:
        if r.bold:
            bold = True
        if r.font.size:
            maxsz = max(maxsz, r.font.size.pt)
    return bold, maxsz

CN_NUM = {'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100}
def cn_to_int(s):
    if s.isdigit():
        return int(s)
    if s == '十': return 10
    if '百' in s:
        return None
    if s.startswith('十'):
        s = '一'+s
    if s.endswith('十'):
        s = s+'零'
    total = 0; cur = 0
    for ch in s:
        if ch == '十':
            cur = 10 if cur == 0 else cur*10
            total += cur; cur = 0
        elif ch in CN_NUM:
            cur = CN_NUM[ch]
        else:
            return None
    total += cur
    return total

PART_RE = re.compile(r'^第\s*([一二三四五六七八九十百零\d]+)\s*部分')
CHAP_RE = re.compile(r'第\s*([一二三四五六七八九十百零\d]+)\s*章')
PART_PREFIX_RE = re.compile(r'^第\s*[\d零一二三四五六七八九十百]+\s*部分\s*[——\-]+\s*')

NORM = [
    ('销售 Climax', '抛售高潮（Selling Climax）'),
    ('购买 CLIMAX', '买入高潮（Buying Climax）'),
    ('购 买 《 Climax》', '买入高潮（Buying Climax）'),
    ('购买 Climax', '买入高潮（Buying Climax）'),
    ('购买高潮', '买入高潮（Buying Climax）'),
    ('销售高潮', '抛售高潮（Selling Climax）'),
    ('衰竭的销售高潮', '抛售高潮（Selling Climax）'),
    ('衰竭的购买高潮', '买入高潮（Buying Climax）'),
    ('自动拉力赛', '自动反弹（Automatic Rally）'),
    ('自动跟车', '自动反弹'),
    ('自动反应', '自动反弹（Automatic Rally）'),
    ('上冲程', '上冲'),
    ('上冲', '上冲（Upthrust）'),
    ('春季效应', '弹簧效应（Spring）'),
    ('春季', '弹簧（Spring）'),
    ('震撼', '震仓（Shakeout）'),
    ('突围', '突破（Breakout）'),
    ('脆弱迹象', '弱势信号（SOW）'),
    ('虚弱迹象', '弱势信号（SOW）'),
    ('力量的象征', '强势信号（SOS）'),
    ('最后供应点', '最后供给点（LPSY）'),
    ('初步支持', '初步支撑（PS）'),
    ('初步供应', '初步供给（PSY）'),
    ('初步停止', '初步止跌（Preliminary Stop, PS）'),
    ('次要测试', '二次测试（Secondary Test, ST）'),
    ('次级测试', '二次测试（Secondary Test, ST）'),
    ('二次检测', '二次测试'),
    ('次要检测', '二次测试'),
    ('次要试验', '二次测试'),
    ('通用测试', '常规测试（General Test）'),
    ('累积范围', '吸筹区间'),
    ('累积过程', '吸筹过程'),
    ('积累结构', '吸筹结构'),
    ('基础积累结构', '基础吸筹结构'),
    ('基础分布结构', '基础派发结构'),
    ('再累积', '再吸筹'),
    ('重新积累', '再吸筹（Reaccumulation）'),
    ('再积累', '再吸筹'),
    ('重新分配', '再派发（Redistribution）'),
    ('再分配', '再派发'),
    ('累积', '吸筹'),
    ('积累', '吸筹'),
    ('分配', '派发（Distribution）'),
    ('因果律', '因果律（Cause and Effect）'),
    ('供求定律', '供求定律（Supply and Demand）'),
    ('努力与结果', '努力与结果（Effort vs Result）'),
    ('复合人', '复合人（Composite Man）'),
    ('交易区间', '交易区间（Trading Range）'),
    ('测量移动', '测量移动（Measured Move）'),
    ('点与图形图表', '点数图（Point & Figure）'),
    ('点数图', '点数图（P&F）'),
    ('事 件', '事件'),
    ('事事件', '事件'),
]
EVENT_RE = re.compile(r'事件\s*(?:编号|N\s*\d\s*)?\s*#?\s*(\d+)')
EVENT_RE2 = re.compile(r'事件\s*N\s*(\d)\s*(\d)')
EVENT_RE3 = re.compile(r'(?<!事)件\s*#\s*(\d+)')     # "件 #1" -> "事件 #1"，但不许前面已是「事」

def norm(t):
    t = t.replace(' ', ' ').replace(' ', ' ')
    t = re.sub(r'[ \t]{2,}', ' ', t)
    for a, b in NORM:
        t = t.replace(a, b)
    t = EVENT_RE2.sub(lambda m: '事件 #' + m.group(2), t)
    t = EVENT_RE3.sub(lambda m: '事件 #' + m.group(1), t)
    t = EVENT_RE.sub(lambda m: '事件 #' + m.group(1), t)
    t = re.sub(r'[ \t]{2,}', ' ', t).strip()
    return t

def esc(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

# ---------------- 遍历段落 ----------------
paras = doc.paragraphs
start_idx = None
for i, p in enumerate(paras):
    if p.text.strip().startswith('第一部分'):
        start_idx = i
        break
assert start_idx is not None, "no Part 1 found"

out = []            # 正文 HTML 块
chapters = []       # 嵌套结构：[{id,label}] 书引 + [{id,label,kids:[...]}] 各部分
seq = {'h4': 0}
cur_part = 0
cur_chap = 0
cur_part_obj = None
bullet_buf = []

def flush_bullets():
    global bullet_buf
    if bullet_buf:
        out.append('<ul>')
        for b in bullet_buf:
            out.append('<li>' + b + '</li>')
        out.append('</ul>')
        bullet_buf = []

# 书引
out.append('<h2 id="book">原著逐章精读 · 《威科夫方法的深度解析》</h2>')
out.append('<p class="lede">以下内容逐章整理自 Rubén Villahermosa Chaves 的《The Wyckoff Methodology in Depth》（2019）中文译本，作为本体系「威科夫操盘法」的延伸阅读。原文为机器翻译，术语已尽量统一为站内约定（吸筹 / 派发、弹簧 Spring、强势信号 SOS、弱势信号 SOW、最后支撑点 LPS、震仓 Shakeout、上冲 Upthrust、自动反弹 AR 等），个别表述保留原译。原书插图已按原位置嵌入，相关形态亦可参见本页上方的 TradingView 示意图。</p>')
out.append('<p>全书分为八个部分，逐层展开威科夫方法论：</p>')
out.append('<ul>')
for lbl in ['第一部分 市场如何运行', '第二部分 怀科夫法（方法论结构）', '第三部分 三大基本定律',
            '第四部分 吸筹与派发过程', '第五部分 事件（活动）', '第六部分 阶段',
            '第七部分 交易', '第八部分 案例研究']:
    out.append('<li>' + esc(lbl) + '</li>')
out.append('</ul>')
chapters.append({'id': 'book', 'label': '原著逐章精读'})

PART_LABELS = {
    1: '市场如何运行',
    2: '怀科夫法（方法论结构）',
    3: '三大基本定律',
    4: '积累与分配过程',
    5: '事件（活动）',
    6: '阶段',
    7: '交易',
    8: '案例研究',
}

for i in range(start_idx, len(paras)):
    p = paras[i]
    txt = p.text.strip()
    imgs = para_images(p)
    if not txt:
        if imgs:
            flush_bullets()
            out.append(fig_html(imgs))
        continue
    bold, sz = runs_info(p)
    is_part = bool(PART_RE.match(txt))
    is_chap = bool(CHAP_RE.search(txt))
    t = norm(txt)

    if cur_part >= 1 and re.search(r'该作者的其他著作|参考书目|参考文献|书目|索引|关于作者|版权所有|我们在网络上再见', t):
        break
    if cur_part >= 1 and ('《' in t) and re.search(r'（\d{4}）', t):
        break

    if is_part:
        flush_bullets()
        m = PART_RE.match(txt)
        n = cn_to_int(m.group(1))
        cur_part = n or (cur_part + 1)
        label = re.sub(PART_PREFIX_RE, '', t) or PART_LABELS.get(cur_part, t)
        out.append('<h2 id="bk-p%d">%s</h2>' % (cur_part, esc(t)))
        cur_part_obj = {'id': 'bk-p%d' % cur_part, 'label': label, 'kids': []}
        chapters.append(cur_part_obj)
        continue
    if is_chap:
        flush_bullets()
        m = CHAP_RE.search(txt)
        n = cn_to_int(m.group(1))
        cur_chap = n or (cur_chap + 1)
        out.append('<h3 id="bk-c%d">%s</h3>' % (cur_chap, esc(t)))
        if cur_part_obj is not None:
            cur_part_obj['kids'].append({'id': 'bk-c%d' % cur_chap, 'label': t})
        out.append(fig_html(imgs))
        continue
    if bold and sz >= 16 and len(txt) <= 60 and not t.endswith(('。', '，', '.')):
        flush_bullets()
        seq['h4'] += 1
        out.append('<h4 id="bk-h%d">%s</h4>' % (seq['h4'], esc(t)))
        out.append(fig_html(imgs))
        continue
    if t.startswith('●') or t.startswith('•') or t.startswith('· '):
        bullet_buf.append(esc(t.lstrip('●•· ')))
        continue
    flush_bullets()
    out.append('<p>' + esc(t) + '</p>')
    out.append(fig_html(imgs))

flush_bullets()

# ---------------- 写出 ----------------
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('// 自动生成：从《The Wyckoff Methodology in Depth》(Rubén Villahermosa Chaves, 2019) 中文译本提取\n')
    f.write('// 生成方式：python-docx 解析扁平 DOCX（无标题样式），按字号+加粗+「第X章」模式分层，术语已归一化\n')
    f.write('// 27 章各自带 bk-cN id 并嵌套进所属 Part 的 kids；原书插图已提取到 assets/book-images/\n')
    f.write('window.WYCKOFF_BOOK_BODY = [\n')
    for line in out:
        f.write('  ' + json.dumps(line, ensure_ascii=False) + ',\n')
    f.write('];\n\n')
    f.write('window.WYCKOFF_BOOK_CHAPTERS = ')
    f.write(json.dumps(chapters, ensure_ascii=False, indent=2))
    f.write(';\n')

n_parts = sum(1 for c in chapters if c.get('kids'))
n_chaps = sum(len(c.get('kids', [])) for c in chapters)
print("顶层条目:", len(chapters), "| 含 kids 的 Part:", n_parts, "| 章节总数:", n_chaps)
print("正文块:", len(out), "| 插图文件:", img_counter[0], "| 去重后 rId:", len(seen_rId))
for c in chapters:
    k = len(c.get('kids', []))
    print("  ", c['id'], '|', c['label'], ('(' + str(k) + ' 章)' if k else ''))
