// gap 章节截图：折叠态 + 展开英文原文态
const puppeteer = require('puppeteer-core');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });

  async function shot(hash, out, expand) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(URL_BASE + hash, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 700));

    // 滚动定位：折叠态看第 8 节开头，展开态看英文原文区
    await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('#content h3'))
        .find(x => x.textContent.includes('Brooks 亲述'));
      if (h) h.scrollIntoView({ block: 'start' });
    });
    await new Promise(r => setTimeout(r, 300));

    if (expand) {
      await page.evaluate(() => {
        const det = document.querySelector('#content details.tscript');
        if (det) det.setAttribute('open', '');
        det.scrollIntoView({ block: 'start' });
      });
      await new Promise(r => setTimeout(r, 400));
    }

    const info = await page.evaluate((doExpand) => {
      const det = document.querySelector('#content details.tscript');
      if (!det) return { details: false };
      if (doExpand) det.setAttribute('open', '');
      return {
        details: true,
        h3: Array.from(document.querySelectorAll('#content h3')).map(h => h.textContent.trim()),
        h4: document.querySelectorAll('#content h4').length,
        summary: det.querySelector('summary').textContent.trim().slice(0, 40),
        innerP: det.querySelectorAll('p').length,
        innerH4: det.querySelectorAll('h4').length,
        open: det.hasAttribute('open'),
        tables: document.querySelectorAll('#content table').length,
        strong: document.querySelectorAll('#content strong').length,
      };
    }, expand);

    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: out, fullPage: false });
    console.log(out, JSON.stringify(info), 'errors:', errs.length);
    await page.close();
  }

  await shot('#/price-action/gap', path.join(__dirname, 'gap-brooks-collapsed.png'), false);
  await shot('#/price-action/gap', path.join(__dirname, 'gap-brooks-expanded.png'), true);

  await browser.close();
})();
