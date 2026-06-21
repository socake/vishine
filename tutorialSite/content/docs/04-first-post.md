---
title: "04 · 写第一篇文章：front matter 与 Markdown"
slug: "04-first-post"
weight: 24
date: 2026-06-21
categories: ["写作"]
tags: ["front matter", "Markdown", "分类", "写作"]
summary: "新建文章、逐项讲解 front matter（标题/日期/分类/标签/摘要），写一段标准 Markdown，并说明为什么「首个分类」决定了卡片和封面的板块色。"
toc: true
---

{{< lead >}}
环境和配置都就绪了，现在来写内容。本章带你发出第一篇文章，并把文章顶部那段「front matter」彻底讲明白 —— 它决定了标题、时间、分类，以及这篇文章在列表里是什么颜色。
{{< /lead >}}

## 一、新建一篇文章

```bash
hugo new posts/hello.md
```

这会在 `content/posts/hello.md` 生成一个带预设头部的文件。`posts` 是「板块（section）」名 —— 文章放在哪个目录，就属于哪个板块。

{{< callout type="info" >}}
**section（板块）** 就是 `content/` 下的一级目录。放 `content/posts/` 里的属于 posts 板块，放 `content/docs/` 里的属于 docs 板块。板块决定了用哪套列表样式，也参与板块色的兜底。
{{< /callout >}}

## 二、front matter 详解

打开刚建的文件，最上面被两行 `---` 包起来的部分就是 **front matter（前置元数据）**—— 描述这篇文章「是什么」的结构化信息。vishine 常用这些字段：

```yaml
---
title: "你好，vishine"                    # 文章标题（必填）
date: 2026-06-21T10:00:00+08:00          # 发布时间，带时区；决定排序与显示日期
draft: false                             # true=草稿，正式构建时不输出；hugo server -D 可预览
categories: ["随笔"]                      # 分类（粗粒度）。★ 首个分类决定板块色
tags: ["第一篇", "上手"]                   # 标签（细粒度关键词），可多个
summary: "用 vishine 写的第一篇文章。"     # 列表卡片上显示的摘要；不写则自动截取正文
toc: true                                # 是否显示右侧目录（文章长就开）
---
```

逐项说明：

| 字段 | 作用 | 不写会怎样 |
| --- | --- | --- |
| `title` | 标题 | 必填，缺了无标题 |
| `date` | 时间，决定排序 | 默认取文件创建时间 |
| `draft` | 草稿开关 | 默认 false（即正式发布） |
| `categories` | 分类，**首个决定板块色** | 回退到所属 section 的色 |
| `tags` | 标签关键词 | 无标签，少了筛选维度 |
| `summary` | 列表摘要 | 自动截取正文前几十字 |
| `toc` | 右侧目录 | 看主题默认 |

{{< callout type="warn" >}}
`categories` 里**第一个**分类最关键。它会去 `data/sections.toml` 查板块色（见 [03 章](../03-configuration/)）。比如首个分类是 `"Kubernetes"` 且映射到 `docs`，这篇的卡片左色条、自动封面就是 docs 的颜色。
{{< /callout >}}

## 三、写正文：标准 Markdown

front matter 下面（第二行 `---` 之后）就是正文，用 Markdown 写：

```markdown
## 二级标题

这是一段正文。可以**加粗**、*斜体*、加 `行内代码`，或放[链接](https://gohugo.io)。

- 无序列表项一
- 无序列表项二

1. 有序列表项一
2. 有序列表项二

> 这是引用块，常用来放金句或注解。

\```bash
echo "代码块会带语法高亮，并跟着配色翻色"
\```

| 表头 A | 表头 B |
| --- | --- |
| 单元格 | 单元格 |
```

{{< callout type="info" >}}
**Markdown** 是一种用纯文本写排版的格式：用 `#` 表示标题、`-` 表示列表、`**` 表示加粗。它简单、可读、好维护，是技术写作的事实标准。
{{< /callout >}}

## 四、预览这篇文章

如果 `hugo server` 还开着，保存文件后浏览器会自动刷新；没开就：

```bash
hugo server -D    # -D 让 draft: true 的草稿也显示
```

打开 `http://localhost:1313`，进入对应板块就能看到这篇文章的卡片，点进去是详情页（右侧带目录）。

## 五、Page Bundle：给文章配图

如果一篇文章要带图（尤其是封面），推荐用 **page bundle（页面捆绑）**：把文章建成一个目录，`index.md` + 图片放一起。

```text
content/posts/hello/
├── index.md        # 文章正文（注意是 index.md 不是 hello.md）
└── featured.jpg    # ★ 命名为 featured.* 会被识别为封面
```

放了 `featured.jpg`/`.png`/`.svg` 的文章，列表和详情页就用这张当封面；没放的话，主题会自动生成 —— 这正是下一章的内容。

{{< callout type="tip" >}}
会写文章了！接着看 **[05 · 自动封面](../05-auto-cover/)**：不放图也能有统一风格的封面，以及 `params.cover` 的全部选项。
{{< /callout >}}
