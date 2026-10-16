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

  const shots = ['price-action/trend', 'price-action/origin', 'price-action/workflow', 'price-action/tools', 'price-action/pitfalls'];
  for (const s of shots) {
    await page.goto(url + '#/' + s, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const info = await page.evaluate(() => {
      const h3 = document.querySelectorAll('#content h3').length;
      const strong = document.querySelectorAll('#content strong').length;
      const steps = document.querySelectorAll('#content .steps').length;
      const rawMd = (document.querySelector('#content') || {}).textContent.match(/###|\*\*/g);
      const firstH3 = (document.querySelector('#content h3') || {}).textContent || '';
      return { h3, strong, steps, rawMd: rawMd ? rawMd.length : 0, firstH3 };
    });
    const out = path.join(__dirname, 'pa-' + s.replace('/', '-') + '.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log('已截图 ' + s + ' :: ' + JSON.stringify(info));
  }
  console.log('JS errors:', errs.length ? errs.slice(0, 5) : 'none');
  await browser.close();
})();
