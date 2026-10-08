# vishine — Agent 开发入口

这是一个 Hugo 主题仓库，不是用户博客内容仓库。目标是让知识门户、技术文章和多层文档都能持续维护。先读本文件，再只阅读当前任务涉及的文档；用户本次指令优先于这里的工作约定。

## 开始工作

1. 查看 `git status --short` 和相关 diff，保留已有修改。确认正在改主题，还是使用主题的宿主站点；不要假定宿主站的 submodule 就是正在预览的主题。
2. 阅读 `README.md` 与任务对应文档。先定位现有组件，优先扩展公共实现。
3. 定义一个可验收的真实页面和交互；内容分组是站点配置，主题不硬编码 Linux、面试等业务词。
4. 默认先本地开发、构建、浏览器检查。只有用户授权时才提交、推送或部署；推送 main 可能触发 `.github/workflows` 中的部署。

## 内容与主题的职责契约

常规博客呈现以至少 95% 由主题公共能力承担为目标；这是职责约束，不用代码行数虚构覆盖率。宿主负责 Markdown、front matter、栏目层级、配置与图片；主题负责布局、组件、样式、交互、可访问性和渲染。不要为一次博客需求在宿主堆公共 CSS/JS 或复制主题模板。

- 使用组件前先读 `docs/COMPONENTS.md`，按需求选择自动渲染、配置或 shortcode；查源码确认参数真的生效。
- 若能力缺失，先在主题形成可复用接口，再让博客调用。站点专属例外须记录原因、路径、升级风险。
- 组件的完成条件：实现 + 参数契约（必填、默认、限制、嵌套、失败行为）+ 可复制源码与实际渲染示例 + 对应验证；四者一起维护。
- 新增／更名／移除组件时同步更新组件目录、README 入口和教程；自动组件也必须说明何时启用，不只维护 shortcode 清单。
- 不把内部 CSS 类、DOM ID、绝对机器路径当公共 API；保留旧用法，破坏性变化给迁移说明。
- 在宿主博客中工作的 Agent 可能不会自动读主题指令。检查宿主 AGENTS.md 是否指向实际主题；通用接入模板在 `docs/AGENTS-HOST.example.md`。不要覆盖宿主原规则，也不要假定 submodule 与预览工作副本相同。
- `docs/` 保存参数与契约；`tutorialSite/` 保存可浏览的源码／效果教程；`exampleSite/` 验证成品组合。现场验收记录不是公共 API 文档。

## 仓库地图

| 位置 | 用途 |
| --- | --- |
| `layouts/_default` | 通用列表、文章和显式 `hub` 模板 |
| `layouts/partials/section-hub.html` | 栏目总览组合模板 |
| `layouts/partials/section-nav/` | 栏目数据模型、入口卡、文章列表、分组和路径导航 |
| `layouts/shortcodes` | 作者在文章正文中主动插入的组件 |
| `assets/css` | 原有样式与公共变量；`component-polish.css` 为已验收质感规则，`section-hub.css` 为栏目组件，`depth.css` 为可关闭的页面分层 |
| `assets/js/main.js` | 搜索、菜单、配色、阅读宽度、目录、代码复制等通用交互 |
| `assets/js/list-state.js`, `list.js` | 普通博客列表的完整集合筛选、分页与 URL 状态 |
| `assets/js/reading-components.js` | 配置选项卡与折叠说明增强，仅相关文章加载 |
| `i18n` | 界面文案，新增文案至少提供中文和英文；不要把栏目名称当翻译键硬编码 |
| `exampleSite`, `tutorialSite` | 可独立构建的示例与教程宿主站 |
| `archetypes/hub.md` | 新建栏目内容模板 |
| `scripts`, `tests` | 本地运行入口、结构回归和状态逻辑测试 |

## 启动与检查

当前 CI 使用 Hugo **0.163.3 extended**，建议用同版本；`theme.toml` 声明的最低版本不等于已经完整回归过所有中间版本。需要 Git；测试另需 Python 3 和 Node.js，无需 npm 安装。

从主题根目录运行：

```sh
hugo version
sh scripts/theme-dev.sh serve exampleSite
sh scripts/theme-dev.sh build exampleSite
sh scripts/theme-dev.sh build tutorialSite
python3 scripts/check-section-hub.py
python3 scripts/check-component-docs.py
node --test tests/list-state.test.cjs
node --check assets/js/main.js
git diff --check
```

本地示例默认监听 `127.0.0.1:1314`；用 `VISHINE_PORT` 改端口。若 Hugo 不在 PATH，通过 `HUGO_BIN=/path/to/hugo` 指定；Python 检查也支持 `--hugo /path/to/hugo`。产物默认在被忽略的 `.local/`，可用 `VISHINE_RUNTIME_DIR` 指定外部目录。不要提交缓存、截图、日志、构建产物或个人机器路径。

## 必须维护的行为

- 首页保持工作台／跳板定位；不要未经要求改成大字宣传页或文章流。复用现有暖纸／纯白／暗色变量、字号、边界和阴影。
- 分层表面由 `params.layeredSurfaces` 控制（默认开启），契约见 `docs/DEPTH-SURFACES.md`。背景固定且不接收输入；保留整页滚动，不给文章添加固定高度、嵌套滚动或 transform 外壳；移动端减轻阴影。
- 有侧栏时正文和侧栏整体平衡。阅读宽度切换不应隐藏切回按钮；侧栏断点不能依赖当前宽度模式。
- 栏目页的子栏目和直属文章分开呈现；递归后代集合只用于总数，不能铺平成当前层的文章。未知分组、未分组、空栏目都必须有确定行为。
- 栏目导航（跨页面）和本页目录（文章标题）是两种职责；不要混成同一棵树。
- 文章排序／学习顺序根据显式 weight 和分组；不要根据标题中的数字猜顺序。移动内容时保留旧 URL／锚点或补重定向。
- 新界面文本走 i18n；内容中的说明、命令、事实属于作者，不为视觉效果擅自改写。
- 优先原生链接、details、button。交互增强应处理焦点、Esc、选中态和无脚本回退；避免新增依赖。
- CSS/JS 通过 Hugo resources 合并或指纹引用；本地也要避免 PWA 缓存误导验收。
- 不用浏览器端实现本来可以由 Hugo 构建时生成的数据关系。

## 验收与交付

选择与改动匹配的检查，不为简单样式新增镜像实现的测试。栏目结构改动运行结构测试；组件目录或可复制教程改动运行 check-component-docs.py，它会把教程渲染出的源码放到独立宿主重新构建；状态逻辑改动运行对应测试；模板变更构建示例和实际宿主站（可访问时）。

涉及界面时实际检查：桌面与 320/390px 窄屏、必要配色、真实长标题、展开/关闭/返回、键盘操作、刷新恢复。记录观察到的问题并修正；不能把构建成功称为视觉验收。

交付说明改了什么、验证了什么、未验证的限制，并提供本地页面。未经授权不推送。长期 API／使用说明放 `docs/`；现场进度放已有验收记录，不把每轮聊天写进本文件。

## 按需阅读

- `docs/COMPONENTS.md`：全部组件的选择、启用、参数与责任边界。
- `docs/AGENTS-HOST.example.md`：博客侧 Agent 的主题发现入口。

- `docs/SECTION-NAVIGATION.md`：栏目组件数据契约、启用与迁移。
- `docs/RUNBOOK-COMPONENTS.md`：步骤、配置选项卡、折叠说明。
- `docs/COMPONENT-POLISH.md`：现有视觉规则与近期验收状态。
- `docs/GETTING-STARTED.md`, `docs/USAGE.md`：使用与配置。
