---
title: "自动封面生成器"
weight: 30
categories: ["实战手册"]
tags: ["封面", "cover", "SVG", "自动化"]
summary: "文章无 featured 图时，按标题 + 分类纯 Hugo 原生生成统一风格 SVG 封面，params.cover 全部选项详解。"
toc: true
---

{{< lead >}}
能自定义，也能全自动。你想放什么图就放什么；不放，主题也会按「标题 + 分类」生成一张风格统一的封面 —— 纯 Hugo 原生，零外部依赖、无 JS、无第三方。
{{< /lead >}}

## 一、封面优先级

list / single / card 三处一致，从高到低：

1. **`featured.*` 资源** —— page bundle 里放 `featured.jpg` / `featured.png` / `featured.svg`，最优先（位图超尺寸自动缩 webp）。
2. **frontmatter `cover: "url"`** —— 手动指定一张图。
3. **自动生成** —— 以上都没有时，按「标题 + 首个分类」纯 Hugo 原生生成 SVG，缓存到 `/covers/`。

{{< callout type="info" >}}
自动封面**绝不抢你的图**。只要 page bundle 里有 `featured.*` 或 frontmatter 写了 `cover`，主题就用你的。自动生成只在「你什么都没给」时兜底。
{{< /callout >}}

## 二、两种规格

| variant | 用途 | 尺寸 | 特点 |
| --- | --- | --- | --- |
| **hero** | 详情页横幅 | 1200×630 | 带文章标题 + 丰富装饰 |
| **thumb** | 列表缩略图 | 800×500 | 无标题，大分类名 + 几何，**4 种版式据哈希轮换** |

thumb 的 4 种版式（orbit 同心圆 / grid 点阵 / diagonal 对角 / arc 弧线）会按文章哈希轮换，**同一个列表页里不重复**，视觉上自然错落。

## 三、配置 [params.cover]

```toml
[params.cover]
  auto = true          # false = 关闭自动封面，纯靠 featured 图
  style = "auto"       # auto（轮换4版式）| orbit | grid | diagonal | arc（锁定单一版式）
  ignoreFeatured = false  # true = 忽略文章里的 featured.* 老图，全部用自动封面
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `auto` | `true` | `false` = 彻底关闭自动生成，只用 featured 图 |
| `style` | `"auto"` | `auto` 按哈希轮换 4 版式；或锁定 `orbit` / `grid` / `diagonal` / `arc` 之一 |
| `ignoreFeatured` | `false` | `true` = 忽略所有 `featured.*` 老图，全站统一用自动封面 |

### 几种典型配置

**默认（推荐）**——自动轮换，有图用图：

```toml
[params.cover]
  auto = true
  style = "auto"
```

**锁定单一版式**——想要整站封面风格高度统一：

```toml
[params.cover]
  auto = true
  style = "orbit"   # 所有缩略图都用同心圆版式
```

**从旧主题迁移、想统一换新风格**——不必删旧图，一行配置全部改用自动封面：

```toml
[params.cover]
  auto = true
  ignoreFeatured = true   # 旧 featured.* 图照留，但全部用自动封面覆盖显示
```

{{< callout type="tip" >}}
`ignoreFeatured = true` 是迁移利器：旧文章里那些尺寸不一、风格杂乱的 featured 图不用动，改一行配置就能让全站封面瞬间统一，想换回随时改回 `false`。
{{< /callout >}}

## 四、着色与字号

- **板块色**：查 `data/sections.toml`（首个分类 → 板块 class → 色），无分类回退 section，兜底 `blog`。见 [配色与板块色彩编码](../color-schemes/)。
- **字号自适应**：按**视觉宽度**计算（中文≈1 / 英文≈0.55），不同长度的分类名字号视觉一致；hero 标题超 11 字按 rune 安全断两行，不会切坏汉字。

## 五、自定义与扩展

- **换配色**：改 `data/sections.toml` 的分类映射 + `cover-svg.html` 顶部的 `$pal` / `$palD` / `$palB` 三组调色板（对应三套 scheme）。
- **加新版式**：在 `cover-svg.html` 的 thumb 分支加一段 `{{ else if eq $seed 4 }}…几何…{{ end }}`，并把版式选择的 `mod … 4` 改成 `5`。
- **改横幅风格**：改 hero 分支的装饰逻辑。

{{< callout type="warn" >}}
自动封面是 `resources.FromString` 生成并缓存的。改了 `cover-svg.html` 或调色板后若没看到变化，删 `public/covers/` 或 `resources/` 缓存重新构建。
{{< /callout >}}

下一步：[Shortcodes 大全](../shortcodes/) —— 学会在正文里用徽章、提示框、时间轴。
