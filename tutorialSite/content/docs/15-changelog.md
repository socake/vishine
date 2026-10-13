---
title: "15 · 自动更新日志"
slug: "15-changelog"
weight: 150
date: 2026-10-13
summary: "用一行 shortcode 自动生成月份、篇数和文章链接，保留需要手写的站点更新。"
---

文章归档适合自动生成：主题读取文章日期，按月份倒序排列，数量和标题与实际内容保持一致。改名或新增文章后，下一次构建自动更新。站点升级原因和具体变更仍由作者描述。

## 可复制的完整页面

将下面内容保存为宿主 `content/changelog/index.md`，保留你自己的标题和更新说明。

````markdown
---
title: 更新日志
description: 文章与站点的更新记录
article:
  showMeta: false
  showCover: false
  showNavigation: false
  showRelated: false
---

文章按日期归档，可点击标题阅读。

{{</* changelog sections="posts" */>}}

## 站点与主题更新

这里记录需要解释的功能变化，使用具体事件标题，避免与自动月份锚点重复。
````

`sections` 默认是 `posts`；如果还要包含 `notes`，写 `sections="posts,notes"`。栏目名来自内容目录；本页下面读取教程站的 `docs`，因此可以看到真实教程文章。

草稿、未来内容、过期内容、没有有效日期的页面和当前日志页面会被排除；文章 front matter 中的 `changelog: false` 可以排除关于页等非文章内容。只有文章的 `date` 决定归档月份，修改 `lastmod` 不会把旧文章算作新文章。

每页独立使用一次，不嵌套；输出的月份是 H2，右侧目录和移动目录自动识别。旧的手写文章清单应删除，建站和主题升级说明继续保留。完整边界见仓库 `docs/CHANGELOG.md`。

## 实际效果

以下列表由教程文章自动生成，调用源码为：

```markdown
{{</* changelog sections="docs" */>}}
```

{{< changelog sections="docs" >}}
