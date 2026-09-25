/* ==========================================================================
   交易理论图谱 —— 五体系图层交互图定义（window.LAYER_SPEC）
   --------------------------------------------------------------------------
   同一段合成行情（威科夫标准吸筹结构：下跌 → 抛售高潮 → 横盘 → 向下假破 → 突破走强），
   由六个体系各自标注。每个体系是一个可开关的图层，draw 函数只画自己的记号。

   图层：
     levels   关键价位（所有体系的共同参照）
     pa      价格行为（趋势线 / 假突破二次进场）
     wyckoff 威科夫（SC → AR → ST → Spring → SOS → LPS）
     ict     ICT（FVG / OB / SSL 扫荡 / BOS）
     smc     SMC（订单块 / 流动性抓取 / BOS）
     elliott 波浪理论（推动浪 1-5 与调整终点）
   ========================================================================== */

window.LAYER_SPEC = (function () {

  /* 共享的行情数据：一段标准吸筹结构，27 根 K 线 */
  var BASE = [150, 144, 138, 130, 122, 108, 118, 126, 124, 116, 122, 128, 126, 118, 112, 108, 106, 102, 116, 130, 124, 118, 126, 134, 142, 150, 158];
  var N = BASE.length;

  /* 各图层颜色（用字面色，保证开关按钮与图例在深浅主题下都清晰） */
  var C = {
    levels: '#94a3b8',
    pa: '#2563eb',
    wyckoff: '#f59e0b',
    ict: '#06b6d4',
    smc: '#dc2626',
    elliott: '#8b5cf6'
  };

  /* 每个图层的标注绘制函数。g 是 chart.js 的画笔（cx/cy/ring/note/line/rect/arrow…） */
  var LAYERS = {};

  LAYERS.levels = function (g) {
    var cx0 = g.cx(0), cxN = g.cx(N - 1);
    g.line(cx0 - 12, g.cy(126), cxN + 12, g.cy(126), C.levels, 1.4, '6 5', 0.9);
    g.note(cxN + 16, g.cy(126) - 4, '区间上沿 126', C.levels, 'start', 10);
    g.line(cx0 - 12, g.cy(104), cxN + 12, g.cy(104), C.levels, 1.4, '6 5', 0.9);
    g.note(cxN + 16, g.cy(104) + 14, '需求区 ~104', C.levels, 'start', 10);
  };

  LAYERS.pa = function (g) {
    g.line(g.cx(21), g.cy(118), g.cx(N - 1), g.cy(158), C.pa, 1.8, '6 5', 0.9);
    g.ring(g.cx(21), g.cy(118), C.pa, '二次进场', g.cy(118) + 24);
    g.arrow(g.cx(21), 118, g.cx(N - 1), 158, C.pa, 2);
    g.ring(g.cx(17), g.cy(102), C.pa, '假突破反转', g.cy(102) + 24);
  };

  LAYERS.wyckoff = function (g) {
    g.ring(g.cx(5), g.cy(108), C.wyckoff, 'SC', g.cy(108) + 24);
    g.ring(g.cx(7), g.cy(126), C.wyckoff, 'AR', g.cy(126) - 12);
    g.ring(g.cx(16), g.cy(106), C.wyckoff, 'ST', g.cy(106) + 24);
    g.ring(g.cx(17), g.cy(102), C.wyckoff, 'Spring', g.cy(102) - 12);
    g.ring(g.cx(19), g.cy(130), C.wyckoff, 'SOS', g.cy(130) - 12);
    g.ring(g.cx(21), g.cy(118), C.wyckoff, 'LPS', g.cy(118) + 24);
  };

  LAYERS.ict = function (g) {
    var gx0 = g.cx(18) + 14, gx1 = g.cx(19) - 14;
    g.rect(gx0, g.cy(130), gx1 - gx0, g.cy(116) - g.cy(130), C.ict, 0.12, C.ict, '', 1.2);
    g.note((gx0 + gx1) / 2, g.cy(130) - 6, 'FVG', C.ict, 'middle', 9.5);
    var ox0 = g.cx(15) - 10, ox1 = g.cx(17) + 10;
    g.rect(ox0, g.cy(110), ox1 - ox0, g.cy(100) - g.cy(110), C.ict, 0.12, C.ict, '', 1.2);
    g.note((ox0 + ox1) / 2, g.cy(110) - 6, 'OB', C.ict, 'middle', 9.5);
    g.ring(g.cx(17), g.cy(102), C.ict, 'SSL 扫荡', g.cy(102) + 24);
    g.line(g.cx(19) - 10, g.cy(126), g.cx(N - 1) + 10, g.cy(126), C.ict, 1.4, '4 4', 0.9);
    g.note(g.cx(22), g.cy(126) - 8, 'BOS', C.ict, 'middle', 10);
  };

  LAYERS.smc = function (g) {
    var ox0 = g.cx(15) - 10, ox1 = g.cx(17) + 10;
    g.rect(ox0, g.cy(110), ox1 - ox0, g.cy(100) - g.cy(110), C.smc, 0.12, C.smc, '', 1.2);
    g.note((ox0 + ox1) / 2, g.cy(110) - 6, '订单块 OB', C.smc, 'middle', 9.5);
    g.ring(g.cx(17), g.cy(102), C.smc, '流动性抓取', g.cy(102) + 24);
    g.line(g.cx(19) - 10, g.cy(126), g.cx(N - 1) + 10, g.cy(126), C.smc, 1.4, '4 4', 0.9);
    g.note(g.cx(22), g.cy(126) + 16, 'BOS 结构突破', C.smc, 'middle', 10);
  };

  LAYERS.elliott = function (g) {
    var lab = ['1', '2', '3', '4', '5'];
    for (var i = 22; i <= 26; i++) {
      g.note(g.cx(i), g.cy(BASE[i]) + ((i - 22) % 2 ? 22 : -22), lab[i - 22], C.elliott, 'middle', 10.5, 700);
    }
    g.note(g.cx(17), g.cy(102) - 26, '调整浪终点', C.elliott, 'middle', 9.5);
  };

  function buildSpec(active) {
    return {
      key: 'layer-chart',
      dw: 900, dh: 392, x0: 48, barW: 28,
      pTop: 70, pBot: 258, pMin: 80, pMax: 168, amp: 1.8,
      volTop: 292, volBottom: 360, volColor: '#f59e0b', volAlpha: 0.5,
      closes: BASE,
      aria: '五体系图层交互图：同一段行情的六个体系标注',
      draw: function (g) {
        active.forEach(function (id) { if (LAYERS[id]) LAYERS[id](g); });
      }
    };
  }

  return {
    title: '五体系图层图',
    subtitle: '同一段行情，五个体系各自怎么标注。切换图层对照看，会看到它们指向同一个位置。',
    initial: ['levels', 'wyckoff'],
    layers: [
      { id: 'levels', name: '关键价位', color: C.levels },
      { id: 'pa', name: '价格行为', color: C.pa },
      { id: 'wyckoff', name: '威科夫', color: C.wyckoff },
      { id: 'ict', name: 'ICT', color: C.ict },
      { id: 'smc', name: 'SMC', color: C.smc },
      { id: 'elliott', name: '波浪理论', color: C.elliott }
    ],
    notes: {
      levels: '横向的关键支撑与阻力位，是所有体系的共同参照。',
      pa: '趋势线、更高低点、假突破后的二次进场。',
      wyckoff: 'SC → AR → ST → Spring → SOS → LPS 的事件序列。',
      ict: 'FVG、Order Block、SSL 扫荡、BOS 结构突破。',
      smc: '订单块、流动性抓取、BOS 结构突破。',
      elliott: '推动浪 1-5 与调整浪终点的标注。'
    },
    spec: function (active) { return buildSpec(active); }
  };
})();
