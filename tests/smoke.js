/* 运行时冒烟测试：用 jsdom 真实执行 index.html + 四个脚本，捕获运行时错误 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const jsdomPath = process.argv[3];

const { JSDOM } = require(jsdomPath);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let bad = 0, warn = 0;
const fail = (m) => { console.log('  ✗ ' + m); bad++; };
const ok = (m) => console.log('  ✓ ' + m);
const note = (m) => { console.log('  ! ' + m); warn++; };

const errors = [];
const dom = new JSDOM(read('index.html'), {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = dom;
window.addEventListener('error', (e) => errors.push('window error: ' + e.message));

/* 捕获 console.error */
const origErr = console.error;
console.error = (...a) => { errors.push('console.error: ' + a.join(' ')); };

const scripts = ['data/theories.js', 'data/glossary.js', 'assets/chart.js', 'assets/app.js'];
try {
  scripts.forEach((f) => window.eval(read(f)));
  ok('四个脚本全部执行完成，无异常抛出');
} catch (e) {
  fail('脚本执行抛出异常: ' + e.message + '\n     ' + (e.stack || '').split('\n')[1]);
}

const doc = window.document;
const SITE = window.SITE;
const CHART = window.ChartModule;

console.log('\n【初始渲染】');
const content = doc.getElementById('content');
if (content && content.innerHTML.length > 500) ok('#content 已渲染 (' + content.innerHTML.length + ' 字符)');
else fail('#content 未渲染');

/* 主导航已并入细纲：组数应覆盖 10 个页面（概览 / 五体系 / 对比 / 图层图 / 术语 / 路径） */
const railGroups = doc.querySelectorAll('#railBody .rail-group-head');
if (railGroups.length >= 10) ok('细纲导航生成 ' + railGroups.length + ' 个组，已接管主导航');
else fail('细纲组数偏少: ' + railGroups.length);

if (!doc.getElementById('sidebar') && !doc.getElementById('nav')) ok('旧侧边栏已移除');
else fail('侧边栏残留');

const ghLink = doc.querySelector('.rail-ext[href*="github.com"]');
if (ghLink) ok('细纲底部保留 GitHub 入口: ' + ghLink.textContent.trim());
else fail('GitHub 入口丢失');

if (doc.querySelectorAll('#overviewCards .card').length === 5) ok('概览页 5 张体系卡片已生成');
else fail('概览页卡片数异常: ' + doc.querySelectorAll('#overviewCards .card').length);

if (doc.querySelectorAll('.callout .callout-icon').length > 0) ok('提示块图标已注入');
else fail('提示块图标未注入');

if (doc.title.includes('交易理论图谱')) ok('标题已设置: ' + doc.title);
else fail('标题异常: ' + doc.title);

/* ---------- 逐页渲染测试 ---------- */
console.log('\n【逐页渲染】');
const mnt = doc.createElement('div');
doc.body.appendChild(mnt);

SITE.pages.forEach((p) => {
  try {
    mnt.innerHTML = p.body;
    CHART.mountDiagrams(mnt);
    CHART.mountInteractive(mnt);

    let msg = p.id + '  ' + p.body.length + ' 字符';

    const diagrams = mnt.querySelectorAll('.diagram[data-diagram]');
    diagrams.forEach((d) => {
      const svg = d.querySelector('svg');
      if (!svg) throw new Error('示意图未生成: ' + d.getAttribute('data-diagram'));
      msg += ' | svg ' + svg.getAttribute('viewBox');
    });

    if (p.id === 'chart') {
      const w = mnt.querySelector('.chart-widget');
      if (!w) throw new Error('交互组件未挂载');
      const svg = mnt.querySelector('.cw-canvas svg');
      if (!svg) throw new Error('交互图 SVG 未生成');
      const btns = mnt.querySelectorAll('.layer-btn[data-l]');
      if (btns.length !== 6) throw new Error('图层按钮数 ' + btns.length + ' ≠ 6');
      const allBtn = mnt.querySelector('.layer-btn[data-all]');
      if (!allBtn) throw new Error('缺少全部开关按钮');
      const pressed = mnt.querySelectorAll('.layer-btn[data-l][aria-pressed="true"]');
      if (pressed.length !== 2) throw new Error('默认开启图层数 ' + pressed.length + ' ≠ 2');
      const legend = mnt.querySelector('.cw-legend').innerHTML;
      if (legend.length < 50) throw new Error('图例为空');
      // 交互：点第一个关闭的图层按钮
      const off = mnt.querySelector('.layer-btn[data-l][aria-pressed="false"]');
      const before = mnt.querySelectorAll('.cw-canvas g[data-layer]').length;
      off.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      const after = mnt.querySelectorAll('.cw-canvas g[data-layer]').length;
      if (after !== before + 1) throw new Error('点击图层按钮未生效 ' + before + '→' + after);
      msg += ' | 图层 ' + before + '→' + after + ' 切换正常';

      // 全部打开，检查收敛区
      allBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      const all = mnt.querySelectorAll('.cw-canvas g[data-layer]').length;
      const hasConv = mnt.querySelector('.cw-canvas svg').textContent.includes('五个体系共同指向的区域');
      if (all !== 6) throw new Error('全部打开后图层数 ' + all);
      if (!hasConv) throw new Error('多图层收敛区标注缺失');
      if (allBtn.textContent !== '全部关闭') throw new Error('全部开关文案未切换');
      msg += ' | 全开 ' + all + ' 层 + 收敛标注 ✓';

      // 全部关闭 + 空态图例
      allBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      if (mnt.querySelectorAll('.cw-canvas g[data-layer]').length !== 0) throw new Error('全部关闭未生效');
      if (!mnt.querySelector('.cw-legend').textContent.includes('所有图层已关闭')) throw new Error('空态图例缺失');
      msg += ' | 全关空态 ✓';
      allBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

      // 蜡烛数量
      const candles = mnt.querySelectorAll('.cw-canvas rect.candle-up, .cw-canvas rect.candle-down').length;
      msg += ' | 蜡烛/量柱 ' + candles + ' 个';
    }

    if (p.id === 'glossary') {
      msg += ' | 术语条目由真实路由校验';
    }

    console.log('  ✓ ' + msg);
  } catch (e) {
    fail(p.id + ' → ' + e.message);
  }
});

/* ---------- 交互测试 ---------- */
console.log('\n【交互】');

/* 主题切换 */
const html0 = doc.documentElement.getAttribute('data-theme');
doc.getElementById('themeBtn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const html1 = doc.documentElement.getAttribute('data-theme');
if (html0 !== html1) ok('主题切换正常: ' + html0 + ' → ' + html1);
else fail('主题切换无效');

/* 搜索 */
const si = doc.getElementById('searchInput');
const sr = doc.getElementById('searchResults');
si.value = 'FVG';
si.dispatchEvent(new window.Event('input', { bubbles: true }));
if (!sr.hidden && sr.innerHTML.includes('FVG')) {
  const n = sr.querySelectorAll('.sr-item').length;
  ok('搜索「FVG」命中 ' + n + ' 条，且高亮正常');
} else fail('搜索「FVG」无结果');

si.value = '弹簧';
si.dispatchEvent(new window.Event('input', { bubbles: true }));
if (!sr.hidden && sr.querySelectorAll('.sr-item').length > 0) ok('中文搜索「弹簧」命中 ' + sr.querySelectorAll('.sr-item').length + ' 条');
else fail('中文搜索失败');

si.value = 'zzzz不存在zzzz';
si.dispatchEvent(new window.Event('input', { bubbles: true }));
if (sr.innerHTML.includes('没有找到')) ok('无结果时的空状态正常');
else fail('空状态异常');

/* 路由：jsdom 不会因赋值 hash 自动派发 hashchange，需手动派发 */
function go(id) {
  window.location.hash = '#/' + id;
  window.dispatchEvent(new window.Event('hashchange'));
}

const missed = [];
SITE.pages.forEach((p) => {
  try {
    go(p.id);
    const h1 = doc.getElementById('content').querySelector('h1');
    if (!h1) { missed.push(p.id + '(无 h1)'); return; }
    if (h1.textContent.trim() !== p.title) missed.push(p.id + '(h1=' + h1.textContent.trim() + ')');
    if (doc.title.indexOf(p.title) === -1) missed.push(p.id + '(标题未更新)');
  } catch (e) { missed.push(p.id + '(' + e.message + ')'); }
});
if (!missed.length) ok('全部 ' + SITE.pages.length + ' 个路由渲染正确，且标题同步更新');
else fail('路由渲染失败: ' + missed.join(', '));

/* 术语页（走真实路由后检查） */
go('glossary');
const glItems = doc.querySelectorAll('#content .gl-item').length;
const glGroups = doc.querySelectorAll('#content .glossary').length;
if (glItems === 67) ok('术语页渲染 ' + glItems + ' 条 / ' + glGroups + ' 组');
else fail('术语条目 ' + glItems + ' ≠ 67');

/* 章节锚点 */
go('ict');
const anchors = SITE.theories.filter((t) => t.id === 'ict')[0].chapters.map((c) => c.id);
const missing = anchors.filter((a) => !doc.getElementById(a));
if (!missing.length) ok('理论页章节锚点全部可定位 (' + anchors.length + ' 个)');
else fail('章节锚点缺失: ' + missing.join(', '));

/* 目录链接可达性 */
const tocLinks = doc.querySelectorAll('#content .toc a[data-anchor]');
const badToc = Array.prototype.filter.call(tocLinks, (a) => !doc.getElementById(a.getAttribute('data-anchor')));
if (tocLinks.length && !badToc.length) ok('目录 ' + tocLinks.length + ' 个链接全部有对应锚点');
else if (badToc.length) fail('目录链接无锚点: ' + badToc.length);

/* 体系卡片跳转 */
go('overview');
const cards = doc.querySelectorAll('#overviewCards .card');
if (cards.length === 5 && cards[0].getAttribute('href') === '#/price-action') ok('概览卡片链接正确');
else fail('概览卡片链接异常');

/* ---------- 细纲导航（rail）---------- */
console.log('\n【细纲导航】');

const railBody = doc.getElementById('railBody');
const railPage = doc.getElementById('railPage');

if (railBody && doc.getElementById('rail')) ok('细纲容器 #rail 已就位');
else fail('细纲容器 #rail / #railBody 缺失');

/* 当前体系：组头高亮 + 默认展开 + 章节数与元数据一致 */
go('wyckoff');
const curHead = doc.querySelector('#railBody .rail-group-head.current');
const wyckoffChaps = SITE.theories.filter((t) => t.id === 'wyckoff')[0].chapters.length;
/* 章节项可能是可展开的 button（有概念卡），也可能是普通链接（没有）；只数直接子元素，不含展开出来的概念 */
const curChapLinks = doc.querySelectorAll('#railBody .rail-group-head.current + .rail-chaps > .rail-chap');

if (curHead && curHead.getAttribute('data-page') === 'wyckoff') ok('当前体系组头已高亮');
else fail('当前体系组头未高亮');

if (curChapLinks.length === wyckoffChaps) ok('当前体系展开 ' + curChapLinks.length + ' 节，与 chapters 元数据一致');
else fail('当前体系章节数 ' + curChapLinks.length + ' ≠ ' + wyckoffChaps);

if (doc.querySelectorAll('#railBody .rail-group-head.open').length === 1) ok('默认只展开当前所在体系');
else fail('默认展开数异常: ' + doc.querySelectorAll('#railBody .rail-group-head.open').length);

if (railPage && railPage.textContent.indexOf('威科夫') !== -1) ok('细纲页头同步: ' + railPage.textContent);
else fail('细纲页头未同步: ' + (railPage && railPage.textContent));

/* 章节链接格式必须能跨页定位： #/page#anchor （anchor 含中文组名，如术语页 g-流动性） */
const badHref = Array.prototype.filter.call(
  doc.querySelectorAll('#railBody .rail-chap[href]'),
  (a) => !/^#\/[a-z-]+#[^#]+$/.test(a.getAttribute('href'))
);
if (!badHref.length) ok('章节链接格式全部正确（' + doc.querySelectorAll('#railBody .rail-chap[href]').length + ' 条）');
else fail('章节链接格式异常: ' + badHref.length + ' 个');

/* ---------- 章节可展开：露出该节下的概念卡 ---------- */
const chapHeads = doc.querySelectorAll('#railBody .rail-chap-head');
let kidTotal = 0;
const badKid = [];
Array.prototype.forEach.call(chapHeads, (h) => {
  const kids = h.nextElementSibling.querySelectorAll('.rail-concept');
  kidTotal += kids.length;
  Array.prototype.forEach.call(kids, (k) => {
    if (!/^#\/[a-z-]+#c-\d+$/.test(k.getAttribute('href'))) badKid.push(k.getAttribute('href'));
  });
});
if (kidTotal === 84) ok('章节树里挂载了全部 84 张概念卡（分布在 ' + chapHeads.length + ' 个章节下）');
else fail('章节树子项 ' + kidTotal + ' ≠ 84');
if (!badKid.length) ok('章节树内的概念链接格式全部正确');
else fail('章节树概念链接异常: ' + badKid.length);

/* 展开 / 收起 */
go('wyckoff');
const firstHead = doc.querySelector('#railBody .rail-chap-head');
const firstKids = firstHead.nextElementSibling.querySelectorAll('.rail-concept').length;
firstHead.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
if (firstHead.classList.contains('open') && firstHead.getAttribute('aria-expanded') === 'true') {
  ok('点章节展开（该节 ' + firstKids + ' 张概念卡）');
} else fail('章节展开失败');
firstHead.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
if (!firstHead.classList.contains('open')) ok('再点章节收起');
else fail('章节收起失败');

/* 展开状态在切页后保持 */
firstHead.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
go('ict');
go('wyckoff');
const kept = doc.querySelector('#railBody .rail-chap-head');
if (kept.classList.contains('open')) ok('切页回来后展开状态保持');
else fail('展开状态未保持');

/* 每套体系的章节锚点在各自页面都能定位（跨页点进去不会落空） */
const dangling = [];
SITE.theories.forEach((t) => {
  const live = {};
  go(t.id);
  doc.querySelectorAll('#railBody .rail-group-head.current + .rail-chaps .rail-chap').forEach((a) => {
    const id = a.getAttribute('data-anchor');
    if (!doc.getElementById(id)) live[id] = 1;
  });
  Object.keys(live).forEach((id) => dangling.push(t.id + '#' + id));
});
if (!dangling.length) ok('五套体系的细纲锚点在各自页面全部可定位');
else fail('细纲锚点落空: ' + dangling.join(', '));

/* 点其它体系的组头 → 切页并自动展开 */
go('wyckoff');
const ictHead = Array.prototype.filter.call(
  doc.querySelectorAll('#railBody .rail-group-head'),
  (h) => h.getAttribute('data-page') === 'ict'
)[0];
ictHead.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
window.dispatchEvent(new window.Event('hashchange'));
const nowHead = doc.querySelector('#railBody .rail-group-head.current');
if (nowHead && nowHead.getAttribute('data-page') === 'ict' && doc.getElementById('content').querySelector('h1').textContent.trim() === 'ICT') {
  ok('点其它体系组头 → 切页并展开该体系');
} else fail('点组头切页失败');

/* 再点当前体系的组头 → 只做折叠 */
nowHead.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
if (!nowHead.classList.contains('open') && doc.querySelector('#content').querySelector('h1').textContent.trim() === 'ICT') {
  ok('点当前体系组头 → 折叠，且不跳页');
} else fail('当前体系组头折叠行为异常');

/* 顶栏的细纲开关（窄屏抽屉入口） */
const railBtn = doc.getElementById('railBtn');
if (railBtn) {
  railBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const opened = doc.getElementById('rail').classList.contains('open');
  railBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const closed = !doc.getElementById('rail').classList.contains('open');
  if (opened && closed) ok('窄屏细纲抽屉可开可关');
  else fail('细纲抽屉开关异常: open=' + opened + ' close=' + closed);
} else fail('#railBtn 缺失');

/* ---------- 细纲 · 概念视图 ---------- */
console.log('\n【细纲 · 概念视图】');

const railC = doc.getElementById('railConcepts');
const tabC = doc.getElementById('tabConcepts');
const tabO = doc.getElementById('tabOutline');
const railFilter = doc.getElementById('railFilter');

if (railC && tabC && tabO && railFilter) ok('概念视图的容器 / Tab / 过滤框都已就位');
else fail('概念视图缺少元素');

go('price-action');
const cGroups = doc.querySelectorAll('#railConcepts .rail-group-head');
const cLinks = doc.querySelectorAll('#railConcepts .rail-chap.rail-concept');
if (cLinks.length === 84) ok('概念索引收录 ' + cLinks.length + ' 张卡，分布在 ' + cGroups.length + ' 个体系组');
else fail('概念条目 ' + cLinks.length + ' ≠ 84');

const allCards = doc.querySelectorAll('#content .concept');
const withId = doc.querySelectorAll('#content .concept[id^="c-"]');
if (withId.length > 0 && withId.length === allCards.length) ok('正文概念卡已注入锚点 id（' + withId.length + ' 张）');
else fail('概念卡锚点注入不全: ' + withId.length + '/' + allCards.length);

/* 跨页可达：每条概念链接指向的 id，在其所属页面渲染后都应存在 */
const cBad = [];
const byPage = {};
Array.prototype.forEach.call(cLinks, (a) => {
  const m = /^#\/([a-z-]+)#(c-\d+)$/.exec(a.getAttribute('href'));
  if (!m) { cBad.push(a.getAttribute('href')); return; }
  (byPage[m[1]] = byPage[m[1]] || []).push(m[2]);
});
Object.keys(byPage).forEach((pid) => {
  go(pid);
  byPage[pid].forEach((id) => { if (!doc.getElementById(id)) cBad.push(pid + '#' + id); });
});
if (!cBad.length) ok('全部 ' + cLinks.length + ' 条概念链接跨页可达');
else fail('概念锚点落空: ' + cBad.slice(0, 5).join(', '));

const withEn = doc.querySelectorAll('#railConcepts .rail-concept .rc-en');
if (withEn.length > 40) ok('概念条目带英文对照 ' + withEn.length + '/84 条（其余卡片本身未写英文名）');
else note('英文对照偏少: ' + withEn.length);

/* Tab 切换 */
go('price-action');
tabC.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
if (railC.hidden === false && doc.getElementById('railBody').hidden === true && tabC.classList.contains('active')) {
  ok('切到「概念」：章节列表隐藏、概念列表显示');
} else fail('概念视图切换异常');
tabO.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
if (railC.hidden === true && doc.getElementById('railBody').hidden === false) ok('切回「章节」正常');
else fail('切回章节视图异常');

/* 过滤 */
tabC.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
railFilter.value = '弹簧';
railFilter.dispatchEvent(new window.Event('input', { bubbles: true }));
const filtered = doc.querySelectorAll('#railConcepts .rail-chap.rail-concept').length;
if (filtered > 0 && filtered < 84) ok('过滤「弹簧」后收敛到 ' + filtered + ' 条');
else fail('概念过滤未生效: ' + filtered);

railFilter.value = '';
railFilter.dispatchEvent(new window.Event('input', { bubbles: true }));
if (doc.querySelectorAll('#railConcepts .rail-chap.rail-concept').length === 84) ok('清空过滤后恢复全部');
else fail('清空过滤未恢复');

/* 章节视图同样可过滤（章节标签是中文，按中文词匹配） */
const chapItemSel = '#railBody .rail-chap-head, #railBody a.rail-chap:not(.rail-concept)';
const chapItemAll = doc.querySelectorAll(chapItemSel).length;
railFilter.value = '误区';
railFilter.dispatchEvent(new window.Event('input', { bubbles: true }));
const fChap = doc.querySelectorAll(chapItemSel).length;
if (fChap > 0 && fChap < chapItemAll) ok('章节视图过滤「误区」收敛到 ' + fChap + ' 条（共 ' + chapItemAll + '）');
else fail('章节过滤未生效: ' + fChap + '/' + chapItemAll);
railFilter.value = '';
railFilter.dispatchEvent(new window.Event('input', { bubbles: true }));

/* 概念卡也进了顶栏全文搜索 */
si.value = '订单块';
si.dispatchEvent(new window.Event('input', { bubbles: true }));
const hitC = Array.prototype.filter.call(
  sr.querySelectorAll('.sr-item'),
  (a) => (a.getAttribute('href') || '').indexOf('#c-') !== -1
).length;
if (hitC > 0) ok('顶栏搜索可命中具体概念卡（' + hitC + ' 条结果落到卡片）');
else fail('概念卡未进搜索索引');

/* ---------- 资源引用检查 ---------- */
console.log('\n【资源引用】');
const htmlSrc = read('index.html');
['assets/style.css', 'assets/app.js', 'assets/chart.js', 'data/theories.js', 'data/glossary.js']
  .forEach((f) => {
    if (!htmlSrc.includes(f)) fail('index.html 未引用 ' + f);
    if (!fs.existsSync(path.join(root, f))) fail('文件不存在: ' + f);
  });
ok('所有引用的文件均存在');

const css = read('assets/style.css');
['.hero', '.concept', '.callout', '.step', '.table-wrap', '.gl-item', '.layer-btn',
 '.cw-canvas', '.sr-item', '.toc', '.card', '.rail', '.rail-group-head', '.rail-foot',
 '.rail-tab', '.rail-filter', '.rail-concept', '.rail-chap', '.rail-chap-head', '.rail-kids',
 '[data-theme="dark"]', '@media print']
  .forEach((sel) => { if (!css.includes(sel)) note('CSS 缺少选择器 ' + sel); });
ok('CSS 关键选择器检查完成');

console.error = origErr;
/* jsdom 未实现 scrollTo 等浏览器 API，属测试环境限制，不计为失败 */
const real = errors.filter((e) => !/Not implemented:/.test(e));
if (real.length) {
  console.log('\n【运行时错误】');
  real.forEach((e) => fail(e));
}
const envOnly = errors.length - real.length;
if (envOnly) console.log('\n  (忽略 ' + envOnly + ' 条 jsdom 未实现的浏览器 API 调用)');

console.log('\n' + (bad ? '>>> 失败 ' + bad + ' 项' + (warn ? '，警告 ' + warn + ' 项' : '') : '>>> 全部通过' + (warn ? '（' + warn + ' 项警告）' : '')));
process.exit(bad ? 1 : 0);
