/* 全量校验：把 data/theories.js 中 priceAction 各章转换后的 Markdown 渲染结果与
 * git HEAD 原始 HTML 基线对比，确保结构不被破坏。
 * 用法: node tests/_md_verify_all.js [chapterId ...]   （不传则校验全部 PA 章）
 *
 * 校验项（仅对“已转换/目标”章严格断言）：
 *  1) 渲染后 h3 数量 == 基线 h3 数量（编号不增删小节）
 *  2) 渲染后 .callout 数 == 基线；.concept + .concept-grid 数 == 基线
 *  3) 每个 h3 文本以 /^\d+\.\s/ 开头（编号结构）
 *  4) 渲染正文无残留 ### / #### / ** 字面量
 *  5) marked 解析无异常
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { JSDOM } = require('C:/Users/Administrator/node_modules/jsdom');
const marked = require(path.resolve(__dirname, '..', 'assets', 'marked.min.js'));

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'theories.js');
const PA_IDS = ['origin','candles','states','trend','pressure','always-in','range',
  'breakout','gap','channel','wedge','support-resistance','reversal','entries',
  'concepts','workflow','tools','risk','pitfalls'];

const TARGET = process.argv.slice(2).filter(a => PA_IDS.includes(a));
const checkAll = TARGET.length === 0;
const want = checkAll ? PA_IDS : TARGET;

const cur = fs.readFileSync(FILE, 'utf8');
const head = execSync(`git show HEAD:data/theories.js`, { cwd: ROOT }).toString();

function findH2(src) {
  const re = /'<h2 id="([^"]+)">/g;
  const out = []; let m;
  while ((m = re.exec(src))) {
    out.push({ id: m[1], quoteStart: m.index, elemEnd: src.indexOf("',", m.index) + 2 });
  }
  for (let i = 0; i < out.length; i++) out[i].bodyEnd = (i + 1 < out.length) ? out[i + 1].quoteStart : src.length;
  return out;
}
function extractStrings(text) {
  let out = '', i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',') { i++; continue; }
    if (c === "'") {
      i++; let s = '';
      while (i < text.length && text[i] !== "'") {
        if (text[i] === '\\') {
          const e = text[i + 1];
          if (e === 'n') s += '\n';
          else if (e === 't') s += '\t';
          else if (e === 'r') s += '\r';
          else if (e === '\\') s += '\\';
          else if (e === "'") s += "'";
          else if (e === '"') s += '"';
          else s += e;
          i += 2;
        } else { s += text[i]; i++; }
      }
      i++; out += s;
    } else i++;
  }
  return out;
}
function mdHtml(raw) {
  if (!raw) return '';
  if (!/^\s{0,3}#{1,6}\s|^\s{0,3}[-*+]\s|^\s{0,3}>\s|\*\*[^*]+\*\*/m.test(raw)) return raw;
  return marked.parse(raw);
}
function countEls(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const d = dom.window.document;
  return {
    h3: d.querySelectorAll('h3').length,
    h4: d.querySelectorAll('h4').length,
    callout: d.querySelectorAll('.callout').length,
    concept: d.querySelectorAll('.concept').length,
    conceptGrid: d.querySelectorAll('.concept-grid').length,
    svg: d.querySelectorAll('svg').length,
    table: d.querySelectorAll('table').length,
  };
}
function textOf(html) { const dom = new JSDOM(`<body>${html}</body>`); return dom.window.document.body.textContent; }

const curH2 = findH2(cur);
const headH2 = findH2(head);
const curMap = new Map(curH2.map(h => [h.id, h]));
const headMap = new Map(headH2.map(h => [h.id, h]));

let pass = 0, failN = 0;
console.log('校验章: ' + want.join(', ') + '\n');
for (const id of want) {
  const ch = curMap.get(id);
  const hh = headMap.get(id);
  if (!ch) { console.log(`✗ ${id}: 当前文件找不到该章`); failN++; continue; }
  const bodyCur = extractStrings(cur.slice(ch.elemEnd, ch.bodyEnd));
  const base = hh ? extractStrings(head.slice(hh.elemEnd, hh.bodyEnd)) : bodyCur;
  const isMd = /^\s*### |^\s*- |\*\*|^\s*# /m.test(bodyCur);

  let rendered;
  try { rendered = mdHtml(bodyCur); } catch (e) { console.log(`✗ ${id}: marked 异常 ${e.message}`); failN++; continue; }
  const c = countEls(rendered);
  const b = countEls(base);
  const txt = textOf(rendered);

  const problems = [];
  if (c.h3 !== b.h3) problems.push(`h3 数 ${c.h3}≠基线${b.h3}`);
  if (c.callout !== b.callout) problems.push(`callout ${c.callout}≠${b.callout}`);
  if ((c.concept + c.conceptGrid) !== (b.concept + b.conceptGrid)) problems.push(`concept+grid ${c.concept+c.conceptGrid}≠${b.concept+b.conceptGrid}`);
  if (isMd) {
    if (!/^\d+\.\s/.test(txt.replace(/\n/g,'\n'))) { /* placeholder */ }
    // 检查每个 h3 文本
    const dom = new JSDOM(`<body>${rendered}</body>`);
    dom.window.document.querySelectorAll('h3').forEach(h => {
      if (!/^\d+\.\s/.test(h.textContent.trim())) problems.push(`h3 未编号: "${h.textContent.trim().slice(0,20)}"`);
    });
    if (/\n#(?:#{1,5})\s/.test(rendered) || /### /.test(txt) || /\*\*[^*]+\*\*/.test(txt)) problems.push('存在 ###/** 残留');
  }

  if (problems.length) { console.log(`✗ ${id} [${isMd?'MD':'HTML'}]:`); problems.forEach(p => console.log('    - ' + p)); failN++; }
  else { console.log(`✓ ${id} [${isMd?'MD':'HTML'}] h3=${c.h3} cal=${c.callout} con=${(c.concept+c.conceptGrid)} svg=${c.svg} tbl=${c.table}`); pass++; }
}
console.log(`\n通过 ${pass} / 失败 ${failN}`);
process.exit(failN ? 1 : 0);
