# vishine 后续 Plan

> 现状:主题功能完整(三套 scheme / ⌘K 搜索 / TOC / 代码复制 / 图片 zoom / 列表筛选 / Mermaid / 自动封面 / 板块色),可移植性已修(首页板块可配、AI 专区数据化、分类映射分离到站点 data、字体可关、mermaid 子路径修复)。文档齐(README / USAGE / DESIGN / INTERACTION / MARKDOWN)。**已用真实博客 220 篇验证:vishine 构建 1557 页 0 error。**

---

## P0 — 开源前必做(让它成为合格开源项目)

1. **i18n 国际化**:中文 UI 文案抽到 `i18n/zh.yaml`(搜索… / 本页目录 / 复制 / 最近更新 / 加载更多 / 篇 / 相关文章 / 继续阅读…)。现全硬编码,非中文用户无法切语言。`i18n/` 目录已存在但空。
2. **字体方案文档 + 自托管选项**:`googleFonts=false` 开关已加;补"如何 self-host(含中文 subset 工具)/ 用国内 CDN"的说明与示例,解决国内访问慢。
3. **README 截图**:补 `docs/screenshots/`(三 scheme 首页 + ⌘K + 文章页),替换现在指向 mockups/ 的占位。
4. **发布**:`git init` + `.gitignore`(public/resources/covers 缓存)+ 首次提交 + 推 GitHub。
5. **主题/内容分离终检**:确认主题 repo 不含任何真实文章(exampleSite 仅演示)。

## P1 — 从 Blowfish 迁移兼容(接你真实博客会用到)

6. **补 Blowfish 兼容 shortcode**:已加 badge/lead/typeit;按存量内容实际用到的再补(alert/button/figure/icon/katex/gallery 等)。
7. **HTML 内容页**:`sponsor-diy/index.html` 这类——转 md,或 hugo.toml 配 `[security]` 放行 html content。
8. **⚠ 清理旧站点 layouts(迁移第一步,最易踩)**:socake 站点有为 Blowfish 写的 `layouts/`(posts/list.html、article-link/card.html、website/pay/bookshelf/comments 等)。Hugo 里**站点 layouts 优先于主题**,会覆盖 vishine 导致列表页等用旧模板(单列大封面)。迁移时必须移除/归档这些。注意其中 website(网站导航)/pay(赞助)/bookshelf(书架)/comments(评论)是**站点特有页面**,vishine 无对应——改用 vishine 的 resources/sponsor/books,或保留并适配到 vishine 风格。
9. **迁移清单/脚本**:站点 layouts 清理(上条)、frontmatter 核对(发现部分文章有误写的 `type: Opaque`)、featured 图沿用、HTML 内容页处理、blowfish shortcode 扫描。

## P2 — 功能增强

9. **`{{< matrix >}}` 对比表 shortcode**:板块色 + ✓/✗ 图标 + 卡片式,比 markdown 表格漂亮(选型/横向速查文章)。
10. **评论系统**:giscus / utterances / Disqus,params 可配。
11. **搜索增强**:⌘K 结果键盘高亮、按类型筛选、最近搜索记录。
12. **代码块增强**:行号 / 指定行高亮 / 超长折叠 / 文件名标签。
13. **系列(series)/合集页**:多篇成系列的导航。
14. **SEO**:OG 分享图复用自动封面生成器、structured data。

## P3 — 细节打磨

15. **封面暗色版**:自动封面现固定浅色,dark scheme 下是浅块;生成暗色版或半透处理。
16. **列表筛选 chip 折叠**:分类+标签全列时一行过长,可收起。
17. **单页 section 首页卡**:roadmap 等无子文章的板块,首页卡显示真实条目(现显示 description)。
18. **质量审计**:可访问性(axe)、性能(Lighthouse)、移动端细节。
19. **Mermaid 暗色微调**:note 等元素在 dark 下的对比。

---

*优先级:P0 决定能不能体面开源;P1 决定你的真实博客能不能平滑迁过来;P2/P3 是长期增强。建议 P0 → 接入真实博客(P1)→ 按需 P2/P3。*
