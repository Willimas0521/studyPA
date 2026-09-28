// 把 Al Brooks《Gaps》第 1 集内容插入 priceAction 的 gap 章节末尾
// 用法: node tests/_insert_gap_brooks.js <markdownFile>
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'theories.js');
const MD_FILE = process.argv[2];
if (!MD_FILE) { console.error('请传入 markdown 文件路径'); process.exit(1); }

let md = fs.readFileSync(MD_FILE, 'utf8').replace(/\r\n/g, '\n').trim();

// 关键：details 块内部不能出现空行，否则 CommonMark/marked 会在空行处截断 HTML 块，
// 导致 </details> 泄漏成纯文本。把块内连续换行压成单个换行。
const dStart = md.indexOf('<details');
const dEnd = md.indexOf('</details>');
if (dStart !== -1 && dEnd !== -1) {
  const before = md.slice(0, dStart);
  const inside = md.slice(dStart, dEnd + '</details>'.length);
  const after = md.slice(dEnd + '</details>'.length);
  md = before + inside.replace(/\n{2,}/g, '\n').replace(/\n+/g, '\n') + after;
}

// 转义为 JS 单引号字符串内容
const esc = md
  .replace(/\\/g, '\\\\')   // 反斜杠
  .replace(/'/g, "\\'")     // 单引号
  .replace(/\n/g, '\\n');   // 换行

let src = fs.readFileSync(FILE, 'utf8');

const ANCHOR = '\'<h2 id="channel">通道</h2>\',';
// ⚠️ 必须直接在 src（可能含 CRLF）上定位，不能在 CRLF→LF 归一化后的字符串上定位：
// 归一化后长度会变短（每个 CRLF 少 1 字符），把索引拿回 src 用会整体前移，
// 导致内容被插进上一个段落的中间（已在第 1/2 集踩过一次，用 _repair_gap.js 修的）。
const anchor = src.indexOf(ANCHOR);
if (anchor === -1) { console.error('找不到 channel 章节锚点'); process.exit(1); }

// 从锚点往前回溯，找到 gap 章节 body 字符串的右引号
let j = anchor - 1;
while (j >= 0 && /\s/.test(src[j])) j--;         // 跳过空白（含 \r\n）
if (src[j] !== ',') { console.error('回溯未找到逗号, 位置', j, JSON.stringify(src.slice(j - 20, j + 5))); process.exit(1); }
j--;                                              // 跳过逗号
while (j >= 0 && /\s/.test(src[j])) j--;         // 跳过空白
if (src[j] !== "'") { console.error('回溯未找到右引号, 位置', j, JSON.stringify(src.slice(j - 20, j + 5))); process.exit(1); }

const insertPos = j;
const insert = '\\n\\n' + esc + '\\n';
const out = src.slice(0, insertPos) + insert + src.slice(insertPos);

fs.writeFileSync(FILE, out, 'utf8');
console.log('已插入，新增字符数:', insert.length);

// ---- 事后自检：确认插在了 gap 章节末尾，而不是段落中间 ----
try {
  const w = {}; const S = {};
  new Function('window', 'SITE', fs.readFileSync(FILE, 'utf8'))(w, S);
  const pa = w.SITE.pages.find(p => p.id === 'price-action');
  const i = pa.body.indexOf('<h2 id="gap">');
  const end = pa.body.indexOf('<h2 id="channel">', i);
  const tail = pa.body.slice(i, end).trim();
  console.log('插入后 gap 章节结尾:', JSON.stringify(tail.slice(-60)));
  const h3n = (pa.body.slice(i, end).match(/^### /gm) || []).length;
  console.log('gap 章节 h3 小节数:', h3n);
  if (!/>$/.test(tail)) {
    console.error('⚠️ 警告：结尾不是标签，可能插进了段落中间！请用 _repair_gap.js 检查');
  }
  const opens = (pa.body.match(/<details/g) || []).length;
  const closes = (pa.body.match(/<\/details>/g) || []).length;
  console.log('details 开/闭:', opens, '/', closes, opens === closes ? 'OK' : '❌ 不匹配');
} catch (err) {
  console.error('自检失败:', err.message);
}
