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
    'bk2-c43': {
        'heading': '第四十三章 美元/加元（$6C）货币交叉盘',
        'label': '第四十三章 美元/加元（$6C）货币交叉盘',
        'tokens': [
            ('p', '图表：2020 年 7 月 22 日。区间背景——在极值处交易。'),
            ('fig', 0),
            ('p', '价格在前一日的价值区之内开启次日的行情，并在那里开始横向整理，'
                  '这向我们显示出买方与卖方之间处于完全均衡。'
                  '当时正在操作的各方，其估值非常接近，'
                  '这导致了价格围绕中心区持续轮转。'),
            ('p', '在这样的基本背景下，并假设市场继续维持这种均衡状态、'
                  '没有新的信息到来促使参与者改变他们的估值，'
                  '那么我们要遵循的操作原则就是：在极值处寻找回归——'
                  '也就是说，当价格与价值的低端（Value Area Low）互动时寻找买入，'
                  '在高端（Value Area High）时寻找卖出。'),
            ('p', '因此我们已经准备好设定情景。我们知道自己想做什么（买还是卖），'
                  '也知道我们将在哪个确切的位置等待价格去寻找入场触发。'
                  '这意味着我们是带着计划的，而不是被动地、跟着动量追着价格跑。'),
            ('p', '正如你在图上看到的，价格最终去拜访了价值区的底部。'
                  '它做了一次非常精准的测试，并从那里向相反的极值发起。'
                  '这一走势在威科夫方法论的事件中，可以被标注为一个潜在的 Spring，'
                  '因为它正是在震动这两天所形成的小型结构的低点。'),
            ('p', '在那个时刻，把订单流图调出来、以确认（或不确认）我们的买入触发，'
                  '可能会很有用。我们处在正确的位置；同时由于我们知道，'
                  '价格在转向之前可能还会再向下延伸一点，甚至可能继续看跌发展，'
                  '所以我们需要在该区域上方看到激进的买方入场，'
                  '才能判定向上失衡有可能已经开始。'),
            ('fig', 1),
            ('p', '而就在潜在 Spring 所在的位置上，我们看到 ASK 列出现了那种失衡，'
                  '这可能暗示着投机性买盘入场。这就是我们在下单之前一直在寻找的信号。'),
            ('p', '正如我们所看到的，价格随后向相反的极值发起，穿越了整个价值区。'
                  '这是在「80% 市场剖面原则」之下交易的示例。该原则的内容是：'
                  '如果价格试图突破某个价值区但失败、随后又重新进入，'
                  '那么价格有 80% 的概率抵达该价值区的另一端。'
                  '虽然这个策略源自市场剖面（Market Profile），'
                  '但由于两者理论上的相似性，同样的原则也可以用在成交量剖面（Volume Profile）上。'),
            ('p', '因此，本例中的获利了结非常明确：测试该交易剖面的价值区高点。'
                  '如果价格到达这一点，局面会非常有意思，'
                  '因为我们是从一个潜在的 Spring 走过来的；'
                  '众所周知，Spring 正是那个打破结构控制权、使其向上失衡的事件。'
                  '因此，如果我们的分析是对的，那么至少还应该再走出一波上行。'),
            ('p', '那将是我们所推演的路线图；但可以肯定的是，'
                  '这次对 VAH 的测试是我们的第一个管理区。'
                  '在这里你可以决定全部平仓，或者留下部分仓位；'
                  '但我们至少应该做的是保护仓位——也就是把止损移到入场价'
                  '（即所谓的盈亏平衡，Breakeven）。'),
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
