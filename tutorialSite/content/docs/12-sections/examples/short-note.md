---
title: 一页没有目录的简短说明
date: 2026-10-13
slug: short-note
summary: toc 与 article 配置关闭不需要的装饰，保留阅读宽度和章节入口。
weight: 2
toc: false
article:
  showCover: false
  showMeta: false
  showShare: false
  showRelated: false
---

这页实际使用下面的 front matter：没有目录和封面，正文居中，但上方阅读宽度按钮、栏目入口和底部上一章仍然可用。

```yaml
toc: false
article:
  showCover: false
  showMeta: false
  showShare: false
  showRelated: false
```

## 保持简短

正文仍然可以使用标题。关闭目录不会删除内容，也不会改变文章地址。

继续阅读顺序由本栏目的 weight 决定。可以用底部“上一章”回到普通文章，或返回目录。
