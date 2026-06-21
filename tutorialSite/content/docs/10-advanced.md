---
title: "10 · 进阶技巧与排坑：把站点跑得更顺"
slug: "10-advanced"
weight: 42
date: 2026-06-21
categories: ["进阶"]
tags: ["排坑", "进阶", "技巧", "FAQ"]
summary: "汇总 vishine 最容易踩的坑和省心写法：⌘K 搜索、板块色对不上、配色翻色、自动封面缓存、子路径部署、Google Fonts 国内加载，以及主题升级。建议收藏。"
toc: true
---

{{< lead >}}
走到这一章，你已经能搭出一个完整的 vishine 站点了。这里把最容易踩的坑和几条「早知道就好了」的技巧汇总成一份清单，建议收藏随时查。
{{< /lead >}}

## 一、那些「漏了就坏、还不报错」的配置

这是新手最痛的一类问题 —— **构建不报错，但功能静默失效**。逐条对照检查：

{{< callout type="warn" >}}
**⌘K 搜索打得开却搜不到**：`[outputs] home` 必须含 `"JSON"`。命令面板的数据源就是首页的 JSON 输出，漏了就没有索引，且不会报错。
{{< /callout >}}

{{< callout type="warn" >}}
**板块色全是灰扑扑的**：多半是分类名没对上。`data/sections.toml` 里的 key 要和文章 frontmatter 的分类名**完全一致**，包括空格和大小写 —— `"AI工具"` 与 `"AI 工具"` 是两条不同的 key。
{{< /callout >}}

{{< callout type="warn" >}}
**代码块切配色不翻色**：`[markup.highlight] noClasses` 必须是 `false`。设成 true 会把颜色写死成内联样式，三套 scheme 就换不动了。
{{< /callout >}}

{{< callout type="warn" >}}
**shortcode 显示成一串尖括号**：`[markup.goldmark.renderer] unsafe` 必须是 `true`。badge / callout 等会输出行内 HTML，关掉 unsafe 会被转义成纯文本。
{{< /callout >}}

## 二、自动封面相关

{{< callout type="info" >}}
**改了板块色却没生效？** 自动封面是生成后缓存的。删掉 `public/covers/` 和 `resources/` 缓存目录，重新 `hugo` 构建即可。
{{< /callout >}}

- 想整站封面风格统一：`[params.cover] style = "orbit"`（锁定单一版式）。
- 从旧主题迁移、旧图杂乱：`ignoreFeatured = true`，一行配置全部改用自动封面，旧图不用删。

## 三、子路径部署（GitHub 项目站点）

{{< callout type="warn" >}}
**上线后样式全丢、图片 404**，几乎都是同一个原因：项目站点的 `baseURL` 漏了末尾的 `/<仓库名>/`。用 [09 章](../09-deploy/) 那份 workflow 的 `--baseURL "${{ steps.pages.outputs.base_url }}/"` 自动算，最省心。
{{< /callout >}}

子路径下若 Mermaid 不显示，确认 `static/js/mermaid.min.js` 存在且子路径写对。

## 四、国内访问优化

{{< callout type="tip" >}}
**Google Fonts 在国内加载慢**：设 `params.googleFonts = false`，回退到系统字体，首屏更快。Mermaid 已是自托管脚本，本就不依赖外网。
{{< /callout >}}

## 五、主题升级

```bash
# 主题用 submodule 装的（推荐）：
git submodule update --remote themes/vishine

# 主题用 Hugo Module 装的：
hugo mod get -u github.com/socake/vishine
```

{{< callout type="tip" >}}
升级后先本地 `hugo server` 跑一遍再提交。如果某个特性表现变了，对照主题仓库的更新日志（CHANGELOG）确认是否有配置项调整。
{{< /callout >}}

## 六、内容组织的省心写法

{{< timeline >}}
分类 | 首个分类决定板块色 | 想要某色，把对应分类放第一个
长文档 | 一个 section + 多子页 + 下拉菜单 | 别把长内容挤一页，每页带独立目录
封面 | 不放图就让它自动生成 | 要统一风格锁 style，要自定义放 featured.*
搜索 | outputs.home 含 JSON | 否则 ⌘K 形同虚设
{{< /timeline >}}

## 七、整套教程回顾

{{< callout type="info" >}}
恭喜！你已经走完了从零到上线的全过程：

[01 环境](../01-environment/) → [02 安装](../02-install/) → [03 配置](../03-configuration/) → [04 写作](../04-first-post/) → [05 封面](../05-auto-cover/) → [06 shortcodes](../06-shortcodes/) → [07 图表](../07-mermaid/) → [08 菜单](../08-menus/) → [09 部署](../09-deploy/) → 进阶排坑（本章）。

接下来就是写自己的内容了 —— 把复杂的东西讲简单，把踩过的坑写下来。祝你写得开心。
{{< /callout >}}
