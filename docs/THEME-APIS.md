# 阅读、搜索与扩展契约

适用于主题默认文章模板；专用的 about、books、resources 等模板有各自布局。接口不依赖目录名称、内部 DOM ID 或 CSS 类。可浏览示例见教程 **14 · 阅读与搜索** 和教程 12 的“示例分支”。

## 1. 任意栏目的章节导航

在需要连续阅读的栏目 `_index.md` 中写：

```yaml
cascade:
  params:
    readingNav:
      enabled: true
    sectionNav:
      enabled: true
      order: weight
      groupBy: group
      groupOrder: [基础, 实践]
```

章节设置 `weight: 10` 和可选 `group: 基础`。主题按当前栏目的直接文章集合及 sectionNav 顺序生成上一章、下一章、章节位置、返回目录；右侧悬浮目录框通过“本页目录 / 浏览栏目”切换标题定位和跨页浏览，后者提供同级文章。不会将后代文章平铺进当前章节列表。

| readingNav 字段 | 默认 | 行为 |
| --- | --- | --- |
| enabled | false；旧 track 非空时 true | 显式 false 优先，关闭当前文章的章节导航 |
| groupBy | 空 | 仅在同一个单值字符串字段内连续阅读，例如 `groupBy: group`；不填可跨分组阅读 |

配置优先取文章（包括 cascade 的继承值），没有配置时取当前栏目。旧 `track` 无需迁移：仍按当前栏目内同一 group 阅读。章节排序来自 sectionNav，默认 weight；不从标题数字猜顺序。新接入无需 track，也无需使用 roadmap 目录。单篇章节仍提供返回栏目和位置。

移动端在悬浮目录抽屉内提供同样的两个选项。切换状态在当前标签页内按根栏目记忆，并同步桌面与手机布局；左右方向键、Home/End 可切换，Tab 进入当前面板。无脚本时两份链接均保留，窄屏在原生目录折叠框内访问；关闭本页目录或没有有效标题时，栏目浏览保留在面包屑旁。栏目树与本页标题始终独立，不混成一棵树。

## 2. 文章显示选项

站点默认值写在 hugo.toml；省略时保留原文章布局：

```toml
[params.article]
toc = true
tocStart = 2
tocEnd = 4
showCover = true
showMeta = true
showRelated = true
showShare = true
showTags = true
showNavigation = true
```

除 tocStart/tocEnd 外都是布尔值，默认 true；showNavigation 同时控制普通上下篇、章节导航和 series 导航。单篇 front matter 的 article 映射覆盖站点默认，也可在栏目 cascade.params.article 中配置。文章级旧字段 `toc: false` 优先于 article.toc。

```yaml
title: 一页简短说明
toc: false
article:
  showCover: false
  showRelated: false
  showShare: false
```

关闭目录或没有有效标题时正文居中，阅读宽度按钮仍可用。目录在构建时从实际正文标题生成，包含 runbook-step 的标题；JavaScript 只增强定位和折叠。桌面无脚本时直接显示，窄屏提供原生 details 目录。

未显式设置 article.tocStart/tocEnd 时沿用 Hugo `[markup.tableOfContents]` 的深度，并纳入 shortcode 的 H2/H3；显式设置后使用这两个字段，未填写的一端分别默认为 2/3。要求整数 `1 <= tocStart <= tocEnd <= 6`，越界会构建失败。无层级限制地使用 H2 到 H6 不会自动打开目录深度；按所需范围配置。标题 ID 应页内唯一。

## 3. 全文搜索

必需输出配置：

```toml
[outputs]
home = ["HTML", "RSS", "JSON"]

[params.search]
includeBody = true
# sections = ["posts", "docs"]
# excludeSections = ["private-notes"]
```

includeBody 默认 true；sections 未配置或空数组代表全部顶层 section；excludeSections 优先排除。文章 front matter `search: false` 可单篇排除；它只控制站内搜索，不是访问权限或保密机制。Hugo 已排除的草稿不会进入正常生产索引。

每种语言独立输出 index.json，路径跟随 baseURL。索引包含标题、摘要、分类、标签、正文标题和段落。命中会显示片段并链接到相关小节；标题精确命中优先，多词以空格分隔并共同匹配，默认每篇只显示最相关片段，最多呈现 50 条。范围选择器按当前索引实际板块生成，不硬编码业务词。Esc 关闭并恢复焦点；进入当前文章小节也会关闭弹层。

这是浏览器内的子串搜索，支持中文、英文和错误码，不是分词搜索服务。索引首次打开时加载并缓存在本次页面内存中；大站可用 sections 缩小集合或 includeBody=false 仅保留元数据搜索。没有 JSON 输出时构建会提醒；网络或 JSON 错误在面板中显示失败提示，不伪装为“无结果”。

## 4. 完整列表筛选

```toml
[params.listFilters]
quickCount = 3
```

普通文章列表默认显示使用最多的三个分类；quickCount 是整数，限制到 0–6。所有分类和标签保留在“全部筛选”的原生 details 面板内，可搜索名称，不再截断到前 16 个。空分类/标签不渲染对应分组，搜索无匹配时给出提示。栏目总览仍使用 sectionNav。

筛选和分页使用完整文章集合，保留 Hugo 输出的文章顺序，状态保存在 URL 中，刷新和后退恢复。面板内滚动只约束筛选项，不限制正文整页滚动。无脚本时 Hugo 原生分页和文章链接可用；客户端筛选需要 JavaScript。

## 5. 图片与 Mermaid 查看

已有包含 SVG／HTML 文字的独立 HTML 图表时，可用 `html-embed` 直接嵌入，保留矢量文字；独立 `.svg` 文件继续使用普通 Markdown 图片。参数、可读宽度与 Archify 配色接入见 [HTML-EMBED.md](HTML-EMBED.md)。

正文普通 Markdown 图片自动提供点击和键盘 Enter/空格放大。正文直接显示原始资源，保留像素尺寸、格式与透明度，不再统一缩到 1280px 或进行有损转码；CSS 按阅读区域等比缩小，浏览器按需懒加载。page bundle / assets 中的位图输出原始宽高以预留空间，SVG 保留矢量。查看器复用相同原图。图片传输体积取决于源文件，作者可在上传前优化文件；主题不会修复源图本身的模糊，也无法让密集大图在手机缩小显示时仍具有原尺寸的字号。外部图片使用作者提供的 URL，远端服务不可用时显示加载失败提示，保留已有预览。

查看器提供适合窗口、原始大小、缩小/放大、拖动和原图入口；键盘 `+`/`-` 缩放，`0` 适合窗口，`1` 原始大小，方向键平移，Esc 关闭并返回触发元素。缩放最高 8 倍，平移限制在图像边界；鼠标滚轮和触摸双指也可缩放。文章本身保持自然滚动。

Mermaid 渲染成功后复用查看器，克隆 SVG 的 ID 与引用独立；它没有位图原图链接。无脚本时普通图片仍显示、Mermaid 仍保留源代码；不要求站点安装图片服务。真实触摸手势需在目标手机上补充验收。

## 6. 品牌与公开扩展点

`params.brand = {pre="Atlas", hl="Docs"}` 统一用于页头、移动菜单与自动封面；未指定时使用站点 title，再回退 vishine。

```toml
[params]
customCSS = ["css/site.css"]
customJS = ["js/site.js"]
```

资源相对宿主 assets/，也可来自主题 assets；不接受把远端脚本 URL 当资源路径。CSS 按数组顺序追加在主题全部样式之后一起合并。JS 按数组顺序放在主题脚本之后，以 defer 加载；生产构建压缩，两者使用指纹。缺失 CSS 沿用旧行为静默跳过；缺失 JS 构建警告并跳过。宿主脚本应自行处理运行错误；不依赖主题内部变量作为 API。

第三方集成可覆盖以下**空 partial**，无需复制主模板：

| 宿主路径 | 位置 / 上下文 |
| --- | --- |
| layouts/partials/extensions/head.html | head 末尾；当前 Hugo Page |
| layouts/partials/extensions/article-before.html | 默认文章正文之前；当前 Page |
| layouts/partials/extensions/article-after.html | 默认文章正文之后；当前 Page |
| layouts/partials/extensions/footer.html | 页面结束、脚本之后；当前 Page |

文件内可使用 `{{ .Title }}`、`{{ .Params }}` 等 Hugo Page 接口。没有文件时不输出内容；没有必要嵌套这些扩展点。宿主负责自己的第三方集成；模板覆盖其他内部 partial 仍需自行跟随主题升级。

CSS 职责：components 管全站导航/搜索/抽屉/提示，prose 管文章/目录/查看器，list 管列表，section-hub 管栏目，component-polish 与 depth 最后修饰。列表和特殊模板不再重复加载全站已有 CSS。宿主 customCSS 最后生效；原有 head-css 模板扩展保留兼容。

## 7. 语言与运行时文案

主脚本、列表、复制、目录、搜索、问答与图片查看器通过 runtime-i18n partial 读取 Hugo i18n，不再按“英文/其他”二分。新增运行时键提供中文、英文、日文；缺失键先由 Hugo 回退，再使用英文默认值。其他既有语言未视为完整翻译验收。

切换语言优先进入当前文章的对应翻译（Hugo translationKey 或同源翻译文件），没有对应翻译时进入目标语言首页。界面标签和 lang/hreflang 跟随语言配置。主题兼容旧 LanguageCode/LanguageName 与新 Locale/Label。

## 8. 子路径与离线缓存

`params.pwa` 默认 true；`hugo server` 不注册 worker，并注销当前站点同一路径的旧 worker，避免本地预览被缓存误导。生产环境要求 HTTPS（localhost 可用于验收）。关闭 PWA 同样只注销自己的 worker，不影响同域其他应用。

manifest 的 start_url/scope、RSS、搜索、worker 与静态资源均跟随 baseURL；语言子目录使用独立 worker。缓存名称按站点/语言路径区分。HTML 与带指纹的资源缓存均跨构建保留，避免旧文章失去匹配的样式；只有缓存格式升级时清理自己的旧资源缓存，不清理其他站点或来源不明的历史缓存。达到容量上限或浏览器清理存储后，部分旧页面/资源会被淘汰。

```toml
[params]
pwa = true
pwaMaxPages = 80
```

pwaMaxPages 默认 80，必须为 1–500 的整数，越界构建报错。静态资源缓存上限 180 个。页面和搜索索引联网优先，静态资源缓存优先并后台更新；网络故障或 5xx 回退已缓存页面。404 保留服务端真实响应，不用缓存旧页面掩盖删除；失败响应不覆盖缓存成功页。未访问、未缓存的文章离线只能显示兜底页，不承诺全站下载。旧版本不具备路径命名的缓存不会自动迁移或删除，首轮访问后建立新缓存。

## 9. 发布检查

```sh
HUGO_BIN=/path/to/hugo sh scripts/check-theme.sh
```

依赖 Hugo extended、Python 3、Node.js、Git，无 npm 安装。检查真实示例/教程、独立多语言子路径宿主、组件源码复制、栏目结构、完整筛选状态、全文搜索和真实构建出的 service worker 行为。CI 在 PR 和发布前分别运行 **0.146.0 与 0.163.3**；不代表逐个回归所有中间版本。部署任务依赖检查通过。

结构检查不代替浏览器验收。公共布局/交互改动还需检查桌面、320/390px、三套配色、真实长标题、键盘、刷新/返回及原图加载；真实手机触摸和完整读屏另行确认。
