/* ==========================================================================
   术语速查数据
   src 数组标注该术语出自主流体系，便于交叉对照。
   ========================================================================== */

window.GLOSSARY = [
  {
    group: '市场结构',
    items: [
      { zh: '结构突破', en: 'BOS — Break of Structure', desc: '价格顺原趋势方向突破了前一个摆动高点（或低点），代表趋势延续得到确认。', src: ['ICT', 'SMC'] },
      { zh: '性质转变', en: 'CHoCH — Change of Character', desc: '价格反向破坏了最近的结构，是主导权可能易手的第一个客观证据。通常作为入场触发器。', src: ['SMC'] },
      { zh: '市场结构转向', en: 'MSS — Market Structure Shift', desc: '与 CHoCH 基本同义，ICT 更常用这个说法。指流动性被扫后出现的反向结构破坏。', src: ['ICT'] },
      { zh: '摆动高 / 低点', en: 'Swing High / Swing Low', desc: '结构的基本单位。如何定义一个有效摆动点，是整套方法中最主观也最影响结果的一步。', src: ['通用'] },
      { zh: '内部 / 外部结构', en: 'Internal / External Structure', desc: '大周期的一段趋势，在小周期里是 BOS 与 CHoCH 的交替序列。用于多周期嵌套定位。', src: ['SMC'] },
      { zh: '区间 / 交易区间', en: 'Trading Range', desc: '多空反复拉锯、K 线大量重叠的状态。价格行为学认为区间中部是信息量最低的位置。', src: ['价格行为学'] },
      { zh: '趋势棒', en: 'Trend Bar', desc: '实体长、影线短、收盘接近极值的 K 线。连续出现是最强的单边方向信号。', src: ['价格行为学'] },
      { zh: 'Always In', en: 'Always In', desc: '如果此刻必须持仓你会选哪个方向。答案含糊即意味着市场处于区间，应缩小仓位。', src: ['价格行为学'] },
    ],
  },
  {
    group: '流动性与筹码',
    items: [
      { zh: '流动性', en: 'Liquidity', desc: '可以成交的订单。散户止损单因位置高度可预测，是最容易被收割的一类流动性。', src: ['ICT', 'SMC'] },
      { zh: '买方流动性', en: 'BSL — Buy-side Liquidity', desc: '堆积在前高上方的买入订单。被打掉时价格常冲高回落。', src: ['ICT'] },
      { zh: '卖方流动性', en: 'SSL — Sell-side Liquidity', desc: '堆积在前低下方的卖出订单。被扫掉后价格常迅速拉回，形成最低点。', src: ['ICT'] },
      { zh: '流动性扫荡', en: 'Liquidity Sweep', desc: '价格短暂突破关键位、触发一片止损后迅速反向。是流动性体系里最重要的入场前置条件。', src: ['ICT', 'SMC'] },
      { zh: '流动性抓取', en: 'Liquidity Grab', desc: 'SMC 对同一现象的叫法，也称猎杀止损（Stop Hunt）。', src: ['SMC'] },
      { zh: '等高点 / 等低点', en: 'EQH / EQL — Equal Highs / Lows', desc: '几乎水平的前高或前低，是极强的流动性磁铁，价格倾向专门去"扫"这些位置。', src: ['ICT', 'SMC'] },
      { zh: '流动性目标', en: 'DOL — Draw on Liquidity', desc: '价格当前想要抵达的目标位置，通常是上方或下方尚未被触及的流动性池。', src: ['ICT'] },
      { zh: '诱因', en: 'IDM — Inducement', desc: '真实行情启动前先制造的小型假结构，用于引诱交易者提前进场。它是用来规避的，不是用来交易的。', src: ['SMC', 'ICT'] },
      { zh: '复合人', en: 'Composite Man', desc: '威科夫的隐喻：把所有市场参与者的行为想象成由一个极度精明的操盘手统一指挥。', src: ['威科夫'] },
    ],
  },
  {
    group: '价格区域',
    items: [
      { zh: '订单块', en: 'OB — Order Block', desc: '引发结构突破之前的最后一根反向 K 线。被视为机构建仓留下的痕迹。', src: ['ICT', 'SMC'] },
      { zh: '断路器块', en: 'Breaker Block', desc: '订单块被反向击穿后角色反转，原支撑变阻力。结构转向后最有效的回踩区之一。', src: ['ICT', 'SMC'] },
      { zh: '缓解块', en: 'Mitigation Block', desc: '价格返回结构转向的起点区域。与 Breaker 的区别是不涉及角色反转，仅是"回补"。', src: ['ICT', 'SMC'] },
      { zh: '公允价值缺口', en: 'FVG — Fair Value Gap', desc: '三根 K 线之间留下的价格真空区，因价格移动过快而成交不充分。市场倾向回头补上。', src: ['ICT', 'SMC'] },
      { zh: '失衡', en: 'Imbalance', desc: '买卖力量悬殊造成的价格真空。FVG 是失衡的一种表现形式，与订单块常重合。', src: ['ICT', 'SMC'] },
      { zh: '溢价区', en: 'Premium Zone', desc: '一段波动中点以上的区域。在这个区域追多属于劣质入场。', src: ['ICT', 'SMC'] },
      { zh: '折价区', en: 'Discount Zone', desc: '一段波动中点以下的区域。做多的首选位置。', src: ['ICT', 'SMC'] },
      { zh: '最优入场点位', en: 'OTE — Optimal Trade Entry', desc: '一段行情 62% 至 79% 的回撤区间，常叠加 70.5% 中点。折价区中最深、盈亏比最好的位置。', src: ['ICT'] },
      { zh: 'PD 阵列', en: 'PD Array', desc: 'ICT 对"价格可能产生反应的位置"的统称，包括 FVG、OB、Breaker、OTE 等。', src: ['ICT'] },
      { zh: '测量移动', en: 'Measured Move', desc: '把一段已知行情的幅度复制到突破方向，得到目标位。价格行为学最常用的止盈框架。', src: ['价格行为学'] },
    ],
  },
  {
    group: '阶段与时间',
    items: [
      { zh: '吸筹', en: 'Accumulation', desc: '大资金在低位区间内持续收集筹码的过程，通常伴随长时间的横盘震荡。', src: ['威科夫'] },
      { zh: '派发', en: 'Distribution', desc: '大资金在高位区间把筹码转移给公众的过程，是吸筹的完全镜像。', src: ['威科夫'] },
      { zh: '抛售高潮', en: 'SC — Selling Climax', desc: '恐慌性放量急跌，公众不计成本抛出而大资金在承接。振幅与成交量都异常巨大。', src: ['威科夫'] },
      { zh: '自动反弹', en: 'AR — Automatic Rally', desc: '抛压耗尽后的自然反弹，形成吸筹区间的上沿。SC 低点与 AR 高点共同定义区间边界。', src: ['威科夫'] },
      { zh: '二次测试', en: 'ST — Secondary Test', desc: '价格再次回到极值附近测试供需。理想情况下成交量应明显小于前次极值。', src: ['威科夫'] },
      { zh: '弹簧效应', en: 'Spring', desc: '吸筹区间向下假突破，扫掉止损后迅速拉回。威科夫体系里最重要的买点。', src: ['威科夫'] },
      { zh: '上冲回落', en: 'UT / UTAD — Upthrust', desc: '派发区间向上假突破后迅速跌回。UTAD 指派发后期的最后一次诱多。', src: ['威科夫'] },
      { zh: '强势信号', en: 'SOS — Sign of Strength', desc: '放量向上突破区间上沿，证明需求已完全接管，是趋势启动的客观标志。', src: ['威科夫'] },
      { zh: '最后支撑点', en: 'LPS — Last Point of Support', desc: 'SOS 之后的缩量回踩。回踩守住前低即为最好的顺势进场位。', src: ['威科夫'] },
      { zh: '三阶段模型', en: 'Power of 3 / AMD', desc: '吸筹、操纵、派发。ICT 认为每个交易日都按这三个相位推进。', src: ['ICT'] },
      { zh: '关键时段', en: 'Killzone', desc: 'ICT 认为最可能出现有效动作的时间窗口，如伦敦开盘、纽约开盘附近。', src: ['ICT'] },
      { zh: '犹大摆动', en: 'Judas Swing', desc: '伦敦盘前后的反向假突破，用来扫掉亚洲盘积累的止损。', src: ['ICT'] },
      { zh: '白银时刻', en: 'Silver Bullet', desc: 'ICT 单独点名的纽约时段一小时窗口，通常指纽约时间 10:00 至 11:00。', src: ['ICT'] },
      { zh: '银行间交付算法', en: 'IPDA', desc: 'ICT 假设中驱动价格运行的机制，其任务是撮合订单而非给交易者利润。周期常以 20/40/60 日计。', src: ['ICT'] },
    ],
  },
  {
    group: '量价分析',
    items: [
      { zh: '量价分析', en: 'VSA — Volume Spread Analysis', desc: 'Tom Williams 基于威科夫思想发展的方法，专注单根 K 线的成交量与振幅关系。', src: ['威科夫'] },
      { zh: '无需求', en: 'No Demand', desc: '上涨 K 线却成交量明显萎缩，说明缺乏买盘跟进，上涨不可持续。', src: ['威科夫'] },
      { zh: '无供给', en: 'No Supply', desc: '下跌 K 线却成交量明显萎缩，说明抛压枯竭，下跌无力延续。', src: ['威科夫'] },
      { zh: '停止量', en: 'Stopping Volume', desc: '下跌中放出巨量但收盘回到中上部，说明有资金在承接，下跌被中止。', src: ['威科夫'] },
      { zh: '努力与结果', en: 'Effort vs Result', desc: '成交量是努力，价格变动是结果。巨量而价格不动，往往意味着对倒或出货。', src: ['威科夫'] },
    ],
  },
  {
    group: '波浪理论',
    items: [
      { zh: '推动浪', en: 'Impulse Wave', desc: '与主趋势同向的五浪结构（1-2-3-4-5），其中浪 3 通常最强势。', src: ['波浪理论'] },
      { zh: '调整浪', en: 'Corrective Wave', desc: '逆势的三浪结构（A-B-C）。形态多变、可无限组合，是数浪失败的主要发生地。', src: ['波浪理论'] },
      { zh: '锯齿', en: 'Zigzag', desc: '5-3-5 结构的锐利调整。浪 B 反弹很浅，浪 C 明显超过浪 A 的终点。', src: ['波浪理论'] },
      { zh: '平台', en: 'Flat', desc: '3-3-5 结构的横向调整。变异出扩张平台与运行平台两种形态。', src: ['波浪理论'] },
      { zh: '三角形', en: 'Triangle', desc: '3-3-3-3-3 的五段横向收缩结构，常出现在浪 4 或浪 B，之后往往出现最后一冲。', src: ['波浪理论'] },
      { zh: '复杂调整', en: 'Combination / WXY', desc: '两个或三个简单调整形态用连接浪 X 串联起来，最磨人也最易数错。', src: ['波浪理论'] },
      { zh: '交替原则', en: 'Alternation', desc: '浪 2 与浪 4 通常在形态与深度上互补：一个急促，另一个就磨人。', src: ['波浪理论'] },
      { zh: '通道', en: 'Channeling', desc: '用浪 1 与浪 3 终点连线定上轨，从浪 2 终点作平行线定下轨。判断趋势终点最实用的工具。', src: ['波浪理论'] },
      { zh: '延伸浪', en: 'Extension', desc: '某一浪明显拉长且内部结构清晰，通常发生在浪 3。推动浪中一般只有一个浪延伸。', src: ['波浪理论'] },
      { zh: '失败浪 / 截断', en: 'Truncation / Failure', desc: '浪 5 未能超过浪 3 的终点，是动能严重衰竭的信号，常预示剧烈反转。', src: ['波浪理论'] },
      { zh: '对角线 / 终结楔形', en: 'Diagonal / Ending Diagonal', desc: '收敛的楔形五浪，内部为 3-3-3-3-3。这是铁律三（浪 4 不与浪 1 重叠）的唯一例外。', src: ['波浪理论'] },
      { zh: '级别', en: 'Degree', desc: '波浪的层级。同一段行情在不同级别下可以标注成不同结果，因此必须先定级别再数浪。', src: ['波浪理论'] },
    ],
  },
  {
    group: '价格行为',
    items: [
      { zh: '信号棒', en: 'Signal Bar', desc: '用来定义入场触发点的 K 线。本身不构成入场，需下一根 K 线突破其极值才算确认。', src: ['价格行为学'] },
      { zh: '背景', en: 'Context', desc: '形态所处的环境。同一个十字星出现在趋势回踩处与区间中部，含义截然相反。', src: ['价格行为学'] },
      { zh: '二次进场', en: 'Second Entry', desc: '同一方向的第二次尝试。成功率显著高于第一次，因为第一次往往在消化获利盘。', src: ['价格行为学'] },
      { zh: '主要趋势反转', en: 'MTR — Major Trend Reversal', desc: '在极端位置出现失败的新高或新低后结构反向。通常需要两次尝试才成立。', src: ['价格行为学'] },
      { zh: '突破测试', en: 'Breakout Test', desc: '价格突破关键位后再次回到该位置验证。守住则突破成立，跌回则视为假突破。', src: ['价格行为学'] },
    ],
  },
  {
    group: '风险与执行',
    items: [
      { zh: '失效位', en: 'Invalidation Level', desc: '一个交易方案的"我错了"标准。任何体系如果没有明确的失效位，就无法管理风险。', src: ['通用'] },
      { zh: '盈亏比', en: 'Risk / Reward Ratio', desc: '潜在盈利与潜在亏损的比值。盈亏比低于 2:1 的机会通常不值得承担。', src: ['通用'] },
      { zh: '证伪', en: 'Falsifiability', desc: '一个方法能否被客观数据否定。证伪难度越高的体系，越容易陷入自我说服。', src: ['通用'] },
      { zh: '可复现性', en: 'Reproducibility', desc: '同一张图在不同时间标注出几乎相同的结果。这是判断一套方法是否可用的核心标准。', src: ['通用'] },
    ],
  },
];
