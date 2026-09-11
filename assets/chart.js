/* ==========================================================================
   交易理论图谱 —— 图表模块
   1) 五体系图层交互图：同一段行情，五个体系各自的标注
   2) 静态示意图：威科夫吸筹结构、艾略特 5-3 结构
   依赖：无
   ========================================================================== */

window.ChartModule = (function () {

  /* ======================================================================
     一、合成行情数据
     结构：下跌 → 抛售高潮 → 长时间横盘 → 向下假破 → 突破走强 → 回踩 → 拉升
     用固定种子生成，保证每次渲染一致。
     ====================================================================== */

  var N = 85;

  var ANCHORS = [
    [0, 113], [6, 109], [12, 104], [17, 100], [19, 95], [20, 91.5],
    [23, 98.5], [28, 94.8], [31, 93.2], [36, 96.8],
    [41, 93.2], [43, 90.6], [45, 92.6],
    [49, 97.5], [53, 101.0], [55, 104.0],
    [58, 100.0], [61, 94.2],
    [66, 101], [70, 107], [75, 113], [80, 117], [84, 120]
  ];

  function baseAt(i) {
    for (var k = 0; k < ANCHORS.length - 1; k++) {
      var a = ANCHORS[k], b = ANCHORS[k + 1];
      if (i >= a[0] && i <= b[0]) {
        var t = (b[0] === a[0]) ? 0 : (i - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return ANCHORS[ANCHORS.length - 1][1];
  }

  function makeSeries() {
    var seed = 20260911;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

    var bars = [], prevClose = baseAt(0) + 0.6;

    for (var i = 0; i < N; i++) {
      var b = baseAt(i);
      var busy = (i === 20 || i === 43) ? 2.1 : (i > 54 ? 0.75 : 0.55);
      var close = b + (rnd() - 0.5) * 1.4;
      var open = prevClose + (rnd() - 0.5) * 0.5;
      var hi = Math.max(open, close) + rnd() * 0.40 * busy + 0.14;
      var lo = Math.min(open, close) - rnd() * 0.40 * busy - 0.14;

      /* 成交量：抛售高潮、弹簧、突破处放量 */
      var v = 0.30 + rnd() * 0.28;
      if (i === 19) v = 0.86;
      if (i === 20) v = 1.00;
      if (i === 31) v = 0.30;
      if (i === 43) v = 0.62;
      if (i === 44) v = 0.34;
      if (i === 54) v = 0.78;
      if (i === 55) v = 0.92;
      if (i > 60) v = 0.42 + rnd() * 0.30;
      if (i > 74) v = 0.55 + rnd() * 0.28;

      bars.push({ o: open, h: hi, l: lo, c: close, v: v });
      prevClose = close;
    }

    /* 关键 K 线手动校正，让形态干净可读 */
    bars[19] = { o: 96.2, h: 96.5, l: 93.6, c: 94.1, v: 0.88 };
    bars[20] = { o: 94.1, h: 94.4, l: 91.50, c: 92.05, v: 1.00 };   /* SC 抛售高潮 */
    bars[21] = { o: 92.05, h: 94.6, l: 91.9, c: 94.3, v: 0.72 };
    bars[30] = { o: 94.6, h: 96.0, l: 93.6, c: 93.9, v: 0.42 };
    bars[31] = { o: 93.9, h: 94.2, l: 93.20, c: 93.8, v: 0.28 };   /* ST 二次测试（缩量） */
    bars[42] = { o: 93.4, h: 93.6, l: 92.2, c: 92.6, v: 0.52 };
    bars[43] = { o: 92.4, h: 92.8, l: 90.55, c: 92.15, v: 0.62 };  /* Spring 弹簧 */
    bars[44] = { o: 92.15, h: 93.4, l: 92.0, c: 93.1, v: 0.36 };
    bars[45] = { o: 93.1, h: 94.4, l: 92.9, c: 94.0, v: 0.44 };
    bars[53] = { o: 100.2, h: 101.4, l: 100.0, c: 101.1, v: 0.70 };
    bars[54] = { o: 101.1, h: 102.3, l: 100.9, c: 102.0, v: 0.78 };
    bars[55] = { o: 101.9, h: 104.05, l: 101.6, c: 103.6, v: 0.92 }; /* SOS 突破棒 */
    bars[56] = { o: 103.6, h: 103.9, l: 102.0, c: 102.4, v: 0.60 };
    bars[59] = { o: 99.6, h: 100.2, l: 98.4, c: 98.7, v: 0.44 };
    bars[60] = { o: 98.7, h: 99.0, l: 94.6, c: 95.0, v: 0.52 };
    bars[61] = { o: 95.0, h: 95.5, l: 94.05, c: 94.9, v: 0.42 };   /* LPS 最后支撑点（缩量） */
    bars[62] = { o: 94.9, h: 97.2, l: 94.6, c: 96.8, v: 0.54 };
    bars[84] = { o: 118.6, h: 120.6, l: 118.2, c: 120.2, v: 0.72 };

    return bars;
  }

  /* 关键价位（与数据对齐） */
  var KEY = {
    support: 91.50,     /* SC 低点 / 区间下沿 */
    resistance: 98.50,  /* AR 高点 / 区间上沿 */
    mid: 95.00,         /* 区间中点（折扣/溢价分界） */
    springLow: 90.55,
    sosHigh: 104.05,
    lpsLow: 94.05,
    oteHigh: 95.70,
    oteLow: 93.40,
    mmTarget: 105.50,   /* 98.50 + 7.00 （区间高度投影） */
    barSC: 20, barAR: 23, barST: 31, barSpring: 43,
    barSOS: 55, barLPS: 61, barEnd: 84
  };

  /* ======================================================================
     二、图层定义
     ====================================================================== */

  var LAYERS = [
    { id: 'levels',  name: '关键价位',   color: 'var(--d-neutral)' },
    { id: 'pa',      name: '价格行为学', color: 'var(--d-blue)' },
    { id: 'wyckoff', name: '威科夫',     color: 'var(--d-amber)' },
    { id: 'ict',     name: 'ICT',        color: 'var(--d-violet)' },
    { id: 'smc',     name: 'SMC',        color: 'var(--d-cyan)' },
    { id: 'elliott', name: '波浪理论',   color: 'var(--d-pink)' }
  ];

  var LAYER_NOTES = {
    levels:  '区间上沿 98.5、区间下沿 91.5 与中点 95.0 —— 所有体系都围绕这三条线展开。中点以下为折价区，是买入区。',
    pa:      '交易区间框定、区间突破与跟随、突破后的二次进场、以及用区间高度投影的测量移动目标 105.5。',
    wyckoff: 'SC 抛售高潮 → AR 自动反弹 → ST 二次测试 → Spring 弹簧 → SOS 强势信号 → LPS 最后支撑点，完整的吸筹五阶段。',
    ict:     'SSL 被扫荡、BOS 结构突破、FVG 缺口、Order Block、OTE 62%–79% 回撤区，并标出溢价与折价的分界。',
    smc:     '与 ICT 图层几乎完全重合 —— 这正是重点：SMC 是 ICT 概念的简化版，结构与区域的定义基本一致。多了等低点与 CHoCH 的标注。',
    elliott: '从弹簧低点起数：浪 ① 至 104.05，浪 ② 回撤 73% 落在 OTE 区内，浪 ③ 的 1.618 扩展目标约 115.9。'
  };

  /* ======================================================================
     三、几何
     ====================================================================== */

  var W = 860, H = 545;
  var PAD = { l: 48, r: 96, t: 26, b: 44 };
  var VOL_H = 52, GAP = 30;
  var plotH = H - PAD.t - PAD.b - VOL_H - GAP;   /* 393 */
  var volTop = PAD.t + plotH + GAP;              /* 449 */
  var volBottom = volTop + VOL_H;                /* 501 */
  var plotW = W - PAD.l - PAD.r;
  var barW = plotW / N;

  var SERIES = makeSeries();

  var PMIN = Infinity, PMAX = -Infinity;
  SERIES.forEach(function (b) { if (b.l < PMIN) PMIN = b.l; if (b.h > PMAX) PMAX = b.h; });
  PMIN -= 3.6;   /* 底部留白，给低位标注留出空间 */
  PMAX += 2.2;

  function X(i) { return PAD.l + (i + 0.5) * barW; }
  function Y(p) { return PAD.t + (PMAX - p) / (PMAX - PMIN) * plotH; }
  function VY(v) { return volBottom - v * (VOL_H - 6); }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ======================================================================
     四、SVG 片段构造器
     ====================================================================== */

  function t(x, y, str, color, anchor, size, weight) {
    return '<text class="anno-text" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" fill="' + color + '" text-anchor="' + (anchor || 'middle') +
      '" font-size="' + (size || 10.5) + '"' +
      (weight ? ' font-weight="' + weight + '"' : '') +
      '>' + esc(str) + '</text>';
  }

  /* 水平价位线 + 右侧留白区内的标签（dy 用于同价位多图层时错开） */
  function hline(price, i1, i2, color, label, dash, dy) {
    var y = Y(price);
    var x1 = X(i1), x2 = X(i2);
    var out = '<line class="anno-line" x1="' + x1.toFixed(1) + '" y1="' + y.toFixed(1) +
      '" x2="' + x2.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + color + '"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' opacity=".85"/>';
    if (label) {
      out += t(W - 8, y + 3.4 + (dy || 0), label, color, 'end', 10.5, 660);
    }
    return out;
  }

  /* 矩形区域 */
  function zone(i1, i2, pTop, pBot, color, opacity, dash) {
    var x = X(i1 - 0.5), w = X(i2 + 0.5) - x;
    var y = Y(pTop), h = Y(pBot) - Y(pTop);
    return '<rect class="anno-box" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) +
      '" fill="' + color + '" fill-opacity="' + (opacity || 0.14) +
      '" stroke="' + color + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') +
      ' rx="2"/>';
  }

  /* 图层较多时隐藏次级说明，避免文字堆叠 */
  var SUB_ON = true;

  /* 带引线的标注。dy 用于手动错开相邻标注，避免文字重叠 */
  function pin(bar, price, color, label, dir, sub, dy) {
    var px = X(bar), py = Y(price);
    var off = (dir === 'down') ? 1 : -1;
    if (!SUB_ON) sub = null;
    var base = py + off * (sub ? 44 : 31) + (dy || 0);
    var ly = base;
    var bend = py + off * 17;
    var s = '<path class="anno-line" d="M' + px.toFixed(1) + ' ' + py.toFixed(1) +
      ' L' + px.toFixed(1) + ' ' + bend.toFixed(1) +
      '" stroke="' + color + '" opacity=".7"/>' +
      '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="3.4" fill="' + color + '" stroke="var(--surface)" stroke-width="1.4"/>';
    var tx = px, anchor = 'middle';
    if (tx < 56) { tx = 56; anchor = 'start'; }
    if (tx > W - 62) { tx = W - 62; anchor = 'end'; }
    s += t(tx, ly, label, color, anchor, 10.8, 700);
    if (sub) s += t(tx, ly + 11.5, sub, color, anchor, 9.4, 500);
    return s;
  }

  /* 双向箭头（波浪腿） */
  function legArrow(i1, p1, i2, p2, color, label, labelSide) {
    var x1 = X(i1), y1 = Y(p1), x2 = X(i2), y2 = Y(p2);
    var out = '<line class="anno-line" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
      '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + color +
      '" stroke-width="2" opacity=".9"/>';
    [[x1, y1, x2, y2], [x2, y2, x1, y1]].forEach(function (a) {
      var ang = Math.atan2(a[3] - a[1], a[2] - a[0]);
      var L = 7;
      out += '<path d="M' + (a[0] + Math.cos(ang) * L).toFixed(1) + ' ' + (a[1] + Math.sin(ang) * L).toFixed(1) +
        ' L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) +
        ' L' + (a[0] + Math.cos(ang + 2.4) * L).toFixed(1) + ' ' + (a[1] + Math.sin(ang + 2.4) * L).toFixed(1) +
        '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>';
    });
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    out += t(mx, my + (labelSide === 'below' ? 15 : -7), label, color, 'middle', 11, 720);
    return out;
  }

  /* ======================================================================
     五、各图层渲染
     ====================================================================== */

  function drawLevels() {
    var c = LAYERS[0].color;
    var s = '';
    s += hline(KEY.resistance, 18, KEY.barLPS, c, '上沿 98.50', '6 4', 0);
    s += hline(KEY.mid, 20, KEY.barLPS, c, '中点 95.00', '2 4', 0);
    s += hline(KEY.support, 16, 46, c, '下沿 91.50', '6 4', 0);
    return s;
  }

  function drawPA() {
    var c = LAYERS[1].color;
    var s = '';
    s += zone(20, 55, KEY.resistance, KEY.support, c, 0.07, '5 4');
    s += t(X(37), Y(KEY.resistance) - 9, '交易区间 Trading Range', c, 'middle', 11, 700);
    s += legArrow(54, 96.5, 55, 103.8, c, '区间突破 + 跟随', 'above');
    s += pin(KEY.barLPS, KEY.lpsLow, c, '突破回踩 · 二次进场', 'down', '信号棒 + 缩量', 52);
    s += hline(KEY.mmTarget, 55, KEY.barEnd, c, '测量移动 105.50', '4 4', 0);
    s += '<path class="anno-line" d="M' + X(55) + ' ' + Y(KEY.resistance).toFixed(1) +
      ' L' + X(55) + ' ' + Y(KEY.mmTarget).toFixed(1) + '" stroke="' + c +
      '" stroke-dasharray="3 3" opacity=".8"/>';
    s += t(X(55) - 5, (Y(KEY.resistance) + Y(KEY.mmTarget)) / 2, '= 区间高度 7.0', c, 'end', 9.6, 600);
    return s;
  }

  function drawWyckoff() {
    var c = LAYERS[2].color;
    var s = '';
    s += pin(KEY.barSC, KEY.support, c, 'SC 抛售高潮', 'down', '天量 + 长下影', 0);
    s += pin(KEY.barAR, KEY.resistance, c, 'AR 自动反弹', 'up', null, 0);
    s += pin(KEY.barST, 93.20, c, 'ST 二次测试', 'down', '缩量', 0);
    s += pin(KEY.barSpring, KEY.springLow, c, 'Spring 弹簧', 'down', '跌破支撑后迅速收回', -20);
    s += pin(KEY.barSOS, KEY.sosHigh, c, 'SOS 强势信号', 'up', '放量突破区间上沿', 0);
    s += pin(KEY.barLPS, KEY.lpsLow, c, 'LPS 最后支撑点', 'down', '缩量回踩', 0);
    /* 阶段分隔 */
    var marks = [[2, 19, 'Phase A 止跌'], [19, 42, 'Phase B 建仓'], [42, 46, 'C'], [46, 58, 'Phase D 走强'], [58, 84, 'Phase E 趋势']];
    marks.forEach(function (m) {
      var x1 = X(m[0] - 0.5), x2 = X(m[1] + 0.5);
      s += '<line x1="' + x2.toFixed(1) + '" y1="' + (PAD.t + 4) + '" x2="' + x2.toFixed(1) +
        '" y2="' + (volBottom) + '" stroke="' + c + '" stroke-width="1" stroke-dasharray="4 4" opacity=".38"/>';
      s += t((x1 + x2) / 2, PAD.t + 12, m[2], c, 'middle', 10, 700);
    });
    return s;
  }

  function drawICT() {
    var c = LAYERS[3].color;
    var s = '';
    s += zone(20, KEY.barLPS, KEY.mid, PMIN + 3.6, c, 0.07);
    s += hline(KEY.support, 16, 45, c, 'SSL 流动性', '5 3', 14);
    s += hline(KEY.resistance, 19, 57, c, 'BSL 流动性', '5 3', -13);
    s += zone(41, 44, 92.90, 91.00, c, 0.20, '4 3');
    s += t(X(43), Y(91.00) + 13, 'OB', c, 'middle', 10, 700);
    s += zone(47, 52, 96.60, 95.00, c, 0.18, '4 3');
    s += t(X(49.5), Y(96.60) - 5, 'FVG', c, 'middle', 10, 700);
    s += zone(56, 64, KEY.oteHigh, KEY.oteLow, c, 0.22, '4 3');
    s += t(X(65), Y((KEY.oteHigh + KEY.oteLow) / 2) + 3, 'OTE 62–79%', c, 'start', 10, 700);
    s += pin(KEY.barSpring, KEY.springLow, c, 'SSL 被扫荡', 'down', '猎杀止损', 4);
    s += pin(KEY.barSOS, KEY.sosHigh, c, 'BOS 结构突破', 'up', null, -26);
    s += pin(KEY.barLPS, KEY.lpsLow, c, '回踩 OB / FVG', 'down', '折价区内', 26);
    s += t(X(24), Y(KEY.mid) + 14, '折价区 · 买入区', c, 'start', 9.8, 650);
    return s;
  }

  function drawSMC() {
    var c = LAYERS[4].color;
    var s = '';
    s += zone(20, KEY.barLPS, KEY.mid, PMIN + 3.6, c, 0.07);
    s += hline(KEY.support, 16, 45, c, 'EQL 等低点', '2 4', 28);
    s += zone(41, 44, 92.90, 91.00, c, 0.18, '4 3');
    s += t(X(41) - 15, Y(90.30) + 13, 'Order Block', c, 'middle', 10, 700);
    s += zone(47, 52, 96.60, 95.00, c, 0.16, '4 3');
    s += t(X(52), Y(95.00) + 13, 'FVG / 失衡', c, 'middle', 10, 700);
    s += pin(KEY.barSpring, KEY.springLow, c, '流动性抓取', 'down', null, 28);
    s += pin(47, 94.80, c, 'CHoCH 性质转变', 'down', null, 0);
    s += pin(KEY.barSOS, KEY.sosHigh, c, 'BOS 结构突破', 'up', null, -52);
    s += pin(KEY.barLPS, KEY.lpsLow, c, '折价区回踩', 'down', null, 52);
    s += t(X(9), Y(95.4), '本图层与 ICT 高度重合', c, 'middle', 9.8, 650);
    return s;
  }

  function drawElliott() {
    var c = LAYERS[5].color;
    var s = '';
    s += legArrow(KEY.barSpring, KEY.springLow, KEY.barSOS, KEY.sosHigh, c, '①', 'above');
    s += legArrow(KEY.barSOS, KEY.sosHigh, KEY.barLPS, KEY.lpsLow, c, '②', 'below');
    s += legArrow(KEY.barLPS, KEY.lpsLow, KEY.barEnd, 120.2, c, '③', 'above');
    s += '<circle cx="' + X(KEY.barSOS).toFixed(1) + '" cy="' + Y(KEY.sosHigh).toFixed(1) +
      '" r="4" fill="none" stroke="' + c + '" stroke-width="1.8"/>';
    s += '<circle cx="' + X(KEY.barLPS).toFixed(1) + '" cy="' + Y(KEY.lpsLow).toFixed(1) +
      '" r="4" fill="none" stroke="' + c + '" stroke-width="1.8"/>';
    s += t(X(KEY.barEnd) - 6, Y(120.2) - 12, '③ 1.618 扩展 ≈ 115.9', c, 'end', 10, 700);
    s += t(X(KEY.barLPS) + 4, Y(KEY.lpsLow) + 20, '② 回撤 73%（落在 OTE 区内）', c, 'start', 9.6, 600);
    s += t(X(12), Y(97), '前段下跌 = 更大级别的调整浪 C', c, 'middle', 9.8, 650);
    return s;
  }

  var DRAWERS = {
    levels: drawLevels, pa: drawPA, wyckoff: drawWyckoff,
    ict: drawICT, smc: drawSMC, elliott: drawElliott
  };

  /* ======================================================================
     六、基础网格 + K 线 + 成交量
     ====================================================================== */

  function drawGrid() {
    var s = '';
    var stepP = 5;
    for (var p = Math.ceil(PMIN / stepP) * stepP; p <= PMAX; p += stepP) {
      var y = Y(p);
      s += '<line class="grid-line" x1="' + PAD.l + '" y1="' + y.toFixed(1) +
        '" x2="' + (W - PAD.r) + '" y2="' + y.toFixed(1) + '"/>';
      s += '<text class="axis-text" x="' + (PAD.l - 8) + '" y="' + (y + 3.5).toFixed(1) +
        '" text-anchor="end">' + p.toFixed(0) + '</text>';
    }
    [0, 10, 20, 30, 40, 50, 60, 70, 84].forEach(function (i) {
      s += '<text class="axis-text" x="' + X(i).toFixed(1) + '" y="' + (volBottom + 20) +
        '" text-anchor="middle">' + i + '</text>';
    });
    s += '<text class="axis-text" x="' + (W - PAD.r) + '" y="' + (volBottom + 20) +
      '" text-anchor="end" opacity=".7">K 线序号</text>';
    s += '<text class="axis-text" x="' + (PAD.l - 8) + '" y="' + (PAD.t - 8) +
      '" text-anchor="end">价格</text>';
    s += '<text class="axis-text" x="' + (PAD.l - 8) + '" y="' + (volTop - 6) +
      '" text-anchor="end">量</text>';
    return s;
  }

  function drawCandles() {
    var s = '';
    SERIES.forEach(function (b, i) {
      var up = b.c >= b.o;
      var x = X(i);
      var yO = Y(b.o), yC = Y(b.c);
      var top = Math.min(yO, yC), hgt = Math.max(Math.abs(yC - yO), 1.1);
      s += '<line class="' + (up ? 'wick-up' : 'wick-down') + '" x1="' + x.toFixed(1) +
        '" y1="' + Y(b.h).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + Y(b.l).toFixed(1) +
        '" stroke-width="1.1"/>';
      s += '<rect class="' + (up ? 'candle-up' : 'candle-down') + '" x="' + (x - barW * 0.32).toFixed(1) +
        '" y="' + top.toFixed(1) + '" width="' + (barW * 0.64).toFixed(1) +
        '" height="' + hgt.toFixed(1) + '" rx="0.6"/>';
    });
    return s;
  }

  function drawVolume() {
    var s = '';
    s += '<line x1="' + PAD.l + '" y1="' + volBottom + '" x2="' + (W - PAD.r) +
      '" y2="' + volBottom + '" stroke="var(--border)" stroke-width="1"/>';
    SERIES.forEach(function (b, i) {
      var up = b.c >= b.o;
      var x = X(i);
      var y = VY(b.v);
      s += '<rect class="' + (up ? 'candle-up' : 'candle-down') + '" x="' + (x - barW * 0.30).toFixed(1) +
        '" y="' + y.toFixed(1) + '" width="' + (barW * 0.60).toFixed(1) +
        '" height="' + (volBottom - y).toFixed(1) + '" opacity=".62" rx="0.6"/>';
    });
    /* 量价标注 */
    var marks = [
      [20, 'SC 天量'], [31, 'ST 缩量'], [44, '回归缩量'], [55, 'SOS 放量']
    ];
    marks.forEach(function (m) {
      s += '<text class="axis-text" x="' + X(m[0]).toFixed(1) + '" y="' + (volTop - 6) +
        '" text-anchor="middle" font-weight="600">' + m[1] + '</text>';
    });
    return s;
  }

  /* 多图层同时打开时，显示收敛区 */
  function drawConvergence(activeCount) {
    if (activeCount < 3) return '';
    var s = zone(40, 64, 96.6, 93.2, 'var(--text)', 0.06, '6 4');
    s += '<rect x="' + X(39.5).toFixed(1) + '" y="' + Y(96.6).toFixed(1) +
      '" width="' + (X(64.5) - X(39.5)).toFixed(1) + '" height="' + (Y(93.2) - Y(96.6)).toFixed(1) +
      '" fill="none" stroke="var(--text)" stroke-width="1.6" stroke-dasharray="7 4" rx="3" opacity=".5"/>';
    s += t(X(52), Y(96.6) - 9, '五个体系共同指向的区域', 'var(--text)', 'middle', 11.5, 750);
    return s;
  }

  /* ======================================================================
     七、组装组件
     ====================================================================== */

  function buildSVG(active) {
    SUB_ON = active.length <= 2;
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      '同一段行情的五体系标注对照图：先下跌形成抛售高潮，随后长时间横盘吸筹，' +
      '再向下假突破扫掉止损，最后向上突破区间并回踩确认">';
    out += '<rect class="chart-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    out += '<g>' + drawGrid() + '</g>';
    out += '<g>' + drawConvergence(active.length) + '</g>';
    out += '<g>' + drawCandles() + '</g>';
    out += '<g>' + drawVolume() + '</g>';
    LAYERS.forEach(function (L) {
      if (active.indexOf(L.id) === -1) return;
      out += '<g data-layer="' + L.id + '">' + DRAWERS[L.id]() + '</g>';
    });
    out += '</svg>';
    return out;
  }

  function buildLegend(active) {
    if (!active.length) {
      return '<p style="color:var(--text-3);margin:0">所有图层已关闭。点上面的按钮打开任意一个体系开始对照。</p>';
    }
    return active.map(function (id) {
      var L = LAYERS.filter(function (x) { return x.id === id; })[0];
      return '<div class="lg-row"><span class="lg-swatch" style="background:' + L.color + '"></span>' +
        '<span><b style="color:var(--text)">' + L.name + '</b> — ' + LAYER_NOTES[id] + '</span></div>';
    }).join('');
  }

  function mountInteractive(root) {
    var mount = root.querySelector('#chartMount');
    if (!mount) return;

    var active = ['levels', 'wyckoff'];

    mount.innerHTML =
      '<div class="chart-widget">' +
        '<div class="cw-head">' +
          '<h3>同一段行情 · 五个体系的标注</h3>' +
          '<p>合成数据，仅用于展示各体系的术语如何映射到同一段价格结构。涨为红、跌为绿。</p>' +
        '</div>' +
        '<div class="cw-layers" role="group" aria-label="图层开关"></div>' +
        '<div class="cw-canvas"></div>' +
        '<div class="cw-legend"></div>' +
      '</div>';

    var layerBar = mount.querySelector('.cw-layers');
    var canvas = mount.querySelector('.cw-canvas');
    var legend = mount.querySelector('.cw-legend');

    LAYERS.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'layer-btn';
      b.style.setProperty('--lc', L.color);
      b.setAttribute('aria-pressed', active.indexOf(L.id) !== -1 ? 'true' : 'false');
      b.innerHTML = '<span class="swatch"></span>' + esc(L.name);
      b.addEventListener('click', function () {
        var idx = active.indexOf(L.id);
        if (idx === -1) { active.push(L.id); } else { active.splice(idx, 1); }
        render();
      });
      b.setAttribute('data-l', L.id);
      layerBar.appendChild(b);
    });

    /* 全部开关 */
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'layer-btn layer-all';
    allBtn.setAttribute('data-all', '1');
    layerBar.appendChild(allBtn);
    allBtn.addEventListener('click', function () {
      active = (active.length === LAYERS.length) ? [] : LAYERS.map(function (x) { return x.id; });
      render();
    });

    function render() {
      canvas.innerHTML = buildSVG(active);
      legend.innerHTML = buildLegend(active);
      Array.prototype.forEach.call(layerBar.querySelectorAll('.layer-btn[data-l]'), function (btn) {
        btn.setAttribute('aria-pressed', active.indexOf(btn.getAttribute('data-l')) !== -1 ? 'true' : 'false');
      });
      allBtn.textContent = (active.length === LAYERS.length) ? '全部关闭' : '全部打开';
    }

    render();
  }

  /* ======================================================================
     八、静态示意图
     ====================================================================== */

  /* 8.1 威科夫吸筹结构示意图 */
  function wyckoffSchematic() {
    var w = 900, h = 400;
    var x0 = 40, x1 = 862;
    var pTop = 42, pBot = 236;
    var vTop = 268, vBot = 348;

    var path = [
      [40, 62], [92, 96], [126, 140], [150, 186], [156, 212],
      [196, 150], [232, 176], [268, 148], [300, 174], [332, 146], [362, 172],
      [392, 156], [410, 178], [428, 214], [444, 226],
      [470, 176], [500, 162], [546, 104], [576, 92],
      [606, 124], [640, 116], [700, 78], [780, 50], [862, 34]
    ];

    function pline() {
      return path.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    }

    var supportY = 196;   /* SC / ST 低点连线 */
    var resistY = 148;    /* AR 高点 */

    var s = '';
    s += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 阶段带 */
    var phases = [
      [40, 232, 'Phase A', '止跌'],
      [232, 410, 'Phase B', '建仓'],
      [410, 452, 'Phase C', '震仓'],
      [452, 600, 'Phase D', '走强'],
      [600, 862, 'Phase E', '趋势']
    ];
    phases.forEach(function (p, i) {
      var xa = p[0], xb = p[1];
      s += '<rect x="' + xa + '" y="' + (pTop - 26) + '" width="' + (xb - xa) + '" height="18" rx="4" ' +
        'fill="var(--d-amber)" fill-opacity="' + (0.07 + (i % 2) * 0.06) + '"/>';
      s += '<text x="' + ((xa + xb) / 2) + '" y="' + (pTop - 13) + '" text-anchor="middle" ' +
        'font-size="11" font-weight="700" fill="var(--d-amber-strong)">' + p[2] + '</text>';
      s += '<text x="' + ((xa + xb) / 2) + '" y="' + (pTop - 1) + '" text-anchor="middle" ' +
        'font-size="9.5" fill="var(--d-amber-strong)" opacity=".85">' + p[3] + '</text>';
      if (i > 0) {
        s += '<line x1="' + xa + '" y1="' + pTop + '" x2="' + xa + '" y2="' + vBot + '" ' +
          'stroke="var(--d-amber)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>';
      }
    });

    /* 支撑 / 阻力 */
    s += '<line x1="126" y1="' + supportY + '" x2="470" y2="' + supportY + '" stroke="var(--d-neutral)" ' +
      'stroke-width="1.3" stroke-dasharray="6 4" opacity=".8"/>';
    s += '<text x="126" y="' + (supportY - 6) + '" font-size="10" fill="var(--d-neutral)" font-weight="600">支撑（SC / ST 低点）</text>';
    s += '<line x1="196" y1="' + resistY + '" x2="600" y2="' + resistY + '" stroke="var(--d-neutral)" ' +
      'stroke-width="1.3" stroke-dasharray="6 4" opacity=".8"/>';
    s += '<text x="600" y="' + (resistY - 6) + '" font-size="10" fill="var(--d-neutral)" text-anchor="end" font-weight="600">阻力（AR 高点）</text>';

    /* 价格路径 */
    s += '<polyline points="' + pline() + '" fill="none" stroke="var(--d-amber)" stroke-width="2.4" ' +
      'stroke-linejoin="round" stroke-linecap="round"/>';

    /* 弹簧低点强调 */
    s += '<circle cx="444" cy="226" r="5" fill="none" stroke="var(--d-amber)" stroke-width="2"/>';
    s += '<text x="444" y="248" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--d-amber-strong)">Spring</text>';

    /* 事件标注 */
    var evts = [
      [156, 212, 'SC', '抛售高潮', 'down'],
      [196, 150, 'AR', '自动反弹', 'up'],
      [232, 176, 'ST', '二次测试', 'down'],
      [546, 104, 'SOS', '强势信号', 'up'],
      [606, 124, 'LPS', '最后支撑点', 'down']
    ];
    evts.forEach(function (e) {
      var ex = e[0], ey = e[1], up = e[4] === 'up';
      var ly = up ? ey - 26 : ey + 30;
      var ty = up ? ey - 34 : ey + 40;
      s += '<line x1="' + ex + '" y1="' + ey + '" x2="' + ex + '" y2="' + (up ? ey - 20 : ey + 22) +
        '" stroke="var(--d-amber)" stroke-width="1.2" opacity=".7"/>';
      s += '<circle cx="' + ex + '" cy="' + ey + '" r="3.6" fill="var(--d-amber)" stroke="var(--surface)" stroke-width="1.4"/>';
      s += '<text x="' + ex + '" y="' + ly + '" text-anchor="middle" font-size="11.5" ' +
        'font-weight="750" fill="var(--d-amber-strong)">' + e[2] + '</text>';
      s += '<text x="' + ex + '" y="' + ty + '" text-anchor="middle" font-size="9.5" ' +
        'fill="var(--d-amber-strong)" opacity=".9">' + e[3] + '</text>';
    });

    /* 成交量 */
    s += '<line x1="' + x0 + '" y1="' + vBot + '" x2="' + x1 + '" y2="' + vBot + '" stroke="var(--border)" stroke-width="1"/>';
    s += '<text x="' + (x0 - 8) + '" y="' + (vTop + 4) + '" text-anchor="end" font-size="10" fill="var(--text-3)">成交量</text>';
    var volBars = [
      [40, .30], [70, .36], [100, .48], [126, .58], [150, .74], [156, 1.00], [180, .80], [196, .62],
      [232, .34], [268, .34], [300, .32], [332, .30], [362, .32], [392, .30], [410, .34],
      [428, .52], [444, .66], [470, .40], [500, .46], [546, .82], [576, .88],
      [606, .40], [640, .52], [700, .62], [780, .72], [862, .80]
    ];
    volBars.forEach(function (v) {
      var vh = v[1] * (vBot - vTop - 8);
      var yy = vBot - vh;
      var w = 13;
      s += '<rect x="' + (v[0] - w / 2) + '" y="' + yy.toFixed(1) + '" width="' + w + '" height="' + vh.toFixed(1) +
        '" rx="1.5" fill="var(--d-amber)" opacity=".55"/>';
    });
    /* 量价标注放在成交量柱下方，避免与价格事件标注打架 */
    var volNotes = [[156, 364, 'SC 天量'], [444, 364, '假破不必放量'], [546, 364, 'SOS 放量']];
    volNotes.forEach(function (n) {
      s += '<line x1="' + n[0] + '" y1="' + (vBot + 4) + '" x2="' + n[0] + '" y2="' + (n[1] - 10) +
        '" stroke="var(--d-amber)" stroke-width="1" opacity=".5"/>';
      s += '<text class="anno-text" x="' + n[0] + '" y="' + n[1] + '" text-anchor="middle" ' +
        'font-size="10" font-weight="700" fill="var(--d-amber-strong)">' + n[2] + '</text>';
    });

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="威科夫吸筹结构示意图">' + s + '</svg>';
  }

  /* 8.2 艾略特 5-3 结构示意图 */
  function elliott53() {
    var w = 900, h = 360;
    var pts = {
      start: [64, 288],
      w1: [152, 202],
      w2: [220, 248],
      w3: [398, 103],
      w4: [492, 138],
      w5: [592, 74],
      A: [688, 176],
      B: [762, 122],
      C: [858, 244]
    };

    var line = 'M' + pts.start[0] + ' ' + pts.start[1] +
      ' L' + pts.w1[0] + ' ' + pts.w1[1] +
      ' L' + pts.w2[0] + ' ' + pts.w2[1] +
      ' L' + pts.w3[0] + ' ' + pts.w3[1] +
      ' L' + pts.w4[0] + ' ' + pts.w4[1] +
      ' L' + pts.w5[0] + ' ' + pts.w5[1] +
      ' L' + pts.A[0] + ' ' + pts.A[1] +
      ' L' + pts.B[0] + ' ' + pts.B[1] +
      ' L' + pts.C[0] + ' ' + pts.C[1];

    /* 通道：过浪 2 与浪 4 连下轨（浪 4 必须落在轨上），过浪 1 作平行上轨 */
    var slope = (pts.w4[1] - pts.w2[1]) / (pts.w4[0] - pts.w2[0]);
    var CH_END = 545;
    function chLine(x0, y0) {
      return 'M' + x0 + ' ' + y0 + ' L' + CH_END + ' ' + (y0 + slope * (CH_END - x0)).toFixed(1);
    }
    var lower = chLine(pts.w2[0], pts.w2[1]);
    var upper = chLine(pts.w1[0], pts.w1[1]);

    function lbl(p, dx, dy, text, color, size, weight) {
      return '<text x="' + (p[0] + dx) + '" y="' + (p[1] + dy) + '" text-anchor="middle" ' +
        'font-size="' + (size || 13) + '" font-weight="' + (weight || 750) + '" fill="' + color + '">' + text + '</text>';
    }
    function dot(p, color) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' + color + '" stroke="var(--surface)" stroke-width="1.5"/>';
    }
    function fib(x, y, text) {
      return '<text class="anno-text" x="' + x + '" y="' + y + '" text-anchor="middle" ' +
        'font-size="9.8" fill="var(--d-pink)" opacity=".95">' + text + '</text>';
    }

    var P = 'var(--d-pink)', C = 'var(--d-cyan)', M = 'var(--text-3)';

    var s = '';
    s += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 区域底纹 */
    s += '<rect x="' + pts.start[0] + '" y="40" width="' + (pts.w5[0] - pts.start[0]) + '" height="' + (h - 74) +
      '" fill="var(--d-pink)" fill-opacity=".055" rx="6"/>';
    s += '<rect x="' + pts.w5[0] + '" y="40" width="' + (pts.C[0] - pts.w5[0] + 6) + '" height="' + (h - 74) +
      '" fill="var(--d-cyan)" fill-opacity=".065" rx="6"/>';
    s += '<text x="' + ((pts.start[0] + pts.w5[0]) / 2) + '" y="27" text-anchor="middle" font-size="12" ' +
      'font-weight="750" fill="var(--d-pink)">推动浪 Impulse（5 浪）· 与主趋势同向</text>';
    s += '<text x="' + ((pts.w5[0] + pts.C[0]) / 2) + '" y="27" text-anchor="middle" font-size="12" ' +
      'font-weight="750" fill="var(--d-cyan)">调整浪 Corrective（3 浪）</text>';

    /* 通道 */
    s += '<path d="' + upper + '" fill="none" stroke="' + M + '" stroke-width="1.1" stroke-dasharray="5 5" opacity=".6"/>';
    s += '<path d="' + lower + '" fill="none" stroke="' + M + '" stroke-width="1.1" stroke-dasharray="5 5" opacity=".6"/>';
    s += '<text class="anno-text" x="' + (CH_END + 4) + '" y="' + (pts.w1[1] + slope * (CH_END - pts.w1[0]) + 3).toFixed(1) +
      '" font-size="9.5" fill="var(--text-3)">上轨（1-3 连线）</text>';
    s += '<text class="anno-text" x="' + (CH_END + 4) + '" y="' + (pts.w2[1] + slope * (CH_END - pts.w2[0]) + 3).toFixed(1) +
      '" font-size="9.5" fill="var(--text-3)">下轨（过浪 2）</text>';

    /* 主折线 */
    s += '<path d="' + line + '" fill="none" stroke="' + P + '" stroke-width="2.6" ' +
      'stroke-linejoin="round" stroke-linecap="round"/>';

    /* 顶点圆点 */
    [pts.w1, pts.w2, pts.w3, pts.w4, pts.w5].forEach(function (p) { s += dot(p, P); });
    [pts.A, pts.B, pts.C].forEach(function (p) { s += dot(p, C); });

    /* 浪标 */
    s += lbl(pts.start, -6, -14, '起点', M, 10.5, 600);
    s += lbl(pts.w1, -17, -4, '1', P);
    s += lbl(pts.w2, -6, 22, '2', P);
    s += lbl(pts.w3, 0, -15, '3', P);
    s += lbl(pts.w4, 0, 23, '4', P);
    s += lbl(pts.w5, 8, -13, '5', P);
    s += lbl(pts.A, 4, 23, 'A', C);
    s += lbl(pts.B, 0, -13, 'B', C);
    s += lbl(pts.C, 17, 5, 'C', C);

    /* 比例注释 */
    s += fib(186, 270, '浪 2 回撤 50–61.8%');
    s += fib(300, 208, '浪 3 ≈ 浪 1 × 1.618');
    s += fib(452, 156, '浪 4 回撤 23.6–38.2%');
    s += fib(528, 56, '浪 5 常等于浪 1');
    s += '<text class="anno-text" x="' + (pts.C[0] - 4) + '" y="' + (pts.C[1] + 26) + '" text-anchor="end" ' +
      'font-size="9.8" fill="var(--d-cyan)">浪 C 常等于浪 A</text>';

    /* 铁律提示 */
    s += '<text class="anno-text" x="' + pts.w2[0] + '" y="' + (pts.w2[1] + 40) + '" text-anchor="middle" ' +
      'font-size="9.5" font-weight="650" fill="var(--text-3)">浪 2 不能破浪 1 起点</text>';

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="艾略特波浪 5-3 基本结构示意图">' + s + '</svg>';
  }

  var DIAGRAMS = {
    'wyckoff-schematic': wyckoffSchematic,
    'elliott-53': elliott53
  };

  function mountDiagrams(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.diagram[data-diagram]'), function (el) {
      var fn = DIAGRAMS[el.getAttribute('data-diagram')];
      if (fn) el.innerHTML = '<div class="chart-widget" style="margin:0"><div class="cw-canvas">' + fn() + '</div></div>';
    });
  }

  return {
    mountInteractive: mountInteractive,
    mountDiagrams: mountDiagrams
  };
})();
