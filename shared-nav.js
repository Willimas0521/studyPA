/**
 * shared-nav.js — 统一导航组件（列表格式 + 大字体）
 * 所有页面共享用的 header + sidebar 渲染器
 *
 * 用法:
 *   <div id="nav-header"></div>
 *   <div id="nav-sidebar"></div>
 *   <div id="root">...</div>
 *   <script src="shared-nav.js"></script>
 *   <script>renderPageNav({ callbacks: { wrong: fn, ach: fn } })</script>
 *
 * 不传 callbacks 时，所有导航项均为 <a> 链接。
 * 传 callbacks 时，对应项变为 <button>，点击执行回调（用于 index.html 的模态框）。
 */

var NAV_ITEMS = [
  { divider: true, groupLabel: '\u5B66\u4E60' },
  { id: 'course',  icon: '\uD83C\uDF93', label: '\u8BFE\u7A0B\u5B66\u4E60', href: 'courses.html' },
  { id: 'trader',  icon: '\uD83D\uDC51', label: '\u9876\u7EA7\u4EA4\u6613\u5458', href: '#' },
  { id: 'books',   icon: '\uD83D\uDCDA', label: '\u4E66\u7C4D\u5B66\u4E60',   href: '#' },
  { id: 'kline',   icon: '\uD83D\uDCC8', label: 'K\u7EBF\u5B66\u4E60',      href: '#' },
  { id: 'pattern', icon: '\uD83D\uDD37', label: '\u5F62\u6001\u5B66\u4E60',  href: 'codex.html' },
  { id: 'strategy',icon: '\u2694\uFE0F', label: '\u6218\u6CD5\u5B66\u4E60',  href: '#' }
];

var SAVE_KEY = 'pa_quest_save';
var SIDEBAR_WIDTH = 180;

function _loadState() {
  try { var s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; }
  catch (e) { return null; }
}

function _currentPageId() {
  var path = window.location.pathname;
  var file = path.split('/').pop().toLowerCase();
  if (!file || file === '' || file === 'index.html' || file === 'studyPA' || file === 'studyPA/') return 'index';
  return file.replace('.html', '');
}

/**
 * 渲染 header + sidebar
 * @param {Object} [opts]
 * @param {Object} [opts.callbacks] - { wrong: fn, ach: fn, cert: fn } 可选，用于 index.html 模态框
 */
function renderPageNav(opts) {
  opts = opts || {};
  var callbacks = opts.callbacks || null;
  var state = _loadState();
  var currentPage = _currentPageId();
  var xp = state ? (state.xp || 0) : 0;
  var level = Math.floor(xp / 500) + 1;
  var xpPct = Math.min(100, (xp % 500) / 5);
  var wrongCount = state ? Object.keys(state.wrong || {}).length : 0;
  var allClear = state ? Object.keys(state.stars || {}).length >= 54 : false;

  /* ---- Header ---- */
  var headerEl = document.getElementById('nav-header');
  if (headerEl) {
    headerEl.className = 'nav-header';
    headerEl.innerHTML =
      '<div class="nav-header-left">' +
        '<span class="nav-logo">\uD83D\uDD25</span>' +
        '<span class="nav-title">\u8BA4\u771F\u4EA4\u6613</span>' +
      '</div>' +
      '<div class="nav-header-right">' +
        '<div class="nav-xp-badge">' +
          '<span class="nav-xp-level">Lv.' + level + '</span>' +
          '<div class="nav-xp-bar"><div class="nav-xp-fill" id="nav-xp-fill" style="width:' + xpPct + '%"></div></div>' +
          '<span class="nav-xp-num">' + xp + ' XP</span>' +
        '</div>' +
      '</div>';
  }

  /* ---- Sidebar ---- */
  var sidebarEl = document.getElementById('nav-sidebar');
  if (sidebarEl) {
    sidebarEl.className = 'nav-sidebar';

    var html = '';
    NAV_ITEMS.forEach(function (item) {
      if (item.divider) {
        if (item.groupLabel) {
          html += '<div class="nav-group-label">' + item.groupLabel + '</div>';
        } else {
          html += '<div class="nav-divider"></div>';
        }
        return;
      }
      if (item.hiddenUnlessAllClear && !allClear) return;

      var isActive = (item.id === currentPage);
      var cls = 'nav-item' + (isActive ? ' active' : '');

      var badgeHtml = '';
      if (item.badge === 'wrong' && wrongCount > 0) {
        badgeHtml = '<span class="nav-badge" id="nav-wrong-badge">' + wrongCount + '</span>';
      }

      /* 有回调 → 用 button（index.html 模态框场景） */
      if (callbacks && callbacks[item.id]) {
        html += '<button class="' + cls + '" data-nav="' + item.id + '">' +
          '<span class="nav-item-icon">' + item.icon + '</span>' +
          '<span class="nav-item-label">' + item.label + '</span>' +
          badgeHtml +
        '</button>';
      } else {
        html += '<a class="' + cls + '" href="' + item.href + '">' +
          '<span class="nav-item-icon">' + item.icon + '</span>' +
          '<span class="nav-item-label">' + item.label + '</span>' +
          badgeHtml +
        '</a>';
      }
    });
    sidebarEl.innerHTML = html;

    /* 绑定回调按钮 */
    if (callbacks) {
      sidebarEl.querySelectorAll('button[data-nav]').forEach(function (btn) {
        var id = btn.getAttribute('data-nav');
        if (callbacks[id]) btn.addEventListener('click', callbacks[id]);
      });
    }
  }
}

/**
 * 更新 XP 显示（供页面内部调用，如答题后更新）
 */
function updateNavXP(xp) {
  var fill = document.getElementById('nav-xp-fill');
  if (fill) {
    fill.style.width = Math.min(100, (xp % 500) / 5) + '%';
  }
  var bar = document.getElementById('nav-header');
  if (bar) {
    var lvl = bar.querySelector('.nav-xp-level');
    var num = bar.querySelector('.nav-xp-num');
    if (lvl) lvl.textContent = 'Lv.' + (Math.floor(xp / 500) + 1);
    if (num) num.textContent = xp + ' XP';
  }
}

/**
 * 更新错题数 badge
 */
function updateNavWrongBadge(count) {
  var badge = document.getElementById('nav-wrong-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}
