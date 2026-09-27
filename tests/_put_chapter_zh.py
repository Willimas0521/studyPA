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
    'bk2-c42': {
        'heading': '第四十二章 标普500（$ES）指数',
        'label': '第四十二章 标普500（$ES）指数',
        'tokens': [
            ('p', '图表：2020 年 7 月 17 日。区间背景——区间内部交易。看涨反转的开始。'),
            ('fig', 0),
            ('p', '在这张 15 分钟周期图上，价格脱离了前一日的价值区，'
                  '并开始在该区域内发展出一个新的区间。'),
            ('p', '起初，依据看跌延续的交易原则——除非更长周期的背景让我们有别的偏向——'
                  '我们本应倾向于在潜在回踩前一交易日剖面的价值区低点（Value Area Low）时做空入场。'),
            ('p', '然而我们看到的是：价格成功重新回到价值区低点，并且在这样做之前，'
                  '先出现了一次向低点的急速下探（jolt），正是它触发了这波看涨走势。'
                  '从中可以看出，根据价格的行为方式去处理不同情景、并对走势做持续评估，是多么重要。'),
            ('p', '仔细看图：在重新回到价值区之后，价格回撤去测试 VWAP 汇聚的那个区域。'
                  '也许因为该测试略低于 VAL，它并不足以让我们有充分的信心把它当作买入来做；'
                  '但机会随后出现了——价格收复了价值区，并且这一次在区间内部留下了一个测试。'),
            ('p', '在接下来这张更小周期（5 分钟）的图上，我们可以更详细地看到这个动作。'
                  '这里威科夫方法论下的结构更容易辨认。虽然下跌走势的停止并不十分典型，'
                  '但我们看到了一些横盘，以及催生看涨突破的 Spring 及其测试。'
                  '再一次地，Weis 波指标的可视化非常有用，它提示这波走势有机构力量的支持。'
                  '突破之后，我们没有回到区间之内，也就是说接受了这些价位。'),
            ('p', '当我们处在可能形成 BUEC（回到小溪边缘）以引发看涨失衡的局面时，'
                  '我们就已经在等待入场触发的出现，从而可以发出买入订单。'),
            ('fig', 1),
            ('p', '因此，如果有必要的话，此时正该开始观察足迹图，去寻找那个转折形态——'
                  '它提示我们失衡已经偏向于正在开立多头头寸的投机者一方。'),
            ('fig', 2),
            ('p', '这正是图中方框所展示的内容。除了潜在的接管（takeover）肉眼可见之外，'
                  '这根看涨 K 线所体现出的失衡更具意义：它的成交量相对高于平均水平，'
                  '并且 delta 相比之下非常为正。看到这些之后，毫无疑问该发出买入订单了。'),
            ('p', '至于目标位，我们首先会看向价值区的另一端，也就是本例中的价值区高点'
                  '（Value Area High）；在第二张图上可以看到，这个价位还与一个此前的 VPOC 区域相重合。'),
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
