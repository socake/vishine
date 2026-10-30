# 交互式知识讲解 · experimental v0.1

同一套声明式组件树、状态、事件和安全绑定用于技术图解与教学内容。此版本提供六个领域示例，是完整引擎的首版实现，不代表长期组件清单已经全部实现。实际检查见 [验收记录](ACCEPTANCE.md)。

## 安装与构建

使用 Node.js 22（或符合 Vite 7 要求的 Node 20.19+）。在主题根目录运行：

```sh
sh scripts/build-interactive.sh
sh scripts/theme-dev.sh serve tutorialSite
```

首次安装使用锁文件。编辑引擎后重新运行构建；编辑 YAML 或 Markdown 使用 Hugo 自动刷新。主题完整检查 `sh scripts/check-theme.sh` 会 npm ci、检查引擎并构建资源。构建宿主前先构建主题引擎；CI 已接入这一顺序。引擎不需要运行服务器，发布仍是 Hugo 静态文件。

源码位于 `packages/knowledge-engine`，生成资源在被忽略的 `assets/knowledge-dist`，schema 与注册表在包内 `schemas`。不要只提交源码而跳过发布时的前端构建。缺少运行时资源时 Hugo 输出警告并保留静态说明。

## 写作

在叶子文章包内放 `index.md` 与 `diagrams/demo.yaml`：

```text
{{< interactive src="diagrams/demo.yaml" >}}
```

配置先查文章资源，再查主题／宿主 `assets`。路径限本地 `.yaml/.yml/.json`，禁止协议、查询、片段和路径遍历。同页多次调用得到隔离实例。

复用共享配置并覆盖初值：

```text
{{< interactive src="knowledge-examples/math.yaml" params=`{"a":2}` >}}
```

`params` 是 JSON 对象，仅覆盖已声明 state 的 initial，仍须符合原类型与范围。不支持覆盖任意组件结构、不执行字符串表达式。独立交互页面只需新建普通 Hugo 页面并使用相同 shortcode；教程 `/labs/knowledge/` 是实例。

运行时挂载成功后折叠静态说明，读者仍可展开；脚本失败时说明始终可读。此版本文字说明包括标题、概述、带label的公开初始参数与步骤摘要，复杂图形不预渲染为静态 SVG。

## 文档入口

- [协议与安全](PROTOCOL.md)：状态、表达式、事件、步骤、错误与版本。
- [组件清单](COMPONENTS.md)：由实际注册源生成的属性清单。
- [Agent 使用](AGENT-GUIDE.md)：生成、校验与预览。
- [架构与扩展](DEVELOPMENT.md)：模块边界、注册与资源流程。
- [验收记录](ACCEPTANCE.md)：实测证据、限制和待实现项。

教程 17 展示 GPU、Ring AllReduce、Pod 调度、TCP 握手、二次函数与英语标注。GPU 数值字段先暂存，点击“应用并行参数”原子提交；待应用提示与已应用布局分开显示。Ring 示例固定四个 Rank；计算扩展测试覆盖 2/4/8/16 Rank，不等于示例已支持任意 Rank 的动态课程。

附加验证配置：`gallery.json` 覆盖条件显示、标签页、代码行、表格和节点组合；`resistor.json` 展示仅新增JSON即可引入新的知识领域。

Workbench 可将图形与控件／解释并列组合，窄屏自动上下排列。选择对象会保留到后续步骤；顶栏重置同时恢复参数、步骤与局部视图。协议详见 PROTOCOL.md 文末的交互反馈修订。

组件本身的外观／状态展示见教程站 `/labs/components/`：主次按钮、轻量按钮、禁用／忙碌、节点选择／高亮／运行／异常、长标签、自动连线与空状态。作者通过同一Schema组合，不需修改文章React源码。

需要区分操作和结果时，将输入、按钮及就地反馈放入`ControlPanel`，图形／解释放在同级或Workbench另一栏。它提供与主题同步的轻底色及可访问分组，不改变原有绑定和事件；PlaybackControl自动使用同样的操作带。完整属性和组合片段见[操作区与呈现区](PROTOCOL.md#操作区与呈现区)。

性能优化、实测环境、前后结果及未验证边界见[性能报告](PERFORMANCE.md)；自定义计算模块的纯函数和不可变约定见[开发规范](DEVELOPMENT.md#计算与渲染性能)。

手机尺寸、触点、横屏、输入和滚动的实测范围及真机限制见[手机验收](MOBILE.md)。

按提纲让Agent写文章时，从[写作指南](AGENT-GUIDE.md)进入；[场景索引](recipes.json)帮助选起点，[最小参数配置](authoring/parameter-lab.yaml)和[文章骨架](authoring/article.md)可以复制到文章包。此流程是编辑阶段生成文件，读者侧不调用AI服务。
