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
  await page.setViewport({ width: 1280, height: 1000 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));

  async function inspect(tag) {
    return page.evaluate(() => {
      const out = { charts: [] };
      document.querySelectorAll('.vela-lab').forEach((el) => {
        const key = el.getAttribute('data-vela');
        const cv = el.querySelector('canvas');
        let ink = 0;
        if (cv) {
          const ctx = cv.getContext('2d');
          const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
          for (let i = 3; i < d.length; i += 4) { if (d[i] > 8) ink++; }
        }
        out.charts.push({ key, canvas: !!cv, ink, ph: !!el.querySelector('.vela-lab-ph') });
      });
      const ch = window.__dbgLab ? null : null;
      return out;
    });
  }

  /* 亮色主题 */
  await page.evaluateOnNewDocument(() => localStorage.setItem('pa-atlas-theme', 'light'));
  await page.goto(url + '#/chart-lab', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3500));
  console.log('light:', JSON.stringify(await inspect()));
  await page.screenshot({ path: path.join(__dirname, 'lab-page-light.png'), fullPage: true });

  /* 章节子页（路由切到 #/chart-lab/wyckoff-lab，验证同一容器在子页也挂载） */
  await page.goto(url + '#/chart-lab/wyckoff-lab', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  const chapInfo = await page.evaluate(() => {
    const el = document.querySelector('.vela-lab[data-vela="wyckoff-trade-spring"]');
    const cv = el && el.querySelector('canvas');
    return { chapterPage: !!cv, ink: cv ? (() => {
      const ctx = cv.getContext('2d');
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] > 8) n++; } return n;
    })() : 0 };
  });
  console.log('chapter subpage:', JSON.stringify(chapInfo));
  await page.screenshot({ path: path.join(__dirname, 'lab-chapter-light.png'), fullPage: true });

  /* 暗色主题（同 URL 只换 hash 不会重载页面，必须 setItem + reload） */
  await page.evaluate(() => localStorage.setItem('pa-atlas-theme', 'dark'));
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3500));
  console.log('dark:', JSON.stringify(await inspect()));
  await page.screenshot({ path: path.join(__dirname, 'lab-page-dark.png'), fullPage: true });

  console.log('JS errors:', errs.length ? errs.slice(0, 6) : 'none');
  await browser.close();
})();
