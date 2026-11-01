---
title: "18 · 草稿标注与 Agent 修订"
weight: 18
---

在草稿预览中标注段落或选中文字，保存修改意见，再让Agent按引用修订。实现和工具均由主题提供。

从主题根目录启动带审阅的教程站：

```sh
python3 scripts/draft-review.py serve --site tutorialSite --port 1316 --api-port 1317 -- --themesDir .. --theme vishine
```

打开 `/labs/draft-review/`。这篇演示文设置了 `draft: true`，只在包含草稿的预览中出现；当前教程说明本身不是草稿，不会出现审阅按钮。

点击“审阅草稿”，用段落旁的加号创建意见，或选择同一段中的文字后点击“标注选中文字”。刷新页面检查恢复。Agent通过主题 `scripts/draft-review.py list/resolve` 命令读取和处理，无需手动导出浏览器数据。

详见主题源码 `docs/DRAFT-REVIEW.md`，包括存储位置、命令、定位协议、失败处理与支持范围。
