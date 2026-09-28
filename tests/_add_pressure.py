# -*- coding: utf-8 -*-
"""把 Al Brooks「买压与卖压 / 缺口」两讲整理进 price-action 体系。

- 在 priceAction.chapters 的 trend 之后插入「买压与卖压」章节；
- 在 body 数组 always-in 之前插入该章正文（含 inline SVG 对照思维导图）；
- 在 gap 章节（channel 之前）末尾追加 Al Brooks 对缺口的独特读法。

全部为 AST 安全的整行插入，不改变既有结构。
"""
import io

ROOT = r'C:\Users\Administrator\WorkBuddy\2026-09-22-01-32-25\studyPA'
JS = ROOT + r'\data\theories.js'


# ---------------------------------------------------------------------------
# 1) 买压 vs 卖压 对照思维导图（inline SVG，沿用 .mind-fig 主题变量）
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
        ("阴线多于阳线，且连续出现", "持续收在低位 / 下三分之一"),
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
    # 根
    L.append('<rect class="m-box-a" x="440" y="14" width="300" height="82" rx="12"/>')
    L.append('<rect class="m-box-a" x="440" y="14" width="4" height="82" rx="2"/>')
    L.append('<text x="590" y="52" font-size="19" font-weight="600" text-anchor="middle">买压 vs 卖压</text>')
    L.append('<text class="m-en" x="590" y="73" font-size="11" text-anchor="middle">Buying &amp; Selling Pressure</text>')
    # 连线 根 -> 两列头
    L.append('<path class="m-line-a" marker-end="url(#paPressArrow)" d="M590,96 C 470,110 400,118 310,130"/>')
    L.append('<path class="m-line-a" marker-end="url(#paPressArrow)" d="M590,96 C 710,110 780,118 870,130"/>')
    # 列头
    L.append('<rect class="m-box-a" x="40" y="130" width="540" height="58" rx="10"/>')
    L.append('<rect class="m-box-a" x="40" y="130" width="4" height="58" rx="2"/>')
    L.append('<text x="60" y="160" font-size="17" font-weight="600">买压（多头掌控）</text>')
    L.append('<text class="m-en" x="60" y="180" font-size="11">Buying Pressure</text>')
    L.append('<rect class="m-box-2" x="600" y="130" width="540" height="58" rx="10"/>')
    L.append('<rect class="m-box-2" x="600" y="130" width="4" height="58" rx="2"/>')
    L.append('<text x="620" y="160" font-size="17" font-weight="600">卖压（空头掌控）</text>')
    L.append('<text class="m-en" x="620" y="180" font-size="11">Selling Pressure</text>')
    # 叶子
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
    # 底部提示
    L.append('<rect class="m-box" x="40" y="548" width="1100" height="58" rx="10"/>')
    L.append('<text x="60" y="574" font-size="14" font-weight="600">共同线索：谁更强 → 趋势延续的方向</text>')
    L.append('<text class="m-dim" x="60" y="594" font-size="12">多空拉锯（区间里互强）→ 提前预判突破方向，可在突破前抢先入场</text>')
    L.append('</svg>')
    return ''.join(L)


# ---------------------------------------------------------------------------
# 2) 章节正文
# ---------------------------------------------------------------------------
SVG = build_svg()

PRESSURE_BLOCK = '''      '<h2 id="pressure">买压与卖压</h2>',
      '<p class="lede">K 线本身会告诉你现在谁更强。当你读价格行为时，最该持续追问的一个问题是：<strong>多头更强还是空头更强？</strong> 这种"谁在掌控"的读数，Al Brooks 称之为<strong>买压（Buying Pressure）与卖压（Selling Pressure）</strong>。它们不是指标，而是机构激进买入或卖出时，在 K 线上留下的足迹——而且机构<strong>无法隐藏</strong>这种迹象。</p>',

      '<h3>买压与卖压到底是什么</h3>',
      '<p>多头主动买入会推升价格，他们激进时，K 线呈现为连续大阳线、几乎没有重叠、下影线极短——这是典型的<strong>买压</strong>，通常意味着上涨会延续。空头主动卖出会压低价格，呈现为一系列收在低位的阴线、且体积不小——这是<strong>卖压</strong>，通常意味着还要跌。关键认知：<strong>这些 K 线就是机构买卖的足迹。</strong>看到强势买压，说明机构正在一致地推动市场向上；看到强势卖压，说明他们正一致地向下压。</p>',
      '<div class="mind-fig"><figure class="book-fig">{SVG}</figure><figcaption>买压与卖压对照：两列特征正好镜像。判断"谁更强"，就是判断当下趋势由哪一列主导。</figcaption></div>',

      '<h3>如何在上涨里辨认买压</h3>',
      '<p>寻找买压时，你希望看到的是下面这一整组特征同时出现（不是挑一两条，而是越多越好）：</p>',
      '<ul>',
        '<li><strong>阳线数量多于阴线</strong>，并且出现<strong>连续阳线</strong>。</li>',
        '<li><strong>阳线体积大于阴线体积</strong>。同样涨，实体更大的那根更有分量。</li>',
        '<li><strong>K 线收盘在高位</strong>——至少高于中点，最好收在上三分之一。</li>',
        '<li><strong>窄上涨通道</strong>：一根阳线紧接另一根阳线，低点不断抬高，几乎不回调。多头不是等回调，而是收盘就迫不及待地买。</li>',
        '<li><strong>下影线而非上影线</strong>：说明空头曾试图向下突破，但被多头逢低买回、最终反转向上。</li>',
        '<li><strong>突破制造缺口</strong>：收盘价高于前一根高点（甚至高于前面多根高点）。</li>',
        '<li><strong>好的跟随</strong>：一根好阳线之后是另一根好阳线，连续阳线越来越多、体积越来越大；同时连续阴线越来越少、体积越来越小。</li>',
      '</ul>',
      '<div class="callout tip"><div class="callout-body"><p class="callout-title">动态对比：和左边 20~30 根 K 线比</p><p>买压是<strong>相对</strong>概念。如果左边二三十根 K 线前只有两到三根连阳，现在出现四到五根连阳，就是强度在上升；如果回调从之前的三根阴线缩短到一两根、且阴线体积变小，同样说明多头在夺权。看的是"对比"，不是绝对值。</p></div></div>',

      '<h3>如何在下跌里辨认卖压</h3>',
      '<p>卖压就是买压的镜像。判断空头掌控，你希望看到：</p>',
      '<div class="concept-grid">',
        '<div class="concept"><p class="concept-term">阴线多于阳线 <span class="badge-inline">More Bears</span></p><span class="concept-en">More Bear Bars</span><p>出现<strong>连续阴线</strong>，且阴线<strong>体积大于阳线</strong>。把任意一根阳线拿出来对比，体积都明显偏小——这就是空头强势的铁证。</p></div>',
        '<div class="concept"><p class="concept-term">收盘在低位 <span class="badge-inline">Low Close</span></p><span class="concept-en">Close Below Midpoint</span><p>阴线收在低位，<strong>几乎没有人收盘前买入</strong>。一直空头掌控到收盘，才会留下这样的棒。</p></div>',
        '<div class="concept"><p class="concept-term">下降窄通道 <span class="badge-inline">Bear Channel</span></p><span class="concept-en">Tight Bear Channel</span><p>每根 K 线高点不断降低、<strong>没有反弹</strong>。十字星一度是大阳线也被卖回，说明多头尝试反转但每次都输给空头。</p></div>',
        '<div class="concept"><p class="concept-term">顶部上影线 <span class="badge-inline">Upper Tail</span></p><span class="concept-en">Upper Tail</span><p>多头每次想反转，都被空头<strong>逢高卖下去</strong>。上影线记录的就是这种被拒绝。</p></div>',
      '</div>',
      '<ul>',
        '<li><strong>向下缺口 + 好的跟随</strong>：收盘价低于前一根低点、高点低于前期低点；一根阴线之后是另一根阴线，小阴线接大阴线。</li>',
        '<li><strong>阴线越来越多、越来越大</strong>；连续阳线越来越少、越来越小——说明多头正在失去兴趣。</li>',
      '</ul>',

      '<h3>区间里的拉锯：买压卖压暗示突破方向</h3>',
      '<p>在震荡区间里，常常出现<strong>"刚才还是多头强，一下子变成空头强"</strong>的拉锯。多空在争夺突破的方向。这正是买压卖压最有用的时刻：<strong>它经常提前暗示突破方向</strong>，让你可以在突破真正发生之前就抢先入场。</p>',
      '<div class="callout insight"><div class="callout-body"><p class="callout-title">永远问一句：现在谁更强？</p><p>趋势中答案通常明显——某一方牢牢掌控。而区间里双方反复易手，买压卖压的此消彼长就是突破的前瞻信号。把"谁更强"当成读图的第一反射，能帮你提前半步站对边。</p></div></div>',

'''.replace('{SVG}', SVG)

BROOKS_GAP_BLOCK = '''      '<h3>Al Brooks 对缺口的独特读法</h3>',
      '<p>前面按"突破 / 中继 / 衰竭"给缺口分了类，那是教科书视角。Al Brooks 对缺口的<strong>定义比任何人都宽</strong>，也更实用——他这套读法能帮你挖出很多别人忽略的交易机会。核心只有一句话：<strong>支撑与阻力之间的任何空隙，都是缺口。</strong></p>',
      '<ul>',
        '<li><strong>任何空隙都算</strong>：不只看跳空开盘。一根 K 线的<em>低点高于</em>前一根的<em>高点</em>、或收盘价高于前一根高点、或某根低点与前一根高点之间留下空档——全部算缺口。范围可以很小（两根相邻 K 线之间），也可以很大（一段明显没成交的成色区）。</li>',
        '<li><strong>负缺口 / 实体缺口（Gap Fill 的近亲）</strong>：突破后回调一度跌回突破点<em>下方</em>，但只有<strong>影线碰到、实体没有重叠</strong>，他称为负缺口（也叫实体缺口）。它功能与真缺口一样，只是"指引价格到达目标位"的概率稍低——因为空头本可以更强势却没做到。</li>',
        '<li><strong>缺口指引 MM（Measured Move，测量移动）</strong>：一个高点与某个低点之间的缺口，往往把行情切成两半，长度接近相等，可用作测量目标。达到目标位时，多头止盈、空头也知道这是多头目标，于是出现回调。</li>',
        '<li><strong>失败双底看向下 MM</strong>：一段上涨后跌破起涨点，就是失败的双底，按这段上涨的高度看<strong>向下的测量移动</strong>目标位。若期间出现过反弹、真的形成双底结构又失败跌破，同样向下看 MM。即使多头根本没制造出反弹，依旧预期向下到达 MM。</li>',
      '</ul>',
      '<div class="concept-grid">',
        '<div class="concept"><p class="concept-term">负缺口 <span class="badge-inline">Gap Fill / Negative Gap</span></p><span class="concept-en">Negative Gap</span><p>突破后小幅回踩到突破点下方，但实体不重合。可靠性弱于真缺口，仍属强势信号，只是到达目标的概率低一些。</p></div>',
        '<div class="concept"><p class="concept-term">缺口指引 MM <span class="badge-inline">Gap → Measured Move</span></p><span class="concept-en">Gap to Measured Move</span><p>缺口把一段行情分成两半，前后长度常接近。可据此投射目标位，是 Brooks 用缺口做交易管理的核心方法。</p></div>',
      '</div>',
      '<div class="callout warn"><div class="callout-body"><p class="callout-title">他的定义和别人不同，但有用</p><p>Brooks 承认自己对缺口的定义"和所有人都不同"。关键在于：更宽的定义能让你<strong>发现更多、更好的交易机会</strong>。只要这套定义自洽、能指引你找到入场与测量目标，就是合理的工具。</p></div></div>',

'''


# ---------------------------------------------------------------------------
# 3) 注入
# ---------------------------------------------------------------------------
def patch(src, old, new, label):
    n = src.count(old)
    assert n == 1, '%s 期望唯一匹配，实际 %d 处' % (label, n)
    return src.replace(old, new, 1)


src = open(JS, encoding='utf-8').read()

# a) chapters：trend 之后加 pressure
chap_old = "    { id: 'trend', label: '趋势' },"
chap_new = chap_old + "\n    { id: 'pressure', label: '买压与卖压' },"
src = patch(src, chap_old, chap_new, 'chapters.trend')

# b) body：always-in 之前插入买压卖压整章
ai_old = "      '<h2 id=\"always-in\">始终在场交易</h2>',"
src = patch(src, ai_old, PRESSURE_BLOCK + ai_old, 'body.pressure')

# c) body：gap 章节末（channel 之前）追加 Brooks 缺口读法
ch_old = "      '<h2 id=\"channel\">通道</h2>',"
src = patch(src, ch_old, BROOKS_GAP_BLOCK + ch_old, 'body.brooks-gap')

open(JS, 'w', encoding='utf-8').write(src)
print('done. 已插入买压卖压章节 + Brooks 缺口小节')
