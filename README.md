# vishine

> 知识门户型中文技术博客 Hugo 主题 —— 为 DevOps / 云原生 / AI 工程化的长期写作而做。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Hugo extended ≥ 0.146](https://img.shields.io/badge/Hugo-extended%20%E2%89%A5%200.146-ff4088?logo=hugo&logoColor=white)](https://gohugo.io/)
[![Language: 中文](https://img.shields.io/badge/lang-中文-d22128.svg)](#)

vishine 把博客组织成「五大结构化板块 + 色彩编码」的知识门户：三套可切换配色、bento 风格首页、⌘K 命令面板搜索、可折叠目录树、文章无图自动生成封面。中文优先，二次开发自 [Blowfish](https://blowfish.page/)。

**🔗 [在线 Demo](https://socake.github.io/vishine/)** ｜ **📖 [使用文档](docs/USAGE.md)**

---

## 截图

> 📸 正式截图待补；下方为占位图，请放入 `docs/images/` 后替换。

| 首页（bento 门户） | 文章页 + TOC | 左图右文列表 |
| --- | --- | --- |
| ![首页](docs/images/screenshot-home.png) | ![文章](docs/images/screenshot-article.png) | ![列表](docs/images/screenshot-list.png) |

| ⌘K 命令面板 | 暗色配色 | 移动端抽屉 |
| --- | --- | --- |
| ![命令面板](docs/images/screenshot-cmdk.png) | ![暗色](docs/images/screenshot-dark.png) | ![抽屉](docs/images/screenshot-mobile.png) |

---

## ✨ 特性

### 🎨 视觉与配色
- **三套可切换配色**：暖纸 `paper` / 纯白 `clean` / 暗色 `dark`，全局 CSS token 一键切换，`localStorage` 持久化，渲染前内联应用、无闪烁。
- **五大板块色彩编码**：内容按板块（博客 / 实战手册 / 路线图 / 运维文档 / 资源）着色，分类可映射到板块色，全站一处配置（`data/sections.toml`）。
- **bento 风格知识门户首页**：模块化卡片网格，把不同板块的最新内容编排成一目了然的门户。

### 📰 内容呈现
- **左图右文 feed 列表**：列表页为左图右文的 feed 流，分类 / 标签即时筛选 + 加载更多。
- **自动封面生成器**：文章无图时按「标题 + 分类」自动生成封面，4 种版式（orbit / grid / diagonal / arc）据哈希轮换、板块色着色，**纯 Hugo 原生、零外部依赖**；`[params.cover]` 可调风格、可锁定版式、可关闭。

### 🔍 交互与导航
- **⌘K 命令面板搜索**：全站搜索（标题 / 摘要 / 分类 / 标签），数据来自 home 的 `/index.json`。
- **可折叠 TOC + 阅读进度**：右侧目录树，scrollspy 高亮 + 顶部阅读进度条。
- **顶栏多级下拉菜单**：`identifier` 父项 + `parent` 子项，运维 / AI / 编程 / 资源 / 路线图均为下拉。
- **响应式 + 无障碍**：移动端抽屉导航、`prefers-reduced-motion` 适配、键盘可达。

### ✍️ 写作能力
- **Mermaid 自托管**：用 ` ```mermaid ` 围栏自动渲染，随 scheme 翻配色，**不依赖 CDN**。
- **Blowfish 兼容 shortcodes**：`badge` / `lead` / `callout` / `typeit` / `timeline`。
- 代码块一键复制、图片自动 `figure` + 点击 zoom、超宽位图自动缩放。

---

## 🚀 快速开始

### 1. 安装主题

**A. Git submodule（推荐）**

```bash
git submodule add https://github.com/socake/vishine.git themes/vishine
```

**B. 直接克隆**

```bash
git clone https://github.com/socake/vishine.git themes/vishine
```

### 2. 最小可用 `hugo.toml`

> 带 ⚠ 的几块是**漏了就会坏**的配置，务必照抄。

```toml
baseURL = "https://example.org/"
title   = "我的博客"
theme   = "vishine"
defaultContentLanguage = "zh-cn"   # ⚠ 中文主题，务必设置
enableEmoji = true

[pagination]
  pagerSize = 8

# ⚠ 必需：分类法。板块色映射、筛选、首页统计都依赖
[taxonomies]
  tag = "tags"
  category = "categories"

# ⚠⚠ 最易踩：漏掉 JSON，⌘K 搜索的 /index.json 会 404，搜索静默失效
[outputs]
  home = ["HTML", "RSS", "JSON"]

# ⚠ 必需：render hook 依赖这些 goldmark / highlight 设置
[markup]
  [markup.goldmark.parser]
    autoHeadingID = true
    [markup.goldmark.parser.attribute]
      title = true
      block = true
  [markup.highlight]
    noClasses = false
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 3

[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10

[params]
  author = "星辉"
  defaultScheme = "clean"   # paper / clean / dark
```

### 3. 启动

```bash
hugo server -D
```

浏览器打开 `http://localhost:1313/`。完整示例见 [`exampleSite/hugo.toml`](exampleSite/hugo.toml)（含多级菜单、featureZone、自动封面等）。

---

## 🎨 配置速览

### 三套配色切换

`defaultScheme` 设默认配色，顶栏图标可一键切换，读者偏好持久化到 `localStorage`：

```toml
[params]
  defaultScheme = "clean"   # paper（暖纸）/ clean（纯白）/ dark（暗色）
```

> 详见 [`docs/USAGE.md`](docs/USAGE.md) 与 [`docs/DESIGN.md`](docs/DESIGN.md)。

### 板块色彩编码

主题预设五大板块及板块色（`blog` / `play` / `road` / `docs` / `res`，另有 `ai` 红）。把**分类名**映射到板块 class，决定卡片 / 标签 / 自动封面的颜色。**在你自己站点的 `data/sections.toml` 配置**（Hugo 深合并会覆盖主题默认）：

```toml
[categories]
  "Kubernetes" = "docs"
  "云原生"      = "play"
  "FinOps"     = "road"
  "大模型"      = "res"
  "故障复盘"    = "ai"
```

未命中的分类自动回退到所属 section 的板块色，兜底 `blog`。

> 详见 [`docs/USAGE.md`](docs/USAGE.md)。

### 自动封面

文章无 `featured.*` 资源、无 frontmatter `cover` 时自动生成封面，4 版式据哈希轮换：

```toml
[params.cover]
  auto = true        # false = 关闭自动封面，纯靠 featured 图
  style = "auto"     # auto（按哈希轮换4版式）| orbit | grid | diagonal | arc
  # ignoreFeatured = false   # true = 即使有 featured 图也用自动封面
```

> 详见 [`docs/USAGE.md`](docs/USAGE.md)。

### 顶栏多级下拉菜单

父项用 `identifier`，子项用 `parent` 挂载，即成下拉：

```toml
[menu]
  [[menu.main]]
    name = "运维"
    identifier = "ops"
    weight = 40
  [[menu.main]]
    name = "Kubernetes"
    parent = "ops"
    pageRef = "/docs/kubernetes"
    weight = 41
  [[menu.main]]
    name = "Docker"
    parent = "ops"
    pageRef = "/docs/docker"
    weight = 42
```

> 详见 [`docs/USAGE.md`](docs/USAGE.md)。

---

## 📦 内置能力

### Shortcodes（Blowfish 兼容）

| Shortcode | 用法 | 说明 |
| --- | --- | --- |
| `badge` | `{{< badge >}}内容{{< /badge >}}` | 小徽章 |
| `lead` | `{{< lead >}}导语{{< /lead >}}` | 文首导语段 |
| `callout` | `{{< callout type="warn\|info\|tip" >}}…{{< /callout >}}` | 提示框（默认 `info`） |
| `typeit` | `{{< typeit >}}打字机文本{{< /typeit >}}` | 打字机动画 |
| `timeline` | 每行 `年份 \| 阶段 \| 关键词`（`\|` 分隔） | 竖直时间轴 |

### Mermaid（自托管）

用 ` ```mermaid ` 围栏书写图表，自动渲染并随配色 scheme 翻色。脚本自托管于 `static/js/mermaid.min.js`，**不依赖任何 CDN**，内网 / 离线环境也能用。

### ⌘K 搜索

全站命令面板搜索，索引来自 home 的 `/index.json`（覆盖标题 / 摘要 / 分类 / 标签）。**前提**：`[outputs] home` 必须含 `"JSON"`。

---

## 📖 文档索引

| 文档 | 内容 |
| --- | --- |
| [`docs/USAGE.md`](docs/USAGE.md) | 详细使用文档（配置逐项说明、写作、部署排坑、FAQ） |
| [`docs/DESIGN.md`](docs/DESIGN.md) | 设计系统（配色 token、板块色、组件、布局） |
| [`docs/INTERACTION.md`](docs/INTERACTION.md) | 交互规范（命令面板、抽屉、reduced-motion） |
| [`docs/MARKDOWN.md`](docs/MARKDOWN.md) | Markdown 渲染规范（prose 样式基准） |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | 开发路线图 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 贡献指南（本地开发、目录结构、代码风格、PR / issue 规范） |

---

## 🙏 致谢

vishine 二次开发自 **[Blowfish](https://github.com/nunocoracao/blowfish)**（© Nuno Coração，MIT），保留原作者归属。感谢 Blowfish 提供的坚实基座与优秀的 shortcodes 设计。

---

## 📄 License

本主题以 **[MIT License](./LICENSE)** 发布，版权所有 © 2024-2026 星辉 (Wenzhuo Huang)。

> 开源的是**主题**本身；`exampleSite/` 仅为演示内容，**不含**真实博客文章。

---

由 **星辉 (Wenzhuo Huang)** 开发 · [github.com/socake/vishine](https://github.com/socake/vishine)
