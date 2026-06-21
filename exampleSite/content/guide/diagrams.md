---
title: "Mermaid 图表"
weight: 50
categories: ["实战手册"]
tags: ["Mermaid", "图表", "流程图"]
summary: "用 ```mermaid 围栏画流程图，主题自托管脚本自动渲染并随三套配色翻色，含真实示例。"
toc: true
---

{{< lead >}}
不用装插件、不引外网 CDN —— 在 Markdown 里用一个围栏写 Mermaid，vishine 自托管脚本会渲染它，还会跟着 scheme 一起翻色。
{{< /lead >}}

## 一、怎么用

写一个语言标为 `mermaid` 的代码围栏即可：

````markdown
```mermaid
graph LR
  A[Push] --> B[CI] --> C[Deploy]
```
````

主题会在页面加载时自动找到这些围栏并渲染成图。

{{< callout type="info" >}}
Mermaid 脚本是**自托管**的（`static/js/mermaid.min.js`），不依赖任何外网 CDN。国内访问、内网部署都能正常出图。
{{< /callout >}}

## 二、真实示例：一次发布的流程

下面是一个真正会被渲染出来的流程图（点顶栏色块切换 scheme，图的配色会跟着变）：

```mermaid
flowchart TD
  A[开发者 push 代码] --> B{CI 流水线}
  B -->|单元测试| C[构建镜像]
  B -->|测试失败| X[阻断并通知]
  C --> D[推送到镜像仓库]
  D --> E{部署到预发}
  E -->|冒烟通过| F[金丝雀发布到生产]
  E -->|冒烟失败| X
  F --> G[全量发布]
  F -->|指标异常| H[自动回滚]
  H --> X
```

## 三、随配色翻色

vishine 给 Mermaid 注入了跟随 `data-scheme` 的主题变量，所以：

- 在 **clean** 下是浅底深线；
- 切到 **dark** 下自动变深底浅线；
- **paper** 下走暖色调。

{{< callout type="tip" >}}
不用为每套 scheme 各画一张图。同一段 Mermaid 代码，主题会在切换配色时重渲染成对应色调 —— 在本页直接点顶栏色块试试。
{{< /callout >}}

## 四、支持的图类型

Mermaid 的常见图都能用，几个高频的：

| 类型 | 围栏首行 | 用途 |
| --- | --- | --- |
| 流程图 | `flowchart TD` / `graph LR` | 流程、决策 |
| 时序图 | `sequenceDiagram` | 服务调用、交互 |
| 状态图 | `stateDiagram-v2` | 状态机 |
| 甘特图 | `gantt` | 计划排期 |
| 类图 | `classDiagram` | 数据结构 |

{{< callout type="warn" >}}
**子路径部署**（GitHub Project Pages）下若 Mermaid 不显示：确认 `static/js/mermaid.min.js` 存在，且 `baseURL` 的子路径写对了。主题已用 `relURL` 处理脚本路径，路径正确就能加载。
{{< /callout >}}

下一步：[菜单与多级下拉](../menus/) —— 配顶栏导航。
