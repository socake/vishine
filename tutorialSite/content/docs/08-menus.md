---
title: "08 · 菜单与多级下拉：identifier + parent"
slug: "08-menus"
weight: 34
date: 2026-06-21
categories: ["导航"]
tags: ["菜单", "menu", "下拉", "导航"]
summary: "顶栏一级菜单与二级下拉的配置规则：一级项直接给 pageRef；做下拉就用 identifier 定义父项、子项用 parent 挂上去。含完整可复制 toml，以及指向分类聚合页的技巧。"
toc: true
---

{{< lead >}}
vishine 顶栏支持二级下拉。规则只有一条：一级菜单直接给 `pageRef`；要做下拉，就用 `identifier` 定义一个「只当容器」的父项，子项用 `parent` 挂上去。本教程顶栏的三个下拉组，就是这么配的。
{{< /lead >}}

## 一、一级菜单

最简单的情况：每项一个 `pageRef` 指向页面，`weight` 控制从左到右的顺序（数字小的靠前）。

```toml
[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10
  [[menu.main]]
    name = "关于"
    pageRef = "/about"
    weight = 80
```

{{< callout type="info" >}}
`[[menu.main]]` 用的是 TOML 的**双中括号**，表示「数组里的一项」—— 每写一个 `[[menu.main]]` 就多一个菜单项，可以重复任意多次。`pageRef` 填站内页面的逻辑路径（比写死 url 更稳，改了网址也不会断）。
{{< /callout >}}

{{< callout type="warn" >}}
不配 `[menu.main]` 顶栏就**没有任何导航**。这是必配项。
{{< /callout >}}

## 二、二级下拉

要点：**父项用 `identifier`、不给 `pageRef`**（它只是下拉容器，点了不跳转）；子项用 `parent = "父项的 identifier"` 挂上去。

```toml
  # 父项：只做下拉容器，无 pageRef
  [[menu.main]]
    name = "运维"
    identifier = "ops"
    weight = 40

  # 子项：parent 指向父项的 identifier
  [[menu.main]]
    name = "Linux"
    parent = "ops"
    pageRef = "/docs/linux"
    weight = 41
  [[menu.main]]
    name = "Kubernetes"
    parent = "ops"
    pageRef = "/docs/kubernetes"
    weight = 43
```

效果就是顶栏出现「运维 ▾」，悬停展开 Linux / Kubernetes。

{{< callout type="tip" >}}
**`identifier` 是父项的唯一名字**，子项靠它来认领父项。它不会显示给读者，随便取个英文短词即可（如 ops、base、ship），只要子项的 `parent` 跟它对上。
{{< /callout >}}

## 三、weight 排序约定

`weight` 同时控制一级菜单的左右顺序和下拉内的上下顺序。建议给父项留出区间，子项在区间内递增：

{{< timeline >}}
10 | 一级：博客 | 独立入口
20 | 父项：入门基础（identifier=base） | 下拉容器
21–24 | 子项：01/02/03/04 章 | 挂在 base 下
40 | 父项：发布上线（identifier=ship） | 下拉容器
{{< /timeline >}}

父项用整十（20、40），子项用 21、22…… 这样以后插新项不用重排。

## 四、指向分类聚合页

子项的 `pageRef` 不一定是某个 section，也可以指向**分类聚合页**（taxonomy term page，即「某分类下所有文章的列表页」）：

```toml
  [[menu.main]]
    name = "AI"
    identifier = "ai"
    weight = 50
  [[menu.main]]
    name = "大模型"
    parent = "ai"
    pageRef = "/categories/大模型"   # 指向「大模型」分类的聚合页
    weight = 51
```

这样「AI ▾」下拉里点「大模型」，就跳到所有归类为「大模型」的文章列表。

## 五、本教程的完整菜单（可抄）

下面就是本教程站 `hugo.toml` 里实际用的菜单结构 —— 一级「教程总览」+ 三个下拉组 + 一个外链 GitHub。注意外链用 `url` 而非 `pageRef`：

```toml
[menu]
  [[menu.main]]
    name = "教程总览"
    pageRef = "/docs"
    weight = 10

  [[menu.main]]
    name = "入门基础"
    identifier = "base"
    weight = 20
  [[menu.main]]
    name = "01 · 环境准备"
    parent = "base"
    pageRef = "/docs/01-environment"
    weight = 21
  # …（02/03/04 同理，weight 22/23/24）

  [[menu.main]]
    name = "GitHub"
    url = "https://github.com/socake/vishine"   # 外链用 url
    weight = 90
```

{{< callout type="info" >}}
「文档」这种「一个 section 下多个长子页」的内容，最适合做成下拉：每个子页是独立文章页（带自己的目录），避免把长内容全挤在一页。本教程站就是这么组织的 —— 顶栏的下拉，本质就是这套文档的左侧导航。
{{< /callout >}}

{{< callout type="tip" >}}
导航配好了。下一章 **[09 · 部署到 GitHub Pages](../09-deploy/)** 让站点真正上线，push 一下就自动构建发布。
{{< /callout >}}
