# 架构与扩展

Hugo shortcode → 规范化 JSON 容器与静态说明 → 小型 loader → React renderer → 组件。核心为纯 TypeScript Engine；领域操作符在 extensions。图表与公式通过动态 import 加载，普通文章不引用 loader。

主题 baseof 仅新增 head/scripts 两个 partial 调用。Vite 以相对路径生成带哈希的资源，Hugo 发布全部分块并根据 manifest 引用入口；不要再给分块重命名，以免破坏相对 import。适用于根域与子路径，现有 PWA 静态资源策略可缓存已请求的模块；未访问的懒加载模块不保证离线可用。

## 注册组件

1. 在 src/protocol/catalog.ts 添加 type、封闭 props schema、children 和事件清单。
2. 在独立组件文件实现 React renderer，使用 props、dispatch，避免跨实例 DOM 查询。
3. 通过 runtime.tsx 导出的 registerComponent 注册；新类型不修改已有组件内部实现。
4. 添加 YAML 示例、行为测试、静态回退说明及键盘行为。
5. npm run generate 更新公开 Schema/注册表，npm run check 和 npm run build 验证。

组件只消费主题变量；样式限定 .ki 命名空间。SVG marker/ARIA ID 必须实例隔离。Graph当前支持grid/ring/flow有限布局、grid分组折叠、局部缩放与滚动；不支持自由拖拽或任意自动布线。

## 注册计算

扩展实现 Operator（JSON参数→JSON结果），在 extensions 入口显式注册，并把运算符加入协议清单。不得使用时钟、随机数、网络或修改全局状态。必须测试知识逻辑；GPU验证维度与Rank分组，Ring验证每一数据块在终态恰好含每个Rank一次。

## 开发与检查

在 packages/knowledge-engine 中：

```sh
npm ci
npm run check
npm run build
npm run validate -- examples/math.yaml
npm run validate:html -- /path/to/hugo/public
```

检查包含类型、格式、核心行为与九份示例配置。构建生成机器Schema/注册表和浏览器validator；临时资源与依赖被忽略，版本化schema应随源码提交。主题根目录 `HUGO_BIN=/path/to/hugo sh scripts/check-theme.sh` 执行现有契约回归。

Node依赖仅开发/构建需要，站点无需Node服务。主题与博客GitHub工作流先检查/构建引擎再执行Hugo。七牛发布前也必须先构建；本实现不自动上传或刷新CDN。

## 设计依据

继承 docs/DESIGN.md 的字体、paper/clean/dark token和阅读宽度，不另建视觉世界。文章内以参数、图形、解释顺序组织；小屏控制区换行，溢出的图形可局部滚动，纵向到达边界后继续滚动文章。全屏使用浏览器Fullscreen API，失败显示提示。现有Mermaid与html-embed保持独立用途。

发布流水线在 Hugo 构建后扫描实际渲染的 JSON 配置，按同一协议检查参数覆盖结果；避免只检查主题示例而漏掉宿主新增文章。

公式字体例外：Formula组件按需加载KaTeX数学字形与配套字体，以正确排版数学符号；其他界面继续使用主题sans/mono。这是公式渲染边界，不改变全站字体规范。

## 交互反馈的参考与实现

2026-10-29 研究了 OpenAI 的公开文章 [New ways to learn math and science in ChatGPT](https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt/) 及其 [镜面方程演示](https://cdn.openai.com/ctf-cdn/interactive-learning/mirror-equation.html)。实际调整物距，观察到公式数值与图形联动。这是公开体验参考，不是对 ChatGPT 私有框架或源码的推断。

本实现采用相同的教学反馈原则：输入、图形、解释保持邻近；数值变化有可对照的坐标与来源；播放步骤共享状态；明确区分暂存参数和已应用结果。Workbench 是通用双栏组件；GPU、数学和通信示例只通过配置重新组合。DataBlocks 只呈现值与完成状态，Ring 的归约逻辑仍在领域扩展中。

`tests/interaction-regressions.mjs` 通过受管浏览器 Page 验证连续操作，使用方式同 browser.e2e.mjs。Ego 原生动作可能短暂切换页面 visibility；因此“不暂停的节点选择”断言在同一前台 DOM 事件序列中执行，防止与后台自动暂停策略混淆。不能把这一断言描述成操作系统级指针测试。

控件的公共实现是 `src/components/Controls.tsx`：SelectControl保留原生select语义，Icon统一16px、1.7px描线的装饰性SVG。通用按钮不覆盖CodeBlock等专用内容控件的排版。图形采用内容对应的结构：GPU为设备分组，Ring为环形通信，K8s为语义分层，TCP为通信双方；不通过随机装饰色区分领域。

`components/graph-geometry.ts`独立于React和领域扩展，负责稳定布局、边界端口、有限候选布线与标签放置。几何测试覆盖依赖层级、重合位置、障碍避让、自连接、环形窄屏、长标签、100节点布局和标签不遮挡路径。100节点布局测试不等于100节点复杂连线的浏览器性能基准。

公共组件展示页为教程站`/labs/components/`，配置是`knowledge-examples/components.json`，不是另一套页面实现。`tests/component-system.e2e.mjs`通过受管浏览器验证操作、状态、焦点、局部定位、响应式和减少动画；运行方式与其他browser.e2e脚本相同。

本机曾观察到Hugo0.163.3预览在批量替换构建资源时出现`close of closed channel`并退出。开发时先停止自己管理的预览进程，完成引擎构建后重启，再确认页面可达；不要在监听过程中并发运行多个资源构建。生产构建本轮正常，此记录不等于所有Hugo版本均有相同问题。

## 计算与渲染性能

派生表达式在编译时提取引用，按依赖值缓存最近一次结果；修改选择或暂存参数不会重建无关拓扑。缓存按实例、派生项与组件有界保存，不积累历史状态。结果属性使用不可变引用复用已通过的校验；新值仍完整校验，失败事务不提交。配置和计算返回的对象会深冻结，因此自定义计算模块必须是纯函数：不得修改输入／返回后再修改结果，不读取时间、随机数或外部可变状态。变化必须通过显式参数和state/step传入。

只含数据节点的Graph在输入引用不变时跳过React重渲染；嵌套Node的声明式事件仍按原事务处理。Chart首次挂载只提交一次完整数据，未变化的点集不重新绘图。可见性监听仅在正在播放时暂停，不对已暂停实例触发无意义更新；pagehide保留跨BFCache恢复后的清理能力。

浏览器校验器仍是构建时生成的静态代码。生成器用scene.type分派对应分支，避免对嵌套组件重复尝试所有组件类型；公开JSON Schema保持标准oneOf语义，禁止字段和绑定结果校验不变。无eval或运行时编译。

可重复的纯计算／资源基准：在包目录执行`npx tsx tools/benchmark.ts report.json`。浏览器与报告口径见PERFORMANCE.md；计时不写入生产运行时。不要把Node计算时间或事件到DOM提交时间当作INP/FPS。

手机验收脚本`tests/mobile.browser.mjs`通过ego-browser受管Page运行。每次改变设备尺寸后重新启用TouchEmulation并断言pointer:coarse，避免仅缩小桌面视口就误报手机通过。CDP触点由实际元素矩形计算，并先检查命中元素，验证点按和边界滑动。新页面带本地测试查询参数以避免复用旧文档缓存，不清理用户缓存／登录信息。测试不等于实体iPhone、Android或Safari已验收。

提交前边界回归：`tests/review-regressions.mjs` 接受受管 Page、结果目录和生产 manifest 中的 runtime 分块 URL，验证特殊分组名、多实例选择隔离与全屏退出焦点归属；配置边界见核心测试和 `scripts/check-interactive.py`。

滚动回归：`tests/scroll.browser.mjs` 接受受管Page、结果目录及`{article, gpu}`预览URL。文章夹具依次包含紧凑grid、SVG图／表格及公式，GPU夹具用于密集grid。检查原生滚轮、PageDown、触控，以及大图内部滚动与边界衔接，不能只用CSS计算值宣称行为通过。
