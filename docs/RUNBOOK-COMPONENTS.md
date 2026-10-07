# 实战步骤组件

全部组件入口与职责边界见 [COMPONENTS.md](COMPONENTS.md)。

用于把同一步操作的前置条件、执行、验证和回退放在一处。无额外 JavaScript，沿用主题的代码高亮、复制、目录与三种配色。

## 写法

```text
{{< runbook-step number="1" title="准备配置" id="prepare-config" >}}
{{< step-part kind="prerequisites" >}}
- 已具备所需环境与权限。
{{< /step-part >}}
{{< step-part kind="action" >}}
在这里编写操作说明、列表和 Markdown 代码块。
{{< /step-part >}}
{{< step-part kind="verify" >}}
写明检查方法，以及成功时应看到什么。
{{< /step-part >}}
{{< step-part kind="rollback" >}}
写明恢复方法和注意事项。
{{< /step-part >}}
{{< /runbook-step >}}
```

- 使用 `{{< >}}` 成对写法。父组件只容纳 step-part，子组件内正常编写 Markdown。
- `title` 必填，`number` 可选，`id` 可选但推荐明确指定且页内唯一。迁移旧文章时沿用原章节锚点。
- step-part 的 `kind` 可取 `prerequisites`、`action`（默认）、`verify`、`rollback`；每种按内容需要使用。
- 父组件标题为 H3，适合放在“实施步骤”等 H2 下；正文目录仍收录该标题。
- 组件只改变内容组织和样式，不会执行命令；验证与回退内容需作者按真实环境维护。
- 桌面为标签＋内容两列，窄屏为单列；代码和表格沿用局部滚动。

## 维护入口

- `layouts/shortcodes/runbook-step.html`
- `layouts/shortcodes/step-part.html`
- `assets/css/component-polish.css` 的 Runbook step 段落
- `i18n/zh-cn.toml` 与 `i18n/en.toml` 的 runbook 文案

可移植样板：`tutorialSite/content/docs/11-components.md`，含源码与真实渲染。主题根目录运行 `sh scripts/theme-dev.sh serve tutorialSite`，从“组件与维护”进入。

模板实现参考 Hugo 官方 [嵌套 shortcode](https://gohugo.io/templates/shortcode/) 与 [RenderString](https://gohugo.io/methods/page/renderstring/) 文档。

## 配置选项卡

用于读者需要择一采用的环境／工具方案。共用的验证、限制和回退应放在选项卡外。

```text
{{< config-tabs id="deployment-options" label="选择部署方式" >}}
{{< config-tab label="Docker" >}}
#### Docker 部署
这里是 Docker 方案，支持 Markdown 和代码块。
{{< /config-tab >}}
{{< config-tab label="Kubernetes" >}}
#### Kubernetes 部署
这里是 Kubernetes 方案。
{{< /config-tab >}}
{{< /config-tabs >}}
```

- 父组件 id（页内唯一）与 label 必填；子组件 label 必填，必须位于 config-tabs 内。
- 每个方案保留自己的标题；迁移已有内容时保留原标题锚点。建议用 H4，方案上方保留可从目录访问的章节标题。
- 点击、左右方向键、Home／End 切换；Tab 进入当前面板，隐藏方案不进入键盘焦点。
- 当前方案锚点写入 URL，刷新或直接打开旧标题链接时自动显示对应方案。
- 无脚本时所有方案连续显示；打印时展示全部配置。长标签在手机上横向滚动。

样板：PR 独立环境手册的“步骤 6”，Gateway API 与 Nginx Ingress 两种配置。组件只做内容组织，不改变方案适用条件。

## 折叠说明

用于补充原理、背景和判读，避免折叠必读操作、验证、回退或安全限制。

```text
{{< reading-details title="为什么采用这个目录结构？" >}}
补充说明，支持 Markdown。
{{< /reading-details >}}
```

`title` 必填；可设置 `id="some-detail"` 供链接定位，`open=true` 默认展开。基于原生 details/summary，无脚本也支持鼠标与键盘。正文中的锚点链接会自动展开所属说明；打印时临时展开，结束后恢复原状态。

实现：`config-tabs.html`、`config-tab.html`、`reading-details.html`；渐进增强脚本 `assets/js/reading-components.js` 仅在使用相关组件的文章加载。交互参考 [WAI 选项卡模式](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)。
