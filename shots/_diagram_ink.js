/* 全站示意图 ink（绘制像素）总量统计，用于对比修复前后 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';
const PAGES = ['#/price-action', '#/wyckoff', '#/elliott', '#/ict'];

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });
  let grand = 0;
  for (const hash of PAGES) {
    const p = await b.newPage();
    await p.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 1 });
    await p.goto(URL + hash, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1600));
    const res = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('.diagram').forEach((el, i) => {
        const key = el.getAttribute('data-diagram');
        const cv = el.querySelector('canvas.lwc-overlay');
        if (!cv) { out.push({ key, ink: -1 }); return; }
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let n = 0;
        for (let i2 = 3; i2 < d.length; i2 += 4) if (d[i2] > 8) n++;
        out.push({ key, ink: n });
      });
      return out;
    });
    const total = res.reduce((s, x) => s + Math.max(0, x.ink), 0);
    grand += total;
    console.log(hash.padEnd(16) + ' 图 ' + res.length + ' 张, ink 总计 ' + total);
    res.forEach(x => console.log('    ' + String(x.key).padEnd(22) + x.ink));
    await p.close();
  }
  console.log('\n全站 ink 总计: ' + grand);
  await b.close();
})();
