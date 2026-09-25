/* ==========================================================================
   交易理论图谱 —— 图表模块（TradingView Lightweight Charts 版）
   --------------------------------------------------------------------------
   1) 五体系图层交互图：同一段行情，六个体系各自的标注，可自由开关
   2) 教学示意图：K 线 + 成交量 + 语义标注

   渲染分两层：
     · 底层  lightweight-charts —— 真正的 K 线、成交量、价格轴、十字光标、缩放平移
     · 上层  overlay canvas     —— 我们的标注（区域框 / 引线 / 价位线 / 波浪腿 / 圆点）

   坐标系统一用「设计坐标」：每张图有设计基准 dw×dh（沿用原来 SVG 的 viewBox），
   标注代码全部按设计坐标书写，overlay 用 setTransform 做整体缩放。
   于是不同容器宽度下标注与 K 线始终贴合，标注代码也不必关心实际像素。

   依赖：assets/vendor/lightweight-charts.standalone.production.js
   ========================================================================== */

window.ChartModule = (function () {

  var LWC = window.LightweightCharts;

  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", ' +
    '"Hiragino Sans GB", "Microsoft YaHei", Roboto, sans-serif';

  /* ------------------------------------------------------------------
     0. 环境探测
     ------------------------------------------------------------------ */

  function canCanvas() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext && c.getContext('2d'));
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------
     1. 调色板：CSS 变量 → 真实色值
     canvas 不认 var(--x)，主题切换时要重新取一次。
     ------------------------------------------------------------------ */

  var PAL = null;

  var PAL_KEYS = [
    'up', 'down', 'surface', 'surface-2', 'surface-3', 'border', 'border-2',
    'text', 'text-2', 'text-3',
    'd-blue', 'd-violet', 'd-cyan', 'd-amber', 'd-amber-strong', 'd-pink', 'd-neutral'
  ];

  function palette(force) {
    if (PAL && !force) return PAL;
    var out = {};
    var cs = null;
    try { cs = window.getComputedStyle(document.documentElement); } catch (e) { cs = null; }
    PAL_KEYS.forEach(function (k) {
      var v = cs ? cs.getPropertyValue('--' + k) : '';
      out[k] = (v && v.trim()) || '#888888';
    });
    PAL = out;
    return out;
  }

  /* 'var(--up)' → '#d92d20'；其余原样返回 */
  function col(v, P) {
    var m = /^var\((--[A-Za-z0-9-]+)\)$/.exec(String(v).trim());
    if (!m) return v;
    var k = m[1].slice(2);
    return P[k] || palette()[k] || '#888888';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ------------------------------------------------------------------
     2. 合成 K 线
     由收盘价序列推出 OHLC，幅度用固定三角函数，保证每次渲染一致。
     ------------------------------------------------------------------ */

  function synthBars(closes, amp) {
    var A = (amp == null) ? 0.9 : amp;
    var out = [];
    for (var i = 0; i < closes.length; i++) {
      var c = closes[i];
      var o = (i === 0) ? c : closes[i - 1];
      out.push({
        o: o,
        c: c,
        h: Math.max(o, c) + A * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7))),
        l: Math.min(o, c) - A * (0.45 + 0.55 * Math.abs(Math.cos(i * 1.3)))
      });
    }
    return out;
  }

  /* 未显式给成交量时，按「实体大小」推一个 0..1 的相对量 */
  function autoVolume(bars) {
    var mx = 0;
    bars.forEach(function (b) { mx = Math.max(mx, Math.abs(b.c - b.o)); });
    return bars.map(function (b, i) {
      var base = mx ? Math.abs(b.c - b.o) / mx : 0.4;
      return Math.min(1, 0.22 + 0.66 * base + 0.12 * Math.abs(Math.sin(i * 2.3)));
    });
  }

  /* 固定时间基准：2025-01-01 UTC，保证每次渲染的 time 一致 */
  var T0 = 1735689600;

  /* #rrggbb / rgb() → rgba()，用于给成交量柱加透明度 */
  function withAlpha(color, a) {
    var c = String(color).trim();
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) {
      var n = parseInt(m[1], 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    if (/^rgba?\(/.test(c)) return c.replace(/rgba?\(([^)]+)\)/, function (_, x) {
      var p = x.split(',').map(function (s) { return s.trim(); });
      return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')';
    });
    return c;
  }

  /* ------------------------------------------------------------------
     3. 叠层画笔：设计坐标 + 与旧 SVG 原语同名的绘制函数
     迁移时只需把 X(i)→g.cx(i)、Y(p)→g.cy(p)、原语前加 g.
     ------------------------------------------------------------------ */

  function makeBrush(ctx, spec, chart, series) {
    var P = palette();
    var g = {
      k: 1,
      dw: spec.dw, dh: spec.dh,
      W: spec.dw, H: spec.dh,
      /* 绘图区（价格轴左边）在设计坐标下的右边界。右侧对齐的标签用它，别压到价格轴上 */
      right: spec.dw,
      paneW: spec.dw,
      P: P
    };

    function dashArr(d) {
      if (!d) return null;
      if (typeof d === 'string') {
        var n = d.split(/[\s,]+/).map(Number).filter(function (x) { return !isNaN(x); });
        return n.length ? n : null;
      }
      return d;
    }

    function stroke(color, lw, dash, opacity) {
      ctx.setLineDash(dashArr(dash) || []);
      ctx.strokeStyle = col(color, P);
      ctx.lineWidth = (lw == null) ? 1.6 : lw;
      ctx.globalAlpha = (opacity == null) ? 1 : opacity;
      ctx.lineCap = 'round';
    }

    function reset() {
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* --- 坐标：数据 → 设计像素 --- */
    g.cx = function (i) {
      var x = chart.timeScale().logicalToCoordinate(i);
      return (x == null) ? -100000 : x / g.k;
    };
    g.cy = function (p) {
      var y = series.priceToCoordinate(p);
      return (y == null) ? -100000 : y / g.k;
    };
    /* 成交量面板内的 Y（v 为 0..1 的相对量） */
    g.vy = function (v) {
      var top = spec.volTop, bot = spec.volBottom;
      return bot - v * (bot - top);
    };

    /* --- 原语 --- */

    /* 文字。y 为基线，与 SVG <text> 一致 */
    g.t = function (x, y, str, color, anchor, size, weight) {
      reset();
      ctx.font = (weight || 500) + ' ' + (size || 10.5) + 'px ' + FONT;
      ctx.fillStyle = col(color, P);
      ctx.textAlign = anchor === 'end' ? 'right' : (anchor === 'start' ? 'left' : 'center');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(str, x, y);
    };

    /* 带描边的文字，压在 K 线上也读得清 */
    g.tHalo = function (x, y, str, color, anchor, size, weight) {
      reset();
      ctx.font = (weight || 600) + ' ' + (size || 10.5) + 'px ' + FONT;
      ctx.textAlign = anchor === 'end' ? 'right' : (anchor === 'start' ? 'left' : 'center');
      ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = col('var(--surface)', P);
      ctx.lineJoin = 'round';
      ctx.strokeText(str, x, y);
      ctx.fillStyle = col(color, P);
      ctx.fillText(str, x, y);
    };

    g.line = function (x1, y1, x2, y2, color, lw, dash, opacity) {
      stroke(color, lw, dash, opacity);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      reset();
    };

    g.rect = function (x, y, w, h, fill, fillOpacity, strokeColor, dash, lw) {
      if (fill) {
        reset();
        ctx.globalAlpha = (fillOpacity == null) ? 0.16 : fillOpacity;
        ctx.fillStyle = col(fill, P);
        ctx.fillRect(x, y, w, h);
      }
      if (strokeColor) {
        stroke(strokeColor, lw || 1.3, dash, 1);
        ctx.strokeRect(x, y, w, h);
      }
      reset();
    };

    g.circle = function (x, y, r, fill, strokeColor, lw) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      reset();
      if (fill) { ctx.fillStyle = col(fill, P); ctx.fill(); }
      if (strokeColor) {
        ctx.strokeStyle = col(strokeColor, P);
        ctx.lineWidth = lw || 1.6;
        ctx.stroke();
      }
    };

    g.poly = function (pts, color, lw, fill, dash, opacity) {
      if (!pts || !pts.length) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (fill) {
        reset();
        ctx.globalAlpha = (opacity == null) ? 1 : opacity;
        ctx.fillStyle = col(fill, P);
        ctx.fill();
      }
      stroke(color, lw, dash, opacity);
      ctx.stroke();
      reset();
    };

    /* 水平价位线 + 右侧留白区标签（dy 用于同价位错开，避免叠字） */
    g.hline = function (price, i1, i2, color, label, dash, dy) {
      var y = g.cy(price);
      g.line(g.cx(i1), y, g.cx(i2), y, color, 1.6, dash, 0.85);
      if (label) g.t(g.right - 8, y + 3.4 + (dy || 0), label, color, 'end', 10.5, 660);
    };

    /* 虚线（旧 dashLine 的替身，参数即像素） */
    g.dash = function (x1, y1, x2, y2, color) {
      g.line(x1, y1, x2, y2, color, 1.3, '6 5', 0.9);
    };

    /* 矩形区域（数据坐标） */
    g.zone = function (i1, i2, pTop, pBot, color, opacity, dash) {
      var x = g.cx(i1 - 0.5), w = g.cx(i2 + 0.5) - x;
      var y = g.cy(pTop), h = g.cy(pBot) - y;
      g.rect(x, y, w, h, color, (opacity == null) ? 0.14 : opacity, color, dash, 1.3);
    };

    /* 空心圆点 + 下方标签（旧 ringDot） */
    g.ring = function (x, y, color, label, ly) {
      g.circle(x, y, 4, 'var(--surface)', color, 1.8);
      if (label) g.t(x, ly, label, color, 'middle', 10.5, 700);
    };

    /* 说明文字（旧 note） */
    g.note = function (x, y, str, color, anchor, size) {
      g.t(x, y, str, color, anchor || 'middle', size || 11, 600);
    };

    /* 带引线的标注（数据坐标）。dir='down' 表示标注放在点下方 */
    g.pin = function (bar, price, color, label, dir, sub, dy) {
      var px = g.cx(bar), py = g.cy(price);
      var off = (dir === 'down') ? 1 : -1;
      var base = py + off * (sub ? 44 : 31) + (dy || 0);
      var bend = py + off * 17;

      g.line(px, py, px, bend, color, 1.6, null, 0.7);
      g.circle(px, py, 3.4, color, 'var(--surface)', 1.4);

      var tx = px, anchor = 'middle';
      if (tx < 56) { tx = 56; anchor = 'start'; }
      if (tx > g.right - 62) { tx = g.right - 62; anchor = 'end'; }

      if (sub) {
        g.t(tx, base, label, color, anchor, 10.8, 700);
        g.t(tx, base + 11.5, sub, color, anchor, 9.4, 500);
      } else {
        g.t(tx, base, label, color, anchor, 10.8, 700);
      }
    };

    /* 双向箭头（波浪腿 / 测量移动） */
    g.leg = function (i1, p1, i2, p2, color, label, labelSide) {
      var x1 = g.cx(i1), y1 = g.cy(p1), x2 = g.cx(i2), y2 = g.cy(p2);
      g.line(x1, y1, x2, y2, color, 2, null, 0.9);

      [[x1, y1, x2, y2], [x2, y2, x1, y1]].forEach(function (a) {
        var ang = Math.atan2(a[3] - a[1], a[2] - a[0]);
        var L = 7;
        g.poly([
          [a[0] + Math.cos(ang) * L, a[1] + Math.sin(ang) * L],
          [a[0], a[1]],
          [a[0] + Math.cos(ang + 2.4) * L, a[1] + Math.sin(ang + 2.4) * L]
        ], color, 2, null, null, 0.9);
      });

      if (label) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        g.t(mx, my + (labelSide === 'below' ? 15 : -7), label, color, 'middle', 11, 720);
      }
    };

    /* 单向箭头（p1 → p2，数据坐标） */
    g.arrow = function (i1, p1, i2, p2, color, lw) {
      var x1 = g.cx(i1), y1 = g.cy(p1), x2 = g.cx(i2), y2 = g.cy(p2);
      g.line(x1, y1, x2, y2, color, lw || 1.8, null, 0.9);
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var L = 8;
      g.poly([
        [x2 - Math.cos(ang - 0.42) * L, y2 - Math.sin(ang - 0.42) * L],
        [x2, y2],
        [x2 - Math.cos(ang + 0.42) * L, y2 - Math.sin(ang + 0.42) * L]
      ], color, lw || 1.8, null, null, 0.9);
    };

    g.reset = reset;
    g.ctx = ctx;
    g.chart = chart;
    g.series = series;
    return g;
  }

  /* ------------------------------------------------------------------
     4. 图表实例
     ------------------------------------------------------------------ */

  var tracked = [];

  var THEME_OBS = null;

  function watchTheme() {
    if (THEME_OBS || !window.MutationObserver) return;
    THEME_OBS = new MutationObserver(function () {
      PAL = null;
      tracked.forEach(function (inst) {
        try { inst.retheme(); } catch (e) { /* 忽略单张图失败 */ }
      });
    });
    THEME_OBS.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme', 'class', 'style']
    });
  }

  function createInstance(host, spec) {
    var P = palette();

    if (!LWC || !LWC.createChart) throw new Error('lightweight-charts 未加载');

    var dw = spec.dw, dh = spec.dh;

    var W = Math.max(240, Math.round(host.clientWidth || dw));
    var H = Math.round(dh * W / dw);
    var k = W / dw;

    host.style.height = H + 'px';

    var cdiv = document.createElement('div');
    cdiv.className = 'lwc-chart';
    var over = document.createElement('canvas');
    over.className = 'lwc-overlay';
    host.appendChild(cdiv);
    host.appendChild(over);

    /* --- 数据 --- */
    var bars = synthBars(spec.closes, spec.amp);
    var vols = spec.vol || autoVolume(bars);

    /* 成交量柱色：给了 volColor 就统一用它（威科夫图习惯用琥珀色），否则跟着涨跌 */
    function volColorOf(b) {
      if (spec.volColor) return withAlpha(col(spec.volColor, P), (spec.volAlpha == null) ? 0.55 : spec.volAlpha);
      return col((b.c >= b.o) ? 'var(--up)' : 'var(--down)', P);
    }

    var candleData = [], volData = [];
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i], t = T0 + i * 86400;
      candleData.push({ time: t, open: b.o, high: b.h, low: b.l, close: b.c });
      if (spec.volTop != null) {
        volData.push({ time: t, value: vols[i], color: volColorOf(b) });
      }
    }

    /* --- 价格轴留白：把数据范围锁在 pMin..pMax，并映射到 pTop..pBot 这一段 --- */
    var hasVol = (spec.volTop != null);
    var margins = {
      top: spec.pTop / dh,
      bottom: (dh - spec.pBot) / dh
    };

    var chart = LWC.createChart(cdiv, {
      width: W,
      height: H,
      autoSize: false,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: P['text-3'],
        fontSize: 10,
        fontFamily: FONT
      },
      grid: {
        vertLines: { color: P.border, style: 1 },
        horzLines: { color: P.border, style: 1 }
      },
      rightPriceScale: {
        borderColor: P.border,
        scaleMargins: margins,
        entireTextOnly: true
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        rightOffset: 0
      },
      crosshair: {
        mode: LWC.CrosshairMode ? LWC.CrosshairMode.Normal : 0,
        vertLine: { color: P['text-3'], width: 1, style: 3, labelVisible: false },
        horzLine: {
          color: P['text-3'], width: 1, style: 3,
          labelVisible: true, labelBackgroundColor: P['text-3']
        }
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: false },
        mouseWheel: true,
        pinch: false,
        axisDoubleClickReset: true
      },
      handleScroll: {
        pressedMouseMove: true,
        mouseWheel: true,
        vertTouchDrag: false,
        horzTouchDrag: true
      },
      localization: {
        priceFormatter: function (p) { return String(Math.round(p)); }
      }
    });

    var series = chart.addCandlestickSeries({
      upColor: P.up,
      downColor: P.down,
      borderUpColor: P.up,
      borderDownColor: P.down,
      wickUpColor: P.up,
      wickDownColor: P.down,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
      autoscaleInfoProvider: function () {
        return { priceRange: { minValue: spec.pMin, maxValue: spec.pMax } };
      }
    });
    series.setData(candleData);

    var volSeries = null;
    if (hasVol) {
      volSeries = chart.addHistogramSeries({
        priceScaleId: '',
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: { type: 'volume' }
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: {
          top: spec.volTop / dh,
          bottom: (dh - spec.volBottom) / dh
        }
      });
      volSeries.setData(volData);
    }

    /* --- 可见区间：让设计坐标 (x0, barW) 与实际像素严格对应 ---
       LWC 的坐标关系是  x(i) = (i - from + 0.5) * barSpacing，
       且 setVisibleLogicalRange 会按 paneW/(to-from) 反推 barSpacing。
       所以只要把 to-from 设成 paneW/(barW*k)，barSpacing 就等于 barW*k，
       再由 from = 0.5 - x0/barW 把第 0 根钉在 x0 —— 设计坐标可精确复现。
       价格轴会占掉右侧一条，每次尺寸变化都要重算。 */
    function axisWidth() {
      var w = 0;
      try { w = chart.priceScale('right').width() || 0; } catch (e) { w = 0; }
      return w;
    }

    /* 可见区间：让设计坐标 (x0, barW) 与实际像素严格对应。
       关键：g.cx(i) = logicalToCoordinate(i) / k，所以底层只要保证
         logicalToCoordinate(i) = (i*spec.barW + spec.x0) * k
       即可让标注（设计坐标）与 K 线完全贴合。
       LWC 的坐标关系是  x(i) = (i - from + 0.5) * barSpacing，
       且 barSpacing = 实际绘图宽 / (to - from)。
       先给一个解析初值，再在布局完成后做一次「实测校准」——
       直接量出图表真实的绘图宽（比假设 W - axisWidth() 更准），
       据此把 from / span 钉到目标值，一步到位、与价格轴宽度无关。 */
    function applyRange() {
      var paneW = Math.max(1, W - axisWidth());
      var from = 0.5 - (spec.half || 0) - spec.x0 / spec.barW;
      chart.timeScale().setVisibleLogicalRange({ from: from, to: from + paneW / (spec.barW * k) });
    }

    /* 实测校准：量出当前 logical→pixel 的真实映射，反推精确区间。
       g.cx 会除以 k，故目标是 logicalToCoordinate(0) = x0*k、step = barW*k。
       因为真实绘图宽 paneW = (to-from)*stepA（直接量，不假设 axisWidth），
       用 newFrom = 0.5 - x0/barW（纯 logical，k 抵消）、
       newSpan = paneW/(barW*k)，可一步得到 x(i) = (i*barW + x0)*k。 */
    function calibrate(pass) {
      pass = pass || 0;
      var st = chart.timeScale();
      var x0a = st.logicalToCoordinate(0);
      var x1a = st.logicalToCoordinate(1);
      if (x0a == null || x1a == null) {
        if (pass < 12 && window.requestAnimationFrame) { window.requestAnimationFrame(function () { calibrate(pass + 1); }); }
        return;
      }
      var stepA = x1a - x0a;
      if (Math.abs(stepA) < 0.5) return;
      var vr = st.getVisibleLogicalRange();
      if (!vr) return;
      /* 直接量出图表真实绘图宽（比假设 W - axisWidth() 更准） */
      var paneW = (vr.to - vr.from) * stepA;
      var targetStep = spec.barW * k;
      var newFrom = 0.5 - (spec.half || 0) - spec.x0 / spec.barW;
      var newSpan = paneW / targetStep;
      if (Math.abs(vr.from - newFrom) < 1e-3 && Math.abs((vr.to - vr.from) - newSpan) < 1e-3) return;
      st.setVisibleLogicalRange({ from: newFrom, to: newFrom + newSpan });
      /* 等图表应用新区间后，用更准的 paneW 再精修一轮（最多 2 轮） */
      if (pass < 2 && window.requestAnimationFrame) window.requestAnimationFrame(function () { calibrate(pass + 1); });
    }
    function scheduleCalibrate() {
      if (window.requestAnimationFrame) window.requestAnimationFrame(function () { calibrate(0); });
    }

    applyRange();
    scheduleCalibrate();

    /* --- overlay --- */
    var ctx = null;
    var brush = null;

    function sizeOverlay() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      over.style.width = W + 'px';
      over.style.height = H + 'px';
      over.width = Math.max(1, Math.round(W * dpr));
      over.height = Math.max(1, Math.round(H * dpr));
      ctx = over.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);   /* 之后一切按设计坐标画 */
      brush = makeBrush(ctx, spec, chart, series);
      brush.k = k;
    }

    var rafId = 0;

    function paint() {
      rafId = 0;
      if (!ctx) return;
      ctx.clearRect(0, 0, dw, dh);
      if (!brush) return;

      /* 价格轴会占掉右侧一条，标注要用绘图区的右边界而不是画布右边界 */
      var paneW = Math.max(1, W - axisWidth());
      brush.paneW = paneW;
      brush.right = paneW / k;

      if (!spec.draw) return;
      try {
        spec.draw(brush);
      } catch (e) {
        if (window.console && console.warn) console.warn('[diagram:' + (spec.key || '?') + ']', e);
      }
    }

    function redraw() {
      if (rafId) return;
      rafId = window.requestAnimationFrame ? window.requestAnimationFrame(paint) : (paint(), 0);
    }

    sizeOverlay();
    paint();

    /* 时间轴变化（缩放 / 平移 / 双击复位）→ 标注跟着重画 */
    chart.timeScale().subscribeVisibleLogicalRangeChange(redraw);

    /* 兜底：滚轮与拖拽也触发一次（价格轴被锁死，一般不会变，但保险） */
    function onWheel() { redraw(); }
    cdiv.addEventListener('wheel', onWheel, { passive: true });

    /* --- 尺寸联动 --- */
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        var w = Math.max(240, Math.round(host.clientWidth || dw));
        if (Math.abs(w - W) < 1) return;   /* 只对宽度变化响应，避免高度回写死循环 */
        W = w;
        H = Math.round(dh * W / dw);
        k = W / dw;
        host.style.height = H + 'px';
        chart.resize(W, H);
        applyRange();
        scheduleCalibrate();
        sizeOverlay();
        paint();
      });
      ro.observe(host);
    }

    var inst = {
      chart: chart,
      series: series,
      host: host,
      spec: spec,
      redraw: redraw,
      repaint: paint,
      reset: function () { applyRange(); paint(); },
      retheme: function () {
        var Q = palette(true);
        chart.applyOptions({
          layout: { textColor: Q['text-3'] },
          grid: { vertLines: { color: Q.border }, horzLines: { color: Q.border } },
          rightPriceScale: { borderColor: Q.border },
          crosshair: {
            vertLine: { color: Q['text-3'] },
            horzLine: { color: Q['text-3'], labelBackgroundColor: Q['text-3'] }
          }
        });
        series.applyOptions({
          upColor: Q.up, downColor: Q.down,
          borderUpColor: Q.up, borderDownColor: Q.down,
          wickUpColor: Q.up, wickDownColor: Q.down
        });
        if (volSeries) {
          var Qb = Q;
          var vd = volData.map(function (d, n) {
            return { time: d.time, value: d.value, color: spec.volColor ? volColorOf(bars[n]) : ((bars[n].c >= bars[n].o) ? Qb.up : Qb.down) };
          });
          volSeries.setData(vd);
        }
        if (brush) brush.P = Q;
        paint();
      },
      destroy: function () {
        try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(redraw); } catch (e) {}
        if (ro) ro.disconnect();
        cdiv.removeEventListener('wheel', onWheel);
        try { chart.remove(); } catch (e) {}
        if (rafId && window.cancelAnimationFrame) window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    return inst;
  }

  function destroyAll() {
    tracked.forEach(function (inst) {
      try { inst.destroy(); } catch (e) {}
    });
    tracked = [];
  }

  /* ------------------------------------------------------------------
     5. 挂载：教学示意图
     ------------------------------------------------------------------ */

  var NO_CANVAS_MSG = '<p class="diagram-fallback">此图由 canvas 绘制，请在支持 canvas 的浏览器中查看。</p>';

  function mountDiagrams(root) {
    var nodes = root.querySelectorAll('.diagram[data-diagram]');
    var specs = window.DIAGRAM_SPECS || {};

    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute('data-diagram');
      var spec = specs[key];

      if (!spec) {
        el.innerHTML = '<p class="diagram-fallback">缺少图表定义：' + esc(key) + '</p>';
        return;
      }
      if (!canCanvas()) {
        el.innerHTML = NO_CANVAS_MSG;
        return;
      }

      var host = document.createElement('div');
      host.className = 'lwc-host';
      el.innerHTML = '<div class="chart-widget"><div class="cw-stage"></div></div>';
      el.querySelector('.cw-stage').appendChild(host);

      try {
        tracked.push(createInstance(host, spec));
      } catch (e) {
        el.innerHTML = '<p class="diagram-fallback">图表渲染失败：' + esc(e.message) + '</p>';
      }
    });
  }

  /* ------------------------------------------------------------------
     6. 挂载：五体系图层交互图
     ------------------------------------------------------------------ */

  function mountInteractive(root) {
    var mount = root.querySelector('#chartMount');
    var CFG = window.LAYER_SPEC;
    if (!mount || !CFG) return;

    var active = CFG.initial.slice();

    mount.innerHTML =
      '<div class="chart-widget">' +
        '<div class="cw-head">' +
          '<h3>' + esc(CFG.title) + '</h3>' +
          '<p>' + esc(CFG.subtitle) + '</p>' +
        '</div>' +
        '<div class="cw-layers" role="group" aria-label="图层开关"></div>' +
        '<div class="cw-stage"></div>' +
        '<div class="cw-legend"></div>' +
      '</div>';

    var layerBar = mount.querySelector('.cw-layers');
    var stage = mount.querySelector('.cw-stage');
    var legend = mount.querySelector('.cw-legend');

    var host = document.createElement('div');
    host.className = 'lwc-host';
    stage.appendChild(host);

    var inst = null;
    if (canCanvas()) {
      var spec = CFG.spec(active);
      try { inst = createInstance(host, spec); } catch (e) { stage.innerHTML = '<p class="diagram-fallback">图表渲染失败：' + esc(e.message) + '</p>'; }
      if (inst) tracked.push(inst);
    } else {
      stage.innerHTML = NO_CANVAS_MSG;
    }

    function buildLegend() {
      if (!active.length) {
        return '<p style="color:var(--text-3);margin:0">所有图层已关闭。点上面的按钮打开任意一个体系开始对照。</p>';
      }
      return active.map(function (id) {
        var L = null;
        CFG.layers.forEach(function (x) { if (x.id === id) L = x; });
        if (!L) return '';
        return '<div class="lg-row"><span class="lg-swatch" style="background:' + L.color + '"></span>' +
          '<span><b style="color:var(--text)">' + esc(L.name) + '</b> — ' + esc(CFG.notes[id] || '') + '</span></div>';
      }).join('');
    }

    CFG.layers.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'layer-btn';
      b.style.setProperty('--lc', L.color);
      b.setAttribute('data-l', L.id);
      b.innerHTML = '<span class="swatch"></span>' + esc(L.name);
      b.addEventListener('click', function () {
        var idx = active.indexOf(L.id);
        if (idx === -1) { active.push(L.id); } else { active.splice(idx, 1); }
        render();
      });
      layerBar.appendChild(b);
    });

    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'layer-btn layer-all';
    allBtn.setAttribute('data-all', '1');
    layerBar.appendChild(allBtn);
    allBtn.addEventListener('click', function () {
      active = (active.length === CFG.layers.length) ? [] : CFG.layers.map(function (x) { return x.id; });
      render();
    });

    function render() {
      if (inst) {
        inst.spec.draw = CFG.spec(active).draw;
        inst.repaint();
      }
      legend.innerHTML = buildLegend();
      Array.prototype.forEach.call(layerBar.querySelectorAll('.layer-btn[data-l]'), function (btn) {
        btn.setAttribute('aria-pressed', active.indexOf(btn.getAttribute('data-l')) !== -1 ? 'true' : 'false');
      });
      allBtn.textContent = (active.length === CFG.layers.length) ? '全部关闭' : '全部打开';
    }

    render();
  }

  watchTheme();

  return {
    mountDiagrams: mountDiagrams,
    mountInteractive: mountInteractive,
    destroyAll: destroyAll,
    canCanvas: canCanvas,
    /* 供测试与调试取当前图表实例 */
    instances: function () { return tracked.slice(); }
  };
})();
