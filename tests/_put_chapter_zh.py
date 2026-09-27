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
    'bk2-c44': {
        'heading': '第四十四章 英镑/美元（$6B）货币交叉盘',
        'label': '第四十四章 英镑/美元（$6B）货币交叉盘',
        'tokens': [
            ('p', '2020 年 8 月 3 日。趋势背景——价格与价值区互动的交易。'),
            ('fig', 0),
            ('p', '一个日内交易的示例：倾向于更短周期的背景，'
                  '本例中使用前一交易日的剖面作为交易剖面。'),
            ('p', '我们把前几个交易日的剖面当作框架来支撑交易，'
                  '这一事实并不意味着威科夫方法论的原则被搁置一旁。'
                  '正如我们所看到的，本质上是一样的；唯一的区别在于所使用的周期。'),
            ('p', '任何有一定经验的威科夫交易者，都能在该剖面中识别出一个结构，'
                  '并标注出方法论教给我们的所有事件。而且，当被指出'
                  '「在哪里寻找入场触发」时，最敏锐的分析师早就已经能够识别出一个新的结构了。'
                  '重要的正是这个——背景，以及基于价格的行为，你将倾向于做什么（买还是卖）。'),
            ('p', '在本例中，既然我们看到自己是从一个派发结构走过来的，'
                  '那么起初我们将倾向于做空。下一步是确定：'
                  '我们要在哪个点位等待价格，进而去寻找触发。'
                  '这里第一个有意思的区域，就是该剖面的价值区低点（Value Area Low）。'),
            ('p', '在当日行情中，市场开始横向整理，在这一区域创造出新的价值。'
                  '这是对前一个派发结构的接受信号，'
                  '因此我们可以再增加一条支持看跌情景的依据。'),
            ('p', '一旦价格进入我们设定的交易区，就会出现一个重要的事件共振：'
                  '一方面，我们正在对那个被跌破的旧价值区展开测试；'
                  '另一方面，这波走势也可能是正在形成的这个新结构的一次洗盘（shakeout）。'),
            ('p', '此时正是去分析订单流图的最好时机，看看 K 线内部正在发生什么，'
                  '以及在更短周期上我们的入场触发是否得到确认。'),
            ('fig', 1),
            ('p', '而就在那个位置上，我们看到的是这样一幕：'
                  '一次带着大量卖压攻击性的看跌转折。'
                  '在最后那根看涨 K 线上，我们已经可以推测出某种买盘被接管（takeover）的迹象——'
                  '证据是高成交量、ASK 列中发生的大量成交，'
                  '以及上影线所反映出的看涨未能延续。'),
            ('p', '紧随其后，主要由巨大的负 delta 所证明的大规模卖方参与，'
                  '暗示着一次卖出主动性（initiative），以及看跌失衡的可能开端。'
                  '下一根看跌 K 线则可作为卖方掌控的确定性确认：宽幅 K 线、'
                  '成交量可观、收在最低点——这正是威科夫方法论中所说的 '
                  'SOW bar（Sign of Weakness Bar，弱势信号 K 线）。'),
            ('p', '这些示例非常有启发性，让我们看到同一个动作'
                  '（本例中即看跌转折）在图表上可以有无穷多种呈现方式。'
                  '有时接管过程和主动性过程都会非常清晰，而有时则不然。'
                  '既然我们正处在某个特定的交易区，并且有背景的支持，'
                  '那么更值得优先考虑的，是出现有利于我们所预期方向的「主动性」，'
                  '而不是执着于看到前面的「接管」过程——'
                  '正如我们所见，后者并不总是以最典型的方式出现。'),
            ('p', '与接管过程不同，主动性（对于决定分析订单流的交易者而言）'
                  '是一项不可或缺的动作，因为归根结底，'
                  '我们就是在等待那些投机者出现，来最终打破控制权。'),
            ('p', '最后，这笔交易中可能的获利位（Take Profit）'
                  '会落在那个曾经的 VPOC 价位上；就其本质而言，'
                  '即便在短周期内，它也代表着一个高成交区。'),
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
