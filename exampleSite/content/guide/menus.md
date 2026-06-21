---
title: "菜单与多级下拉"
weight: 60
categories: ["实战手册"]
tags: ["菜单", "menu", "导航", "下拉"]
summary: "顶栏一级菜单与二级下拉的配置：用 identifier 定义父项、parent 挂子项，含完整 toml 示例。"
toc: true
---

{{< lead >}}
vishine 的顶栏支持二级下拉。规则只有一条：一级菜单直接给 `pageRef`；要做下拉，就用 `identifier` 定义一个「只当容器」的父项，子项用 `parent` 挂上去。
{{< /lead >}}

## 一、一级菜单

最简单的情况，每项一个 `pageRef` 指向页面，`weight` 控制从左到右的顺序（小的靠前）：

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

{{< callout type="warn" >}}
不配 `[menu.main]` 顶栏就**没有任何导航**。这是必配项。
{{< /callout >}}

## 二、二级下拉

要点：**父项用 `identifier`、不给 `pageRef`**（它只是下拉的容器，点了不跳转）；子项用 `parent = "<父项 identifier>"` 挂上去。

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
下拉项会**自动显示其指向页面的子页数量** —— 比如「Kubernetes」旁会标出该文档下有几篇子页，读者一眼知道内容多寡。
{{< /callout >}}

## 三、weight 排序约定

`weight` 同时控制一级菜单的左右顺序和下拉内的上下顺序。建议给父项留出区间，子项在区间内递增：

{{< timeline >}}
10 | 一级：博客 | 独立入口
20 | 一级：实战手册 | 独立入口
40 | 父项：运维（identifier=ops） | 下拉容器
41–44 | 子项：Linux / Docker / K8s / CI/CD | 挂在 ops 下
{{< /timeline >}}

父项用整十（40），子项用 41、42、43……这样以后插新项不用重排。

## 四、指向分类页

子项的 `pageRef` 不一定是某个 section，也可以指向**分类聚合页**（taxonomy）：

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

## 五、完整示例

一份混合了一级项 + 两个下拉的菜单：

```toml
[menu]
  [[menu.main]]
    name = "博客"
    pageRef = "/posts"
    weight = 10

  [[menu.main]]
    name = "运维"
    identifier = "ops"
    weight = 40
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

  [[menu.main]]
    name = "关于"
    pageRef = "/about"
    weight = 80
```

{{< callout type="info" >}}
「路线图 / 文档」这种「一个 section 下多个长子页」的内容，最适合做成下拉：每个子页是独立文章页（带自己的 TOC），避免把长内容全挤在一页。
{{< /callout >}}

下一步：[部署到 GitHub Pages](../deployment/) —— 让站点上线。
