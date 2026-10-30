# vishine 产品上下文

vishine 是供个人技术博客、知识门户与多层文档使用的 Hugo 主题。用户通过 Markdown、front matter、站点配置和 shortcode 维护内容；主题提供一致的阅读、导航、组件和交互。现有产品定位与公共接口以 README.md、docs/COMPONENTS.md 为准。

## 本次增量：交互式知识讲解

读者在文章中调整参数、选择对象、逐步探索知识；作者和 Agent 使用受约束的 YAML/JSON 组合已有组件。通用引擎负责组件树、状态、事件和步骤；专业计算属于显式注册的领域扩展。

已确认的首版范围是六个跨领域案例、Hugo 接入、核心组合与联动，以及可执行校验和实际验收。现有实现另有组件组合与电阻配置示例。完整长期清单（包括十领域、十条 Agent 任务及高级画布能力）仍需后续实现，不能以首版通过代替完整验收。

## 权威入口

- 用途、接入与首版能力：docs/interactive/README.md。
- 协议、安全及实际限制：docs/interactive/PROTOCOL.md。
- 实现边界、扩展及设计依据：docs/interactive/DEVELOPMENT.md。
- 实际验证证据和待实现项：docs/interactive/ACCEPTANCE.md。
- 视觉权威：docs/DESIGN.md。保留暖纸、纯白、暗色三套 token、既有字体及阅读布局。

该功能属于既有阅读表面的扩展，不重构博客、不替换主题视觉系统。内容优先，交互用于解释知识；页面继续由 Hugo 静态生成。文档与验收报告不得将未实现或未验证能力写成已支持。
