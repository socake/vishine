# 通用栏目导航

栏目总览是进入下一层内容的入口。主题自动区分直属子栏目和直属文章；不要求作者预先分类，也不将所有后代文章平铺到父级。

## 开箱使用

有直属子栏目的普通 section 自动使用公共总览。文章型栏目可以在 `_index.md` 设置 `layout: hub`；希望整个分支沿用总览时使用 cascade：

```yaml
title: 运维笔记
description: 系统与服务的操作记录。
cascade:
  params:
    sectionNav:
      enabled: true
      order: title
```

也可以用主题内容模板创建：

```sh
hugo new content --kind hub docs/network/_index.md
```

标题、简介和文章都留在宿主站；公共代码只负责组织。普通博客没有子栏目且未启用该配置时，仍使用原来的筛选分页列表。`roadmap/list.html` 是公共总览的轻量入口，不再写死业务分组。

## 配置契约

`sectionNav` 可直接放 `_index.md` front matter，或放在 `cascade.params` 里继承给后代。

| 字段 | 默认 | 行为 |
| --- | --- | --- |
| `enabled` | 未设置 | true 让没有子栏目的普通 section 也使用总览；有子栏目的 section 自动使用总览 |
| `order` | `weight` | 直属文章排序；`title` 按标题，`date` 按日期倒序 |
| `groupBy` | 无 | 按文章中指定的单值字符串字段分组，如 group；未分组仍显示在“本栏文章” |
| `groupOrder` | 无 | 指定分组显示顺序；未列出的新分组自动追加，不丢文章 |
| `subgroupBy` | 无 | 可选的组内分段字段，如 stage；未填时是普通列表 |

子栏目按 Hugo 的 weight 顺序展示。篇数是该子栏目的递归已发布文章数；子栏目数只统计直属子栏目。标题用 LinkTitle，简介用 description 或 summary，不自动截取命令代码作为简介。

## 行为

- 只有子栏目：入口卡片；只有文章：较窄的列表；混合：卡片和文章分区。
- 多个分区时提供页内跳转，只有一个分区不重复加导航条。
- “浏览栏目”显示所属根栏目、同级入口和当前所在路径的下一级；未进入的分支不全部展开。支持原生键盘、Esc 和点击外部关闭。
- 无 JavaScript 时内容、链接和原生展开均可用。
- 简介存在时，详细正文收进“查看栏目说明”；内容保留在 HTML 中。没有简介的短正文直接展示，长正文可展开。
- 普通章节沿用已有正文模板；本组件不改变文章页的右侧标题目录。
- 样式复用主题颜色、边缘和阴影；不引入额外框架。

## 组件职责

`section-hub.html` 组合总览；`section-nav/model.html` 提供直接文章、子栏目、分组与数量；`card.html` 展示子栏目；`pages.html` 与 `page-list.html` 展示文章；`context.html` 与 `tree.html` 处理当前分支导航。正文手动插入类组件继续使用 shortcode，不用 shortcode 维护自动栏目结构。

## 迁移与验证

宿主站从分页列表改成总览时，原有 `/section/page/N/` 地址应通过 `_index.md` 的 aliases 保留到栏目首页；文章 URL 与内容文件不需要移动。不要删掉父级描述或更改文章事实。

```sh
python3 scripts/check-section-hub.py --hugo /path/to/hugo
```

隔离测试覆盖混合、纯分支、纯文章、空页、三层嵌套、未知／未填分组、分段、草稿过滤、子路径 URL 和普通博客回退。浏览器另检查真实内容、窄屏、配色、键盘与长栏目名。
