# -*- coding: utf-8 -*-
"""把 price-action 体系里「买压与卖压」(pressure) 这一整段正文，
从 HTML 改写成真正的 Markdown 源码（站点接入 marked 后渲染）。

- 章节大标题保留为带 id 的 h2（维持锚点 pressure 不变）；
- 各节用 Markdown 的 `### 1. / 2. ...` 与 `#### 5.1 ...` 做编号层级；
- 列表用 Markdown `-`；段落用 Markdown；
- 复杂组件（inline SVG 思维导图、concept-grid 卡片、callout 提示框）保留为
  内嵌 HTML 块（标准 Markdown 允许在原文中直接写 HTML，marked 会原样透传）。

仅替换 pressure 子串，不改变其它章节。可重复运行。
"""
import io, re

JS = "data/theories.js"
START = "      '<h2 id=\"pressure\">买压与卖压</h2>',"
END = "      '<h2 id=\"always-in\">始终在场交易</h2>',"


# ---------------------------------------------------------------------------
# 复刻第一讲的 inline SVG 对照图（保证与现状视觉一致）
# ---------------------------------------------------------------------------
def build_svg():
    left = [
        ("阳线多于阴线，且连续出现", "持续收在高位 / 上三分之一"),
        ("阳线实体更大、影线更短", "收盘守住战果，多头掌控"),
        ("窄上涨通道：低点不断抬高", "不等回调，收盘即买入"),
        ("下影线：空头破位被买回", "逢低买入，最终反转向上"),
        ("突破留缺口，阳线越走越大", "买盘激增，动能加速"),
    ]
    right = [
        ("阴线多于阴线，且连续出现", "持续收在低位 / 下三分之一"),
        ("阴线实体更大、影线更短", "收盘前空头一直掌控"),
        ("下降窄通道：高点不断降低", "每次反弹都被卖回，无回升"),
        ("上影线：多头反转被卖回", "逢高卖出，空头获胜"),
        ("向下缺口，阴线越走越大", "卖压加重，动能加速"),
    ]
    L = []
    L.append('<svg viewBox="0 0 1180 624" role="img" aria-label="买压与卖压对照图">')
    L.append('<defs><marker id="paPressArrow" viewBox="0 0 10 10" refX="9" refY="5" '
             'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
             '<path d="M0,0 L10,5 L0,10 z" class="m-tip"/></marker></defs>')
    L.append('<rect class="m-box-a" x="440" y="14" width="300" height="82" rx="12"/>')
    L.append('<rect class="m-box-a" x="440" y="14" width="4" height="82" rx="2"/>')
    L.append('<text x="590" y="52" font-size="19" font-weight="600" text-anchor="middle">买压 vs 卖压</text>')
    L.append('<text class="m-en" x="590" y="73" font-size="11" text-anchor="middle">Buying &amp; Selling Pressure</text>')
    L.append('<path class="m-line-a" marker-end="url(#paPressArrow)" d="M590,96 C 470,110 400,118 310,130"/>')
    L.append('<path class="m-line-a" marker-end="url(#paPressArrow)" d="M590,96 C 710,110 780,118 870,130"/>')
    L.append('<rect class="m-box-a" x="40" y="130" width="540" height="58" rx="10"/>')
    L.append('<rect class="m-box-a" x="40" y="130" width="4" height="58" rx="2"/>')
    L.append('<text x="60" y="160" font-size="17" font-weight="600">买压（多头掌控）</text>')
    L.append('<text class="m-en" x="60" y="180" font-size="11">Buying Pressure</text>')
    L.append('<rect class="m-box-2" x="600" y="130" width="540" height="58" rx="10"/>')
    L.append('<rect class="m-box-2" x="600" y="130" width="4" height="58" rx="2"/>')
    L.append('<text x="620" y="160" font-size="17" font-weight="600">卖压（空头掌控）</text>')
    L.append('<text class="m-en" x="620" y="180" font-size="11">Selling Pressure</text>')
    ys = [210, 272, 334, 396, 458]
    for i, y in enumerate(ys):
        L.append('<rect class="m-leaf" x="40" y="%d" width="540" height="58" rx="9"/>' % y)
        L.append('<rect class="m-box-a" x="40" y="%d" width="4" height="58" rx="2"/>' % y)
        L.append('<text x="64" y="%d" font-size="14" font-weight="600">%s</text>' % (y + 24, left[i][0]))
        L.append('<text class="m-dim" x="64" y="%d" font-size="12">%s</text>' % (y + 46, left[i][1]))
        L.append('<rect class="m-leaf" x="600" y="%d" width="540" height="58" rx="9"/>' % y)
        L.append('<rect class="m-box-2" x="600" y="%d" width="4" height="58" rx="2"/>' % y)
        L.append('<text x="624" y="%d" font-size="14" font-weight="600">%s</text>' % (y + 24, right[i][0]))
        L.append('<text class="m-dim" x="624" y="%d" font-size="12">%s</text>' % (y + 46, right[i][1]))
    L.append('<rect class="m-box" x="40" y="548" width="1100" height="58" rx="10"/>')
    L.append('<text x="60" y="574" font-size="14" font-weight="600">共同线索：谁更强 → 趋势延续的方向</text>')
    L.append('<text class="m-dim" x="60" y="594" font-size="12">多空拉锯（区间里互强）→ 提前预判突破方向，可在突破前抢先入场</text>')
    L.append('</svg>')
    return ''.join(L)


SVG = build_svg()

# ---------------------------------------------------------------------------
# Markdown 源码（编号层级：大标题 h2 / 节 h3 编号 1..5 / 子节 h4 编号 5.1..5.3）
# 复杂组件以内嵌 HTML 块保留（标准 Markdown 支持原文内直接写 HTML）。
# ---------------------------------------------------------------------------
MD = '''<h2 id="pressure">买压与卖压</h2>

K 线本身会告诉你现在谁更强。当你读价格行为时，最该持续追问的一个问题是：**多头更强还是空头更强？** 这种“谁在掌控”的读数，Al Brooks 称之为**买压（Buying Pressure）与卖压（Selling Pressure）**。它们不是指标，而是机构激进买入或卖出时，在 K 线上留下的足迹——而且机构**无法隐藏**这种迹象。

### 1. 买压与卖压到底是什么

多头主动买入会推升价格，他们激进时，K 线呈现为连续大阳线、几乎没有重叠、下影线极短——这是典型的**买压**，通常意味着上涨会延续。空头主动卖出会压低价格，呈现为一系列收在低位的阴线、且体积不小——这是**卖压**，通常意味着还要跌。关键认知：**这些 K 线就是机构买卖的足迹。** 看到强势买压，说明机构正在一致地推动市场向上；看到强势卖压，说明他们正一致地向下压。

<div class="mind-fig"><figure class="book-fig">{SVG}</figure><figcaption>买压与卖压对照：两列特征正好镜像。判断“谁更强”，就是判断当下趋势由哪一列主导。</figcaption></div>

### 2. 如何在上涨里辨认买压

寻找买压时，你希望看到的是下面这一整组特征同时出现（不是挑一两条，而是越多越好）：

- **阳线数量多于阴线**，并且出现**连续阳线**。
- **阳线体积大于阴线体积**。同样涨，实体更大的那根更有分量。
- **K 线收盘在高位**——至少高于中点，最好收在上三分之一。
- **窄上涨通道**：一根阳线紧接另一根阳线，低点不断抬高，几乎不回调。多头不是等回调，而是收盘就迫不及待地买。
- **下影线而非上影线**：说明空头曾试图向下突破，但被多头逢低买回、最终反转向上。
- **突破制造缺口**：收盘价高于前一根高点（甚至高于前面多根高点）。
- **好的跟随**：一根好阳线之后是另一根好阳线，连续阳线越来越多、体积越来越大；同时连续阴线越来越少、体积越来越小。

<div class="callout tip"><div class="callout-body"><p class="callout-title">动态对比：和左边 20~30 根 K 线比</p><p>买压是<strong>相对</strong>概念。如果左边二三十根 K 线前只有两到三根连阳，现在出现四到五根连阳，就是强度在上升；如果回调从之前的三根阴线缩短到一两根、且阴线体积变小，同样说明多头在夺权。看的是“对比”，不是绝对值。</p></div></div>

### 3. 如何在下跌里辨认卖压

卖压就是买压的镜像。判断空头掌控，你希望看到：

<div class="concept-grid">
  <div class="concept"><p class="concept-term">阴线多于阳线 <span class="badge-inline">More Bears</span></p><span class="concept-en">More Bear Bars</span><p>出现<strong>连续阴线</strong>，且阴线<strong>体积大于阳线</strong>。把任意一根阳线拿出来对比，体积都明显偏小——这就是空头强势的铁证。</p></div>
  <div class="concept"><p class="concept-term">收盘在低位 <span class="badge-inline">Low Close</span></p><span class="concept-en">Close Below Midpoint</span><p>阴线收在低位，<strong>几乎没有人收盘前买入</strong>。一直空头掌控到收盘，才会留下这样的棒。</p></div>
  <div class="concept"><p class="concept-term">下降窄通道 <span class="badge-inline">Bear Channel</span></p><span class="concept-en">Tight Bear Channel</span><p>每根 K 线高点不断降低、<strong>没有反弹</strong>。十字星一度是大阳线也被卖回，说明多头尝试反转但每次都输给空头。</p></div>
  <div class="concept"><p class="concept-term">顶部上影线 <span class="badge-inline">Upper Tail</span></p><span class="concept-en">Upper Tail</span><p>多头每次想反转，都被空头<strong>逢高卖下去</strong>。上影线记录的就是这种被拒绝。</p></div>
</div>

- **向下缺口 + 好的跟随**：收盘价低于前一根低点、高点低于前期低点；一根阴线之后是另一根阴线，小阴线接大阴线。
- **阴线越来越多、越来越大**；连续阳线越来越少、越来越小——说明多头正在失去兴趣。

### 4. 区间里的拉锯：买压卖压暗示突破方向

在震荡区间里，常常出现“**刚才还是多头强，一下子变成空头强**”的拉锯。多空在争夺突破的方向。这正是买压卖压最有用的时刻：**它经常提前暗示突破方向**，让你可以在突破真正发生之前就抢先入场。

<div class="callout insight"><div class="callout-body"><p class="callout-title">永远问一句：现在谁更强？</p><p>趋势中答案通常明显——某一方牢牢掌控。而区间里双方反复易手，买压卖压的此消彼长就是突破的前瞻信号。把“谁更强”当成读图的第一反射，能帮你提前半步站对边。</p></div></div>

### 5. 第二讲：震荡区间与通道里的买卖压力

第一讲讲清了买压卖压「是什么、怎么认」。这一讲进入它真正的用武之地——在**震荡区间**和**通道**里读买卖压力，用来提前判断趋势会延续、反转、还是退化为区间。

#### 5.1 震荡区间里：看哪一方的压力在累积

只要看到震荡区间，就要持续追问：**区间内有没有持续的买压或卖压？** 这直接决定突破更可能往哪边走。

- **买压持续累积** → 多头突破概率上升，即便当下还在震荡，也可以把它当成**潜在的单边上涨**来对待。
- **卖压持续累积** → 空头突破概率更高，把它当成**潜在的单边下跌**。

如果预期多头将要突破，你希望在区间里看到这一组证据：阳线、阳线体积越来越大、连续阳线、阳线收盘在高位、阳线数量多于阴线、以及缺口（收盘价高于前一根高点，甚至高于左侧 20~30 根 K 线的高点）；同时**高低点不断抬高**——更高的低点、更高的高点，这是一段早期的多头通道。

<div class="callout tip"><div class="callout-body"><p class="callout-title">案例：阳线转阴线，压力悄悄易手</p><p>一个区间里先出现<strong>五根连续阳线</strong>，对多头有利；但随后连阳不再出现，K 线体积也变小了，接着走出<strong>连续五到六根阴线</strong>，卖压在增加。最后一根阴线收盘低于前面那根的低点，甚至比过去 40 根所有 K 线的低点都更低——这是连续六七根阴线之后的小突破。这种「高点降低的大反转」有时看起来像头肩顶，但要记住：<strong>头肩形态本身不会提高反转成功率</strong>，它只是交易者常用的说法；真正起作用的是背后不断累积的卖压。</p></div></div>

#### 5.2 通道里：看趋势会不会退化为区间

通道内部同样充满买卖压力的信号。核心规律是 **急速 → 通道 → 区间** 的演化链：价格急速移动后开始回调，变成通道；通道里压力一旦失衡，又会退化为震荡区间。

<div class="concept-grid">
  <div class="concept"><p class="concept-term">上涨通道 <span class="badge-inline">75% 下破</span></p><span class="concept-en">Bull Channel</span><p>约 <strong>75% 概率被向下跌破</strong>、趋势线被跌破；只有约 25% 会向上加速突破。所以在上涨通道里要<strong>持续评估卖压</strong>：一旦卖压开始累积（连续阴线收低位、上影线增多、阳线后的跟进变差），通道很可能退化为震荡区间。</p></div>
  <div class="concept"><p class="concept-term">下降通道 <span class="badge-inline">75% 上破</span></p><span class="concept-en">Bear Channel</span><p>反过来，下降通道约 <strong>75% 概率向上突破</strong>，可能横盘、也可能反转成上涨趋势。把下降通道当成<strong>牛旗</strong>看待，期待多头突破。通道里要<strong>持续评估买压</strong>：买压越来越大，往往预示即将向上突破、退化为区间。</p></div>
</div>

<div class="callout insight"><div class="callout-body"><p class="callout-title">跟进 K 线是通道变区间的报警器</p><p>通道里经常出现这种情况：一根大阳线之后，跟进却是一根十字星，甚至实体是阴线；前面还是一连串阳线，现在阳线后面没有好的跟随。这就是压力失衡的征兆——市场很可能很快从通道变成震荡区间。实际走势也往往如此。</p></div></div>

#### 5.3 下降通道里的买压：剥头皮空头 vs 真正的多头

下降通道里更值得关注的是**买压**。常见的一幕：K 线底部出现下影线，说明空头试图延续下跌、下方却有买入把价格拉回——这些多头只是**剥头皮赚一点就跑**，并没有长期做多的决心；他们尝试制造阴线，收盘前却被买回，说明空头对继续大跌信心不足，不是坚定持有做波段的空方。当越来越多空头转为剥头皮快进快出，下跌动能就在减弱。

接着可能会出现几根大阴线尝试向下突破，但**后续跟进却是阳线**——空头突破失败。某根 K 线收盘价高于前一根高点、甚至高于左侧 15 根 K 线的高点，这是**多头强势的信号**，意味着价格突破了下降通道的趋势线、也站上了空头的「第二座空点」（可视为双顶熊旗中的大第二腿）。即使出现了一根不错的做空信号 K 线，只要没有继续下跌、反而反转向上突破前期高点，交易者就会在那个高点或上方**直接收盘买入**——因为这么大的阳线，若空头仍掌控市场是不该出现的。

<div class="callout tip"><div class="callout-body"><p class="callout-title">突破后如何管止损</p><p>把止损放在突破低点下方即可；但一旦多头掌控，这个低点<strong>不该被跌破</strong>（上涨趋势中低点抬高，它就是重要低点）。即便不确定，也可以在收盘买入，或等一根好的跟进 K 线再买。每当出现新的强势突破，就把止损<strong>上移到最近一次突破起涨点下方</strong>。哪怕买在最高位、刚买入就回调，只要依赖止损，依然没问题。交易者还会在每根 K 线的前低挂限价买单逢低买入——假设反转会失败，所以敢于在低位接。</p></div></div>

<div class="callout insight"><div class="callout-body"><p class="callout-title">两节课总结</p><p>买压与卖压是读图的第一反射。震荡区间里，哪一方压力在累积，往往提前暗示突破方向；通道里，上涨通道卖压累积 → 易被向下跌破变区间，下降通道买压累积 → 易向上突破变区间。把「急速 → 通道 → 区间」的演化记在心里，你就能在趋势退化之前先一步站对边。</p></div></div>'''.replace('{SVG}', SVG)


def js_quote(s):
    # 生成 JS 单引号字符串字面量：反斜杠/单引号转义，换行转成 \n
    s = s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
    return "'" + s + "'"


def main():
    with io.open(JS, 'r', encoding='utf-8') as f:
        text = f.read()

    if START not in text:
        raise SystemExit('ERROR: 未找到 pressure 起始锚点')
    if END not in text:
        raise SystemExit('ERROR: 未找到 always-in 结束锚点')

    i = text.index(START)
    j = text.index(END)
    # 用一段 Markdown 整行替换整段（保留 6 空格缩进与末尾逗号）
    new_line = '      ' + js_quote(MD) + ',\n'
    text = text[:i] + new_line + text[j:]

    with io.open(JS, 'w', encoding='utf-8') as f:
        f.write(text)
    print('OK: pressure 章节已改写为 Markdown 源码，长度 %d 字符。' % len(MD))


if __name__ == '__main__':
    main()
