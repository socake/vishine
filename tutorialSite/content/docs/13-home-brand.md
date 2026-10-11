---
title: "13 · 首页与品牌配置"
date: 2026-10-11
weight: 130
summary: "只用配置适配单板块、两板块教程站与五板块博客。"
categories: [教程]
tags: [首页, 配置]
---

首页仍然是内容工作台；板块数量、品牌和入口由宿主提供，布局由主题承担。

## 板块数量与宽度

本站的 `homeSections = ["docs"]` 会占满一行。两板块无需覆盖首页模板：

```toml
[params]
homeSections = ["docs", "posts"]
```

两块各半，三块各三分之一，五块保持主题原来的两行编排。板块颜色不再影响宽度；窄屏自动单列。

## 板块颜色与图标

在站点 `data/sections.toml` 中配置；这里的 class 只决定颜色。

```toml
[sections.posts]
class = "ai"
label = "入门介绍"
icon = "ai"
# 也可用 SVG 字符串：icon = '<svg viewBox="0 0 24 24" ...>...</svg>'
```

内置图标：blog、play、docs、road、res、ai。不指定 icon 时沿用 class 对应图标。

## 自定义统计

本教程首页实际使用以下配置，不再显示不存在的实战手册：

```toml
[params]
homeStats = [{section="docs", label="教程文章"}, {kind="categories"}, {kind="tags"}]
```

section 统计这个顶层板块全部已发布文章；kind 统计全站分类或标签数量。label 可选，用于替换默认名称。

## 使用手册的直属子栏目

在 `content/docs/<子栏目>/_index.md` 写 title 与 weight。主题自动列出这些直属栏目，并在右侧显示每栏递归文章数；没有子栏目时才显示全站分类。

仓库的 `exampleSite/presets/internal/` 是完整的两板块示例，包含七个子栏目与三篇入门介绍。复制为新站即可使用，不需要覆盖 index.html。
