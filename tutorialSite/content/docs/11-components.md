---
title: "11 · 组件选择与实际效果"
slug: "11-components"
weight: 50
date: 2026-10-07
summary: "先看源码，再试效果：提示框、实战步骤、方案选项卡和折叠说明。"
---

普通文章继续写 Markdown。标题、代码复制、表格滚动、图片和目录由主题处理；需要额外表达时，再选择下面的组件。

每一节的“可复制源码”都可以直接放入文章。本站的效果由主题真实渲染，没有站点自定义模板或样式。

基础徽章、导语、时间轴、强调文本见 [第 06 章](../06-shortcodes/)；栏目入口和 Agent 接入见 [第 12 章](../12-sections/)。完整参数契约在主题仓库 `docs/COMPONENTS.md` 与 `docs/RUNBOOK-COMPONENTS.md`。

## 提示框

提示需要直接看见的信息。

**可复制源码：**

````markdown
{{</* callout type="tip" title="先验证，再继续" */>}}
修改后先检查预期结果，再进行下一步。
{{</* /callout */>}}
````

**实际效果：**

{{< callout type="tip" title="先验证，再继续" >}}
修改后先检查预期结果，再进行下一步。
{{< /callout >}}

## 实战步骤

适合操作手册。只写实际需要的部分，命令仍由作者维护。

**可复制源码：**

````markdown
{{</* runbook-step number="1" title="验证本地环境" id="verify-local" */>}}
{{</* step-part kind="prerequisites" */>}}
已安装 Hugo extended，并进入自己的博客目录。
{{</* /step-part */>}}
{{</* step-part kind="action" */>}}
```sh
hugo version
```
{{</* /step-part */>}}
{{</* step-part kind="verify" */>}}
输出应包含 `extended`。本主题当前用 0.163.3 验证。
{{</* /step-part */>}}
{{</* step-part kind="rollback" */>}}
此步骤只读取版本，没有需要回退的改动。
{{</* /step-part */>}}
{{</* /runbook-step */>}}
````

**实际效果：**

{{< runbook-step number="1" title="验证本地环境" id="verify-local" >}}
{{< step-part kind="prerequisites" >}}
已安装 Hugo extended，并进入自己的博客目录。
{{< /step-part >}}
{{< step-part kind="action" >}}
```sh
hugo version
```
{{< /step-part >}}
{{< step-part kind="verify" >}}
输出应包含 `extended`。本主题当前用 0.163.3 验证。
{{< /step-part >}}
{{< step-part kind="rollback" >}}
此步骤只读取版本，没有需要回退的改动。
{{< /step-part >}}
{{< /runbook-step >}}

## 配置选项卡

用于读者择一采用的方案。共用验证与限制应放在选项卡外。

**可复制源码：**

````markdown
{{</* config-tabs id="preview-choice" label="选择要预览的站点" */>}}
{{</* config-tab label="成品示例" */>}}
#### 查看博客组合效果

在主题根目录运行：
```sh
sh scripts/theme-dev.sh serve exampleSite
```
{{</* /config-tab */>}}
{{</* config-tab label="使用教程" */>}}
#### 查看用法和真实组件

在主题根目录运行：
```sh
sh scripts/theme-dev.sh serve tutorialSite
```
{{</* /config-tab */>}}
{{</* /config-tabs */>}}
````

**实际效果：**

{{< config-tabs id="preview-choice" label="选择要预览的站点" >}}
{{< config-tab label="成品示例" >}}
#### 查看博客组合效果

在主题根目录运行：
```sh
sh scripts/theme-dev.sh serve exampleSite
```
{{< /config-tab >}}
{{< config-tab label="使用教程" >}}
#### 查看用法和真实组件

在主题根目录运行：
```sh
sh scripts/theme-dev.sh serve tutorialSite
```
{{< /config-tab >}}
{{< /config-tabs >}}

## 折叠说明

适合补充原理。必做操作、验证与风险提醒应保持可见。

**可复制源码：**

````markdown
{{</* reading-details title="为什么不用自己写 HTML 卡片？" id="why-theme-components" */>}}
文章保存内容与语义，主题统一维护布局、键盘操作与配色。未来调整组件时，使用同一组件的文章一起获得更新。
{{</* /reading-details */>}}
````

**实际效果：**

{{< reading-details title="为什么不用自己写 HTML 卡片？" id="why-theme-components" >}}
文章保存内容与语义，主题统一维护布局、键盘操作与配色。未来调整组件时，使用同一组件的文章一起获得更新。
{{< /reading-details >}}

## 参数与操作约定

- `runbook-step` 的 title 必填；子项用 step-part，kind 可选 prerequisites / action / verify / rollback，默认 action。
- `config-tabs` 的 id 和 label 必填，config-tab 的 label 必填。用左右键、Home／End 切换，Tab 进入方案；刷新会保留 URL 指定的方案。无脚本时全部内容可读。
- `reading-details` 的 title 必填；可以加 open=true 默认展开。id 如需使用，应在页内唯一。
- 不重复使用示例中的 id；一篇放两组组件时给它们不同 id。
- 所有配置和命令示例只展示文本，页面不会执行命令。
