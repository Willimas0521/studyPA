/* 交互图表实验室：把站点示意图搬到 Vela（LuxAlgo）交互图表引擎上。
   页面里放 <div class="vela-lab" data-vela="key"></div>，本模块负责：
   ① 懒加载 assets/vendor/vela.global.min.js（只在出现 .vela-lab 的页面加载，约 1MB）；
   ② 用与 assets/chart.js 完全相同的规则由 closes 合成 OHLCV；
   ③ 按 LABS[key].drawings 数据驱动地添加标注（hline/hray/arrow/box/note/trendline/position）；
   ④ 跟随站点明暗主题；加载失败时降级为提示文案（指向对应静态示意图）。
   注意（实测结论）：
   - 全局构造是 new window.Vela.Vela(...)；
   - note 的文本是对象 text:{value:'...'}；
   - 成交量 overlay 占价格窗格底部约 25%，note 锚定价格要避开；
   - jsdom 不支持（getContext 未实现），所以本模块只做运行时挂载，三件套不受影响。 */
(function () {
  'use strict';

  var BUNDLE = 'assets/vendor/vela.global.min.js';
  var bundlePromise = null;
  var built = {};          /* data-vela key -> chart 实例 */
  var pending = {};        /* key -> [container] */

  /* 与 chart.js synthBars 同规则：open=前收，h/l 用固定三角函数，保证每次渲染一致 */
  function synthBars(closes, amp) {
    var A = (amp == null) ? 0.9 : amp;
    return closes.map(function (c, i) {
      var o = (i === 0) ? c : closes[i - 1];
      return {
        open: o, close: c,
        high: Math.max(o, c) + A * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7))),
        low: Math.min(o, c) - A * (0.45 + 0.55 * Math.abs(Math.cos(i * 1.3)))
      };
    });
  }

  /* 与 chart.js autoVolume 同规则：按实体大小归一 */
  function attachVolume(bars) {
    var mx = 0;
    bars.forEach(function (b) { mx = Math.max(mx, Math.abs(b.close - b.open)); });
    bars.forEach(function (b, i) {
      var base = mx ? Math.abs(b.close - b.open) / mx : 0.4;
      b.volume = Math.round((0.22 + 0.66 * base + 0.12 * Math.abs(Math.sin(i * 2.3))) * 10000);
    });
    return bars;
  }

  function ensureBundle() {
    if (bundlePromise) return bundlePromise;
    bundlePromise = new Promise(function (resolve, reject) {
      if (window.Vela && window.Vela.Vela) { resolve(); return; }
      var s = document.createElement('script');
      s.src = BUNDLE;
      s.onload = function () { (window.Vela && window.Vela.Vela) ? resolve() : reject(new Error('Vela 全局未注册')); };
      s.onerror = function () { reject(new Error('Vela bundle 加载失败')); };
      document.head.appendChild(s);
    });
    return bundlePromise;
  }

  function siteTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function placeholder(el, text) {
    el.innerHTML = '<p class="vela-lab-ph">' + text + '</p>';
  }

  /* anchors 里允许用 bar 索引（解析成 bar 的 time），也允许直接给 time */
  function resolveAnchors(anchors, bars) {
    return anchors.map(function (a) {
      var out = {};
      if (a.bar != null) out.time = bars[a.bar].time; else if (a.time != null) out.time = a.time;
      if (a.price != null) out.price = a.price;
      return out;
    });
  }

  function build(container, key) {
    var spec = LABS[key];
    if (!spec) { placeholder(container, '未知的图表：' + key); return; }
    var bars = attachVolume(synthBars(spec.closes, spec.amp));
    var t0 = 1735689600000; /* 2025-01-01 UTC，固定基准 */
    bars.forEach(function (b, i) { b.time = t0 + i * 3600000; });

    var chart;
    try {
      chart = new window.Vela.Vela(container, {
        data: bars,
        timeframe: '60',
        theme: siteTheme()
      });
    } catch (e) {
      placeholder(container, '交互图表初始化失败：' + (e && e.message ? e.message : e) +
        '。静态版示意图见「威科夫 → 实战操作模板」。');
      return;
    }

    chart.ready().then(function () {
      (spec.drawings || []).forEach(function (d) {
        try {
          chart.drawings.add(d.type, {
            anchors: resolveAnchors(d.anchors, bars),
            text: d.text,
            options: d.options,
            style: d.style
          });
        } catch (e) { /* 单个标注失败不影响其它标注 */ }
      });
      built[key] = chart;
      var rest = pending[key];
      if (rest) { rest.forEach(function (c) { if (c !== container) build(c, key); }); delete pending[key]; }
    }).catch(function () {
      placeholder(container, '交互图表渲染失败。静态版示意图见「威科夫 → 实战操作模板」。');
    });
  }

  function mount(root) {
    var nodes = (root || document).querySelectorAll('.vela-lab[data-vela]');
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute('data-vela');
      if (built[key]) {
        /* 同一张图在页面上出现两次（如整页 + 章节页）：复用已构建的 chart 不可行（DOM 唯一），直接重建 */
        build(el, key);
        return;
      }
      if (pending[key]) { pending[key].push(el); return; }
      pending[key] = [el];
      ensureBundle().then(function () { build(el, key); }).catch(function (e) {
        placeholder(el, '交互图表需要支持 WebGL2 / Canvas2D 的浏览器（' + e.message +
          '）。静态版示意图见「威科夫 → 实战操作模板」。');
        delete pending[key];
      });
    });
  }

  /* 主题跟随：站点明暗切换时同步 Vela */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      var t = siteTheme();
      Object.keys(built).forEach(function (k) {
        try { if (built[k] && typeof built[k].setTheme === 'function') built[k].setTheme(t); } catch (e) { /* 忽略 */ }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ------------------------------------------------------------------
     图表规格：closes 与 assets/diagrams.js 对应图完全一致，
     drawings 为数据驱动的标注（anchors 用 bar 索引 + price）。
     颜色约定与站点一致：涨=红(#d92d20) 跌=绿(#22c55e)，事件标注=琥珀(#f59e0b)，区间线=灰(#94a3b8)。
     note 锚定价格须避开底部约 25% 的成交量 overlay 区域。
     ------------------------------------------------------------------ */
  var LABS = {
    'wyckoff-trade-spring': {
      closes: [110, 104, 106, 102, 105, 101, 104, 100, 96, 103, 106, 104, 106, 111, 116, 121, 126, 123, 129, 135],
      amp: 1.6,
      drawings: [
        { type: 'hline', anchors: [{ price: 110 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'hline', anchors: [{ price: 100 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'hray', anchors: [{ bar: 8, price: 95 }], style: { lineColor: '#22c55e', lineWidth: 1.8, dash: [4, 4] } },
        { type: 'hray', anchors: [{ bar: 10, price: 120 }], style: { lineColor: '#d92d20', lineWidth: 1.8, dash: [4, 4] } },
        { type: 'arrow', anchors: [{ bar: 12, price: 106 }, { bar: 19, price: 135 }], style: { lineColor: '#d92d20', lineWidth: 2 } },
        { type: 'note', anchors: [{ bar: 8, price: 101.5 }], text: { value: 'Spring 假跌破' }, style: { color: '#f59e0b', fillColor: 'rgba(245,158,11,0.12)' } },
        { type: 'note', anchors: [{ bar: 11, price: 104 }], text: { value: 'Test 缩量回踩' }, style: { color: '#f59e0b', fillColor: 'rgba(245,158,11,0.12)' } },
        { type: 'note', anchors: [{ bar: 14, price: 111 }], text: { value: 'SOS' }, style: { color: '#d92d20', fillColor: 'rgba(217,45,32,0.12)' } },
        { type: 'note', anchors: [{ bar: 17, price: 123 }], text: { value: 'LPS 可加' }, style: { color: '#d92d20', fillColor: 'rgba(217,45,32,0.12)' } },
        { type: 'position', anchors: [{ bar: 10, price: 104 }, { bar: 19, price: 120 }], options: { direction: 'long', entryPrice: 104, stopLoss: 95, takeProfit: 120 } }
      ]
    },

    'wyckoff-trade-utad': {
      closes: [132, 138, 130, 139, 131, 138, 130, 137, 129, 136, 128, 135, 147, 134, 126, 119, 113, 121, 111, 103],
      amp: 1.6,
      drawings: [
        { type: 'hline', anchors: [{ price: 140 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'hline', anchors: [{ price: 128 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'hray', anchors: [{ bar: 12, price: 149 }], style: { lineColor: '#22c55e', lineWidth: 1.8, dash: [4, 4] } },
        { type: 'hray', anchors: [{ bar: 13, price: 116 }], style: { lineColor: '#d92d20', lineWidth: 1.8, dash: [4, 4] } },
        { type: 'arrow', anchors: [{ bar: 14, price: 126 }, { bar: 19, price: 103 }], style: { lineColor: '#22c55e', lineWidth: 2 } },
        { type: 'note', anchors: [{ bar: 12, price: 147 }], text: { value: 'UTAD 假突破' }, style: { color: '#f59e0b', fillColor: 'rgba(245,158,11,0.12)' } },
        { type: 'trendline', anchors: [{ bar: 13, price: 134 }, { bar: 14, price: 140 }], style: { lineColor: '#22c55e', lineWidth: 1.6, opacity: 0.7 } },
        { type: 'note', anchors: [{ bar: 14, price: 140 }], text: { value: '入场 134 · 跌回区间做空' }, style: { color: '#22c55e', fillColor: 'rgba(34,197,94,0.12)' } },
        { type: 'note', anchors: [{ bar: 14, price: 126 }], text: { value: 'SOW 破冰' }, style: { color: '#22c55e', fillColor: 'rgba(34,197,94,0.12)' } },
        { type: 'note', anchors: [{ bar: 17, price: 121 }], text: { value: 'LPSY 反抽' }, style: { color: '#22c55e', fillColor: 'rgba(34,197,94,0.12)' } },
        { type: 'position', anchors: [{ bar: 13, price: 134 }, { bar: 19, price: 116 }], options: { direction: 'short', entryPrice: 134, stopLoss: 149, takeProfit: 116 } }
      ]
    },

    'wyckoff-spring-fail': {
      closes: [112, 106, 109, 104, 107, 103, 106, 102, 97, 99, 98, 101, 99, 96, 92, 86],
      amp: 1.6,
      drawings: [
        { type: 'hline', anchors: [{ price: 110 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'hline', anchors: [{ price: 102 }], style: { lineColor: '#94a3b8', lineWidth: 1.4, dash: [6, 5], opacity: 0.9 } },
        { type: 'box', anchors: [{ bar: 8, price: 104 }, { bar: 12, price: 94 }], style: { fillColor: 'rgba(245,158,11,0.10)', lineColor: 'rgba(245,158,11,0.5)', lineWidth: 1 } },
        { type: 'hray', anchors: [{ bar: 8, price: 96 }], style: { lineColor: '#22c55e', lineWidth: 1.8, dash: [4, 4] } },
        { type: 'arrow', anchors: [{ bar: 13, price: 96 }, { bar: 15, price: 86 }], style: { lineColor: '#22c55e', lineWidth: 2 } },
        { type: 'note', anchors: [{ bar: 8, price: 102.5 }], text: { value: '跌破支撑' }, style: { color: '#f59e0b', fillColor: 'rgba(245,158,11,0.12)' } },
        { type: 'note', anchors: [{ bar: 10, price: 106 }], text: { value: '反抽四根棒，始终收不回 102' }, style: { color: '#f59e0b', fillColor: 'rgba(245,158,11,0.12)' } },
        { type: 'trendline', anchors: [{ bar: 9, price: 99 }, { bar: 8, price: 95.5 }], style: { lineColor: '#d92d20', lineWidth: 1.6, opacity: 0.7 } },
        { type: 'note', anchors: [{ bar: 8, price: 95.5 }], text: { value: '按 Spring 进场 99 · 止损 96' }, style: { color: '#d92d20', fillColor: 'rgba(217,45,32,0.12)' } },
        { type: 'note', anchors: [{ bar: 13, price: 97.5 }], text: { value: '确认失败' }, style: { color: '#22c55e', fillColor: 'rgba(34,197,94,0.12)' } }
      ]
    }
  };

  window.VelaLab = { mount: mount, labs: Object.keys(LABS) };
})();
