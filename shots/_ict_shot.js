/* ICT 页面截图 + 图表渲染自检：#/ict 首页与三个带图的章节子页 */
const puppeteer = require('puppeteer-core');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';

const TARGETS = [
  ['#/ict', 'ict-page.png'],
  ['#/ict/structure', 'ict-structure.png'],
  ['#/ict/pdarrays', 'ict-pdarrays.png'],
  ['#/ict/time', 'ict-time.png'],
  ['#/ict/models', 'ict-models.png'],
  ['#/ict/terms', 'ict-terms.png'],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });

  for (const [hash, out] of TARGETS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(URL_BASE + hash, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    const info = await page.evaluate(() => {
      const c = document.querySelector('#content');
      const fb = Array.from(c.querySelectorAll('.diagram-fallback')).map(n => n.textContent.trim());
      const canv = Array.from(c.querySelectorAll('canvas.lwc-overlay'));
      const boxes = canv.map(cv => {
        const ctx = cv.getContext('2d');
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
        for (let y = 0; y < cv.height; y++) {
          for (let x = 0; x < cv.width; x++) {
            if (d[(y * cv.width + x) * 4 + 3] > 8) {
              n++; if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
        return { w: cv.width, h: cv.height, ink: n, box: n ? [minX, minY, maxX, maxY] : null };
      });
      return {
        h1: (c.querySelector('h1') || {}).textContent,
        chars: c.textContent.length,
        h2: c.querySelectorAll('h2').length,
        h3: c.querySelectorAll('h3').length,
        diagrams: c.querySelectorAll('.diagram[data-diagram]').length,
        canvases: canv.length,
        fallbacks: fb,
        boxes: boxes,
        toc: c.querySelectorAll('.page-outline a, .chapter-outline a').length,
      };
    });

    await page.screenshot({ path: path.join(__dirname, out), fullPage: false });
    console.log('\n=== ' + hash + ' -> ' + out + ' ===');
    console.log('  h1:', info.h1, '| 正文', info.chars, '字符 | h2', info.h2, '| h3', info.h3, '| 目录链', info.toc);
    console.log('  示意图占位', info.diagrams, '张 | 实际 canvas', info.canvases, '张 | fallback:', JSON.stringify(info.fallbacks));
    info.boxes.forEach((b, i) => console.log('    canvas#' + i, b.w + 'x' + b.h, '像素点', b.ink, '包围盒', JSON.stringify(b.box)));
    if (errs.length) console.log('  !! JS 错误:', errs.slice(0, 3));
    await page.close();
  }

  await browser.close();
  console.log('\n完成');
})();
