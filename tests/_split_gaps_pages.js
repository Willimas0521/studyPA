// 把缺口章节里的第 8~11 节（Al Brooks《Gaps》四集）拆成四个独立页面，
// 缺口章节回到 1~7 节。
// 用法: node tests/_split_gaps_pages.js
const fs = require('fs');
const path = require('path');

const F = path.join(path.resolve(__dirname, '..'), 'data', 'theories.js');
let src = fs.readFileSync(F, 'utf8');

/* ---------- 编解码（源码里是转义过的 JS 单引号字符串） ---------- */
function unesc(s) {
  return s.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}
function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/* ---------- 1. 定位 gap 章节 body 字符串的起止（直接在 src 上找，锚点不含换行，索引安全） ---------- */
function bodyRange(startAnchor, endAnchor) {
  const sIdx = src.indexOf(startAnchor);
  if (sIdx === -1) throw new Error('找不到起始锚点: ' + startAnchor);
  let p = sIdx + startAnchor.length;      // 跳过 "'<h2 ...>',"
  while (/\s/.test(src[p])) p++;          // 跳过空白
  if (src[p] !== "'") throw new Error('起始处不是引号: ' + JSON.stringify(src.slice(p - 30, p + 10)));
  const contentStart = p + 1;

  let a = src.indexOf(endAnchor);
  if (a === -1) throw new Error('找不到结束锚点: ' + endAnchor);
  let j = a - 1;
  while (/\s/.test(src[j])) j--;          // 跳过空白
  if (src[j] !== ',') throw new Error('结束回溯未找到逗号');
  j--;
  while (/\s/.test(src[j])) j--;
  if (src[j] !== "'") throw new Error('结束回溯未找到右引号');
  return { contentStart, contentEnd: j };
}

const GAP_H2 = '\'<h2 id="gap">缺口</h2>\',';
const CH_H2 = '\'<h2 id="channel">通道</h2>\',';
const r = bodyRange(GAP_H2, CH_H2);

let gapBody = unesc(src.slice(r.contentStart, r.contentEnd));
console.log('gap 章节原长度:', gapBody.length);

/* ---------- 2. 切出第 8~11 节 ---------- */
const heads = ['### 8. Brooks 亲述：', '### 9. Brooks 亲述（二）', '### 10. Brooks 亲述（三）', '### 11. Brooks 亲述（四）'];
const marks = heads.map(h => {
  const i = gapBody.indexOf('\n' + h);
  if (i === -1) throw new Error('找不到小节: ' + h);
  return i + 1;
});
const blocks = marks.map((m, i) => (i + 1 < marks.length ? gapBody.slice(m, marks[i + 1]) : gapBody.slice(m)));
const cutAt = marks[0];

let newGapBody = gapBody.slice(0, cutAt).replace(/\s+$/, '') + '\n';
console.log('缺口章节新长度:', newGapBody.length, '（应回到 1~7 节）');
console.log('缺口章节结尾:', JSON.stringify(newGapBody.slice(-70)));

/* ---------- 3. 每块转成独立页面 ---------- */
const META = [
  {
    n: 1, title: '缺口课 1 · 定义与分类', en: 'Gaps 1',
    tagline: 'Brooks 对缺口的定义比任何教科书都宽：支撑与阻力之间的任何空隙，都是缺口。',
    tags: ['缺口定义', '传统分类', '岛形反转', 'momentum', '测量移动'],
    slugs: ['definition', 'traditional', 'island', 'momentum', 'chart', 'measured-move', 'bar-count', 'micro', 'transcript'],
  },
  {
    n: 2, title: '缺口课 2 · 均线缺口棒与竭尽缺口', en: 'Gaps 2',
    tagline: '两类可以直接交易的缺口：均线缺口棒给出 60% / 40% 的概率链，竭尽缺口给出反转与测量的分界。',
    tags: ['均线缺口棒', '20-gap bar', '竭尽缺口', '二腿陷阱', '60/40 概率'],
    slugs: ['ma-gap-bar', 'twenty-gap-bar', 'odds', 'topping', 'exhaustion-setup', 'second-leg-trap', 'targets', 'biggest-bar', 'bear-mirror', 'not-climactic', 'transcript'],
  },
  {
    n: 3, title: '缺口课 3 · 微缺口 / 跳空开盘棒 / 实体缺口', en: 'Gaps 3',
    tagline: '三个能在图上直接找出来的缺口形态，以及它们各自失效的判据。',
    tags: ['微缺口', '跳空开盘棒', '实体缺口', '负缺口', '被套的空头'],
    slugs: ['micro-gap', 'stay-open', 'gap-open-bar', 'late-reversal', 'bear-read', 'forex', 'trapped-bears', 'measured-move', 'body-gap', 'body-gap-close', 'transcript'],
  },
  {
    n: 4, title: '缺口课 4 · 开放缺口 vs 阶梯形态', en: 'Gaps 4',
    tagline: '完结篇：缺口保持开放，趋势还能走很远；缺口不断被回补，趋势正在走弱。',
    tags: ['开放缺口', '阶梯形态', '小回撤趋势', '通道转区间', 'high 4'],
    slugs: ['overview', 'weak-looking', 'tight-channel', 'bulls-quit', 'only-sell', 'stairs', 'bulls-scalp', 'bears-limit', 'high4', 'summary', 'transcript'],
  },
];

const pageVars = [];
blocks.forEach((blk, k) => {
  const meta = META[k];
  let lines = blk.split('\n');

  // 取 blockquote 作为 tagline / lede
  let lede = meta.tagline;
  const qi = lines.findIndex(l => l.trim().startsWith('>'));
  if (qi !== -1) {
    lede = lines[qi].trim().replace(/^>\s*/, '');
    lines.splice(qi, 1);
  }
  // 去掉 "### N. 标题" 这一行
  lines = lines.filter(l => !/^###\s/.test(l.trim()));

  // #### N.M 小节 → <h2 id="slug">M. 小节</h2>
  const chapters = [];
  let si = 0;
  lines = lines.map(l => {
    const m = l.match(/^####\s+(\d+)\.(\d+)\s+(.*)$/);
    if (!m) return l;
    const slug = meta.slugs[si] || ('s' + (si + 1));
    const label = m[3].trim();
    chapters.push({ id: slug, label: label });
    si++;
    return '<h2 id="' + slug + '">' + (si) + '. ' + label + '</h2>';
  });
  if (si !== meta.slugs.length) {
    console.error(`⚠️ 第 ${meta.n} 集小节数 ${si} 与 slug 数 ${meta.slugs.length} 不符`);
    process.exit(1);
  }

  let body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  body = '<p class="lede">' + lede + '</p>\n\n' + body;

  pageVars.push({
    varName: 'gaps' + meta.n,
    id: 'gaps-' + meta.n,
    chapters: chapters,
    body: body,
    meta: meta,
  });
  console.log(`第 ${meta.n} 集 → ${si} 个小节：`, chapters.map(c => c.id).join(', '));
});

/* ---------- 4. 生成页面源码 ---------- */
function pageSrc(p) {
  const ch = p.chapters.map(c => `      { id: '${c.id}', label: '${c.label}' },`).join('\n');
  return [
    `  /* ------------------------------------------- Al Brooks ${p.meta.en} */`,
    `  var ${p.varName} = {`,
    `    id: '${p.id}',`,
    `    navGroup: 'Al Brooks 课程',`,
    `    navLabel: '缺口课 ${p.meta.n}',`,
    `    title: '${p.meta.title}',`,
    `    en: '${p.meta.en}',`,
    `    eyebrow: 'Brooks 课程 0${p.meta.n}',`,
    `    accent: '#2563eb',`,
    `    tagline: '${p.meta.tagline}',`,
    `    plainTitle: '缺口课 ${p.meta.n}',`,
    `    tags: ${JSON.stringify(p.meta.tags)},`,
    `    chapters: [`,
    ch,
    `    ],`,
    `    body: [`,
    `      '${esc(p.body)}',`,
    `    ].join(''),`,
    `  };`,
    ``,
  ].join('\n');
}

const pagesSrc = pageVars.map(pageSrc).join('\n');

/* ---------- 5. 写回文件 ---------- */
// 5a. 替换 gap 章节 body
src = src.slice(0, r.contentStart) + esc(newGapBody) + src.slice(r.contentEnd);

// 5b. 插入四个页面对象
const THEORIES_ANCHOR = '  var theories = [priceAction, ict, smc, wyckoff, elliott];';
const tIdx = src.indexOf(THEORIES_ANCHOR);
if (tIdx === -1) throw new Error('找不到 theories 锚点');
src = src.slice(0, tIdx) + pagesSrc + THEORIES_ANCHOR + src.slice(tIdx + THEORIES_ANCHOR.length);

// 5c. pages 数组
const PAGES_ANCHOR = '  var pages = [overview].concat(theories, [compare, chartPage, glossary, path]);';
const pIdx = src.indexOf(PAGES_ANCHOR);
if (pIdx === -1) throw new Error('找不到 pages 锚点');
src = src.slice(0, pIdx)
  + '  var pages = [overview].concat(theories, [gaps1, gaps2, gaps3, gaps4], [compare, chartPage, glossary, path]);'
  + src.slice(pIdx + PAGES_ANCHOR.length);

// 5d. nav 分组
const NAV_ANCHOR = "    { group: '对照', items: ['compare', 'chart'] },";
const nIdx = src.indexOf(NAV_ANCHOR);
if (nIdx === -1) throw new Error('找不到 nav 锚点');
src = src.slice(0, nIdx)
  + "    { group: 'Al Brooks 课程', items: ['gaps-1', 'gaps-2', 'gaps-3', 'gaps-4'] },\n"
  + NAV_ANCHOR
  + src.slice(nIdx + NAV_ANCHOR.length);

fs.writeFileSync(F, src, 'utf8');
console.log('\n已写回 data/theories.js');
