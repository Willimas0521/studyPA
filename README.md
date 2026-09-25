# 交易理论图谱

把 **价格行为学（Price Action）、ICT、SMC、威科夫操盘法、波浪理论** 放在同一张价格图上对照学习的静态站点。

核心主张：这五套体系描述的是同一件事——筹码与流动性如何从一方转移到另一方。它们语言不通，但指向的位置高度重合。

## 内容

| 页面 | 内容 |
|---|---|
| 概览 | 五体系术语映射表、使用方式 |
| 价格行为学 | 单根 K 线读法（收盘位置、影线、内包 / 外包线、五个实例）、三种市场状态、趋势的判定与强度分级、始终在场交易（Always In）、**交易区间**（即震荡区间，四种类型、边界消耗、震荡日的一天、实战清单）、**突破**（四种背景、开盘突破、二次突破、失败突破、测量移动）、**缺口**（跳空的本质、九成回补、突破 / 中继 / 衰竭三类缺口、岛形反转）、**通道**（画法与三种结局、窄通道 / 宽通道）、**楔形**（上升 / 下降楔形、收敛与突破）、**支撑与阻力**（角色互换、来源、实战清单）、**反转**（Always In 改变、HL/LH、假突破、典型形态）、**四种进场方式**、形态词典、读图流程、风险与仓位 |
| ICT | 流动性、PD 阵列、Killzone、Power of 3、OTE、完整交易流程 |
| SMC | BOS / CHoCH、订单块家族、诱因、与 ICT 的分野 |
| 威科夫 | 复合人、三大定律（含「因果→测量移动」量化）、吸筹五阶段（Spring 弹簧 / SOS+LPS 示意图）、派发镜像（UTAD 上冲回落示意图）、VSA 量价（单根 K 线「量×振幅」示意图）；**另附《威科夫方法的深度解析》（Rubén Villahermosa Chaves, 2019）原著逐章精读**：8 个部分 / 27 章，机器翻译已做术语归一化（吸筹 / 派发、Spring / SOS / SOW / LPS / LPSY、震仓 / 上冲 / 自动反弹等） |
| 波浪理论 | 5-3 结构、三条铁律、调整浪四形态、斐波那契关系 |
| 五体系对比 | 横向对照表、收敛点、差异、选型建议 |
| 五体系图层图 | **交互图**：同一段行情，六个图层可自由开关对照 |
| 术语速查 | 9 组 / 127 条中英对照术语 |
| 学习路径 | 六个阶段与检查点 |

## 技术

纯静态、无构建步骤、无外部 CDN。唯一运行时依赖是本地 `assets/vendor/` 下的
[TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)（v4.2.3，Apache-2.0，**已随仓库提交**），
直接用浏览器打开 `index.html` 即可，无需联网或 `npm install`。

```
index.html                                                 页面外壳
assets/style.css                                           设计系统（浅色 / 深色主题、响应式、打印样式）
assets/app.js                                              hash 路由、细纲导航（章节 / 概念双视图）、全文搜索、主题切换
assets/chart.js                                            图表模块：LWC 渲染 K 线 + 上层 canvas 叠加标注；含 jsdom 无 canvas 时的 fallback
assets/diagrams.js                                         25 张教学示意图的规格（设计坐标 + 标注绘制函数）
assets/layers.js                                           五体系图层交互图的图层定义与合成
assets/vendor/lightweight-charts.standalone.production.js  本地 vendor 的图表引擎
data/theories.js                                           五个体系的正文内容
data/wyckoff_book.js                                       《威科夫方法的深度解析》逐章精读正文（由 tests/_gen_wyckoff_book.py 从 DOCX 生成，按 Part→Chapter→Section 分层，术语已归一化）
data/wyckoff_book2.js                                      《Wyckoff 2.0》原著（二）正文（由 tests/_gen_wyckoff_book2.py 从 PDF 抽取，8 部分 45 章 55 小节 176 张插图；重点篇章已译中文，其余保留英文）
data/wyckoff_book2_zh.json                                 重点篇章中文译文（{unit_id: {html, label}}，由 tests/_build_zh6.py 写入并累加）
data/wyckoff_book2_units.json                              按单元拆分的英文源（含插图），供逐段翻译对照
data/wyckoff_book2_source.json                             结构化英文源（单元 id / 层级），供译文注入
assets/book-images/                                        从原著 DOCX 抽取的原书插图（168 张，jpg/png，被章节页 / 部分页内联引用）
assets/book2-images/                                       从《Wyckoff 2.0》PDF 抽取的原书插图（177 张，jpg/png）
data/glossary.js                                           术语库
tests/smoke.js                                             jsdom 冒烟测试（DOM / 交互 / 路由，无需浏览器；同时校验两本原著章节）
tests/_gen_wyckoff_book.py                                 从原著 DOCX 重新生成 data/wyckoff_book.js 的脚本（python-docx 解析扁平 DOCX，按字号+加粗+「第X章」模式分层）
tests/_gen_wyckoff_book2.py                                从《Wyckoff 2.0》PDF 重新生成 data/wyckoff_book2.js 的脚本（PyMuPDF 抽文本+插图，按字号+编号分层）
tests/_build_zh6.py                                        把重点篇章中文译文写入 data/wyckoff_book2_zh.json（可累加，便于分批翻译）
tests/_diag_book2.py                                       诊断脚本：字号 / 标题命中分布
tests/_charttest.html                                      浏览器测试用的全量挂载页（被 _validate.js 加载）
tests/_validate.js                                         真实浏览器（puppeteer-core + Chrome）校验全部 25 张图
tests/_sitevalidate.js                                     真实浏览器校验交互图层图与整站集成
tests/_bookval.js                                           真实浏览器校验原著章节页（27 章独立页可达、168 张插图 0 破损、细纲 27 条子章节链接）
```

图表由 JS + Lightweight Charts 生成真正的 K 线 / 成交量 / 价格轴 / 十字光标（支持缩放、平移、双击复位），
语义标注（Spring / SOS / LPS / UTAD / 区域框 / 价位线 / 箭头 / 波浪腿 / 圆点等）叠加在独立 canvas 上；
数据为固定种子合成，不含任何真实行情。

## 地址结构

**每一级都有自己的地址，可以直接打开、分享、收藏** —— 这是本站的组织方式：

| 地址 | 打开后看到 |
|---|---|
| `#/wyckoff` | 威科夫体系总览（完整长页，含原著逐章精读 8 个部分） |
| `#/wyckoff/laws` | 章节页：只有「三大定律」这一节 |
| `#/wyckoff/laws/law-of-supply-and-demand` | 概念页：只有「供求定律」 |
| `#/wyckoff/bk-p1` … `#/wyckoff/bk-p8` | 原著「部分」页：该部分下的章节（含原书插图） |
| `#/wyckoff/bk-c1` … `#/wyckoff/bk-c27` | 原著「章节」独立页：27 章各自可单独打开，含 h4 小节目录与原书插图 |
| `#/wyckoff/bk2-book` | 原著（二）《Wyckoff 2.0》落地页：含前言（Preface）等前置内容 |
| `#/wyckoff/bk2-p1` … `#/wyckoff/bk2-p8` | 原著（二）「部分」页（进阶概念 / 成交量 / 成交量剖面 / 订单流 / Wyckoff 2.0 等重点篇章已译中文） |
| `#/wyckoff/bk2-c1` … `#/wyckoff/bk2-c45` | 原著（二）「章节」独立页：45 章各自可单独打开，含原书插图；重点篇章含中文译文 |

- 概念页带面包屑、正文、上一个 / 下一个概念、同节其它概念。
- 章节页带面包屑、整节正文、上一节 / 下一节。
- slug 优先取英文名；没有英文名的卡片用中文，浏览器地址栏显示解码后的中文，照样可读。
- 术语速查这类正文靠运行时拼装的页面切不出小节，点进去会退回整页并滚到那一组，不会点空。

这是纯前端的 hash 路由，**不是**预生成的静态文件 —— 项目保持「无构建步骤、无外部 CDN」（仅本地 vendor 一个图表库）。
真需要文件（SEO、离线分发）时另外写个生成脚本即可，路由本来就是按这个结构设计的。

## 布局

两栏：**细纲 → 正文**。导航不单独占一栏，全部收进细纲。细纲有两个视图，共用顶部的过滤框。

**章节** —— 体系 → 章节 → 概念，三层都能点。当前所在体系默认展开并高亮；点当前体系组头只做折叠，
点其它体系组头则切页并展开。带内容的小节右侧标着概念张数，点小箭头就地摊开这一节的概念，
点章节名则进入该节的独立页。展开状态切页后保持；没有概念卡的小节不显示张数，直接跳转。

**概念** —— 把正文里的 174 张概念卡抽出来、按体系重新聚合，横向对照。这是这套导航真正的用处：
五套体系语言不通，但讲的常常是同一件事——过滤「块」，ICT 的「订单块 / 断路器块 / 缓解块」
和 SMC 的「标准订单块 / 断路器块 / 缓解块」会并排出现，点任一条进入该概念的独立页。

实现要点：

- 大纲来源按优先级取：页面自带的 `chapters` 元数据 → 术语库分组（术语速查页）
  → 正文里的 `<h2 id>` 现抽。新增正文小节会自动出现在细纲里。
- 概念卡原本没有锚点，渲染页面时按文档顺序补上 `id="c-N"`，
  与建索引时的序号一一对应（`collectConcepts` 与 `renderPage` 必须保持同序，否则跳转全错位）。
- 章节页的正文是把页面 body 按 `<h2>` 切开得到的（`sliceChapters`），h2 本身不进切片，
  标题用 `chapters` 元数据里的 label。
- 概念卡同时进顶栏全文搜索的索引，搜「弹簧」「订单块」能直达对应的独立页。
- 过滤框对当前视图生效，中英文名都可匹配，命中时自动展开所属组。
- 窄屏（< 960px）细纲收成左抽屉，由顶栏的列表按钮唤出；960–1199px 区间自动收窄到 210px。
- 底部保留 GitHub 仓库入口与免责声明。

## 本地预览

```bash
# 任选其一
python -m http.server 8000
npx serve .
```

然后访问 http://localhost:8000

## 测试

```bash
# 1) jsdom 冒烟测试（无需浏览器，只验证 DOM / 交互 / 路由）
npm install jsdom
node tests/smoke.js . ./node_modules/jsdom

# 2) 真实浏览器校验（puppeteer-core + 本机 Chrome）：25 张图渲染、坐标对齐、交互图层图、整站集成
NODE_PATH=/path/to/node_modules node tests/_validate.js
NODE_PATH=/path/to/node_modules node tests/_sitevalidate.js
```

jsdom 测试覆盖：脚本执行、10 个路由渲染、章节锚点、术语渲染、搜索中英文命中、
图层开关（aria-pressed 翻转 / 全开 6 层 / 全关空态）、主题切换、资源引用完整性、
细纲的组/节数量与展开折叠、锚点可达性。

浏览器测试覆盖：25 张示意图在真实 Chrome 下 0 控制台错误、各 2 层 canvas、
标注与 K 线坐标对齐（步长误差为 0）、交互图层图 6 层开关与全部开/关、暗色主题重绘无异常、
路由 `destroyAll` 重建无泄漏。

## 部署

面向 GitHub Pages，推送到仓库默认分支根目录即可。已包含 `.nojekyll`。

## 免责声明

本站为交易理论的整理与教学演示。所有图表均为**合成示意数据**，出现的任何点位、形态、
比例都不代表真实市场的必然结果，**不构成投资建议**。这些理论本身存在大量争议与证伪空间。
市场有风险，交易决策与后果由使用者自行承担。
