# 贡献指南

感谢你对 **vishine** 的兴趣！这是一个基于 [Blowfish](https://github.com/nunocoracao/blowfish) 二次开发的知识门户型中文技术博客 Hugo 主题。无论是修 bug、补文档还是提新特性，都欢迎。

本文档说明如何在本地跑起来、项目目录怎么组织、提 PR / issue 的规范，以及必须遵守的代码风格。

---

## 环境要求

- **Hugo extended ≥ 0.146.0**（必须 extended 版本，主题用到资源处理 / 图片缩放 / fingerprint / SCSS）
- Git

确认版本：

```bash
hugo version   # 输出里要带 "extended"
```

---

## 本地开发

主题仓库自带 `exampleSite/` 演示站点，开发时用它来预览。在**主题仓库根目录**执行：

```bash
hugo server --source exampleSite --themesDir ../.. --buildDrafts
```

说明：

- `--source exampleSite`：以 exampleSite 作为站点根；
- `--themesDir ../..`：让 exampleSite 在上两级目录里找到名为 `vishine` 的主题（即当前仓库本身）；
- `--buildDrafts`：渲染草稿，方便预览。

浏览器打开 `http://localhost:1313/vishine/` 即可，改主题文件（layouts / assets / data 等）会自动热重载。

> 如果改了 `assets/css` 或 `i18n` 没生效，按 `Ctrl+C` 重启 `hugo server`。

---

## 目录结构

```
vishine/
├── layouts/            # 模板（首页 bento、feed 列表、文章页、partials、shortcodes）
│   ├── partials/       #   组件片段，含自动封面生成器 cover-svg.html
│   └── shortcodes/     #   Blowfish 兼容 shortcodes
├── assets/             # 待 Hugo Pipes 处理的资产（CSS token / SCSS、JS）
│   ├── css/            #   三套配色 scheme 的 CSS 变量与组件样式
│   └── js/             #   命令面板、TOC、scheme 切换、图片 zoom 等
├── data/               # 站点级数据，sections.toml = 板块色彩编码映射
├── i18n/               # 多语言文案表
├── static/             # 原样拷贝的静态资源
│   └── js/mermaid.min.js   #   自托管 Mermaid（不依赖 CDN，必须随仓库提交）
├── exampleSite/        # 演示站点（仅供预览，不含真实文章）
├── docs/               # 设计 / 使用 / 交互 / Markdown 文档
└── theme.toml          # 主题元信息
```

各模块职责：

- **layouts/**：所有 HTML 模板。视觉组件优先做成 `partials/`，写作语法扩展做成 `shortcodes/`。
- **assets/**：需要 Hugo 处理（指纹、压缩、SCSS 编译）的 CSS / JS 都放这里。
- **data/sections.toml**：板块与分类 → 板块色 class 的唯一映射来源，**模板里绝不写死颜色，一律查这里**。
- **i18n/**：界面文案，新增可见文案时同步补齐对应语言键。
- **shortcodes/**：`badge` / `lead` / `callout` / `typeit` / `timeline` 等，保持与 Blowfish 兼容的调用形式。

---

## 代码风格

### CSS / 配色（最重要）

vishine 的核心是「三套配色 + 板块色彩编码」，所有颜色都走 CSS token，因此：

- **绝不硬编码颜色**。模板和组件样式里不要出现 `#fff`、`rgb(...)`、具体 hex，一律使用 `var(--c-*)` token。
- **新增 token 必须在三套配色里都定义**：`paper`（暖纸）/ `clean`（纯白）/ `dark`（暗色），缺一套都算未完成，否则切换 scheme 会出现颜色缺失或对比度问题。
- **板块色只从 `data/sections.toml` 取**。要给某分类着色，改数据映射，而不是在模板里写颜色。
- 复用既有 token 与组件类，不要为一次性样式新造一套变量。

### 模板

- 优先复用 `partials/`，避免在多个模板里重复同一段逻辑。
- 保持 Blowfish 兼容：已存在的 shortcode 调用形式（参数名、用法）不要破坏。
- 不引入外部 CDN 依赖（Mermaid 已自托管，新依赖也应自托管或可由 `params` 关闭）。

### 通用

- 提交聚焦单一主题，不要在一个 PR 里夹带无关改动。
- 与现有代码的缩进、命名风格保持一致。

---

## 提交 Pull Request

1. Fork 仓库并基于 `main` 开分支（如 `fix/toc-scrollspy`、`feat/cover-arc`）。
2. 本地用上面的 `hugo server` 命令在 **paper / clean / dark 三套配色下**都验证一遍，确认改动正常、无颜色缺失。
3. 涉及配置 / 用法变化时，同步更新 `docs/USAGE.md` 等相关文档。
4. PR 描述请包含：
   - 改了什么、为什么；
   - 关联的 issue（如有）；
   - UI 改动请附**三套配色**的截图或说明。
5. 保持 commit 历史清晰；一个 PR 解决一件事。

---

## 提交 Issue

提 issue 前请先搜索是否已有重复。

**Bug 报告**请提供：

- Hugo 版本（`hugo version`，确认是 extended）；
- vishine 版本 / commit；
- 复现步骤、期望结果与实际结果；
- 出问题的配色 scheme（paper / clean / dark）与是否能在 `exampleSite` 复现；
- 必要的截图或最小复现配置。

**功能建议**请说明使用场景与动机，最好附上你期望的交互或视觉效果参考。

---

感谢你的贡献，让 vishine 变得更好！
