# 组件使用入口

博客负责文章、图片、栏目结构和配置；主题负责公共页面、组件样式与交互。目标是让至少 95% 的常规页面呈现由主题承担。这是职责目标，不按 HTML 行数统计；不要求作者把普通 Markdown 都改成 shortcode。

## 从需求找到入口

| 你想做什么 | 在博客里写什么 | 主题自动提供什么 | 完整说明 / 可运行示例 |
| --- | --- | --- | --- |
| 写文章 | `content/posts/*.md`，title / date / summary / categories / tags | 标题、元信息、封面、正文、分享、相关文章 | [快速开始](GETTING-STARTED.md)，`exampleSite/content/posts/` |
| 展示首页入口 | hugo.toml 的 homeSections / homeCardLayout / featureZone、data/sections.toml | 首页工作台、按密度选择标准卡或紧凑入口、子栏目索引、可配置统计和最近更新 | [配置参考](USAGE.md)，教程 13 与 `exampleSite/hugo.toml` |
| 自动更新日志 | 正文插入 changelog；文章维护 date | 按月归档、真实篇数、文章链接、文章页月份目录 | [更新日志契约](CHANGELOG.md)；教程 15 与示例站 `/changelog/` |
| 列表筛选 | 内容分类标签；pagination.pagerSize | 常用分类与可搜索的全部筛选、分页、URL 与后退恢复 | [配置参考](USAGE.md)；示例站 `/posts/` |
| 多层栏目 | `_index.md`、目录层级、sectionNav | 子栏目卡片、直属文章、面包屑、栏目浏览 | [栏目契约](SECTION-NAVIGATION.md)；示例站 `/docs/` |
| 连续阅读 / 学习路线 | 任意栏目 readingNav；weight / group / stage | 悬浮目录内切换本页 / 栏目、同级文章、章节上下篇和返回目录；兼容旧 track | [阅读契约](THEME-APIS.md#1-任意栏目的章节导航)；教程 12 的示例分支 |
| 提示、步骤、方案切换、补充说明 | 下表 shortcode | 统一样式、键盘操作和阅读交互 | [正文组件契约](RUNBOOK-COMPONENTS.md)；教程站 `/docs/11-components/` |
| 代码、表格、图片、图表 | 普通 Markdown；Mermaid 代码围栏 | 高亮复制、表格局部滚动、正文原图清晰呈现、原图缩放和平移、图表渲染 | [Markdown](MARKDOWN.md)；教程 07 |
| 嵌入已有 HTML 图表 | static 下的 HTML 文件；html-embed | 独立 iframe、矢量文字、局部横向浏览和完整页面入口 | [嵌入契约](HTML-EMBED.md)；教程 14 |
| 本页目录和阅读宽度 | article 选项、H1–H6 标题；toc: false 可关闭 | 构建时目录、深度控制、定位、宽度按钮；无目录时居中 | [阅读契约](THEME-APIS.md#2-文章显示选项)；教程 14 |
| 顶栏 / 页脚导航 | menu.main 的 pageRef 或 url；父子项用 identifier / parent | 菜单、移动抽屉、当前项和页脚入口 | [配置参考](USAGE.md)；教程 08 |
| 搜索 | outputs.home 包含 JSON | 全文与标题搜索、小节跳转、片段与范围选择 | [搜索契约](THEME-APIS.md#3-全文搜索)；教程 14 |
| 页面立体感 | 无需文章配置；params.layeredSurfaces 默认 true | 固定背景、阅读面、目录与卡片层次；三套配色自动适配 | [分层表面](DEPTH-SURFACES.md)；教程 03 的页面即为实际效果 |
| 配色 / 封面 | defaultScheme；params.cover；featured 图片、cover 或 coverLabel 字段 | 三套配色；桌面文章列表与分类／标签网格使用 16:10 几何缩略图，手机文章列表和正文使用宽幅主题图；autoArticle=false 可单独关闭正文自动图 | [配置参考](USAGE.md)；教程 13；读者保存的配色优先于默认值 |
| 系列文章 | taxonomies 增加 `series = "series"`，文章 `series: [系列名]` | 同系列导航，按日期正序 | `layouts/partials/series-nav.html`；不是 weight 排序的学习路线 |
| 评论 / 赞助 / PWA | params.comments.giscus / params.sponsor / params.pwa | 配置后渲染对应功能 | [配置参考](USAGE.md)、[赞助参数](#赞助参数)；不自动开通第三方服务 |

## 正文组件总表

所有名字与 `layouts/shortcodes/` 一一对应。正文内用 `{{< ... >}}` 调用，成对组件的内部写 Markdown。不要把 `.hub-card`、`.runbook-part` 等内部 CSS 类当写作接口。

| Shortcode | 参数、默认值和限制 | 何时使用 |
| --- | --- | --- |
| `badge` | 无必填参数，成对 | 行内版本、状态 |
| `lead` | 无必填参数，成对 | 简短导语 |
| `callout` | type 为 info（默认）/ warn / tip；非法值回退 info；title 可选 | 需要突出但仍应直接可见的信息 |
| `typeit` | 无有效配置参数，成对；当前为静态强调文本 | 短句强调；不是打字机动画 |
| `changelog` | 单标签；sections 默认为 posts，多栏目用逗号分隔；每页一次，独立放置；文章 changelog: false 可排除 | 自动按月列出已发布文章，详见 [完整契约](CHANGELOG.md) |
| `timeline` | 成对；每行 `节点 \| 阶段 \| 说明`，后两项可省 | 人工编写时间线，不用于自动列出子栏目 |
| `sponsor` | 单标签；title / desc / wechat / alipay 及两渠道 Original 参数可覆盖站点配置；无码不渲染 | 等高赞助卡片；[完整契约](SPONSOR.md)、教程 16 |
| `runbook-step` | title 必填；number 可选；id 推荐显式指定且页内唯一 | 组织一项操作；标题为 H3，应位于 H2 下 |
| `step-part` | 必须放在 runbook-step 内；kind 为 action（默认）/ prerequisites / verify / rollback | 前置、执行、验证、回退，不需要时可省略该部分 |
| `config-tabs` | id 与 label 必填；内部放 config-tab | 互斥方案，读者选其中一种 |
| `config-tab` | label 必填；必须放在 config-tabs 内 | 每种方案的 Markdown 内容 |
| `reading-details` | title 必填；id 可选且唯一；open=true 默认展开，否则收起 | 补充原理，不折叠必做步骤或风险限制 |
| `html-embed` | src / title 必填；height 默认 480，minWidth 默认 0；fit 为 width / scroll，省略时兼容旧 minWidth；mode 为 page（默认）/ archify；surface 为 source / theme，Archify 默认 theme；单标签 | 本地 HTML 图表、自适应宽度、细节切换与中性表面配色，限制与失败行为见 [HTML-EMBED](HTML-EMBED.md) |

步骤、选项卡和折叠说明的完整可复制语法见 [RUNBOOK-COMPONENTS.md](RUNBOOK-COMPONENTS.md)，教程 11 同时展示源码和效果。HTML 图表见 [HTML-EMBED.md](HTML-EMBED.md) 与教程 14；基础组件见教程 06。

### 赞助参数

```toml
[params.sponsor]
  title = "支持作者"
  desc = "感谢你的支持。"
  wechat = "/img/wechat.png"
  alipay = "/img/alipay.png"
```

在宿主站 `static/img/` 放自己的图片，再写 `{{< sponsor >}}`。不要复制示例站作者的收款码。

推荐方形二维码展示图；`wechatOriginal` / `alipayOriginal` 可链接到原始海报，省略时链接到展示图。单渠道居中、窄屏上下排列，旧配置继续可用。[图片准备、参数与回退](SPONSOR.md)，可复制页面和实际效果见教程 16。

## 栏目与路线配方

普通多层栏目无需写卡片 HTML：新建 `_index.md` 和文章，按 [SECTION-NAVIGATION.md](SECTION-NAVIGATION.md) 配置。仅有直属文章时可用 `layout: hub`；整个分支统一启用可用 cascade。

学习路线可在 `content/roadmap/_index.md` 配置：

```yaml
cascade:
  params:
    sectionNav:
      enabled: true
      order: weight
      groupBy: group
      subgroupBy: stage
      groupOrder: [基础, 实践]
```

章节 front matter 示例：

```yaml
title: 第一章：基础概念
weight: 10
track: demo
group: 基础
stage: 入门
```

旧 track 继续按当前栏目、同一 group 的 weight 排序。新站可在任意栏目配置 readingNav.enabled=true，无需 track 或 roadmap 目录，完整配置见 [阅读契约](THEME-APIS.md)。group / stage 的词由作者定义；sectionNav 不要求使用上述示例词。文章 URL 不需要为了分组移动。

## 定制边界

1. 修改内容和已有参数：在博客完成，主题无需修改。
2. 新增可复用的呈现、交互或 shortcode：在主题实现，博客只调用；同时补本文、参数文档和可运行示例。
3. 只属于某站的第三方集成：允许宿主局部扩展，但记录原因、范围和升级检查点，不复制整套模板。

宿主样式通过 `params.customCSS = ["css/site.css"]` 加载，文件位于站点 assets 下；追加到主题 CSS 后一起合并、压缩并指纹化，缺失文件静默跳过。未配置时仅放入文件不会生效。`params.customJS` 支持同样的 assets 路径，按顺序 defer 加载并指纹化。四个公开扩展 partial 支持插入 head、正文前后和页尾，见 [扩展契约](THEME-APIS.md#6-品牌与公开扩展点)。Hugo 支持宿主同路径模板覆盖，但这会接管对应主题模板，应作为明确维护的例外。不要为接入一个组件复制整个 head.html / single.html。

组件新增完成的标准是：**能找到、能复制、能构建、能操作、能维护**。文档不能把计划中的参数写成已支持能力。发布检查覆盖 Hugo 0.146.0 与 0.163.3 extended；新增界面文案至少覆盖中英文，其他语言不视为已完整验收。

## 让 Agent 正确使用主题

主题维护入口是根目录 [AGENTS.md](../AGENTS.md)。在博客目录工作时，Agent 不一定自动发现子目录里的指令，因此宿主还需要一个入口。见 [宿主 Agent 约定模板](AGENTS-HOST.example.md)，合并到博客现有 AGENTS.md，保留原规则并替换实际主题路径。

本地看教程：主题根目录运行 `sh scripts/theme-dev.sh serve tutorialSite`，打开日志给出的地址并进入“组件与维护”。Hugo 不在 PATH 时设置 HUGO_BIN。线上教程需发布后才会包含本轮新增内容。

维护者验证：运行 `python3 scripts/check-component-docs.py`（或 `--hugo /path/to/hugo`），检查 shortcode 目录覆盖，并将教程中实际显示的四组源码放入独立宿主构建，防止文档能展示但复制后失效。
