# Agent：从文章意图到可验证图解

这是一套编辑阶段使用的声明式组件系统。Agent输出Markdown和YAML/JSON，浏览器执行既有引擎；没有博客内AI生成按钮，也不要求每次新写React。用户提供主题、章节和观点后，常规图解的选择与实现由Agent完成。

## 先决定是否需要交互

- 读者只需看清顺序、关系或结论：正文、表格、Mermaid通常已足够。
- 读者需要改变参数并看结果：用ControlPanel + 输入 + 派生值 + Text／Formula／Chart。
- 读者需要点对象查看联系：用Graph／RichText／CodeBlock + Inspector。
- 读者需要理解过程：用steps + Stepper／PlaybackControl + 图形 + 步骤说明。
- 已有可信HTML图解：使用主题html-embed，不转换或重复重写。

先用一句话确定每个图解的学习任务，例如“改变batch size，观察理想数据体积如何变化”。装饰性动画、无动作按钮或只读卡片不能冒充交互教学。图解数量由文章需要决定。

## 读取能力与选择起点

1. 阅读[README](README.md)、[PROTOCOL](PROTOCOL.md)，以及`packages/knowledge-engine/schemas/components.json`和`knowledge-v1.schema.json`。
2. 查[机器可读场景索引](recipes.json)。其中是已存在的示例和组合建议，不是额外运行时组件或已实现全部算法的声明。
3. 从最接近的配置复制到文章包再编辑；不修改共享示例来写某篇文章。新主题的普通组合仍可直接用Schema描述，不受配方名称限制。

已验证的起点包括GPU并行、四Rank归约、Pod调度、TCP握手、函数实验、句子标注、代码联动、电阻计算。限制须保留：Ring示例固定四Rank；Kubernetes是简化流程；Graph不支持任意拖拽；更换参数、步骤或假设后都需重新验证。不能把示例代码外观当成任意领域模拟器已经实现。

## 写配置

文章目录采用：

```text
content/posts/<slug>/index.md
content/posts/<slug>/diagrams/<concept>.yaml
```

Markdown中嵌入：

```text
{{< interactive src="diagrams/<concept>.yaml" >}}
```

可复制的完整最小起点在[authoring/parameter-lab.yaml](authoring/parameter-lab.yaml)，配套文章骨架在[authoring/article.md](authoring/article.md)。复制后改标题、假设、参数范围和预期结果，不能只换名字便宣称领域逻辑正确。

- state声明类型、初值和合法范围；公开参数提供label。所选节点、暂存draft_*等内部状态不提供公开label。
- 有相互约束的参数时采用暂存／应用事务。GPU示例修改初值时要同步对应draft_*，并保持nodes×gpus=dp×tp×pp×cp，避免初始就显示待应用或非法布局。
- 输入与动作放ControlPanel，结果／图形放同级或Workbench另一栏。手机下仍能找到操作和结果；别用额外嵌套卡片堆层级。
- 绑定用白名单表达式；动作写入已声明state。Text需要字符串时用concat，数值不能直接冒充字符串。一次事件写多个状态用同一事务，避免中间态非法。
- 步骤明确初态、每一步的变化和终态；说明、线、节点和数据应读同一状态。跳回／重置后应可重复，不靠纯视觉动画伪造知识过程。
- 用description写清模型假设、单位和限制；静态说明也要可读。正文在图前给操作任务，图后解释观察结果。

## 验证与交付

在实际主题的`packages/knowledge-engine`目录运行（路径替换为实际文件）：

```sh
npm run validate -- /absolute/path/to/article/diagrams
```

校验会检查Schema、引用、初值和可重放步骤，但不会证明文章事实。先为本图写少量具体的“操作→预期”，再逐项验证，例如最小值／默认值／最大值、一个非法输入、选择或切换步骤、重置；选与场景有关的项目，不套空泛清单。

只改文章和配置时，资源已存在且引擎源码未变，不必反复npm ci或重建引擎。资源缺失或源码变化时按[开发说明](DEVELOPMENT.md)构建，避免在Hugo监听期间并发替换资源。构建实际宿主后，可对产物补充扫描：

```sh
npm run validate:html -- /absolute/path/to/generated/site
```

最后打开真实文章操作，检查桌面、窄屏、明暗主题、正文宽度和多实例。报告PASS／FAIL／BLOCKED及具体证据；只完成Schema时只能说“配置校验通过”，不能说“交互已验收”。手机模拟与真机明确区分。预览失败时先查服务／资源／配置，不把静态说明当成正常交互完成。

交付正文与配置路径、预览地址、验证过的输入输出、未验证事项。写作授权不自动包含提交、推送或部署。生成参数实验不需要调用任何云端AI接口。

## 能力缺口怎么处理

普通布局、选择、数值绑定、有限步骤：优先配置组合。任意排序／调度／网络协议模拟、未知计算算子或新渲染器：先标明缺口，再根据任务范围扩展公共计算模块／组件并补测试；不要把JS、远程模块或原始HTML藏进YAML。计算模块必须纯函数且输入输出不可变，详见DEVELOPMENT。

长期目标中的十个跨领域生成任务尚不等于已全部完成。本指南帮助Agent使用现有能力，不宣称任何自然语言要求都能自动正确实现。
