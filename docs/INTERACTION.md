# vishine 交互规范 · Interaction Spec

> 与 [`DESIGN.md`](./DESIGN.md) 配套的**唯一权威来源**。DESIGN 管"长什么样"，本文管"怎么动、怎么响应"。
> 新增任何交互前：先读本文 → 复用既有模式与 API → 三套 scheme + 键盘 + reduced-motion 各验一遍。
>
> 参考实现：`mockups/c-grid.html`（首页已落地 P0 交互）。

---

## 0. 交互铁律（与配色"克制"同源）

1. **克制即高级**：动效只服务于"看懂 / 找到"，不炫技。位移 ≤10px，时长 150–450ms，缓动自然（`cubic-bezier(.22,.61,.36,1)`）。
2. **即时反馈**：每个可交互元素都有 hover / active / **focus** 回应；每个操作都有可见结果（复制 → toast）。
3. **可预期且一致**：同类元素同一种交互。所有卡片 hover 一致、所有链接箭头一致、所有弹层都能 `Esc` 关。
4. **键盘与触屏平权**：凡 hover / 鼠标触发的，必有键盘 + 点击等价；焦点环可见；弹层关闭后焦点归还触发元素。
5. **性能与无障碍底线**：只动 `transform` / `opacity`；`prefers-reduced-motion:reduce` 一律降级；不阻塞滚动；弹层打开锁 `body` 滚动。

> **动效只用 token 化的时长/缓动**，不要散落写死的 `0.37s` 一类魔数。颜色同样只走 token（含新增的 `--overlay` 遮罩，三套 scheme 都已定义）。

---

## 1. 交互全景（五层）

| 层 | 交互点 | 状态 |
|---|---|---|
| **L1 全局系统** | 配色 scheme 切换、顶栏滚动实化、入场 reveal、返回顶部、（详情页）阅读进度条、页面切换淡入 | scheme/滚动/reveal/返回顶部 ✅ |
| **L2 导航寻路** | 顶栏下拉、⌘K 搜索面板、移动抽屉、active 高亮、面包屑 | 下拉/⌘K/抽屉/active ✅ |
| **L3 内容浏览** | 卡片·行 hover、量感条进场、标签翻色、（列表页）多选筛选 / 视图切换 / 加载更多 | 浏览微交互 ✅；列表筛选 ⏳ |
| **L4 阅读详情** | TOC scrollspy、阅读进度、代码复制、标题锚点、图片 zoom、脚注预览、相关/上下篇 | scrollspy/进度/复制/锚点/zoom/相关 ✅；脚注预览 ⏳ |
| **L5 反馈状态** | 四态、focus-visible 焦点环、toast、skeleton、空状态、触屏降级 | focus 环/toast/空状态 ✅ |

✅ 已落地（首页） · ⏳ 待对应页面 mockup

---

## 2. 已落地交互规范（首页 P0）

### 2.1 ⌘K 命令 / 搜索面板 — `#cmdk`
站点"好不好用"的核心入口。
- **触发**：点顶栏 `#searchMini`（已 `role=button tabindex=0`）／键盘 `⌘K`·`Ctrl+K`（toggle）／`/`（非输入聚焦时）。
- **结构**：`.cmdk-overlay`（遮罩 `--overlay` + blur）> `.cmdk-panel`（`--card`/`--line`/`--shadow-hi`/`--radius`）> `.cmdk-search`（autofocus + 放大镜 + esc 提示）/ `.cmdk-results`（分组）/ `.cmdk-footer`（`↑↓ 选择 · ↵ 打开 · esc 关闭`）。
- **数据**：脚本内 `CMDK_DATA`（≥18 条 `{type,title,meta}`），分组顺序 `ORDER` = 文章 / 实战手册 / 分类 / 标签。
- **过滤**：输入即时 `includes` 模糊匹配（标题/分类/标签，忽略大小写），命中关键字 `<mark>` 高亮。
- **键盘**：`↑/↓` 循环移动高亮、`Enter` 打开（mock → `toast('打开：'+title)`）、`Esc` 关；输入变化重置高亮到首项；鼠标 hover/mousemove 同步高亮。采用 **`aria-activedescendant`** 模式（焦点留输入框，listbox 惯例）。
- **空 / 兜底**：无匹配 → 友好空态；无输入 → 显「热门·最近」前 6 条。
- **API**：`window.openCmdk()` / `window.closeCmdk()`；打开锁背景滚动，关闭归还焦点。

### 2.2 顶栏下拉 — `.dropdown.open`
- 桌面：保留 hover 展开；**新增** click / `Enter` toggle、`↓` 进入菜单、`Esc` 关、点击外部关、`mouseleave` **150ms 延迟**关（防误触）。
- ARIA：`<button>` 带 `aria-haspopup`，`aria-expanded` 动态同步。

### 2.3 移动抽屉 — `.hamburger` + `#drawer`
- `≤720px` 显示 `.hamburger`（替代被隐藏的 `.nav-links`）；点击 → `.drawer-panel` 右滑入。
- 含全部导航；分组 `.drawer-group.open` 可折叠（带计数）。遮罩 / `Esc` / 点遮罩关闭；锁背景滚动；焦点管理。

### 2.4 返回顶部 — `.to-top#toTop`
- `scrollY > 600` → 加 `.show`（fade + slide 浮现）；点击 `scrollTo({behavior: reduce?'auto':'smooth'})`；hover 转 `--accent`；可聚焦可触发。

### 2.5 Toast — `window.toast(msg)`
- 通用轻提示：`.toast-wrap#toastWrap` 内 `.toast`（底 `--ink` / 字 `--paper` 反色，`role=status aria-live=polite`），**2s 自动消失、可叠加**，reduced-motion 下只淡显不滑入。
- 示例触发：页脚 `#rssCopy`「复制地址」→ `toast('已复制 RSS 地址')`；⌘K 的 Enter 也复用。
- **复用约定**：将来详情页「代码复制」「复制锚点链接」一律调 `window.toast()`，不另造提示。

### 2.6 全局焦点环 — `:focus-visible`
- `a / button / input / [tabindex] / [role=button]` 的 `:focus-visible` → `outline:2px solid var(--accent); outline-offset:2px`；`:focus{outline:none}`。
- 键盘 Tab 显、鼠标点击不显。弹层 / 抽屉 / 搜索内元素都可 Tab 到达。

---

## 3. 待落地交互规范（随对应页面实现，先立标准）

### 3.1 详情页（阅读）— ✅ 已落地（`mockups/d-article.html`）
- **阅读进度条** ✅：`.read-progress > i#readBar`，宽 = scrollY / 可滚高，色 `--accent`，复用顶栏 rAF 滚动回调。
- **TOC scrollspy** ✅：`.art-toc` / `.toc-list a(.active/.sub)`，JS 从正文 h2/h3 自动建目录 + 锚点 + id；IntersectionObserver（`rootMargin:'-78px 0 -72%'`）高亮当前节，点击平滑滚动 + `scroll-margin-top` 补偿顶栏；`≤900px` 改 `.toc-fab` 悬浮按钮 + `.toc-sheet`。
- **代码块复制** ✅：`.code-block > .code-head(.code-copy)`，hover 显现 → `copyText()` + `toast('已复制代码')`，图标转 ✓；语法高亮走 `--code-*` token（见 DESIGN §2.4）。
- **标题锚点** ✅：h2/h3 内 `.anchor`，hover 显 `#`，点击 `copyText(本节链接)` + toast。
- **图片 zoom** ✅：`.fig[role=button]` 点击 → 克隆 `.diagram` 进 `.lightbox`（遮罩 `--overlay`），`Esc` / 点击关、焦点归还、锁滚动。
- **相关 / 上下篇** ✅：`.rel-grid > .rel-card`（复用板块色）、`.pn-nav > .pn-card`。
- **阅读宽度切换** ✅：`#readWidthBtn`（TOC 标题行右侧，⬌ 图标，`aria-pressed`）切换 `<html data-readwidth="comfortable|wide">` → 驱动布局 token `--read-w`（52em / 66em）控制 `.prose` 正文宽；`localStorage['vishine-readwidth']` 持久化、`<head>` 内联无闪烁（与 scheme 同机制），reduced-motion 下不做宽度过渡。
- **脚注 / 引用预览** ⏳：hover 气泡，暂未做。

### 3.2 列表页（分类 / 标签 / 归档）
- **多选筛选**：分类 / 标签 / 年份 chip 点击即时过滤（client-side）+ **URL query 同步** + 结果计数更新 + 空状态。
- **视图切换**：卡片 / 列表 / 紧凑三态（持久化到 localStorage，与 scheme 同机制）。
- **加载更多**：按钮分页（优于无限滚动：可控、可达、SEO 友好）；reduced-motion 下不做滚入。

---

## 4. 新页面交互落地指南

任何新页面接入交互，按此清单：
1. **全局件直接继承**：顶栏 / ⌘K / 抽屉 / 返回顶部 / toast / 焦点环 已是全局，新页面无需重写，只接 DOM。
2. **复用既有 API**：提示一律 `window.toast()`；弹层一律遮罩 + `Esc` + 焦点归还 + 滚动锁三件套；持久化偏好一律 localStorage（命名 `vishine-*`）。
3. **键盘三连**：可点必可聚焦、可 `Enter`/`Space` 触发、弹层可 `Esc`。
4. **reduced-motion**：新动画必须在 `@media (prefers-reduced-motion: reduce)` 内降级。
5. **触屏**：`:hover` 不作唯一入口，关键操作给可见控件。

---

## 5. 提交前交互验收清单

- [ ] 新交互可**纯键盘**完成（Tab/Enter/Esc/方向键）
- [ ] 焦点环可见、弹层关闭后焦点归还触发元素
- [ ] 弹层打开锁背景滚动、`Esc` 与点遮罩均可关
- [ ] 所有提示走 `window.toast()`，不另造
- [ ] `prefers-reduced-motion` 下动画全降级
- [ ] 三套 scheme 下交互态配色正常（含新增 `--overlay`）
- [ ] 触屏端关键操作不依赖 hover
- [ ] 无 JS 控制台报错

---

*基线实现：`mockups/c-grid.html`。交互调性应让这个知识门户"反应快、找得到、不意外"。*
