// 通用：把第 N 集英文校正稿 md 转成 <h4>/<p> HTML，注入中文小节的 <!--ENGLISH--> 占位。
// 用法: node tests/_build_gap.js 3
// 产出：① 待插入站点的 ../.tmp_gap_brooks_vN.md  ② 独立中文笔记 ../AlBrooks-Gaps-0N-中文笔记.md
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const N = process.argv[2];
if (!N) { console.error('用法: node tests/_build_gap.js <集数>'); process.exit(1); }
const TAG = '0' + N;

const EN = path.join(ROOT, `AlBrooks-Gaps-${TAG}-英文校正稿.md`);
const CN = path.join(ROOT, `.tmp_gap_v${N}_cn.md`);
if (!fs.existsSync(EN)) { console.error('找不到英文稿:', EN); process.exit(1); }
if (!fs.existsSync(CN)) { console.error('找不到中文小节:', CN); process.exit(1); }

const enLines = fs.readFileSync(EN, 'utf8').replace(/\r\n/g, '\n').split('\n');
const html = [];
for (const raw of enLines) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('# ')) continue;                      // 文件标题
  if (line.startsWith('>') || line === '---') continue;     // 说明引用块 / 分隔线（否则会渲染成假横线）
  if (line.startsWith('## ')) { html.push('<h4>' + line.slice(3) + '</h4>'); continue; }
  html.push('<p>' + line + '</p>');
}
const enHtml = html.join('\n');

const cn = fs.readFileSync(CN, 'utf8');
if (!cn.includes('<!--ENGLISH-->')) { console.error('找不到占位符'); process.exit(1); }

// ① 站点插入用
fs.writeFileSync(path.join(ROOT, `.tmp_gap_brooks_v${N}.md`), cn.replace('<!--ENGLISH-->', enHtml), 'utf8');
console.log(`已生成 .tmp_gap_brooks_v${N}.md，英文段落数:`, html.filter(x => x.startsWith('<p>')).length);

// ② 独立中文笔记（去掉 details 区，补术语对照表）
const dIdx = cn.indexOf('<details');
const cut = cn.lastIndexOf('#### ', dIdx);
const noteBody = cn.slice(0, cut).trim();

const TERMS = `
## 附：语音识别术语对照表（累积）

| 原稿错误 | 正确术语 |
|---|---|
| bold trend / bold friend / bol bar | bull trend / bull bar |
| bare / beer / bar e bar | bear（空头） |
| bare trend / bare trent | bear trend |
| hype / hive / pie | high（高点） |
| clothes / is slow / it slow / blow | close / its low / below |
| tretiak s / training range | trading range |
| measure to move up / measure moved down | measured move up / down |
| self climax / cell climax / by climax | sell climax / buy climax |
| by signal bar / by setup / by vacuum | buy signal bar / buy setup / buy vacuum |
| exhaust of cell climax | exhaustion sell climax |
| bureau / universe / year old（+VS dollar） | euro（EUR/USD） |
| e mini / fu chess contract | E-mini / futures contract |
| do ji / doj I | doji（十字星） |
| twenty g AP bar / saw edge top | 20-gap bar / wedge top |
| bull ioi / new girlfriend（此语境） | bull inside bar (ii) / new low |
| universal / AD versal / arousal down | reversal / a reversal down |
| agape / micro got / gaffing down | a gap / micro gap / gapping down |
| very trend bar / bull tram bars | every trend bar / bull trend bars |
| the love of this bar / a new loaf | the low of this bar / a new low |
| attentive breakout / a tent / son of | attempted breakout / attempt / start of |
| bice t up / buy mack / the eyes are | buy setup / buy back / the odds are |
| buy the clothes bulls / look at closest | buy-the-close bulls / look at closes |
| trade l attempt / reverse l attempt | reversal attempt |
| vir trin / 我是朕 | 语音噪声，已剔除 |
`;
fs.writeFileSync(
  path.join(ROOT, `AlBrooks-Gaps-${TAG}-中文笔记.md`),
  `# Al Brooks《缺口 Gaps》第 ${N} 集 · 中文结构化笔记\n\n`
  + `> 来源：Brooks Trading Course — Gaps 系列四集之第 ${N} 集\n`
  + `> 说明：原稿为语音识别稿，术语错误较多，本笔记已按原意还原；英文原文见 \`AlBrooks-Gaps-${TAG}-英文校正稿.md\`\n\n`
  + noteBody + '\n' + TERMS,
  'utf8'
);
console.log(`已生成 AlBrooks-Gaps-${TAG}-中文笔记.md`);
