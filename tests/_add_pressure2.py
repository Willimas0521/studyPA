#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""在 data/theories.js 的 priceAction.body 中，pressure 章节（第一讲）之后、
always-in 章节之前，插入 Al Brooks「买压与卖压」第二讲内容（震荡区间 + 通道内的买卖压力）。

做法：定位唯一锚点行  '<h2 id="always-in">始终在场交易</h2>',  在其前面整段插入新内容。
可重复运行：先撤销上一次插入（按本脚本写入的标记），再插。
"""
import io, re, sys

SRC = "data/theories.js"
MARK_OPEN  = "/*__PRESSURE2_START__*/"
MARK_CLOSE = "/*__PRESSURE2_END__*/"

NEW_BLOCK = '''      /*__PRESSURE2_START__*/
      '<h3>第二讲：震荡区间与通道里的买卖压力</h3>',
      '<p class="lede">第一讲讲清了买压卖压「是什么、怎么认」。这一讲进入它真正的用武之地——在<strong>震荡区间</strong>和<strong>通道</strong>里读买卖压力，用来提前判断趋势会延续、反转、还是退化为区间。</p>',

      '<h3>震荡区间里：看哪一方的压力在累积</h3>',
      '<p>只要看到震荡区间，就要持续追问：<strong>区间内有没有持续的买压或卖压？</strong>这直接决定突破更可能往哪边走。</p>',
      '<ul>',
        '<li><strong>买压持续累积</strong> → 多头突破概率上升，即便当下还在震荡，也可以把它当成<strong>潜在的单边上涨</strong>来对待。</li>',
        '<li><strong>卖压持续累积</strong> → 空头突破概率更高，把它当成<strong>潜在的单边下跌</strong>。</li>',
      '</ul>',
      '<p>如果预期多头将要突破，你希望在区间里看到这一组证据：阳线、阳线体积越来越大、连续阳线、阳线收盘在高位、阳线数量多于阴线、以及缺口（收盘价高于前一根高点，甚至高于左侧 20~30 根 K 线的高点）；同时<strong>高低点不断抬高</strong>——更高的低点、更高的高点，这是一段早期的多头通道。</p>',
      '<div class="callout tip"><div class="callout-body"><p class="callout-title">案例：阳线转阴线，压力悄悄易手</p><p>一个区间里先出现<strong>五根连续阳线</strong>，对多头有利；但随后连阳不再出现，K 线体积也变小了，接着走出<strong>连续五到六根阴线</strong>，卖压在增加。最后一根阴线收盘低于前面那根的低点，甚至比过去 40 根所有 K 线的低点都更低——这是连续六七根阴线之后的小突破。这种「高点降低的大反转」有时看起来像头肩顶，但要记住：<strong>头肩形态本身不会提高反转成功率</strong>，它只是交易者常用的说法；真正起作用的是背后不断累积的卖压。</p></div></div>',

      '<h3>通道里：看趋势会不会退化为区间</h3>',
      '<p>通道内部同样充满买卖压力的信号。核心规律是<strong>「急速 → 通道 → 区间」</strong>的演化链：价格急速移动后开始回调，变成通道；通道里压力一旦失衡，又会退化为震荡区间。</p>',
      '<div class="concept-grid">',
        '<div class="concept"><p class="concept-term">上涨通道 <span class="badge-inline">75% 下破</span></p><span class="concept-en">Bull Channel</span><p>约 <strong>75% 概率被向下跌破</strong>、趋势线被跌破；只有约 25% 会向上加速突破。所以在上涨通道里要<strong>持续评估卖压</strong>：一旦卖压开始累积（连续阴线收低位、上影线增多、阳线后的跟进变差），通道很可能退化为震荡区间。</p></div>',
        '<div class="concept"><p class="concept-term">下降通道 <span class="badge-inline">75% 上破</span></p><span class="concept-en">Bear Channel</span><p>反过来，下降通道约 <strong>75% 概率向上突破</strong>，可能横盘、也可能反转成上涨趋势。把下降通道当成<strong>牛旗</strong>看待，期待多头突破。通道里要<strong>持续评估买压</strong>：买压越来越大，往往预示即将向上突破、退化为区间。</p></div>',
      '</div>',
      '<div class="callout insight"><div class="callout-body"><p class="callout-title">跟进 K 线是通道变区间的报警器</p><p>通道里经常出现这种情况：一根大阳线之后，跟进却是一根十字星，甚至实体是阴线；前面还是一连串阳线，现在阳线后面没有好的跟随。这就是压力失衡的征兆——市场很可能很快从通道变成震荡区间。实际走势也往往如此。</p></div></div>',

      '<h3>下降通道里的买压：剥头皮空头 vs 真正的多头</h3>',
      '<p>下降通道里更值得关注的是<strong>买压</strong>。常见的一幕：K 线底部出现下影线，说明空头试图延续下跌、下方却有买入把价格拉回——这些多头只是<strong>剥头皮赚一点就跑</strong>，并没有长期做多的决心；他们尝试制造阴线，收盘前却被买回，说明空头对继续大跌信心不足，不是坚定持有做波段的空方。当越来越多空头转为剥头皮快进快出，下跌动能就在减弱。</p>',
      '<p>接着可能会出现几根大阴线尝试向下突破，但<strong>后续跟进却是阳线</strong>——空头突破失败。某根 K 线收盘价高于前一根高点、甚至高于左侧 15 根 K 线的高点，这是<strong>多头强势的信号</strong>，意味着价格突破了下降通道的趋势线、也站上了空头的「第二座空点」（可视为双顶熊旗中的大第二腿）。即使出现了一根不错的做空信号 K 线，只要没有继续下跌、反而反转向上突破前期高点，交易者就会在那个高点或上方<strong>直接收盘买入</strong>——因为这么大的阳线，若空头仍掌控市场是不该出现的。</p>',
      '<div class="callout tip"><div class="callout-body"><p class="callout-title">突破后如何管止损</p><p>把止损放在突破低点下方即可；但一旦多头掌控，这个低点<strong>不该被跌破</strong>（上涨趋势中低点抬高，它就是重要低点）。即便不确定，也可以在收盘买入，或等一根好的跟进 K 线再买。每当出现新的强势突破，就把止损<strong>上移到最近一次突破起涨点下方</strong>。哪怕买在最高位、刚买入就回调，只要依赖止损，依然没问题。交易者还会在每根 K 线的前低挂限价买单逢低买入——假设反转会失败，所以敢于在低位接。</p></div></div>',

      '<div class="callout insight"><div class="callout-body"><p class="callout-title">两节课总结</p><p>买压与卖压是读图的第一反射。震荡区间里，哪一方压力在累积，往往提前暗示突破方向；通道里，上涨通道卖压累积 → 易被向下跌破变区间，下降通道买压累积 → 易向上突破变区间。把「急速 → 通道 → 区间」的演化记在心里，你就能在趋势退化之前先一步站对边。</p></div></div>',
      /*__PRESSURE2_END__*/'''

def main():
    with io.open(SRC, "r", encoding="utf-8") as f:
        text = f.read()

    # 可重复运行：先移除上次插入
    if MARK_OPEN in text:
        pat = re.compile(re.escape(MARK_OPEN) + r".*?" + re.escape(MARK_CLOSE) + r"\n?", re.S)
        text = pat.sub("", text)
        print("已移除上一次插入，重新插入。")

    anchor = "      '<h2 id=\"always-in\">始终在场交易</h2>',"
    if anchor not in text:
        print("ERROR: 未找到锚点行（always-in h2），中止。")
        sys.exit(1)

    if anchor in text:
        # 在锚点前插入新内容（新内容末尾自带换行逻辑：以 /*__PRESSURE2_END__*/ 收尾，其后接 \n 再接锚点）
        insertion = NEW_BLOCK + "\n"
        text = text.replace(anchor, insertion + anchor, 1)

    with io.open(SRC, "w", encoding="utf-8") as f:
        f.write(text)
    print("OK: 第二讲内容已插入 pressure 章节末尾（always-in 之前）。")

if __name__ == "__main__":
    main()
