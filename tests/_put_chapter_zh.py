#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""通用「往 book2 里补译某一章」工具。

用法：把本章的译文写进 CHAPTERS_SPEC（按 id 索引），然后直接跑：
    python tests/_put_chapter_zh.py

机制：
  1. ast 取出 WYCKOFF_BOOK2_BODY，按 <h3 id="..."> 定位目标块；
  2. 从旧块里抽出所有 <figure>…</figure>（按出现顺序）；
  3. 按 spec 重建该块：('h3', 中文标题) / ('p', 中文段落) / ('fig', 第N张插图)；
     —— 这样可以自由合并/拆分 PDF 分页造成的段落断裂，同时保证插图不丢；
  4. repr(旧块) → repr(新块) 整块字符串替换（只替换 1 次）；
  5. 再在 WYCKOFF_BOOK2_CHAPTERS 段同步替换该章 label（必须放在第 4 步之后）。
"""
import re, ast, io, sys

ROOT = r'C:\Users\Administrator\WorkBuddy\2026-09-22-01-32-25\studyPA'
JS = ROOT + r'\data\wyckoff_book2.js'

CHAPTERS_SPEC = {
    'bk2-c45': {
        'heading': '第四十五章 欧元/美元（$6E）货币交叉盘',
        'label': '第四十五章 欧元/美元（$6E）货币交叉盘',
        'tokens': [
            ('p', '2020 年 8 月 31 日。区间背景——区间内部交易。失败反转原则。'),
            ('fig', 0),
            ('p', '这类交易通常会带来较大的信心问题，'
                  '因为我们起初是在优先考虑反转情景，随后又要改变偏向。'),
            ('p', '同样以前一日的剖面作为交易依据，我们看到在最后一天，'
                  '价格试图从这个价值区的上部离开，结果遭到拒绝并重新回到区间之内。'
                  '在那个时点上，我们开始依据反转原则来寻找做空入场。'),
            ('p', '失败反转是一个完美的例子，说明为什么应当用交易价位、'
                  '随价格与之互动地去管理仓位。它们是决定性的区域，'
                  '而我们并不知道会发生什么；因此，'
                  '我们唯一能掌控的就是把交易的风险降到最低。'),
            ('p', '如果就在我们所识别的交易区上方，我们看到了足迹图上所呈现的那种反转，'
                  '那么至少可以及时做出两个决定。第一，如果我们持有空单，'
                  '我们会想要平掉仓位、避免触及止损，即使它已经处于盈亏平衡（Breakeven）位置。'
                  '在这种时刻，这类主动管理非常重要，'
                  '因为它能让我们从市场中多拿走几个点，从而进一步降低风险。'
                  '另一方面，如果更长周期的背景配合，'
                  '你可能会想要依托这个失败反转原则去做一笔买入。'),
            ('p', '如果考虑买入，有一个有意思的细节需要考虑。'
                  '由于入场触发位于周线 VWAP 之下，'
                  '用更低的杠杆来做这笔交易可能是个不错的选择，例如在 CFD 市场。'
                  '这是一个完美的例子，说明可以根据我们对这笔交易的把握程度，'
                  '来评估在不同市场交易同一资产的可能性。'
                  '如果我们发现自己处在这样一种局面——'
                  '观察到一些与所设定情景相悖的要素——那么最明智的做法，'
                  '是不要在期货市场这类高杠杆市场中交易；'
                  '相反，应该转向一个提供较低杠杆交易类型的市场，比如 CFD。'),
            ('fig', 1),
            ('p', '进一步延伸这个与不同经纪商和市场打交道的概念：'
                  '重要的是要记住，你并不非得把自己局限在某种特定类型的交易上。'
                  '你可能想在期货市场上对该资产进行更短周期的投机交易；'
                  '这与提出覆盖更长时间跨度的情景、'
                  '并用前述 CFD 来执行这类中期交易并不冲突；'
                  '同样，你也可以用现货股票或交易所交易基金（ETF）'
                  '来进行更长期的交易。'),
            ('p', '这正是该方法论的好处之一——它的普适性。'
                  '由于它的解读建立在市场真正的引擎之上，'
                  '即买方与卖方之间持续的互动，'
                  '因此无论什么资产、什么季节性，它都同样有效；'
                  '唯一的基本要求是，该特定资产需要具备足够的流动性。'),
        ],
    },
}


def build(spec, figs):
    out = ['<h3 id="%s">%s</h3>' % (spec['_id'], spec['heading'])]
    for kind, val in spec['tokens']:
        if kind == 'p':
            out.append('<p>%s</p>' % val)
        elif kind == 'fig':
            if val >= len(figs):
                raise SystemExit('figure index %d out of range (%d figures)' % (val, len(figs)))
            out.append(figs[val])
    return ''.join(out)


def main():
    txt = io.open(JS, encoding='utf-8').read()
    for cid, spec in CHAPTERS_SPEC.items():
        spec['_id'] = cid
        m = re.search(r'window\.WYCKOFF_BOOK2_BODY = \[(.*?)\]\s*;\s*\n\s*window\.WYCKOFF_BOOK2_CHAPTERS',
                      txt, re.S)
        body = ast.literal_eval('[' + m.group(1) + ']')
        idx, old = None, None
        for i, b in enumerate(body):
            if re.search(r'<h3[^>]*id="%s"' % cid, b):
                idx, old = i, b
                break
        if idx is None:
            print('SKIP %s (not found)' % cid)
            continue
        figs = re.findall(r'<figure.*?</figure>', old, re.S)
        new = build(spec, figs)
        old_repr = repr(old)
        if old_repr not in txt:
            raise SystemExit('exact repr of %s block not found' % cid)
        txt = txt.replace(old_repr, repr(new), 1)
        print('%s BODY idx=%d replaced (%d -> %d chars, %d figures kept)'
              % (cid, idx, len(old), len(new), len(figs)))

        # 同步 CHAPTERS label（必须在 BODY 替换之后）
        seg = txt[txt.index('WYCKOFF_BOOK2_CHAPTERS'):]
        mm = re.search(r"id: '%s', label: '([^']*)'" % cid, seg)
        if mm:
            old_lbl = mm.group(1)
            txt = txt.replace("id: '%s', label: '%s'" % (cid, old_lbl),
                              "id: '%s', label: '%s'" % (cid, spec['label']), 1)
            print('  tree label: %r -> %r' % (old_lbl, spec['label']))
        else:
            print('  WARN: no tree label for', cid)

    io.open(JS, 'w', encoding='utf-8').write(txt)
    print('written ->', JS)


if __name__ == '__main__':
    main()
