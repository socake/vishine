# 交互式知识引擎

本目录属于 vishine 主题。先读 ../../docs/interactive/README.md、PROTOCOL.md 和 ACCEPTANCE.md。

- 协议权威来源是 src/protocol/catalog.ts 与 schema.ts；运行 npm run generate 导出 schemas 下的机器清单与 JSON Schema。
- src/core 不引入领域计算；领域操作符放 src/extensions，渲染器通过 registerComponent 注册。新增能力同步协议、示例、测试、文档。
- YAML 不能执行 JS、加载模块 URL、写任意 HTML/CSS。绑定采用白名单 AST；禁止 eval/new Function/任意 DOM event。
- 配置的 data 是普通 JSON；不要自动把其中形似表达式的对象执行为绑定。
- 共享状态属于单个实例。动作事务原子提交；派生值只读、依赖无环；销毁清除定时器、监听器和渲染资源。
- 必须运行 npm run check、npm run build；界面在真实 Hugo 页验证。主题目录还需运行 scripts/check-theme.sh。
- 不提交 node_modules、生成的浏览器 validator、Hugo assets/knowledge-dist；schema 和机器注册表是版本化公共协议，要提交并检查与生成器一致。
- 功能仅以 ACCEPTANCE.md 的实际证据标记 PASS；不能把 registered 或 experimental 等同于已完整验收。
