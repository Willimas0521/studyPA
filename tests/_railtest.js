/* _railtest.js — 校验四级可折叠目录渲染 + 节锚点路由（读真实 href）
   用法: node tests/_railtest.js */
const path = require('path');
let puppeteer = null;
try { puppeteer = require('puppeteer-core'); }
catch (e) { puppeteer = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core'); }
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');

const errors = [];
function assert(cond, msg) { if (!cond) errors.push('FAIL: ' + msg); else console.log('PASS: ' + msg); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push('console.error: ' + m.text()); });

  await page.goto(base + '#/wyckoff', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  for (let i = 0; i < 10; i++) {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.rail-chev-btn'));
      let n = 0; btns.forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') { b.click(); n++; } });
      return n;
    });
    await new Promise(r => setTimeout(r, 120));
    if (clicked === 0) break;
  }
  await new Promise(r => setTimeout(r, 300));

  const rail = await page.evaluate(() => {
    const heads = Array.from(document.querySelectorAll('.rail-chap-head'));
    const lv = (cls) => heads.filter(h => h.classList.contains(cls)).length;
    // 正确的层级链检查：lv1 的【下一个兄弟】.rail-kids 里含 lv2；lv2 的兄弟 .rail-kids 里含 lv-sec
    function hasChain() {
      for (const h of heads) {
        if (!h.classList.contains('rail-lv1')) continue;
        const kids = h.nextElementSibling;
        if (!kids || !kids.classList.contains('rail-kids')) continue;
        const lv2 = kids.querySelector('.rail-chap-head.rail-lv2');
        if (!lv2) continue;
        const k2 = lv2.nextElementSibling;
        if (!k2 || !k2.classList.contains('rail-kids')) continue;
        if (k2.querySelector('.rail-subchap.rail-lv-sec')) return true;
      }
      return false;
    }
    const secLink = document.querySelector('.rail-subchap.rail-lv-sec');
    return {
      lv0: lv('rail-lv0'), lv1: lv('rail-lv1'), lv2: lv('rail-lv2'),
      sec: document.querySelectorAll('.rail-subchap.rail-lv-sec').length,
      chain: hasChain(),
      secHref: secLink ? secLink.getAttribute('href') : null,
      // 找一个 direct-under-part（href 形如 #/wyckoff/bk-pN#bk-hXXX，且章节是 bk-p\d）
      directHref: (function () {
        const a = Array.from(document.querySelectorAll('.rail-subchap.rail-lv-sec'))
          .find(x => /^#\/wyckoff\/bk-p\d+#bk-h\d+$/.test(x.getAttribute('href') || ''));
        return a ? a.getAttribute('href') : null;
      })(),
    };
  });
  console.log('\n[Rail 展开后]', JSON.stringify(rail, null, 2));
  assert(rail.lv0 > 0, '存在书级节点 rail-lv0 (实测 ' + rail.lv0 + ')');
  assert(rail.lv1 >= 8, '威科夫至少 8 个部 rail-lv1 (实测 ' + rail.lv1 + ')');
  assert(rail.lv2 > 0, '存在章级节点 rail-lv2 (实测 ' + rail.lv2 + ')');
  assert(rail.sec > 0, '存在节级节点 rail-lv-sec (实测 ' + rail.sec + ')');
  assert(rail.chain, '层级链 部(lv1)→章(lv2)→节(lv-sec) 成立（四级嵌套）');
  assert(rail.secHref && /#\/wyckoff\/[^#]+#bk-/.test(rail.secHref), '节链接形如 #/wyckoff/<chap>#<sec>: ' + rail.secHref);

  // 2) 点进真实节链接，验证章节页渲染该节 + 侧栏高亮
  if (rail.secHref) {
    await page.goto(base + rail.secHref, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 900));
    const t = await page.evaluate((href) => {
      const id = href.split('#').pop();
      const sec = document.getElementById(id);
      const active = document.querySelector('.rail-subchap.rail-lv-sec.active');
      return { id, secExists: !!sec, secText: sec ? sec.textContent.trim().slice(0, 36) : null,
        activeHref: active ? active.getAttribute('href') : null };
    }, rail.secHref);
    console.log('\n[真实节链接]', JSON.stringify(t));
    assert(t.secExists, '章节页渲染出目标节 ' + t.id);
    assert(t.activeHref === rail.secHref, '侧栏高亮该节 active');
  }

  // 3) 部直属节（direct-under-part）路由：bk-h54 直属 bk-p5（href 形如 #/wyckoff/bk-p5#bk-h54）
  const dpHref = '#/wyckoff/bk-p5#bk-h54';
  await page.goto(base + dpHref, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  const dp = await page.evaluate((href) => {
    const id = href.split('#').pop();
    const sec = document.getElementById(id);
    const link = Array.from(document.querySelectorAll('.rail-subchap')).find(a => a.getAttribute('href') === href);
    return { id, secExists: !!sec, secText: sec ? sec.textContent.trim().slice(0, 30) : null, linkActive: link ? link.classList.contains('active') : 'no-link' };
  }, dpHref);
  console.log('\n[部直属节 bk-p5#bk-h54]', JSON.stringify(dp));
  assert(dp.secExists, '部直属节 bk-h54 也能路由并渲染');
  assert(dp.linkActive === true, '部直属节 bk-h54 侧栏高亮 active');

  if (jsErrors.length) { errors.push('JS ERROR: ' + jsErrors.join(' | ')); console.log('\nJS ERRORS:\n' + jsErrors.join('\n')); }
  else console.log('\n无 JS 运行时报错');

  await browser.close();
  console.log('\n==== RAIL TEST ' + (errors.length ? 'FAILED (' + errors.length + ')' : 'PASSED') + ' ====');
  if (errors.length) { errors.forEach(e => console.log('  ' + e)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(2); });
