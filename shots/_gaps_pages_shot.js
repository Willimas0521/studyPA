// 四个「缺口课」独立页面截图：页面首页 + 一个章节子页
const puppeteer = require('puppeteer-core');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';

const TARGETS = [
  ['#/gaps-one', 'gaps-page-1.png'],
  ['#/gaps-two/odds', 'gaps-page-2-chapter.png'],
  ['#/gaps-three', 'gaps-page-3.png'],
  ['#/gaps-four', 'gaps-page-4.png'],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });

  for (const [hash, out] of TARGETS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(URL_BASE + hash, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 900));

    const info = await page.evaluate(() => {
      const nav = Array.from(document.querySelectorAll('.rail-group-head'))
        .map(h => h.textContent.trim());
      return {
        h1: (document.querySelector('#content h1') || {}).textContent,
        navGroups: nav.join(' / '),
        h2: document.querySelectorAll('#content h2').length,
        details: document.querySelectorAll('#content details.tscript').length,
        tables: document.querySelectorAll('#content table').length,
      };
    });

    await page.screenshot({ path: path.join(__dirname, out), fullPage: false });
    console.log(out, JSON.stringify(info), 'errors:', errs.length);
    await page.close();
  }

  await browser.close();
})();
