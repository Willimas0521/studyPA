/* 「实盘分析」页面截图 + 渲染自检：确认新导航组、章节、目录、路由都正常 */
const puppeteer = require('puppeteer-core');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';

const TARGETS = [
  ['#/live', 'live-page.png'],
  ['#/live/read', 'live-read.png'],
  ['#/live/checklist', 'live-checklist.png'],
  ['#/breakout', 'topic-breakout.png'],
  ['#/breakout/fail', 'topic-breakout-fail.png'],
  ['#/breakdown', 'topic-breakdown.png'],
  ['#/breakdown/speed', 'topic-breakdown-speed.png'],
  ['#/range', 'topic-range.png'],
  ['#/range/edges', 'topic-range-edges.png'],
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
    await new Promise(r => setTimeout(r, 1000));

    const info = await page.evaluate(() => {
      const c = document.querySelector('#content');
      /* 细纲里的导航分组名，按顺序 */
      const groups = Array.from(document.querySelectorAll('#railBody .rail-group-head'))
        .map(h => h.textContent.trim());
      return {
        h1: (c.querySelector('h1') || {}).textContent,
        eyebrow: (c.querySelector('.hero-eyebrow, .page-eyebrow') || {}).textContent,
        chars: c.textContent.length,
        h2: c.querySelectorAll('h2').length,
        h3: c.querySelectorAll('h3').length,
        tables: c.querySelectorAll('table').length,
        cards: c.querySelectorAll('.concept').length,
        steps: c.querySelectorAll('.step').length,
        callouts: c.querySelectorAll('.callout').length,
        railGroups: groups.join(' / '),
        railActive: (document.querySelector('#railBody .rail-item.active') || {}).textContent,
        outline: c.querySelectorAll('.page-outline a').length,
      };
    });

    await page.screenshot({ path: path.join(__dirname, out), fullPage: false });
    console.log('\n=== ' + hash + ' -> ' + out + ' ===');
    console.log('  h1:', info.h1, '| eyebrow:', info.eyebrow);
    console.log('  正文', info.chars, '字符 | h2', info.h2, '| h3', info.h3,
      '| 表', info.tables, '| 概念卡', info.cards, '| 步骤', info.steps, '| 提示框', info.callouts);
    console.log('  细纲分组:', info.railGroups);
    console.log('  当前高亮:', info.railActive, '| 本页目录链', info.outline);
    if (errs.length) console.log('  !! JS 错误:', errs.slice(0, 3));
    await page.close();
  }

  await browser.close();
  console.log('\n完成');
})();
