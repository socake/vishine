---
title: "12 · 栏目与 Agent 接入"
description: "本页就是通用栏目组件：下方展示子栏目，进入示例分支后查看直属文章。展开说明可复制结构与配置。"
weight: 60
cascade:
  params:
    sectionNav:
      enabled: true
      order: weight
---

## 用目录结构表达层级

```text
content/docs/network/_index.md
content/docs/network/intro.md
content/docs/network/tools/_index.md
content/docs/network/tools/check.md
```

在 network/_index.md 写入：

```yaml
---
title: 网络知识库
description: 概念和工具操作。
cascade:
  params:
    sectionNav:
      enabled: true
      order: weight
---
```

主题会在网络首页分别显示 tools 子栏目和 intro 直属文章。创建 `_index.md` 表示一个分支；`index.md` 是包含资源的单篇文章，不能混用。不必手写链接卡片或维护文章数量。

如仅有文章又想使用总览，可写 `layout: hub`。也可以在宿主根目录运行 `hugo new content --kind hub docs/network/_index.md`。更多排序、分组、迁移规则见主题的 `docs/SECTION-NAVIGATION.md`。

## 让 Agent 找到主题说明

主题根目录的 AGENTS.md 用于维护主题。在博客根目录工作时，Agent 可能不会自动读到主题目录，需要在博客 AGENTS.md 中明确指路：

```markdown
本博客的公共渲染由 vishine 主题负责。
开始组件或视觉任务前，确认构建实际使用的主题位置，
读取该目录的 AGENTS.md 和 docs/COMPONENTS.md。
博客只保存内容、图片和配置；公共组件在主题开发，并补用法与示例。
默认主题位置为 themes/vishine；外部 themesDir 以启动命令为准。
保留现有修改；提交、推送、部署须有用户授权。
```

将它合并到现有规则，不能覆盖其他约定。完整模板在 `docs/AGENTS-HOST.example.md`。

## 区分可以配置与尚未支持的能力

先查组件目录再写参数。当前 `assets/css/custom.css` 不自动加载；`toc: false` 尚未作为目录隐藏开关实现。不要照抄其他主题配置后假定已经生效。

通用组件的改动应同时更新：主题实现、参数说明、可复制示例和必要验证。这样未来更新主题时，文章不需要重新写一遍。
