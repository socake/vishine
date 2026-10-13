---
title: "05 · 自动封面生成器：params.cover 全选项"
slug: "05-auto-cover"
weight: 31
date: 2026-06-21
categories: ["封面"]
tags: ["cover", "封面", "SVG", "自动化"]
summary: "文章不放图，主题也能按短主题标识与板块色生成 SVG 封面。讲清封面优先级、两种规格，以及 auto / autoArticle / style / ignoreFeatured 选项。"
toc: true
---

{{< lead >}}
想放什么图就放什么；不放，vishine 也会按短主题标识和板块色生成一张风格统一的封面 —— 纯 Hugo 原生，零外部依赖、无 JavaScript、无第三方服务。
{{< /lead >}}

## 一、封面优先级

列表卡片、详情页横幅取封面时，按这个顺序从高到低：

1. **`featured.*` 资源** —— page bundle 里的 `featured.jpg` / `.png` / `.svg`，最优先（位图超尺寸会自动缩成 webp）。
2. **front matter `cover: "网址"`** —— 手动指定一张图。
3. **自动生成** —— 以上都没有时，为列表与正文生成 SVG，缓存到 `/covers/`。正文默认保留宽幅主题图；`autoArticle=false` 可以单独关闭它。

{{< callout type="info" >}}
自动封面**绝不会抢你的图**。只要文章有 `featured.*` 或写了 `cover`，主题就用你的。自动生成只在「你什么都没给」时兜底。
{{< /callout >}}

## 二、两种规格

| 规格 | 用途 | 尺寸 | 特点 |
| --- | --- | --- | --- |
| **hero** | 正文与手机列表 | 1200×420 | 短主题标识与几何图形，完整标题只在 HTML 中显示 |
| **thumb** | 桌面文章列表、分类／标签网格卡 | 800×500 | 几何图形与短标识，优先 coverLabel，再取首个 tag、分类或 section |

thumb 的 4 种版式 —— `orbit`（同心圆）/ `grid`（点阵）/ `diagonal`（对角）/ `arc`（弧线）—— 按文章稳定选择。短标识最多 18 字，超长省略；完整标题显示在图片旁或下方。分类／标签网格的自动缩略图在桌面和手机都按 16:10 铺满；普通文章列表在手机改用宽幅 hero 图。可复制配置与实际示例见 [13 · 首页与品牌](../13-home-brand/#封面断行)。

## 三、配置 [params.cover]

```toml
[params.cover]
  auto = true            # false = 关闭自动封面，仍可用 featured 或 cover
  autoArticle = true     # false 单独关闭正文自动横幅
  style = "auto"         # auto = 轮换4版式；或锁定 orbit / grid / diagonal / arc 之一
  ignoreFeatured = false # true = 跳过 featured.*，继续按 cover / 自动封面取图
```

逐项说明：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `auto` | `true` | `false` = 关闭自动生成，仍可用 featured 或 cover |
| `autoArticle` | `true` | 默认在 auto 未关闭时，为没有作者封面的正文生成宽幅主题图；false 单独关闭，article.showCover=false 仍优先关闭 |
| `style` | `"auto"` | `auto` 根据标题长度和日期稳定选择 4 版式；或指定 `orbit` / `grid` / `diagonal` / `arc` 之一 |
| `ignoreFeatured` | `false` | `true` = 跳过 featured 资源；显式 cover 仍优先，正文自动横幅仍遵循 autoArticle 开关 |

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
  ignoreFeatured = true   # 保留旧资源文件，呈现时跳过 featured
```

{{< callout type="tip" >}}
`ignoreFeatured = true` 可以在保留旧资源文件的情况下停用 featured 图；显式 `cover` 仍然优先。想换回时改为 `false`。若不需要正文自动横幅，可用 `autoArticle=false` 单独关闭。
{{< /callout >}}

## 五、着色逻辑

自动封面的颜色就是 [03 章](../03-configuration/) 讲的**板块色**：

- 取文章首个分类 → 查 `data/sections.toml` → 得到板块 class → 上对应颜色；
- 无分类则回退所属 section 的色，再兜底 `blog`。

短标识按视觉宽度自适应字号（中文≈1、英文≈0.62），最多 18 字，超长省略。hero 与 thumb 共享 `coverLabel → 首个标签 → 分类 → section` 的回退顺序；完整标题留在 HTML，主题图不用小字重复文章标题。桌面列表使用较大的缩略图，手机列表切换宽幅图，图片和标题上下排列。

{{< callout type="warn" >}}
自动封面是生成后**缓存**的。如果你改了板块色映射或主题的封面模板，却没看到变化，删掉 `public/covers/` 和 `resources/` 缓存目录再重新构建即可。
{{< /callout >}}

{{< callout type="info" >}}
封面搞定。下一章 **[06 · Shortcodes 大全](../06-shortcodes/)** 教你在正文里用徽章、提示框、引言、时间轴 —— 你在本教程里看到的这些框，全是它们。
{{< /callout >}}
