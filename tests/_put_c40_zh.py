#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把 bk2-c40（第四十一章 EURO/DOLLAR ($6E) CURRENCY CROSS）正文翻译成中文。

外科式替换：只替换 BODY 数组里该章那一块，完整保留 <h3 id> 与两个 <figure> 插图；
并同步更新 CHAPTERS 树里该章的 label（标题也一并中文化，与其它章「第X章 中文标题」一致）。
"""
import re, ast, io, sys

ROOT = r'C:\Users\Administrator\WorkBuddy\2026-09-22-01-32-25\studyPA'
JS = ROOT + r'\data\wyckoff_book2.js'

H3 = '<h3 id="bk2-c40">第四十一章 欧元/美元（$6E）货币交叉盘</h3>'
FIG1 = '<figure class="book-fig"><img loading="lazy" src="assets/book2-images/bk2-img-163.jpg" alt="原书插图"></figure>'
FIG2 = '<figure class="book-fig"><img loading="lazy" src="assets/book2-images/bk2-img-164.jpg" alt="原书插图"></figure>'

PARAS = [
    '图表：2020 年 7 月 2 日、3 日和 6 日。区间背景——极端交易；外加趋势背景——价格脱离价值区的交易。',
    '这个案例极具代表性，几乎涵盖了我们学过的全部内容，因为它充满了值得玩味的细节。',
    '首先我们看到下跌走势的停止（SC、AR、ST），由此开启一段新的横盘或均衡背景。'
    'UA 已经通过在 B 阶段测试结构高点，向我们暗示了买入意图。'
    '该结构高点的性质是一个 LVN（低量节点），这在第一天的成交量剖面中体现得很清楚。'
    '这个 LVN 反复充当拒绝区，使价格一再掉头，直到最终被快速穿越。'
    'Spring（弹簧）及其测试启动了看涨失衡，推动市场相对轻松地走高。',
    '深入观察足迹图上这个潜在的 Spring 动作，我们会看到买方主导的转折形态是如何通过 Delta 的反转（-240 到 +183）体现出来的。'
    '在这第一个动作中需要注意的是：这根看跌 K 线并没有展现出我们所建议寻找的那种清晰的潜在接管（takeover）过程；'
    '但这就是市场的现实——理论形态并不总是以同样的方式呈现，而这个案例正好说明了必须给市场留出弹性、随时准备应对任何情况。',
    '除了没有看到这个潜在的接管过程之外，关键在于：在一根宽幅看跌 K 线和高成交量之后，'
    '价格未能延续下跌，而是以同样的攻击性向上反转（努力／结果的背离）。',
    '接下来的动作非常清晰，呈现为一个延续形态——形成了「控制（control）」及其测试。'
    '这个控制体现为看涨 K 线内部的最大成交区。我们看到价格正是在该区域展开测试，并从那里继续向上延续失衡。',
    '除了区间内的价格动态，我们还可以在成交量上观察到其它信号，例如整个发展过程中成交量的递减、'
    '买方 Weis 波出现得更频繁；以及对第 3 天剖面所能作出的「拍卖结束」解读。'
    '成交量显示潜在的拍卖结束，与潜在的 Spring 形成共振，这是一个非常有意思的信号，可以据此判断继续下跌的意愿不足。',
    '另一个非常值得关注的亮点，是价格在脱离价值区、处于上升趋势背景时出现的那些延续。'
    '这里 VPOC 迁移的概念为可能的入场提供了支撑。我们看到在迁移之后，价格几乎立刻延续了其看涨发展（C1 和 C2）。'
    '对于这类背景，这是一个非常有用的参考。在第三次延续（C3）中，市场将去拜访最重要的交易价位之一——周线 VWAP，'
    '并从那里展开新的上行动能。',
    '关于目标位，第一个需要考虑的目标（tp1）是此前那个高成交区（High Volume Node），'
    '它同时还留下了一个 Developing VPOC（发展中的 VPOC）。'
    '而由于左侧没有更多的成交量参照，后续目标则是识别流动性区域，例如重要的前高（tp2）。',
]

# 按原结构拼装：h3 -> p1 -> fig1 -> p2..p3 -> fig2 -> p4..p8
parts = [H3, '<p>%s</p>' % PARAS[0], FIG1,
         '<p>%s</p>' % PARAS[1], '<p>%s</p>' % PARAS[2], FIG2]
for p in PARAS[3:]:
    parts.append('<p>%s</p>' % p)
NEW = ''.join(parts)

OLD_LABEL = '第四十一章 EURO/DOLLAR ($6E)CURRENCY CROSS'
NEW_LABEL = '第四十一章 欧元/美元（$6E）货币交叉盘'

def main():
    txt = io.open(JS, encoding='utf-8').read()

    # --- 1) 取出旧块并做精确替换 ---
    m = re.search(r'window\.WYCKOFF_BOOK2_BODY = \[(.*?)\]\s*;\s*\n\s*window\.WYCKOFF_BOOK2_CHAPTERS',
                  txt, re.S)
    body = ast.literal_eval('[' + m.group(1) + ']')
    idx = None
    for i, b in enumerate(body):
        if 'bk2-c40' in b:
            idx = i
            break
    if idx is None:
        raise SystemExit('bk2-c40 not found in BODY')
    old = body[idx]
    old_repr = repr(old)
    if old_repr not in txt:
        raise SystemExit('exact repr of old block not found in file')
    txt = txt.replace(old_repr, repr(NEW), 1)
    print('BODY block idx=%d replaced (%d -> %d chars)' % (idx, len(old), len(NEW)))

    # --- 2) 同步 CHAPTERS 里的 label ---
    n = txt.count(OLD_LABEL)
    txt = txt.replace(OLD_LABEL, NEW_LABEL)
    print('CHAPTERS/BODY label replaced %d occurrence(s)' % n)

    io.open(JS, 'w', encoding='utf-8').write(txt)
    print('written ->', JS)

if __name__ == '__main__':
    main()
