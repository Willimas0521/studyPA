/* _verify.js — 校验后处理结果：树标签规范化 + 正文标题规范化 + 文件可解析 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');

function load(file, name) {
  const txt = fs.readFileSync(path.join(dir, file), 'utf8');
  const eq = txt.indexOf('window.' + name + ' =');
  let i = txt.indexOf('[', eq), depth = 0, inStr = false, q = '', j = i;
  for (; j < txt.length; j++) {
    const c = txt[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; continue; }
    if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) break; }
  }
  return { arr: eval('(' + txt.slice(i, j + 1) + ')'), text: txt };
}

function flatten(nodes, acc) {
  nodes.forEach(function (n) {
    acc.push(n);
    if (n.kids) flatten(n.kids, acc);
  });
  return acc;
}

const PART_RE = /^第[一二三四五六七八九十百零0-9]+部分 /;
const CHAP_RE = /^第[一二三四五六七八九十百零0-9]+章 /;
let problems = 0;

function checkTree(file, name, expectBook2) {
  const { arr } = load(file, name);
  const all = flatten(arr, []);
  console.log('\n=== ' + file + ' ===  nodes:' + all.length);
  const violations = [];
  all.forEach(function (n) {
    if (/book$/.test(n.id)) return;            // 书根跳过
    if (/fm\d+$/.test(n.id)) return;           // 前言跳过
    if (/p\d+$/.test(n.id)) { if (!PART_RE.test(n.label)) violations.push('PART-BAD: ' + n.id + ' => ' + n.label); return; }
    if (/c\d+$/.test(n.id)) { if (!CHAP_RE.test(n.label)) violations.push('CHAP-BAD: ' + n.id + ' => ' + n.label); return; }
    if (/[hs]\d+$/.test(n.id)) return;          // 节跳过（描述性标题）
    if (!/book|fm|p\d|ch?\d|[hs]\d/.test(n.id)) violations.push('UNKNOWN: ' + n.id + ' => ' + n.label);
  });
  // 查残留英文 PART / 旧分隔符（节为描述性标题，跳过）
  all.forEach(function (n) {
    if (/[hs]\d+$/.test(n.id)) return;
    if (/PART\s*\d/.test(n.label)) violations.push('EN-PART: ' + n.id + ' => ' + n.label);
    if (/[——–]/.test(n.label)) violations.push('DASH: ' + n.id + ' => ' + n.label);
    if (/第\s*\d/.test(n.label)) violations.push('SPACE-NUM: ' + n.id + ' => ' + n.label);
    if (/\d章|\d部分/.test(n.label)) violations.push('ARABIC-NUM: ' + n.id + ' => ' + n.label);
  });
  if (violations.length) { problems += violations.length; console.log('  VIOLATIONS:'); violations.slice(0, 30).forEach(function (v) { console.log('   ' + v); }); }
  else console.log('  OK: 全部部/章标签符合「第X部/章 标题」规范');
  return all;
}

const b1 = checkTree('wyckoff_book.js', 'WYCKOFF_BOOK_CHAPTERS');
const b2 = checkTree('wyckoff_book2.js', 'WYCKOFF_BOOK2_CHAPTERS');
const pa = checkTree('price_action_books.js', 'PRICE_ACTION_BOOKS_CHAPTERS');

/* book2 / book1 节数量（用 Set 去重，避免多路径重复计数） */
function countSections(arr) {
  const seen = new Set();
  flatten(arr, []).forEach(function (n) { if (/[hs]\d+$/.test(n.id)) seen.add(n.id); });
  return seen.size;
}
console.log('\n节(h4)节点数 book1:', countSections(b1), '(期望 180)');
console.log('节(h4)节点数 book2:', countSections(b2), '(期望 56)');

/* 正文标题校验：抽取每个文件的 BODY，扫标题，检查规范化 */
function checkBody(file, name) {
  const { text } = load(file, name);
  const eq = text.indexOf('window.' + name.replace('CHAPTERS', 'BODY') + ' =');
  let i = text.indexOf('[', eq), depth = 0, inStr = false, q = '', j = i;
  for (; j < text.length; j++) {
    const c = text[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; continue; }
    if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) break; }
  }
  const body = text.slice(i, j + 1);
  const re = /<(h[234])([^>]*)>([\s\S]*?)<\/\1>/g;
  let m, bad = [], n = 0, bk2h4 = 0;
  while ((m = re.exec(body)) !== null) {
    const tag = m[1], attrs = m[2], inner = m[3];
    const txt = inner.replace(/<[^>]+>/g, '').trim();
    n++;
    if (/[——–]/.test(txt)) bad.push('DASH in body: ' + txt.slice(0, 30));
    if (/PART\s*\d/.test(txt)) bad.push('EN-PART in body: ' + txt.slice(0, 30));
    if (tag === 'h4' && /id="bk2-s\d+"/.test(attrs)) bk2h4++;
  }
  console.log('\n=== BODY ' + file + ' === headings:' + n + ' | book2 h4 w/ id:' + bk2h4);
  if (bad.length) { problems += bad.length; console.log('  BODY VIOLATIONS:'); bad.slice(0, 20).forEach(function (v) { console.log('   ' + v); }); }
  else console.log('  OK: 正文标题无「—— / PART」残留');
}
checkBody('wyckoff_book.js', 'WYCKOFF_BOOK_CHAPTERS');
checkBody('wyckoff_book2.js', 'WYCKOFF_BOOK2_CHAPTERS');
checkBody('price_action_books.js', 'PRICE_ACTION_BOOKS_CHAPTERS');

console.log('\n==== TOTAL PROBLEMS: ' + problems + ' ====');
