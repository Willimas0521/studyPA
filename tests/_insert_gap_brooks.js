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
const norm = src.replace(/\r\n/g, '\n'); // 统一换行做定位，但最终写回原样

const ANCHOR = '\'<h2 id="channel">通道</h2>\',';
const anchor = norm.indexOf(ANCHOR);
if (anchor === -1) { console.error('找不到 channel 章节锚点'); process.exit(1); }

// 从锚点往前回溯，找到 gap 章节 body 字符串的右引号
let j = anchor - 1;
while (j >= 0 && /\s/.test(norm[j])) j--;         // 跳过空白
if (norm[j] !== ',') { console.error('回溯未找到逗号, 位置', j, JSON.stringify(norm.slice(j - 20, j + 5))); process.exit(1); }
j--;                                               // 跳过逗号
while (j >= 0 && /\s/.test(norm[j])) j--;         // 跳过空白
if (norm[j] !== "'") { console.error('回溯未找到右引号, 位置', j, JSON.stringify(norm.slice(j - 20, j + 5))); process.exit(1); }

// norm 与 src 长度一致（仅换行不同），索引可直接复用
const insertPos = j;
const insert = '\\n\\n' + esc + '\\n';
const out = src.slice(0, insertPos) + insert + src.slice(insertPos);

fs.writeFileSync(FILE, out, 'utf8');
console.log('已插入，新增字符数:', insert.length);
console.log('插入点上下文:', JSON.stringify(src.slice(insertPos - 60, insertPos + 30)));
