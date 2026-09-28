// 修复：此前插入脚本用 LF 归一化坐标去改 CRLF 文件，索引偏移，
// 导致第 8/9 节被插进第 7 节 callout 段落的中间，把段落劈成了两半。
// 这里把被截断的后半段（孤儿文本）移回前半段之后。
const fs = require('fs');
const path = require('path');

const F = path.join(path.resolve(__dirname, '..'), 'data', 'theories.js');
let src = fs.readFileSync(F, 'utf8');

const HEAD = 'Brooks 承认自己对';
const ORPHAN_HEAD = '缺口的定义"和所有人都不同"';

const pHead = src.indexOf(HEAD);
if (pHead === -1) { console.error('找不到段落前半段'); process.exit(1); }
const pEnd = pHead + HEAD.length;              // 前半段结束位置

const oStart = src.indexOf(ORPHAN_HEAD, pEnd);
if (oStart === -1) { console.error('找不到孤儿文本，可能已修复'); process.exit(1); }

const TAIL = '合理的工具。</p></div></div>';
const tIdx = src.indexOf(TAIL, oStart);
if (tIdx === -1) { console.error('找不到孤儿文本结尾'); process.exit(1); }
const oEnd = tIdx + TAIL.length + '\\n'.length; // 末尾还有一个 \n 转义（源码里是 2 个字符）

// oEnd 现在应指向 body 字符串的右引号
if (src[oEnd] !== "'") {
  console.error('结尾不是右引号，实际为:', JSON.stringify(src.slice(oEnd - 20, oEnd + 10)));
  process.exit(1);
}

const orphan = src.slice(oStart, oEnd);   // 被截断的段落后半段
const block = src.slice(pEnd, oStart);    // 插入的第 8/9 节内容（含前后 \n）

console.log('孤儿文本长度:', orphan.length, '| 插入块长度:', block.length);
console.log('孤儿开头:', JSON.stringify(orphan.slice(0, 40)));
console.log('插入块开头:', JSON.stringify(block.slice(0, 30)));

const out = src.slice(0, pEnd) + orphan + block + src.slice(oEnd);
fs.writeFileSync(F, out, 'utf8');
console.log('修复完成');
