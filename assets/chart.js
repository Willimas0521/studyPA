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

  /* 威科夫扩展示意图：Spring / SOS+LPS / UTAD / VSA 单根量价 / 因果测量移动 */

  /* Spring（弹簧效应）：跌破支撑扫止损后立刻回补 —— 威科夫最重要的买点 */
  function wyckoffSpringDiagram() {
    var w = 900, h = 372;
    var x0 = 64, barW = 40, bw = 18, N = 18;
    var t = 72, b = 250, pMin = 96, pMax = 156;
    var vTop = 280, vBot = 348;
    var SUPPORT = 112;
    var closes = [150, 143, 137, 131, 125, 119, 113, 122, 131, 127, 121, 117, 115, 109, 107, 114, 123, 133];
    var vol = [.30, .34, .38, .42, .50, .62, .95, .55, .50, .45, .50, .40, .36, .30, .52, .70, .85, .92];
    var bars = synthBars(closes, 2.0);
    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += note(w / 2, 42, 'Spring（弹簧效应）：跌破支撑扫止损后立刻回补 —— 威科夫最重要的买点', 'var(--d-amber-strong)', 'middle', 12);
    s += dashLine(X(0) - 18, Y(SUPPORT), X(N - 1) + 18, Y(SUPPORT), 'var(--d-neutral)');
    s += note(X(N - 1) + 22, Y(SUPPORT) - 6, '支撑（SC 低点）', 'var(--d-neutral)', 'start', 10.5);
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(vBot) + '" x2="' + r1(X(N - 1) + 18) + '" y2="' + r1(vBot) + '" stroke="var(--border)" stroke-width="1"/>';
    s += note(x0 - 34, vTop + 4, '成交量', 'var(--text-3)', 'end', 10);
    vol.forEach(function (vv, i) {
      var vh = vv * (vBot - vTop - 8);
      s += '<rect x="' + r1(X(i) - bw / 2) + '" y="' + r1(vBot - vh) + '" width="' + bw + '" height="' + r1(vh) + '" rx="1.5" fill="var(--d-amber)" opacity=".5"/>';
    });
    s += barsSVG(bars, X, bw, Y);
    s += ringDot(X(6), Y(113), 'var(--d-amber)', 'SC', Y(113) + 24);
    s += ringDot(X(9), Y(131), 'var(--d-amber)', 'AR', Y(131) - 14);
    s += ringDot(X(12), Y(115), 'var(--d-amber)', 'ST', Y(115) + 24);
    s += ringDot(X(13), Y(107), 'var(--d-amber)', 'Spring', Y(107) + 24);
    s += ringDot(X(15), Y(123), 'var(--up)', 'Test', Y(123) + 24);
    s += note(w / 2, 366, '理想形态：Spring 跌破时不必放量，回归时迅速有力，随后的缩量回踩（Test）确认卖压枯竭', 'var(--text-3)', 'middle', 10.5);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="威科夫弹簧效应示意图：跌破支撑后迅速收回">' + s + '</svg>';
  }

  /* SOS（强势信号）与 LPS（最后支撑点）：突破放量，回踩缩量守住 */
  function wyckoffSosLpsDiagram() {
    var w = 900, h = 372;
    var x0 = 64, barW = 36, bw = 18, N = 20;
    var t = 72, b = 250, pMin = 120, pMax = 200;
    var vTop = 280, vBot = 348;
    var RESIST = 156;
    var closes = [128, 134, 142, 150, 144, 136, 140, 148, 152, 154, 162, 172, 182, 178, 170, 164, 162, 168, 176, 184];
    var vol = [.32, .36, .40, .46, .40, .34, .38, .44, .48, .50, .90, .95, .92, .60, .40, .35, .38, .55, .70, .85];
    var bars = synthBars(closes, 2.2);
    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += note(w / 2, 42, 'SOS（强势信号）与 LPS（最后支撑点）：突破放量，回踩缩量守住', 'var(--d-amber-strong)', 'middle', 12);
    s += dashLine(X(0) - 18, Y(RESIST), X(N - 1) + 18, Y(RESIST), 'var(--d-blue)');
    s += note(X(N - 1) + 22, Y(RESIST) - 6, '阻力 → 突破后转为支撑', 'var(--d-blue)', 'start', 10.5);
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(vBot) + '" x2="' + r1(X(N - 1) + 18) + '" y2="' + r1(vBot) + '" stroke="var(--border)" stroke-width="1"/>';
    s += note(x0 - 34, vTop + 4, '成交量', 'var(--text-3)', 'end', 10);
    vol.forEach(function (vv, i) {
      var vh = vv * (vBot - vTop - 8);
      s += '<rect x="' + r1(X(i) - bw / 2) + '" y="' + r1(vBot - vh) + '" width="' + bw + '" height="' + r1(vh) + '" rx="1.5" fill="var(--d-amber)" opacity=".5"/>';
    });
    s += barsSVG(bars, X, bw, Y);
    s += ringDot(X(11), Y(172), 'var(--d-amber)', 'SOS', Y(172) - 14);
    s += ringDot(X(15), Y(164), 'var(--up)', 'LPS', Y(164) + 24);
    s += note(w / 2, 366, 'SOS 放量站上区间上沿是需求接管的标志；其后缩量回踩不破前高/支撑，即 LPS，是顺势最佳进场位', 'var(--text-3)', 'middle', 10.5);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="威科夫 SOS 与 LPS 示意图：突破放量回踩缩量">' + s + '</svg>';
  }

  /* UTAD（上冲回落）：创新高却收弱，是派发区的多头陷阱 */
  function wyckoffUtadDiagram() {
    var w = 900, h = 372;
    var x0 = 64, barW = 38, bw = 18, N = 18;
    var t = 72, b = 250, pMin = 110, pMax = 170;
    var vTop = 280, vBot = 348;
    var RESIST = 150;
    var closes = [128, 134, 140, 146, 150, 148, 144, 156, 144, 138, 158, 154, 146, 138, 128, 118, 112, 108];
    var vol = [.30, .34, .38, .44, .55, .46, .40, .95, .50, .44, .85, .55, .60, .70, .82, .88, .80, .72];
    var bars = synthBars(closes, 2.0);
    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += note(w / 2, 42, 'UTAD（上冲回落）：创新高却收弱，是派发区的多头陷阱', 'var(--d-amber-strong)', 'middle', 12);
    s += dashLine(X(0) - 18, Y(RESIST), X(N - 1) + 18, Y(RESIST), 'var(--d-blue)');
    s += note(X(N - 1) + 22, Y(RESIST) - 6, '阻力（AR 高点）', 'var(--d-blue)', 'start', 10.5);
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(vBot) + '" x2="' + r1(X(N - 1) + 18) + '" y2="' + r1(vBot) + '" stroke="var(--border)" stroke-width="1"/>';
    s += note(x0 - 34, vTop + 4, '成交量', 'var(--text-3)', 'end', 10);
    vol.forEach(function (vv, i) {
      var vh = vv * (vBot - vTop - 8);
      s += '<rect x="' + r1(X(i) - bw / 2) + '" y="' + r1(vBot - vh) + '" width="' + bw + '" height="' + r1(vh) + '" rx="1.5" fill="var(--d-amber)" opacity=".5"/>';
    });
    s += barsSVG(bars, X, bw, Y);
    s += ringDot(X(7), Y(156), 'var(--d-amber)', 'BC', Y(156) - 14);
    s += ringDot(X(10), Y(158), 'var(--d-amber)', 'UTAD', Y(158) + 24);
    s += ringDot(X(13), Y(138), 'var(--down)', 'SOW', Y(138) + 24);
    s += note(w / 2, 366, '判别关键在成交量：创新高时放量却收在低位、随后跌回区间，才是真 UTAD；放量站稳则是真突破', 'var(--text-3)', 'middle', 10.5);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="威科夫 UTAD 上冲回落示意图">' + s + '</svg>';
  }

  /* VSA：单根 K 线的「量 × 振幅」组合，比形态本身更能说明谁在主导 */
  function wyckoffVsaDiagram() {
    var w = 900, h = 408;
    var t = 70, b = 270, pMin = 90, pMax = 170;
    var vTop = 305, vBot = 362, volMaxH = vBot - vTop - 6;
    var bw = 46;
    var cx = [120, 320, 520, 720];
    var panes = [
      { title: 'No Demand 无需求', concl: '上涨却缩量 · 无买盘跟进', up: true, o: 128, c: 150, hi: 158, lo: 122, vol: .30 },
      { title: 'No Supply 无供给', concl: '下跌却缩量 · 抛压枯竭', up: false, o: 150, c: 128, hi: 158, lo: 120, vol: .32 },
      { title: 'Stopping 止跌量', concl: '放巨量长下影 · 下跌中止', up: false, o: 152, c: 140, hi: 154, lo: 100, vol: .94 },
      { title: 'Effort≠Result', concl: '巨量却不动 · 方向将变', up: true, o: 140, c: 144, hi: 150, lo: 132, vol: .95 }
    ];
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += note(w / 2, 30, 'VSA：单根 K 线的「量 × 振幅」组合，比形态本身更能说明谁在主导', 'var(--d-amber-strong)', 'middle', 12);
    s += '<line x1="' + r1(60) + '" y1="' + r1(vBot) + '" x2="' + r1(840) + '" y2="' + r1(vBot) + '" stroke="var(--border)" stroke-width="1"/>';
    s += note(56, vTop + 4, '成交量', 'var(--text-3)', 'end', 10);
    panes.forEach(function (p, i) {
      var x = cx[i], color = p.up ? 'var(--up)' : 'var(--down)';
      s += '<line x1="' + r1(x) + '" y1="' + r1(Y(p.hi)) + '" x2="' + r1(x) + '" y2="' + r1(Y(p.lo)) + '" stroke="' + color + '" stroke-width="2.6"/>';
      var yTop = Math.min(p.o, p.c), yBot = Math.max(p.o, p.c);
      s += '<rect x="' + r1(x - bw / 2) + '" y="' + r1(Y(yTop)) + '" width="' + bw + '" height="' + r1(Math.max(3, Y(yBot) - Y(yTop))) + '" rx="2" fill="' + color + '"/>';
      var vh = p.vol * volMaxH;
      s += '<rect x="' + r1(x - bw / 2) + '" y="' + r1(vBot - vh) + '" width="' + bw + '" height="' + r1(vh) + '" rx="1.5" fill="var(--d-amber)" opacity=".55"/>';
      s += note(x, 58, p.title, 'var(--d-amber-strong)', 'middle', 11.5);
      s += note(x, 286, p.concl, 'var(--text-2)', 'middle', 10.5);
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="VSA 单根 K 线量价组合示意图">' + s + '</svg>';
  }

  /* 因果定律：横盘越宽（因），后续测量移动越大（果） */
  function wyckoffCauseEffectDiagram() {
    var w = 900, h = 384;
    var x0 = 60, barW = 24, bw = 12, N = 17;
    var t = 76, b = 256, pMin = 100, pMax = 210;
    var vTop = 286, vBot = 354;
    var BASE_LO = 120, BASE_HI = 140, TARGET = 180;
    var closes = [124, 130, 136, 140, 134, 126, 122, 128, 134, 140, 146, 156, 168, 180, 186, 190, 196];
    var vol = [.30, .34, .40, .46, .42, .36, .32, .38, .44, .50, .70, .80, .88, .70, .62, .70, .85];
    var bars = synthBars(closes, 2.0);
    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += note(w / 2, 42, '因果定律：横盘越宽（因），后续测量移动越大（果）', 'var(--d-amber-strong)', 'middle', 12);
    s += '<rect x="' + r1(X(0) - 14) + '" y="' + r1(Y(BASE_HI)) + '" width="' + r1(X(9) - X(0) + 28) + '" height="' + r1(Y(BASE_LO) - Y(BASE_HI)) + '" rx="6" fill="var(--d-amber)" fill-opacity=".08" stroke="var(--d-amber)" stroke-width="1.2" stroke-dasharray="5 4"/>';
    s += note((X(0) + X(9)) / 2, Y(BASE_HI) - 10, '因：横盘蓄势', 'var(--d-amber-strong)', 'middle', 10.5);
    s += dashLine(X(0) - 14, Y(BASE_HI), X(N - 1) + 18, Y(BASE_HI), 'var(--d-neutral)');
    s += note(X(N - 1) + 22, Y(BASE_HI) - 6, '区间上沿', 'var(--d-neutral)', 'start', 10);
    s += dashLine(X(0) - 14, Y(BASE_LO), X(N - 1) + 18, Y(BASE_LO), 'var(--d-neutral)');
    s += note(X(N - 1) + 22, Y(BASE_LO) + 18, '区间下沿', 'var(--d-neutral)', 'start', 10);
    s += dashLine(X(11), Y(BASE_HI), X(11), Y(TARGET), 'var(--d-cyan)');
    s += note(X(11) + 8, (Y(BASE_HI) + Y(TARGET)) / 2, '测量移动 = 区间高度 → 目标 ' + TARGET, 'var(--d-cyan)', 'start', 10);
    s += dashLine(X(9), Y(TARGET), X(N - 1) + 18, Y(TARGET), 'var(--d-cyan)');
    s += note(X(9) - 6, Y(TARGET) - 8, '目标（果）', 'var(--d-cyan)', 'end', 10);
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(vBot) + '" x2="' + r1(X(N - 1) + 18) + '" y2="' + r1(vBot) + '" stroke="var(--border)" stroke-width="1"/>';
    s += note(x0 - 34, vTop + 4, '成交量', 'var(--text-3)', 'end', 10);
    vol.forEach(function (vv, i) {
      var vh = vv * (vBot - vTop - 8);
      s += '<rect x="' + r1(X(i) - bw / 2) + '" y="' + r1(vBot - vh) + '" width="' + bw + '" height="' + r1(vh) + '" rx="1.5" fill="var(--d-amber)" opacity=".5"/>';
    });
    s += barsSVG(bars, X, bw, Y);
    s += ringDot(X(10), Y(146), 'var(--d-amber)', 'SOS', Y(146) - 14);
    s += note(w / 2, 372, '传统上用点数图（P&F）横向数格估算目标；这里用「区间高度」作简化版测量移动，结果一致', 'var(--text-3)', 'middle', 10.5);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="威科夫因果定律测量移动示意图">' + s + '</svg>';
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

  /* ------------------------------------------------------------------
     趋势相关示意图
     同样是合成数据：影线走固定函数、不用随机数，每次渲染结果完全一致。
     蜡烛配色跟随站点约定（涨红、跌绿）。
     ------------------------------------------------------------------ */

  function r1(v) { return Math.round(v * 10) / 10; }

  /* 由收盘价序列推出 OHLC */
  function synthBars(closes, amp) {
    var out = [];
    for (var i = 0; i < closes.length; i++) {
      var c = closes[i];
      var o = i === 0 ? c : closes[i - 1];
      out.push({
        o: o,
        c: c,
        h: Math.max(o, c) + amp * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7))),
        l: Math.min(o, c) - amp * (0.45 + 0.55 * Math.abs(Math.cos(i * 1.3)))
      });
    }
    return out;
  }

  function barsSVG(bars, cx, bw, Y) {
    var s = '';
    bars.forEach(function (d, i) {
      var color = d.c >= d.o ? 'var(--up)' : 'var(--down)';
      var x = cx(i);
      var yO = Y(d.o), yC = Y(d.c);
      var top = Math.min(yO, yC);
      var hgt = Math.max(1.6, Math.abs(yC - yO));
      s += '<line x1="' + r1(x) + '" y1="' + r1(Y(d.h)) + '" x2="' + r1(x) + '" y2="' + r1(Y(d.l)) +
        '" stroke="' + color + '" stroke-width="1.3"/>';
      s += '<rect x="' + r1(x - bw / 2) + '" y="' + r1(top) + '" width="' + bw + '" height="' + r1(hgt) +
        '" fill="' + color + '" rx="1"/>';
    });
    return s;
  }

  function dashLine(x1, y1, x2, y2, color) {
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) +
      '" stroke="' + color + '" stroke-width="1.3" stroke-dasharray="6 5" opacity=".9"/>';
  }

  function ringDot(x, y, color, label, ly) {
    var s = '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="4" fill="var(--surface)" ' +
      'stroke="' + color + '" stroke-width="1.8"/>';
    if (label) {
      s += '<text x="' + r1(x) + '" y="' + r1(ly) + '" text-anchor="middle" font-size="10.5" ' +
        'font-weight="700" fill="' + color + '">' + label + '</text>';
    }
    return s;
  }

  function note(x, y, str, color, anchor, size) {
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (anchor || 'middle') +
      '" font-size="' + (size || 11) + '" font-weight="600" fill="' + color + '">' + str + '</text>';
  }

  /* 1. 上涨趋势：高点抬高 + 低点抬高 */
  function trendUpDiagram() {
    var w = 900, h = 320;
    var x0 = 54, barW = 23, bw = 12;
    var pTop = 64, pBot = 266, pMin = 94, pMax = 180;

    var bars = synthBars([
      100, 104, 108, 112, 116, 119, 122,
      118, 114, 111, 113,
      117, 122, 127, 132, 137,
      133, 129, 126, 128,
      133, 139, 145, 151, 156,
      152, 148, 145, 147,
      153, 160, 167, 174
    ], 2.4);

    function X(i) { return x0 + i * barW; }
    function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += barsSVG(bars, X, bw, Y);

    /* 高点与低点各自连成上升虚线 */
    s += dashLine(X(6), Y(122), X(24), Y(156), 'var(--d-blue)');
    s += dashLine(X(10), Y(111), X(27), Y(145), 'var(--d-cyan)');

    s += ringDot(X(6), Y(122), 'var(--d-blue)', 'HH', Y(122) - 13);
    s += ringDot(X(15), Y(137), 'var(--d-blue)', 'HH', Y(137) - 13);
    s += ringDot(X(10), Y(111), 'var(--d-cyan)', 'HL', Y(111) + 22);
    s += ringDot(X(19), Y(126), 'var(--d-cyan)', 'HL', Y(126) + 22);

    s += note(878, 40, '高点持续抬高 · 低点持续抬高', 'var(--d-neutral)', 'end', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="上涨趋势示意图：高点与低点同时抬高">' + s + '</svg>';
  }

  /* 2. 通道式趋势：价格沿两条平行线推进，回踩给出进场点 */
  function trendChannelDiagram() {
    var w = 900, h = 330;
    var x0 = 54, barW = 23, bw = 12;
    var pTop = 58, pBot = 276, pMin = 100, pMax = 192;

    var bars = synthBars([
      112, 118, 124, 130, 136, 141,
      133, 125, 118,
      123, 132, 141, 149, 155,
      147, 137, 129,
      135, 145, 155, 163, 169,
      161, 152, 145,
      152, 163, 172, 179
    ], 2.6);

    function X(i) { return x0 + i * barW; }
    function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 通道：下沿（趋势线）与平行的上沿 */
    s += '<line x1="' + r1(X(1)) + '" y1="' + r1(Y(114)) + '" x2="' + r1(X(28)) + '" y2="' + r1(Y(172)) +
      '" stroke="var(--d-violet)" stroke-width="1.6" opacity=".9"/>';
    s += '<line x1="' + r1(X(1)) + '" y1="' + r1(Y(140)) + '" x2="' + r1(X(28)) + '" y2="' + r1(Y(198)) +
      '" stroke="var(--d-violet)" stroke-width="1.6" stroke-dasharray="7 5" opacity=".7"/>';
    s += note(X(0) + 6, Y(140) - 8, '通道上沿', 'var(--d-violet)', 'start', 10.5);
    s += note(X(0) + 6, Y(114) + 16, '趋势线', 'var(--d-violet)', 'start', 10.5);

    s += barsSVG(bars, X, bw, Y);

    /* 三次回踩趋势线的位置 */
    [8, 16, 24].forEach(function (i) {
      s += ringDot(X(i), Y(bars[i].l), 'var(--d-amber)', '', 0);
      s += '<line x1="' + r1(X(i)) + '" y1="' + r1(Y(bars[i].l) + 8) + '" x2="' + r1(X(i)) +
        '" y2="' + r1(Y(bars[i].l) + 30) + '" stroke="var(--d-amber)" stroke-width="1.4" marker-end="url(#tArrow)"/>';
    });
    s += note(X(8), Y(bars[8].l) + 48, '回踩进场', 'var(--d-amber-strong)', 'middle', 10.5);

    s += note(878, 40, '回撤打到趋势线 → 给出进场点', 'var(--d-neutral)', 'end', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="通道式趋势示意图：价格沿平行通道推进，回踩趋势线给出进场点">' +
      '<defs><marker id="tArrow" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="5" markerHeight="5" ' +
      'orient="auto-start-reverse"><path d="M1 1L6 5L1 9" fill="none" stroke="var(--d-amber)" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>' + s + '</svg>';
  }

  /* 3. 反转需要跟进 K 线：上排是没有跟进的失败反转，下排是确认成立的切换 */
  function reversalDiagram() {
    var w = 900, h = 404;
    var x0 = 60, barW = 27, bw = 14;

    var up = synthBars([100, 106, 112, 118, 124, 130, 136, 127, 133, 140, 146, 152, 158, 164], 2.6);
    var down = synthBars([100, 106, 112, 118, 124, 130, 136, 127, 121, 114, 108, 103, 99, 95], 2.6);

    function X(i) { return x0 + i * barW; }
    function mkY(t, b, pMin, pMax) {
      return function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); };
    }
    var Y1 = mkY(102, 202, 94, 170);
    var Y2 = mkY(278, 378, 90, 170);

    function band(y0, y1) {
      return '<rect x="' + r1(X(0) - 36) + '" y="' + y0 + '" width="' + r1(X(13) - X(0) + 72) +
        '" height="' + (y1 - y0) + '" rx="10" fill="var(--surface-2)" opacity=".55"/>';
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += band(88, 214);
    s += band(264, 390);

    /* 上：只有一根反转 K 线，之后没有跟进 */
    s += barsSVG(up, X, bw, Y1);
    s += ringDot(X(7), Y1(127), 'var(--d-neutral)', '', 0);
    s += note(X(7), Y1(127) + 24, '单根反转', 'var(--d-neutral)', 'middle', 10.5);
    s += note(X(0) - 16, 78, '只有一根反转 K 线，之后没有跟进 → 旧趋势继续',
      'var(--d-neutral)', 'start', 11.5);

    /* 下：反转 K 线 + 跟进 K 线，把两根一起框住 */
    s += barsSVG(down, X, bw, Y2);
    var bTop = Y2(139), bBot = Y2(116);
    s += '<rect x="' + r1(X(7) - bw - 2) + '" y="' + r1(bTop) + '" width="' + r1(X(8) - X(7) + bw + 4) +
      '" height="' + r1(bBot - bTop) + '" rx="7" fill="none" stroke="var(--d-cyan)" ' +
      'stroke-width="1.4" stroke-dasharray="4 3"/>';
    s += note((X(7) + X(8)) / 2, bTop - 9, '反转 + 跟进', 'var(--d-cyan)', 'middle', 10.5);
    s += note(X(0) - 16, 254, '反转 K 线 + 跟进 K 线 → 方向切换成立',
      'var(--d-cyan)', 'start', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="反转示意图：上排为没有跟进 K 线的失败反转，下排为有跟进确认的成功切换">' + s + '</svg>';
  }

  /* 3. 单根 K 线解剖：四个价格、三样东西，以及三类 K 线的横向对照 */
  function candleAnatomyDiagram() {
    var w = 900, h = 386;
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 左右分栏 */
    s += '<line x1="392" y1="34" x2="392" y2="336" stroke="var(--border)" ' +
      'stroke-width="1" stroke-dasharray="5 5"/>';

    /* 同一根放大的阳线，用它的区间标出上三分之一与下三分之一 */
    var cx = 210, bw = 58;
    var hi = 54, lo = 300, yClose = 124, yOpen = 252;
    var rng = lo - hi;
    var t1 = hi + rng / 3, t2 = hi + rng * 2 / 3;

    s += dashLine(56, t1, 360, t1, 'var(--border-2)');
    s += dashLine(56, t2, 360, t2, 'var(--border-2)');
    s += note(56, t1 - 6, '上三分之一', 'var(--text-3)', 'start', 10);
    s += note(56, t2 + 16, '下三分之一', 'var(--text-3)', 'start', 10);

    /* 上下影线 + 实体 */
    s += '<line x1="' + cx + '" y1="' + hi + '" x2="' + cx + '" y2="' + lo +
      '" stroke="var(--up)" stroke-width="2.2"/>';
    s += '<rect x="' + (cx - bw / 2) + '" y="' + yClose + '" width="' + bw + '" height="' +
      (yOpen - yClose) + '" rx="3" fill="var(--up)"/>';

    /* 左侧：四个价格 */
    s += dashLine(cx - bw / 2, yClose, 138, yClose, 'var(--d-amber)');
    s += note(132, yClose + 4, '收盘', 'var(--d-amber)', 'end', 11);
    s += dashLine(cx - bw / 2, yOpen, 138, yOpen, 'var(--text-2)');
    s += note(132, yOpen + 4, '开盘', 'var(--text-2)', 'end', 11);
    s += note(cx, hi - 12, '最高', 'var(--up)', 'middle', 11);
    s += note(cx, lo + 20, '最低', 'var(--up)', 'middle', 11);

    /* 右侧：三样东西 */
    s += dashLine(cx + bw / 2, (hi + yClose) / 2, 258, (hi + yClose) / 2, 'var(--d-cyan)');
    s += note(264, (hi + yClose) / 2 + 4, '上影线', 'var(--d-cyan)', 'start', 12);
    s += note(264, (hi + yClose) / 2 + 20, '被拒绝的高价', 'var(--text-3)', 'start', 10.5);

    s += dashLine(cx + bw / 2, (yClose + yOpen) / 2, 258, (yClose + yOpen) / 2, 'var(--d-blue)');
    s += note(264, (yClose + yOpen) / 2 + 4, '实体', 'var(--d-blue)', 'start', 12);
    s += note(264, (yClose + yOpen) / 2 + 20, '开盘 → 收盘', 'var(--text-3)', 'start', 10.5);

    s += dashLine(cx + bw / 2, (yOpen + lo) / 2, 258, (yOpen + lo) / 2, 'var(--d-cyan)');
    s += note(264, (yOpen + lo) / 2 + 4, '下影线', 'var(--d-cyan)', 'start', 12);
    s += note(264, (yOpen + lo) / 2 + 20, '被拒绝的低价', 'var(--text-3)', 'start', 10.5);

    s += note(cx, 336, '收盘落在上三分之一 → 买方守住了战果', 'var(--d-amber)', 'middle', 11.5);

    /* ---- 右栏：三类 K 线，同一区间下对比实体与影线 ---- */
    var rHi = 70, rLo = 286;
    function bigBar(x, wd, yTop, yBot, color) {
      var out = '<line x1="' + x + '" y1="' + rHi + '" x2="' + x + '" y2="' + rLo +
        '" stroke="' + color + '" stroke-width="2.2"/>';
      out += '<rect x="' + (x - wd / 2) + '" y="' + yTop + '" width="' + wd + '" height="' +
        (yBot - yTop) + '" rx="3" fill="' + color + '"/>';
      return out;
    }

    /* 趋势棒：实体几乎占满，影线极短 */
    s += bigBar(492, 40, 78, 278, 'var(--up)');
    s += note(492, 322, '趋势棒', 'var(--up)', 'middle', 12);
    s += note(492, 340, '实体长 · 影线短 · 单边压倒', 'var(--text-3)', 'middle', 10.5);

    /* 十字星：实体极小，上下影线都长 */
    s += bigBar(666, 40, 174, 184, 'var(--d-neutral)');
    s += note(666, 322, '十字星', 'var(--d-neutral)', 'middle', 12);
    s += note(666, 340, '实体极小 · 双方打平', 'var(--text-3)', 'middle', 10.5);

    /* 反转棒：下影线很长，收盘回到上三分之一 */
    s += bigBar(840, 40, 128, 226, 'var(--up)');
    s += note(840, 322, '反转棒', 'var(--d-violet)', 'middle', 12);
    s += note(840, 340, '长下影 · 收盘拉回上方', 'var(--text-3)', 'middle', 10.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="K 线解剖图：左侧标注最高最低开盘收盘与实体影线，右侧对比趋势棒、十字星、反转棒">' + s + '</svg>';
  }

  /* 典型 K 线实例：并排 5 种最常见单根 / 双根形态，逐一读出结论 */
  function candleExamplesDiagram() {
    var w = 900, h = 386;
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    function oneBar(x, bw, o, c, hi, lo, up) {
      var color = up ? 'var(--up)' : 'var(--down)';
      var out = '<line x1="' + r1(x) + '" y1="' + r1(hi) + '" x2="' + r1(x) + '" y2="' + r1(lo) +
        '" stroke="' + color + '" stroke-width="2.2"/>';
      var yTop = Math.min(o, c), yBot = Math.max(o, c);
      out += '<rect x="' + r1(x - bw / 2) + '" y="' + r1(yTop) + '" width="' + bw +
        '" height="' + r1(Math.max(2, yBot - yTop)) + '" rx="2" fill="' + color + '"/>';
      return out;
    }

    var cols = [
      { x: 90,  title: '强趋势棒', note: '实体长 · 影线短 · 收极值', up: true,
        concl: '最强单边：买方碾压，别逆势', bars: [[34, 200, 72, 66, 214, true]] },
      { x: 270, title: '长上影', note: '冲高被卖回 · 收下方', up: false,
        concl: '上方被拒绝：供给压顶', bars: [[34, 196, 188, 58, 214, false]] },
      { x: 450, title: '长下影', note: '探底被买回 · 收上方', up: true,
        concl: '下方被接住：需求看多线索', bars: [[34, 110, 132, 92, 232, true]] },
      { x: 630, title: '十字星', note: '实体极小 · 双方打平', up: false,
        concl: '平衡暂停：不是反转', bars: [[34, 150, 153, 88, 222, false]] },
      { x: 810, title: '内包线', note: '子棒落在母棒之内', up: true,
        concl: '波动收缩：等突破', bars: [[36, 120, 200, 90, 224, true], [20, 150, 168, 134, 190, false]] }
    ];

    cols.forEach(function (col) {
      col.bars.forEach(function (b) {
        s += oneBar(col.x, b[0], b[1], b[2], b[3], b[4], b[5]);
      });
      s += note(col.x, 282, col.title, col.up ? 'var(--up)' : 'var(--d-neutral)', 'middle', 13);
      s += note(col.x, 302, col.note, 'var(--text-3)', 'middle', 10);
      s += '<line x1="' + r1(col.x - 86) + '" y1="314" x2="' + r1(col.x + 86) + '" y2="314" stroke="var(--border)" stroke-width="1"/>';
      s += note(col.x, 334, col.concl, 'var(--d-amber)', 'middle', 10.5);
    });

    s += note(450, 366, '五个例子没有一个是“信号”本身：它们告诉你下一步该做什么，而不是立刻下单。', 'var(--text-3)', 'middle', 11);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="典型 K 线实例：强趋势棒、长上影、长下影、十字星、内包线五种形态逐一读解">' + s + '</svg>';
  }

  /* 4. 交易区间：上下沿、中部无信息区、边缘交易与一次失败突破 */
  function tradingRangeDiagram() {
    var w = 900, h = 372;
    var x0 = 100, barW = 18, bw = 9;
    var t = 84, b = 300, pMin = 90, pMax = 205;
    var UPPER = 175, LOWER = 105;
    var N = 40;

    var bars = synthBars([
      126, 138, 150, 160, 168, 172, 168, 158, 146, 134,
      124, 114, 108, 112, 124, 136, 148, 158, 166, 170,
      164, 152, 140, 128, 118, 110, 106, 112, 126, 140,
      152, 162, 168, 195, 178, 158, 140, 126, 118, 124
    ], 2.2);

    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 中部无信息区 */
    var mTop = Y(UPPER - 20), mBot = Y(LOWER + 20);
    s += '<rect x="' + r1(X(0) - 16) + '" y="' + r1(mTop) + '" width="' + r1(X(N - 1) - X(0) + 32) +
      '" height="' + r1(mBot - mTop) + '" rx="6" fill="var(--surface-2)"/>';
    s += note((X(0) + X(N - 1)) / 2, r1((mTop + mBot) / 2) + 4,
      '中部无信息区 —— 盈亏比最差、方向上最含糊的地方，正确的做法是什么都不做',
      'var(--text-3)', 'middle', 11.5);

    /* 上下沿 */
    s += dashLine(X(0) - 24, Y(UPPER), X(N - 1) + 26, Y(UPPER), 'var(--d-blue)');
    s += dashLine(X(0) - 24, Y(LOWER), X(N - 1) + 26, Y(LOWER), 'var(--d-blue)');
    s += note(X(N - 1) + 32, Y(UPPER) - 8, '区间上沿', 'var(--d-blue)', 'start', 11.5);
    s += note(X(N - 1) + 32, Y(LOWER) + 18, '区间下沿', 'var(--d-blue)', 'start', 11.5);

    s += barsSVG(bars, X, bw, Y);

    /* 边缘反向：下沿买、上沿卖 */
    s += ringDot(X(12), Y(108), 'var(--up)', '', 0);
    s += note(X(12) - 4, Y(108) + 22, '下沿买', 'var(--up)', 'middle', 11.5);
    s += ringDot(X(19), Y(170), 'var(--down)', '', 0);
    s += note(X(19) + 4, Y(170) - 14, '上沿卖', 'var(--down)', 'middle', 11.5);

    /* 那次假突破 */
    s += ringDot(X(33), Y(195), 'var(--d-amber)', '', 0);
    s += note(X(33), Y(195) - 14, '失败突破', 'var(--d-amber)', 'middle', 11.5);
    s += note(X(33), Y(195) - 30, '八成突破尝试会失败', 'var(--d-amber)', 'middle', 10.5);

    s += note(w / 2, 348, '区间持续越久，突破后的测量移动越大 —— 把区间高度复制到突破方向，就是第一目标',
      'var(--text-2)', 'middle', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="交易区间示意图：上下沿清晰，中部为无信息区，下沿买上沿卖，上方有一次失败突破">' + s + '</svg>';
  }

  /* 5. 突破的两种结局：跟进的成立，与被收回的失败 */
  function breakoutTypesDiagram() {
    var w = 900, h = 424;
    var x0 = 66, barW = 24, bw = 12;
    var LEVEL_A = 126, LEVEL_B = 130;

    var win = synthBars([
      100, 104, 108, 112, 116, 120, 124, 130, 138, 146, 152, 148, 144, 146, 152, 158, 166
    ], 2.2);
    var fail = synthBars([
      100, 105, 111, 117, 123, 129, 136, 144, 152, 150, 140, 130, 120, 112, 105, 100
    ], 2.2);

    function X(i) { return x0 + i * barW; }
    function mkY(t, b, pMin, pMax) {
      return function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); };
    }
    var Y1 = mkY(112, 208, 94, 174);
    var Y2 = mkY(286, 382, 92, 162);

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* ---- 上：成功突破 ---- */
    s += dashLine(X(0) - 26, Y1(LEVEL_A), X(16) + 26, Y1(LEVEL_A), 'var(--d-blue)');
    s += note(X(16) + 30, Y1(LEVEL_A) + 4, '关键位', 'var(--d-blue)', 'start', 11);
    s += barsSVG(win, X, bw, Y1);

    s += note(X(0) - 26, 96, '成功突破：突破 → 跟进 → 回踩不破 → 延续',
      'var(--d-cyan)', 'start', 11.5);
    s += '<rect x="' + r1(X(7) - bw / 2 - 3) + '" y="' + r1(Y1(140) - 6) + '" width="' +
      r1(X(9) - X(7) + bw + 6) + '" height="' + r1(Y1(126) - Y1(140) + 12) +
      '" rx="6" fill="none" stroke="var(--d-cyan)" stroke-width="1.4" stroke-dasharray="4 3"/>';
    s += note((X(7) + X(9)) / 2, Y1(140) - 14, '突破 + 跟进', 'var(--d-cyan)', 'middle', 10.5);
    s += ringDot(X(12), Y1(144), 'var(--up)', '', 0);
    s += note(X(12), Y1(144) + 22, '回踩守住', 'var(--up)', 'middle', 10.5);

    /* ---- 下：失败突破 ---- */
    s += dashLine(X(0) - 26, Y2(LEVEL_B), X(15) + 26, Y2(LEVEL_B), 'var(--d-blue)');
    s += note(X(15) + 30, Y2(LEVEL_B) + 4, '关键位', 'var(--d-blue)', 'start', 11);
    s += barsSVG(fail, X, bw, Y2);

    s += note(X(0) - 26, 270, '失败突破：突破后收不回区间 → 原来的方向继续，且追高者变成卖压',
      'var(--d-amber-strong)', 'start', 11.5);
    s += ringDot(X(8), Y2(152), 'var(--d-amber)', '', 0);
    s += note(X(8), Y2(152) - 12, '最高', 'var(--d-amber)', 'middle', 10.5);
    s += ringDot(X(12), Y2(120), 'var(--down)', '', 0);
    s += note(X(12), Y2(120) + 24, '收回区间内 → 突破失败', 'var(--d-amber-strong)', 'middle', 10.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="突破成败对比图：上排为有跟进并回踩守住的成功突破，下排为突破后收回区间内的失败突破">' + s + '</svg>';
  }

  /* 6. 通道的三种结局：加速突破、转成区间、跌破反转 */
  function channelFatesDiagram() {
    var w = 900, h = 310;
    var COL = 300, barW = 12, bw = 7;
    var t = 60, b = 238;

    function pane(col, pMin, pMax) {
      var x0 = col * COL + 24;
      return {
        x: function (i) { return x0 + i * barW; },
        y: function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
      };
    }
    function solid(x1, y1, x2, y2, color, wid) {
      return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) +
        '" stroke="' + color + '" stroke-width="' + (wid || 1.6) + '"/>';
    }
    function caption(x, l1, l2) {
      return note(x, 266, l1, 'var(--text-2)', 'start', 11) +
        note(x, 288, l2, 'var(--text-3)', 'start', 10.5);
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* ---------- ① 加速：实体收在通道上沿之外 ---------- */
    var g1 = pane(0, 94, 192);
    var b1 = synthBars([100, 106, 113, 119, 115, 110, 116, 123, 130, 126, 121, 127,
      134, 141, 137, 133, 140, 148, 158, 170, 182], 2.0);
    s += solid(g1.x(3), g1.y(119), g1.x(20), g1.y(156.4), 'var(--d-violet)');
    s += dashLine(g1.x(5), g1.y(110), g1.x(20), g1.y(143), 'var(--d-violet)');
    s += barsSVG(b1, g1.x, bw, g1.y);
    s += note(g1.x(0), 40, '① 通道加速', 'var(--d-cyan)', 'start', 12);
    s += note(g1.x(0), 80, '实体收在通道上沿之外', 'var(--d-cyan)', 'start', 10.5);
    s += note(g1.x(0), 96, '→ 斜率变陡，原来的通道被甩在下面', 'var(--d-cyan)', 'start', 10.5);
    s += caption(g1.x(0), '要维持更陡的角度，需要越来越大的买盘', '通常出现在趋势的最后阶段');

    /* ---------- ② 转区间：打破后走平 ---------- */
    var g2 = pane(1, 94, 148);
    var b2 = synthBars([100, 106, 113, 119, 115, 110, 116, 123, 130, 135, 131, 127,
      128, 133, 124, 132, 125, 131, 126, 130, 127], 2.0);
    s += solid(g2.x(3), g2.y(119), g2.x(12), g2.y(143), 'var(--d-violet)');
    s += dashLine(g2.x(5), g2.y(110), g2.x(12), g2.y(129.8), 'var(--d-violet)');
    s += barsSVG(b2, g2.x, bw, g2.y);
    s += dashLine(g2.x(13), g2.y(135.5), g2.x(22), g2.y(135.5), 'var(--d-blue)');
    s += dashLine(g2.x(13), g2.y(121.5), g2.x(22), g2.y(121.5), 'var(--d-blue)');
    s += note(g2.x(0), 40, '② 通道转区间', 'var(--d-blue)', 'start', 12);
    s += note(g2.x(0), 80, '通道被打破后不再延续', 'var(--d-blue)', 'start', 10.5);
    s += note(g2.x(0), 96, '→ 高低点重新变水平', 'var(--d-blue)', 'start', 10.5);
    s += caption(g2.x(0), '三种结局里最常见的一种', '它是中继信号，不是反转信号');

    /* ---------- ③ 反转：跌穿趋势线 ---------- */
    var g3 = pane(2, 82, 140);
    var b3 = synthBars([100, 106, 113, 119, 115, 110, 116, 123, 130, 126, 121, 117,
      124, 131, 130, 124, 116, 109, 102, 95, 88], 2.0);
    s += solid(g3.x(3), g3.y(119), g3.x(15), g3.y(133.4), 'var(--d-violet)');
    s += dashLine(g3.x(5), g3.y(110), g3.x(20), g3.y(127.5), 'var(--d-violet)');
    s += barsSVG(b3, g3.x, bw, g3.y);
    s += dashLine(g3.x(14), g3.y(132), g3.x(20), g3.y(90), 'var(--d-amber)');
    s += ringDot(g3.x(17), g3.y(109), 'var(--d-amber)', '', 0);
    s += note(g3.x(17) + 9, g3.y(109) + 4, '跌破', 'var(--d-amber)', 'start', 10.5);
    s += note(g3.x(0), 40, '③ 通道反转', 'var(--d-amber)', 'start', 12);
    s += note(g3.x(0), 80, '跌穿趋势线之后不再收回', 'var(--d-amber)', 'start', 10.5);
    s += note(g3.x(0), 96, '→ 斜率反向', 'var(--d-amber)', 'start', 10.5);
    s += caption(g3.x(0), '判据是跌穿之后持续走低', '只是碰到趋势线又弹回来，那叫回踩');

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="通道的三种结局并排对比：左为加速突破，中为转成水平区间，右为跌破趋势线反转">' + s + '</svg>';
  }

  /* 7. 开盘突破：区间被有效突破 → 全天单边；被收回 → 震荡日 */
  function openingBreakoutDiagram() {
    var w = 900, h = 424;
    var x0 = 76, barW = 30, bw = 14;

    var trend = synthBars([100, 103, 97, 104, 96,
      110, 114, 118, 122, 126, 130, 134, 132, 137, 142, 147, 152, 158, 164, 170], 1.8);
    var chop = synthBars([100, 103, 97, 104, 96,
      105, 107, 103, 99, 97, 96, 99, 102, 103, 100, 98, 96, 99, 102, 100], 1.8);

    function X(i) { return x0 + i * barW; }
    function mkY(t, b, pMin, pMax) {
      return function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); };
    }
    var Y1 = mkY(118, 214, 90, 176);
    var Y2 = mkY(302, 398, 90, 112);

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* ---------- 上：趋势从开盘开始 ---------- */
    s += note(20, 92, '① 趋势从开盘开始', 'var(--d-cyan)', 'start', 12);
    s += note(20, 108, '开盘区间被有效突破，且不再回到区间内 —— 全天单边', 'var(--d-cyan)', 'start', 10.5);
    s += '<rect x="' + r1(X(0) - bw / 2 - 6) + '" y="' + r1(Y1(105)) + '" width="' +
      r1(X(4) - X(0) + bw + 12) + '" height="' + r1(Y1(95) - Y1(105)) +
      '" rx="5" fill="none" stroke="var(--d-blue)" stroke-width="1.4" stroke-dasharray="4 3"/>';
    s += barsSVG(trend, X, bw, Y1);
    s += note((X(0) + X(4)) / 2, Y1(105) - 10, '开盘区间', 'var(--d-blue)', 'middle', 10.5);
    s += ringDot(X(5), Y1(trend[5].c), 'var(--d-cyan)', '', 0);
    s += note(X(5), Y1(trend[5].c) + 22, '突破点', 'var(--d-cyan)', 'middle', 10.5);

    /* ---------- 下：突破失败 → 震荡日 ---------- */
    s += note(20, 276, '② 突破失败：被收回开盘区间', 'var(--d-amber-strong)', 'start', 12);
    s += note(20, 292, '当天大概率是震荡日，切回区间边缘反向的做法', 'var(--d-amber-strong)', 'start', 10.5);
    s += '<rect x="' + r1(X(0) - bw / 2 - 6) + '" y="' + r1(Y2(104)) + '" width="' +
      r1(X(19) - X(0) + bw + 12) + '" height="' + r1(Y2(96) - Y2(104)) +
      '" rx="5" fill="var(--surface-2)"/>';
    s += dashLine(X(0) - 18, Y2(104), X(19) + 20, Y2(104), 'var(--d-blue)');
    s += dashLine(X(0) - 18, Y2(96), X(19) + 20, Y2(96), 'var(--d-blue)');
    s += barsSVG(chop, X, bw, Y2);
    s += ringDot(X(6), Y2(chop[6].h), 'var(--d-amber)', '', 0);
    s += note(X(6) + 12, Y2(chop[6].h) - 6, '假突破', 'var(--d-amber-strong)', 'start', 10.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="开盘突破对比图：上格开盘区间被有效突破后全天单边，下格突破被收回后当天转为震荡">' + s + '</svg>';
  }

  /* 8. 测量移动：区间高度投射 / 突破段投射 */
  function measuredMoveDiagram() {
    var w = 900, h = 424;
    var x0 = 76, barW = 30, bw = 14;

    var fromRange = synthBars([104, 108, 111, 106, 101, 100, 105, 110, 112, 107,
      114, 118, 121, 124, 126, 124], 1.8);
    var fromLeg = synthBars([100, 103, 106, 109, 112, 108, 105, 104,
      107, 110, 113, 116, 119, 121, 119, 118], 1.8);

    function X(i) { return x0 + i * barW; }
    function mkY(t, b, pMin, pMax) {
      return function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); };
    }
    function vMeasure(x, y1, y2, color) {
      var cap = 5;
      return '<line x1="' + r1(x) + '" y1="' + r1(y1) + '" x2="' + r1(x) + '" y2="' + r1(y2) +
        '" stroke="' + color + '" stroke-width="1.5"/>' +
        '<line x1="' + r1(x - cap) + '" y1="' + r1(y1) + '" x2="' + r1(x + cap) + '" y2="' + r1(y1) +
        '" stroke="' + color + '" stroke-width="1.5"/>' +
        '<line x1="' + r1(x - cap) + '" y1="' + r1(y2) + '" x2="' + r1(x + cap) + '" y2="' + r1(y2) +
        '" stroke="' + color + '" stroke-width="1.5"/>';
    }
    var Y1 = mkY(112, 196, 96, 134);
    var Y2 = mkY(292, 382, 96, 126);
    var mx = X(15) + 52;

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* ---------- 上：区间高度投射 ---------- */
    s += note(20, 88, '① 区间高度投射（最常用）', 'var(--d-cyan)', 'start', 12);
    s += note(20, 104, '区间横得越久，这个目标越可靠', 'var(--d-cyan)', 'start', 10.5);
    s += dashLine(X(0) - 22, Y1(112), X(9) + 14, Y1(112), 'var(--d-violet)');
    s += dashLine(X(0) - 22, Y1(100), X(9) + 14, Y1(100), 'var(--d-violet)');
    s += barsSVG(fromRange, X, bw, Y1);
    s += dashLine(X(10), Y1(124), X(15) + 30, Y1(124), 'var(--d-cyan)');
    s += note(X(10), Y1(124) - 9, '目标位', 'var(--d-cyan)', 'start', 10.5);
    s += vMeasure(mx, Y1(100), Y1(112), 'var(--d-violet)');
    s += note(mx + 10, (Y1(100) + Y1(112)) / 2 + 4, '区间高度', 'var(--d-violet)', 'start', 10.5);
    s += vMeasure(mx, Y1(112), Y1(124), 'var(--d-cyan)');
    s += note(mx + 10, (Y1(112) + Y1(124)) / 2 + 4, '等长投射', 'var(--d-cyan)', 'start', 10.5);

    /* ---------- 下：突破段投射 ---------- */
    s += note(20, 268, '② 突破段投射', 'var(--d-amber)', 'start', 12);
    s += note(20, 284, '量出第一段上涨，从回撤低点等长复制', 'var(--d-amber)', 'start', 10.5);
    s += barsSVG(fromLeg, X, bw, Y2);
    s += ringDot(X(7), Y2(fromLeg[7].l), 'var(--d-amber)', '', 0);
    s += note(X(7) + 10, Y2(fromLeg[7].l) + 14, '回撤低点', 'var(--d-amber)', 'start', 10.5);
    s += dashLine(X(8), Y2(116), X(15) + 30, Y2(116), 'var(--d-amber)');
    s += note(X(8), Y2(116) - 9, '目标位', 'var(--d-amber)', 'start', 10.5);
    s += vMeasure(mx, Y2(100), Y2(112), 'var(--d-violet)');
    s += note(mx + 10, (Y2(100) + Y2(112)) / 2 + 4, '突破段', 'var(--d-violet)', 'start', 10.5);
    s += vMeasure(mx, Y2(116), Y2(104), 'var(--d-amber)');
    s += note(mx + 10, (Y2(116) + Y2(104)) / 2 + 4, '等长投射', 'var(--d-amber)', 'start', 10.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="测量移动示意图：上格把区间高度投射到突破方向，下格把突破段高度从回撤低点等长复制">' + s + '</svg>';
  }

  /* 9. 区间的三种类型：窄幅 / 宽幅 / 倾斜（标准横向型已在交易区间图里） */
  function rangeTypesDiagram() {
    var w = 900, h = 310;
    var COL = 300, barW = 12, bw = 7;
    var t = 60, b = 238;

    function pane(col, pMin, pMax) {
      var x0 = col * COL + 24;
      return {
        x: function (i) { return x0 + i * barW; },
        y: function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
      };
    }
    function solid(x1, y1, x2, y2, color, wid, op) {
      return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) +
        '" stroke="' + color + '" stroke-width="' + (wid || 1.6) + '"' +
        (op ? ' opacity="' + op + '"' : '') + '/>';
    }
    /* 用带端刺的竖线标注区间带宽 */
    function widthBracket(x, y1, y2, color, label) {
      var s2 = solid(x, y1, x, y2, color, 1.4);
      s2 += solid(x - 5, y1, x + 5, y1, color, 1.4);
      s2 += solid(x - 5, y2, x + 5, y2, color, 1.4);
      if (label) s2 += note(x, y1 - 10, label, color, 'middle', 10.5);
      return s2;
    }
    function caption(x, l1, l2) {
      return note(x, 266, l1, 'var(--text-2)', 'start', 11) +
        note(x, 288, l2, 'var(--text-3)', 'start', 10.5);
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* ---------- ① 窄幅区间：宽度不足以覆盖成本 ---------- */
    var g1 = pane(0, 94, 150);
    var b1 = synthBars([101, 103, 100, 104, 102, 105, 101, 103, 106, 102, 104,
      101, 103, 105, 102, 104, 103, 101, 104, 102, 103], 1.6);
    var U1 = 107.4, L1 = 98.6;
    s += dashLine(g1.x(0) - 14, g1.y(U1), g1.x(20) + 10, g1.y(U1), 'var(--d-cyan)');
    s += dashLine(g1.x(0) - 14, g1.y(L1), g1.x(20) + 10, g1.y(L1), 'var(--d-cyan)');
    s += barsSVG(b1, g1.x, bw, g1.y);
    s += widthBracket(g1.x(20) + 16, g1.y(U1), g1.y(L1), 'var(--d-cyan)', '区间窄');
    s += note(g1.x(1), g1.y(U1) - 12, '↑ 突破买', 'var(--d-cyan)', 'start', 10);
    s += note(g1.x(1), g1.y(L1) + 18, '↓ 突破卖', 'var(--d-cyan)', 'start', 10);
    s += note(g1.x(0), 40, '① 窄幅区间', 'var(--d-cyan)', 'start', 12);
    s += note(g1.x(0), 80, 'K 线几乎完全重叠，边界看不出清晰的两次失败', 'var(--d-cyan)', 'start', 10.5);
    s += note(g1.x(0), 96, '→ 空仓等待，或两侧各挂一张突破单', 'var(--d-cyan)', 'start', 10.5);
    s += caption(g1.x(0), '窄到一定程度就不该交易', '摩擦成本会吃掉边缘反向的全部优势');

    /* ---------- ② 宽幅区间：钱在边缘，但要放宽止损 ---------- */
    var g2 = pane(1, 94, 185);
    var b2 = synthBars([104, 120, 138, 150, 148, 132, 114, 100, 98, 110,
      128, 144, 150, 140, 124, 106, 100, 114, 132, 148], 2.2);
    var U2 = 151.5, L2 = 96.5, MID2 = 124;
    s += dashLine(g2.x(0) - 14, g2.y(U2), g2.x(19) + 10, g2.y(U2), 'var(--d-blue)');
    s += dashLine(g2.x(0) - 14, g2.y(L2), g2.x(19) + 10, g2.y(L2), 'var(--d-blue)');
    s += dashLine(g2.x(0) - 6, g2.y(MID2), g2.x(19) + 6, g2.y(MID2), 'var(--d-neutral)');
    s += barsSVG(b2, g2.x, bw, g2.y);
    s += widthBracket(g2.x(19) + 16, g2.y(U2), g2.y(L2), 'var(--d-blue)', '区间宽');
    s += note(g2.x(0), g2.y(MID2) - 8, '中部先当作目标，不要一口吃到另一端',
      'var(--d-neutral)', 'start', 10.5);
    s += note(g2.x(0), 40, '② 宽幅区间', 'var(--d-blue)', 'start', 12);
    s += note(g2.x(0), 80, '单边推动远、回撤深，看着像"没有规律的趋势"', 'var(--d-blue)', 'start', 10.5);
    s += note(g2.x(0), 96, '→ 边缘反向仍有效，但止损要放宽、仓位要减小', 'var(--d-blue)', 'start', 10.5);
    s += caption(g2.x(0), '套用窄区间的紧止损，会被正常波动扫出去', '然后价格照着你的方向走');

    /* ---------- ③ 倾斜区间：本质是通道 ---------- */
    var g3 = pane(2, 90, 182);
    var b3 = synthBars([102, 110, 111, 106, 103, 108, 120, 130, 132, 128,
      124, 125, 137, 148, 154, 150, 146, 145, 155, 169], 1.8);
    s += dashLine(g3.x(0), g3.y(104), g3.x(19), g3.y(170), 'var(--d-violet)');
    s += dashLine(g3.x(0), g3.y(94), g3.x(19), g3.y(153), 'var(--d-violet)');
    s += barsSVG(b3, g3.x, bw, g3.y);
    s += note(g3.x(4), g3.y(126), '↗ 顺势方向优先', 'var(--d-violet)', 'start', 10.5);
    s += note(g3.x(0), 40, '③ 倾斜区间', 'var(--d-violet)', 'start', 12);
    s += note(g3.x(0), 80, '高低点在抬高，但节奏琐碎、重叠度高', 'var(--d-violet)', 'start', 10.5);
    s += note(g3.x(0), 96, '→ 它其实就是通道，按通道的边缘做', 'var(--d-violet)', 'start', 10.5);
    s += caption(g3.x(0), '当成水平区间做，会在倾斜的上沿反复做空', '逆着倾斜方向的胜率极低');

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="区间三种类型并排对比：左为窄幅区间（宽度不足以覆盖成本），中为宽幅区间（边界清晰但回撤深），右为倾斜区间（本质是通道）">' + s + '</svg>';
  }

  /* 10. 边界被反复测试之后逐渐变薄，第四次才走出去 */
  function rangeWearingDiagram() {
    var w = 900, h = 352;
    var x0 = 76, barW = 24, bw = 11;
    var t = 96, b = 300, pMin = 94, pMax = 166;
    var UPPER = 131, LOWER = 100;
    var N = 30;

    var bars = synthBars([108, 118, 127, 118, 108, 102, 110, 129, 120, 110,
      106, 108, 118, 128, 130, 121, 111, 107, 108, 118, 126, 130, 120, 111,
      107, 108, 118, 130, 143, 155], 1.8);

    function X(i) { return x0 + i * barW; }
    function Y(p) { return t + (pMax - p) / (pMax - pMin) * (b - t); }
    function edge(x1, x2, wid, op, dash) {
      return '<line x1="' + r1(x1) + '" y1="' + r1(Y(UPPER)) + '" x2="' + r1(x2) + '" y2="' +
        r1(Y(UPPER)) + '" stroke="var(--d-blue)" stroke-width="' + wid + '" opacity="' + op + '"' +
        (dash ? ' stroke-dasharray="6 5"' : '') + '/>';
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 上沿被逐次消耗：线越画越淡 */
    s += edge(X(0) - 22, X(7), 2.2, 0.95, false);
    s += edge(X(7), X(14), 1.7, 0.62, false);
    s += edge(X(14), X(21), 1.3, 0.38, true);
    s += edge(X(21), X(26), 1.0, 0.20, true);
    s += note(X(N - 1) + 12, Y(UPPER) - 8, '上沿：被测试 4 次后破', 'var(--d-blue)', 'start', 11);

    /* 下沿只被测试过一次，挂单依然很厚 */
    s += dashLine(X(0) - 22, Y(LOWER), X(N - 1) + 24, Y(LOWER), 'var(--d-blue)');
    s += note(X(N - 1) + 12, Y(LOWER) + 18, '下沿：只被测试 1 次，仍然很厚',
      'var(--d-blue)', 'start', 11);

    s += barsSVG(bars, X, bw, Y);

    /* 四次测试 */
    s += ringDot(X(7), Y(UPPER), 'var(--d-blue)', '', 0);
    s += note(X(7), Y(UPPER) - 12, '1', 'var(--d-blue)', 'middle', 11);
    s += ringDot(X(14), Y(UPPER), 'var(--d-blue)', '', 0);
    s += note(X(14), Y(UPPER) - 12, '2', 'var(--d-blue)', 'middle', 11);
    s += ringDot(X(21), Y(UPPER), 'var(--d-blue)', '', 0);
    s += note(X(21), Y(UPPER) - 12, '3', 'var(--d-blue)', 'middle', 11);
    s += ringDot(X(27), Y(UPPER), 'var(--d-amber)', '', 0);
    s += note(X(27), Y(UPPER) - 12, '4', 'var(--d-amber)', 'middle', 11);
    s += ringDot(X(5), Y(LOWER), 'var(--d-blue)', '', 0);

    /* 第 4 次之后走出来 */
    s += '<line x1="' + r1(X(27)) + '" y1="' + r1(Y(131)) + '" x2="' + r1(X(29)) + '" y2="' +
      r1(Y(156)) + '" stroke="var(--d-amber)" stroke-width="2"/>';
    s += ringDot(X(29), Y(155), 'var(--up)', '', 0);
    s += note(X(29), Y(155) - 14, '走出 + 跟进', 'var(--up)', 'middle', 10.5);

    s += note(20, 34, '边界每被测试一次，挡在路上的挂单就被消耗掉一层',
      'var(--text-2)', 'start', 12);
    s += note(20, 56, '线越画越淡，代表阻力越薄 —— 这和 K 线强不强没有关系',
      'var(--text-3)', 'start', 11);
    s += note(20, 326, '区间的突破不发生在"最强"的时候，而发生在"边界最薄"的时候',
      'var(--text-2)', 'start', 11);
    s += note(20, 346, '所以同一个位置重复得越多，越该准备突破，而不是继续做边缘反向',
      'var(--text-3)', 'start', 10.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="区间边界被反复测试后逐渐削弱的示意图：上沿被测试四次，线条逐次变淡，第四次成功走出；下沿只被测试一次，依然很厚">' + s + '</svg>';
  }

  /* 10. 缺口回补：向上跳空形成后，价格随后走回空档将其填满 */
  function gapFillDiagram() {
    var w = 900, h = 348;
    var x0 = 64, barW = 46, bw = 24;
    var pTop = 56, pBot = 292, pMin = 98, pMax = 116;

    var bars = [
      { o: 100,   h: 102,   l: 99,    c: 101 },
      { o: 101,   h: 103,   l: 100,   c: 102 },
      { o: 102,   h: 104,   l: 101,   c: 103 },
      { o: 103,   h: 105,   l: 102.5, c: 104.5 },
      { o: 108,   h: 110,   l: 107.5, c: 109 },   /* 向上跳空 */
      { o: 109,   h: 111,   l: 108.5, c: 110.5 },
      { o: 110.5, h: 112.5, l: 110,   c: 112 },
      { o: 112,   h: 113,   l: 107,   c: 108.5 }, /* 回踩进入缺口 */
      { o: 108.5, h: 109.5, l: 104,   c: 105 },   /* 完全回补 */
      { o: 105,   h: 106.5, l: 102.5, c: 103.5 }
    ];

    function X(i) { return x0 + i * barW; }
    function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }

    var GAP_TOP = 107.5, GAP_BOT = 105;
    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    var gy1 = Y(GAP_TOP), gy2 = Y(GAP_BOT);
    s += '<rect x="' + r1(X(4) - bw / 2 - 4) + '" y="' + r1(gy1) + '" width="' + r1(bw + 8) +
      '" height="' + r1(gy2 - gy1) + '" fill="var(--d-cyan)" opacity=".14"/>';
    s += dashLine(X(4) - bw / 2 - 10, gy1, X(4) + bw / 2 + 10, gy1, 'var(--d-cyan)');
    s += dashLine(X(4) - bw / 2 - 10, gy2, X(4) + bw / 2 + 10, gy2, 'var(--d-cyan)');

    s += barsSVG(bars, X, bw, Y);

    s += note(X(4), gy1 - 14, '向上跳空 · 缺口形成', 'var(--d-cyan)', 'middle', 11);
    s += note(X(4), gy1 - 30, '开盘跳到前一根最高价之上', 'var(--text-3)', 'middle', 10);

    /* 价格回补：从高点拉一条磁吸曲线进入缺口 */
    s += '<path d="M' + r1(X(6)) + ' ' + r1(Y(112.5) - 6) + ' Q' + r1(X(7)) + ' ' + r1(Y(110)) +
      ' ' + r1(X(7.4)) + ' ' + r1(Y(106)) + '" fill="none" stroke="var(--d-amber)" stroke-width="1.6"/>';
    s += ringDot(X(7.4), Y(106), 'var(--d-amber)', '', 0);
    s += note(X(8.6), Y(106) - 4, '价格回到缺口内', 'var(--d-amber-strong)', 'start', 10.5);
    s += note(X(8.6), Y(106) + 14, '→ 缺口被回补', 'var(--d-amber-strong)', 'start', 10.5);

    s += note(w / 2, h - 18, '九成以上的缺口都会被回补 —— 缺口是磁铁，不是墙', 'var(--text-2)', 'middle', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="缺口回补示意图：向上跳空形成缺口后，价格随后走回空档将缺口填满">' + s + '</svg>';
  }

  /* 11. 三类缺口：突破跳空 / 中继跳空 / 衰竭跳空 同图对照 */
  function gapTypesDiagram() {
    var w = 900, h = 392;
    var x0 = 46, barW = 46, bw = 22;
    var pTop = 60, pBot = 300, pMin = 98, pMax = 132;

    var bars = [
      { o: 100,   h: 102,   l: 99,    c: 101 },
      { o: 101,   h: 103,   l: 100,   c: 102 },
      { o: 102,   h: 104,   l: 101,   c: 103 },
      { o: 103,   h: 104.5, l: 101.5, c: 102 },
      { o: 102,   h: 103,   l: 100.5, c: 101 },
      { o: 101,   h: 102.5, l: 99.5,  c: 100.5 },
      { o: 100.5, h: 102,   l: 99,    c: 100.5 },
      { o: 100.5, h: 102,   l: 99.5,  c: 101.5 },
      { o: 105,   h: 108,   l: 104.5, c: 107 },   /* 突破跳空 */
      { o: 107,   h: 110,   l: 106.5, c: 109 },
      { o: 109,   h: 112,   l: 108.5, c: 111 },
      { o: 115,   h: 118,   l: 114.5, c: 117 },   /* 中继跳空 */
      { o: 117,   h: 120,   l: 116.5, c: 119 },
      { o: 119,   h: 122,   l: 118.5, c: 121 },
      { o: 125,   h: 128,   l: 121,   c: 122.5 }, /* 衰竭跳空（收盘落回缺口内） */
      { o: 122.5, h: 124,   l: 118,   c: 119 },   /* 反转向下 */
      { o: 119,   h: 120.5, l: 115,   c: 116 },
      { o: 116,   h: 117.5, l: 112,   c: 113 }
    ];

    function X(i) { return x0 + i * barW; }
    function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    s += dashLine(X(0) - 8, Y(104), X(7) + 8, Y(104), 'var(--d-neutral)');
    s += note(X(0) - 8, Y(104) - 8, '区间', 'var(--text-3)', 'start', 10.5);

    s += barsSVG(bars, X, bw, Y);

    function gapBand(idx, top, bot, color) {
      var gy1 = Y(top), gy2 = Y(bot);
      return '<rect x="' + r1(X(idx) - bw / 2 - 3) + '" y="' + r1(gy1) +
        '" width="' + r1(bw + 6) + '" height="' + r1(gy2 - gy1) +
        '" fill="' + color + '" opacity=".16"/>';
    }
    s += gapBand(8, 104.5, 102, 'var(--d-blue)');
    s += gapBand(11, 114.5, 112, 'var(--d-cyan)');
    s += gapBand(14, 124.5, 122, 'var(--d-amber)');

    s += note(X(8), Y(104.5) - 16, '① 突破跳空', 'var(--d-blue)', 'middle', 11);
    s += note(X(8), Y(104.5) - 32, '区间突破 · 不回补', 'var(--text-3)', 'middle', 10);
    s += note(X(11), Y(114.5) - 16, '② 中继跳空', 'var(--d-cyan)', 'middle', 11);
    s += note(X(11), Y(114.5) - 32, '趋势中途 · 确认动能', 'var(--text-3)', 'middle', 10);
    s += note(X(14), Y(124.5) - 16, '③ 衰竭跳空', 'var(--d-amber)', 'middle', 11);
    s += note(X(14), Y(124.5) - 32, '末端放量 · 立刻被回补', 'var(--text-3)', 'middle', 10);

    s += '<path d="M' + r1(X(14)) + ' ' + r1(Y(122.5) + 6) + ' Q' + r1(X(16)) + ' ' + r1(Y(118)) +
      ' ' + r1(X(17)) + ' ' + r1(Y(113) + 6) + '" fill="none" stroke="var(--d-amber)" stroke-width="1.6"/>';

    s += note(w / 2, h - 16, '位置决定含义：起点不回补、中点确认动能、终点迅速回补即预警反转', 'var(--text-2)', 'middle', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="三类缺口示意图：突破跳空不回补、中继跳空确认动能、衰竭跳空迅速回补并转向">' + s + '</svg>';
  }

  /* 楔形：上升楔形（看跌）/ 下降楔形（看涨），两条边界同向收敛、突破常反向 */
  function wedgeTypesDiagram() {
    var w = 900, h = 392;
    var pTop = 64, pBot = 296, pMin = 90, pMax = 134;

    function panel(off) {
      var x0 = 60 + off, barW = 26, bw = 12;
      function X(i) { return x0 + i * barW; }
      function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }
      return { X: X, Y: Y };
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 上升楔形（看跌）：两线同向上倾但下沿更陡，向右收敛，向下突破 */
    var L = panel(0);
    var up = synthBars([100, 106, 111, 115, 118, 120, 121.5, 122], 2.0);
    s += barsSVG(up, L.X, L.bw, L.Y);
    s += '<line x1="' + r1(L.X(0)) + '" y1="' + r1(L.Y(105)) + '" x2="' + r1(L.X(7)) + '" y2="' + r1(L.Y(124.5)) + '" stroke="var(--d-blue)" stroke-width="1.6" opacity=".85"/>';
    s += '<line x1="' + r1(L.X(0)) + '" y1="' + r1(L.Y(100)) + '" x2="' + r1(L.X(7)) + '" y2="' + r1(L.Y(121.5)) + '" stroke="var(--d-blue)" stroke-width="1.6" opacity=".5"/>';
    s += note(L.X(3.5), L.Y(128), '上升楔形（看跌）', 'var(--d-blue)', 'middle', 11.5);
    s += dashLine(L.X(7), L.Y(122), L.X(7) + 16, L.Y(108), 'var(--d-amber)');
    s += note(L.X(7) + 6, L.Y(104), '向下突破', 'var(--d-amber)', 'start', 10.5);

    /* 下降楔形（看涨）：两线同向下倾但上沿更陡，向右收敛，向上突破 */
    var R = panel(460);
    var dn = synthBars([122, 116, 111, 107, 104, 102, 101, 100.5], 2.0);
    s += barsSVG(dn, R.X, R.bw, R.Y);
    s += '<line x1="' + r1(R.X(0)) + '" y1="' + r1(R.Y(124)) + '" x2="' + r1(R.X(7)) + '" y2="' + r1(R.Y(101)) + '" stroke="var(--d-cyan)" stroke-width="1.6" opacity=".85"/>';
    s += '<line x1="' + r1(R.X(0)) + '" y1="' + r1(R.Y(122)) + '" x2="' + r1(R.X(7)) + '" y2="' + r1(R.Y(100)) + '" stroke="var(--d-cyan)" stroke-width="1.6" opacity=".5"/>';
    s += note(R.X(3.5), R.Y(128), '下降楔形（看涨）', 'var(--d-cyan)', 'middle', 11.5);
    s += dashLine(R.X(7), R.Y(100.5), R.X(7) + 16, R.Y(112), 'var(--d-amber)');
    s += note(R.X(7) + 6, R.Y(116), '向上突破', 'var(--d-amber)', 'start', 10.5);

    s += note(w / 2, h - 12, '两条边界都朝同一方向但收敛——动能逐次减弱；突破方向通常反向，入场要等突破后的结构确认', 'var(--text-2)', 'middle', 11);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="楔形示意图：上升楔形看跌、下降楔形看涨，两者都收敛且突破常反向">' + s + '</svg>';
  }

  /* 支撑阻力：同一条水平被反复测试，跌破后原支撑翻转为阻力 */
  function supportResistanceDiagram() {
    var w = 900, h = 360;
    var pTop = 56, pBot = 300, pMin = 100, pMax = 150;
    var x0 = 56, barW = 38, bw = 18;
    function X(i) { return x0 + i * barW; }
    function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }

    var bars = [
      { o: 138, h: 142, l: 128, c: 132 },
      { o: 132, h: 135, l: 119, c: 124 },
      { o: 124, h: 137, l: 119, c: 134 },
      { o: 134, h: 138, l: 120, c: 127 },
      { o: 127, h: 139, l: 119, c: 136 },
      { o: 136, h: 141, l: 134, c: 138 },
      { o: 138, h: 140, l: 116, c: 112 },
      { o: 112, h: 120, l: 110, c: 117 },
      { o: 117, h: 118, l: 103, c: 107 }
    ];

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';
    s += barsSVG(bars, X, bw, Y);

    var lvl = 118;
    s += '<line x1="' + r1(X(-0.5)) + '" y1="' + r1(Y(lvl)) + '" x2="' + r1(X(8.5)) + '" y2="' + r1(Y(lvl)) +
      '" stroke="var(--d-violet)" stroke-width="1.6" stroke-dasharray="7 5" opacity=".8"/>';
    s += note(X(-0.5) + 4, Y(lvl) - 8, '同一水平', 'var(--d-violet)', 'start', 10.5);

    s += note(X(1.5), Y(lvl) + 26, '支撑（两次被接住）', 'var(--d-blue)', 'middle', 10);
    s += note(X(5.5), Y(lvl) - 22, '跌破', 'var(--d-amber)', 'middle', 10);
    s += note(X(7.5), Y(lvl) + 26, '回踩变阻力（被拒）', 'var(--d-cyan)', 'middle', 10);

    s += note(w / 2, h - 12, '一条水平被反复测试 → 跌破后原支撑翻转为阻力，回踩时变成卖压区', 'var(--text-2)', 'middle', 11);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="支撑阻力角色互换示意图：水平支撑被跌破后翻转为阻力">' + s + '</svg>';
  }

  /* 反转：上排微双底（更高的低点确认）、下排假突破（失败反转） */
  function reversalTypesDiagram() {
    var w = 900, h = 424;
    var x0 = 64, barW = 32, bw = 15;
    function X(i) { return x0 + i * barW; }
    function mkY(t, b, pMin, pMax) {
      return function (p) { return t + (pMax - p) / (pMax - pMin) * (b - t); };
    }
    var Y1 = mkY(96, 214, 100, 142);
    var Y2 = mkY(276, 392, 96, 142);

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 上：下跌中两次下探，第二脚更高（HL）→ 反转 */
    var up = synthBars([128, 122, 116, 110, 108, 116, 118, 110, 116, 124, 130], 2.4);
    s += barsSVG(up, X, bw, Y1);
    s += ringDot(X(4), Y1(108), 'var(--d-blue)', '低', Y1(108) + 22);
    s += ringDot(X(7), Y1(110), 'var(--d-blue)', 'HL', Y1(110) + 22);
    s += note(X(7), Y1(110) - 26, '第二脚更高 → 更高的低点', 'var(--d-blue)', 'middle', 10.5);
    s += note(X(0) - 12, 80, '微双底：下跌末端出现更高的低点，反转成立', 'var(--d-blue)', 'start', 11.5);

    /* 下：上涨创出新高后反转棒 + 跟进，向下反转 */
    var dn = synthBars([108, 114, 120, 126, 132, 138, 142, 140, 132, 124, 116, 108], 2.4);
    s += barsSVG(dn, X, bw, Y2);
    s += ringDot(X(6), Y2(142), 'var(--d-amber)', '新高', Y2(142) - 16);
    s += ringDot(X(7), Y2(140), 'var(--d-amber)', '反转', Y2(140) + 22);
    s += note(X(6), Y2(142) + 30, '新高后被反转棒拉回 → 失败突破', 'var(--d-amber)', 'middle', 10.5);
    s += note(X(0) - 12, 262, '假突破：创趋势末端新高，立刻被反转棒 + 跟进吞掉', 'var(--d-amber)', 'start', 11.5);

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="反转示意图：上排微双底更高的低点确认反转，下排假突破失败反转">' + s + '</svg>';
  }

  /* 通道宽度：窄通道回撤浅只能追；宽通道回撤深当区间做 */
  function channelWidthDiagram() {
    var w = 900, h = 344;
    var pTop = 52, pBot = 296, pMin = 96, pMax = 150;

    function panel(off) {
      var x0 = 60 + off, barW = 30, bw = 14;
      function X(i) { return x0 + i * barW; }
      function Y(p) { return pTop + (pMax - p) / (pMax - pMin) * (pBot - pTop); }
      return { X: X, Y: Y };
    }

    var s = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="var(--surface)"/>';

    /* 左：窄通道——回撤极浅，两线几乎贴合 */
    var L = panel(0);
    var tight = synthBars([110, 116, 121, 127, 132, 137, 142, 147, 152, 157], 1.4);
    s += barsSVG(tight, L.X, L.bw, L.Y);
    s += '<line x1="' + r1(L.X(1)) + '" y1="' + r1(L.Y(112)) + '" x2="' + r1(L.X(9)) + '" y2="' + r1(L.Y(154)) + '" stroke="var(--d-violet)" stroke-width="1.5" opacity=".8"/>';
    s += '<line x1="' + r1(L.X(1)) + '" y1="' + r1(L.Y(115)) + '" x2="' + r1(L.X(9)) + '" y2="' + r1(L.Y(157)) + '" stroke="var(--d-violet)" stroke-width="1.5" stroke-dasharray="6 5" opacity=".55"/>';
    s += note(L.X(4), L.Y(157) + 18, '窄通道：回撤极浅，只能追', 'var(--d-violet)', 'middle', 10.5);

    /* 右：宽通道——回撤深，两线张开 */
    var R = panel(470);
    var broad = synthBars([112, 122, 132, 128, 118, 130, 142, 134, 122, 136], 4.0);
    s += barsSVG(broad, R.X, R.bw, R.Y);
    s += '<line x1="' + r1(R.X(1)) + '" y1="' + r1(R.Y(117)) + '" x2="' + r1(R.X(9)) + '" y2="' + r1(R.Y(126)) + '" stroke="var(--d-violet)" stroke-width="1.5" opacity=".8"/>';
    s += '<line x1="' + r1(R.X(1)) + '" y1="' + r1(R.Y(127)) + '" x2="' + r1(R.X(9)) + '" y2="' + r1(R.Y(150)) + '" stroke="var(--d-violet)" stroke-width="1.5" stroke-dasharray="6 5" opacity=".55"/>';
    s += note(R.X(4), R.Y(150) + 18, '宽通道：回撤深，当区间做', 'var(--d-violet)', 'middle', 10.5);

    s += note(w / 2, h - 10, '宽度决定用哪套规则：窄通道只能追、止损远；宽通道按边缘反向，止损放宽、仓位减半', 'var(--text-2)', 'middle', 11);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="通道宽度示意图：窄通道回撤浅只能追，宽通道回撤深当区间做">' + s + '</svg>';
  }

  var DIAGRAMS = {
    'wyckoff-schematic': wyckoffSchematic,
    'wyckoff-spring': wyckoffSpringDiagram,
    'wyckoff-sos-lps': wyckoffSosLpsDiagram,
    'wyckoff-utad': wyckoffUtadDiagram,
    'wyckoff-vsa': wyckoffVsaDiagram,
    'wyckoff-cause-effect': wyckoffCauseEffectDiagram,
    'elliott-53': elliott53,
    'trend-up': trendUpDiagram,
    'trend-channel': trendChannelDiagram,
    'trend-reversal': reversalDiagram,
    'candle-anatomy': candleAnatomyDiagram,
    'candle-examples': candleExamplesDiagram,
    'trading-range': tradingRangeDiagram,
    'breakout-types': breakoutTypesDiagram,
    'channel-fates': channelFatesDiagram,
    'opening-breakout': openingBreakoutDiagram,
    'measured-move': measuredMoveDiagram,
    'range-types': rangeTypesDiagram,
    'range-wearing': rangeWearingDiagram,
    'gap-fill': gapFillDiagram,
    'gap-types': gapTypesDiagram,
    'wedge-types': wedgeTypesDiagram,
    'support-resistance': supportResistanceDiagram,
    'reversal-types': reversalTypesDiagram,
    'channel-width': channelWidthDiagram
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
