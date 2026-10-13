# vishine Markdown 渲染规范 · Prose Spec（定版）

> **唯一权威。** 全站所有正文（文章 / 实战手册 / 文档 / 关于 / 路线图…）的 Markdown 渲染**完全一致**，以本规范 + 详情页 `mockups/d-article.html` 的 `.prose` 为唯一基准。**换页面不换渲染。**
> 配套：[`DESIGN.md`](./DESIGN.md)（视觉 token）、[`INTERACTION.md`](./INTERACTION.md)（交互）。

---

## 0. 三条定版原则

1. **单一 prose 容器**：所有 Markdown 正文一律包进 `.prose`，继承同一套元素样式。**禁止页面级覆盖正文样式**——任何页面想"特殊处理正文"都不允许，要改改 `.prose` 本身（全站生效）。
2. **字体唯一**：正文 / 标题 / 代码字体 = DESIGN §4 的 `--font-sans` / `--font-mono`，全站定版，正文不另设字体（详见 §3）。
3. **渲染器锁定**：Hugo **goldmark**，配置见 §2。所有非标准元素（callout 等）走指定 shortcode / render hook，不允许在内容里写裸 HTML 绕过规范。

---

## 1. 元素渲染规约（逐元素）

> 颜色全走 token；间距遵循 DESIGN §4/§5；行宽受 `--read-w` 约束（详情页可宽窄切换）。

| Markdown | 渲染 / class | 规约 |
|---|---|---|
| 段落 `p` | — | `--ink-2`，`line-height:1.7`，段间距 ~1em；中文行宽 ≤ `--read-w` |
| `h2` / `h3` / `h4` | `.anchor`（render-hook 注入 id+#） | 字号梯度（DESIGN §4），上间距 > 下间距；hover 显 `#`、点击复制段落链接（INTERACTION §3.1） |
| 强调 `**粗**` | `<strong>` → `--ink` 加粗 | 正文重音用加粗，不用色 |
| 斜体 `*斜*` | `<em>` | **中文禁排斜体**（发虚）；中文着重改用加粗或 `<u>`/着重号；西文可斜 |
| 链接 `[]()` | `<a>` | `--accent` + hover 下划线；站外链接 render-hook 加 `target=_blank rel=noopener` + 外链角标 |
| 无序 `- ` | `ul>li` | 自定义标记（小方点/板块色），缩进一致，支持嵌套 |
| 有序 `1.` | `ol>li` | mono tabular 序号 |
| 任务列表 `- [ ]` | `.task-list-item` | 自定义 checkbox（accent 勾），禁用原生丑样式 |
| 引用 `>` | `blockquote` | 左 2px `--accent` 竖条 + `--accent-soft`/`--paper-2` 软底 + `--ink-2` |
| 行内 `` `code` `` | `<code>` | `--paper-2` 底 + `--font-mono` + 2–4px 圆角 + 轻内距 |
| 代码块 ` ``` ` | `.code-block`（`.code-head` 语言标签+复制 + `pre`） | 语法用 `--code-*`；遵守 **DESIGN §2.4 代码清晰度规约**（注释不斜体、中文走 sans、13.5px/1.7、AA 对比） |
| 表格 `|` | `.table-wrap`（包裹横向滚动）`> table` | 表头 `--paper-2`，行分隔 `--line-2`，可斑马；窄屏横向滚动不撑破 |
| 图片 `![]()` | `<figure class="fig">`（render-hook）`> img + figcaption` | 居中、圆角、`--line` 边；点击 zoom（INTERACTION §3.1）；caption `--ink-3` |
| HTML 图表 | `html-embed` shortcode | 宿主的独立 HTML 文件；主题提供外框、标题、局部横向滚动和完整页面入口，见 §1.2 |
| 分隔 `---` | `<hr>` | 细线 `--line`，上下留白 |
| 脚注 `[^1]` | `.footnotes` | 编号 + 回链；hover 气泡预览 ⏳（暂未做） |
| Callout/提示 | shortcode → `.callout(.warn/.info/.tip)` | 见 §1.1 |

### 1.1 Callout（提示框）— 非标准元素走 shortcode
Markdown 无原生提示框，**统一用 shortcode**，不准在正文写裸 HTML：
```
{{< callout type="warn" >}}
2.x 必须显式开启鉴权，否则空口令可被接管。
{{< /callout >}}
```
渲染成 `.callout.warn`（也有 `.info` / `.tip`）：左图标 + 板块/accent 软底 + 标题。颜色走 token。

### 1.2 图表按源格式选择

| 已有内容 | 写法 | 阅读要求 |
| --- | --- | --- |
| 简单流程／时序关系 | Mermaid 围栏 | 由主题渲染 SVG，支持查看器 |
| 独立 SVG 文件 | 普通 Markdown 图片 | 保留矢量；无需包装成 HTML |
| 照片／截图／位图 | 普通 Markdown 图片 | 正文保留原始资源，避免重复有损转码；源图模糊需要更换源图 |
| 包含 SVG／HTML 文字的独立 HTML 图表 | `html-embed` | 保留源文件，按可读尺寸设置 `minWidth`，窄屏局部横向浏览 |

HTML 放在宿主 `static/diagrams/`，正文通过 shortcode 引用，不能把整份 HTML 的 style/script 粘贴到正文。组件仅接受可信本地 `.html` 文件；普通 `page` 模式固定高度，Archify 模式的配色与自动高度有明确适用条件。HTML 内的位图不会自动变成矢量。完整参数、尺寸范围与回退行为见 [HTML-EMBED.md](HTML-EMBED.md)，实际源码和效果见教程 14。

---

## 2. Hugo goldmark 落地配置（定版）

`config/_default/markup.toml`：

```toml
[goldmark.renderer]
  unsafe = false            # 默认禁裸 HTML；特殊渲染走 render hook / shortcode
[goldmark.extensions]
  table = true
  strikethrough = true
  taskList = true
  [goldmark.extensions.footnote]
    # 启用脚注
  [goldmark.extensions.typographer]
    disable = true          # 中文标点不要被智能替换
[goldmark.parser]
  autoHeadingID = true
  [goldmark.parser.attribute]
    title = true            # 允许 {#id .class} 属性

[highlight]
  noClasses = false         # 输出 class（chroma），便于映射到 --code-* token
  lineNos = false
  tabWidth = 2
  guessSyntax = true
```

### 2.1 Render Hooks（`layouts/_default/_markup/`）— 把 md 元素套进 prose 组件
- **`render-heading.html`**：输出 `<hN id=…>` + 内嵌 `.anchor`（hover `#` + 复制锚点）。
- **`render-image.html`**：输出 `<figure class="fig">…<figcaption>` + zoom 钩子（`role=button tabindex=0`）。
- **`render-link.html`**：站外链接加 `target/rel` + 外链角标；站内保持。
- **`render-codeblock.html`**（或包裹 highlight）：套 `.code-block` + `.code-head`（语言标签 + 复制按钮）。

### 2.2 代码高亮 → token 映射
用 Hugo/chroma 的 class 输出，但**配色不引第三方主题**：写一份 `assets/css/syntax.css`，把 chroma 的 `.chroma .k/.s/.c/.m/.nf` 等映射到 `--code-key/str/com/num/fn`（DESIGN §2.4 已定义、三套 scheme 齐全）。这样代码色与全站调性统一、随 scheme 切换。

### 2.3 Shortcodes（`layouts/shortcodes/`）
- `callout.html` → `.callout`（§1.1）。
- 步骤用 `runbook-step` / `step-part`，方案切换用 `config-tabs` / `config-tab`，补充说明用 `reading-details`，见 [正文组件契约](RUNBOOK-COMPONENTS.md)。
- HTML 图表用 `html-embed`（§1.2）。shortcode 本身不要求 `goldmark.renderer.unsafe = true`；该开关针对 Markdown 正文中的原始 HTML。
- 全部组件及参数入口以 [COMPONENTS.md](COMPONENTS.md) 为准；新增公共能力同步维护组件目录与可复制教程，**不散落裸 HTML**。

---

## 3. 字体一致性（定版）

- **唯一字体栈**（与 DESIGN §4 同源，不得分叉）：
  - 正文/标题/UI：`--font-sans` = `"Noto Sans SC", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
  - 代码/数字/标签：`--font-mono` = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`
- **加载**：Web 字体（Noto Sans SC / JetBrains Mono）self-host 或 CDN，**必须带完整 fallback**（离线/失败时优雅降级到系统字体，不糊）。中文务必有 `PingFang SC`/`Microsoft YaHei` 兜底。
- **正文与主题组件**：不得另设或页面级覆盖字体。代码块内中文（如注释）按 DESIGN §2.4 回退到 sans，避免等宽中文发糊。
- **独立 HTML 图表**：`html-embed` 的标题、外框和入口沿用主题字体；iframe 内是作者维护的独立文档，可保留图表自己的字体与布局。不得把图内样式注入父页面；需要在嵌入尺寸下确认文字可读。

---

## 4. 落地验收清单

- [ ] 任意 md 内容在任意页面（文章/手册/文档/关于）渲染**逐元素一致**
- [ ] 所有正文包在 `.prose`，无页面级正文样式覆盖
- [ ] §1 表中每个元素都有定义，内容里无裸 HTML（特殊元素走 shortcode/hook）
- [ ] 代码高亮走 `--code-*` token，随 scheme 切换
- [ ] 全站字体统一，离线 fallback 不糊
- [ ] 三套 scheme 下正文 + 代码 + 表格 + callout 都正常

---

*基准实现：`mockups/d-article.html` 的 `.prose`。这是"内容长什么样"的唯一答案。*
