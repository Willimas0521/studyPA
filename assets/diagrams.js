/* ==========================================================================
   交易理论图谱 —— 教学示意图定义
   --------------------------------------------------------------------------
   每张图 = 一份 spec：
     dw / dh          设计基准尺寸（沿用原 SVG 的 viewBox，标注按这套坐标书写）
     x0 / barW        第 0 根 K 线的位置与间距
     pTop / pBot      价格面板的上下边（设计坐标）
     pMin / pMax      价格轴锁定范围（给标注留白用）
     volTop / volBottom   成交量面板（不写则不画成交量）
     volColor/volAlpha    成交量柱统一配色（威科夫图习惯用琥珀色）
     closes / vol / amp   K 线数据
     draw(g)          标注。g 提供 cx/cy/vy 坐标换算与六个绘图原语

   原语：zone hline dash ring note t tHalo pin leg arrow line rect circle poly
   ========================================================================== */

window.DIAGRAM_SPECS = (function () {

  var S = {};

  /* ---------------------------------------------------------------------
     威科夫 · 弹簧效应：跌破支撑扫止损后立刻回补
     --------------------------------------------------------------------- */
  S['wyckoff-spring'] = {
    key: 'wyckoff-spring',
    dw: 900, dh: 372,
    x0: 64, barW: 40,
    pTop: 72, pBot: 250, pMin: 96, pMax: 156,
    volTop: 280, volBottom: 348,
    amp: 2.0,
    volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [150, 143, 137, 131, 125, 119, 113, 122, 131, 127, 121, 117, 115, 109, 107, 114, 123, 133],
    vol: [.30, .34, .38, .42, .50, .62, .95, .55, .50, .45, .50, .40, .36, .30, .52, .70, .85, .92],
    aria: '威科夫弹簧效应示意图：跌破支撑后迅速收回',
    draw: function (g) {
      var N = this.closes.length;
      var SUPPORT = 112;
      var cx0 = g.cx(0), cxN = g.cx(N - 1);

      g.note(g.dw / 2, 42,
        'Spring（弹簧效应）：跌破支撑扫止损后立刻回补 —— 威科夫最重要的买点',
        'var(--d-amber-strong)', 'middle', 12);

      g.dash(cx0 - 18, g.cy(SUPPORT), cxN + 18, g.cy(SUPPORT), 'var(--d-neutral)');
      g.note(cxN + 22, g.cy(SUPPORT) - 6, '支撑（SC 低点）', 'var(--d-neutral)', 'start', 10.5);

      g.line(cx0 - 30, g.vy(0), cxN + 18, g.vy(0), 'var(--border)', 1);
      g.note(cx0 - 34, this.volTop + 4, '成交量', 'var(--text-3)', 'end', 10);

      g.ring(g.cx(6), g.cy(113), 'var(--d-amber)', 'SC', g.cy(113) + 24);
      g.ring(g.cx(9), g.cy(131), 'var(--d-amber)', 'AR', g.cy(131) - 14);
      g.ring(g.cx(12), g.cy(115), 'var(--d-amber)', 'ST', g.cy(115) + 24);
      g.ring(g.cx(13), g.cy(107), 'var(--d-amber)', 'Spring', g.cy(107) + 24);
      g.ring(g.cx(15), g.cy(123), 'var(--up)', 'Test', g.cy(123) + 24);

      g.note(g.dw / 2, 366,
        '理想形态：Spring 跌破时不必放量，回归时迅速有力，随后的缩量回踩（Test）确认卖压枯竭',
        'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     威科夫 · 因果定律：横盘越宽（因），后续测量移动越大（果）
     --------------------------------------------------------------------- */
  S['wyckoff-cause-effect'] = {
    key: 'wyckoff-cause-effect',
    dw: 900, dh: 384,
    x0: 60, barW: 24,
    pTop: 76, pBot: 256, pMin: 100, pMax: 210,
    volTop: 286, volBottom: 354,
    amp: 2.0,
    volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [124, 130, 136, 140, 134, 126, 122, 128, 134, 140, 146, 156, 168, 180, 186, 190, 196],
    vol: [.30, .34, .40, .46, .42, .36, .32, .38, .44, .50, .70, .80, .88, .70, .62, .70, .85],
    aria: '威科夫因果定律测量移动示意图',
    draw: function (g) {
      var N = this.closes.length;
      var BASE_LO = 120, BASE_HI = 140, TARGET = 180;
      var cx0 = g.cx(0), cxN = g.cx(N - 1);

      g.note(g.dw / 2, 42,
        '因果定律：横盘越宽（因），后续测量移动越大（果）',
        'var(--d-amber-strong)', 'middle', 12);

      /* 蓄势区间 */
      g.rect(cx0 - 14, g.cy(BASE_HI), g.cx(9) - cx0 + 28, g.cy(BASE_LO) - g.cy(BASE_HI),
        'var(--d-amber)', 0.08, 'var(--d-amber)', '5 4', 1.2);
      g.note((cx0 + g.cx(9)) / 2, g.cy(BASE_HI) - 10, '因：横盘蓄势', 'var(--d-amber-strong)', 'middle', 10.5);

      /* 区间上下沿 */
      g.dash(cx0 - 14, g.cy(BASE_HI), cxN + 18, g.cy(BASE_HI), 'var(--d-neutral)');
      g.note(cxN + 22, g.cy(BASE_HI) - 6, '区间上沿', 'var(--d-neutral)', 'start', 10);
      g.dash(cx0 - 14, g.cy(BASE_LO), cxN + 18, g.cy(BASE_LO), 'var(--d-neutral)');
      g.note(cxN + 22, g.cy(BASE_LO) + 18, '区间下沿', 'var(--d-neutral)', 'start', 10);

      /* 测量移动：区间高度 → 目标 */
      g.dash(g.cx(11), g.cy(BASE_HI), g.cx(11), g.cy(TARGET), 'var(--d-cyan)');
      g.note(g.cx(11) + 8, (g.cy(BASE_HI) + g.cy(TARGET)) / 2,
        '测量移动 = 区间高度 → 目标 ' + TARGET, 'var(--d-cyan)', 'start', 10);
      g.dash(g.cx(9), g.cy(TARGET), cxN + 18, g.cy(TARGET), 'var(--d-cyan)');
      g.note(g.cx(9) - 6, g.cy(TARGET) - 8, '目标（果）', 'var(--d-cyan)', 'end', 10);

      /* 成交量面板 */
      g.line(cx0 - 30, g.vy(0), cxN + 18, g.vy(0), 'var(--border)', 1);
      g.note(cx0 - 34, this.volTop + 4, '成交量', 'var(--text-3)', 'end', 10);

      g.ring(g.cx(10), g.cy(146), 'var(--d-amber)', 'SOS', g.cy(146) - 14);

      g.note(g.dw / 2, 372,
        '传统上用点数图（P&F）横向数格估算目标；这里用「区间高度」作简化版测量移动，结果一致',
        'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 单根 K 线解剖：四个价格 + 实体 + 上下影线
     --------------------------------------------------------------------- */
  S['candle-anatomy'] = {
    key: 'candle-anatomy',
    dw: 900, dh: 360, x0: 150, barW: 70,
    pTop: 52, pBot: 244, pMin: 92, pMax: 142, amp: 2.8,
    closes: [108, 113, 124, 115, 119],
    aria: '单根 K 线解剖：开盘/最高/最低/收盘、实体、上下影线',
    draw: function (g) {
      var N = this.closes.length, idx = 2, c = this.closes[idx], o = this.closes[idx - 1];
      var hi = c + this.amp * (0.45 + 0.55 * Math.abs(Math.sin(idx * 1.7)));
      var lo = c - this.amp * (0.45 + 0.55 * Math.abs(Math.cos(idx * 1.3)));
      var X = g.cx(idx);
      g.note(g.dw / 2, 34, '一根 K 线 = 四个价格 + 实体 + 上下影线', 'var(--d-blue)', 'middle', 12);
      g.dash(X - 36, g.cy(hi), X + 36, g.cy(hi), 'var(--d-neutral)');
      g.note(X + 48, g.cy(hi) + 3, '最高 High', 'var(--text-3)', 'start', 10.5);
      g.dash(X - 36, g.cy(lo), X + 36, g.cy(lo), 'var(--d-neutral)');
      g.note(X + 48, g.cy(lo) + 3, '最低 Low', 'var(--text-3)', 'start', 10.5);
      g.line(X - 30, g.cy(o), X + 30, g.cy(o), 'var(--d-violet)', 1.6);
      g.note(X + 48, g.cy(o) + 3, '开盘 Open', 'var(--d-violet)', 'start', 10.5);
      g.line(X - 30, g.cy(c), X + 30, g.cy(c), 'var(--d-blue)', 1.6);
      g.note(X + 48, g.cy(c) + 3, '收盘 Close', 'var(--d-blue)', 'start', 10.5);
      g.rect(X - 16, g.cy(Math.max(o, c)), 32, g.cy(Math.min(o, c)) - g.cy(Math.max(o, c)), 'var(--d-blue)', 0.16, 'var(--d-blue)', '', 1.3);
      g.note(X, g.cy(Math.max(o, c)) - 12, '实体 Body', 'var(--d-blue)', 'middle', 10.5);
      g.note(X - 104, (g.cy(hi) + g.cy(lo)) / 2 - 7, '上影线 = 被拒绝的高价', 'var(--d-neutral)', 'end', 10);
      g.note(X - 104, (g.cy(hi) + g.cy(lo)) / 2 + 9, '下影线 = 被接住的价格', 'var(--d-neutral)', 'end', 10);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 五类典型 K 线
     --------------------------------------------------------------------- */
  S['candle-examples'] = {
    key: 'candle-examples',
    dw: 900, dh: 360, x0: 70, barW: 44,
    pTop: 56, pBot: 252, pMin: 90, pMax: 136, amp: 3.0,
    closes: [100, 109, 104, 112, 111],
    aria: '五类典型 K 线：强趋势棒 / 长上影 / 长下影 / 十字星 / 内包线',
    draw: function (g) {
      var lbl = ['① 强趋势棒', '② 长上影', '③ 长下影', '④ 十字星', '⑤ 内包线'];
      for (var i = 0; i < this.closes.length; i++) {
        g.note(g.cx(i), g.cy(this.closes[i]) - 28, lbl[i], 'var(--d-blue)', 'middle', 10.5, 700);
      }
      g.note(g.dw / 2, 332, '趋势棒看实体长短、影线看被拒绝的价格、十字星看平衡、内包看波动收缩——读法服务于"下一步该做什么"', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 上涨趋势
     --------------------------------------------------------------------- */
  S['trend-up'] = {
    key: 'trend-up',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 98, pMax: 150, amp: 1.6,
    volTop: 282, volBottom: 350, volColor: 'var(--d-blue)', volAlpha: 0.45,
    closes: [100, 104, 102, 110, 108, 116, 114, 122, 120, 128],
    aria: '上涨趋势：更高的高点与更高的低点，回撤浅、重叠少',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '上涨趋势线：连接摆动低点，衡量斜率是否放缓', 'var(--d-blue)', 'middle', 12);
      g.line(g.cx(0), g.cy(100), g.cx(2), g.cy(102), 'var(--d-blue)', 1.6, '5 4', 0.9);
      g.line(g.cx(2), g.cy(102), g.cx(4), g.cy(108), 'var(--d-blue)', 1.6, '5 4', 0.9);
      g.line(g.cx(4), g.cy(108), g.cx(6), g.cy(114), 'var(--d-blue)', 1.6, '5 4', 0.9);
      g.line(g.cx(6), g.cy(114), g.cx(8), g.cy(120), 'var(--d-blue)', 1.6, '5 4', 0.9);
      g.ring(g.cx(2), g.cy(102), 'var(--d-blue)', 'HL', g.cy(102) + 22);
      g.ring(g.cx(6), g.cy(114), 'var(--d-blue)', 'HL', g.cy(114) + 22);
      g.arrow(g.cx(0), 98, g.cx(N - 1), 128, 'var(--up)', 2);
      g.note(g.dw / 2, 372, '回撤浅、K 线重叠少、趋势棒多 → 顺势持有，等回踩趋势线进场', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 上升通道
     --------------------------------------------------------------------- */
  S['trend-channel'] = {
    key: 'trend-channel',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 94, pMax: 158, amp: 1.6,
    volTop: 282, volBottom: 350,
    closes: [100, 104, 103, 112, 110, 120, 118, 128, 126, 136, 134, 144],
    aria: '上升通道：价格在两个平行边界内运行',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '上升通道：上轨压回、下轨接住，回撤不破下轨', 'var(--d-blue)', 'middle', 12);
      g.line(cx0, g.cy(100), cxN, g.cy(134), 'var(--d-blue)', 1.8, '6 5', 0.9);
      g.line(cx0, g.cy(124), cxN, g.cy(158), 'var(--d-violet)', 1.8, '6 5', 0.9);
      g.note(cxN - 4, g.cy(158) - 6, '上轨', 'var(--d-violet)', 'end', 10);
      g.note(cxN - 4, g.cy(134) + 18, '下轨', 'var(--d-blue)', 'end', 10);
      g.ring(g.cx(5), g.cy(118), 'var(--up)', '回踩下轨做多', g.cy(118) - 12);
      g.note(g.dw / 2, 372, '打到上轨偏空、打到下轨偏多；止损放在通道外侧', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 趋势反转
     --------------------------------------------------------------------- */
  S['trend-reversal'] = {
    key: 'trend-reversal',
    dw: 900, dh: 384, x0: 60, barW: 38,
    pTop: 64, pBot: 250, pMin: 92, pMax: 152, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [110, 116, 122, 128, 130, 126, 118, 110, 104, 100, 96],
    aria: '趋势反转：创新高后反转棒 + 跟进确认，始终在场方向翻空',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '反转：新高后反转棒吞噬，下一根确认即翻转始终在场方向', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0, g.cy(110), g.cx(4), g.cy(130), 'var(--up)', 1.8, '6 5', 0.9);
      g.ring(g.cx(4), g.cy(130), 'var(--up)', '新高', g.cy(130) - 12);
      g.ring(g.cx(5), g.cy(126), 'var(--d-amber)', '反转棒', g.cy(126) + 24);
      g.arrow(g.cx(5), 126, g.cx(N - 1), 96, 'var(--down)', 2);
      g.line(cx0, g.cy(96), cxN, g.cy(96), 'var(--down)', 1.6, '6 5', 0.9);
      g.note(cxN - 4, g.cy(96) - 6, '新低 · 始终在场 = 空', 'var(--down)', 'end', 10);
      g.note(g.dw / 2, 372, '没有跟进 K 线，多半只是回调；跟进确认后才切到反向始终在场', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 宽幅区间
     --------------------------------------------------------------------- */
  S['range-types'] = {
    key: 'range-types',
    dw: 900, dh: 384, x0: 60, barW: 38,
    pTop: 64, pBot: 250, pMin: 96, pMax: 150, amp: 2.2,
    volTop: 282, volBottom: 350,
    closes: [120, 132, 110, 138, 104, 134, 108, 140, 106, 132],
    aria: '宽幅区间：推动大、回撤深，容易伪装成杂乱趋势',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '宽幅区间：边界相隔远，回撤深到像趋势', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 14, g.cy(140), cxN + 14, g.cy(140), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.line(cx0 - 14, g.cy(104), cxN + 14, g.cy(104), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.note(cxN + 18, g.cy(140) - 4, '上界 ~140', 'var(--d-neutral)', 'start', 10);
      g.note(cxN + 18, g.cy(104) + 14, '下界 ~104', 'var(--d-neutral)', 'start', 10);
      g.note(g.dw / 2, 372, '做法与窄幅相反：止损放宽、仓位减小、目标先设中部——钱来自边界', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 铁丝网 / 交易区间
     --------------------------------------------------------------------- */
  S['trading-range'] = {
    key: 'trading-range',
    dw: 900, dh: 384, x0: 60, barW: 34,
    pTop: 64, pBot: 250, pMin: 100, pMax: 148, amp: 2.6,
    volTop: 282, volBottom: 350,
    closes: [124, 118, 130, 112, 126, 116, 132, 114, 128, 120, 134, 118, 126],
    aria: '交易区间 / 铁丝网：长影线互相穿插，方向毫无规律',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '铁丝网（Barb Wire）：长影线互相穿插、方向无规律 = 信息真空', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 14, g.cy(132), cxN + 14, g.cy(132), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.line(cx0 - 14, g.cy(112), cxN + 14, g.cy(112), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.note(cxN + 18, g.cy(132) - 4, '供给区', 'var(--d-neutral)', 'start', 10);
      g.note(cxN + 18, g.cy(112) + 14, '需求区', 'var(--d-neutral)', 'start', 10);
      g.note(g.dw / 2, 372, '正确反应是不下单——任何方向的止损都容易被反复扫掉，摩擦成本极高', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 边界测试
     --------------------------------------------------------------------- */
  S['range-wearing'] = {
    key: 'range-wearing',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 100, pMax: 150, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [120, 124, 122, 118, 122, 120, 116, 121, 119, 122, 120, 123],
    aria: '边界测试：价格反复回到同一侧边界，每次都消耗挂单与止损',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '边界测试（Range Test）：次数越多，边界越薄，越接近突破', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 14, g.cy(118), cxN + 14, g.cy(118), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.note(cxN + 18, g.cy(118) - 4, '被反复测试的下界', 'var(--d-neutral)', 'start', 10);
      [2, 5, 8, 11].forEach(function (i) { g.ring(g.cx(i), g.cy(118), 'var(--d-amber)', '测' + (i), g.cy(118) + 22); });
      g.note(g.dw / 2, 372, '次数少 → 边缘反向为主；次数多 → 开始准备突破方向跟随', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 开盘趋势（Trend from the Open）
     --------------------------------------------------------------------- */
  S['opening-breakout'] = {
    key: 'opening-breakout',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 96, pMax: 152, amp: 1.4,
    volTop: 282, volBottom: 350, volColor: 'var(--up)', volAlpha: 0.5,
    closes: [100, 106, 112, 118, 124, 130, 136, 142, 148, 154],
    aria: '开盘定方向：全天单边推进，回撤浅、不给回踩',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '开盘趋势（Trend from the Open）：开盘即定方向，全天单边', 'var(--up)', 'middle', 12);
      g.dash(cx0 - 14, g.cy(100), cxN + 14, g.cy(100), 'var(--d-neutral)');
      g.note(cx0 - 18, g.cy(100) - 4, '开盘', 'var(--text-3)', 'end', 10);
      g.arrow(g.cx(0), 100, g.cx(N - 1), 154, 'var(--up)', 2);
      g.ring(g.cx(3), g.cy(118), 'var(--up)', '浅回撤', g.cy(118) - 12);
      g.note(g.dw / 2, 372, '"等回调"是最贵的一种耐心——只能用突破挂单或小仓市价跟进', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 突破后区间
     --------------------------------------------------------------------- */
  S['breakout-types'] = {
    key: 'breakout-types',
    dw: 900, dh: 384, x0: 60, barW: 36,
    pTop: 64, pBot: 250, pMin: 96, pMax: 156, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [110, 120, 108, 122, 112, 120, 128, 134, 140, 144, 150, 146, 152, 148],
    aria: '突破后区间：突破不再延续，在新高度重新横盘（趋势中继）',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '突破后区间（Breakout Then Range）：节奏变慢，策略切回边缘反向', 'var(--d-amber-strong)', 'middle', 12);
      g.line(g.cx(0) - 10, g.cy(122), g.cx(5) + 10, g.cy(122), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.line(g.cx(0) - 10, g.cy(108), g.cx(5) + 10, g.cy(108), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.arrow(g.cx(5), 122, g.cx(8), 140, 'var(--up)', 2);
      g.ring(g.cx(8), g.cy(140), 'var(--up)', '突破', g.cy(140) - 12);
      g.line(g.cx(9) - 8, g.cy(152), cxN + 10, g.cy(152), 'var(--d-cyan)', 1.4, '6 5', 0.85);
      g.line(g.cx(9) - 8, g.cy(144), cxN + 10, g.cy(144), 'var(--d-cyan)', 1.4, '6 5', 0.85);
      g.note(cxN + 14, g.cy(148), '第二个区间', 'var(--d-cyan)', 'start', 10);
      g.note(g.dw / 2, 372, '它不代表趋势结束，只代表节奏变慢——从"追突破"切回"区间边缘反向"', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 区间投射（测量移动）
     --------------------------------------------------------------------- */
  S['measured-move'] = {
    key: 'measured-move',
    dw: 900, dh: 384, x0: 60, barW: 38,
    pTop: 64, pBot: 250, pMin: 96, pMax: 160, amp: 1.6,
    volTop: 282, volBottom: 350, volColor: 'var(--d-cyan)', volAlpha: 0.5,
    closes: [110, 120, 108, 122, 112, 120, 128, 136, 144, 152],
    aria: '区间投射：把区间高度复制到突破方向得到第一目标位',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '区间投射（Range Projection）：区间高度 → 突破方向的目标', 'var(--d-cyan)', 'middle', 12);
      g.rect(g.cx(0) - 12, g.cy(122), g.cx(5) - g.cx(0) + 24, g.cy(108) - g.cy(122), 'var(--d-neutral)', 0.08, 'var(--d-neutral)', '5 4', 1.2);
      g.note((g.cx(0) + g.cx(5)) / 2, g.cy(108) - 10, '区间高度', 'var(--d-neutral)', 'middle', 10);
      var BO = 6;
      g.dash(g.cx(BO), g.cy(120), g.cx(BO), g.cy(134), 'var(--d-cyan)');
      g.note(g.cx(BO) + 8, (g.cy(120) + g.cy(134)) / 2, '+区间高度', 'var(--d-cyan)', 'start', 10);
      g.dash(g.cx(BO), g.cy(134), cxN + 14, g.cy(134), 'var(--d-cyan)');
      g.note(cxN + 18, g.cy(134) - 4, '目标', 'var(--d-cyan)', 'start', 10);
      g.note(g.dw / 2, 372, '目标更适合规划减仓节奏，而非设死止盈——实际常落在目标的 0.5~2 倍之间', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 缺口回补
     --------------------------------------------------------------------- */
  S['gap-fill'] = {
    key: 'gap-fill',
    dw: 900, dh: 384, x0: 60, barW: 44,
    pTop: 64, pBot: 250, pMin: 110, pMax: 152, amp: 1.6,
    volTop: 282, volBottom: 350,
    closes: [118, 120, 119, 135, 138, 136, 132, 134, 130, 128, 126],
    aria: '缺口回补：价格之后重新走回缺口空档，把空档填上',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '缺口回补（Gap Fill）：空档是磁铁不是墙，九成会被回填', 'var(--d-cyan)', 'middle', 12);
      var gx0 = g.cx(2) + 18, gx1 = g.cx(3) - 18;
      g.rect(gx0, g.cy(150), gx1 - gx0, g.cy(110) - g.cy(150), 'var(--d-cyan)', 0.10, 'var(--d-cyan)', '4 3', 1.2);
      g.note((gx0 + gx1) / 2, g.cy(150) - 6, '缺口空档', 'var(--d-cyan)', 'middle', 10);
      g.arrow(g.cx(3), 135, g.cx(N - 1), 120, 'var(--down)', 2);
      g.ring(g.cx(N - 1), g.cy(126), 'var(--down)', '回补', g.cy(126) + 22);
      g.note(g.dw / 2, 372, '别把缺口当成可靠支撑/阻力——回补本身不是信号，只是说明那里是磁铁', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 衰竭跳空
     --------------------------------------------------------------------- */
  S['gap-types'] = {
    key: 'gap-types',
    dw: 900, dh: 384, x0: 60, barW: 44,
    pTop: 64, pBot: 250, pMin: 108, pMax: 158, amp: 1.6,
    volTop: 282, volBottom: 350, volColor: 'var(--up)', volAlpha: 0.55,
    closes: [110, 116, 122, 128, 134, 140, 152, 150, 146, 142, 138],
    aria: '衰竭跳空：趋势末端急涨的跳空，几乎一定被快速回补',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '衰竭跳空（Exhaustion Gap）：末端急涨放量，随后快速回补 = 转向预警', 'var(--up)', 'middle', 12);
      var gx0 = g.cx(5) + 18, gx1 = g.cx(6) - 18;
      g.rect(gx0, g.cy(158), gx1 - gx0, g.cy(108) - g.cy(158), 'var(--up)', 0.10, 'var(--up)', '4 3', 1.2);
      g.ring(g.cx(6), g.cy(152), 'var(--up)', '衰竭跳空', g.cy(152) - 12);
      g.arrow(g.cx(6), 152, g.cx(N - 1), 120, 'var(--down)', 2);
      g.note(g.dw / 2, 372, '它几乎一定被快速回补——回补是最可靠的转向预警之一', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 宽通道
     --------------------------------------------------------------------- */
  S['channel-width'] = {
    key: 'channel-width',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 92, pMax: 142, amp: 2.0,
    volTop: 282, volBottom: 350,
    closes: [100, 112, 104, 116, 106, 120, 110, 124, 114, 128, 118, 132],
    aria: '宽通道：回撤深到几乎摸到对侧边界，已有一半像区间',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '宽通道（Broad Channel）：回撤深到几乎摸到对侧，已半是区间', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0, g.cy(100), cxN, g.cy(132), 'var(--d-blue)', 1.8, '6 5', 0.9);
      g.line(cx0, g.cy(124), cxN, g.cy(156), 'var(--d-violet)', 1.8, '6 5', 0.9);
      g.note(cxN - 4, g.cy(156) - 6, '上轨', 'var(--d-violet)', 'end', 10);
      g.note(cxN - 4, g.cy(132) + 18, '下轨', 'var(--d-blue)', 'end', 10);
      g.ring(g.cx(2), g.cy(104), 'var(--d-amber)', '深回撤扫损', g.cy(104) + 24);
      g.note(g.dw / 2, 372, '当区间处理：边缘反向、目标先设通道中部、止损放宽、仓位减半', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 通道的三种结局
     --------------------------------------------------------------------- */
  S['channel-fates'] = {
    key: 'channel-fates',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 92, pMax: 156, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [100, 108, 104, 114, 110, 120, 116, 126, 122, 132, 140, 148],
    aria: '通道被打破之后：延续 / 反转 / 中继，三种结局',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '通道被打破：只有三种结局（延续 / 反转 / 中继）', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0, g.cy(100), g.cx(7), g.cy(126), 'var(--d-blue)', 1.8, '6 5', 0.9);
      g.line(cx0, g.cy(122), g.cx(7), g.cy(148), 'var(--d-violet)', 1.8, '6 5', 0.9);
      g.ring(g.cx(7), g.cy(126), 'var(--d-amber)', '实体收在通道外', g.cy(126) - 12);
      g.arrow(g.cx(7), 126, g.cx(N - 1), 148, 'var(--up)', 2);
      g.note(g.dw / 2, 372, '事先谁也无法确定是哪一种——但每种应对都明确，关键是先识别"收在通道外"', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 下降楔形
     --------------------------------------------------------------------- */
  S['wedge-types'] = {
    key: 'wedge-types',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 100, pMax: 152, amp: 1.6,
    volTop: 282, volBottom: 350,
    closes: [140, 134, 138, 130, 134, 126, 130, 122, 126, 120],
    aria: '下降楔形：高低点同降但上沿更陡，向右收拢，通常看涨',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 40, '下降楔形（Falling Wedge）：上沿更陡、向右收拢，通常看涨', 'var(--d-blue)', 'middle', 12);
      g.line(cx0, g.cy(142), cxN, g.cy(124), 'var(--d-violet)', 1.8, '6 5', 0.9);
      g.line(cx0, g.cy(122), cxN, g.cy(118), 'var(--d-blue)', 1.8, '6 5', 0.9);
      g.note(cx0 + 4, g.cy(142) - 6, '上沿', 'var(--d-violet)', 'start', 10);
      g.note(cx0 + 4, g.cy(122) + 16, '下沿', 'var(--d-blue)', 'start', 10);
      g.ring(g.cx(5), g.cy(124), 'var(--up)', '向上突破', g.cy(124) - 12);
      g.arrow(g.cx(5), 124, g.cx(N - 1) + 6, 138, 'var(--up)', 2);
      g.note(g.dw / 2, 372, '出现在下跌末端，抛压越来越轻，随后多向上突破', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 支撑阻力角色互换
     --------------------------------------------------------------------- */
  S['support-resistance'] = {
    key: 'support-resistance',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 96, pMax: 150, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [120, 124, 122, 126, 118, 116, 112, 114, 110, 108],
    aria: '支撑与阻力：跌破后支撑翻转为阻力（角色互换）',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1), S = 118;
      g.note(g.dw / 2, 40, '角色互换（Role Reversal）：支撑跌破后翻转为阻力', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 12, g.cy(S), g.cx(3) + 10, g.cy(S), 'var(--up)', 1.6, '6 5', 0.9);
      g.note(g.cx(3) + 14, g.cy(S) - 4, '支撑', 'var(--up)', 'start', 10);
      g.ring(g.cx(3), g.cy(118), 'var(--up)', '反弹', g.cy(118) - 12);
      g.arrow(g.cx(3), 118, g.cx(5), 108, 'var(--down)', 2);
      g.line(g.cx(5), g.cy(S), cxN + 12, g.cy(S), 'var(--down)', 1.6, '6 5', 0.9);
      g.note(cxN + 16, g.cy(S) - 4, '阻力', 'var(--down)', 'start', 10);
      g.ring(g.cx(7), g.cy(114), 'var(--down)', '回踩变阻力', g.cy(114) + 24);
      g.note(g.dw / 2, 372, '跌破时被套的买盘解套卖出，使原买盘区变成卖压区', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     价格行为 · 失败突破（假突破）
     --------------------------------------------------------------------- */
  S['reversal-types'] = {
    key: 'reversal-types',
    dw: 900, dh: 384, x0: 60, barW: 40,
    pTop: 64, pBot: 250, pMin: 96, pMax: 150, amp: 1.8,
    volTop: 282, volBottom: 350, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [120, 126, 130, 134, 138, 136, 130, 124, 120, 116],
    aria: '失败突破（假突破）：创新高立刻被拉回，套住追突破的人',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1), HI = 138;
      g.note(g.dw / 2, 40, '失败突破（False Breakout）：创新高立刻拉回，套住追涨者', 'var(--d-amber-strong)', 'middle', 12);
      g.dash(cx0 - 12, g.cy(HI), cxN + 12, g.cy(HI), 'var(--d-neutral)');
      g.note(cxN + 16, g.cy(HI) - 4, '前高 138', 'var(--d-neutral)', 'start', 10);
      g.ring(g.cx(4), g.cy(138), 'var(--d-amber)', '假突破', g.cy(138) - 12);
      g.arrow(g.cx(4), 138, g.cx(N - 1), 116, 'var(--down)', 2);
      g.note(g.dw / 2, 372, '被套的止损变成反向燃料——这是最干净的反转结构之一', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     威科夫 · 吸筹五阶段示意图（抽象化）
     --------------------------------------------------------------------- */
  S['wyckoff-schematic'] = {
    key: 'wyckoff-schematic',
    dw: 900, dh: 392, x0: 48, barW: 28,
    pTop: 70, pBot: 256, pMin: 86, pMax: 162, amp: 1.6,
    volTop: 288, volBottom: 356, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [138, 134, 128, 120, 112, 104, 114, 122, 120, 110, 116, 122, 120, 112, 106, 102, 100, 96, 110, 124, 118, 112, 120, 128, 136, 144, 152],
    aria: '威科夫吸筹示意图：五阶段 A→E，卖压枯竭到 spring 测试再到 SOS 确认',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 38, '威科夫吸筹示意图（抽象化）：五个阶段 A → E', 'var(--d-amber-strong)', 'middle', 12);
      var phases = [['A', 3], ['B', 11], ['C', 17], ['D', 20], ['E', 24]];
      phases.forEach(function (p) { g.note(g.cx(p[1]), 58, p[0], 'var(--d-neutral)', 'middle', 11, 700); });
      g.ring(g.cx(5), g.cy(104), 'var(--d-amber)', 'SC', g.cy(104) + 24);
      g.ring(g.cx(7), g.cy(122), 'var(--d-amber)', 'AR', g.cy(122) - 12);
      g.ring(g.cx(14), g.cy(106), 'var(--d-amber)', 'ST', g.cy(106) + 24);
      g.ring(g.cx(17), g.cy(96), 'var(--up)', 'Spring', g.cy(96) + 24);
      g.ring(g.cx(19), g.cy(124), 'var(--up)', 'SOS', g.cy(124) - 12);
      g.ring(g.cx(21), g.cy(112), 'var(--d-amber)', 'LPS', g.cy(112) + 24);
      g.note(g.dw / 2, 380, '实际行情不会这么规整：重点是"卖压逐步枯竭 → spring 测试 → SOS 确认 → LPS 进场"的节奏', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     威科夫 · SOS 后的 LPS（最后支撑点）
     --------------------------------------------------------------------- */
  S['wyckoff-sos-lps'] = {
    key: 'wyckoff-sos-lps',
    dw: 900, dh: 392, x0: 60, barW: 40,
    pTop: 70, pBot: 256, pMin: 100, pMax: 158, amp: 1.6,
    volTop: 288, volBottom: 356, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [110, 120, 108, 122, 112, 120, 128, 136, 130, 138, 146],
    aria: 'SOS（强势信号）后 LPS（最后支撑点）回踩守住，顺势进场',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 42, 'SOS 后 LPS：突破后的缩量回踩守住，是最好的顺势进场位', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 12, g.cy(122), g.cx(5) + 10, g.cy(122), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.line(cx0 - 12, g.cy(108), g.cx(5) + 10, g.cy(108), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.note(cxN + 16, g.cy(122) + 4, '区间上沿 122', 'var(--d-neutral)', 'start', 10);
      g.ring(g.cx(7), g.cy(136), 'var(--up)', 'SOS 强势突破', g.cy(136) - 14);
      g.arrow(g.cx(7), 136, g.cx(8), 130, 'var(--down)', 1.8);
      g.ring(g.cx(8), g.cy(130), 'var(--d-amber)', 'LPS 回踩', g.cy(130) + 24);
      g.arrow(g.cx(8), 130, g.cx(N - 1), 146, 'var(--up)', 2);
      g.note(g.dw / 2, 380, 'LPS 相当于 ICT 的溢价回踩 / PA 的突破二次进场——守住前高即确认', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     威科夫 · UTAD（派发后的上冲）
     --------------------------------------------------------------------- */
  S['wyckoff-utad'] = {
    key: 'wyckoff-utad',
    dw: 900, dh: 392, x0: 60, barW: 40,
    pTop: 70, pBot: 256, pMin: 96, pMax: 156, amp: 1.8,
    volTop: 288, volBottom: 356, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [120, 130, 122, 132, 124, 130, 140, 128, 120, 112, 104],
    aria: 'UTAD（派发后的上冲）：假突破新高放量却收低，随后跌回区间',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 42, 'UTAD（Upthrust After Distribution）：假突破新高，放量收低即派发', 'var(--d-amber-strong)', 'middle', 12);
      g.line(cx0 - 12, g.cy(132), g.cx(5) + 10, g.cy(132), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.line(cx0 - 12, g.cy(120), g.cx(5) + 10, g.cy(120), 'var(--d-neutral)', 1.4, '6 5', 0.85);
      g.note(cxN + 16, g.cy(132) + 4, '区间上沿 132', 'var(--d-neutral)', 'start', 10);
      g.ring(g.cx(6), g.cy(140), 'var(--d-amber)', 'UTAD 假突破', g.cy(140) - 12);
      g.arrow(g.cx(6), 140, g.cx(N - 1), 104, 'var(--down)', 2);
      g.note(g.dw / 2, 380, '判别点：创新高放量却收低位、随后迅速跌回——那是真派发；收高位站稳才是真突破', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     威科夫 · VSA 量价分析
     --------------------------------------------------------------------- */
  S['wyckoff-vsa'] = {
    key: 'wyckoff-vsa',
    dw: 900, dh: 392, x0: 60, barW: 40,
    pTop: 70, pBot: 256, pMin: 100, pMax: 150, amp: 1.6,
    volTop: 288, volBottom: 356, volColor: 'var(--d-amber)', volAlpha: 0.5,
    closes: [120, 116, 112, 108, 104, 108, 114, 120, 126, 132],
    aria: 'VSA 量价分析：低位缩量见卖压枯竭，放量上涨见真实需求',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 42, 'VSA 量价分析：看"成交量相对水平"背后的买卖力量', 'var(--d-amber-strong)', 'middle', 12);
      g.ring(g.cx(4), g.cy(104), 'var(--down)', '卖盘枯竭', g.cy(104) + 24);
      g.note(g.cx(4), g.vy(this.vol[4]) - 8, '地量', 'var(--text-3)', 'middle', 9.5);
      g.ring(g.cx(8), g.cy(126), 'var(--up)', '放量上涨', g.cy(126) - 12);
      g.note(g.cx(8), g.vy(this.vol[8]) - 8, '放量', 'var(--text-3)', 'middle', 9.5);
      g.note(g.dw / 2, 380, '判定对成交量相对水平极敏感；外汇等分散市场无统一成交量，应用需谨慎', 'var(--text-3)', 'middle', 10.5);
    }
  };

  /* ---------------------------------------------------------------------
     艾略特 · 5-3 基本结构
     --------------------------------------------------------------------- */
  S['elliott-53'] = {
    key: 'elliott-53',
    dw: 900, dh: 392, x0: 60, barW: 42,
    pTop: 70, pBot: 256, pMin: 100, pMax: 152, amp: 2.0,
    volTop: 288, volBottom: 356,
    closes: [110, 120, 114, 132, 126, 142, 130, 136, 118],
    aria: '艾略特 5-3 基本结构：五浪推动 + 三浪调整',
    draw: function (g) {
      var N = this.closes.length, cx0 = g.cx(0), cxN = g.cx(N - 1);
      g.note(g.dw / 2, 42, '5-3 基本结构：五浪推动（Impulse）+ 三浪调整（Corrective）', 'var(--d-violet)', 'middle', 12);
      var lab = ['1', '2', '3', '4', '5', 'a', 'b', 'c'];
      for (var i = 0; i < N; i++) {
        g.note(g.cx(i), g.cy(this.closes[i]) + (i % 2 ? 22 : -22), lab[i], 'var(--d-violet)', 'middle', 11, 700);
      }
      g.zone(0, 4, 100, 152, 'var(--up)', 0.06);
      g.note(g.cx(2), g.cy(150) - 6, '推动浪 1-2-3-4-5', 'var(--up)', 'middle', 10);
      g.zone(5, 8, 100, 152, 'var(--down)', 0.06);
      g.note(g.cx(6.5), g.cy(150) - 6, '调整浪 a-b-c', 'var(--down)', 'middle', 10);
      g.note(g.dw / 2, 380, '推动浪与主趋势同向（五浪），调整浪逆势（三浪）——这是递归嵌套的起点', 'var(--text-3)', 'middle', 10.5);
    }
  };

  return S;
})();
