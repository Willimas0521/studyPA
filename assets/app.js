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
  var elRailConcepts = document.getElementById('railConcepts');
  var elRailScroll = document.querySelector('.rail-scroll');
  var elRailFilter = document.getElementById('railFilter');
  var elTabOutline = document.getElementById('tabOutline');
  var elTabConcepts = document.getElementById('tabConcepts');
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

  /* URL 片段：英文名优先；没有英文名的卡片用中文名（浏览器地址栏会显示解码后的中文，照样可读） */
  function slugify(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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
    var tocItems = [];
    GLOSSARY.forEach(function (g) {
      var gid = 'g-' + esc(g.group);
      tocItems.push('<li><a href="#/glossary#' + gid + '" data-anchor="' + gid + '">' + esc(g.group) + '</a></li>');
      html += '<h2 id="' + gid + '">' + esc(g.group) + '</h2>';
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

    /* 术语速查没有静态 h2 正文（由本函数动态拼出），单独生成一份「本页目录」 */
    if (tocItems.length > 1) {
      var nav = document.createElement('nav');
      nav.className = 'toc';
      nav.innerHTML = '<p class="toc-title">本页目录</p><ol>' + tocItems.join('') + '</ol>';
      mount.parentNode.insertBefore(nav, mount);
    }
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

  /* 全站通用的「本页目录」：扫描正文里的 h2 / h3 标题，补锚点并生成两级目录。
     每篇文章页都走这里，保证「所有文章都有目录」（与章节页的「本节内容」同一套范式）。
       - 标题数 ≤ 1 时不生成目录（单节文章没必要）；
       - h2 为一级条目：若该 h2 同时是独立章节页（p.chapters 命中），则链接到章节独立页，
         否则链接到页内锚点；
       - h3 挂在前一个 h2 之下做二级，统一走页内锚点。 */
  function pageToc(p) {
    var tmp = document.createElement('div');
    tmp.innerHTML = p.body || '';

    var heads = [];
    Array.prototype.forEach.call(tmp.children, function (n) {
      if (n.tagName === 'H2' || n.tagName === 'H3') heads.push(n);
    });
    if (heads.length <= 1) return { html: p.body || '', toc: '' };

    var chapIds = {};
    (p.chapters || []).forEach(function (c) {
      chapIds[c.id] = true;
      (c.kids || []).forEach(function (k) { chapIds[k.id] = true; });
    });

    var h2n = 0, h3n = 0;
    var top = [];
    var cur = null;
    heads.forEach(function (h) {
      var label = h.textContent.trim();
      if (h.tagName === 'H2') {
        h2n++;
        var id = h.id || ('h2-' + h2n + '-' + (slugify(label).slice(0, 18) || 'x'));
        h.id = id;
        cur = { id: id, label: label, kids: [], chapter: !!chapIds[id] };
        top.push(cur);
      } else {
        h3n++;
        var kid = h.id || ('sec-' + h3n + '-' + (slugify(label).slice(0, 18) || 'x'));
        h.id = kid;
        if (cur) cur.kids.push({ id: kid, label: label, chapter: !!chapIds[kid] });
      }
    });

    function li(it) {
      var href, cls = '', anchorAttr = '';
      if (it.chapter) {
        href = '#/' + esc(p.id) + '/' + esc(it.id);     /* 章节独立页 */
        cls = ' class="toc-chap"';
      } else {
        href = '#/' + esc(p.id) + '#' + esc(it.id);      /* 同页锚点 */
        anchorAttr = ' data-anchor="' + esc(it.id) + '"';
      }
      var s = '<li><a href="' + href + '"' + cls + anchorAttr + '>' + esc(it.label) + '</a>';
      if (it.kids && it.kids.length) s += '<ol>' + it.kids.map(li).join('') + '</ol>';
      return s + '</li>';
    }

    var toc = '<nav class="toc"><p class="toc-title">本页目录</p><ol>' +
      top.map(li).join('') + '</ol></nav>';
    return { html: tmp.innerHTML, toc: toc };
  }

  /* 章节页的「本节内容」目录。正文里的 h3 / h4 本来没有锚点，这里现补：
     - 若本页只有一个 h3（书籍章节页：那一个 h3 就是章节标题，已作为 hero），
       则以 h4 小节生成目录；
     - 否则以 h3 生成目录；其中 id 命中 ALL_CHAP_IDS 的（书籍章节）直接链到独立章节页，
       其余走页内锚点。 */
  function sectionToc(bodyHTML, pageId, chapId) {
    var tmp = document.createElement('div');
    tmp.innerHTML = bodyHTML;

    var h3s = tmp.querySelectorAll('h3');
    var useH4 = h3s.length <= 1;
    var heads = useH4 ? tmp.querySelectorAll('h4') : h3s;
    var titleTxt = useH4 ? '本节内容' : '本章目录';

    var items = [];
    Array.prototype.forEach.call(heads, function (h, i) {
      var label = h.textContent.trim();
      var id = h.id || ('sec-' + (i + 1) + '-' + (slugify(label).slice(0, 20) || 'x'));
      h.id = id;
      var href, cls = '', anchorAttr = '';
      if (!useH4 && ALL_CHAP_IDS[id]) {
        href = '#/' + esc(pageId) + '/' + esc(id);
        cls = ' class="toc-chap"';
      } else {
        href = '#/' + esc(pageId) + '/' + esc(chapId) + '#' + esc(id);
        anchorAttr = ' data-anchor="' + esc(id) + '"';
      }
      items.push('<li><a href="' + href + '"' + cls + anchorAttr + '>' + esc(label) + '</a></li>');
    });

    return {
      html: tmp.innerHTML,
      toc: items.length > 1
        ? '<nav class="toc toc-sub"><p class="toc-title">' + titleTxt + '</p><ol>' + items.join('') + '</ol></nav>'
        : ''
    };
  }

  function renderPage(p) {
    applyAccent(p.accent);

    var page = pageToc(p);
    var html = heroHTML(p) + page.toc + page.html;
    elContent.innerHTML = html;

    afterMount();
    document.title = (p.id === 'overview')
      ? '交易理论图谱 · 价格行为学 / ICT / SMC / 威科夫 / 波浪理论'
      : p.title + ' · 交易理论图谱';
    refreshRail();
  }

  function applyAccent(accent) {
    elContent.style.setProperty('--accent', accent || '');
    elContent.style.setProperty('--accent-soft', accent ? hexSoft(accent) : '');
    elContent.style.setProperty('--accent-text', accent || '');
  }

  /* 内容塞进 #content 之后都要走这一步：补锚点、装挂件、装饰提示块 */
  function afterMount() {
    /* 给概念卡补锚点，供细纲与全文搜索跳转（序号与 collectConcepts 一致） */
    Array.prototype.forEach.call(elContent.querySelectorAll('.concept'), function (card, i) {
      card.id = 'c-' + i;
    });

    mountOverviewCards(elContent);
    mountGlossary(elContent);
    decorateCallouts(elContent);

    if (CHART) {
      CHART.mountDiagrams(elContent);
      CHART.mountInteractive(elContent);
    }
  }

  /* ------------------------------------------------------------ 独立页 */
  /* 每一级都有自己的地址，可以直接打开 / 分享：
       #/wyckoff                          体系页
       #/wyckoff/laws                     章节页
       #/wyckoff/laws/law-of-supply-…     概念页 */

  var BASE_TITLE = ' · 交易理论图谱';

  function crumbHTML(items) {
    return '<nav class="crumb" aria-label="面包屑">' +
      items.map(function (it) {
        return it[0] ? '<a href="' + esc(it[0]) + '">' + esc(it[1]) + '</a>'
                     : '<span aria-current="page">' + esc(it[1]) + '</span>';
      }).join('<i>/</i>') +
      '</nav>';
  }

  function chapOf(p, chapId) {
    var hit = null;
    (p.chapters || []).forEach(function (c) {
      if (c.id === chapId) { hit = c; return; }
      (c.kids || []).forEach(function (k) { if (k.id === chapId) hit = k; });
    });
    return hit;
  }

  function conceptHref(pageId, chapId, slug) {
    return '#/' + esc(pageId) + '/' + esc(chapId) + '/' + encodeURIComponent(slug);
  }

  /* 同节其它概念：概念页用它做交叉入口（章节页正文里已经含这些卡，就不再重复列） */
  function siblingHTML(pageId, chapId, selfSlug) {
    var kids = CONCEPTS_BY_CHAP[pageId + '#' + chapId] || [];
    var rest = kids.filter(function (k) { return k.slug !== selfSlug; });
    if (!rest.length) return '';
    return '<section class="siblings"><h2>' + (selfSlug ? '同一节里的其它概念' : '这一节的概念') + '</h2>' +
      '<div class="card-grid">' +
      rest.map(function (k) {
        return '<a class="card" href="' + conceptHref(pageId, chapId, k.slug) + '">' +
          '<span class="card-bar"></span>' +
          '<h3>' + esc(k.zh) + '</h3>' +
          (k.en ? '<span class="card-en">' + esc(k.en) + '</span>' : '') +
          '<p>' + esc(k.desc.slice(0, 64)) + (k.desc.length > 64 ? '…' : '') + '</p></a>';
      }).join('') +
      '</div></section>';
  }

  /* 扁平化章节（含嵌套 kids），供「上一节 / 下一节」用连续顺序遍历 */
  function flatChapters(p) {
    var out = [];
    (p.chapters || []).forEach(function (c) {
      out.push(c);
      (c.kids || []).forEach(function (k) { out.push(k); });
    });
    return out;
  }

  /* 章节页底部：同体系里的上一节 / 下一节 */
  function chapterNavHTML(p, chapId) {
    var chaps = flatChapters(p);
    var at = -1;
    chaps.forEach(function (c, i) { if (c.id === chapId) at = i; });
    if (at < 0) return '';
    var prev = at > 0 ? chaps[at - 1] : null;
    var next = at < chaps.length - 1 ? chaps[at + 1] : null;
    if (!prev && !next) return '';
    var link = function (c) { return '#/' + esc(p.id) + '/' + esc(c.id); };
    return '<nav class="concept-nav">' +
      (prev ? '<a href="' + link(prev) + '"><span>上一节</span><strong>' + esc(prev.label) + '</strong></a>' : '<span></span>') +
      (next ? '<a class="cn-next" href="' + link(next) + '"><span>下一节</span><strong>' + esc(next.label) + '</strong></a>' : '<span></span>') +
      '</nav>';
  }

  function renderChapterPage(r) {
    var p = PAGE_BY_ID[r.id];
    var chap = p && chapOf(p, r.chap);
    var body = CHAPTER_HTML[r.id + '#' + r.chap];

    /* 术语速查这类页面的正文是运行时拼的，切不出小节：
       退回整页并滚到那一组，不让链接点空 */
    if (!p || !body) {
      renderPage(p || SITE.overview);
      var node = document.getElementById(r.chap);
      if (node) {
        requestAnimationFrame(function () {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return;
    }

    applyAccent(p.accent);
    var label = chap ? chap.label : r.chap;
    var kids = CONCEPTS_BY_CHAP[r.id + '#' + r.chap] || [];
    var sec = sectionToc(body, r.id, r.chap);

    /* 书籍章节页：正文首行的 h3 即章节标题，与 hero 的 h1 重复，去掉 */
    var secTmp = document.createElement('div');
    secTmp.innerHTML = sec.html;
    var firstChild = secTmp.firstElementChild;
    if (firstChild && firstChild.tagName === 'H3' && firstChild.textContent.trim() === label) {
      firstChild.parentNode.removeChild(firstChild);
    }
    sec.html = secTmp.innerHTML;

    elContent.innerHTML =
      crumbHTML([['#/' + p.id, p.navLabel || p.title], [null, label]]) +
      '<div class="hero hero-sub">' +
        '<span class="hero-en">' + esc(p.navLabel || p.title) + '</span>' +
        '<h1>' + esc(label) + '</h1>' +
        (kids.length ? '<p class="hero-meta">本节 <b>' + kids.length + '</b> 个概念 · 点卡片可单独打开</p>' : '') +
      '</div>' +
      sec.toc +
      sec.html +
      chapterNavHTML(p, r.chap);

    afterMount();
    document.title = label + ' · ' + (p.navLabel || p.title) + BASE_TITLE;
    refreshRail();
  }

  function renderConceptPage(r) {
    var p = PAGE_BY_ID[r.id];
    var chap = p && chapOf(p, r.chap);
    var one = null;
    CONCEPTS.forEach(function (c) {
      if (c.pageId === r.id && c.chap === r.chap && c.slug === r.slug) one = c;
    });
    if (!p || !one) { renderPage(p || SITE.overview); return; }

    applyAccent(p.accent);
    var kids = CONCEPTS_BY_CHAP[r.id + '#' + r.chap] || [];
    var at = -1;
    kids.forEach(function (k, i) { if (k.slug === one.slug) at = i; });
    var prev = at > 0 ? kids[at - 1] : null;
    var next = (at >= 0 && at < kids.length - 1) ? kids[at + 1] : null;

    elContent.innerHTML =
      crumbHTML([
        ['#/' + p.id, p.navLabel || p.title],
        ['#/' + p.id + '/' + r.chap, chap ? chap.label : r.chap],
        [null, one.zh]
      ]) +
      '<div class="hero hero-sub">' +
        '<span class="hero-en">' + esc(p.navLabel || p.title) + (chap ? ' · ' + esc(chap.label) : '') + '</span>' +
        '<h1>' + esc(one.zh) + '</h1>' +
        (one.en ? '<p class="concept-en-full">' + esc(one.en) + '</p>' : '') +
        (kids.length > 1 ? '<p class="hero-meta">第 <b>' + (at + 1) + '</b> / ' + kids.length + ' 个</p>' : '') +
      '</div>' +
      '<div class="concept-detail"><p>' + (one.descHTML || esc(one.desc)) + '</p></div>' +
      (prev || next ? '<nav class="concept-nav">' +
        (prev ? '<a href="' + conceptHref(r.id, r.chap, prev.slug) + '"><span>上一个</span><strong>' + esc(prev.zh) + '</strong></a>' : '<span></span>') +
        (next ? '<a class="cn-next" href="' + conceptHref(r.id, r.chap, next.slug) + '"><span>下一个</span><strong>' + esc(next.zh) + '</strong></a>' : '<span></span>') +
        '</nav>' : '') +
      siblingHTML(r.id, r.chap, one.slug);

    afterMount();
    document.title = one.zh + ' · ' + (p.navLabel || p.title) + BASE_TITLE;
    refreshRail();
  }

  /* 由强调色生成浅底（用于卡片/导航高亮），保持与主题无关的柔和效果 */
  function hexSoft(hex) {
    return 'color-mix(in srgb, ' + hex + ' 12%, transparent)';
  }

  /* ------------------------------------------------------------ 细纲导航 */
  /* 主导航右侧的第二栏：把每套体系的具体章节摊开。
     当前所在体系默认展开，其余折叠；滚动时高亮当前小节。 */

  var RAIL_OPEN = {};   /* 展开状态：pageId -> true（两个视图共享同一体系的开关） */
  var CHAP_OPEN = {};   /* 章节展开状态："pageId#chapId" -> true */
  var railTab = 'outline';

  /* --------- 章节视图的数据 --------- */

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

  /* --------- 概念视图的数据 --------- */
  /* 概念卡本来只是正文里的一堆卡片，没有锚点。这里把它们抽出来建索引，
     并记下它在页面内的序号；renderPage 会给每张卡补 id="c-N"，两边序号务必一致。 */

  var CONCEPT_GROUPS = [];
  var CONCEPTS = [];
  var CONCEPTS_BY_CHAP = {};   /* "pageId#chapId" -> [该节下的概念] */

  function collectConcepts() {
    SITE.pages.forEach(function (p) {
      var tmp = document.createElement('div');
      tmp.innerHTML = p.body || '';

      /* 顺着文档流扫一遍，记住每张概念卡归属哪个 h2 —— 顺序必须与 renderPage 补 id 的顺序一致 */
      var found = [];
      var chap = '';
      Array.prototype.forEach.call(tmp.children, function (node) {
        if (node.tagName === 'H2') { chap = node.id || ''; return; }
        var cards = (node.classList && node.classList.contains('concept'))
          ? [node]
          : node.querySelectorAll('.concept');
        Array.prototype.forEach.call(cards, function (card) {
          found.push({ card: card, chap: chap });
        });
      });
      if (!found.length) return;

      var seen = {};
      var items = found.map(function (f, i) {
        var card = f.card;
        var zh = '', en = '', desc = '', descHTML = '';
        var termEl = card.querySelector('.concept-term');
        if (termEl) {
          /* 术语后面可能跟着 <span class="badge-inline">，取名字前先摘掉 */
          var clone = termEl.cloneNode(true);
          var badge = clone.querySelector('.badge-inline');
          if (badge) badge.parentNode.removeChild(badge);
          zh = clone.textContent.trim();
        }
        var enEl = card.querySelector('.concept-en');
        if (enEl) en = enEl.textContent.trim();
        var descEl = card.querySelector('p:not(.concept-term)');
        if (descEl) { desc = descEl.textContent.trim(); descHTML = descEl.innerHTML; }

        /* 同一页面内 slug 唯一即可，页面之间可以重名（各自挂在体系路径下） */
        var base = slugify(en || zh) || ('c-' + i);
        var slug = base, n = 2;
        while (seen[slug]) { slug = base + '-' + n; n++; }
        seen[slug] = true;

        return { idx: i, zh: zh, en: en, desc: desc, descHTML: descHTML, chap: f.chap, slug: slug };
      });

      CONCEPT_GROUPS.push({
        pageId: p.id,
        title: p.navLabel || p.title,
        accent: p.accent || '#64748b',
        items: items
      });
      items.forEach(function (c) {
        CONCEPTS.push({
          pageId: p.id, pageTitle: p.navLabel || p.title,
          idx: c.idx, zh: c.zh, en: c.en, desc: c.desc, chap: c.chap, slug: c.slug
        });
        if (!c.chap) return;
        var key = p.id + '#' + c.chap;
        (CONCEPTS_BY_CHAP[key] = CONCEPTS_BY_CHAP[key] || []).push(c);
      });
    });
  }

  /* --------- 章节切片 ---------
     把每个页面的正文按 h2 切开，让「章节」也能独立成页（#/wyckoff/laws）。
     h2 自身不进切片，章节页的标题用 chapters 元数据里的 label。 */

  var CHAPTER_HTML = {};   /* "pageId#chapId" -> 该节正文的 HTML */

  /* 所有「章节页」id 集合（含嵌套 kids），供切片 / 目录判定哪些 h3 是独立页 */
  var ALL_CHAP_IDS = {};
  function buildChapIndex() {
    ALL_CHAP_IDS = {};
    SITE.pages.forEach(function (p) {
      (p.chapters || []).forEach(function (c) {
        ALL_CHAP_IDS[c.id] = true;
        (c.kids || []).forEach(function (k) { ALL_CHAP_IDS[k.id] = true; });
      });
    });
  }

  function sliceChapters() {
    SITE.pages.forEach(function (p) {
      var tmp = document.createElement('div');
      tmp.innerHTML = p.body || '';
      var cur = null;            /* 当前 h2 */
      var curH3 = null;          /* 当前 h3（若是独立章节页） */
      var buf = {};              /* h2 id -> [node html] */
      var h3buf = {};            /* h2 id -> { h3id: [node html] } */
      Array.prototype.forEach.call(tmp.children, function (node) {
        if (node.tagName === 'H2') {
          cur = node.id || null; curH3 = null;
          if (cur) { buf[cur] = []; h3buf[cur] = h3buf[cur] || {}; }
          return;
        }
        if (node.tagName === 'H3') {
          /* 若该 h3 本身是独立章节页（书籍章节 bk-cN），单独切片 */
          if (cur && node.id && ALL_CHAP_IDS[node.id]) {
            curH3 = node.id;
            h3buf[cur][curH3] = [];
          } else { curH3 = null; }
          if (cur && buf[cur]) buf[cur].push(node.outerHTML);
          if (curH3) h3buf[cur][curH3].push(node.outerHTML);
          return;
        }
        if (cur && buf[cur]) buf[cur].push(node.outerHTML);
        if (curH3) h3buf[cur][curH3].push(node.outerHTML);
      });
      Object.keys(buf).forEach(function (k) {
        CHAPTER_HTML[p.id + '#' + k] = buf[k].join('');
      });
      Object.keys(h3buf).forEach(function (h2) {
        Object.keys(h3buf[h2]).forEach(function (h3) {
          CHAPTER_HTML[p.id + '#' + h3] = h3buf[h2][h3].join('');
        });
      });
    });
  }

  /* --------- 渲染 --------- */

  function railGroupHTML(g) {
    return '<button type="button" class="rail-group-head' + (g.cur ? ' current' : '') + (g.open ? ' open' : '') +
        '" data-page="' + esc(g.pageId) + '" style="--rc:' + esc(g.accent) + '"' +
        ' aria-expanded="' + (g.open ? 'true' : 'false') + '">' +
        '<span class="rail-dot"></span>' +
        '<span class="rail-name">' + esc(g.title) + '</span>' +
        '<span class="rail-count">' + g.count + '</span>' +
        '<svg class="rail-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
      '</button>' +
      '<div class="rail-chaps">' + g.items + '</div>';
  }

  function hit(item, q) {
    if (!q) return true;
    var zh = (item.zh || item.label || '').toLowerCase();
    var en = (item.en || '').toLowerCase();
    return zh.indexOf(q) !== -1 || en.indexOf(q) !== -1;
  }

  function renderRail(r, q) {
    if (!elRailBody) return;
    var html = '';
    OUTLINE.forEach(function (g) {
      var p = g.page;
      var rows = [];

      g.chapters.forEach(function (c) {
        var kids = c.kids || (CONCEPTS_BY_CHAP[p.id + '#' + c.id] || []);
        var isBook = !!c.kids;   /* 书籍部分：kids 是嵌套的子章节 */
        var chapHit = hit(c, q);
        var kidsHit = q ? kids.filter(function (k) { return hit(k, q); }) : kids;
        if (q && !chapHit && !kidsHit.length) return;   /* 自己没中、子项也没中，整节不显示 */

        var on = (p.id === r.id && c.id === r.chap && !r.slug);
        var href = '#/' + esc(p.id) + '/' + esc(c.id);

        /* 没有子内容的章节仍然是普通链接 */
        if (!kids.length) {
          rows.push('<a class="rail-chap' + (on ? ' active' : '') + '" href="' + href + '">' +
            esc(c.label) + '</a>');
          return;
        }

        /* 过滤时只展开命中的子项；纯章节名命中就只留章节本身，不铺开它的全部概念 */
        var show = kidsHit;
        var key = p.id + '#' + c.id;
        var open = q ? show.length > 0 : (on || !!CHAP_OPEN[key]);

        rows.push(
          '<div class="rail-chap-head' + (open ? ' open' : '') + '">' +
            '<a class="rail-chap-link' + (on ? ' active' : '') + '" href="' + href + '">' + esc(c.label) + '</a>' +
            '<span class="rail-chap-count">' + kids.length + '</span>' +
            '<button type="button" class="rail-chev-btn" data-chap="' + esc(key) + '"' +
              ' aria-expanded="' + (open ? 'true' : 'false') + '" aria-label="展开子章节">' +
              '<svg class="rail-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="rail-kids">' +
            (isBook
              ? show.map(function (k) {
                  var kon = (p.id === r.id && k.id === r.chap && !r.slug);
                  return '<a class="rail-chap rail-subchap' + (kon ? ' active' : '') + '"' +
                    ' href="#/' + esc(p.id) + '/' + esc(k.id) + '"' +
                    ' title="' + esc(k.label) + '"><span class="rc-zh">' + esc(k.label) + '</span></a>';
                }).join('')
              : show.map(function (k) {
                  var kon = (p.id === r.id && c.id === r.chap && k.slug === r.slug);
                  return '<a class="rail-chap rail-concept' + (kon ? ' active' : '') + '"' +
                    ' href="' + conceptHref(p.id, c.id, k.slug) + '"' +
                    ' title="' + esc(k.zh + (k.en ? ' · ' + k.en : '')) + '">' +
                    '<span class="rc-zh">' + esc(k.zh) + '</span>' +
                    (k.en ? '<span class="rc-en">' + esc(k.en) + '</span>' : '') +
                  '</a>';
                }).join('')) +
          '</div>'
        );
      });

      if (!rows.length) return;
      html += railGroupHTML({
        pageId: p.id,
        title: p.navLabel || p.title,
        accent: p.accent || '#64748b',
        count: g.chapters.length,
        cur: p.id === r.id,
        open: q ? true : (p.id === r.id || !!RAIL_OPEN[p.id]),
        items: rows.join('')
      });
    });
    elRailBody.innerHTML = html || '<p class="rail-empty">没有匹配的章节</p>';
  }

  function renderConcepts(r, q) {
    if (!elRailConcepts) return;
    var html = '';
    CONCEPT_GROUPS.forEach(function (g) {
      var items = g.items.filter(function (c) { return hit(c, q); });
      if (!items.length) return;
      html += railGroupHTML({
        pageId: g.pageId,
        title: g.title,
        accent: g.accent,
        count: items.length,
        cur: g.pageId === r.id,
        open: q ? true : (g.pageId === r.id || !!RAIL_OPEN[g.pageId]),
        items: items.map(function (c) {
          var kon = (g.pageId === r.id && c.slug === r.slug);
          /* href 指向独立页；data-anchor 留给滚动同步用（在体系长页上定位到那张卡） */
          return '<a class="rail-chap rail-concept' + (kon ? ' active' : '') + '"' +
            ' href="' + conceptHref(g.pageId, c.chap, c.slug) + '"' +
            ' data-anchor="c-' + c.idx + '"' +
            ' title="' + esc(c.zh + (c.en ? ' · ' + c.en : '')) + '">' +
            '<span class="rc-zh">' + esc(c.zh) + '</span>' +
            (c.en ? '<span class="rc-en">' + esc(c.en) + '</span>' : '') +
          '</a>';
        }).join('')
      });
    });
    elRailConcepts.innerHTML = html || '<p class="rail-empty">没有匹配的概念</p>';
  }

  function refreshRail() {
    var r = currentRoute();
    var q = (elRailFilter && elRailFilter.value ? elRailFilter.value : '').trim().toLowerCase();
    renderRail(r, q);
    renderConcepts(r, q);
    if (elRailPage) {
      var p = PAGE_BY_ID[r.id];
      var label = p ? (p.navLabel || p.title) : '细纲';
      if (r.chap) {
        var c = p && chapOf(p, r.chap);
        label += ' · ' + (c ? c.label : r.chap);
      }
      elRailPage.textContent = label;
    }
    collectSpy(r.id);
  }

  /* --------- 滚动同步：高亮当前所在的小节 / 概念卡 --------- */

  var spyTargets = [];
  var conceptTargets = [];

  function collectSpy(pageId) {
    spyTargets = [];
    conceptTargets = [];
    OUTLINE.forEach(function (g) {
      if (g.page.id !== pageId) return;
      g.chapters.forEach(function (c) {
        var node = document.getElementById(c.id);
        if (node) spyTargets.push({ id: c.id, el: node });
      });
    });
    CONCEPT_GROUPS.forEach(function (g) {
      if (g.pageId !== pageId) return;
      g.items.forEach(function (c) {
        var node = document.getElementById('c-' + c.idx);
        if (node) conceptTargets.push({ id: 'c-' + c.idx, el: node });
      });
    });
    markRailAnchor('', railTab === 'concepts' ? elRailConcepts : elRailBody);
  }

  function markRailAnchor(id, root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('.rail-chap'), function (a) {
      var on = !!id && a.getAttribute('data-anchor') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  var spyQueued = false;
  function syncSpy() {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(function () {
      spyQueued = false;
      var isC = railTab === 'concepts';
      var list = isC ? conceptTargets : spyTargets;
      var root = isC ? elRailConcepts : elRailBody;
      if (!list.length || !root) return;
      /* 以顶栏下方 28px 为判定线：最后一个越过该线的标题 / 卡片即当前项 */
      var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 60) + 28;
      var cur = '';
      for (var i = 0; i < list.length; i++) {
        if (list[i].el.getBoundingClientRect().top <= line) cur = list[i].id;
        else break;
      }
      markRailAnchor(cur, root);
    });
  }

  window.addEventListener('scroll', syncSpy, { passive: true });

  /* --------- 视图切换与过滤 --------- */

  function setRailTab(name) {
    railTab = name;
    var isOutline = name === 'outline';
    if (elRailBody) elRailBody.hidden = !isOutline;
    if (elRailConcepts) elRailConcepts.hidden = isOutline;
    if (elTabOutline) {
      elTabOutline.classList.toggle('active', isOutline);
      elTabOutline.setAttribute('aria-selected', isOutline ? 'true' : 'false');
    }
    if (elTabConcepts) {
      elTabConcepts.classList.toggle('active', !isOutline);
      elTabConcepts.setAttribute('aria-selected', isOutline ? 'false' : 'true');
    }
    syncSpy();
  }

  if (elTabOutline) elTabOutline.addEventListener('click', function () { setRailTab('outline'); });
  if (elTabConcepts) elTabConcepts.addEventListener('click', function () { setRailTab('concepts'); });

  if (elRailFilter) {
    elRailFilter.addEventListener('input', refreshRail);
    elRailFilter.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      elRailFilter.value = '';
      refreshRail();
      elRailFilter.blur();
    });
  }

  /* --------- 跳转与高亮 --------- */

  function flashTarget(el) {
    if (!el || !el.classList || !el.classList.contains('concept')) return;
    el.classList.remove('flash');
    void el.offsetWidth;                 /* 强制回流，让动画能重放 */
    el.classList.add('flash');
    setTimeout(function () { el.classList.remove('flash'); }, 1700);
  }

  if (elRailScroll) {
    elRailScroll.addEventListener('click', function (e) {
      /* 体系组头：折叠 / 切页 */
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

      /* 章节右侧的小箭头：就地摊开这一节的概念，不跳页 */
      var chev = e.target.closest('.rail-chev-btn');
      if (chev) {
        var box = chev.closest('.rail-chap-head');
        var willOpen = !box.classList.contains('open');
        box.classList.toggle('open', willOpen);
        chev.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        CHAP_OPEN[chev.getAttribute('data-chap')] = willOpen;
        return;
      }

      /* 其余都是指向独立页的普通链接，交给 hash 路由；移动端顺手收起抽屉 */
      if (e.target.closest('.rail-chap, .rail-chap-link')) closeRail();
    });
  }

  /* 章节页的「本节内容」：同一个页面内的锚点自己接管滚动，
     交回 hash 路由会整页重渲染再跳，视觉上会闪一下 */
  elContent.addEventListener('click', function (e) {
    var a = e.target.closest('.toc a[data-anchor]');
    if (!a) return;
    var r = currentRoute();
    if (a.getAttribute('href').indexOf('#/' + r.id + (r.chap ? '/' + r.chap : '') + '#') !== 0) return;
    var target = document.getElementById(a.getAttribute('data-anchor'));
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  /* #/id              体系页
     #/id/chap         章节页
     #/id/chap/slug    概念页
     另兼容早期写法 #/id#anchor（当页内锚点） */
  function currentRoute() {
    var raw = (location.hash || '').replace(/^#\/?/, '');

    var legacy = '';
    var h = raw.indexOf('#');
    if (h !== -1) { legacy = raw.slice(h + 1); raw = raw.slice(0, h); }

    var parts = raw.split('/').filter(function (s) { return !!s; });
    return {
      id: parts[0] || 'overview',
      chap: parts[1] ? safeDecode(parts[1]) : '',
      slug: parts[2] ? safeDecode(parts[2]) : '',
      anchor: parts[2] ? '' : legacy
    };
  }

  function route() {
    var r = currentRoute();
    /* 切换页面前先销毁上一页挂载的图表实例，避免轻量图表实例 / ResizeObserver 泄漏 */
    if (CHART && CHART.destroyAll) CHART.destroyAll();
    closeRail();

    if (r.chap && r.slug) { renderConceptPage(r); window.scrollTo({ top: 0, behavior: 'auto' }); return; }
    if (r.chap) {
      renderChapterPage(r);
      /* 章节页也支持 #/体系/章节#小节锚点（「本节内容」目录点进来的） */
      if (r.anchor) {
        var sec = document.getElementById(r.anchor);
        if (sec) {
          requestAnimationFrame(function () {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    var p = PAGE_BY_ID[r.id] || SITE.overview;
    renderPage(p);

    if (r.anchor) {
      var target = document.getElementById(r.anchor);
      if (target) {
        requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          flashTarget(target);
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
            link: bucket.id ? '#/' + p.id + '/' + bucket.id : '',
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

    /* 正文里的概念卡也进索引，搜「弹簧」「公允价值缺口」这类词才找得到 */
    CONCEPTS.forEach(function (c) {
      INDEX.push({
        pageId: c.pageId,
        pageTitle: c.pageTitle,
        anchor: 'c-' + c.idx,
        link: (c.chap && c.slug) ? '#/' + c.pageId + '/' + c.chap + '/' + encodeURIComponent(c.slug) : '',
        heading: c.zh + (c.en ? ' · ' + c.en : ''),
        text: c.desc + '（' + c.pageTitle + ' · 概念卡）'
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
      var href = it.link || ('#/' + it.pageId + (it.anchor ? '#' + it.anchor : ''));
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
  collectConcepts();
  buildChapIndex();
  sliceChapters();
  buildIndex();
  route();
})();
