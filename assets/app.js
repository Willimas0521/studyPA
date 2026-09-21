/* ==========================================================================
   交易理论图谱 —— 应用层
   路由（hash）· 侧边栏 · 全文搜索 · 主题切换 · 术语渲染
   ========================================================================== */

(function () {
  'use strict';

  var SITE = window.SITE;
  var GLOSSARY = window.GLOSSARY || [];
  var CHART = window.ChartModule;

  var elContent = document.getElementById('content');
  var elMain = document.getElementById('main');
  var elSearch = document.getElementById('searchInput');
  var elResults = document.getElementById('searchResults');
  var elScrim = document.getElementById('scrim');
  var elRail = document.getElementById('rail');
  var elRailBody = document.getElementById('railBody');
  var elRailPage = document.getElementById('railPage');
  var elRailBtn = document.getElementById('railBtn');
  var elThemeBtn = document.getElementById('themeBtn');
  var elToTop = document.getElementById('toTop');

  var PAGE_BY_ID = {};
  SITE.pages.forEach(function (p) { PAGE_BY_ID[p.id] = p; });

  /* ------------------------------------------------------------ 工具函数 */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stripTags(html) {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function highlight(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    try {
      return safe.replace(new RegExp('(' + escRe(esc(q)) + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) { return safe; }
  }

  /* ------------------------------------------------------------ 提示块图标 */

  var ICONS = {
    tip:     '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.2v1h6v-1c0-.5.2-.9.6-1.2A6 6 0 0 0 12 3z"/>',
    warn:    '<path d="M12 4.5 2.6 20h18.8L12 4.5zM12 10v4.5M12 17.5v.01"/>',
    danger:  '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
    insight: '<path d="M12 3.5 13.9 9l5.6.3-4.4 3.5 1.5 5.4L12 15.2 7.4 18.2l1.5-5.4L4.5 9.3 10.1 9 12 3.5z"/>'
  };

  function decorateCallouts(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.callout'), function (c) {
      if (c.querySelector('.callout-icon')) return;
      var kind = 'tip';
      ['tip', 'warn', 'danger', 'insight'].forEach(function (k) {
        if (c.classList.contains(k)) kind = k;
      });
      var span = document.createElement('span');
      span.className = 'callout-icon';
      span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[kind] + '</svg>';
      c.insertBefore(span, c.firstChild);
    });
  }

  /* ------------------------------------------------------------ 术语渲染 */

  function mountGlossary(root) {
    var mount = root.querySelector('#glossaryMount');
    if (!mount) return;
    var html = '';
    GLOSSARY.forEach(function (g) {
      html += '<h2 id="g-' + esc(g.group) + '">' + esc(g.group) + '</h2>';
      html += '<div class="glossary">';
      g.items.forEach(function (it) {
        var src = (it.src || []).map(function (s) {
          return '<span class="gl-src">' + esc(s) + '</span>';
        }).join('');
        html += '<div class="gl-item">' +
          '<div><span class="gl-term">' + esc(it.zh) + '</span>' + src +
          '<span class="gl-en">' + esc(it.en) + '</span></div>' +
          '<p class="gl-desc">' + esc(it.desc) + '</p>' +
          '</div>';
      });
      html += '</div>';
    });
    mount.innerHTML = html;
  }

  /* ------------------------------------------------------------ 概览卡片 */

  function mountOverviewCards(root) {
    var mount = root.querySelector('#overviewCards');
    if (!mount) return;
    mount.innerHTML = SITE.theories.map(function (t) {
      return '<a class="card" href="#/' + esc(t.id) + '" style="--card-accent:' + esc(t.accent) + '">' +
        '<span class="card-bar"></span>' +
        '<h3>' + esc(t.title) + '</h3>' +
        '<span class="card-en">' + esc(t.en) + '</span>' +
        '<p>' + esc(t.tagline) + '</p></a>';
    }).join('');
  }

  /* ------------------------------------------------------------ 页面渲染 */

  function heroHTML(p) {
    if (!p.eyebrow && !p.en) return '';
    var h = '<div class="hero">';
    if (p.en) h += '<div class="hero-en">' + esc(p.en) + '</div>';
    else if (p.eyebrow) h += '<div class="hero-en">' + esc(p.eyebrow) + '</div>';
    h += '<h1>' + esc(p.title) + '</h1>';
    if (p.tagline) h += '<p class="tagline">' + esc(p.tagline) + '</p>';
    if (p.tags && p.tags.length) {
      h += '<div class="hero-tags">' + p.tags.map(function (t) {
        return '<span class="hero-tag">' + esc(t) + '</span>';
      }).join('') + '</div>';
    }
    h += '</div>';
    return h;
  }

  function tocHTML(p) {
    if (!p.chapters || !p.chapters.length) return '';
    return '<nav class="toc"><p class="toc-title">本页目录</p><ol>' +
      p.chapters.map(function (c) {
        return '<li><a href="#/' + esc(p.id) + '#' + esc(c.id) + '" data-anchor="' + esc(c.id) + '">' + esc(c.label) + '</a></li>';
      }).join('') + '</ol></nav>';
  }

  function renderPage(p) {
    elContent.style.setProperty('--accent', p.accent || '');
    elContent.style.setProperty('--accent-soft', p.accent ? hexSoft(p.accent) : '');
    elContent.style.setProperty('--accent-text', p.accent || '');

    var html = heroHTML(p) + tocHTML(p) + p.body;
    elContent.innerHTML = html;

    mountOverviewCards(elContent);
    mountGlossary(elContent);
    decorateCallouts(elContent);
    if (CHART) {
      CHART.mountDiagrams(elContent);
      CHART.mountInteractive(elContent);
    }

    document.title = (p.id === 'overview')
      ? '交易理论图谱 · 价格行为学 / ICT / SMC / 威科夫 / 波浪理论'
      : p.title + ' · 交易理论图谱';
    renderRail(p.id);
  }

  /* 由强调色生成浅底（用于卡片/导航高亮），保持与主题无关的柔和效果 */
  function hexSoft(hex) {
    return 'color-mix(in srgb, ' + hex + ' 12%, transparent)';
  }

  /* ------------------------------------------------------------ 细纲导航 */
  /* 主导航右侧的第二栏：把每套体系的具体章节摊开。
     当前所在体系默认展开，其余折叠；滚动时高亮当前小节。 */

  var RAIL_OPEN = {};   /* 用户手动展开过的体系：pageId -> true */

  function outlineChapters(p) {
    if (p.chapters && p.chapters.length) return p.chapters;
    if (p.id === 'glossary') {
      return GLOSSARY.map(function (g) { return { id: 'g-' + g.group, label: g.group }; });
    }
    /* 没写 chapters 的页面（概览 / 对比 / 图层图 / 学习路径）从正文 h2 现抽 */
    var out = [];
    var re = /<h2[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
    var m;
    while ((m = re.exec(p.body || ''))) out.push({ id: m[1], label: stripTags(m[2]) });
    return out;
  }

  var OUTLINE = SITE.pages.map(function (p) {
    return { page: p, chapters: outlineChapters(p) };
  }).filter(function (g) { return g.chapters.length; });

  function renderRail(pageId) {
    if (!elRailBody) return;

    var html = '';
    OUTLINE.forEach(function (g) {
      var p = g.page;
      var cur = p.id === pageId;
      var open = cur || !!RAIL_OPEN[p.id];

      html += '<button type="button" class="rail-group-head' + (cur ? ' current' : '') + (open ? ' open' : '') +
          '" data-page="' + esc(p.id) + '" style="--rc:' + esc(p.accent || '#64748b') + '"' +
          ' aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="rail-chaps-' + esc(p.id) + '">' +
          '<span class="rail-dot"></span>' +
          '<span class="rail-name">' + esc(p.navLabel || p.title) + '</span>' +
          '<span class="rail-count">' + g.chapters.length + '</span>' +
          '<svg class="rail-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
        '</button>' +
        '<div class="rail-chaps" id="rail-chaps-' + esc(p.id) + '">' +
          g.chapters.map(function (c) {
            return '<a class="rail-chap" href="#/' + esc(p.id) + '#' + esc(c.id) +
              '" data-anchor="' + esc(c.id) + '">' + esc(c.label) + '</a>';
          }).join('') +
        '</div>';
    });
    elRailBody.innerHTML = html;

    if (elRailPage) {
      var cur2 = PAGE_BY_ID[pageId];
      elRailPage.textContent = cur2 ? (cur2.navLabel || cur2.title) : '细纲';
    }
    collectSpy(pageId);
  }

  /* --------- 滚动同步：高亮当前所在的小节 --------- */

  var spyTargets = [];

  function collectSpy(pageId) {
    spyTargets = [];
    OUTLINE.forEach(function (g) {
      if (g.page.id !== pageId) return;
      g.chapters.forEach(function (c) {
        var node = document.getElementById(c.id);
        if (node) spyTargets.push({ id: c.id, el: node });
      });
    });
    markRailAnchor('');
  }

  function markRailAnchor(id) {
    if (!elRailBody) return;
    Array.prototype.forEach.call(elRailBody.querySelectorAll('.rail-chap'), function (a) {
      var on = !!id && a.getAttribute('data-anchor') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  var spyQueued = false;
  function syncSpy() {
    if (spyQueued || !spyTargets.length) return;
    spyQueued = true;
    requestAnimationFrame(function () {
      spyQueued = false;
      /* 以顶栏下方 28px 为判定线：最后一个越过该线的标题即当前节 */
      var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 60) + 28;
      var cur = '';
      for (var i = 0; i < spyTargets.length; i++) {
        if (spyTargets[i].el.getBoundingClientRect().top <= line) cur = spyTargets[i].id;
        else break;
      }
      markRailAnchor(cur);
    });
  }

  window.addEventListener('scroll', syncSpy, { passive: true });

  /* --------- 细纲交互 --------- */

  if (elRailBody) {
    elRailBody.addEventListener('click', function (e) {
      var head = e.target.closest('.rail-group-head');

      if (head) {
        var pid = head.getAttribute('data-page');
        if (pid === currentRoute().id) {
          /* 已经是当前体系：这一下只做展开 / 收起 */
          var open = !head.classList.contains('open');
          head.classList.toggle('open', open);
          head.setAttribute('aria-expanded', open ? 'true' : 'false');
          RAIL_OPEN[pid] = open;
        } else {
          RAIL_OPEN[pid] = true;
          location.hash = '#/' + pid;
        }
        return;
      }

      var a = e.target.closest('.rail-chap');
      if (!a) return;
      closeRail();

      /* 同页内锚点跳转不触发 hashchange，这里自己接管平滑滚动 */
      var anchor = a.getAttribute('data-anchor');
      if (a.getAttribute('href').indexOf('#/' + currentRoute().id + '#') !== 0) return;
      var target = document.getElementById(anchor);
      if (!target) return;
      e.preventDefault();
      history.replaceState(null, '', '#/' + currentRoute().id + '#' + anchor);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openRail() {
    if (!elRail) return;
    elRail.classList.add('open');
    elScrim.hidden = false;
    if (elRailBtn) elRailBtn.setAttribute('aria-expanded', 'true');
  }

  if (elRailBtn) {
    elRailBtn.addEventListener('click', function () {
      if (elRail && elRail.classList.contains('open')) closeRail(); else openRail();
    });
  }

  /* ------------------------------------------------------------ 路由 */

  function currentRoute() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('#');
    return { id: parts[0] || 'overview', anchor: parts[1] || '' };
  }

  function route() {
    var r = currentRoute();
    var p = PAGE_BY_ID[r.id] || SITE.overview;
    renderPage(p);
    closeRail();

    if (r.anchor) {
      var target = document.getElementById(r.anchor);
      if (target) {
        requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  window.addEventListener('hashchange', route);

  /* 目录内锚点：同页内跳转时 hashchange 不触发，需要单独处理 */
  elContent.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.toc a[data-anchor]');
    if (!a) return;
    var anchor = a.getAttribute('data-anchor');
    var target = document.getElementById(anchor);
    if (!target) return;
    e.preventDefault();
    var r = currentRoute();
    history.replaceState(null, '', '#/' + r.id + '#' + anchor);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ------------------------------------------------------------ 搜索索引 */

  var INDEX = [];

  function buildIndex() {
    SITE.pages.forEach(function (p) {
      var tmp = document.createElement('div');
      tmp.innerHTML = p.body;
      var nodes = Array.prototype.slice.call(tmp.children);
      var bucket = { heading: p.title, id: '', text: [] };

      function flush() {
        var text = bucket.text.join(' ').replace(/\s+/g, ' ').trim();
        if (text.length > 30) {
          INDEX.push({
            pageId: p.id,
            pageTitle: p.navLabel || p.title,
            anchor: bucket.id,
            heading: bucket.heading,
            text: text
          });
        }
        bucket.text = [];
      }

      nodes.forEach(function (n) {
        if (n.tagName === 'H2') { flush(); bucket.heading = n.textContent.trim(); bucket.id = n.id || ''; }
        else if (n.tagName === 'H3') { bucket.text.push(n.textContent.trim() + '。'); }
        else { bucket.text.push(n.textContent.trim()); }
      });
      flush();
    });

    GLOSSARY.forEach(function (g) {
      g.items.forEach(function (it) {
        INDEX.push({
          pageId: 'glossary',
          pageTitle: '术语速查',
          anchor: 'g-' + g.group,
          heading: it.zh + ' · ' + it.en,
          text: it.desc + '（' + g.group + '，' + (it.src || []).join('/') + '）'
        });
      });
    });
  }

  function runSearch(q) {
    q = q.trim();
    if (q.length < 1) { elResults.hidden = true; elResults.innerHTML = ''; return; }
    var lower = q.toLowerCase();
    var hits = [];

    for (var i = 0; i < INDEX.length && hits.length < 14; i++) {
      var item = INDEX[i];
      var idxT = item.heading.toLowerCase().indexOf(lower);
      var idxX = item.text.toLowerCase().indexOf(lower);
      if (idxT === -1 && idxX === -1) continue;

      var score = (idxT !== -1 ? 0 : 100) + (idxT === 0 ? -20 : 0) + i / 1000;
      var snip;
      if (idxX !== -1) {
        var from = Math.max(0, idxX - 42);
        snip = (from > 0 ? '…' : '') + item.text.substr(from, 130) + '…';
      } else {
        snip = item.text.substr(0, 130) + '…';
      }
      hits.push({ score: score, item: item, snip: snip });
    }

    hits.sort(function (a, b) { return a.score - b.score; });

    if (!hits.length) {
      elResults.innerHTML = '<div class="sr-empty">没有找到「' + esc(q) + '」<br><span class="small">试试：FVG · 弹簧 · 订单块 · 铁律 · CHoCH</span></div>';
      elResults.hidden = false;
      return;
    }

    elResults.innerHTML = hits.map(function (h) {
      var it = h.item;
      var href = '#/' + it.pageId + (it.anchor ? '#' + it.anchor : '');
      return '<a class="sr-item" href="' + href + '">' +
        '<span class="sr-title">' + highlight(it.heading, q) +
        '<span class="sr-badge">' + esc(it.pageTitle) + '</span></span>' +
        '<span class="sr-snippet">' + highlight(h.snip, q) + '</span></a>';
    }).join('');
    elResults.hidden = false;
  }

  elSearch.addEventListener('input', function () { runSearch(elSearch.value); });
  elSearch.addEventListener('focus', function () { if (elSearch.value) runSearch(elSearch.value); });
  elResults.addEventListener('click', function () { elResults.hidden = true; elSearch.blur(); });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) elResults.hidden = true;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== elSearch) {
      e.preventDefault(); elSearch.focus(); elSearch.select();
    } else if (e.key === 'Escape') {
      elResults.hidden = true;
      if (document.activeElement === elSearch) elSearch.blur();
    }
  });

  /* ------------------------------------------------------------ 主题 */

  var THEME_KEY = 'pa-atlas-theme';

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (err) { /* ignore */ }
  }

  function initTheme() {
    /* index.html 的 <head> 内联脚本已在首次绘制前设好 data-theme，
       这里只做兜底同步，确保与 localStorage / 系统偏好一致。 */
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
    if (saved !== 'light' && saved !== 'dark') {
      saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    if (document.documentElement.getAttribute('data-theme') !== saved) {
      document.documentElement.setAttribute('data-theme', saved);
      void document.body.offsetHeight;   /* 强制一次样式重算 */
    }
  }

  elThemeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------------------------------------ 细纲抽屉 / 回到顶部 */

  function closeRail() {
    if (elRail) elRail.classList.remove('open');
    if (elRailBtn) elRailBtn.setAttribute('aria-expanded', 'false');
    elScrim.hidden = true;
  }

  elScrim.addEventListener('click', closeRail);

  window.addEventListener('scroll', function () {
    elToTop.hidden = window.scrollY < 620;
  }, { passive: true });

  elToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ------------------------------------------------------------ 启动 */

  initTheme();
  buildIndex();
  route();
})();
