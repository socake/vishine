---
title: "Shortcodes 大全"
weight: 40
categories: ["实战手册"]
tags: ["shortcode", "badge", "callout", "lead", "timeline"]
summary: "badge / callout / lead / timeline 四个 Blowfish 兼容 shortcode 的用法与实时渲染效果，每个都在本页真实调用。"
toc: true
---

{{< lead >}}
本页每个示例都「**先给代码，再给真实渲染**」—— 你看到的徽章、提示框、引言、时间轴，全是 vishine 在这个页面里真正跑出来的输出，不是截图。
{{< /lead >}}

vishine 兼容 Blowfish 的常用 shortcode，写法完全一致。下面逐个演示。

{{< callout type="info" >}}
**前提**：`hugo.toml` 里 `[markup.goldmark.renderer] unsafe = true`。这些 shortcode 会输出行内 HTML，关掉 unsafe 会被转义成纯文本。
{{< /callout >}}

## 一、badge 行内徽章

给某个词加一个小标签，常用于标版本、状态、关键词。

**用法：**

```markdown
当前版本 {{</* badge */>}}v1.0{{</* /badge */>}}，状态 {{</* badge */>}}稳定{{</* /badge */>}}。
```

**渲染效果：**

当前版本 {{< badge >}}v1.0{{< /badge >}}，状态 {{< badge >}}稳定{{< /badge >}}，建议 {{< badge >}}生产可用{{< /badge >}}。

## 二、callout 提示框

把重点、警告、技巧从正文里拎出来。`type` 三选一：

- `warn` —— ⚠️ 警告 / 易错点
- `info` —— 💡 信息（**默认**，非法值也回退到它）
- `tip` —— ✅ 技巧 / 建议

**用法：**

```markdown
{{</* callout type="warn" */>}}
内容支持 **Markdown**，可以加粗、放 `代码`、列清单。
{{</* /callout */>}}
```

**渲染效果：**

{{< callout type="warn" >}}
这是 `warn` 提示框。内容支持 **Markdown** —— 加粗、`行内代码`、链接都能用。常用于标注「漏了就坏」的配置。
{{< /callout >}}

{{< callout type="info" >}}
这是 `info` 提示框（默认类型）。适合补充说明、背景信息。
{{< /callout >}}

{{< callout type="tip" >}}
这是 `tip` 提示框。适合「这样做更好」「省心写法」之类的建议。
{{< /callout >}}

## 三、lead 引言段

文章开头的一段引子，视觉上比正文更突出，用来点题。

**用法：**

```markdown
{{</* lead */>}}
一句话讲清这篇文章要解决什么问题，给读者一个继续读的理由。
{{</* /lead */>}}
```

**渲染效果：**

{{< lead >}}
lead 适合放在文章最前面 —— 用一两句话点出主旨，比直接进正文更有「导读」感。内容同样支持 Markdown。
{{< /lead >}}

## 四、timeline 竖直时间轴

把成长路径、版本演进、项目里程碑画成一条竖线。每行一个节点，用 `|` 分三段：**节点 | 阶段 | 关键词**。

**用法：**

```markdown
{{</* timeline */>}}
2023 | 规模化：双云架构 + 多集群治理 | AWS + ACK、Karpenter 降本
2024 | 安全与可观测性补课 | Cilium、Loki 跨集群、零信任
2025 | 平台工程落地 | IDP、自助式发布、金丝雀
{{</* /timeline */>}}
```

**渲染效果：**

{{< timeline >}}
2023 | 规模化：双云架构 + 多集群治理 | AWS + ACK、Karpenter 降本
2024 | 安全与可观测性补课 | Cilium、Loki 跨集群、零信任
2025 | 平台工程落地 | IDP、自助式发布、金丝雀
{{< /timeline >}}

{{< callout type="tip" >}}
三段里后两段可省：只写「节点」是纯时间点，写「节点 \| 阶段」是带标题的节点，三段全写才有关键词副标题。分隔符两侧的空格会自动 trim。
{{< /callout >}}

## 速查表

| shortcode | 形态 | 关键参数 | 典型用途 |
| --- | --- | --- | --- |
| `badge` | 行内 | 无 | 版本号、状态标签 |
| `callout` | 块级 | `type=warn\|info\|tip` | 警告 / 信息 / 技巧 |
| `lead` | 块级 | 无 | 文章导读引言 |
| `timeline` | 块级 | 行内 `\|` 分段 | 成长路径、版本演进 |

下一步：[Mermaid 图表](../diagrams/) —— 用围栏画会随配色翻色的流程图。
