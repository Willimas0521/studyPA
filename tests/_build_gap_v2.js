// 把英文校正稿 md 转成 <h4>/<p> HTML，注入中文小节的 <!--ENGLISH--> 占位，
// 产出：① 待插入站点的 .tmp_gap_brooks_v2.md  ② 独立中文笔记 AlBrooks-Gaps-02-中文笔记.md
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const EN = path.join(ROOT, 'AlBrooks-Gaps-02-英文校正稿.md');
const CN = path.join(ROOT, '.tmp_gap_v2_cn.md');

const enLines = fs.readFileSync(EN, 'utf8').replace(/\r\n/g, '\n').split('\n');
const html = [];
for (const raw of enLines) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('# ')) continue;      // 文件标题
  if (line.startsWith('>') || line === '---') continue;  // 说明引用块 / 分隔线
  if (line.startsWith('## ')) { html.push('<h4>' + line.slice(3) + '</h4>'); continue; }
  html.push('<p>' + line + '</p>');
}
const enHtml = html.join('\n');

const cn = fs.readFileSync(CN, 'utf8');
if (!cn.includes('<!--ENGLISH-->')) { console.error('找不到占位符'); process.exit(1); }

// ① 站点插入用
const siteMd = cn.replace('<!--ENGLISH-->', enHtml);
fs.writeFileSync(path.join(ROOT, '.tmp_gap_brooks_v2.md'), siteMd, 'utf8');
console.log('已生成 .tmp_gap_brooks_v2.md，英文段落数:', html.filter(x => x.startsWith('<p>')).length);

// ② 独立中文笔记（去掉 details 区，补术语对照表）
const noteBody = cn.slice(0, cn.indexOf('#### 9.11')).trim();
const TERMS = `
## 附：语音识别术语对照表（本集新增 / 复用）

| 原稿错误 | 正确术语 |
|---|---|
| bold trend / bold friend / bold friend | bull trend（上升趋势） |
| bare / beer / bar e bar | bear（空头） |
| hype / hive / pie | high（高点） |
| clothes / is slow / it slow | close / its low |
| universal / AD versal / arousal down | reversal / a reversal down |
| training range / training match | trading range（交易区间） |
| measure to move up / moved down | measured move up / down（等幅测量） |
| by climax / BI climax / cell climax | buy climax / sell climax（买入高潮 / 抛售高潮） |
| by signal bar / by setup / by vacuum | buy signal bar / buy setup / buy vacuum |
| exhaust of cell climax / exhaustive cell climax | exhaustion sell climax（竭尽性抛售高潮） |
| universe verse of the dollar | euro versus the dollar（EUR/USD） |
| do ji / doj I | doji（十字星） |
| twenty g AP bar / twenty gap bar | 20-gap bar（20 根棒后首次触及均线的买入信号） |
| saw edge top / consecutive top saw edge | wedge top / consecutive tops（楔形顶 / 连续顶） |
| new girlfriend（此语境） | new low（新低） |
| bull ioi | bull inside bar (ii)（多头 inside bar） |
| trap bearers / barres umps | trapped bears / bear resumption |
| the eyes are ... | the odds are ... |
| of the stubble barn | of the double bottom |
| barth is blow / th is blow | that this low |
`;
fs.writeFileSync(
  path.join(ROOT, 'AlBrooks-Gaps-02-中文笔记.md'),
  '# Al Brooks《缺口 Gaps》第 2 集 · 中文结构化笔记\n\n'
  + '> 来源：Brooks Trading Course — Gaps 系列四集之第二集\n'
  + '> 主题：均线缺口棒（moving average gap bar）与竭尽缺口（exhaustion gap）\n'
  + '> 说明：原稿为语音识别稿，术语错误较多，本笔记已按原意还原；英文原文见 `AlBrooks-Gaps-02-英文校正稿.md`\n\n'
  + noteBody + '\n' + TERMS,
  'utf8'
);
console.log('已生成 AlBrooks-Gaps-02-中文笔记.md');
