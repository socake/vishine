---
title: "03 · 配置站点：菜单、作者、三套配色、首页板块"
slug: "03-configuration"
weight: 23
date: 2026-06-21
categories: ["配置"]
tags: ["hugo.toml", "配色", "菜单", "params", "data"]
summary: "逐块讲透 hugo.toml：站点身份、作者信息、三套配色 scheme、首页板块展示，以及 data/sections.toml 的板块色映射。大量可复制的 toml。"
toc: true
---

{{< lead >}}
上一章给了「最小配置」。这一章把 `hugo.toml` 里和外观、导航、作者相关的块逐一讲清，让你能照着调出自己想要的样子。
{{< /lead >}}

## 一、站点身份与作者

主题首页的大标题、副标题、作者署名都从 `[params]` 取值：

```toml
title = "我的技术博客"        # 浏览器标签、RSS 标题

[params]
  author   = "星辉"           # 作者名，显示在文章头与首页
  authorEn = "Wenzhuo Huang"  # 英文名（可选）
  role     = "DevOps · 云原生 · CI/CD"   # 角色行，用「·」分隔会拆成小标签
  tagline  = "K8s 在跑，GitOps 在转。"    # 首页大标题，按中文逗号「，」自动换行
  description = "真实踩坑记录，不写废话。"  # 站点简介，用于副文案与 SEO
  since = 2024                # 建站年份，显示在统计面板「SINCE」
```

{{< callout type="tip" >}}
`tagline` 会按中文逗号「，」拆成多行，**最后一句自动高亮**。想要标题分两行、末句强调，就用逗号断句，比如 `"白天写代码，晚上修 bug。"`。
{{< /callout >}}

## 二、三套配色 scheme

vishine 内置三套配色，读者可在顶栏右上角点色块即时切换：

| scheme | 名称 | 适用场景 |
| --- | --- | --- |
| `paper` | 暖纸 | 暖色护眼 |
| `clean` | 纯白 | 干净明亮（默认） |
| `dark`  | 暗色 | 暗光环境 |

你只需设默认值：

```toml
[params]
  defaultScheme = "clean"   # paper / clean / dark
```

- **默认值**写进页面 `<html data-scheme>`。
- 读者切换后，选择存进浏览器 `localStorage`，下次访问记得住。
- 切换不止换背景：**代码高亮、Mermaid 图、卡片色**会一起翻色，无白屏闪烁。

{{< callout type="info" >}}
试试点本页顶栏右上角的三个小色块 —— 整页颜色、代码块、下面的图都会跟着变。这就是 scheme 的作用范围。
{{< /callout >}}

## 三、板块色彩编码（重点）

除了整站的明/暗 scheme，vishine 还有一层**板块色**：按内容「属于哪个板块」给卡片左色条、分类标签、自动封面着色，读者扫一眼就知道是哪类内容。

五大板块及其颜色 class：

{{< timeline >}}
博客   | posts → class: blog   | 日常技术记录
实战手册 | playbook → class: play | 可抄作业的工程实践
路线图  | roadmap → class: road  | 成长路径
教程文档 | docs → class: docs    | 系统化文档
资源   | resources → class: res | 导航 / 书单
{{< /timeline >}}

可选 class 共 6 个：`blog` / `play` / `road` / `docs` / `res` / `ai`。

### 板块色是怎么查出来的

着色按这个顺序兜底：

1. 取文章**首个分类** `categories[0]` → 去站点 `data/sections.toml` 的 `[categories]` 查它对应哪个 class；
2. 查不到 → 用文章所在 **section** 的板块 class；
3. 再兜底 → `blog`。

所以 **「首个分类」决定一切**：板块色、自动封面配色都看它。

### 配置 data/sections.toml

主题自带的 `[categories]` 是空的。在**你自己站点**根目录建 `data/sections.toml` 写映射，Hugo 会自动「深度合并」覆盖主题默认：

```toml
# 站点根目录 data/sections.toml
[categories]
  "Kubernetes" = "docs"
  "云原生"      = "play"
  "FinOps"     = "road"
  "大模型"      = "res"
  "故障复盘"    = "ai"
```

{{< callout type="warn" >}}
**分类名要精确匹配**，包括空格和大小写。`"AI工具"` 和 `"AI 工具"`（多一个空格）是两条不同的 key。最常见的「颜色全灰扑扑」就是因为这里没对上，导致回退到默认色。
{{< /callout >}}

## 四、首页展示哪些板块

首页的「板块入口」默认展示 posts / playbook / docs / roadmap / resources 五块。如果你的站只用其中几块，用 `homeSections` 指定：

```toml
[params]
  # 只在首页展示这两个板块（按数组顺序排列）
  homeSections = ["posts", "docs"]
```

## 五、可选：首页特色横幅

想在首页加一块醒目横幅（比如「AI 专区」「开始上手」），配 `[params.featureZone]`，不配则不显示：

```toml
[params.featureZone]
  title = "AI 专区"
  en    = "AI ZONE"
  desc  = "大模型 / 工具 / 应用的工程化实践"
  count = "4 方向"
  [params.featureZone.lead]
    title = "AI 在帮我写脚本"
    desc  = "把大模型真正接进工作流。"
  [[params.featureZone.cols]]
    k = "LLM"
    name = "大模型"
    desc = "推理、提示工程、模型选型。"
  [[params.featureZone.cols]]
    k = "OPS"
    name = "AIOps"
    desc = "智能告警降噪、根因分析。"
```

{{< callout type="tip" >}}
颜色改不动？记住分两层：`data/sections.toml` 只管「哪个分类用哪个 class」；**真正的色值**是 CSS 变量（`--c-blog`、`--c-play`…），按三套 scheme 各定义一份。改色值要去主题 `assets/css/`，且三套配色都得各验一遍。
{{< /callout >}}

{{< callout type="info" >}}
配置就讲到这。下一章 **[04 · 写第一篇文章](../04-first-post/)** 教你 front matter（文章头部元数据）怎么写、分类怎么决定板块色。
{{< /callout >}}
