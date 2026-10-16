const puppeteer = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const url = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));

  await page.goto(url + '#/wyckoff/practice', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));

  /* 逐图统计 canvas 墨水量，确认真画出来了 */
  const ink = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.diagram[data-diagram]').forEach(d => {
      const key = d.getAttribute('data-diagram');
      const cv = d.querySelector('canvas.lwc-overlay') || d.querySelector('.lwc-host canvas:last-of-type');
      if (!cv) { out[key] = 'no-canvas'; return; }
      const ctx = cv.getContext('2d');
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4) { if (data[i] > 8) n++; }
      out[key] = n;
    });
    return out;
  });
  console.log('ink:', JSON.stringify(ink));

  await page.screenshot({ path: path.join(__dirname, 'wyk-practice.png'), fullPage: true });

  /* 单图特写 */
  for (const key of ['wyckoff-trade-spring', 'wyckoff-trade-utad', 'wyckoff-spring-fail']) {
    const el = await page.$('.diagram[data-diagram="' + key + '"]');
    if (el) {
      await el.screenshot({ path: path.join(__dirname, key + '.png') });
      console.log('特写已截:', key);
    } else console.log('找不到图:', key);
  }
  console.log('JS errors:', errs.length ? errs.slice(0, 5) : 'none');
  await browser.close();
})();
