---
title: "05 · 自动封面生成器：params.cover 全选项"
slug: "05-auto-cover"
weight: 31
date: 2026-06-21
categories: ["封面"]
tags: ["cover", "封面", "SVG", "自动化"]
summary: "文章不放图，主题也能按「标题 + 分类」纯 Hugo 原生生成统一风格的 SVG 封面。讲清封面优先级、两种规格、params.cover 的 auto / style / ignoreFeatured 全部选项。"
toc: true
---

{{< lead >}}
想放什么图就放什么；不放，vishine 也会按「标题 + 分类」生成一张风格统一的封面 —— 纯 Hugo 原生，零外部依赖、无 JavaScript、无第三方服务。
{{< /lead >}}

## 一、封面优先级

列表卡片、详情页横幅取封面时，按这个顺序从高到低：

1. **`featured.*` 资源** —— page bundle 里的 `featured.jpg` / `.png` / `.svg`，最优先（位图超尺寸会自动缩成 webp）。
2. **front matter `cover: "网址"`** —— 手动指定一张图。
3. **自动生成** —— 以上都没有时，按「标题 + 首个分类」生成 SVG，缓存到 `/covers/`。

{{< callout type="info" >}}
自动封面**绝不会抢你的图**。只要文章有 `featured.*` 或写了 `cover`，主题就用你的。自动生成只在「你什么都没给」时兜底。
{{< /callout >}}

## 二、两种规格

| 规格 | 用途 | 尺寸 | 特点 |
| --- | --- | --- | --- |
| **hero** | 详情页顶部横幅 | 1200×630 | 带文章标题 + 丰富装饰 |
| **thumb** | 列表缩略图 | 800×500 | 无标题，大分类名 + 几何图形，**4 种版式按哈希轮换** |

thumb 的 4 种版式 —— `orbit`（同心圆）/ `grid`（点阵）/ `diagonal`（对角）/ `arc`（弧线）—— 会按文章哈希轮换，同一个列表页里尽量不重复，视觉上自然错落。

## 三、配置 [params.cover]

```toml
[params.cover]
  auto = true            # false = 关闭自动封面，只用 featured 图
  style = "auto"         # auto = 轮换4版式；或锁定 orbit / grid / diagonal / arc 之一
  ignoreFeatured = false # true = 忽略文章里的 featured.* 老图，全部改用自动封面
```

逐项说明：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `auto` | `true` | `false` = 彻底关闭自动生成，只用 featured 图 |
| `style` | `"auto"` | `auto` 按哈希轮换 4 版式；或锁死 `orbit` / `grid` / `diagonal` / `arc` 之一 |
| `ignoreFeatured` | `false` | `true` = 无视所有 `featured.*` 老图，全站统一用自动封面 |

## 四、几种典型配置

**默认（推荐）** —— 自动轮换，有图用图：

```toml
[params.cover]
  auto = true
  style = "auto"
```

**锁定单一版式** —— 想要整站封面风格高度统一：

```toml
[params.cover]
  auto = true
  style = "orbit"   # 所有缩略图都用同心圆版式
```

**从旧主题迁移** —— 旧文章那些尺寸不一、风格杂乱的 featured 图不想逐个删：

```toml
[params.cover]
  auto = true
  ignoreFeatured = true   # 旧图照留，但全部用自动封面覆盖显示
```

{{< callout type="tip" >}}
`ignoreFeatured = true` 是迁移利器：一行配置就能让全站封面瞬间统一，想换回随时改回 `false`，旧图原封不动。
{{< /callout >}}

## 五、着色逻辑

自动封面的颜色就是 [03 章](../03-configuration/) 讲的**板块色**：

- 取文章首个分类 → 查 `data/sections.toml` → 得到板块 class → 上对应颜色；
- 无分类则回退所属 section 的色，再兜底 `blog`。

字号还会自适应：按「视觉宽度」算（中文≈1、英文≈0.55），不同长度的分类名字号视觉一致；hero 标题过长会按字符安全断成两行，不会切坏汉字。

{{< callout type="warn" >}}
自动封面是生成后**缓存**的。如果你改了板块色映射或主题的封面模板，却没看到变化，删掉 `public/covers/` 和 `resources/` 缓存目录再重新构建即可。
{{< /callout >}}

{{< callout type="info" >}}
封面搞定。下一章 **[06 · Shortcodes 大全](../06-shortcodes/)** 教你在正文里用徽章、提示框、引言、时间轴 —— 你在本教程里看到的这些框，全是它们。
{{< /callout >}}
