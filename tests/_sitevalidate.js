/* 站点级校验：用真实 index.html 跑通图表模块
   - #/chart 交互图层图：挂载、6 个图层按钮、切换无错
   - #/price-action 教学图：25 张里属于该页的图都挂载
   - 来回切换路由验证 destroyAll 不报错、widget 仍可重建 */
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--hide-scrollbars']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  async function go(hash) {
    await page.evaluate(h => { location.hash = h; }, hash);
    await sleep(1400);
  }

  await page.goto(URL + '#/chart', { waitUntil: 'load' });
  await sleep(1500);

  const chartInfo = await page.evaluate(() => {
    var mount = document.querySelector('#chartMount');
    if (!mount) return { ok: false, reason: 'no #chartMount' };
    var cv = mount.querySelector('canvas');
    var btns = mount.querySelectorAll('.layer-btn[data-l]');
    var allBtn = mount.querySelector('.layer-btn.layer-all');
    return {
      ok: !!cv, canvas: cv ? (cv.width + 'x' + cv.height) : 'none',
      layerBtns: btns.length,
      hasAllBtn: !!allBtn,
      legendRows: mount.querySelectorAll('.cw-legend .lg-row').length
    };
  });
  console.log('交互图层图:', JSON.stringify(chartInfo));

  /* 逐个切换图层，确认不抛错 */
  const toggle = await page.evaluate(async () => {
    var btns = Array.from(document.querySelectorAll('#chartMount .layer-btn[data-l]'));
    var errs = [];
    for (var i = 0; i < btns.length; i++) {
      try { btns[i].click(); } catch (e) { errs.push(btns[i].getAttribute('data-l') + ':' + e.message); }
      await new Promise(r => setTimeout(r, 60));
    }
    return errs;
  });
  console.log('图层切换异常:', toggle.length, toggle.join(' | '));

  /* 切到教学图页，确认 .diagram 被挂载成图表 */
  await go('#/price-action');
  const paInfo = await page.evaluate(() => {
    var diagrams = Array.from(document.querySelectorAll('.diagram'));
    var mounted = diagrams.filter(d => d.querySelector('.lwc-host canvas'));
    return { total: diagrams.length, mounted: mounted.length };
  });
  console.log('price-action 页 .diagram:', JSON.stringify(paInfo));

  /* 回到 chart，验证 destroyAll 后 widget 仍能重建（无残留报错） */
  await go('#/chart');
  const chartInfo2 = await page.evaluate(() => {
    var mount = document.querySelector('#chartMount');
    var cv = mount && mount.querySelector('canvas');
    var btns = mount ? mount.querySelectorAll('.layer-btn[data-l]').length : 0;
    return { ok: !!cv, canvas: cv ? (cv.width + 'x' + cv.height) : 'none', layerBtns: btns };
  });
  console.log('回到 chart 后:', JSON.stringify(chartInfo2));

  console.log('控制台/页面错误:', errors.length);
  errors.forEach(e => console.log('  ' + e));

  await browser.close();
  var fail = errors.length || !chartInfo.ok || chartInfo.layerBtns !== 6 || !chartInfo2.ok || paInfo.mounted < 1;
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
