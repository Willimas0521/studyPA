/* 一次性脚本：把 ICT 页面从 6 章扩到 11 章，统一 <h3>N.</h3> 编号结构。
   用法： node tests/_rebuild_ict.js
   替换区间：从 ICT 页面对象里的 "    chapters: [" 起，到 "    ].join('')," 之前。 */

const fs = require('fs');
const path = 'data/theories.js';

const CHAPS = [
  { id: 'origin', label: '起源与核心命题' },
  { id: 'structure', label: '市场结构' },
  { id: 'liquidity', label: '流动性：一切的原点' },
  { id: 'pdarrays', label: 'PD 阵列' },
  { id: 'time', label: '时间维度' },
  { id: 'models', label: '经典交易模型' },
  { id: 'alignment', label: '多周期对齐' },
  { id: 'entries', label: '进场、止损与目标' },
  { id: 'workflow', label: '完整交易流程' },
  { id: 'terms', label: '术语对照' },
  { id: 'pitfalls', label: '争议与误区' },
];

const BODY = [
  // ============================ 0. 导语 ============================
  '<p class="lede">ICT 由 Michael J. Huddleston 提出并在公开渠道传播，是近十年最流行的交易方法论之一。它最独特的地方不在于价格工具——那些和 SMC 大同小异——而在于它<strong>极度强调时间维度</strong>：什么时候发生，和发生在哪里一样重要。这一节按「结构 → 流动性 → 位置 → 时间 → 模型 → 执行」的顺序铺开，把全站此前缺失的市场结构、经典模型、多周期对齐与术语对照一并补齐。</p>',
  '',

  // ============================ 1. 起源与核心命题 ============================
  '<h2 id="origin">起源与核心命题</h2>',
  '<h3>1. 它从哪来</h3>',
  '<p>ICT 是 Michael J. Huddleston 的网名（Inner Circle Trader）。他从 1990 年代开始交易期货与外汇，2010 年代把整套方法以免费视频的形式放到公开渠道，形成了后来被称为 <strong>ICT Mentorship</strong> 的教学体系，此后又持续推出新的年度内容。累计时长数百小时，而且<strong>术语随年份不断演变</strong>——同一个概念在早期版本和后来的版本里可能叫不同的名字。</p>',
  '<p>这一点必须先讲清楚，因为它决定了你怎么学：<strong>ICT 不是一本书，也不是一套边界明确的教材，而是一堆持续生长的材料。</strong>你在网上看到的"ICT 是什么"，往往是某个博主从某一个年份的切片里抽出来的版本。你和他争论"ICT 到底怎么说"时，很可能只是看了不同年份的录像。</p>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">ICT 与 SMC 的关系</p><p>两者同源，都建立在"机构订单流 / 流动性被猎取"的叙事上。差别在于：<strong>SMC 是社区再包装后的精简版</strong>，术语更统一、更好传播；<strong>ICT 是原始那一支</strong>，更庞杂，也更强调时间。两边学到的工具（FVG、OB、BOS、MSS）几乎完全重叠，真正的分歧只在命名，以及在"要不要给价格配上时钟"这一点上。</p></div></div>',

  '<h3>2. 三个核心命题</h3>',
  '<p>把几百小时的内容压扁，ICT 只剩下三条主张。理解了这三条，后面所有术语都是它们的注脚：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">价格总是朝流动性移动</p><p>任何时刻价格都有一个"想要抵达"的目标，通常是上方的前高或下方的前低。这就是 <strong>Draw on Liquidity（DOL，流动性吸引目标）</strong>。做交易前先回答：价格现在想往哪去？答不出来就不该下单。</p></div>',
  '<div class="step"><p class="step-title">操纵先于交付</p><p>在奔向真正的目标之前，价格往往先朝反方向动一下，制造假突破、把止损扫掉，然后才出发。这是 Power of 3 里的 Manipulation 阶段，也是 ICT 所有模型的共同骨架。</p></div>',
  '<div class="step"><p class="step-title">时间比价格更重要</p><p>同样的形态，出现在亚洲盘和出现在纽约开盘，价值完全不同。<strong>ICT 给价格配上了时钟</strong>——这是它区别于 SMC 与价格行为学最硬的一条。</p></div>',
  '</div>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">和威科夫的亲缘关系</p><p>"先反向扫一下再真突破"，就是威科夫的 Spring 与 Upthrust。ICT 在这一点上是威科夫思想的重新包装，只是换了语言体系，并补上了时间窗口的操作化定义。如果你先学过威科夫，ICT 会很好懂；反过来则常常会觉得 ICT 的术语莫名其妙。</p></div></div>',

  '<h3>3. IPDA：一个工作假设，不是物理定律</h3>',
  '<p>ICT 假设市场由一个名为 <strong>IPDA（Interbank Price Delivery Algorithm，银行间价格交付算法）</strong> 的机制驱动，这个机制的任务不是给你利润，而是<strong>把价格送到有大量订单堆积的地方去完成撮合</strong>。</p>',
  '<p>这里必须诚实：IPDA 是一个<strong>叙事工具，不是一个可观测的机制</strong>。没有人见过这个算法，也没有办法设计实验去证伪它。它的价值在于提供了一个自洽的视角——"价格为什么去那里"，而不是因为它"是真的"。你可以完全不相信 IPDA，仍然正常使用 ICT 的结构与时段框架；但如果把 IPDA 当物理定律来信，就会在每一次失效时去找"我漏算了什么"，而不是承认它只是个比喻。</p>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">判断一个说法有没有用的标准</p><p>看它能不能给出<strong>可证伪的入场与失效条件</strong>。"价格在纽约开盘会去扫前低"是可证伪的——扫了就是扫了，没扫就是没扫。"算法在重新平衡"是不可证伪的——无论价格怎么走，你都能事后圆回来。<strong>只把前者写进交易计划。</strong></p></div></div>',

  '<h3>4. 学 ICT 的正确顺序</h3>',
  '<p>绝大多数人学 ICT 的顺序是反的：先背 FVG、OB、Breaker 这些名词，再去找图对号入座。结果就是满屏画线，却不知道自己在等什么。正确的顺序是下面这条，每一层都是下一层的前提：</p>',
  '<div class="table-wrap"><table><thead><tr><th>顺序</th><th>学什么</th><th>为什么必须先学</th></tr></thead><tbody>',
  '<tr><th class="rowhead">第一层</th><td>市场结构（HH/HL/LH/LL、BOS、MSS）</td><td>不认得结构，就没有"方向"这回事，后面全是空转</td></tr>',
  '<tr><th class="rowhead">第二层</th><td>流动性（哪里堆着订单、怎么被扫）</td><td>结构告诉你发生了什么，流动性告诉你为什么会发生</td></tr>',
  '<tr><th class="rowhead">第三层</th><td>PD 阵列（溢价/折价、FVG、OB、OTE）</td><td>解决"在哪里等"，位置不对，方向对了也赚不到</td></tr>',
  '<tr><th class="rowhead">第四层</th><td>时间（Power of 3、Killzone）</td><td>解决"什么时候等"，这是 ICT 独有的那一半</td></tr>',
  '<tr><th class="rowhead">第五层</th><td>具体模型（Judas、Turtle Soup、Silver Bullet…）</td><td>模型是前四层的组合，跳过前四层直接学模型必然走形</td></tr>',
  '<tr><th class="rowhead">第六层</th><td>执行（止损、目标、失效条件、仓位）</td><td>前面五层全对，执行崩了依然归零</td></tr>',
  '</tbody></table></div>',
  '',

  // ============================ 2. 市场结构 ============================
  '<h2 id="structure">市场结构</h2>',
  '<p>结构（Market Structure）是 ICT 的地基，也是全站此前缺失的一块。它回答的只有一个问题：<strong>现在谁在主导</strong>。所有流动性判断、所有入场模型都挂在它上面——结构错了，后面每一步都是错的方向上的精修。</p>',

  '<h3>1. 摆动点：结构的最小单位</h3>',
  '<p>摆动高点（Swing High）是<strong>左右两侧各有 N 根 K 线高点都低于它</strong>的那根 K 线；摆动低点（Swing Low）镜像成立。N 通常取 3 到 5，取决于你的周期。</p>',
  '<p>这里有个容易被忽略的坑：<strong>摆动点是事后确认的</strong>。你要等右侧那 N 根 K 线走完，才能回头标记"这里是个摆动高点"。所以图上标好的摆动点，在实时行情里永远是 N 根 K 线之前的旧信息——这不代表它没用，但意味着<strong>最新的一根摆动点还没诞生，你不能拿"疑似摆动点"当结构用</strong>。</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">摆动高点 <span class="badge-inline">Swing High</span></p><span class="concept-en">Swing High</span><p>左右各 N 根 K 线高点都低于它的那根。<strong>它的上方堆着空头止损与突破买单</strong>，是天然的买方流动性池。</p></div>',
  '<div class="concept"><p class="concept-term">摆动低点 <span class="badge-inline">Swing Low</span></p><span class="concept-en">Swing Low</span><p>左右各 N 根 K 线低点都高于它的那根。<strong>它的下方堆着多头止损与突破卖单</strong>，是天然的卖方流动性池。</p></div>',
  '<div class="concept"><p class="concept-term">分形 <span class="badge-inline">Fractal</span></p><span class="concept-en">Fractal</span><p>摆动点在其它体系里的名字。价格行为学的"波段高低点"、艾略特的浪的起点，都是同一个东西——只是各自给它编了号。</p></div>',
  '</div>',

  '<h3>2. HH / HL / LH / LL：趋势的骨架</h3>',
  '<p>把摆动点连起来，就得到四个字母，它们是趋势唯一的客观定义：</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">更高高点 <span class="badge-inline">HH</span></p><span class="concept-en">Higher High</span><p>新的摆动高点高于前一个。<strong>上涨趋势的推进证据。</strong></p></div>',
  '<div class="concept"><p class="concept-term">更高低点 <span class="badge-inline">HL</span></p><span class="concept-en">Higher Low</span><p>回调低点高于前一个低点。<strong>上涨趋势的存续证据</strong>——比 HH 更重要，因为它描述结构而非结果。</p></div>',
  '<div class="concept"><p class="concept-term">更低高点 <span class="badge-inline">LH</span></p><span class="concept-en">Lower High</span><p>反弹高点低于前一个。<strong>下跌趋势的存续证据。</strong></p></div>',
  '<div class="concept"><p class="concept-term">更低低点 <span class="badge-inline">LL</span></p><span class="concept-en">Lower Low</span><p>新的摆动低点低于前一个。<strong>下跌趋势的推进证据。</strong></p></div>',
  '</div>',
  '<p>上涨趋势的定义就是<strong>连续的 HH + HL</strong>；下跌趋势是<strong>连续的 LL + LH</strong>。这条链条断在哪一环，趋势就在哪里出问题。注意顺序：<strong>通常是 HL 先失守，然后才轮到 HH</strong>——上涨里出现一个 LL，比出现一个 LH 严重得多。</p>',

  '<h3>3. BOS：顺着趋势的突破</h3>',
  '<p><strong>BOS（Break of Structure，结构突破）</strong>指价格在<strong>趋势方向上</strong>突破前一个摆动点：上涨里突破前高，下跌里跌破前低。它的含义是<strong>趋势延续</strong>，是"一切照旧"的确认，不是新信号。</p>',
  '<p>BOS 本身几乎不构成入场理由。它告诉你"这一段还在走"，但没告诉你在哪里进、止损放哪。ICT 里真正值钱的是下一条——MSS。</p>',

  '<h3>4. MSS / CHoCH：主导权易手</h3>',
  '<p><strong>MSS（Market Structure Shift，市场结构转向）</strong>，也叫 <strong>CHoCH（Change of Character）</strong>，指价格<strong>反向</strong>打破了最近的结构：上涨里跌破了最近一个 HL，或下跌里突破了最近一个 LH。它意味着主导权可能易手。</p>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">BOS 与 MSS 的唯一区别是方向</p><p>同样是"打破了某个摆动点"，<strong>顺着当前趋势的那次叫 BOS，逆着的那次叫 MSS</strong>。形态上它们是同一件事，含义完全相反。这个区分是 ICT 结构观的核心——不要把每一次破位都叫 BOS，也不要把任何一次回调破位都当成反转。</p></div></div>',
  '<p>MSS 最关键的一点是：<strong>它通常发生在流动性被扫之后</strong>。价格先把前低扫掉（拿走卖方流动性），然后反向突破最近的 LH，形成 MSS。所以完整的因果链是：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">价格抵达流动性池</p><p>前低 / 前高 / 等高点——那里堆着散户止损。</p></div>',
  '<div class="step"><p class="step-title">扫荡（Sweep）</p><p>短暂刺穿，触发止损，但<strong>收不回外侧</strong>或立刻收回。</p></div>',
  '<div class="step"><p class="step-title">MSS 出现</p><p>反向打破最近的摆动结构，证明扫荡不是延续，而是转折。</p></div>',
  '<div class="step"><p class="step-title">回踩 PD 阵列</p><p>回到 FVG / OB / OTE，这时才谈入场价格。</p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">只有扫荡没有 MSS，等于什么都没发生</p><p>这是新手最常见的误判：看到价格扫掉前低就喊反转，结果价格继续下跌。<strong>扫荡只是"可能"，MSS 才是"确认"</strong>。没有 MSS 的扫荡，在统计上更接近趋势延续的燃料，而不是反转的起点。</p></div></div>',

  '<h3>5. 内部结构与摆动结构</h3>',
  '<p>ICT 把结构分成两层，这个区分能救回很多误判：</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">摆动结构 <span class="badge-inline">Swing Structure</span></p><span class="concept-en">Swing Structure</span><p>用摆动高低点连出来的<strong>大结构</strong>。它变化慢、噪音少，用来<strong>定方向</strong>。高周期上一眼能看出来的那种。</p></div>',
  '<div class="concept"><p class="concept-term">内部结构 <span class="badge-inline">Internal Structure</span></p><span class="concept-en">Internal Structure</span><p>大结构内部那些更小的高低点。它变化快、噪音多，用来<strong>找入场</strong>。低周期上数 MSS，数的就是内部结构。</p></div>',
  '</div>',
  '<p>用法很直接：<strong>高周期看摆动结构定 bias，低周期看内部结构找触发。</strong>把两者混用是灾难——在低周期上定义方向、在高周期上找入场，两个都错。</p>',

  '<h3>6. 结构与流动性，谁先谁后</h3>',
  '<p>答案是：<strong>结构定义流动性在哪，流动性驱动结构改变。</strong>摆动高点决定了买方流动性堆在它上方；价格去把那批止损扫掉，随后反向打破结构形成 MSS，于是结构改变；新的结构又定义出新的流动性位置。这是一个闭环。</p>',
  '<p>理解了这个闭环，你就会明白为什么 ICT 反复强调"先画结构再找流动性"——<strong>没有结构图，你根本不知道流动性池在哪</strong>，只能在图上乱指一个前高说"那有流动性"。</p>',
  '',

  // ============================ 3. 流动性 ============================
  '<h2 id="liquidity">流动性：一切的原点</h2>',
  '<h3>1. 流动性到底是什么</h3>',
  '<p>流动性指的是<strong>可以成交的订单</strong>。在这个语境下，它几乎等同于"别人挂在那里的止损单"。散户的止损是最容易被收割的一类，因为它们的位置高度可预测——大家都把止损放在前低下方、前高上方，整齐得像排队。</p>',
  '<p>ICT 的核心叙事就建立在这件事上：<strong>价格需要对手盘才能成交，所以它会被送到订单最多的地方去。</strong>这不是阴谋论，只是撮合的物理约束——大单要在有量的地方才能成交。</p>',

  '<h3>2. 流动性池的六种常见位置</h3>',
  '<p>知道去哪找，比知道定义有用得多。按可靠度从高到低：</p>',
  '<div class="table-wrap"><table><thead><tr><th>位置</th><th>为什么有流动性</th><th>可靠度</th></tr></thead><tbody>',
  '<tr><th class="rowhead">摆动高点 / 低点</th><td>最标准的止损堆积处，人人都在那挂</td><td>最高</td></tr>',
  '<tr><th class="rowhead">等高点 / 等低点</th><td>几乎水平的一排高低点，是极强的磁铁；扫一个常常连带扫一串</td><td>很高</td></tr>',
  '<tr><th class="rowhead">前一日的 高 / 低</th><td>日内交易者最常用的参考位，隔夜止损集中</td><td>高</td></tr>',
  '<tr><th class="rowhead">前一週 / 前一月的 高 / 低</th><td>更高周期的止损池，被扫时行情级别更大</td><td>高</td></tr>',
  '<tr><th class="rowhead">明显的趋势线外侧</th><td>画趋势线的人把止损放在线的另一侧</td><td>中</td></tr>',
  '<tr><th class="rowhead">整数关口</th><td>心理位，挂单多但分散，反应不如结构位干净</td><td>中偏低</td></tr>',
  '</tbody></table></div>',

  '<h3>3. 买方流动性与卖方流动性</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">买方流动性 <span class="badge-inline">BSL</span></p><span class="concept-en">Buy-side Liquidity</span><p>堆积在<strong>前高上方</strong>的买入订单（空头止损 + 突破买单）。上方流动性被打掉时，价格常出现冲高回落。</p></div>',
  '<div class="concept"><p class="concept-term">卖方流动性 <span class="badge-inline">SSL</span></p><span class="concept-en">Sell-side Liquidity</span><p>堆积在<strong>前低下方</strong>的卖出订单。下方流动性被扫掉后，价格常迅速拉回，形成当日最低点。</p></div>',
  '<div class="concept"><p class="concept-term">等高点 / 等低点 <span class="badge-inline">EQH / EQL</span></p><span class="concept-en">Equal Highs / Lows</span><p>几乎水平的前高或前低，是极强的流动性磁铁。<strong>扫掉等高点之后如果立刻回落，说明那批流动性是"目标"而不是"起点"。</strong></p></div>',
  '<div class="concept"><p class="concept-term">流动性扫荡 <span class="badge-inline">Sweep</span></p><span class="concept-en">Liquidity Sweep</span><p>价格短暂突破关键位置、触发一片止损后迅速反向。这是 ICT 体系里<strong>最重要的入场前置条件</strong>。</p></div>',
  '</div>',

  '<h3>4. 内部流动性与外部流动性</h3>',
  '<p>这是 ICT 后期内容里引入的区分，非常实用：</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">外部流动性 <span class="badge-inline">External</span></p><span class="concept-en">External Liquidity</span><p>当前价格区间<strong>之外</strong>的流动性——区间上方的前高、下方的前低。<strong>它是"目标"</strong>：价格想去那里。</p></div>',
  '<div class="concept"><p class="concept-term">内部流动性 <span class="badge-inline">Internal</span></p><span class="concept-en">Internal Liquidity</span><p>当前价格区间<strong>之内</strong>的流动性——FVG、OB、内部摆动点。<strong>它是"路径"</strong>：价格去往目标的路上会先回来碰它们。</p></div>',
  '</div>',
  '<p>一句话记住：<strong>外部流动性是你要去的地方，内部流动性是你在路上会经过的地方。</strong>把这两类混在一起看，就会出现"到处都是流动性、到处都能进场"的幻觉。</p>',

  '<h3>5. 流动性扫荡的三种形态</h3>',
  '<p>不是所有"突破前低"都叫扫荡。区分它们的唯一依据是<strong>收盘在哪</strong>：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">影线扫荡（最干净）</p><p>影线刺穿前低，实体与收盘都在上方。止损被触发，但价格立刻收回。<strong>这是最理想的 Sweep</strong>——意图暴露得非常清楚。</p></div>',
  '<div class="step"><p class="step-title">实体短暂突破后收回</p><p>一根 K 线实体收在前低下方，但下一根立刻强势反向并触发 MSS。仍然算扫荡，只是确认成本多了一根 K 线。</p></div>',
  '<div class="step"><p class="step-title">实体突破且不收回（不是扫荡）</p><p>收在前低外侧并继续推进。<strong>这不是扫荡，是 BOS</strong>——趋势在延续。把它当扫荡去做反转，是最亏钱的一类误判。</p></div>',
  '</div>',
  '',

  // ============================ 4. PD 阵列 ============================
  '<h2 id="pdarrays">PD 阵列</h2>',
  '<p>PD Array（Premium / Discount Array）是 ICT 对"价格可能反应的位置"的统称。它的逻辑框架是<strong>溢价与折价</strong>：同一段行情里，上半段是贵的地方，下半段是便宜的地方。</p>',

  '<h3>1. 溢价与折价：先定标尺</h3>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">先定区间，再谈位置</p><p>取一段明确的波动（比如一个摆动高点到一个摆动低点），在中点画一条线，这条线叫 <strong>Equilibrium（均衡价 / CE）</strong>。中点以上叫<strong>溢价区（Premium）</strong>，适合<em>卖出</em>；中点以下叫<strong>折价区（Discount）</strong>，适合<em>买入</em>。你永远不会想在溢价区追多。</p></div></div>',
  '<p>这一步的价值在于<strong>它能一次性否掉一半的冲动交易</strong>：看见 FVG 想进多，先问它落在中点上方还是下方。落在上方，那是在溢价区买，直接放弃。</p>',

  '<h3>2. 公允价值缺口 FVG</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">公允价值缺口 <span class="badge-inline">FVG</span></p><span class="concept-en">Fair Value Gap</span><p>三根 K 线之间留下的价格缺口——第一根的高点低于第三根的低点（或反之），中间那一段<strong>完全没有成交</strong>。市场倾向于回头把它补上，因此 FVG 是首选的回踩入场区。</p></div>',
  '<div class="concept"><p class="concept-term">看涨 FVG <span class="badge-inline">Bullish FVG</span></p><span class="concept-en">Bullish FVG</span><p>向上跳空留下的缺口，下沿在第 1 根高点、上沿在第 3 根低点。<strong>回补时是买盘区。</strong></p></div>',
  '<div class="concept"><p class="concept-term">看跌 FVG <span class="badge-inline">Bearish FVG</span></p><span class="concept-en">Bearish FVG</span><p>向下跳空留下的缺口。<strong>回补时是卖压区。</strong></p></div>',
  '<div class="concept"><p class="concept-term">失效 FVG <span class="badge-inline">Mitigated</span></p><span class="concept-en">Mitigated FVG</span><p>已被价格回补过的 FVG。<strong>补过一次就失效了</strong>，不要在同一位置等第二次反应——这是新手画满屏幕 FVG 的主要原因。</p></div>',
  '</div>',
  '<p>三个实操提醒：<strong>缺口越大越值得等</strong>，小到一两个跳动的 FVG 没有意义；<strong>FVG 要和高低点结构同向</strong>才有效；<strong>FVG 是区域不是点位</strong>，用它的上沿/下沿/中點（CE）分档，别指望精确成交。</p>',

  '<h3>3. 订单块 OB</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">订单块 <span class="badge-inline">OB</span></p><span class="concept-en">Order Block</span><p>引发结构突破之前的<strong>最后一根反向 K 线</strong>。上涨突破前，那根最后的下跌 K 线就是看涨 OB。ICT 认为那是机构建仓留下的痕迹，价格回踩到这里时会有反应。</p></div>',
  '<div class="concept"><p class="concept-term">断路器块 <span class="badge-inline">Breaker</span></p><span class="concept-en">Breaker Block</span><p>原本的订单块被反向突破后，角色反转——<strong>原来的支撑变成阻力</strong>。用于识别结构转向后的回踩位。</p></div>',
  '<div class="concept"><p class="concept-term">缓解块 <span class="badge-inline">Mitigation</span></p><span class="concept-en">Mitigation Block</span><p>与断路器类似，指价格回到结构转向的起点区域，用于"缓解"未成交的订单。常与 OTE 重合。</p></div>',
  '<div class="concept"><p class="concept-term">拒绝块 <span class="badge-inline">Rejection</span></p><span class="concept-en">Rejection Block</span><p>扫荡之后<strong>那根留下长影线、随后引发 MSS 的 K 线</strong>。它的极值就是止损参考位，因为它定义了"扫荡到此为止"。</p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">OB 不是越多越好</p><p>一段行情里能划出十几个"最后一根反向 K 线"，全划出来等于没划。<strong>只保留引发关键结构突破的那一个</strong>，并且它必须落在折价区（做多时）才有意义。</p></div></div>',

  '<h3>4. OTE 与 CE：把入场收窄到一个区间</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">最优入场区间 <span class="badge-inline">OTE</span></p><span class="concept-en">Optimal Trade Entry</span><p>一段行情的 <strong>62% 到 79% 回撤区间</strong>，通常还叠加 70.5% 这个中点。属于折价区里的最深处，<strong>盈亏比最好但成交率最低</strong>。</p></div>',
  '<div class="concept"><p class="concept-term">均衡价 <span class="badge-inline">CE</span></p><span class="concept-en">Consequent Encroachment</span><p>任意价格区间的 <strong>50% 中點</strong>——FVG 的中點、OB 的中點、整段行情的中點。<strong>它是"回补到位"的默认目标</strong>，比区间边缘更常被触及。</p></div>',
  '</div>',
  '<p>OTE 的取舍很现实：<strong>等 62%–79% 能拿到最好的盈亏比，但强趋势里根本等不到</strong>；等 50% 成交率高但止损远。实操上常见做法是<strong>分两笔</strong>——50% 一笔、OTE 一笔，各半仓，而不是赌一个点位。</p>',

  '<h3>5. CISD 与流动性真空</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">结构内的变化 <span class="badge-inline">CISD</span></p><span class="concept-en">Change in State of Delivery</span><p>价格从"连续给出看跌 FVG"切换成"连续给出看涨 FVG"，或反之。<strong>它是比 MSS 更早一步的方向切换证据</strong>，常被用作低周期的入场触发。</p></div>',
  '<div class="concept"><p class="concept-term">流动性真空 <span class="badge-inline">Void</span></p><span class="concept-en">Liquidity Void</span><p>一段快速单边行情里<strong>几乎没有回踩、没有 FVG 留下的区域</strong>。价格回头经过时会走得很快，<strong>不适合挂限价单等回踩</strong>。</p></div>',
  '<div class="concept"><p class="concept-term">失衡 <span class="badge-inline">Imbalance</span></p><span class="concept-en">Imbalance / Inefficiency</span><p>买卖双方力量悬殊造成的价格真空。FVG 是失衡最常见的一种表现，此外还有成交量失衡。</p></div>',
  '</div>',
  '',

  // ============================ 5. 时间维度 ============================
  '<h2 id="time">时间维度</h2>',
  '<p>这是 ICT 区别于所有其他体系的地方——<strong>它给价格配上了时钟</strong>。同样的形态，出现在错误的时间，价值接近于零。</p>',

  '<h3>1. Power of 3（AMD）</h3>',
  '<p>ICT 认为每个交易日（或周、月）都会经历三个阶段，缩写为 AMD：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">Accumulation 吸筹</p><p>通常在亚洲盘。价格在窄幅区间里磨，为后面的动作蓄势。<strong>这一段的高低点常常就是当天要被扫的流动性。</strong></p></div>',
  '<div class="step"><p class="step-title">Manipulation 操纵</p><p>通常在伦敦盘开盘前后。价格向一侧假突破，扫掉止损——这就是 <strong>Judas Swing（犹大摆动）</strong>。<strong>它是当天最重要的一次欺骗，也是最好的入场来源。</strong></p></div>',
  '<div class="step"><p class="step-title">Distribution 派发</p><p>纽约盘。价格真正朝着当日流动性目标运行，也就是主要行情。</p></div>',
  '</div>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">AMD 是对称的，可以套在任意周期上</p><p>一天有 AMD，一小时也有 AMD，一周也有。<strong>大周期的 Manipulation 里套着小周期的完整 AMD</strong>——这就是所谓分形。实操价值在于：当你在小周期上看到"假突破后反转"，先抬头看看大周期处在哪个阶段；如果大周期正在 Manipulation，那个小反转大概率也是假的。</p></div></div>',

  '<h3>2. Killzone（关键时段）</h3>',
  '<p>Killzone 是 ICT 认为最可能出现有效动作的时间窗口，通常按纽约时间界定：</p>',
  '<div class="table-wrap"><table><thead><tr><th>时段</th><th>大致时间（纽约时间）</th><th>典型角色</th></tr></thead><tbody>',
  '<tr><th class="rowhead">亚洲盘</th><td>20:00 – 00:00</td><td>区间积累，波动小，常构成当日流动性边界</td></tr>',
  '<tr><th class="rowhead">伦敦开盘</th><td>02:00 – 05:00</td><td>Judas Swing，常见假突破</td></tr>',
  '<tr><th class="rowhead">纽约开盘</th><td>08:30 – 11:00</td><td>主要行情，流动性最充足</td></tr>',
  '<tr><th class="rowhead">Silver Bullet</th><td>10:00 – 11:00</td><td>ICT 单独点名的黄金一小时</td></tr>',
  '<tr><th class="rowhead">伦敦收盘</th><td>11:00 – 12:00</td><td>回补与反向动作</td></tr>',
  '</tbody></table></div>',
  '<p class="muted small">注：以上为 ICT 教学中的通行说法，不同时区与夏令时会带来偏移，实际使用需按当地交易时段重新校准，且并非每个时段都会出现教科书式动作。</p>',

  '<h3>3. Silver Bullet</h3>',
  '<p>ICT 把一天里三个特定的一小时窗口单独拎出来，称为 <strong>Silver Bullet（银弹）</strong>，认为最标准的"扫荡 + 反转 + 单边"往往发生在这几段里：</p>',
  '<div class="table-wrap"><table><thead><tr><th>窗口</th><th>纽约时间</th><th>说明</th></tr></thead><tbody>',
  '<tr><th class="rowhead">伦敦 Silver Bullet</th><td>03:00 – 04:00</td><td>常在亚洲盘高低点被扫之后出现</td></tr>',
  '<tr><th class="rowhead">纽约上午 Silver Bullet</th><td>10:00 – 11:00</td><td>点名最多的一个，流动性最足</td></tr>',
  '<tr><th class="rowhead">纽约下午 Silver Bullet</th><td>14:00 – 15:00</td><td>常是当日第二段行情或回补</td></tr>',
  '</tbody></table></div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">Silver Bullet 不是"到点就下单"</p><p>它限定的是<strong>你该盯盘的窗口</strong>，不是入场信号。窗口内仍然要满足完整条件：流动性被扫 → MSS → 回踩 PD 阵列。<strong>把时间窗口当成信号，是 ICT 学习者亏损最快的方式之一。</strong></p></div></div>',

  '<h3>4. IPDA 周期</h3>',
  '<p>ICT 提出算法以 <strong>20、40、60 个交易日</strong>为循环单位来组织价格。用法是：在 20 日区间内判断溢价/折价，并根据当前处在周期的哪一段来推测目标流动性的位置。周期越长，指向的流动性级别越大。</p>',

  '<h3>5. SMT 背离</h3>',
  '<p><strong>SMT（Smart Money Technique）</strong>：比较两个高度相关的品种（如标普与纳指、欧元与英镑）——如果其中一个创了新高而另一个没有，说明这一侧的流动性是"假的"，反转概率上升。</p>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">SMT 是过滤器，不是信号</p><p>它只在<strong>你已经有了方向倾向</strong>时用于加权：结构与流动性都指向反转，且 SMT 吻合，则置信度提高。<strong>单独拿 SMT 下单没有意义</strong>——背离可以持续很久。</p></div></div>',

  '<h3>6. 星期与月份的倾向</h3>',
  '<p>ICT 还给出过一些更粗的时间倾向，比如一周里某些日子更容易出现反转、某些月份更适合趋势。这一类说法<strong>统计基础最弱、最容易被事后归因</strong>，建议只当背景，不要写进交易计划。真正经得起用的是 Killzone 与 AMD 相位，因为它们至少与真实的市场参与者作息挂钩。</p>',
  '',

  // ============================ 6. 经典交易模型 ============================
  '<h2 id="models">经典交易模型</h2>',
  '<p>模型（Model）是 ICT 把前五层知识打包成的固定套路。它们不是新理论，而是<strong>同一套逻辑在不同图形下的具体化</strong>。挑一个练熟，比同时追五个有用得多。</p>',

  '<h3>1. Judas Swing（犹大摆动）</h3>',
  '<p>整个 ICT 的基石模型。它的形态是：<strong>在 Killzone 开始时，价格先朝一个方向假突破（通常是扫掉亚洲盘的高低点），然后全天反向运行。</strong>前半段就是 Manipulation，后半段就是 Distribution。</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">标记亚洲盘区间</p><p>它的高点与低点就是当天最可能被扫的两个流动性池。</p></div>',
  '<div class="step"><p class="step-title">等伦敦或纽约开盘后扫掉一侧</p><p>注意必须是<strong>扫荡</strong>——影线刺穿或实体突破后迅速收回，不是站稳外侧。</p></div>',
  '<div class="step"><p class="step-title">等 MSS 确认</p><p>反向打破最近的内部结构。没有 MSS，Judas 就不成立。</p></div>',
  '<div class="step"><p class="step-title">回踩 FVG / OB 进场</p><p>止损放在 Judas 的极值之外一点。</p></div>',
  '<div class="step"><p class="step-title">目标：对面的流动性</p><p>通常是另一侧的前高/前低，或者当日区间的对面边界。</p></div>',
  '</div>',

  '<h3>2. Turtle Soup（海龟汤）</h3>',
  '<p>Turtle Soup 是<strong>专门猎杀突破交易者</strong>的模型：价格突破一个明显的前低（或前高），把追突破的人和他们的止损一起吃掉，然后迅速反向。</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">Turtle Soup（看涨版）</p><span class="concept-en">Turtle Soup</span><p>价格跌破一个<strong>明显的、被很多人盯着的前低</strong>，收在下方或短暂收在下方，随后<strong>一根强势 K 线收回到前低上方</strong>——这就是入场触发。止损放在新低之外。</p></div>',
  '<div class="concept"><p class="concept-term">它与普通扫荡的区别</p><span class="concept-en">Turtle Soup vs Sweep</span><p>扫荡泛指任何刺穿；<strong>Turtle Soup 特指刺穿一个所有人都看得见的位置</strong>。越明显的位置，被猎杀的价值越高，这也是它比普通扫荡更可靠的原因。</p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">必须有"收回"这个动作</p><p>跌破之后<strong>继续跌</strong>，那是 BOS 不是 Turtle Soup。<strong>判断标准是下一根或两根 K 线能否收回到被破的位置内侧</strong>——收不回来就别接刀。</p></div></div>',

  '<h3>3. Silver Bullet 模型</h3>',
  '<p>把 Silver Bullet 窗口和 Judas 结构绑在一起，就得到一个完整的日内模型：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">只在三个窗口内找</p><p>03:00–04:00、10:00–11:00、14:00–15:00（纽约时间）。窗口外出现同样形态，权重降级。</p></div>',
  '<div class="step"><p class="step-title">窗口内出现 FVG 级联</p><p>连续同向的 FVG 说明交付状态已经切换（CISD），方向由此确定。</p></div>',
  '<div class="step"><p class="step-title">回踩第一个 FVG 进场</p><p>常用做法是挂在 FVG 的 CE（中點）而不是边缘，成交率更高。</p></div>',
  '<div class="step"><p class="step-title">目标：下一个外部流动性</p><p>前一日高/低、周高/低，或当日区间的对面。</p></div>',
  '</div>',

  '<h3>4. Unicorn 模型</h3>',
  '<p><strong>Unicorn（独角兽）</strong>是" breaker + FVG 同时出现"的组合：价格扫掉一个流动性之后，用一个 FVG 反向突破了一个 OB，于是那个 OB 变成 Breaker，而 Breaker 内部正好叠着一个 FVG。两个入场理由落在同一个价格区间，因此被认为质量很高。</p>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">为什么叠加有意义</p><p>单一理由的入场，失效时你不知道是理由错了还是运气差；<strong>两个独立理由落在同一区间，至少说明那个位置被多种方法同时标注</strong>。这不是保证，只是把噪音过滤掉一层。</p></div></div>',

  '<h3>5. 2022 Model：把前面的东西串起来</h3>',
  '<p>ICT 在 2022 年的内容里给了一个相对固定的执行框架，通常被称为 2022 Model。它的骨架就是本站点前面几节的串联：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">高周期定 DOL</p><p>日线 / 4 小时上，价格被上方还是下方的流动性吸引？定下今天只做一个方向。</p></div>',
  '<div class="step"><p class="step-title">等 Killzone 与 Judas</p><p>开盘后先让价格扫掉一侧流动性，别在扫荡之前动手。</p></div>',
  '<div class="step"><p class="step-title">MSS + CISD 双确认</p><p>结构上反向破位，且 FVG 的交付方向同时切换。<strong>两个都出现才算确认。</strong></p></div>',
  '<div class="step"><p class="step-title">回踩 OTE / FVG / OB</p><p>进场必须落在<strong>折价区</strong>做多、<strong>溢价区</strong>做空。位置不对就放弃这笔。</p></div>',
  '<div class="step"><p class="step-title">止损在扫荡极值外，目标在对面流动性</p><p>中途出现反向 MSS 就离场，不等目标。</p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">不要把模型当 checklist 硬套</p><p>以上每一步都是<strong>必要条件的描述，不是充分条件</strong>。五个条件全满足依然会亏——因为它们是提高概率的工具，不是确定性。真正决定长期结果的是下一步：止损多远、仓位多大、错了认不认。</p></div></div>',
  '',

  // ============================ 7. 多周期对齐 ============================
  '<h2 id="alignment">多周期对齐</h2>',
  '<p>ICT 里绝大多数"看起来都对但一直亏"的问题，根源不在形态，而在<strong>周期错位</strong>：你用 1 分钟的信号去赌一个日线级别的目标，或者用日线的方向在 1 分钟上找入场。这一节讲怎么把它们排好。</p>',

  '<h3>1. 三层周期的分工</h3>',
  '<div class="table-wrap"><table><thead><tr><th>层级</th><th>常用周期</th><th>回答什么</th><th>不能用来做什么</th></tr></thead><tbody>',
  '<tr><th class="rowhead">高周期 HTF</th><td>日线 / 4 小时</td><td>定 bias 与 DOL：今天只做一个方向</td><td>不能用来找入场点（太粗）</td></tr>',
  '<tr><th class="rowhead">中周期 ITF</th><td>1 小时 / 15 分钟</td><td>定结构：摆动结构与关键流动性在哪</td><td>不能用来定当日方向（噪音多）</td></tr>',
  '<tr><th class="rowhead">低周期 LTF</th><td>5 分钟 / 1 分钟</td><td>定触发：MSS、CISD、FVG 回踩</td><td>不能用来定 bias（完全是噪音）</td></tr>',
  '</tbody></table></div>',
  '<p>一句话：<strong>高周期说去哪，中周期说走没走，低周期说什么时候上车。</strong>任何一层越权，都会产生"信号很漂亮但一直亏"的结果。</p>',

  '<h3>2. Top-down 实操清单</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">日线：画摆动结构与外部流动性</p><p>标出最近的关键高低点、前一日的 高/低。<strong>回答：价格想去上面还是下面？</strong>写下来，今天不改。</p></div>',
  '<div class="step"><p class="step-title">4 小时 / 1 小时：找当前处在哪个相位</p><p>是在 Accumulation 还是 Manipulation？如果 Manipulation 还没发生，就别急着找入场。</p></div>',
  '<div class="step"><p class="step-title">15 分钟：标出要被扫的流动性</p><p>亚洲盘高低点、等高点、明显的内部摆动点。<strong>下一步等它们被扫。</strong></p></div>',
  '<div class="step"><p class="step-title">5 分钟 / 1 分钟：只等两个动作</p><p>扫荡 + MSS。其余所有形态一律忽略。</p></div>',
  '<div class="step"><p class="step-title">回到 5 分钟找 PD 阵列</p><p>把 FVG / OB / OTE 画在<strong>折价区（做多）</strong>里，挂单等回踩。</p></div>',
  '</div>',

  '<h3>3. 常用周期组合</h3>',
  '<div class="table-wrap"><table><thead><tr><th>风格</th><th>HTF / ITF / LTF</th><th>持仓时间</th><th>备注</th></tr></thead><tbody>',
  '<tr><th class="rowhead">日内 scalping</th><td>1H / 15M / 1M</td><td>几分钟到一小时</td><td>最难，要求全程盯盘</td></tr>',
  '<tr><th class="rowhead">日内波段</th><td>1D / 1H / 5M</td><td>数小时到当日收盘</td><td>最主流，Killzone 用得最顺</td></tr>',
  '<tr><th class="rowhead">持仓数日</th><td>1W / 1D / 1H</td><td>2–5 个交易日</td><td>时间窗口的权重下降，结构权重上升</td></tr>',
  '</tbody></table></div>',

  '<h3>4. 对齐时最容易犯的错</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">在低周期上定方向</p><p>1 分钟图上数出来的 MSS 每小时能出现十几次。<strong>方向必须来自高周期</strong>，低周期只负责触发。</p></div>',
  '<div class="concept"><p class="concept-term">在高周期上找入场</p><p>日线 FVG 的止损宽度会让仓位小到没有意义。<strong>入场必须在你能承受止损的那一层。</strong></p></div>',
  '<div class="concept"><p class="concept-term">跨周期混用流动性</p><p>用日线的目标配 1 分钟的止损，盈亏比看起来完美，实际胜率极低。<strong>目标与止损必须来自同一层结构。</strong></p></div>',
  '<div class="concept"><p class="concept-term">周期之间没有倍数关系</p><p>用 1H 定方向却在 3M 找入场，两层之间没有清晰的包含关系，画出来的东西互相矛盾。<strong>建议相邻两层保持 4–6 倍。</strong></p></div>',
  '<div class="concept"><p class="concept-term">盘中改 bias</p><p>日线定下的方向，被一根 5 分钟 K 线推翻。<strong>如果一天里 bias 变两次，说明你压根没定过。</strong></p></div>',
  '</div>',
  '',

  // ============================ 8. 进场、止损与目标 ============================
  '<h2 id="entries">进场、止损与目标</h2>',
  '<p>这一节回答三个必须在下单前写出来的数字：<strong>在哪进、止损放哪、目标看哪</strong>。三者写不出来就不要下单——这条规则和价格行为学里的完全一致。</p>',

  '<h3>1. 入场触发的三种形式</h3>',
  '<div class="table-wrap"><table><thead><tr><th>触发方式</th><th>怎么做</th><th>优点</th><th>代价</th></tr></thead><tbody>',
  '<tr><th class="rowhead">限价挂单在 PD 阵列</th><td>事前把单挂在 FVG 的 CE 或 OTE 区间，被动等回踩</td><td>止损最近，盈亏比最好</td><td>强行情里常常挂不上，错过整波</td></tr>',
  '<tr><th class="rowhead">MSS 后的市价追入</th><td>确认结构转向后直接进</td><td>不会错过</td><td>进场价差、止损远，盈亏比最差</td></tr>',
  '<tr><th class="rowhead">CISD 触发</th><td>FVG 交付方向切换的那一刻进</td><td>比 MSS 早一步，位置更好</td><td>假切换多，需要 FVG 足够明显</td></tr>',
  '</tbody></table></div>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">先定止损，再倒推用哪种触发</p><p>反过来想更清楚：<strong>止损必须是"我错了"的位置（结构失效点），不能被入场方式倒过来拉宽或压窄。</strong>三种触发里选哪个，只取决于当前哪个止损距离你可以接受。</p></div></div>',

  '<h3>2. 止损放哪</h3>',
  '<p>ICT 的止损位置有明确的优先顺序，从上往下选：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">扫荡的极值之外</p><p>做多时放在被扫掉的那个低点下方。<strong>这是最标准的一档</strong>——那里是"扫荡失败"的客观定义点。</p></div>',
  '<div class="step"><p class="step-title">触发 MSS 的那根 K 线极值外</p><p>比上一档更近，适合回踩进场已经很深的情形。</p></div>',
  '<div class="step"><p class="step-title">入场 FVG / OB 完全失效之外</p><p>最紧的一档，只在极干净的形态上用。<strong>太紧的止损会被正常噪音扫掉。</strong></p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">止损不是"我能亏多少"</p><p>把止损设在你能接受的金额上，是最常见也最致命的错误。<strong>止损必须设在结构失效的位置，然后用仓位去匹配你能亏的钱</strong>——顺序反了，就会不断被正常波动扫出去。</p></div></div>',

  '<h3>3. 目标怎么定</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">对面流动性（首选）</p><span class="concept-en">Opposing Liquidity</span><p>做多时目标是上方的 BSL——前高、等高点、前一日高。<strong>这是 ICT 最正宗的止盈逻辑</strong>：价格从 SSL 出发，去 BSL。</p></div>',
  '<div class="concept"><p class="concept-term">固定盈亏比</p><span class="concept-en">Fixed R:R</span><p>2R 或 3R 机械出场。<strong>流动性目标不明确时的兜底方案</strong>，缺点是经常在行情还有空间时就下车。</p></div>',
  '<div class="concept"><p class="concept-term">分批：1R 减半 + 余量奔目标</p><span class="concept-en">Partial + Runner</span><p>到 1R 平一半并挪到保本，剩余仓位持有到对面流动性。<strong>实盘最常用的折中</strong>，代价是平均盈利略低于全仓奔目标。</p></div>',
  '<div class="concept"><p class="concept-term">反向 MSS 出场</p><span class="concept-en">MSS Exit</span><p>不论目标到没到，只要出现反向 MSS 就离场。<strong>它优先于价格目标</strong>——结构变了，理由就没了。</p></div>',
  '</div>',

  '<h3>4. 失效条件：下单前必须写的第四个数</h3>',
  '<p>价格目标之外，还要预先写下一个"<strong>我错了</strong>"的客观标准。在 ICT 里它通常是下面之一：</p>',
  '<ul>',
  '<li>价格<strong>实体收在扫荡极值的外侧</strong>并继续推进——说明那不是扫荡，是 BOS。</li>',
  '<li>回踩时<strong>把入场用的 FVG / OB 一次性贯穿</strong>而不反弹——说明那个位置根本没有订单。</li>',
  '<li>出现<strong>与你持仓方向相同的反向 MSS</strong>——结构已经不站在你这边。</li>',
  '<li>时间失效：Killzone 结束仍未启动，或者走成了来回震荡——<strong>时间到了没动，本身就是一种答案。</strong></li>',
  '</ul>',
  '<div class="callout danger"><div class="callout-body"><p class="callout-title">没有失效条件的体系无法管理风险</p><p>ICT 的术语非常擅长解释已经发生的事，这恰恰是它的危险之处：<strong>你总能事后给任何走势找到一个说法。</strong>唯一能对抗这种事后合理化的，是下单前写死的那条失效条件。</p></div></div>',
  '',

  // ============================ 9. 完整交易流程 ============================
  '<h2 id="workflow">完整交易流程</h2>',
  '<p>把前面所有内容压成一张执行表。它分三段：盘前、盘中、盘后。</p>',

  '<h3>1. 盘前 10 分钟</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">高周期定 DOL</p><p>在日线 / 4 小时上找外部流动性：价格被上方还是下方吸引？<strong>定下今天只做一个方向，写下来。</strong></p></div>',
  '<div class="step"><p class="step-title">标记要被扫的流动性</p><p>亚洲盘高低点、前一日高低、等高点/等低点。标 2–4 个就够，别标满屏。</p></div>',
  '<div class="step"><p class="step-title">算出今天的 Killzone 时间</p><p>换算到你的本地时区，并确认夏令时。<strong>把三个 Silver Bullet 窗口写进日历。</strong></p></div>',
  '<div class="step"><p class="step-title">画好 PD 阵列待用</p><p>在折价区（做多）里标出 FVG / OB / OTE，提前挂好限价单。</p></div>',
  '</div>',

  '<h3>2. 盘中：只做三件事</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">等扫荡</p><p>价格有没有触到你标记的位置？没有就什么都不做。</p></div>',
  '<div class="step"><p class="step-title">等 MSS / CISD</p><p>扫荡之后结构有没有反向破位？FVG 的交付方向有没有切换？<strong>没有确认就不动手。</strong></p></div>',
  '<div class="step"><p class="step-title">回踩进场，写好三个数字</p><p>入场、止损、目标。写完立即挂单，然后离开屏幕。</p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">窗口外不做</p><p>不在 Killzone 内出现的形态，权重降级甚至直接忽略。<strong>ICT 的一半价值在这个"不做"上</strong>——大部分人的亏损来自窗口外的随手单。</p></div></div>',

  '<h3>3. 盘后复盘</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">先看自己有没有按流程走</p><p>把当天的单子对照上面三件事：扫荡确认了吗？MSS 有了吗？位置在折价区吗？<strong>先问执行，再问结果。</strong></p></div>',
  '<div class="step"><p class="step-title">记录 DOL 判断对不对</p><p>你早上定的方向，当天价格最终去了哪？<strong>只统计这个，比统计盈亏更能反映水平。</strong></p></div>',
  '<div class="step"><p class="step-title">记录每个 Killzone 实际发生了什么</p><p>有没有 Judas？扫的是哪一侧？<strong>积累 20–30 个交易日，你会得到属于自己的时段统计</strong>，比任何通用说法都准。</p></div>',
  '</div>',
  '',

  // ============================ 10. 术语对照 ============================
  '<h2 id="terms">术语对照</h2>',
  '<p>ICT 的术语体系高度自创，这是它最大的入门门槛。好消息是：<strong>绝大多数术语在别的体系里都有对应物，而且往往更好懂。</strong>下面这张表可以当翻译器用。</p>',

  '<h3>1. ICT ↔ SMC</h3>',
  '<div class="table-wrap"><table><thead><tr><th>ICT 术语</th><th>SMC 里的叫法</th><th>是不是同一个东西</th></tr></thead><tbody>',
  '<tr><th class="rowhead">FVG</th><td>FVG / Imbalance / 公允价值缺口</td><td>完全一样</td></tr>',
  '<tr><th class="rowhead">Order Block</th><td>Order Block（订单块）</td><td>几乎一样，定义细节略有差异</td></tr>',
  '<tr><th class="rowhead">Breaker</th><td>Breaker Block</td><td>一样</td></tr>',
  '<tr><th class="rowhead">MSS / CHoCH</th><td>CHoCH / MSB</td><td>一样，命名混乱是两大阵营共同的问题</td></tr>',
  '<tr><th class="rowhead">BOS</th><td>BOS</td><td>一样</td></tr>',
  '<tr><th class="rowhead">Liquidity Sweep</th><td>Liquidity Grab / Sweep</td><td>一样</td></tr>',
  '<tr><th class="rowhead">Premium / Discount</th><td>Premium / Discount</td><td>一样</td></tr>',
  '<tr><th class="rowhead">OTE</th><td>OTE（62–79%）</td><td>一样</td></tr>',
  '<tr><th class="rowhead">Killzone</th><td>交易时段（伦敦/纽约开盘）</td><td><strong>SMC 通常不强调，这是两者最大差异</strong></td></tr>',
  '<tr><th class="rowhead">Power of 3 / AMD</th><td>无直接对应</td><td><strong>ICT 独有</strong></td></tr>',
  '</tbody></table></div>',

  '<h3>2. ICT ↔ 威科夫 / 价格行为学</h3>',
  '<div class="table-wrap"><table><thead><tr><th>ICT 术语</th><th>威科夫</th><th>价格行为学（Al Brooks）</th></tr></thead><tbody>',
  '<tr><th class="rowhead">Liquidity Sweep</th><td>Spring / Upthrust</td><td>失败突破 / 假突破</td></tr>',
  '<tr><th class="rowhead">MSS</th><td>结构反转确认</td><td>主要趋势反转（MTR）的确认步骤</td></tr>',
  '<tr><th class="rowhead">AMD</th><td>吸筹 → 派发的过程</td><td>无直接对应（Brooks 不看时钟）</td></tr>',
  '<tr><th class="rowhead">FVG 回补</th><td>无直接对应</td><td>缺口回补（Gap Fill）</td></tr>',
  '<tr><th class="rowhead">OTE 62–79%</th><td>无直接对应</td><td>50% 回调 / 测量移动的一半</td></tr>',
  '<tr><th class="rowhead">外部流动性</th><td>无直接对应</td><td>前高前低 / 磁铁位</td></tr>',
  '</tbody></table></div>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">换个名字往往就懂了</p><p>如果你在某个 ICT 术语上卡住，先去威科夫或价格行为学里找对应物。<strong>同一个现象在三个体系里被命名了三次</strong>，而另外两个的命名通常更朴素、更容易和价格本身对上。</p></div></div>',

  '<h3>3. 最容易混淆的四组词</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">BOS vs MSS</p><p>都是"打破了某个摆动点"。<strong>顺着趋势的那次是 BOS（延续），逆着的那次是 MSS（转折）。</strong>形态相同，含义相反。</p></div>',
  '<div class="concept"><p class="concept-term">Sweep vs BOS</p><p>都突破了同一个位置。<strong>区别在于收没收回来</strong>：收回来是 Sweep，站稳外侧继续走是 BOS。</p></div>',
  '<div class="concept"><p class="concept-term">Breaker vs Mitigation Block</p><p>都被反向突破后角色反转。<strong>Breaker 强调"原支撑变阻力"，Mitigation 强调"回到未成交订单的起点"</strong>，实盘常常指同一个区域。</p></div>',
  '<div class="concept"><p class="concept-term">Internal vs External Liquidity</p><p><strong>内部是路径（FVG、OB），外部是目标（前高前低）。</strong>混淆这两者会导致你既在追目标又在等回踩，逻辑自相矛盾。</p></div>',
  '</div>',
  '',

  // ============================ 11. 争议与误区 ============================
  '<h2 id="pitfalls">争议与误区</h2>',
  '<h3>1. 关于 ICT 的争议，需要诚实说明</h3>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">这不是一套有统计验证的体系</p><p>ICT 的术语体系高度自创，原始材料规模庞大且前后版本有变化，缺乏学术意义上的统计验证。<strong>它对时间窗口的定义尤其难以证伪</strong>——因为总能事后找到某个时段符合说法。请把它当作一套<em>观察框架</em>而不是物理定律。</p></div></div>',
  '<p>具体一点说，争议集中在三处：<strong>IPDA 不可证伪</strong>；<strong>Killzone 缺乏公开回测</strong>，且 ICT 本人给出的时间在不同年份有出入；<strong>术语定义松散</strong>，同一个 FVG 在不同教学片段里的取法不完全一致。这些都不代表 ICT 没用——它提供了很好的观察顺序——但意味着<strong>你必须自己做统计，不能拿它的结论当结论。</strong></p>',

  '<h3>2. 八个误区</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">术语堆砌，不理解流动性逻辑</p><p>背下 FVG、OB、Breaker 的名字很容易，但如果不理解"价格要去撮合订单"这个底层逻辑，就只是在自己画的线上做无效归因。</p></div>',
  '<div class="concept"><p class="concept-term">忽略时间只用价格</p><p>把 ICT 简化成"画 FVG 就进场"，等于丢掉了 ICT 最核心的那一半。<strong>脱离了 Killzone 的 FVG 价值大打折扣。</strong></p></div>',
  '<div class="concept"><p class="concept-term">把小周期当结构</p><p>在 1 分钟图上数出来的 MSS 多半只是噪音。结构必须在与交易周期相符或更高的周期上定义。</p></div>',
  '<div class="concept"><p class="concept-term">时区与夏令时混乱</p><p>Killzone 源于纽约时间，直接套用到国内时段而不换算，会系统性错位一小时。<strong>夏令时切换的那两周尤其容易出错。</strong></p></div>',
  '<div class="concept"><p class="concept-term">只做顺周期，不设失效条件</p><p>任何结构判断都需要一个"我错了"的客观标准。没有失效条件的体系无法管理风险。</p></div>',
  '<div class="concept"><p class="concept-term">把扫荡当反转</p><p>扫掉前低只是"可能"，<strong>MSS 才是"确认"</strong>。没有 MSS 就进场，等于在趋势燃料里做反向。</p></div>',
  '<div class="concept"><p class="concept-term">画满屏 FVG 和 OB</p><p>一段行情能划出十几个候选区，全划等于没划。<strong>只保留落在折价区（做多）/ 溢价区（做空）、且未被回补过的那一个。</strong></p></div>',
  '<div class="concept"><p class="concept-term">追最新术语</p><p>ICT 每隔一段时间就出新词。<strong>新词基本都是旧概念的重命名</strong>，把基础五个（结构、流动性、FVG、OB、Killzone）练熟，比追新词有用得多。</p></div>',
  '</div>',

  '<h3>3. 给自己加的三条防护</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">只挑一个模型，做满 50 笔再换</p><p>同时追五个模型的结果是每个都只懂一半。<strong>样本量不够，你分不清是模型不行还是自己不行。</strong></p></div>',
  '<div class="step"><p class="step-title">自己统计你的 Killzone</p><p>记录 20–30 个交易日里每个窗口实际发生了什么。<strong>你自己的统计，比任何通用说法都可靠。</strong></p></div>',
  '<div class="step"><p class="step-title">把失效条件写在下单之前</p><p>写下来这个动作会过滤掉大部分冲动交易，<strong>因为它强迫你把想法变成可证伪的句子</strong>。</p></div>',
  '</div>',
];

/* -------------------- 执行替换 -------------------- */
const src = fs.readFileSync(path, 'utf8');
const ictIdx = src.indexOf("    id: 'ict',");
if (ictIdx < 0) { console.error('找不到 ICT 页面对象'); process.exit(1); }
const cStart = src.indexOf('    chapters: [', ictIdx);
const bStart = src.indexOf('    body: [', cStart);
const bEnd = src.indexOf("    ].join(''),", bStart);
if (cStart < 0 || bStart < 0 || bEnd < 0 || bStart > bEnd) {
  console.error('定位失败', { cStart, bStart, bEnd }); process.exit(1);
}

function jsq(s) {
  if (s.indexOf("'") === -1) return "'" + s + "'";
  return JSON.stringify(s);
}

let out = '    chapters: [\n';
CHAPS.forEach(function (c) {
  out += "      { id: '" + c.id + "', label: '" + c.label + "' },\n";
});
out += '    ],\n';
out += '    body: [\n';
BODY.forEach(function (s) {
  if (s === '') { out += '\n'; return; }
  out += '      ' + jsq(s) + ',\n';
});

const next = src.slice(0, cStart) + out + src.slice(bEnd);
fs.writeFileSync(path, next);
console.log('替换完成： chapters ' + CHAPS.length + ' 条， body ' + BODY.filter(function (s) { return s !== ''; }).length + ' 段');
console.log('原长度 ' + src.length + ' → 新长度 ' + next.length);
