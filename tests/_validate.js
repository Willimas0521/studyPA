/* 全量校验：挂载全部 25 张图，检查控制台错误、canvas 数量、overlay 是否真的画了东西、坐标对齐 */
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'tests', '_charttest.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--hide-scrollbars']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1600, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto(URL, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  const out = await page.evaluate(() => {
    const insts = window.ChartModule.instances();
    return insts.map(inst => {
      const s = inst.spec, st = inst.chart.timeScale();
      const l2c = i => st.logicalToCoordinate(i);
      const N = s.closes.length;
      const k = inst.host.clientWidth / s.dw;
      const overlay = inst.host.querySelector('canvas.lwc-overlay');
      // 检查 overlay 是否真的画了非透明像素
      let drawn = false, nonBlank = 0;
      try {
        const c = overlay;
        const ctx = c.getContext('2d');
        const w = c.width, h = c.height;
        const data = ctx.getImageData(0, 0, w, h).data;
        for (let i = 3; i < data.length; i += 4 * 97) { if (data[i] > 8) { drawn = true; nonBlank++; } }
      } catch (e) { drawn = 'ERR:' + e.message; }
      const designX0 = s.x0, designLastX = s.x0 + (N - 1) * s.barW, designStep = s.barW;
      const actualX0 = l2c(0) / k, actualLastX = l2c(N - 1) / k, actualStep = (l2c(1) - l2c(0)) / k;
      return {
        key: s.key,
        canvases: inst.host.querySelectorAll('canvas').length,
        overlay: overlay ? (overlay.width + 'x' + overlay.height) : 'none',
        drawn, nonBlank,
        errX0: +(actualX0 - designX0).toFixed(2),
        errLast: +(actualLastX - designLastX).toFixed(2),
        errStep: +(actualStep - designStep).toFixed(2)
      };
    });
  });

  console.log('总图数:', out.length);
  console.log('控制台/页面错误:', errors.length);
  errors.forEach(e => console.log('  ' + e));
  let bad = 0;
  out.forEach(r => {
    const prob = (r.canvases < 2) || (r.drawn !== true) || (Math.abs(r.errX0) > 4) || (Math.abs(r.errLast) > 6) || (Math.abs(r.errStep) > 1);
    if (prob) { bad++; console.log('  ⚠', JSON.stringify(r)); }
  });
  console.log('异常图数:', bad);
  console.log('明细:');
  out.forEach(r => console.log('  ', r.key.padEnd(20), 'canv=' + r.canvases, 'drawn=' + r.drawn, 'eX0=' + r.errX0, 'eLast=' + r.errLast, 'eStep=' + r.errStep));
  await browser.close();
  process.exit(errors.length || bad ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
