/* 批量把 priceAction 各章正文 HTML 转成 Markdown 编号结构。
 * 用法: node tests/_md_chapters.js trend gap always-in range ...
 * 设计:
 *  - 解析 data/theories.js，按 '<h2 id="X">' 切块，对目标章提取其数组字符串并拼成 HTML。
 *  - 用 jsdom 解析 HTML，走 DOM 转 Markdown：
 *      h3 -> ### N. 标题 ; h4 -> #### N.M 标题
 *      ul/ol -> - / 1. 列表 ; p -> 段落 ; blockquote -> > 引用
 *      strong/em/code/a/span -> 加粗/斜体/行内码/链接/原样(span 保留 outerHTML)
 *      callout / concept-grid / table / figure / svg / 其它 div / img -> 保留原生 HTML 块
 *  - 整章替换回文件（h2 行 + 单个 Markdown 字符串元素），跳过 pressure 与已是 markdown 的章。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('C:/Users/Administrator/node_modules/jsdom');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'theories.js');
const src0 = fs.readFileSync(FILE, 'utf8');

const FORCE = process.argv.includes('--force');
const TARGET = process.argv.slice(2).filter(a => a !== '--force');
if (!TARGET.length) { console.error('请传入要转换的章节 id'); process.exit(1); }
const SKIP = new Set(FORCE ? [] : ['pressure']); // 已转好

// ---- 1. 定位 priceAction body 范围（避免命中 ICT/SMC 等同 id 章节）----
const PA_START = src0.indexOf('var priceAction = {');
const BODY_START = src0.indexOf('body: [', PA_START);
if (PA_START === -1 || BODY_START === -1) {
  console.error('无法定位 priceAction body 范围'); process.exit(1);
}
function findPaEnd(s) {
  // priceAction body 数组的结束行：    ].join(''),
  // 后面紧跟着 priceAction 对象的结束：  };
  const idx = s.indexOf('\r\n    ].join(\'\'),\r\n  };', BODY_START);
  if (idx !== -1) return idx;
  // 降级：兼容 LF
  return s.indexOf('\n    ].join(\'\'),\n  };', BODY_START);
}
const PA_END0 = findPaEnd(src0);
if (PA_END0 === -1) { console.error('无法定位 ICT 边界'); process.exit(1); }

// ---- 2. 定位 priceAction 内所有 h2 块 ----
const h2re = /'<h2 id="([^"]+)">/g;
const h2s = [];
let m;
while ((m = h2re.exec(src0))) {
  if (m.index < BODY_START || m.index > PA_END0) continue;
  h2s.push({ id: m[1], quoteStart: m.index, elemEnd: src0.indexOf("',", m.index) + 2 });
}
// elemEnd 指向该 h2 元素逗号之后（即 body 起始）
// 每章 body 区间 = [elemEnd_i, quoteStart_{i+1})
for (let i = 0; i < h2s.length; i++) {
  h2s[i].bodyEnd = (i + 1 < h2s.length) ? h2s[i + 1].quoteStart : PA_END0;
}

// ---- 2. 提取数组字符串拼成 HTML ----
function extractStrings(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',') { i++; continue; }
    if (c === "'") {
      i++;
      let s = '';
      while (i < text.length && text[i] !== "'") {
        if (text[i] === '\\') { s += text[i + 1]; i += 2; }
        else { s += text[i]; i++; }
      }
      i++; // 跳过闭引号
      out += s;
    } else {
      i++; // 跳过非预期字符
    }
  }
  return out;
}

// ---- 3. HTML -> Markdown ----
function htmlToMd(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  const out = [];
  let sec = 0, sub = 0;

  function inline(node) {
    let s = '';
    node.childNodes.forEach(c => {
      if (c.nodeType === 3) { s += c.textContent; return; }
      if (c.nodeType !== 1) return;
      const tag = c.tagName.toLowerCase();
      const txt = inline(c);
      // 加粗/斜体用原生 HTML 透传，避免 marked 在中文全角标点旁无法识别 ** 的问题
      if (tag === 'strong' || tag === 'b') s += `<strong>${txt}</strong>`;
      else if (tag === 'em' || tag === 'i') s += `<em>${txt}</em>`;
      else if (tag === 'code') s += '`' + txt + '`';
      else if (tag === 'a') s += `[${txt}](${c.getAttribute('href') || ''})`;
      else if (tag === 'br') s += '\n';
      else if (tag === 'span') s += c.outerHTML; // 保留 badge 等样式
      else s += txt;
    });
    return s;
  }

  function listToMd(ul, ordered) {
    const lines = [];
    ul.querySelectorAll(':scope > li').forEach((li, idx) => {
      const marker = ordered ? `${idx + 1}.` : '-';
      let txt = '';
      li.childNodes.forEach(c => {
        if (c.nodeType === 3) txt += c.textContent;
        else if (c.nodeType === 1) {
          const t = c.tagName.toLowerCase();
          if (t === 'ul' || t === 'ol') {
            txt += '\n' + listToMd(c, t === 'ol').split('\n').map(l => '  ' + l).join('\n');
          } else txt += inline(c);
        }
      });
      lines.push(`${marker} ${txt.trim()}`);
    });
    return lines.join('\n');
  }

  function isPreserved(el) {
    const cls = (el.getAttribute('class') || '').split(/\s+/);
    const tag = el.tagName.toLowerCase();
    return tag === 'table' || tag === 'figure' || tag === 'svg' || tag === 'img' ||
           cls.includes('concept-grid') || cls.some(c => c.startsWith('callout'));
  }

  function walk(node) {
    node.childNodes.forEach(ch => {
      if (ch.nodeType === 3) {
        const t = ch.textContent;
        if (t.trim()) { out.push(t.trim()); out.push(''); }
        return;
      }
      if (ch.nodeType !== 1) return;
      const el = ch;
      const tag = el.tagName.toLowerCase();
      if (tag === 'h3') {
        sec++; sub = 0;
        out.push(`### ${sec}. ${inline(el).trim()}`); out.push('');
      } else if (tag === 'h4') {
        sub++;
        out.push(`#### ${sec}.${sub} ${inline(el).trim()}`); out.push('');
      } else if (tag === 'p') {
        out.push(inline(el).trim()); out.push('');
      } else if (tag === 'ul' || tag === 'ol') {
        out.push(listToMd(el, tag === 'ol')); out.push('');
      } else if (tag === 'blockquote') {
        out.push(inline(el).trim().split('\n').map(l => '> ' + l).join('\n')); out.push('');
      } else if (isPreserved(el) || tag === 'div') {
        out.push(el.outerHTML); out.push('');
      } else {
        out.push(el.outerHTML); out.push('');
      }
    });
  }
  walk(body);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trimEnd() + '\n';
}

// ---- 4. 逐章替换（每次重新扫描 src，保证索引有效）----
let src = src0;
let converted = [];

function scanH2(s) {
  const paEnd = findPaEnd(s);
  if (paEnd === -1) { console.error('扫描时无法定位 ICT 边界'); process.exit(1); }
  const re = /'<h2 id="([^"]+)">/g;
  const out = []; let m;
  while ((m = re.exec(s))) {
    if (m.index < BODY_START || m.index > paEnd) continue;
    out.push({ id: m[1], quoteStart: m.index, elemEnd: s.indexOf("',", m.index) + 2 });
  }
  for (let i = 0; i < out.length; i++) out[i].bodyEnd = (i + 1 < out.length) ? out[i + 1].quoteStart : paEnd;
  return out;
}

for (const id of TARGET) {
  if (SKIP.has(id)) { console.log('跳过(已转):', id); continue; }
  let list = scanH2(src);
  const h = list.find(x => x.id === id);
  if (!h) { console.log('未找到章:', id); continue; }
  const html = extractStrings(src.slice(h.elemEnd, h.bodyEnd));
  if (/^\s*### |^\s*- |\*\*|^\s*# /m.test(html)) { console.log('跳过(已是 markdown):', id); continue; }
  const md = htmlToMd(html);
  // 取原标题
  const h2str = src.slice(h.quoteStart, h.elemEnd);
  const tm = h2str.match(/<h2 id="[^"]+">([\s\S]*?)<\/h2>/);
  const title = tm ? tm[1] : id;
  // 前后加空行：避免 marked 把前章列表/HTML 块延续到本章 h2，也避免 h2 与正文粘在一起
  const wrapped = '\n\n' + md + '\n\n';
  const esc = wrapped.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const newChunk =
    `      '<h2 id="${id}">${title}</h2>',\n` +
    `      '${esc}',`;
  src = src.slice(0, h.quoteStart) + newChunk + src.slice(h.bodyEnd);
  converted.push(id);
  console.log('已转换:', id, '(markdown', md.length, '字符)');
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('完成。共转换', converted.length, '章:', converted.join(', '));
