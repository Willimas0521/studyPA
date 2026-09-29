/* 一次性脚本：在「实盘分析」组下新增三个专题页面 —— 突破 / 跌破 / 震荡区间。
   用法： node tests/_add_topics.js
   改动三处：① 插入 var breakout / var breakdown / var range  ② pages 加入  ③ nav 组扩展
   内容定位：只讲实操闭环（标位 → 判定 → 进场 → 止损目标 → 失败处理 → 持有 → 清单复盘），
            不重复价格行为学「突破」「交易区间」两章已讲过的识别与理论。 */

const fs = require('fs');
const path = 'data/theories.js';

/* ==================================================================== */
/* 一、突破专题                                                          */
/* ==================================================================== */
const BREAKOUT_CHAPS = [
  { id: 'spots', label: '盘前：把突破位标出来' },
  { id: 'trigger', label: '那一刻：什么算成立' },
  { id: 'entry', label: '进场：三种方式怎么选' },
  { id: 'risk', label: '止损与目标' },
  { id: 'fail', label: '失败突破（最重要）' },
  { id: 'hold', label: '突破之后怎么拿' },
  { id: 'checklist', label: '清单与复盘' },
];

const BREAKOUT_BODY = [
  '<p class="lede">突破是三种状态里持续时间最短、看似最容易赚钱、实际最容易亏钱的一种。价格行为学那一章讲过<em>怎么识别突破、怎么评估强度</em>；这里只讲剩下的半件事：<strong>从标出位置到收盘离场，手具体该往哪放</strong>——包括最关键的那一节，失败突破怎么尽早认出来。</p>',
  '',

  '<h2 id="spots">盘前：把突破位标出来</h2>',
  '<h3>1. 什么样的位置值得标</h3>',
  '<p>突破位不是"看起来要涨的地方"，而是<strong>多空双方已经反复交手过的价格</strong>。符合下面任一条才值得标：</p>',
  '<div class="table-wrap"><table><thead><tr><th>类型</th><th>长什么样</th><th>为什么会起作用</th></tr></thead><tbody>',
  '<tr><th class="rowhead">区间上沿</th><td>至少两次触及未能上去</td><td>那里堆着卖单，吃掉之后就没人挡了</td></tr>',
  '<tr><th class="rowhead">前高 / 摆动高点</th><td>最近一个明显的波段高点</td><td>上方有空头止损与突破买单</td></tr>',
  '<tr><th class="rowhead">收敛末端</th><td>K 线实体越来越小、波动越来越窄</td><td>双方都不肯退，波动即将放大</td></tr>',
  '<tr><th class="rowhead">等高点</th><td>一排几乎水平的高点</td><td>一批止损整齐堆在同一价位</td></tr>',
  '</tbody></table></div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">标 2–3 个就够</p><p>标满屏突破位的结果，是价格无论走到哪你都能说"我早就标过了"。<strong>只保留最显眼、被测试过最多次的那两三个。</strong></p></div></div>',

  '<h3>2. 提前写好两套预案</h3>',
  '<p>突破的方向<strong>不该由你预测</strong>——短期方向的判断准确率接近抛硬币。盘前该做的是把两个方向都准备好：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">向上破：在哪进、止损放哪、目标看哪</p><p>三个数字写下来。</p></div>',
  '<div class="step"><p class="step-title">向下破：同样三个数字</p><p>尤其要写下"破了之后我是否反手"，而不是临场决定。</p></div>',
  '<div class="step"><p class="step-title">接受第一次大概率失败</p><p>把第一次突破当成<strong>信号</strong>，而不是当成机会。这条能省掉很多钱。</p></div>',
  '</div>',
  '',

  '<h2 id="trigger">那一刻：什么算成立</h2>',
  '<h3>1. 收破才算，影线不算</h3>',
  '<p>唯一普适的标准：<strong>要有一根 K 线的实体收在位置之外，才算突破成立。</strong>影线刺穿只是试探，它恰恰说明对方还在反抗。</p>',
  '<div class="callout danger"><div class="callout-body"><p class="callout-title">最常见的亏钱动作</p><p>看到影线刺穿就追进去，理由是"感觉要破了"。<strong>影线是拒绝的证据，不是接受的证据。</strong>等收盘，最多损失一段价格，但能过滤掉绝大多数假突破。</p></div></div>',

  '<h3>2. 成立度分三级</h3>',
  '<div class="table-wrap"><table><thead><tr><th>级别</th><th>看到什么</th><th>怎么处理</th></tr></thead><tbody>',
  '<tr><th class="rowhead">试探</th><td>影线刺穿，实体仍在内侧</td><td>不动手，继续观察</td></tr>',
  '<tr><th class="rowhead">成立</th><td>一根实体收在外侧，但后续还没跟上</td><td>可以进，仓位减半，止损放在突破棒另一端</td></tr>',
  '<tr><th class="rowhead">确认</th><td>连续两到三根同向趋势棒，回撤浅、K 线不重叠</td><td>标准仓位，按测量移动定目标</td></tr>',
  '</tbody></table></div>',
  '<p>三级对应三种仓位，而不是三种信号。<strong>试探级不进场，成立级半仓，确认级满仓</strong>——这样即便方向错了，损失也集中在你最不确定的那一档之外。</p>',

  '<h3>3. 这几种情况不算突破</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">只有一根大棒但没有后续</p><p>单根大阳线冲上去，第二根立刻回到位置内侧。<strong>孤证不成立</strong>，它更可能是流动性扫荡。</p></div>',
  '<div class="concept"><p class="concept-term">突破时成交量没跟上</p><p>价格上去了但量没放大，说明没有新的资金推动，只是卖压暂时消失。</p></div>',
  '<div class="concept"><p class="concept-term">突破后立刻深度回撤</p><p>回撤超过突破段的一半，强度就要大打折扣。<strong>真正的突破不会马上把利润还回去。</strong></p></div>',
  '<div class="concept"><p class="concept-term">位置本身被测试过太多次</p><p>一个被碰了五六次的边界，即便破了也常常走不远——那里的订单早就被消耗得差不多了。</p></div>',
  '</div>',
  '',

  '<h2 id="entry">进场：三种方式怎么选</h2>',
  '<div class="table-wrap"><table><thead><tr><th>方式</th><th>具体动作</th><th>优点</th><th>代价</th><th>适合</th></tr></thead><tbody>',
  '<tr><th class="rowhead">突破瞬间追</th><td>实体收破的那一刻市价进</td><td>不会错过强突破</td><td>进场价最差、止损最远</td><td>确认级信号、强趋势</td></tr>',
  '<tr><th class="rowhead">等第一次回踩</th><td>突破位上方挂限价，等价格回来测试</td><td>止损近、盈亏比最好</td><td>强突破里常常挂不上</td><td>成立级信号、有节奏的推进</td></tr>',
  '<tr><th class="rowhead">等二次突破</th><td>第一次回踩后再创新高时进</td><td>过滤掉大部分假突破</td><td>少赚第一段</td><td>背景复杂、真假难辨时</td></tr>',
  '</tbody></table></div>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">先定止损再选方式</p><p>顺序反了就会出问题：<strong>止损必须是"我错了"的结构位置，不能被进场方式倒过来拉宽或压窄。</strong>三种方式里选哪个，只取决于哪一种的止损距离是这个仓位能承受的。</p></div></div>',
  '<h3>三种方式的实盘取舍</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">紧通道式强突破 → 追</p><p>回撤只有一两根 K 线，等回踩会一路看着它涨。<strong>这时候追的代价小于错过的代价。</strong></p></div>',
  '<div class="step"><p class="step-title">有节奏的推进 → 等回踩</p><p>价格规律地回撤到突破位，挂单等着就行。<strong>这是最舒服的一档。</strong></p></div>',
  '<div class="step"><p class="step-title">背景矛盾时 → 等二次</p><p>高周期不支持但低周期很漂亮，<strong>用二次突破换取更高的可靠性。</strong></p></div>',
  '</div>',
  '',

  '<h2 id="risk">止损与目标</h2>',
  '<h3>1. 止损的三档</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">突破棒的另一端（最紧）</p><p>止损放在突破 K 线的低点下方。<strong>只用于极干净的成立级信号</strong>，缺点是容易被正常噪音扫掉。</p></div>',
  '<div class="step"><p class="step-title">突破位下方（最标准）</p><p>价格回到突破位内侧，说明突破失败。<strong>这是最常用的那一档。</strong></p></div>',
  '<div class="step"><p class="step-title">区间另一侧（最宽）</p><p>把止损放在整个区间的下沿。<strong>只在区间很窄、突破位离下沿不远时用</strong>，否则止损太远会压垮盈亏比。</p></div>',
  '</div>',

  '<h3>2. 目标：三种取法</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">区间投影</p><span class="concept-en">Range Projection</span><p>目标 = 突破点 + 区间高度。<strong>最常用，也是 80% 规则里那条"真正的突破会走出等于区间高度的测量移动"。</strong></p></div>',
  '<div class="concept"><p class="concept-term">前高 / 前低</p><span class="concept-en">Prior Swing</span><p>直接把上一个波段高点当目标。<strong>更保守，适合背景不干净时。</strong></p></div>',
  '<div class="concept"><p class="concept-term">分批：一半在测量移动，一半奔前高</p><span class="concept-en">Partial Targets</span><p>实盘最常用的折中。<strong>先锁定一部分利润，剩下的交给结构。</strong></p></div>',
  '</div>',

  '<h3>3. 盈亏比不达标怎么办</h3>',
  '<p>算出盈亏比不到 1.5 倍，通常不是"这笔不能做"，而是<strong>进场位置选错了</strong>：你追在了突破之后的第三根 K 线上。这时候正确动作是<strong>放弃这一笔，等第一次回踩</strong>，而不是降低盈亏比要求硬做。</p>',
  '',

  '<h2 id="fail">失败突破（最重要）</h2>',
  '<p>突破交易里真正决定长期结果的，不是你抓到了几次真突破，而是<strong>失败的那几次你认得多快</strong>。</p>',

  '<h3>1. 怎么尽早认出失败</h3>',
  '<div class="table-wrap"><table><thead><tr><th>信号</th><th>看到什么</th><th>说明什么</th></tr></thead><tbody>',
  '<tr><th class="rowhead">收回位内</th><td>实体重新收在突破位内侧</td><td>最直接的一条，突破已经不成立</td></tr>',
  '<tr><th class="rowhead">跟进缺失</th><td>突破后连续两三根小实体、互相重叠</td><td>没有新资金推动</td></tr>',
  '<tr><th class="rowhead">回撤过深</th><td>回撤超过突破段的一半</td><td>获利盘在离场，动能不足</td></tr>',
  '<tr><th class="rowhead">时间失效</th><td>突破后长时间横着不动</td><td>市场不认可这个理由</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 失败的三种结局</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">回到区间继续震荡（最常见）</p><p>假突破后价格回到区间内，一切照旧。<strong>这是默认结局</strong>，所以突破失败后第一反应应该是"什么都没发生"，而不是"要反转了"。</p></div>',
  '<div class="concept"><p class="concept-term">反向突破</p><p>上破失败后跌破区间下沿，通常力度不小——<strong>因为上破时被套的多单会变成下跌的燃料。</strong></p></div>',
  '<div class="concept"><p class="concept-term">二次尝试成功</p><p>第一次失败，回到区间再蓄势，第二次真突破。<strong>这也是为什么"等二次突破"是一种有效策略。</strong></p></div>',
  '</div>',

  '<h3>3. 被套之后怎么办</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">先按止损走，不要等解套</p><p>止损位是你盘前定的"我错了"的位置，<strong>到了就执行，不讨价还价。</strong></p></div>',
  '<div class="step"><p class="step-title">不要在亏损中加仓</p><p>用一个新错误掩盖旧错误。<strong>趋势不会因为你的成本价而改变方向。</strong></p></div>',
  '<div class="step"><p class="step-title">反手要满足完整条件</p><p>上破失败不等于可以做空。<strong>要等反向的确认信号，而不是立刻反手</strong>——否则你会被来回扇两次。</p></div>',
  '</div>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">失败突破的价值</p><p>它其实是最好的信号之一：<strong>被套在极值上的那一批止损，是反向行情最干净的燃料。</strong>所以看到上破失败，正确动作不是立刻做空，而是把它标出来——等价格真的跌破下沿时，你会发现行情比平时顺畅得多。</p></div></div>',
  '',

  '<h2 id="hold">突破之后怎么拿</h2>',
  '<h3>1. 突破后的回踩是什么性质</h3>',
  '<p>突破后第一次回到突破位，是最关键的观察点：<strong>守住</strong>说明角色互换成立（阻力变支撑），可以持有甚至加；<strong>跌回内侧</strong>说明突破失败，按上一节处理。</p>',
  '<h3>2. 移动止损</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">跟着更高的低点走</p><p>上涨中把止损移到最新形成的更高低点下方。<strong>结构破了才出局，不会被单根大影线扫掉。</strong></p></div>',
  '<div class="step"><p class="step-title">或跟着 20 EMA 走</p><p>紧通道突破时回撤本来就浅，均线几乎贴着价格。<strong>两种方法选一个，不要混用。</strong></p></div>',
  '</div>',
  '<h3>3. 什么时候止盈</h3>',
  '<ul>',
  '<li>到了你盘前算出的测量移动目标——<strong>不要因为"还能再涨"而继续持有。</strong></li>',
  '<li>出现反向确认结构（更低的低点 / 更低的高点）——无论到没到目标都走。</li>',
  '<li>推进明显失速：连续几根 K 线重叠、实体变小、回撤变深。</li>',
  '</ul>',
  '',

  '<h2 id="checklist">清单与复盘</h2>',
  '<h3>1. 突破交易检查清单</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">盘前标出 2–3 个突破位</p><p>并写好上下两个方向的三个数字。</p></div>',
  '<div class="step"><p class="step-title">等实体收破，不看影线</p><p>影线是拒绝的证据。</p></div>',
  '<div class="step"><p class="step-title">判断成立度，决定仓位</p><p>成立级半仓、确认级满仓、试探级不动。</p></div>',
  '<div class="step"><p class="step-title">止损放在结构失效点</p><p>不是放在"我能亏多少"的地方。</p></div>',
  '<div class="step"><p class="step-title">盈亏比不到 1.5 倍就换位置</p><p>通常是追太高了，等回踩。</p></div>',
  '<div class="step"><p class="step-title">失败信号一出现就认</p><p>不讨价还价，不加仓摊平。</p></div>',
  '</div>',
  '<h3>2. 复盘时单独统计两个数</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">突破成功率</p><span class="concept-en">Breakout Success Rate</span><p>你参与的突破里，真正走出测量移动的比例。<strong>如果长期低于 40%，说明你进场太早</strong>——多半是影线阶段就动手了。</p></div>',
  '<div class="concept"><p class="concept-term">失败单的平均亏损</p><span class="concept-en">Average Loss on Failures</span><p>它应该接近你设定的 1R。<strong>如果明显超过 1R，说明你在止损位上讨价还价了。</strong></p></div>',
  '</div>',
];

/* ==================================================================== */
/* 二、跌破专题                                                          */
/* ==================================================================== */
const BREAKDOWN_CHAPS = [
  { id: 'spots', label: '盘前：把跌破位标出来' },
  { id: 'trigger', label: '那一刻：什么算成立' },
  { id: 'entry', label: '进场：三种方式怎么选' },
  { id: 'risk', label: '止损与目标' },
  { id: 'speed', label: '速度与滑点（跌破特有）' },
  { id: 'fail', label: '失败跌破与弹簧效应' },
  { id: 'checklist', label: '清单与复盘' },
];

const BREAKDOWN_BODY = [
  '<p class="lede">跌破是突破的镜像，但<strong>不能照抄突破的做法</strong>：下跌更快、滑点更大、更容易出现恐慌性的超调，也更常以"假摔"收场。这一页讲从标位到离场的完整动作，并单列两节只有跌破才有的东西——<strong>速度与滑点</strong>、<strong>失败跌破之后的弹簧效应</strong>。</p>',
  '',

  '<h2 id="spots">盘前：把跌破位标出来</h2>',
  '<h3>1. 什么样的位置值得标</h3>',
  '<div class="table-wrap"><table><thead><tr><th>类型</th><th>长什么样</th><th>为什么会起作用</th></tr></thead><tbody>',
  '<tr><th class="rowhead">区间下沿</th><td>至少两次触及未能下去</td><td>那里堆着买单，吃掉之后就没人托了</td></tr>',
  '<tr><th class="rowhead">前低 / 摆动低点</th><td>最近一个明显的波段低点</td><td>下方有多头止损与突破卖单</td></tr>',
  '<tr><th class="rowhead">等低点</th><td>一排几乎水平的低点</td><td>一批止损整齐堆在同一价位，扫起来最顺畅</td></tr>',
  '<tr><th class="rowhead">收敛末端</th><td>K 线实体越来越小、波动越来越窄</td><td>波动即将放大，只是方向未知</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 跌破位比突破位更容易被"专门去扫"</h3>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">下方止损更整齐</p><p>绝大多数人把止损放在前低下方，所以下方流动性往往比上方更集中、更容易被专门猎取。<strong>这意味着跌破里"假摔"的比例天然高于突破。</strong>盘前就要有这个预期，而不是事后觉得"怎么会这样"。</p></div></div>',

  '<h3>3. 提前写好两套预案</h3>',
  '<p>和突破一样，方向不由你预测。盘前写下的重点是<strong>向下破之后是否反手做反弹</strong>——这个决定必须在冷静时做出，不能等到价格已经砸下去、你正在恐惧中才想。</p>',
  '',

  '<h2 id="trigger">那一刻：什么算成立</h2>',
  '<h3>1. 收破才算，影线不算</h3>',
  '<p>标准与突破完全一致：<strong>要有一根 K 线的实体收在位置下方。</strong>但跌破有个额外提醒——下跌中的长下影线非常常见，它往往是<strong>插针扫止损</strong>，而不是真实的推进。</p>',

  '<h3>2. 成立度分三级</h3>',
  '<div class="table-wrap"><table><thead><tr><th>级别</th><th>看到什么</th><th>怎么处理</th></tr></thead><tbody>',
  '<tr><th class="rowhead">试探</th><td>长下影刺穿，实体收在上方</td><td>不动手，这常常是插针</td></tr>',
  '<tr><th class="rowhead">成立</th><td>一根实体收在下方，后续还没跟上</td><td>半仓，止损在跌破棒另一端</td></tr>',
  '<tr><th class="rowhead">确认</th><td>连续两到三根同向趋势棒，反弹浅、K 线不重叠</td><td>标准仓位，按测量移动定目标</td></tr>',
  '</tbody></table></div>',

  '<h3>3. 这几种情况不算跌破</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">单根插针后立刻收回</p><p>影线很长但收盘回到上方，且下一根继续往上。<strong>这就是典型的流动性扫荡，不是跌破。</strong></p></div>',
  '<div class="concept"><p class="concept-term">跌破时量能萎缩</p><p>价格下去了但成交没放大，说明只是买盘暂时缺席，不是卖压真的大。</p></div>',
  '<div class="concept"><p class="concept-term">跌破后立刻反弹超过一半</p><p>把跌幅还回一半以上，说明下面有人在接，强度存疑。</p></div>',
  '<div class="concept"><p class="concept-term">位置被测试过太多次</p><p>被碰了五六次的低点，即便破了也常常走不远。</p></div>',
  '</div>',
  '',

  '<h2 id="entry">进场：三种方式怎么选</h2>',
  '<div class="table-wrap"><table><thead><tr><th>方式</th><th>具体动作</th><th>优点</th><th>代价</th><th>适合</th></tr></thead><tbody>',
  '<tr><th class="rowhead">跌破瞬间追</th><td>实体收破的那一刻市价进</td><td>不会错过急跌</td><td>滑点最大，进场价最差</td><td>确认级信号、急跌行情</td></tr>',
  '<tr><th class="rowhead">等第一次反弹</th><td>跌破位下方挂限价，等价格回来测试</td><td>止损近、盈亏比最好</td><td>急跌里常常挂不上</td><td>成立级信号、有节奏的下跌</td></tr>',
  '<tr><th class="rowhead">等二次跌破</th><td>第一次反弹后再创新低时进</td><td>过滤掉大部分假摔</td><td>少赚第一段</td><td>跌破位被扫过一次后</td></tr>',
  '</tbody></table></div>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">跌破里"等反弹"的价值高于突破里"等回踩"</p><p>因为跌破的假摔比例更高、速度更快，<strong>追进去的滑点成本也更大</strong>。所以除非是明确的确认级信号，否则优先等反弹再进。</p></div></div>',
  '',

  '<h2 id="risk">止损与目标</h2>',
  '<h3>1. 止损的三档</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">跌破棒的上端（最紧）</p><p>止损放在跌破 K 线的高点上方。只用于极干净的成立级信号。</p></div>',
  '<div class="step"><p class="step-title">跌破位上方（最标准）</p><p>价格回到跌破位内侧，说明跌破失败。<strong>最常用。</strong></p></div>',
  '<div class="step"><p class="step-title">区间另一侧（最宽）</p><p>只在区间很窄时使用，否则止损太远会压垮盈亏比。</p></div>',
  '</div>',

  '<h3>2. 目标：三种取法</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">区间投影</p><span class="concept-en">Range Projection</span><p>目标 = 跌破点 − 区间高度。<strong>最常用的一档。</strong></p></div>',
  '<div class="concept"><p class="concept-term">前低</p><span class="concept-en">Prior Swing Low</span><p>直接把下一个波段低点当目标。<strong>更保守，适合背景不干净时。</strong></p></div>',
  '<div class="concept"><p class="concept-term">分批止盈</p><span class="concept-en">Partial Targets</span><p>一半在测量移动、一半奔前低。<strong>急跌行情里尤其推荐</strong>，因为下跌往往一步到位后快速反弹。</p></div>',
  '</div>',

  '<h3>3. 做空特有的三条风险</h3>',
  '<div class="callout danger"><div class="callout-body"><p class="callout-title">这些和做多不一样</p><p><strong>① 理论亏损无上限</strong>——价格可以一直涨，所以止损必须比做多时更严格地执行；<strong>② 容易遇到逼空</strong>——跌破失败后的反弹往往又快又猛；<strong>③ 有额外的持有成本</strong>——融资利息、借券费用会让长时间的持仓变贵。<strong>所以做空更依赖"快"，不依赖"拿"。</strong></p></div></div>',
  '',

  '<h2 id="speed">速度与滑点（跌破特有）</h2>',
  '<h3>1. 下跌比上涨快</h3>',
  '<p>这是市场的基本不对称：恐惧比贪婪跑得快。<strong>同样幅度的行情，下跌消耗的时间通常只有上涨的三分之一到一半。</strong>由此带来三个实操后果：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">市价单的滑点更大</p><p>急跌时买卖价差瞬间拉开，市价单的成交价可能比你想的差很多。<strong>跌破尽量用限价单或提前挂单，少用市价追。</strong></p></div>',
  '<div class="step"><p class="step-title">止损更容易被跳过</p><p>价格可能直接跳空越过你的止损位。<strong>所以做空的止损位要留出更多余地</strong>，紧贴着放会被跳空打穿，实际亏损远大于计划。</p></div>',
  '<div class="step"><p class="step-title">目标更容易一步到位</p><p>急跌常常一口气走完测量移动然后快速反弹。<strong>所以分批止盈在跌破里比在突破里更重要。</strong></p></div>',
  '</div>',

  '<h3>2. 恐慌性超调</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">超调（Overshoot）</p><span class="concept-en">Overshoot</span><p>急跌常常越过测量移动目标，把止损和追空的都扫一遍后才停。<strong>不要在超调段追空</strong>——那里风险最大、空间最小。</p></div>',
  '<div class="concept"><p class="concept-term">卖压高潮（Sell Climax）</p><span class="concept-en">Selling Climax</span><p>放量长阴之后往往出现快速反弹。<strong>它是跌势末端最常见的形态，见到就该减仓而不是加仓。</strong></p></div>',
  '</div>',

  '<h3>3. 跌破里的时间止损更短</h3>',
  '<p>突破后横着不动，你可以再等等；跌破后横着不动，<strong>通常意味着下面有人在持续接货</strong>，这时候拖着不动的危险性更高。经验规则：<strong>跌破进场后的观察窗口是突破的一半</strong>——没按预期走就先出来。</p>',
  '',

  '<h2 id="fail">失败跌破与弹簧效应</h2>',
  '<h3>1. 怎么尽早认出失败</h3>',
  '<div class="table-wrap"><table><thead><tr><th>信号</th><th>看到什么</th><th>说明什么</th></tr></thead><tbody>',
  '<tr><th class="rowhead">收回位内</th><td>实体重新收在跌破位上方</td><td>最直接的一条，跌破不成立</td></tr>',
  '<tr><th class="rowhead">长下影后强势反弹</th><td>插针后一根大阳收复全部跌幅</td><td>典型的止损扫荡</td></tr>',
  '<tr><th class="rowhead">反弹过半</th><td>把跌幅还回一半以上</td><td>下面买盘充足</td></tr>',
  '<tr><th class="rowhead">跌不动</th><td>价格贴着低点磨，成交量萎缩</td><td>卖压枯竭</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 弹簧效应：失败跌破里最值钱的形态</h3>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">Spring</p><p>价格跌破一个明显的低点、扫掉一片止损，然后<strong>迅速收回并向上推进</strong>——这就是威科夫的弹簧效应（Spring），ICT 里叫流动性扫荡后的 MSS，价格行为学里叫失败突破。<strong>三个体系给了它三个名字，但描述的是同一根 K 线。</strong></p></div></div>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">先扫荡：跌破明显低点</p><p>位置必须足够明显——越多人盯着，被扫的价值越高。</p></div>',
  '<div class="step"><p class="step-title">再收回：实体回到位内</p><p>这是关键动作。<strong>收不回来的跌破是真跌破，不是弹簧。</strong></p></div>',
  '<div class="step"><p class="step-title">等确认：反向打破最近结构</p><p>收回来还不够，还要看到更高的低点或反向的结构突破。<strong>弹簧的价值在于它提供了极近的止损位</strong>——就在那个被扫掉的低点下方。</p></div>',
  '</div>',

  '<h3>3. 被套在跌破里怎么办</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">按止损走，不摊平</p><p>做空的摊平尤其危险，因为理论亏损没有上限。</p></div>',
  '<div class="step"><p class="step-title">反手必须等确认</p><p>跌破失败不等于可以做多。<strong>要等收回 + 反向结构确认，两步缺一不可。</strong></p></div>',
  '<div class="step"><p class="step-title">把这次扫荡记下来</p><p>被扫掉的位置，往往就是下一波行情要去的地方。<strong>它是免费的地图。</strong></p></div>',
  '</div>',
  '',

  '<h2 id="checklist">清单与复盘</h2>',
  '<h3>1. 跌破交易检查清单</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">盘前标出 2–3 个跌破位</p><p>并预期假摔比例高于突破。</p></div>',
  '<div class="step"><p class="step-title">警惕长下影，等实体收破</p><p>下跌中的插针格外常见。</p></div>',
  '<div class="step"><p class="step-title">优先等反弹，少用市价追</p><p>急跌的滑点成本比上涨大得多。</p></div>',
  '<div class="step"><p class="step-title">止损留出跳空余地</p><p>贴太近会被跳空打穿。</p></div>',
  '<div class="step"><p class="step-title">见到卖压高潮就减仓</p><p>放量长阴之后常跟快速反弹。</p></div>',
  '<div class="step"><p class="step-title">时间止损比突破更短</p><p>跌破后不动，通常说明有人在接货。</p></div>',
  '</div>',
  '<h3>2. 复盘时单独统计两个数</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">假摔率</p><span class="concept-en">False Breakdown Rate</span><p>你参与的跌破里，收回位内的比例。<strong>如果长期高于 50%，说明你进场太早或位置选得太不明显。</strong></p></div>',
  '<div class="concept"><p class="concept-term">滑点成本</p><span class="concept-en">Slippage Cost</span><p>实际成交价与预期价的差，累计成 R 的倍数。<strong>跌破里这个数常常被忽略，但它可能吃掉整年的利润。</strong></p></div>',
  '</div>',
];

/* ==================================================================== */
/* 三、震荡区间专题                                                      */
/* ==================================================================== */
const RANGE_CHAPS = [
  { id: 'spot', label: '盘前：今天是不是区间日' },
  { id: 'types', label: '四种区间与各自的做法' },
  { id: 'edges', label: '边界交易怎么做' },
  { id: 'middle', label: '区间中部的禁忌' },
  { id: 'break', label: '区间终会结束' },
  { id: 'day', label: '震荡日的一天' },
  { id: 'checklist', label: '清单与复盘' },
];

const RANGE_BODY = [
  '<p class="lede">区间才是市场的默认状态——趋势是间歇性的，横盘是常态。价格行为学那一章讲过<em>怎么认出区间、区间有哪四种类型</em>；这里只讲剩下的那半件事：<strong>在确认自己正处在区间里之后，具体怎么活下来，以及怎么在它结束的那一刻站在正确的一边。</strong></p>',
  '',

  '<h2 id="spot">盘前：今天是不是区间日</h2>',
  '<h3>1. 三条当下可用的线索</h3>',
  '<p>区间只有在被打破之后才能被最终确认，所以盘前你只能拿到概率。以下三条满足越多越可信：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">K 线形态</p><p>实体普遍偏小、影线偏多、相邻 K 线大量重叠。<strong>重叠度是三项里最快的视觉线索。</strong></p></div>',
  '<div class="step"><p class="step-title">结构证据</p><p>至少看到两次向上失败和两次向下失败。一次失败可能是回调，<strong>两次才构成区间。</strong></p></div>',
  '<div class="step"><p class="step-title">你答不上来</p><p>问自己"如果必须持仓，做多还是做空"，答不上来就是区间。<strong>这条听起来不严谨，实际非常好用。</strong></p></div>',
  '</div>',

  '<h3>2. 和趋势回撤怎么区分</h3>',
  '<div class="table-wrap"><table><thead><tr><th>观察点</th><th>趋势中的回撤</th><th>震荡区间</th></tr></thead><tbody>',
  '<tr><th class="rowhead">高低点序列</th><td>仍有清晰的更高低点 / 更低高点</td><td>高低点乱序，来回穿插</td></tr>',
  '<tr><th class="rowhead">回撤深度</th><td>通常不超过前一段的 50%</td><td>经常深度回撤，来回覆盖</td></tr>',
  '<tr><th class="rowhead">K 线重叠</th><td>重叠少，趋势棒多</td><td>大量重叠，实体小</td></tr>',
  '<tr><th class="rowhead">你的感受</th><td>方向明确，只是等回踩</td><td>看不清，想砍仓</td></tr>',
  '</tbody></table></div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">感受这条线索其实很准</p><p>多数交易者感到最难受、最想砍仓的位置，常常就是区间中部。<strong>如果你正处在这种感受里，先怀疑自己是不是站在了区间中间</strong>，而不是怀疑自己的单子。</p></div></div>',
  '',

  '<h2 id="types">四种区间与各自的做法</h2>',
  '<div class="table-wrap"><table><thead><tr><th>类型</th><th>视觉特征</th><th>有效做法</th><th>最常见的错误</th></tr></thead><tbody>',
  '<tr><th class="rowhead">窄幅区间</th><td>实体极小、影线多、相邻 K 线几乎完全重叠</td><td><strong>什么都不做</strong>，等突破</td><td>在里面剥头皮，被来回磨损</td></tr>',
  '<tr><th class="rowhead">宽幅区间</th><td>上下沿距离大，来回有明确的腿</td><td><strong>边缘反向，双向都做</strong></td><td>当成趋势追，一路被扫</td></tr>',
  '<tr><th class="rowhead">收敛区间</th><td>高低点向内收拢，波动越来越小</td><td>准备突破，<strong>双向挂单</strong></td><td>提前猜方向</td></tr>',
  '<tr><th class="rowhead">扩张区间</th><td>波动越来越大，高低点向外扩张</td><td><strong>降低仓位或不做</strong></td><td>以为要突破了，结果只是变宽</td></tr>',
  '</tbody></table></div>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">先判类型，再谈做法</p><p>同样是"看起来在横"，窄幅和宽幅的做法<strong>几乎相反</strong>——一个让你什么都不做，一个让你来回做。<strong>判断出"这是区间"只是第一步，第二步才是钱。</strong></p></div></div>',
  '',

  '<h2 id="edges">边界交易怎么做</h2>',
  '<h3>1. 在边界进场的三个前提</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">位置被验证过</p><p>至少两次触及未能突破。<strong>第一次触及不算边界。</strong></p></div>',
  '<div class="step"><p class="step-title">有拒绝的形态</p><p>长影线、或者一根明显的反向 K 线。<strong>形态是"这里有人"的证据。</strong></p></div>',
  '<div class="step"><p class="step-title">止损能放在边界外侧</p><p>如果止损距离大到压垮盈亏比，就别做。</p></div>',
  '</div>',

  '<h3>2. 边界交易的三个数字</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">入场</p><span class="concept-en">Entry</span><p>边界附近出现拒绝形态后进场，<strong>不要提前挂死在边界线上</strong>——因为等价格真的碰到边界时，往往已经带着突破的气势。</p></div>',
  '<div class="concept"><p class="concept-term">止损</p><span class="concept-en">Stop</span><p>放在边界外侧一点，留出正常过冲的空间。<strong>贴着边界放会被插针扫掉。</strong></p></div>',
  '<div class="concept"><p class="concept-term">目标</p><span class="concept-en">Target</span><p>先设区间中部，<strong>不要一上来就指望对面边界</strong>。到中部减仓，剩下的才考虑奔对面。</p></div>',
  '</div>',

  '<h3>3. 边界被测试几次后要放弃</h3>',
  '<p>和支撑阻力一样，<strong>一个边界被测试的次数越多，它就越弱</strong>。每一次测试都在消耗那里的挂单。实操规则：</p>',
  '<ul>',
  '<li>测试 1–3 次 → 边界有效，可以做边缘反向。</li>',
  '<li>测试 4 次以上 → 开始准备突破，逐步放弃边缘反向。</li>',
  '<li><strong>同一边界试得越多次，越接近它的终点</strong>——这时你的仓位应该越来越小，而不是越来越大。</li>',
  '</ul>',
  '',

  '<h2 id="middle">区间中部的禁忌</h2>',
  '<h3>1. 为什么中部最差</h3>',
  '<div class="callout danger"><div class="callout-body"><p class="callout-title">信息量最低、盈亏比最差</p><p>区间中部到上下沿的距离都不够，<strong>无论做多做空，盈亏比都很难看</strong>；而且那里没有任何结构信息，价格往哪走的概率都接近一半。<strong>你在那里做出的决定，事后看基本都是错的。</strong></p></div></div>',
  '<p>正确做法只有两个：<strong>要么在边缘做，要么等突破。</strong>中间那段距离，是用来等的，不是用来交易的。</p>',

  '<h3>2. 如果你已经在中部有了仓位</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">不要摊平</p><p>在中部加仓，是把仓位加到了最没有信息量的位置。</p></div>',
  '<div class="step"><p class="step-title">缩紧目标</p><p>把目标从"对面边界"改成"最近的一个结构位"，<strong>先出来再说。</strong></p></div>',
  '<div class="step"><p class="step-title">或者直接出来</p><p>承认这笔进场位置选错了。<strong>出来的成本，远小于在里面耗着的成本。</strong></p></div>',
  '</div>',
  '',

  '<h2 id="break">区间终会结束</h2>',
  '<h3>1. 方向能不能预判</h3>',
  '<p>短期方向接近抛硬币，但有两条可用的倾向：</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">顺着更大周期的结构</p><span class="concept-en">With Higher Timeframe</span><p>区间本身常常是趋势中的一段整理，<strong>所以它更可能顺着进入区间之前的那个方向突破</strong>。这是唯一值得参考的倾向。</p></div>',
  '<div class="concept"><p class="concept-term">看哪一侧被扫过</p><span class="concept-en">Swept Side</span><p>如果一侧刚刚被假突破扫过又收回来，<strong>那一侧的止损已经被消耗掉了</strong>，价格更可能从另一侧真突破。</p></div>',
  '</div>',
  '<p>但请记住：<strong>这两条只是倾向，不是信号。</strong>收敛区间最稳妥的做法仍然是双向挂单，让市场决定成交哪一边。</p>',

  '<h3>2. 突破发生时的动作</h3>',
  '<p>详细做法见「突破专题」与「跌破专题」，这里只提醒三件区间特有的问题：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">区间越久，突破越猛</p><p>横得越久，积累的订单越多，突破后的测量移动越大。<strong>所以老区间突破后的目标要敢于按区间高度算。</strong></p></div>',
  '<div class="step"><p class="step-title">不要在突破前重仓押方向</p><p>区间里的第一次突破，八成是假的。<strong>把第一次当成信号，第二次才是机会。</strong></p></div>',
  '<div class="step"><p class="step-title">突破失败后要立刻改回区间思路</p><p>很多人在假突破后仍然按趋势做，结果被区间来回扇。<strong>收回位内 = 什么都没发生。</strong></p></div>',
  '</div>',
  '',

  '<h2 id="day">震荡日的一天</h2>',
  '<h3>1. 时间轴上的典型节奏</h3>',
  '<div class="table-wrap"><table><thead><tr><th>阶段</th><th>典型表现</th><th>该做的事</th></tr></thead><tbody>',
  '<tr><th class="rowhead">早盘</th><td>延续隔夜区间，波动小，方向不明</td><td>标出上下沿，什么都不做</td></tr>',
  '<tr><th class="rowhead">第一段推进</th><td>价格向一侧运动，看起来像要突破</td><td>等它到边界，看拒绝还是收破</td></tr>',
  '<tr><th class="rowhead">中段</th><td>来回拉锯，最常见也最磨人</td><td><strong>关掉屏幕或只看不动</strong></td></tr>',
  '<tr><th class="rowhead">尾盘</th><td>波动收窄，或者突然单边</td><td>收窄就空仓过夜；单边就按突破/跌破处理</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 震荡日最重要的能力是"不做"</h3>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">交易量应当由机会决定</p><p>不是由你在屏幕前坐了多久决定。<strong>合格的机会是稀疏的，大部分时间应该只是观察。</strong>一个只会做趋势的人，会发现大部分时间无事可做——那不是问题，那才是常态。</p></div></div>',
  '',

  '<h2 id="checklist">清单与复盘</h2>',
  '<h3>1. 区间交易日检查清单</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">先判是不是区间</p><p>三条线索：形态、结构、你答不上来。</p></div>',
  '<div class="step"><p class="step-title">再判是哪种区间</p><p>窄幅不做、宽幅双向、收敛备突破、扩张降仓。</p></div>',
  '<div class="step"><p class="step-title">只在边缘做，且边界要被验证过</p><p>至少两次触及。</p></div>',
  '<div class="step"><p class="step-title">目标先设中部，不指望对面</p><p>到中部减仓。</p></div>',
  '<div class="step"><p class="step-title">测试超过四次就放弃反向</p><p>开始准备突破。</p></div>',
  '<div class="step"><p class="step-title">绝不站在区间中部</p><p>要么边缘，要么等突破。</p></div>',
  '</div>',
  '<h3>2. 复盘时单独统计两个数</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">区间日占比</p><span class="concept-en">Range Day Ratio</span><p>你的交易日里有多少比例其实是区间。<strong>如果这个数很高而你的系统只做趋势，就该补一套区间打法，或者接受更低的交易频率。</strong></p></div>',
  '<div class="concept"><p class="concept-term">区间里的磨损</p><span class="concept-en">Range Bleed</span><p>在区间日里亏掉的总额。<strong>这是最容易被忽略的一项</strong>，因为每笔看起来都很小。</p></div>',
  '</div>',
];

/* -------------------- 执行 -------------------- */
const src = fs.readFileSync(path, 'utf8');

function jsq(s) {
  if (s.indexOf("'") === -1) return "'" + s + "'";
  return JSON.stringify(s);
}

function buildPage(varName, id, navLabel, title, en, eyebrow, tagline, tags, chaps, body) {
  let o = '  var ' + varName + ' = {\n';
  o += "    id: '" + id + "',\n";
  o += "    navGroup: '实盘分析',\n";
  o += "    navLabel: '" + navLabel + "',\n";
  o += "    title: '" + title + "',\n";
  o += "    en: '" + en + "',\n";
  o += "    eyebrow: '" + eyebrow + "',\n";
  o += "    accent: '#059669',\n";
  o += "    tagline: '" + tagline + "',\n";
  o += "    plainTitle: '" + title + "',\n";
  o += "    tags: [" + tags.map(function (t) { return "'" + t + "'"; }).join(', ') + "],\n";
  o += '    chapters: [\n';
  chaps.forEach(function (c) {
    o += "      { id: '" + c.id + "', label: '" + c.label + "' },\n";
  });
  o += '    ],\n';
  o += '    body: [\n';
  body.forEach(function (s) {
    if (s === '') { o += '\n'; return; }
    o += '      ' + jsq(s) + ',\n';
  });
  o += "    ].join(''),\n";
  o += '  };\n\n';
  return o;
}

let block = '';
block += buildPage('breakoutPage', 'breakout', '突破', '突破专题', 'Breakout Playbook', '专题 01',
  '从标出突破位到收盘离场的完整动作，核心是失败突破怎么尽早认出来。',
  ['突破位', '成立度', '三种进场', '测量移动', '失败突破', '角色互换'],
  BREAKOUT_CHAPS, BREAKOUT_BODY);
block += buildPage('breakdownPage', 'breakdown', '跌破', '跌破专题', 'Breakdown Playbook', '专题 02',
  '跌破不能照抄突破：下跌更快、滑点更大、假摔更多，也更容易出现弹簧效应。',
  ['跌破位', '插针', '滑点', '卖压高潮', '弹簧效应', '假摔率'],
  BREAKDOWN_CHAPS, BREAKDOWN_BODY);
block += buildPage('rangePage', 'range', '震荡区间', '震荡区间专题', 'Trading Range Playbook', '专题 03',
  '区间是市场的默认状态：怎么在边界活着，以及怎么在它结束时站在正确的一边。',
  ['区间识别', '四种区间', '边界交易', '区间中部', '突破预判', '不做'],
  RANGE_CHAPS, RANGE_BODY);

/* 1) 插入到 var theories = [...] 之前 */
const anchorTheories = '  var theories = [priceAction, ict, smc, wyckoff, elliott];';
if (src.indexOf(anchorTheories) < 0) { console.error('找不到 var theories'); process.exit(1); }
let out = src.replace(anchorTheories, block + anchorTheories);

/* 2) pages 加入三个专题 */
const oldPages = '  var pages = [overview].concat(theories, [live], [gaps1, gaps2, gaps3, gaps4], [compare, chartPage, glossary, path]);';
const newPages = '  var pages = [overview].concat(theories, [live, breakoutPage, breakdownPage, rangePage], [gaps1, gaps2, gaps3, gaps4], [compare, chartPage, glossary, path]);';
if (out.indexOf(oldPages) < 0) { console.error('找不到 var pages'); process.exit(1); }
out = out.replace(oldPages, newPages);

/* 3) nav 组扩展 */
const oldNav = "    { group: '实盘分析', items: ['live'] },\n";
const newNav = "    { group: '实盘分析', items: ['live', 'breakout', 'breakdown', 'range'] },\n";
if (out.indexOf(oldNav) < 0) { console.error('找不到 nav 实盘分析'); process.exit(1); }
out = out.replace(oldNav, newNav);

fs.writeFileSync(path, out);
console.log('新增三个专题：');
[['突破', BREAKOUT_CHAPS, BREAKOUT_BODY], ['跌破', BREAKDOWN_CHAPS, BREAKDOWN_BODY], ['震荡区间', RANGE_CHAPS, RANGE_BODY]]
  .forEach(function (t) {
    console.log('  ' + t[0] + '：' + t[1].length + ' 章 / ' +
      t[2].filter(function (s) { return s !== ''; }).length + ' 段');
  });
console.log('原长度 ' + src.length + ' → 新长度 ' + out.length);
