---
title: "02 · 安装 vishine：新建站点并拉入主题"
slug: "02-install"
weight: 22
date: 2026-06-21
categories: ["安装"]
tags: ["Hugo", "submodule", "主题", "快速开始"]
summary: "新建一个 Hugo 站点，用三种方式之一把 vishine 主题装进来（推荐 submodule），写最小可用配置，然后 hugo server 本地跑起来。"
toc: true
---

{{< lead >}}
目标：从零新建一个站点，把 vishine 装进去，并在本地浏览器里看到它跑起来 —— 全程不超过五分钟。
{{< /lead >}}

## 一、新建站点

```bash
hugo new site myblog   # 在当前目录生成一个名为 myblog 的站点骨架
cd myblog              # 进入它
git init               # 把这个目录变成一个 Git 仓库（后面装主题、部署都要用）
```

`hugo new site` 会生成这样一套空目录：

```text
myblog/
├── archetypes/     # 新建文章的「模板」（front matter 预设）
├── assets/         # 需要 Hugo 处理的资源（CSS/JS/图）
├── content/        # ★ 你写的所有文章都放这里
├── data/           # 数据文件（vishine 的板块色映射就放这）
├── layouts/        # 你自定义的模板（用主题时通常留空）
├── static/         # 原样复制到网站根目录的静态文件
├── themes/         # ★ 主题放这里
└── hugo.toml       # ★ 站点总配置（下一章详细配）
```

{{< callout type="info" >}}
带 ★ 的三处是你最常打交道的：`content/`（写内容）、`themes/`（放主题）、`hugo.toml`（配置）。
{{< /callout >}}

## 二、把 vishine 装进 themes/（三选一）

「装主题」本质就是把主题的文件放进 `themes/vishine/` 这个目录。三种方式：

### 方式 A：Git submodule（**推荐**）

submodule（子模块）= 在你的仓库里「嵌套」另一个 Git 仓库的引用。好处是日后升级方便，且部署到 GitHub Actions 时能自动拉取。

```bash
git submodule add https://github.com/socake/vishine.git themes/vishine
```

### 方式 B：直接 clone（简单，但不便升级）

```bash
git clone https://github.com/socake/vishine.git themes/vishine
```

### 方式 C：Hugo Module（进阶）

Hugo Module 用 Go 的模块机制管理主题，适合熟悉 Go 工具链的用户：

```bash
hugo mod init github.com/你的用户名/myblog   # 初始化模块（只需一次）
hugo mod get -u github.com/socake/vishine     # 拉取主题
# 然后在 hugo.toml 配 [module] imports 指向 vishine（略，见官方文档）
```

{{< callout type="tip" >}}
**新手就用方式 A（submodule）。** 升级主题只需一条命令：
`git submodule update --remote themes/vishine`。
（方式 C 升级用 `hugo mod get -u`。）
{{< /callout >}}

## 三、写一份「最小可用」配置

打开站点根目录的 `hugo.toml`，先填这份精简版（只含让主题正常工作的必需项，每行都有注释）。完整逐项讲解放在 [03 · 配置站点](../03-configuration/)。

```toml
baseURL = "https://example.org/"   # 部署网址，本地预览时可随便填
title   = "我的博客"
theme   = "vishine"                # 必须等于 themes/ 下的文件夹名
defaultContentLanguage = "zh-cn"   # 必填：中文主题

# 必需：板块色 / 筛选 / 统计都依赖分类法
[taxonomies]
  tag = "tags"
  category = "categories"

# 必需：home 含 JSON，⌘K 命令面板搜索才有数据
[outputs]
  home = ["HTML", "RSS", "JSON"]

[params]
  author = "你的名字"
  defaultScheme = "clean"          # paper / clean / dark
  [params.cover]
    auto = true                    # 无封面图时自动生成

# 主题渲染依赖的 Markdown 设置
[markup]
  [markup.goldmark.renderer]
    unsafe = true                  # shortcode 输出行内 HTML 需要
  [markup.goldmark.parser]
    autoHeadingID = true           # 目录/锚点需要
  [markup.highlight]
    noClasses = false              # 代码高亮随配色翻色

# 顶栏导航（不配则没有菜单）
[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10
```

{{< callout type="warn" >}}
三件「漏了就坏、还不报错」的事，务必检查：

1. `[outputs] home` 必须含 `"JSON"`，否则 ⌘K 搜索打得开却搜不到。
2. `[taxonomies]` 必须有 `tag` / `category`，否则板块色、筛选、统计全失效。
3. `[markup.highlight] noClasses` 必须是 `false`，否则代码块不随三套配色换色。
{{< /callout >}}

## 四、本地跑起来

```bash
hugo server -D
```

- `hugo server` 启动一个本地开发服务器，改文件会**自动刷新**浏览器。
- `-D` 表示连「草稿」（front matter 里 `draft: true` 的文章）也显示。

终端会提示一个地址，浏览器打开它即可：

```text
Web Server is available at http://localhost:1313/
```

{{< callout type="tip" >}}
看到页面就成功了！此刻站里还没文章，所以比较空 —— 没关系，[04 · 写第一篇](../04-first-post/) 就来填内容。想先把外观和导航调好，去 [03 · 配置站点](../03-configuration/)。
{{< /callout >}}

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 构建报「资源处理」错误 | 装的不是 Hugo **extended** 版（回 [01 章](../01-environment/)） |
| 页面一片空白、报找不到主题 | `themes/vishine/` 是否真的有文件？`theme = "vishine"` 拼写对不对？ |
| 顶栏没有导航 | 没配 `[menu.main]` |
