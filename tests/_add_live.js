/* 一次性脚本：新增「实盘分析」模块（与五大体系并列的独立导航组）。
   用法： node tests/_add_live.js
   改动三处：① 插入 var live = {...}  ② pages 数组加入 live  ③ nav 增加分组 */

const fs = require('fs');
const path = 'data/theories.js';

const CHAPS = [
  { id: 'why', label: '理论与实盘之间' },
  { id: 'prep', label: '盘前：画地图' },
  { id: 'scan', label: '多周期扫描' },
  { id: 'read', label: '盘中：一根 K 线的五种读法' },
  { id: 'decide', label: '下单决策表' },
  { id: 'manage', label: '持仓管理' },
  { id: 'review', label: '盘后复盘' },
  { id: 'checklist', label: '实盘检查清单' },
  { id: 'traps', label: '实盘专属陷阱' },
];

const BODY = [
  // ============================ 导语 ============================
  '<p class="lede">前面五章讲的是"市场是什么样的"。这一章讲的是"你每天坐在屏幕前，到底该按什么顺序做事"。它不引入新理论，只把价格行为学、ICT、SMC、威科夫、波浪理论在同一段实盘流程里排好位置——<strong>同一根 K 线，五套体系会怎么读、下一步各自做什么</strong>。</p>',
  '',

  // ============================ 1. 理论与实盘之间 ============================
  '<h2 id="why">理论与实盘之间</h2>',
  '<h3>1. 三个具体的鸿沟</h3>',
  '<p>把理论学完和能稳定执行之间，隔着三道坎。它们都不是知识问题，所以靠"再学一个形态"解决不了。</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">图上没有未来 <span class="badge-inline">No Right Edge</span></p><span class="concept-en">No Right Edge</span><p>教材上的图都是事后画的，摆动点、浪型、FVG 全都被确认过。<strong>实盘时最新的那个摆动点还没诞生</strong>——要等右侧几根 K 线走完才能标记。所以你在实盘看到的"结构"，永远比图上晚半拍。</p></div>',
  '<div class="concept"><p class="concept-term">信号密度错觉 <span class="badge-inline">Signal Density</span></p><span class="concept-en">Signal Density</span><p>一页教材能讲十几个形态，看下来会觉得机会很多。<strong>实盘里合格的机会是稀疏的</strong>——多数时间应该只是观察。把"认识形态"误当成"每天都能用"，是过度交易的根源。</p></div>',
  '<div class="concept"><p class="concept-term">概率不等于单次结果 <span class="badge-inline">Probability</span></p><span class="concept-en">Probability vs Outcome</span><p>80% 规则意味着<strong>你一定会连着错几次</strong>。理论上你知道，实盘里连亏三笔之后，多数人会开始怀疑规则并临时改参数——而那正是期望值被毁掉的时刻。</p></div>',
  '</div>',

  '<h3>2. 实盘分析要解决的是动作一致性</h3>',
  '<p>既然后半拍、机会稀疏、还会连亏，那能控制的是什么？<strong>只有你自己的动作顺序。</strong>实盘分析的全部价值，就是把每次决策压成同一串固定动作，让"今天状态好不好"尽可能少地影响结果。</p>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">和另外两个页面的分工</p><p><strong>学习路径</strong>讲的是"按什么顺序学理论"，<strong>五体系对比</strong>讲的是"五套理论哪里一样哪里不一样"，而这一页讲的是"<strong>每天开盘到收盘，手该往哪放</strong>"。三者不重叠。</p></div></div>',

  '<h3>3. 这一页怎么用</h3>',
  '<p>建议的用法不是通读，而是<strong>把它当成一份贴在显示器旁的流程单</strong>：盘前翻「画地图」和「多周期扫描」，下单前翻「下单决策表」，收盘后翻「盘后复盘」。读到能背下来，就可以不再读它了。</p>',
  '',

  // ============================ 2. 盘前：画地图 ============================
  '<h2 id="prep">盘前：画地图</h2>',
  '<p>盘前只做一件事：<strong>把今天可能发生什么、在哪里发生，提前标在图上。</strong>做完这一步，盘中你就不再是"看着价格猜"，而是"等价格来找我标好的位置"。</p>',

  '<h3>1. 先标位置，不标方向</h3>',
  '<p>很多人盘前第一件事是判断涨跌，这是顺序错误。<strong>先把所有可能被触及的位置标出来，方向留到扫描阶段再定。</strong></p>',
  '<div class="table-wrap"><table><thead><tr><th>类别</th><th>具体标什么</th><th>为什么要标</th></tr></thead><tbody>',
  '<tr><th class="rowhead">隔夜边界</th><td>前一日的 高点 / 低点 / 收盘价</td><td>日内交易者最常参考的位置，隔夜止损集中在这里</td></tr>',
  '<tr><th class="rowhead">摆动点</th><td>本周期上最近 3–5 个明显的波段高低点</td><td>结构的骨架，也是流动性堆积处</td></tr>',
  '<tr><th class="rowhead">等高 / 等低点</th><td>几乎水平的一排高点或低点</td><td>极强的磁铁，价格常常专门去扫</td></tr>',
  '<tr><th class="rowhead">尚未回补的缺口</th><td>跳空缺口、FVG</td><td>价格回头补它们的概率高，是最常用的回踩目标</td></tr>',
  '</tbody></table></div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">标 4–6 个就停手</p><p>标得越多，盘中越容易给任何走势找到"我早就标过了"的理由。<strong>只保留最显眼的那几个</strong>——如果一张图上你需要标十几个位置才能安心，说明你根本没在看结构。</p></div></div>',

  '<h3>2. 画出三条线</h3>',
  '<p>位置标完之后，用三条线把它们串起来：<strong>上边界</strong>（最近的关键高点）、<strong>下边界</strong>（最近的关键低点）、<strong>中间线</strong>（两者的中点，也就是均衡价）。有了这三条线，任何一个价格落在图上，你都能立刻说出它在哪个区、离边界多远。</p>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">中点的用法</p><p>做多只在下半段找位置，做空只在上半段找位置。<strong>这一条规则能一次性否掉一半的冲动交易。</strong>它在 ICT 里叫溢价/折价，在威科夫里是区间的上下半区，在价格行为学里是"不要在区间中部交易"——三套说法，同一件事。</p></div></div>',

  '<h3>3. 写下今天的 bias</h3>',
  '<p>只写一个方向：今天主要找多、还是主要找空、还是按区间对待。<strong>写下来，当天不改。</strong></p>',
  '<p>bias 的依据只能来自高周期结构：日线是 HH+HL 就找多，LL+LH 就找空，高低点乱序就是区间。<strong>不允许用"我感觉"或者一根五分钟 K 线来定 bias。</strong></p>',

  '<h3>4. 换算好你的时间窗口</h3>',
  '<p>如果你用 ICT 的时段框架，这一步必做——Killzone 是按纽约时间给的，直接套用会系统性错位。</p>',
  '<div class="table-wrap"><table><thead><tr><th>时段（纽约时间）</th><th>北京时间 · 夏令时</th><th>北京时间 · 冬令时</th><th>典型角色</th></tr></thead><tbody>',
  '<tr><th class="rowhead">亚洲盘 20:00–00:00</th><td>08:00–12:00</td><td>09:00–13:00</td><td>区间积累，常构成当日边界</td></tr>',
  '<tr><th class="rowhead">伦敦开盘 02:00–05:00</th><td>14:00–17:00</td><td>15:00–18:00</td><td>假突破、扫止损</td></tr>',
  '<tr><th class="rowhead">纽约开盘 08:30–11:00</th><td>20:30–23:00</td><td>21:30–00:00</td><td>主要行情，流动性最足</td></tr>',
  '<tr><th class="rowhead">Silver Bullet 10:00–11:00</th><td>22:00–23:00</td><td>23:00–00:00</td><td>日内最标准的一段</td></tr>',
  '<tr><th class="rowhead">伦敦收盘 11:00–12:00</th><td>23:00–00:00</td><td>00:00–01:00</td><td>回补与反向动作</td></tr>',
  '</tbody></table></div>',
  '<p class="muted small">注：夏令时为每年 3 月第二个周日至 11 月第一个周日，其余为冬令时。切换的那两周最容易算错，建议每季度核对一次。</p>',

  '<h3>5. 预挂单还是手动触发</h3>',
  '<p>盘前把单挂好，好处是<strong>盘中不用做决定</strong>，坏处是挂上了就被锁定。经验规则：<strong>回撤可以预测的挂单，突破类的手动</strong>。深度回调（50%、OTE）提前挂；需要等确认的（扫荡后的 MSS、突破后的跟进）留在盘中手动。</p>',
  '',

  // ============================ 3. 多周期扫描 ============================
  '<h2 id="scan">多周期扫描</h2>',
  '<h3>1. 三层分工</h3>',
  '<div class="table-wrap"><table><thead><tr><th>层级</th><th>常用周期</th><th>回答什么</th><th>不能用来做什么</th></tr></thead><tbody>',
  '<tr><th class="rowhead">高周期</th><td>日线 / 4 小时</td><td>定 bias 与今日目标在哪</td><td>不能用来找入场点</td></tr>',
  '<tr><th class="rowhead">中周期</th><td>1 小时 / 15 分钟</td><td>定结构：关键位、当前处在哪个阶段</td><td>不能用来定当日方向</td></tr>',
  '<tr><th class="rowhead">低周期</th><td>5 分钟 / 1 分钟</td><td>定触发：确认有没有出现</td><td>不能用来定 bias</td></tr>',
  '</tbody></table></div>',
  '<p>相邻两层保持 4–6 倍关系最稳。用 1 小时定方向却在 3 分钟找入场，两层之间画出来的东西会互相打架。</p>',

  '<h3>2. 从高到低只问三个问题</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">高周期：价格想去哪</p><p>上方还是下方有还没被取的流动性 / 还没被测试的前高前低？<strong>定下今天只做一个方向。</strong></p></div>',
  '<div class="step"><p class="step-title">中周期：现在走到哪一步了</p><p>是在积累、还是在推进、还是在衰竭？如果连"假动作"都还没发生，就别急着找入场。</p></div>',
  '<div class="step"><p class="step-title">低周期：确认出现了吗</p><p>关键位有没有被触及？触及之后有没有反向确认？<strong>两个都满足才动手。</strong></p></div>',
  '</div>',

  '<h3>3. 今天不做的四种情况</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">高低点乱序，看不出结构</p><p>这时候最好的动作是不做。<strong>看不清本身就是最重要的信息</strong>——它通常意味着区间，而区间里的突破八成是假的。</p></div>',
  '<div class="concept"><p class="concept-term">价格正处在区间中部</p><p>信息量最低、盈亏比最差的位置。<strong>要么等它走到边缘，要么等它突破。</strong></p></div>',
  '<div class="concept"><p class="concept-term">关键位还没被触及</p><p>你标的位置一个都没碰到，说明今天还没到决策的时候。<strong>离得越远越不该动手。</strong></p></div>',
  '<div class="concept"><p class="concept-term">重大数据 / 事件前后</p><p>波动由消息驱动而非结构驱动，此时所有形态的统计特性都失效。<strong>要么空仓，要么把仓位减半。</strong></p></div>',
  '</div>',
  '',

  // ============================ 4. 盘中：一根 K 线的五种读法 ============================
  '<h2 id="read">盘中：一根 K 线的五种读法</h2>',
  '<p>这一节是全页的核心。设定一个最常见的场景：<strong>价格跌破了一个明显的前低，但收盘又回到了前低上方。</strong>同一根 K 线，五套体系会怎么读？</p>',

  '<h3>1. 五套体系各自看到什么</h3>',
  '<div class="table-wrap"><table><thead><tr><th>体系</th><th>它把这根 K 线叫做</th><th>它认为这意味着</th><th>它要求的下一步</th></tr></thead><tbody>',
  '<tr><th class="rowhead">价格行为学</th><td>失败突破 / 潜在信号棒</td><td>卖方推进失败，但<strong>单根不够</strong></td><td>等下一根同向跟进棒，收上信号棒高点才进</td></tr>',
  '<tr><th class="rowhead">ICT</th><td>流动性扫荡（Sweep）</td><td>卖方流动性被取走，<strong>只是"可能"不是"确认"</strong></td><td>等反向打破最近的内部结构（MSS），再回踩折价区</td></tr>',
  '<tr><th class="rowhead">SMC</th><td>Liquidity Grab（流动性猎取）</td><td>止损被扫，订单块可能已形成</td><td>等 CHoCH 确认，再回到订单块或公允价值缺口</td></tr>',
  '<tr><th class="rowhead">威科夫</th><td>Spring（弹簧效应）</td><td>震仓洗盘，可能进入吸筹末期</td><td>看成交量是否萎缩，等缩量回踩（Test）确认卖压枯竭</td></tr>',
  '<tr><th class="rowhead">波浪理论</th><td>某一段调整的潜在终点</td><td>可能完成了某一浪，但<strong>浪级判断依赖后续结构</strong></td><td>用后续回撤不创新低来确认，再谈目标</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 它们在哪一点上完全一致</h3>',
  '<div class="callout insight"><div class="callout-body"><p class="callout-title">五套体系的共同答案：都要等确认</p><p>注意看上表最右列——<strong>没有任何一套体系说"看到这根 K 线就下单"</strong>。价格行为学要跟进棒，ICT 要 MSS，SMC 要 CHoCH，威科夫要缩量 Test，波浪要后续结构。<strong>术语完全不同，动作完全一致：再等一根。</strong></p></div></div>',
  '<p>这一点极其重要，因为它意味着：<strong>你不需要在五套体系之间做选择，只需要在"确认是什么"这件事上保持一致。</strong>选一套你最顺手的术语去定义"确认"，然后每次都用它。</p>',

  '<h3>3. 什么时候它们会互相矛盾</h3>',
  '<p>矛盾几乎总是来自<strong>周期错位</strong>而不是体系分歧：15 分钟上已经出现反向确认，日线却仍在强势推进。这时的处理顺序是固定的：</p>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">高周期结构优先</p><p>日线仍在 HH+HL，那么低周期的反向确认<strong>只够做减仓，不够做反手</strong>。</p></div>',
  '<div class="step"><p class="step-title">矛盾时降级而非放弃</p><p>不符合高周期方向的信号，可以<strong>用小仓位做短目标</strong>，但不能按常规仓位和目标对待。</p></div>',
  '<div class="step"><p class="step-title">实在判断不了就不做</p><p>两套体系打架时，正确动作通常是等。<strong>错过一次机会的成本，远低于做错一次。</strong></p></div>',
  '</div>',

  '<h3>4. 把读法压成一句话</h3>',
  '<p>盘中你真正要做出的判断只有三个，按顺序问：<strong>价格有没有到我标的位置？→ 到了之后有没有反向确认？→ 确认之后回踩落在哪一半？</strong>三个都是"是"，才进入下单环节。</p>',
  '',

  // ============================ 5. 下单决策表 ============================
  '<h2 id="decide">下单决策表</h2>',
  '<h3>1. 三个数字加一个条件</h3>',
  '<p>下单前必须能写出四个东西，缺一个就不进：<strong>入场价、止损价、目标价、失效条件。</strong>前三个决定这笔划不划算，第四个决定你什么时候承认自己错了。</p>',
  '<div class="callout danger"><div class="callout-body"><p class="callout-title">写不出来就不要进</p><p>"写下来"这个动作本身会过滤掉大部分冲动交易，<strong>因为它强迫你把模糊的想法变成可证伪的句子</strong>。如果你说不出止损放哪，说明你根本不知道自己在赌什么。</p></div></div>',

  '<h3>2. 进场方式怎么选</h3>',
  '<div class="table-wrap"><table><thead><tr><th>方式</th><th>用它的前提</th><th>代价</th></tr></thead><tbody>',
  '<tr><th class="rowhead">限价挂单等回踩</th><td>趋势清晰、回撤深度可预期</td><td>强趋势里常常挂不上，错过整波</td></tr>',
  '<tr><th class="rowhead">突破挂单</th><td>关键位被突破的瞬间追入</td><td>假突破会连续触发止损</td></tr>',
  '<tr><th class="rowhead">确认后市价追入</th><td>确认信号已经出现，怕错过</td><td>进场价最差、止损最远</td></tr>',
  '<tr><th class="rowhead">收盘价进场</th><td>信号质量存疑但背景很好</td><td>牺牲一段价格换确定性</td></tr>',
  '</tbody></table></div>',
  '<div class="callout tip"><div class="callout-body"><p class="callout-title">先定止损，再倒推方式</p><p>顺序反了就会出问题：<strong>止损必须是"我错了"的结构位置，不能被进场方式倒过来拉宽或压窄。</strong>四种方式里选哪个，只取决于哪一种的止损距离是你这个仓位能承受的。</p></div></div>',

  '<h3>3. 止损三问</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">它是不是结构失效点</p><p>止损要放在"这个判断被推翻"的地方，而不是"我能亏多少"的地方。<strong>后者会让你不断被正常噪音扫出去。</strong></p></div>',
  '<div class="step"><p class="step-title">它有没有留出正常波动的空间</p><p>贴着信号棒极值放止损，看起来很省，实际是给市场送钱。<strong>至少留出一根 K 线的平均振幅。</strong></p></div>',
  '<div class="step"><p class="step-title">它和目标的距离是否配得上盈亏比</p><p>波段交易尽量追求 2 倍以上。<strong>算出来不到 1.5 倍，通常说明这个入场位置选错了。</strong></p></div>',
  '</div>',

  '<h3>4. 仓位：从风险倒推，不从资金正推</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">定单笔最大亏损</p><p>通常是总资金的 0.5%–2%。<strong>新手取下限。</strong></p></div>',
  '<div class="step"><p class="step-title">量出入场到止损的距离</p><p>用价格单位算，不要看百分比。</p></div>',
  '<div class="step"><p class="step-title">手数 = 最大亏损 ÷ 止损距离</p><p>止损越远，手数越小。<strong>这一步保证了无论形态多漂亮，单笔风险都一样大。</strong></p></div>',
  '</div>',
  '',

  // ============================ 6. 持仓管理 ============================
  '<h2 id="manage">持仓管理</h2>',
  '<p>进场之后的问题不再是"会不会涨"，而是"错了怎么办、对了拿多久"。这一段最容易凭感觉，所以也要预先定好。</p>',

  '<h3>1. 到 1R 时的三个选择</h3>',
  '<div class="table-wrap"><table><thead><tr><th>做法</th><th>怎么做</th><th>适合什么情况</th></tr></thead><tbody>',
  '<tr><th class="rowhead">平一半，止损挪保本</th><td>盈利等于初始风险时平掉一半仓位，剩余止损移到成本价</td><td>最常用。把剩余仓位变成零风险</td></tr>',
  '<tr><th class="rowhead">全部平掉</th><td>到 1R 直接了结</td><td>区间行情、目标不明确时</td></tr>',
  '<tr><th class="rowhead">不动，奔目标</th><td>按原计划持有到目标位</td><td>强趋势、目标明确、且你能承受回吐</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 移动止损的三种依据</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">跟着结构走（最稳）</p><span class="concept-en">Trail by Structure</span><p>上涨中把止损移到每一个新形成的更高低点下方。<strong>它的好处是"结构破了才出局"</strong>，不会被单根大影线扫掉。</p></div>',
  '<div class="concept"><p class="concept-term">跟着均线走</p><span class="concept-en">Trail by Moving Average</span><p>价格行为学里常用 20 EMA。<strong>适合紧通道行情</strong>，回撤本来就很浅，均线几乎贴着价格。</p></div>',
  '<div class="concept"><p class="concept-term">跟着前高前低走</p><span class="concept-en">Trail by Swings</span><p>每突破一个前高，止损移到前一个前高下方。<strong>适合台阶式推进的行情。</strong></p></div>',
  '</div>',
  '<p>三者选一个，不要混用。<strong>混用的结果通常是"哪个先被触发就用哪个"，等于在用最紧的那个止损。</strong></p>',

  '<h3>3. 应该提前走的四个信号</h3>',
  '<ul>',
  '<li><strong>反向确认出现</strong>——你持仓方向的结构被打破（MSS / CHoCH / 反转结构），无论盈亏都走。</li>',
  '<li><strong>推进明显失速</strong>——连续几根 K 线重叠、实体变小、回撤变深，动能已经不在你这边。</li>',
  '<li><strong>到了你标注的对面流动性</strong>——目标达成，不要因为"还能再涨"而继续持有。</li>',
  '<li><strong>时间到了还没动</strong>——进场后长时间横盘，说明市场不认可这个理由。<strong>时间止损和价格止损同样重要。</strong></li>',
  '</ul>',

  '<h3>4. 加仓的三条纪律</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">只在盈利时加</p><p>亏损时加仓是用一个新错误掩盖旧错误，<strong>这是唯一能保证账户归零的做法。</strong></p></div>',
  '<div class="step"><p class="step-title">加仓后的总风险不增加</p><p>加仓的同时把止损上移，<strong>让整笔交易的最大亏损不超过初始风险。</strong></p></div>',
  '<div class="step"><p class="step-title">加仓次数预先定死</p><p>最多一次，写进计划。<strong>盘中临时决定"再加一点"，几乎总是情绪驱动。</strong></p></div>',
  '</div>',
  '',

  // ============================ 7. 盘后复盘 ============================
  '<h2 id="review">盘后复盘</h2>',
  '<h3>1. 每笔记录什么</h3>',
  '<div class="table-wrap"><table><thead><tr><th>字段</th><th>记什么</th><th>为什么</th></tr></thead><tbody>',
  '<tr><th class="rowhead">入场理由</th><td>用一句话写出触发条件</td><td>事后才能区分"计划内亏损"和"随手单"</td></tr>',
  '<tr><th class="rowhead">三个数字</th><td>入场 / 止损 / 目标</td><td>检查盈亏比是否达标</td></tr>',
  '<tr><th class="rowhead">执行评分</th><td>是否完全按计划执行（是 / 否）</td><td><strong>最重要的字段</strong>，比盈亏更能反映水平</td></tr>',
  '<tr><th class="rowhead">结果</th><td>盈亏、R 倍数</td><td>统计用</td></tr>',
  '<tr><th class="rowhead">方向判断</th><td>盘前 bias 与实际走向是否一致</td><td>单独统计"看对方向"的能力</td></tr>',
  '</tbody></table></div>',

  '<h3>2. 先问执行，再问结果</h3>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">赚钱的烂交易比亏钱的好交易更危险</p><p>一笔没按规则做但赚钱的单子，会教你继续不按规则做。<strong>复盘时先看"执行评分"是不是"是"，再看盈亏。</strong>执行到位却亏了，那是成本；执行不到位却赚了，那是负债。</p></div></div>',

  '<h3>3. 三个必须算的数</h3>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">胜率</p><span class="concept-en">Win Rate</span><p>盈利笔数 ÷ 总笔数。<strong>单独看没有意义</strong>——40% 胜率配 3 倍盈亏比照样赚钱。</p></div>',
  '<div class="concept"><p class="concept-term">平均盈亏比</p><span class="concept-en">Average R Multiple</span><p>盈利的平均 R 除以亏损的平均 R。<strong>它比胜率更能被你控制</strong>，因为出场规则是你定的。</p></div>',
  '<div class="concept"><p class="concept-term">期望值</p><span class="concept-en">Expectancy</span><p>胜率 × 平均盈利 − 败率 × 平均亏损。<strong>这个数大于零，系统才有继续做的意义。</strong></p></div>',
  '</div>',

  '<h3>4. 多久做一次结论</h3>',
  '<p><strong>20 笔做一次小结，100 笔才下结论。</strong>少于 20 笔的统计基本是噪音——你分不清是方法不行还是运气不好。这也是为什么"只挑一个模型练熟"比"同时试五个"重要得多：<strong>样本量不够，你什么结论都得不出的。</strong></p>',
  '',

  // ============================ 8. 实盘检查清单 ============================
  '<h2 id="checklist">实盘检查清单</h2>',
  '<p>把前面所有内容压成一张单子。贴在显示器旁边，按时间顺序过一遍。</p>',

  '<h3>1. 盘前</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">标出隔夜高低、收盘价</p><p>以及本周期上 3–5 个明显的摆动点。标完就停手。</p></div>',
  '<div class="step"><p class="step-title">画三条线</p><p>上边界、下边界、中点。</p></div>',
  '<div class="step"><p class="step-title">写下今天的 bias</p><p>只写一个方向，当天不改。</p></div>',
  '<div class="step"><p class="step-title">换算时间窗口</p><p>确认夏令时，把关键时段写进日历。</p></div>',
  '<div class="step"><p class="step-title">在可预测的位置预挂单</p><p>回撤类挂单，突破类留到盘中。</p></div>',
  '<div class="step"><p class="step-title">确认今天有没有重要数据</p><p>有则减半仓位或避开该时段。</p></div>',
  '</div>',

  '<h3>2. 盘中</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">价格到我标的位置了吗</p><p>没到就什么都不做。</p></div>',
  '<div class="step"><p class="step-title">到了之后有没有反向确认</p><p>要的是确认，不是"看起来要反转"。</p></div>',
  '<div class="step"><p class="step-title">确认后的回踩落在哪一半</p><p>做多必须落在中点以下，做空必须落在中点以上。</p></div>',
  '<div class="step"><p class="step-title">写下三个数字和一个失效条件</p><p>写不出来就不下单。</p></div>',
  '<div class="step"><p class="step-title">下单后离开屏幕</p><p>盯盘越久，交易越多，质量越差。</p></div>',
  '</div>',

  '<h3>3. 盘后</h3>',
  '<div class="steps">',
  '<div class="step"><p class="step-title">逐笔填记录表</p><p>重点填执行评分。</p></div>',
  '<div class="step"><p class="step-title">统计 today 的方向判断</p><p>盘前 bias 对不对，单独记。</p></div>',
  '<div class="step"><p class="step-title">记录每个时段实际发生了什么</p><p>积累 20–30 个交易日，你会得到属于自己的时段统计。</p></div>',
  '<div class="step"><p class="step-title">只在固定节点看统计</p><p>20 笔小结，100 笔结论，中间不改规则。</p></div>',
  '</div>',
  '',

  // ============================ 9. 实盘专属陷阱 ============================
  '<h2 id="traps">实盘专属陷阱</h2>',
  '<p>下面这些和理论误区不同——<strong>它们不是"不知道"，而是"知道但仍然会犯"</strong>，因为触发它们的不是认知，是情绪和注意力。</p>',
  '<div class="concept-grid">',
  '<div class="concept"><p class="concept-term">画完线就自我实现</p><p>标了支撑阻力之后，价格一靠近就觉得"该反弹了"。<strong>线只是记录，不是预测</strong>——它不产生任何力量，产生力量的是那里的订单，而你并不知道订单还在不在。</p></div>',
  '<div class="concept"><p class="concept-term">换周期找支持自己的证据</p><p>15 分钟不支持就看 1 小时，1 小时不支持就看 5 分钟，直到找到一个支持自己持仓的周期。<strong>这是实盘里最常见、也最不自觉的自欺。</strong></p></div>',
  '<div class="concept"><p class="concept-term">连亏之后改参数</p><p>三笔连亏就把止损放宽、把周期调大、把条件放松。<strong>改参数的时点选在最倒霉的时候，等于把系统调成了追涨杀跌。</strong></p></div>',
  '<div class="concept"><p class="concept-term">盈利之后放大仓位</p><p>连赚几笔就觉得自己"看懂了"，下一笔下双倍。<strong>仓位只能由公式决定，不能由信心决定。</strong></p></div>',
  '<div class="concept"><p class="concept-term">把复盘结论当实时判断</p><p>盘后看得很清楚，于是误以为盘中也能看得清。<strong>记住那半拍的延迟——实盘时最新的摆动点还没诞生。</strong></p></div>',
  '<div class="concept"><p class="concept-term">盯盘时间越长交易越多</p><p>交易量应当由机会决定，不是由你在屏幕前坐了多久决定。<strong>合格的机会是稀疏的，大部分时间应该只是观察。</strong></p></div>',
  '</div>',
  '<div class="callout warn"><div class="callout-body"><p class="callout-title">唯一有效的对抗方式</p><p>上面六条没有一条能靠"提醒自己"解决，只能靠<strong>把动作写死成清单</strong>——盘前做什么、盘中问什么、下单前写什么、盘后记什么。<strong>流程的作用不是提高收益，是压缩你临场发挥的空间。</strong></p></div></div>',
];

/* -------------------- 执行 -------------------- */
const src = fs.readFileSync(path, 'utf8');

function jsq(s) {
  if (s.indexOf("'") === -1) return "'" + s + "'";
  return JSON.stringify(s);
}

/* 1) 组装 var live = { ... } */
let obj = '';
obj += '  var live = {\n';
obj += "    id: 'live',\n";
obj += "    navGroup: '实盘分析',\n";
obj += "    navLabel: '实盘分析',\n";
obj += "    title: '实盘分析',\n";
obj += "    en: 'Live Market Analysis',\n";
obj += "    eyebrow: '实战 01',\n";
obj += "    accent: '#059669',\n";
obj += "    tagline: '把五套体系排进同一段实盘流程：盘前画地图、盘中认确认、下单写四个数、盘后按执行评分。',\n";
obj += "    plainTitle: '实盘分析',\n";
obj += "    tags: ['盘前准备', '多周期', '信号确认', '下单决策', '持仓管理', '复盘'],\n";
obj += '    chapters: [\n';
CHAPS.forEach(function (c) {
  obj += "      { id: '" + c.id + "', label: '" + c.label + "' },\n";
});
obj += '    ],\n';
obj += '    body: [\n';
BODY.forEach(function (s) {
  if (s === '') { obj += '\n'; return; }
  obj += '      ' + jsq(s) + ',\n';
});
obj += "    ].join(''),\n";
obj += '  };\n\n';

/* 2) 插到 var theories = [...] 之前 */
const anchorTheories = '  var theories = [priceAction, ict, smc, wyckoff, elliott];';
if (src.indexOf(anchorTheories) < 0) { console.error('找不到 var theories'); process.exit(1); }
let out = src.replace(anchorTheories, obj + anchorTheories);

/* 3) pages 加入 live */
const oldPages = "  var pages = [overview].concat(theories, [gaps1, gaps2, gaps3, gaps4], [compare, chartPage, glossary, path]);";
const newPages = "  var pages = [overview].concat(theories, [live], [gaps1, gaps2, gaps3, gaps4], [compare, chartPage, glossary, path]);";
if (out.indexOf(oldPages) < 0) { console.error('找不到 var pages'); process.exit(1); }
out = out.replace(oldPages, newPages);

/* 4) nav 增加分组（放在「五大体系」之后） */
const oldNav = "    { group: '五大体系', items: ['price-action', 'ict', 'smc', 'wyckoff', 'elliott'] },\n";
const newNav = oldNav + "    { group: '实盘分析', items: ['live'] },\n";
if (out.indexOf(oldNav) < 0) { console.error('找不到 nav 五大体系'); process.exit(1); }
out = out.replace(oldNav, newNav);

fs.writeFileSync(path, out);
console.log('新增完成：实盘分析（' + CHAPS.length + ' 章 / ' +
  BODY.filter(function (s) { return s !== ''; }).length + ' 段）');
console.log('原长度 ' + src.length + ' → 新长度 ' + out.length);
