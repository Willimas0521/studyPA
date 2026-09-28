#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""给 bk2-c36（第三十六章 背景分析）插入一张 inline SVG 思维导图。

放在导言段之后、原书第一张插图之前 —— 作为整章的「路线图」。
SVG 用 class 引 CSS 变量（assets/style.css 的 .mind-fig 规则），明暗主题自动变色，
且不引入任何图片资源。整条 SVG 不带换行，避免 repr 里出现大量 \\n。
"""
import re, ast, io

ROOT = r'C:\Users\Administrator\WorkBuddy\2026-09-22-01-32-25\studyPA'
JS = ROOT + r'\data\wyckoff_book2.js'
CID = 'bk2-c36'


def lines(x, first, lh, items, cls=None, size=13):
    out = []
    for i, s in enumerate(items):
        c = ' class="%s"' % cls if cls else ''
        out.append('<text%s x="%d" y="%d" font-size="%s">%s</text>'
                   % (c, x, first + i * lh, size, s))
    return ''.join(out)


def box(cls, x, y, w, h, rx):
    return '<rect class="%s" x="%d" y="%d" width="%d" height="%d" rx="%d"/>' % (cls, x, y, w, h, rx)


def center_box(x, w, top, pair):
    """三个居中文本：标题 / 英文 / 副注"""
    cx = x + w / 2
    out = ['<text x="%d" y="%d" font-size="18" font-weight="600" text-anchor="middle">%s</text>'
           % (cx, top + 44, pair[0]),
           '<text class="m-en" x="%d" y="%d" font-size="11" text-anchor="middle">%s</text>'
           % (cx, top + 65, pair[1]),
           '<text class="m-dim" x="%d" y="%d" font-size="12" text-anchor="middle">%s</text>'
           % (cx, top + 86, pair[2])]
    return ''.join(out)


def lvl2(x, w, top, trio):
    cx = x + w / 2
    return ''.join([
        '<text x="%d" y="%d" font-size="15" font-weight="600" text-anchor="middle">%s</text>' % (cx, top + 32, trio[0]),
        '<text class="m-en" x="%d" y="%d" font-size="11" text-anchor="middle">%s</text>' % (cx, top + 56, trio[1]),
        '<text class="m-dim" x="%d" y="%d" font-size="12" text-anchor="middle">%s</text>' % (cx, top + 78, trio[2]),
    ])


def build_svg():
    p = []
    p.append('<figure class="mind-fig">')
    p.append('<svg viewBox="0 0 1180 620" role="img" aria-label="背景分析思维导图">')
    p.append('<defs><marker id="bk2mmArrow" viewBox="0 0 10 10" refX="9" refY="5" '
             'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
             '<path d="M0,0 L10,5 L0,10 z" class="m-tip"/></marker></defs>')

    # ---- 连线（root→一级 用强调色，其余用普通色）----
    conns_a = [
        'M166,310 C 202,310 208,150 240,150',
        'M166,310 C 202,310 208,470 240,470',
    ]
    for d in conns_a:
        p.append('<path class="m-line-a" marker-end="url(#bk2mmArrow)" d="%s"/>' % d)
    conns = [
        'M420,150 C 456,150 462,80 494,80',
        'M420,150 C 456,150 462,220 494,220',
        'M420,470 C 456,470 462,400 494,400',
        'M420,470 C 456,470 462,540 494,540',
        'M674,80 H742', 'M674,220 H742', 'M674,400 H742', 'M674,540 H742',
    ]
    for d in conns:
        p.append('<path class="m-line" marker-end="url(#bk2mmArrow)" d="%s"/>' % d)

    # ---- 叶子卡片（先画底，再画左侧色条）----
    for top in (20, 160, 340, 480):
        p.append(box('m-leaf', 748, top, 416, 120, 10))
        p.append(box('m-box-a', 748, top, 4, 120, 2))

    # ---- 各级节点框 ----
    p.append(box('m-box-a', 16, 262, 150, 96, 11))
    p.append(box('m-box-2', 240, 100, 180, 100, 11))
    p.append(box('m-box-2', 240, 420, 180, 100, 11))
    for top in (30, 170, 350, 490):
        p.append(box('m-box', 494, top, 180, 100, 9))

    # ---- root 文本 ----
    p.append('<text class="m-acc" x="91" y="303" font-size="19" font-weight="600" '
             'text-anchor="middle">背景分析</text>')
    p.append('<text class="m-en" x="91" y="324" font-size="11.5" '
             'text-anchor="middle">Context Analysis</text>')
    p.append('<text class="m-dim" x="91" y="345" font-size="12" '
             'text-anchor="middle">先回答：平衡 还是 失衡？</text>')

    # ---- 一级 ----
    p.append(center_box(240, 180, 100, ('区间背景', 'Trading Range Context', '买卖双方势均力敌')))
    p.append(center_box(240, 180, 420, ('趋势背景', 'Trend Context', '一方掌控 · 失衡形成')))

    # ---- 二级 ----
    p.append(lvl2(494, 180, 30, ('① 在极值处交易', 'fade the extremes', '低买 / 高卖')))
    p.append(lvl2(494, 180, 170, ('② 在区间内部交易', 'inside the range', '需足够可用轨迹')))
    p.append(lvl2(494, 180, 350, ('③ 与价值区互动', 'interacting with VA', '突破真假判定')))
    p.append(lvl2(494, 180, 490, ('④ 远离价值区', 'away from the value zone', '顺趋势回调入场')))

    # ---- 叶子要点 ----
    p.append(lines(766, 48, 20, [
        '反转交易：低买 / 高卖',
        'Wyckoff：阶段 C 的震仓（shakeout）',
        '下沿找 Spring / 上沿找 Upthrust',
        '剖面：VAH 上方转空、VAL 下方转多',
        '改编 80% 规则 → 概率指向相反极值',
    ]))
    p.append(lines(766, 188, 20, [
        '前提是：可用轨迹足够（风险回报比）',
        '最后的 HVN 决定短期方向偏向',
        '价格在其上方 = 吸筹 → 偏多',
        '价格在其下方 = 派发 → 偏空',
        '抵达均衡区极值时须先管理仓位',
    ]))
    p.append(lines(766, 374, 21, [
        '先评估：有效突破 还是 冲击（shock）？',
        '等待被破结构 / 交易水平的确认测试',
        'Wyckoff：阶段 D 的突破测试入场',
        '剖面：延续交易，回测同一价值区',
    ]))
    p.append(lines(766, 506, 21, [
        '顺势交易，等修正回调后加入',
        '三痕迹：震仓 → 突破处的量价表现',
        '→ 不再重回区间 + VPOC 迁移确认',
        '入场锚点：最后的 HVN、周线 VWAP',
        'HVN 被突破前，不提出逆势情景',
    ]))

    p.append('</svg>')
    p.append('<figcaption>思维导图：判定市场处于「平衡（区间）」还是「失衡（趋势）」，'
             '再落到四种交易位置 ① ② ③ ④ —— 与原书插图中的编号一一对应。</figcaption>')
    p.append('</figure>')
    return ''.join(p)


def main():
    txt = io.open(JS, encoding='utf-8').read()
    m = re.search(r'window\.WYCKOFF_BOOK2_BODY = \[(.*?)\]\s*;\s*\n\s*window\.WYCKOFF_BOOK2_CHAPTERS',
                  txt, re.S)
    body = ast.literal_eval('[' + m.group(1) + ']')
    idx, old = None, None
    for i, b in enumerate(body):
        if re.search(r'<h3[^>]*id="%s"' % CID, b):
            idx, old = i, b
            break
    if idx is None:
        raise SystemExit('chapter %s not found' % CID)
    if 'mind-fig' in old:
        print('already has mind map, skip')
        return

    # 插到「导言第一段的结尾」之后
    m2 = re.search(r'</p>', old)
    if not m2:
        raise SystemExit('no paragraph found')
    new = old[:m2.end()] + build_svg() + old[m2.end():]

    old_repr = repr(old)
    if old_repr not in txt:
        raise SystemExit('exact repr not found')
    txt = txt.replace(old_repr, repr(new), 1)
    io.open(JS, 'w', encoding='utf-8').write(txt)
    print('%s: mind map inserted (%d -> %d chars)' % (CID, len(old), len(new)))


if __name__ == '__main__':
    main()
