---
title: "配色与板块色彩编码"
weight: 20
categories: ["实战手册"]
tags: ["配色", "scheme", "板块色", "data"]
summary: "三套 scheme（paper / clean / dark）的切换与默认值，加上五大板块色彩编码与 data/sections.toml 配置示例。"
toc: true
---

{{< lead >}}
vishine 的颜色分两层：**全站 scheme**（亮 / 暗的整体观感）和**板块色**（按内容板块给卡片、标签、封面着色）。两者独立，互不干扰。
{{< /lead >}}

## 一、三套 scheme

| scheme | 名称 | 适用 |
| --- | --- | --- |
| `paper` | 暖纸 | 暖色护眼 |
| `clean` | 纯白 | 默认，干净 |
| `dark` | 暗色 | 暗环境 |

### 切换与持久化

- **切换**：顶栏右侧三个色块按钮，点一下即时生效。
- **默认值**：`params.defaultScheme`，写进 `<html data-scheme>`。
- **记忆**：存进 `localStorage` 的 `vishine-scheme`；页面渲染前由内联脚本读取应用，**无白屏闪烁**。

```toml
[params]
  defaultScheme = "clean"   # paper / clean / dark
```

{{< callout type="tip" >}}
试试点本页顶栏右上角的三个色块 —— 整站颜色、代码高亮、Mermaid 图都会一起翻色。这就是 scheme 的作用范围。
{{< /callout >}}

## 二、五大板块色彩编码

vishine 给五个内容板块各分配一个语义色，卡片左边色条、标签、自动封面都据此着色，读者扫一眼就知道是哪类内容。

{{< timeline >}}
博客   | posts → class: blog   | 日常技术记录
实战手册 | playbook → class: play | 可抄作业的工程实践
路线图  | roadmap → class: road  | 成长路径
运维文档 | docs → class: docs    | 系统化文档
资源   | resources → class: res | 导航 / 书单
{{< /timeline >}}

可选 class 共六个：`blog` / `play` / `road` / `docs` / `res` / `ai`（`ai` 留给 AI 专区类内容）。

## 三、板块色是怎么查出来的

着色逻辑（见 `layouts/partials/cat-class.html`），按顺序兜底：

1. 取文章 **首个分类**（`categories[0]`）→ 去站点 `data/sections.toml` 的 `[categories]` 查表；
2. 没查到 → 用文章所在 **section** 的板块 class；
3. 再兜底 → `blog`。

所以**首个分类决定一切**：板块色、自动封面配色，都看它。

## 四、配置 data/sections.toml

主题默认 `[categories]` 是**空的**。在**你自己站点**的 `data/sections.toml` 里配分类映射，Hugo 会深合并覆盖主题默认：

```toml
# 站点根目录 data/sections.toml
[categories]
  "Kubernetes" = "docs"
  "云原生"      = "play"
  "FinOps"     = "road"
  "大模型"      = "res"
  "故障复盘"    = "ai"
```

如果要新增板块本身（而不只是分类映射），在 `[sections]` 里加一项：

```toml
[sections]
  [sections.weekly]
    class = "blog"
    label = "周刊"
    en = "weekly"
```

{{< callout type="warn" >}}
**精确匹配**：分类名要和 frontmatter 里写的**完全一致**，包括空格和大小写。`"AI工具"` 与 `"AI 工具"` 是两条不同的 key —— 最常见的「颜色全灰扑扑」就是因为这里没对上，导致回退到默认色。
{{< /callout >}}

## 五、改实际色值

`data/sections.toml` 只管「哪个分类用哪个 class」，**真正的色值**是 CSS 变量（`--c-blog`、`--c-play` 等），定义在 `assets/css/`，并按 `data-scheme` 给三套 scheme 各配一份。

{{< callout type="info" >}}
改板块色记得**三套 scheme 各验一遍** —— 同一个 `--c-play` 在 paper / clean / dark 下是三个不同的色值，只改一处会让另外两套配色失衡。
{{< /callout >}}

下一步：[自动封面生成器](../auto-cover/) 会用到这里的板块色给封面上色。
