---
title: "安装与快速开始"
weight: 10
categories: ["实战手册"]
tags: ["安装", "快速开始", "Hugo"]
summary: "把 vishine clone 进 themes、写最小 hugo.toml、用 hugo server 在五分钟内跑起来。"
toc: true
---

{{< lead >}}
目标：从零到本地预览一个 vishine 站点，全程不超过五分钟。
{{< /lead >}}

## 0. 环境要求

vishine 用到 Hugo 的资源处理管线（图片缩放、SVG 内联、CSS/JS 指纹），必须用 **extended** 版本。

{{< callout type="warn" >}}
**必须是 Hugo extended ≥ 0.146.0**。普通版会在构建时报资源处理错误。用 `hugo version` 确认输出里带 `extended` 字样。
{{< /callout >}}

```bash
hugo version
# hugo v0.146.0+extended ... 看到 extended 才对
```

## 1. 新建站点

```bash
hugo new site myblog
cd myblog
git init
```

## 2. 安装主题

三选一，推荐 submodule（方便升级）：

```bash
# A. Git submodule（推荐）
git submodule add https://github.com/socake/vishine.git themes/vishine

# B. 直接克隆
git clone https://github.com/socake/vishine.git themes/vishine

# C. Hugo Module（需先在 hugo.toml 配 module.imports）
hugo mod get -u github.com/socake/vishine
```

升级：submodule 用 `git submodule update --remote`，Module 用 `hugo mod get -u`。

## 3. 最小 hugo.toml

把下面这份写进站点根目录的 `hugo.toml`。它只含**让主题正常工作的必需项**，每行的作用都标了注释。

```toml
baseURL = "https://example.org/"
title   = "我的博客"
theme   = "vishine"
defaultContentLanguage = "zh-cn"   # 必需
enableEmoji = true

# 必需：板块色 / 筛选 / 统计都依赖分类法
[taxonomies]
  tag = "tags"
  category = "categories"

# 必需：home 含 JSON，⌘K 搜索才有数据源
[outputs]
  home = ["HTML", "RSS", "JSON"]

[params]
  author = "星辉"
  defaultScheme = "clean"           # paper / clean / dark
  [params.cover]
    auto = true                     # 无 featured 图时自动生成封面

# render hook 依赖的 markup 设置
[markup]
  [markup.goldmark.renderer]
    unsafe = true                   # shortcode 输出行内 HTML（badge 等）需要
  [markup.goldmark.parser]
    autoHeadingID = true            # TOC / 锚点必需
  [markup.highlight]
    noClasses = false               # 代码高亮随 scheme 翻色

# 顶栏导航（不配则没有菜单）
[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10
```

{{< callout type="warn" >}}
三件「漏了就坏」的事：

1. `[outputs] home` 必须含 `JSON`，否则 ⌘K 搜索静默失效（打开了却搜不到，且无报错）。
2. `[taxonomies]` 必须有 `tag` / `category`，否则板块色、筛选、统计全坏。
3. `[markup.highlight] noClasses` 必须是 `false`，否则代码高亮不随三套 scheme 换色。
{{< /callout >}}

## 4. 写第一篇文章

```bash
hugo new posts/hello.md
```

编辑 `content/posts/hello.md`：

```yaml
---
title: "你好，vishine"
date: 2026-06-21T10:00:00+08:00
categories: ["随笔"]
tags: ["第一篇"]
summary: "用 vishine 写的第一篇文章。"
---

正文从这里开始。{{</* badge */>}}它能跑了{{</* /badge */>}}
```

## 5. 本地预览

```bash
hugo server -D
```

打开 http://localhost:1313 。`-D` 让草稿（`draft: true`）也显示。

{{< callout type="tip" >}}
跑通后，接着读 [配色与板块色彩编码](../color-schemes/) 调外观，或直接看 [Shortcodes 大全](../shortcodes/) 学写作元素。
{{< /callout >}}

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 构建报资源处理错误 | 用的不是 Hugo **extended** 版 |
| 顶栏没有导航 | 没配 `[menu.main]` |
| ⌘K 打开却搜不到 | `[outputs] home` 漏了 `"JSON"` |
| 代码块三套配色不换色 | `[markup.highlight] noClasses` 不是 `false` |
