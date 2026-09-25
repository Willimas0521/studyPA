/* 书籍章节独立页 + 原书插图嵌入：真实浏览器校验 */
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
  page.on('requestfailed', r => {
    const u = r.url();
    if (/book-images/.test(u)) errors.push('IMG404: ' + u + ' :: ' + (r.failure() && r.failure().errorText));
  });

  const out = {};

  /* 1) 全站威科夫整页：统计插图 + 强制加载后检查无破图 */
  await page.goto(URL + '#/wyckoff', { waitUntil: 'load' });
  await sleep(1500);
  out.fullPageImgs = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.book-fig img'));
    imgs.forEach(i => { i.loading = 'eager'; });
    return { total: imgs.length, sample: imgs.slice(0, 3).map(i => i.getAttribute('src')),
             bookFigBlocks: document.querySelectorAll('.book-fig').length };
  });
  await sleep(2500);
  out.fullPageImgLoad = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.book-fig img'));
    let loaded = 0, broken = 0;
    imgs.forEach(i => { if (i.naturalWidth > 0) loaded++; else if (i.complete) broken++; });
    return { total: imgs.length, loaded, broken };
  });
  /* 整页目录里书籍章节应链到独立页 */
  out.fullPageToc = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('#content .toc a[href^="#/wyckoff/bk-c"]'));
    return { chapterLinks: links.length, sample: links.slice(0, 3).map(a => a.getAttribute('href')) };
  });

  /* 2) 部分页 bk-p1：目录列出章节链到独立页，含 h3 章节标题 */
  await page.evaluate(() => { location.hash = '#/wyckoff/bk-p1'; });
  await sleep(1400);
  out.partPage = await page.evaluate(() => {
    const h1 = document.querySelector('#content h1');
    const h3 = document.querySelectorAll('#content h3').length;
    const tocChap = document.querySelectorAll('#content .toc-sub a[href^="#/wyckoff/bk-c"]').length;
    const img = document.querySelectorAll('#content .book-fig img').length;
    const imgs = Array.from(document.querySelectorAll('#content .book-fig img'));
    imgs.forEach(i => { i.loading = 'eager'; });
    return { h1: h1 && h1.textContent.trim(), h3, tocChapLinks: tocChap, imgBlocks: img };
  });
  await sleep(1500);
  out.partPageImgLoad = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#content .book-fig img'));
    let loaded = 0, broken = 0;
    imgs.forEach(i => { if (i.naturalWidth > 0) loaded++; else if (i.complete) broken++; });
    return { total: imgs.length, loaded, broken };
  });

  /* 3) 章节独立页 bk-c1：h1=标题、含 h4 小节、含插图、目录链到 h4 锚点 */
  await page.evaluate(() => { location.hash = '#/wyckoff/bk-c1'; });
  await sleep(1400);
  out.chapPage = await page.evaluate(() => {
    const h1 = document.querySelector('#content h1');
    const h4 = document.querySelectorAll('#content h4').length;
    const imgs = Array.from(document.querySelectorAll('#content .book-fig img'));
    imgs.forEach(i => { i.loading = 'eager'; });
    const tocSec = document.querySelectorAll('#content .toc-sub a[data-anchor^="bk-h"]').length;
    const nav = document.querySelector('#content .concept-nav');
    return { h1: h1 && h1.textContent.trim(), h4, imgBlocks: imgs.length, tocSecLinks: tocSec, hasNav: !!nav };
  });
  await sleep(1500);
  out.chapPageImgLoad = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#content .book-fig img'));
    let loaded = 0, broken = 0;
    imgs.forEach(i => { if (i.naturalWidth > 0) loaded++; else if (i.complete) broken++; });
    return { total: imgs.length, loaded, broken };
  });

  /* 4) 中部章节 bk-c20（事件 #7）同样可独立打开 */
  await page.evaluate(() => { location.hash = '#/wyckoff/bk-c20'; });
  await sleep(1200);
  out.chapMid = await page.evaluate(() => {
    const h1 = document.querySelector('#content h1');
    return { h1: h1 && h1.textContent.trim() };
  });

  /* 5) 细纲嵌套：8 个部分下各出现子章节链接，共 27 条 */
  await page.evaluate(() => { location.hash = '#/wyckoff'; });
  await sleep(1200);
  out.rail = await page.evaluate(() => {
    const subs = document.querySelectorAll('#railBody a.rail-subchap');
    const heads = document.querySelectorAll('#railBody .rail-group-head.current + .rail-chaps > .rail-chap-head');
    return { subchapLinks: subs.length, partHeads: heads.length };
  });

  console.log(JSON.stringify(out, null, 2));
  console.log('ERRORS(' + errors.length + '):');
  errors.slice(0, 20).forEach(e => console.log('  - ' + e));

  await browser.close();
  process.exit(errors.length ? 2 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(3); });
