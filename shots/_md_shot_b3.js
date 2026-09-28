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

  const shots = ['price-action/origin', 'price-action/candles', 'price-action/states', 'price-action/entries', 'price-action/concepts', 'price-action/workflow', 'price-action/tools', 'price-action/risk', 'price-action/pitfalls'];
  for (const s of shots) {
    await page.goto(url + '#/' + s, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const info = await page.evaluate(() => {
      const h3 = document.querySelectorAll('#content h3').length;
      const strong = document.querySelectorAll('#content strong').length;
      const callout = document.querySelectorAll('#content .callout').length;
      const firstH3 = (document.querySelector('#content h3') || {}).textContent || '';
      return { h3, strong, callout, firstH3 };
    });
    const out = path.join(__dirname, 'md-' + s.replace('/', '-') + '.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log('已截图 ' + s + ' -> ' + out + ' :: ' + JSON.stringify(info));
  }
  console.log('JS errors:', errs.length ? errs.slice(0, 5) : 'none');
  await browser.close();
})();
