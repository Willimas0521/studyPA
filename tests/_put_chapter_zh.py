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
    'bk2-c41': {
        'heading': '第四十一章 英镑/美元（$6B）货币交叉盘',
        'label': '第四十一章 英镑/美元（$6B）货币交叉盘',
        'tokens': [
            ('p', '交易剖面图：2020 年 6 月 29 日至 7 月 3 日当周。区间背景——区间内部交易；'
                  '外加趋势背景——价格与价值区互动的交易。'),
            ('fig', 0),
            ('p', '在本例中，所使用的操作剖面（operating profile）是前一周成交量所形成的那个剖面。'
                  '正如前面提到的，并不存在哪一种剖面优于另一种，因此由交易者自行选择想要发展的交易风格。'
                  '重要的是：你决定使用的那个剖面必须是完整的，以免在当前价位被修改时产生混淆。'),
            ('p', '在第一个红框处，我们正处在等待入场触发的交易状态。我们位于价值区之内，'
                  '但正在剖面 VPOC 的上方与之互动；因此在那个点位上，既然处于 VPOC 上方，'
                  '我们的偏向应当是倾向于看涨延续。'),
            ('p', '价格走出一个更低的（lower）结构，而潜在的 Spring 位置恰好与操作价位的测试重合。'
                  '从那里产生了第一波向上失衡，导致剖面从其上部被突破。非常直观的是：'
                  '看涨的 Weis 波脱颖而出，标志着突破走势中的高参与度；'
                  '而随后的那根动作则显示出市场对这波走势的兴趣缺缺。'),
            ('p', '就在突破走势结束的那个时点上，使用本方法论所提供工具的交易者，'
                  '必然应当倾向于看涨延续。基本上是因为我们刚刚观察到一个小型吸筹结构成功向上突破，'
                  '这提示我们控制权显然在买方一侧。'),
            ('p', '正如交易清单（checklist）所建议的，我们已经解决了第一点，即：我们想要做什么——'
                  '是买还是卖。在本例中，正如刚刚所论证的，我们希望倾向于买入。'
                  '现在我们需要回答清单的第二点，即：我们想要在哪里买入。'
                  '我们需要识别出那个准备等待价格到来的价位。在这个示例中，'
                  '我们有一个非常重要的共振区：被突破的那条周线剖面的价值区高点（Value Area High）、'
                  '周线 VWAP（绿线），以及前一个吸筹结构的上沿（Creek，小溪）。'),
            ('p', '清单第二点的确认立刻把我们引向第三点，也就是情景设定。在本例中，'
                  '既然我们已经在交易价位上占优，我们只需等待价格走出一波单独的行情，'
                  '使其进入我们的交易区。'),
            ('fig', 1),
            ('p', '一旦价格抵达那里，我们最后还需要等待入场触发的形成，这属于清单的第四步。'
                  '在这个示例中，我们用足迹图来可视化订单流，它让我们看到了激进买方的入场——'
                  '体现在这两根正 delta 分别为 685 和 793 的 K 线上，'
                  '并且它们还在 ASK 列留下了失衡。至此我们的清单已经全部完成，'
                  '可以准备下单入场了。'),
            ('p', '推荐的仓位管理是：在看涨 K 线的突破处挂一个买入止损单（buy stop），'
                  '止损放在看跌 K 线的最低点。回到上一张图表，我们需要识别出一个适合获利了结的、'
                  '有意思的价位；或者退一步说，识别出一个构成清晰流动性区域的前高。'
                  '在本例中，再往左侧我们会识别出一个尚未被测试过的旧 VPOC'
                  '（naked VPOC，裸露 VPOC）。'),
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
        old_lbl = None
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
