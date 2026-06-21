# vishine 设计系统 · Design System

> **唯一权威来源(Single Source of Truth)。** vishine 主题的所有页面、组件、配色改动，一律以本文件为准。
> 新增任何页面 / 组件 / 颜色之前，**先读本文 → 复用既有 token 与组件 → 三套 scheme 各验一遍**。
>
> 参考实现：`mockups/c-grid.html`（首页基准件，三套配色可切换）。本文所有数值均从该文件提取。

---

## 0. 第一性铁律（不可违反）

这四条决定了"整站 UI 是否统一、切换是否全局生效"，违反任意一条即为不合格：

1. **全部 Token 化，禁止硬编码。**
   任何颜色 / 圆角 / 阴影一律用 CSS 变量（`var(--xxx)`）。组件 CSS 里**不允许出现裸 `#hex`、`rgb()`、`hsl()`**（动画用的 `rgba(0,0,0,…)` 纯黑/纯白阴影例外，且应尽量收进 `--shadow*`）。
   要用一个新颜色 → 先在 token 表里加，再引用。

2. **三套 scheme 必须同步。**
   配色方案有三套：`paper`（暖纸）/ `clean`（纯白，默认亮色）/ `dark`（默认暗色）。
   **任何新增 token，必须同时在 `[data-scheme="paper"]`、`[data-scheme="clean"]`、`[data-scheme="dark"]` 三处都给值。**
   少给一处 → 那个 scheme 下就会"这儿切了那儿没切"。这是硬性验收项。

3. **颜色经语义层间接引用，不直接抓具体色。**
   组件不要直接写 `--c-blog`，而是绑定一个局部语义变量（如卡片用 `--mc`），由"板块 → 色"的映射集中在一处完成（见 §2.3）。这样换色只改映射，不动组件。

4. **克制用色。**
   板块色只在**小元素**（左色条 / 图标描线 / 计数徽章 / 分类标签）发力；卡片主体、底色、正文保持中性。大面积彩色 = 廉价。

> 切换分两类，别混淆：
> - **配色切换（scheme switch）**：paper / clean / dark，切的是整套 token —— 本文档约束的对象。
> - **后期可能的"皮肤 / 布局切换"**：换的是结构件，但**仍必须只引用 token**，保证颜色全局统一翻转，不允许某个角落写死颜色逃过切换。

---

## 1. 设计定位

- **知识门户型，不是轻博客。** 内容量大（220+ 文章、多文档专区、深层导航），首页目标是"一屏看全貌、点哪去哪"。
- **气质 = C 端产品级通透 × 技术索引的秩序感。** 面向中文读者：克制、留白、高效，信息密度高但有秩序。
- **品牌色 = 赤陶橙（terracotta）。** 暖、稳、有辨识度，刻意避开"默认 AI 模板"的 indigo→cyan 紫青。

---

## 2. 配色系统（Color Tokens）

### 2.1 三套 scheme 概览

| scheme | 定位 | 底色基调 | 何时用 |
|---|---|---|---|
| `paper` | 暖纸 · 书卷气 | 暖白纸张 #f4f1ea | 偏阅读、长文气质 |
| `clean` | 纯白 · C 端产品风 | 近白 #fafafb | **默认亮色** |
| `dark` | 深中性 · 高级暗色 | 深石墨 #111317 | **默认暗色** |

切换由 `<html data-scheme="…">` 驱动，`localStorage` key = `vishine-scheme`，`<head>` 内联脚本在首屏渲染前应用（无闪烁）。

### 2.2 基础语义 Token（三套全量值）

| Token | 用途 | paper | clean | dark |
|---|---|---|---|---|
| `--paper` | 页面底色 | `#f4f1ea` | `#fafafb` | `#111317` |
| `--paper-2` | 次级底 / 表头 / 填充 | `#efeae0` | `#f3f4f6` | `#181b21` |
| `--card` | 卡片 / 面板底 | `#fbfaf6` | `#ffffff` | `#1a1d23` |
| `--ink` | 主文字 / 标题 | `#20201d` | `#15181d` | `#e6e3dd` |
| `--ink-2` | 正文 / 次级文字 | `#56544d` | `#545b66` | `#aab1bd` |
| `--ink-3` | 弱化 / 注释 / 占位 | `#8c887d` | `#9aa1ad` | `#727a87` |
| `--line` | 主边框 | `#ddd7c9` | `#eceef1` | `#262a31` |
| `--line-2` | 次级分隔线 | `#e8e3d6` | `#f1f2f4` | `#21252b` |
| `--accent` | 品牌色 / 焦点 | `#c75132` | `#e0552f` | `#e2724f` |
| `--accent-soft` | 品牌色浅底 | `#f0d9cf` | `#fdeee8` | `#33201a` |
| `--accent-ink` | 品牌色深 / 文字 | `#9e3d22` | `#c4421f` | `#f0916f` |
| `--on-accent` | 品牌色上的文字 | `#fff` | `#fff` | `#14161a` |

> **正文对比度**须达 WCAG AA（≥4.5:1）。`--ink-2` on `--card` 是正文基准，新增文字色须复核。

### 2.3 板块色彩编码（Section Color Coding）

每个内容板块固定一个色，**贯穿全站**（板块卡、该板块的分类标签、量感条都用同色），这是"东西多但好找"的关键。

| 板块 | Token | paper | clean | dark | -bg（paper / clean / dark） |
|---|---|---|---|---|---|
| 博客 blog | `--c-blog` | `#c75132` | `#e0552f` | `#ec7c58` | `#f3ddd2` / `#fdeee8` / `#33201a` |
| 实战手册 play | `--c-play` | `#2f6f5e` | `#138a6e` | `#3fc09c` | `#d8e8e1` / `#e3f5ef` / `#122821` |
| 路线图 road | `--c-road` | `#b3892a` | `#c2912c` | `#e0b753` | `#efe2c4` / `#fbf2da` / `#2b2410` |
| 运维文档 docs | `--c-docs` | `#3a5e8c` | `#2f6ad1` | `#6ba4e8` | `#d6e1ed` / `#e8f0fd` / `#14202e` |
| 资源 res | `--c-res` | `#7a4f8a` | `#8a52c4` | `#bd92dd` | `#e6dcec` / `#f3ebfb` / `#221a2c` |
| AI 专区 ai | `--c-ai` | `#a83a52` | `#d2304f` | `#ef7a90` | `#f0d6dc` / `#fce8ec` / `#2e1820` |

**绑定方式（语义间接层）**：板块卡 `.mod.blog{ --mc:var(--c-blog); --mbg:var(--c-blog-bg) }`，组件内部一律只用 `--mc` / `--mbg`。
**小元素染色公式**（保证克制、跨 scheme 自适应）：
- 图标块底：`background: color-mix(in srgb, var(--mc) 9%, var(--card))`，边框 `color-mix(… 20%, transparent)`
- 计数徽章：底 `color-mix(… 12%, var(--card))`，边 `color-mix(… 22%, transparent)`，字 `var(--mc)`

**分类 → 板块色 映射表**（feed / 列表 / 详情里的分类标签据此着色，通过 `style="--fc:var(--c-xxx)"` 注入）：

| 分类 | 取色 | | 分类 | 取色 |
|---|---|---|---|---|
| 中间件 / Nacos / 微服务 | `--c-docs` | | FinOps / 成本 | `--c-road` |
| 多云 / 网络 / Mesh | `--c-play` | | 故障复盘 / 告警 | `--c-ai` |
| Kubernetes / AWS / 基础设施 | `--c-docs` | | 大模型 / AI 工具 / RAG | `--c-res` |

> 新分类入站时，按语义就近归到上述某一板块色；映射登记在此表，不在组件里临时拍脑袋。

### 2.4 形状 / 阴影 Token

| Token | 用途 | paper | clean | dark |
|---|---|---|---|---|
| `--radius` | 卡片 / 面板圆角 | `10px` | `13px` | `12px` |
| `--shadow` | 静置阴影 | 见文件 | 产品级柔和近距 | 深色重投影 |
| `--shadow-hi` | hover / 弹层阴影 | 见文件 | 见文件 | 见文件 |
| `--grid-line` | 背景网格线色 | `#e3ddce` | `transparent` | `#1d2026` |
| `--grid-size` | 网格步长 | `64px` | `64px` | `64px` |

> 小元素圆角 5–10px（标签 5–6、图标块 10）。阴影**只用** `--shadow` / `--shadow-hi`，不得现写。

**语法高亮 token**（详情页代码块）：`--code-key` / `--code-str` / `--code-com` / `--code-num` / `--code-fn`，三套 scheme 各取板块色，保持与全站调性一致。接入 highlight.js 等高亮库时，须把其配色**映射到这 5 个 token**，不得引入第三方主题色。代码块底沿用 `--paper-2`。
> **代码清晰度规约**：注释**不用斜体**（中文斜体发虚）；代码字体族用 `var(--font-mono), var(--font-sans)`，让中文注释回退到 sans 保持锐利；字号 13.5px / `line-height:1.7` / `tab-size:2`；`--code-com`（注释灰）须达 AA 大字对比，别太淡。

---

## 3. 底色与网格（你问的"半深色页面"= dark）

- 页面底 = `--paper`，其上铺一层 **64px 细网格**：两条 `linear-gradient`（横、竖各 1px），线色 = `--grid-line`，`background-position:-1px -1px`。
- **clean**：`--grid-line: transparent` —— 纯白不显网格，换柔和阴影做层次，保持 C 端通透。
- **paper / dark**：显极淡网格，强化"控制台 / 索引"的秩序感。
- 所以 dark（半深色）页底 = `#111317` 深中性 + `#1d2026` 几乎不可见的网格，**不是纯黑**，避免廉价与刺眼。

---

## 4. 排版系统

- **字体**：`--font-sans` = `"Noto Sans SC", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`；`--font-mono` = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`。
- **全站唯一字体栈（定版）**：UI / 标题 / Markdown 正文 / 代码一律只用这两个栈，**任何页面、组件、正文都不得另设或页面级覆盖字体**；Web 字体须带完整系统 fallback（离线不糊）。详见 [`MARKDOWN.md`](./MARKDOWN.md) §3。
- **字号梯度**：H1 46 / 模块标题 16.5 / 正文 13.5–16 / 小字 11–13 / mono 标签 10.5–12。
- **字重**：900（hero 大标题）· 800（品牌 wordmark）· 700（标题 / 强调）· 600·500（次级）· 400（正文）。
- **字距**：大标题 `-.02em`；品牌 `-.015em`；正文 0；mono 大写标签 `+.08~.16em`。
- **行高**：正文 1.6–1.7；标题 1.08–1.4。
- **mono 专用于**：数字（必须 `font-feature-settings:"tnum" 1` 等宽对齐）、英文代号、计数、日期、标签、kbd。
- **重音克制**：正文内强调用 `--ink` **加粗**（非 accent）；`--accent` 只留给真正的焦点（hero 高亮句、链接、active 态、品牌）。一段里别超过 1–2 个重音。

---

## 5. 间距 / 圆角 / 阴影节奏

- **容器** `.wrap`：`max-width:1320px`，padding `0 28px`（移动 16px）。
- **区块节奏**：section 上下 `34px`；hero `34/26`；卡片内 padding `16–18px`；gap —— bento `14px`、低区 `22px`。
- **圆角**：卡片 / 面板统一 `var(--radius)`；小元素 5–10px。
- **阴影**：静置 `--shadow`，hover / 弹层 `--shadow-hi`。
- **阅读宽度**（详情页）：布局 token `--read-w` = `52em`（comfortable，默认）/ `66em`（wide），由 `<html data-readwidth>` 切换控制 `.prose` 正文宽，localStorage 持久化（见 INTERACTION §3.1）。

---

## 6. 组件规范

每个组件给：用途 · 关键 class · 用到的 token · 状态。新页面**优先复用**这些，不另起炉灶。

| 组件 | class | 关键点 |
|---|---|---|
| 顶栏 | `.topbar` `.nav` | sticky + `backdrop-filter` blur；滚动 >10px 加 `.scrolled`（实底 + 阴影）。底 `--paper` 半透，边 `--line`。 |
| 品牌 | `.brand-mini` `.glyph` | logo 见 §8。wordmark `vi`+`shine`（shine = `--accent`）。 |
| 下拉菜单 | `.dropdown` `.menu` | hover 展开，底 `--card`、边 `--line`、`--shadow-hi`；项右侧 mono 计数 `--ink-3`。 |
| 顶栏工具 | `.nav-tools` | 搜索框 `.search-mini`（含 `kbd ⌘K`）+ 配色切换 `.scheme-switch`（三色板）+ RSS `.icon-btn`（SVG，非字符）。gap 9px。 |
| Hero | `.hero` `.hero-grid` | 左文右"统计面板"，1fr / 360px。kicker 用 `--accent-soft` 胶囊；H1 含 `.hl` 高亮句（accent + 底色块）。 |
| 统计面板 | `.stat-panel` | 表头 `--paper-2`；2×2 数字（mono tnum），首格 `.accent` 用 `--accent`。 |
| 区块标题 | `.sec-head` | 小号大写 `--ink-2` + 前导 18×2 accent 短杠 + desc `--ink-3` + 右侧 `.more` mono accent。 |
| 板块卡 | `.mod`（`.blog/.play/.road/.docs/.res/.ai`） | 左 4px 色条 `--mc`；图标块 9% 染；计数徽章；列表 `.mod-list` / 标签 `.mod-chips`；脚 `.mod-foot`。hover：上浮 + `--shadow-hi` + 色条辉光。bento 6 列：blog/play 各 span3，docs/road/res 各 span2，ai span6。 |
| 最近更新 | `.feed` `.feed-row` | 左 mono 日期块 + 标题 + 分类标签（`--fc` 板块色）+ 时长。hover：底 `--paper-2`、标题转 accent、箭头右移。 |
| 侧栏面板 | `.panel` | 统一表头 + body。装：量感条 / 标签云。 |
| 量感条 | `.cat-row` `.cat-bar` | 名 `--ink-2` + 进度条（色 `--cb` 取板块色）+ mono 计数。进场宽度动画。 |
| 标签云 | `.tags a` | mono 胶囊，`.lg` 为高频（accent 软底）；hover 翻成 accent 实底。 |
| RSS | `.rss` `.icon-btn svg` | **统一 SVG RSS 图标**（两道弧 + 点），描 `currentColor`。 |
| 页脚 | `.foot` | 4 列（品牌 + 分类 / 标签 / 导航），底 `--paper-2`；底栏 mono。 |
| 详情页（阅读） | `.art-layout`/`.prose`/`.art-toc` 等 | 正文排版 + sticky TOC + `.code-block` + `.callout` + `.table-wrap` + `.lightbox`。详见 §9 与 `mockups/d-article.html`；语法高亮用 `--code-*` token。 |

---

## 7. 微交互规范

- **入场**：`.reveal` + `IntersectionObserver`，`riseIn` fade-up（位移 10px / .45s / `cubic-bezier(.22,.61,.36,1)`），stagger `.d1–.d6`（+60ms 递增），**只首次**。
- **hover**：卡片 `translateY(-3px)` + `--shadow-hi` + 色条 `scaleY(1.04)` 辉光；链接 / 行箭头位移；列表项左移 5px。
- **顶栏**：`scrollY>10` → `.scrolled`（rAF 节流）。
- **scheme 切换**：卡片 / 面板 / 顶栏对 `background`、`border-color`、`color` 加 `transition .25s`，三套切换平滑不突兀。
- **live 点**：`pulse 2s` 呼吸。
- **无障碍铁律**：以上动画**全部**包在 `@media (prefers-reduced-motion: reduce)` 内关闭（含 `.reveal` 直接显形、hover 位移归零、pulse 停）。

---

## 8. Logo / 品牌规范

- **glyph**：品牌色渐变圆角块（`linear-gradient(150deg, var(--accent), var(--accent-ink))` + 极轻 inset 内高光）承载一个 **内联 SVG mark**。
- **mark 含义 = vi + shine**：一笔利落的 **V 描边**（右臂略高，含上升 / 对勾意味，呼应"踩坑→解决"）+ 右上一颗 **四角星 shine 光点**。SVG 用 `color:var(--on-accent)`（描线 currentColor）。
- **尺寸**：顶栏 34px / 页脚 40px；SVG 占 ~60%，留呼吸。
- **wordmark**：`vi`（`--ink`）+ `shine`（`--accent`），字重 800 / 字距 `-.015em`。
- 禁止拉伸变形；最小尺寸不小于 24px。

---

## 9. 新页面落地指南（保证全站统一）

后续每类页面都按这套骨架长出来，**不重造轮子**：

- **通用骨架**：`.topbar` + `.wrap` 容器 + `.foot` 固定；主区用 `.sec` 切块。
- **列表页（分类 / 标签 / 归档）**：复用 `.feed-row`（时间流）或 `.mod-list`（紧凑）+ 侧栏 `.panel`；分类标签走 §2.3 映射着色。
- **文章详情页（阅读页）** ✅ 已落地 `mockups/d-article.html`：正文 `.prose` 行宽 ≤ 36 中文字 / 段；标题层级沿用字号梯度；代码块用 `--font-mono` + `--paper-2` 底 + `--code-*` 高亮；元信息条（日期 / 分类 / 时长）用 mono；右侧 sticky `.art-toc` scrollspy；相关文章复用 `.mod` 卡。
- **分类 / 标签索引页**：用 `.cat-bar` 量感或 bento 呈现。
- **关于 / 路线图**：复用 hero + 卡片。

**落地三步**：① 只用既有 token，缺色先在三套 scheme 同补；② 复用既有组件 class；③ 三套 scheme + reduced-motion 各验一遍。

### 9.1 卡片渲染落地（Hugo partial 化）

全站卡片（板块入口 `.mod` / 相关文章 `.rel-card` / 上下篇 `.pn-card` / 列表项卡）**一处定义、全站复用**，不在各页面各写一套：

- **统一 partial**：`layouts/partials/card.html`，接 `dict` 参数渲染。首页、列表页、相关文章、上下篇都调它 → 渲染天然一致。
- **数据契约**：`{ kind, title, url, summary, date, readingTime, category, count, items, cover }`。卡型用 `kind`（`post` / `section` / `related` / `prevnext`）切样式，共享同一数据形状。
- **板块色映射数据化**：维护 `data/sections.toml`（板块 / 分类 → `--c-*` token 与 class 如 `.blog`/`.docs`，对应 §2.3 映射表）；partial 据 `category` 查表给卡 class，**模板里绝不写死颜色**。换色只改 data 文件，全站生效。
- **与 prose 隔离**：卡片摘要走纯文本截断（`.Summary` / `plainify`），**不进 `.prose`**，避免正文样式污染卡片。
- **落地路径**：先把 mockup（`c-grid.html` / `d-article.html`）里的卡片 HTML 抽成 partial，再用真实 Hugo 数据（`.Pages` / `.Site.Taxonomies` / `.Site.RegularPages`）驱动。

---

## 10. 提交前验收清单

- [ ] 组件 CSS 无硬编码颜色（搜不到裸 `#hex` / `rgb(` 颜色，阴影除外）
- [ ] 新增 token 在 paper / clean / dark **三套都齐**
- [ ] 三套 scheme 截图：无掉色、无对比不足、切换全局一致
- [ ] 板块 / 分类用色符合 §2.3 映射
- [ ] `prefers-reduced-motion` 下动画全部关闭
- [ ] 移动端（≤720px）布局不崩

---

*基线参考件：`mockups/c-grid.html`（首页）· 备选风格：`mockups/a-ink.html`、`mockups/b-terminal.html`。*
*本主题二次开发自 Blowfish（MIT，© Nuno Coração），分发须保留其版权与许可。*
