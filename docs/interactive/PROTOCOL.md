# 协议 v1

引擎版本为 0.1.0，配置必须声明 schemaVersion: 1；未知版本拒绝。引擎补丁版本不改变配置版本。破坏性协议更新需要新 major 与显式迁移工具；首版没有历史版本迁移器。

## 文档

必填：schemaVersion、id、title、description、state、scene。可选：data、derived、steps。正式 JSON Schema：`packages/knowledge-engine/schemas/knowledge-v1.schema.json`，固定 JSON Schema Draft 2020-12。

state 是具名 number/string/boolean 声明，包含 initial，以及适用的 min/max/options。data 是纯 JSON。derived 是具名表达式，依赖图必须无环。scene 是带 id/type/props/children/on/visible 的组件树，字段按组件限制。

限制：序列化配置500KB、嵌套40层、表达式求值30层、512个声明组件、512个GPU/图节点、每实例最多64个状态和64个派生值、512个步骤。数组的渲染属性另限制2048项。超出限制明确报错。

## 绑定与操作符

普通属性为字面量；绑定使用 `{bind: {ref: state.a}}`。引用作用域为 state、data、derived，仅允许一个已声明名称；事件动作可用 `event.value`，步骤可用 `step`。data 内形似表达式的对象仍是普通数据。

表达式是原始值、`{ref: ...}` 或 `{op: multiply, args: [...]}`。运算符清单以机器注册表为准。首版包括算术、比较、布尔、条件、字符串拼接、受限 get/at、length 和 round。if 当前使用普通函数参数求值，因此两个分支都会计算；不要用它遮蔽除零等非法计算。

get 仅可读取已有自有属性，禁止原型相关字段；at 只接受合法整数索引。NaN、Infinity、非法引用、除零等是配置错误。GPU/Ring/函数采样属于显式注册的可信扩展；配置不能添加代码或加载插件 URL。

## 事件事务

Button 的 click、输入的 change、节点／词元／代码的 select 按注册表派发。event.value 仅提供经控件规范化的值／ID，不暴露 DOM Event。支持 set、toggle；同一事件可写多个不同状态，所有右值读取事件前快照，校验完成后一次提交。同一事务重复写同一状态拒绝。失败保留上次有效结果并显示错误；未应用的新参数不冒充已应用图形。

reset、next、previous、goto、play、pause 属于控制动作，必须单独派发。派生计算和渲染不会反过来触发动作，从而避免事件递归。v0.1 没有配置级局部 store、undo/redo、URL 同步或持久化；Tabs/Graph 折叠等呈现状态在各组件本地维护。

## 步骤与播放

steps 为有序有限列表，每项含稳定 id、title、description、actions。步骤动作仅允许 set/toggle，不读取事件。初次加载应用步骤0；上一／下一／跳转从当前回放基线重放至目标步骤，得到确定结果（规则见文末）。reset 恢复配置初态并重新应用步骤0。

普通输入更新会暂停播放；非步骤控制的输入成为新的回放基线。多个相互约束的参数仍建议用暂存／应用状态原子提交。自动播放默认关闭，到末步停止；速度支持0.5/1/2/4倍。离开视口或切换后台暂停；减少动画偏好停用连线流动，单步仍可操作。

## 安全与失败

JSON Schema检查结构，语义阶段检查ID、引用、循环、类型与绑定结果。文本使用 React 文本节点；Markdown为受限段落/粗体/行内代码，不接受原始HTML。首版不提供任意SVG、CSS、网络请求、函数回调或远端模块配置。

公式采用 KaTeX trust=false、maxExpand=100、maxSize=10。图表不接受任意 ECharts option/formatter，只接收声明的图表类型、标签与点数组。Schema 在开发构建时编译，浏览器不调用 Ajv.compile，不使用 eval/new Function。

开发校验输出配置路径和字段路径；浏览器加载失败只提供友好说明，不暴露文件系统路径。单个实例失败保留静态内容，不破坏文章或其他实例。

## 交互反馈修订（2026-10-29）

当前跳步使用**回放基线**：被任一步骤写入的状态归步骤控制；其余状态的有效交互更新会写入回放基线。因此选中的对象和非步骤参数能够在前后跳步、重新播放时保留。set/toggle 仍原子提交，非法输入不改基线。select 事件不暂停播放；change/click 的状态修改暂停播放；未绑定动作的事件不改变播放。修改步骤本身控制的状态将在下一次跳步时由步骤重算。

reset 同时恢复配置初态、步骤0、1倍速、初始选择，以及 Tabs、Graph 折叠／缩放和图表视图。它只重新挂载场景，保留顶栏重置按钮的焦点。

Workbench 接受两个子组件，默认左侧主视图、右侧说明（side=end）；side=start 为左侧控制、右侧图形。650px 以下容器上下排列，不依赖全局视口。DataBlocks 使用 items 的 label/value/detail/complete 显示当前值、来源与是否完成；它不负责计算归约，计算来自显式注册的 ringBlocks 扩展。

Button 可用 disabled 绑定禁用状态，primary 标记主要操作。NumberInput 允许暂时清空；只有范围内的有限数值才触发 change，离开非法输入时显示就地错误，Esc 恢复最近有效值。GPU 的六项参数另外通过暂存状态和应用按钮原子提交。

Chart 可显式提供 xDomain/yDomain 两个端点，省略时按数据自适应。更新数据不会销毁 ECharts 实例，保留图内缩放；全局重置恢复初始视图。二次函数示例采用固定坐标范围，明确提示超出范围的曲线裁切。

Graph 内嵌 Node 的 select 动作与父 Graph 的 select 动作合并为同一个事务，均读取点击前的状态。两者写入同一状态会按重复写入规则拒绝；请将选择状态放父层，将节点专属说明或效果放子层。

Ring布局根据实际容器宽度计算节点位置，默认与重置显示完整拓扑。放大后可横向滚动，“适应宽度”恢复全图。首版示例的四Rank布局已在320/375px检查完整可见和至少44px的节点高度；不承诺任意大环布局的标签均不重叠。

## 控件与图形初态（2026-10-29）

Select 仍使用原生 HTML select，保持键盘和平台菜单行为；外层统一留白与 SVG 箭头，箭头距右侧14px，文本右侧留40px。播放、工具、步骤和缩放控件具有不同视觉层级，不更改事件协议。

Graph 新增 `layout: positioned`。nodes 或子 Node 的 `x/y` 可选，取0–1，默认0.5。横向坐标随容器宽度展开，纵向按相对位置排列并裁去未使用的上下区域；节点仍保持可读尺寸。group 显示语义分层底板，作者应把同组节点放在同一层，避免组区间相交。它是受限的作者布局，不是自动避障引擎。普通 flow 和 ring 仍保持原接口。

Edge 新增 `active: false` 可表现静态拓扑：细实线、不显示方向箭头、不播放传输动画；缺省 true 延续现有有向传输线。Ring 初态用静态边显示 NVLink/IB-RDMA 拓扑，进入通信步骤后再显示当前传输分块。GPU 分组区域首次挂载及重置时滚到默认选中的节点组，不滚动整篇文章。

## 文字说明的公开参数

state 声明可选 `label`（1–100字符），用于文字说明中的作者可读名称；只有显式带label的初值会被Hugo输出。未标注的选择状态、暂存参数和其他内部状态不展示。参数覆盖后输出覆盖后的initial；该区域标明“初始配置”，不冒充交互后的当前值。label仅为展示元数据，不影响状态计算。正常挂载后文字说明仍折叠，读者可主动展开；无JavaScript时保持可读。

## 公共控件与图形状态

Button 可配置 `variant: primary|secondary|ghost`（默认secondary）、`size: regular|small`（默认regular）、`busy`。旧 `primary: true` 继续支持；显式variant优先。busy提供可访问忙碌状态并禁用重复触发，它由配置状态驱动，不代表引擎自动执行了后台任务。Select、Slider、Toggle、NumberInput支持disabled，使用原生控件的禁用语义。

Node及Graph.nodes支持`disabled`与`status: idle|running|complete|error`。禁用节点不派发选择，SVG节点从Tab顺序移除。选中用双线边框，高亮用底色；悬停／焦点只强调相关连线，不修改讲解状态。运行与异常还提供文字／线型提示，不单靠颜色。

Graph工具栏新增定位选中对象，只调整图内滚动位置，不滚动文章。空图显示可读状态。节点标签最多两行，超长内容保留在完整的SVG title及可访问名称中。图内最大高度520px，长拓扑使用局部滚动。

flow布局按有向依赖分层；有环部分使用稳定输入顺序排列。positioned和ring中出现重叠时，后续节点向下避让。布局与连线计算缓存按拓扑和尺寸更新，单纯选择／悬停不重新计算路径。

连线使用节点边界端口与有限候选正交通道避让节点。标签避免覆盖节点、其他标签或连接路径；无合适位置时放到可展开的“连线说明”，并保留路径title。无法找到避障路径时显示提示，仍可查看节点与连接。该实现不是任意复杂图的全局最优布线器；不保证消除所有交叉或双向共线，也不支持自由拖拽。

网格节点的左右方向键仅在同组可用按钮间循环；禁用项不参与索引。Enter/Space使用原生按钮选择，方向键只移动焦点。


## 阅读密度与控件层级

引擎外壳沿用主题配色，标题16px、正文14px、辅助说明12–13px。桌面常规控件最小36px、小号32px；粗指针设备提升至44px，窄容器的播放与缩放操作也保留44px。主操作采用主题正文色实底；赤陶强调色保留给选中、高亮及焦点。缩放工具不再额外套底板；播放工具使用下文约定的轻底色操作带，置于ControlPanel内时不重复叠底。图形图例位于图下，详情和数据块以排版与细分隔线组织。

顶栏重置与全屏使用具备aria-label和title的图标按钮；窄屏前后步使用箭头按钮并保留可访问名称。标题说明占独立整行，避免工具区挤压文字。正常挂载后备用说明仅显示“文字说明”入口；无脚本时完整标题仍在。

## 操作区与呈现区

`ControlPanel` 是可组合的操作容器，支持任意子组件；`label` 为可访问分组名，默认“图解操作”／“Visualization controls”，不额外显示大标题；`gap` 默认12px，限制0–48px。将输入、按钮与就地状态提示放入其中，图形和结果说明作为兄弟组件或Workbench另一栏。容器不新增状态，也不改变事件绑定。轻底色跟随paper/clean/dark，保留原控件尺寸与焦点。嵌套ControlPanel不叠加底板和内边距。

PlaybackControl自动使用同样的操作带底色，不需再包一层；图内缩放保持轻量。示例中的GPU参数／通信组选择、数学滑块／预设和公共组件展示已采用此分区，教学内容与动作保持原义。

```yaml
scene:
  id: lesson
  type: Container
  children:
    - id: controls
      type: ControlPanel
      props: { label: 参数设置 }
      children:
        - id: amount
          type: Slider
          props:
            label: 数量
            value: { bind: { ref: state.count } }
            min: 1
            max: 10
          on:
            change: [{ action: set, target: count, value: { ref: event.value } }]
    - id: result
      type: Text
      props: { text: { bind: { op: concat, args: ["当前数量：", { ref: state.count }] } } }
```

上例为scene片段，完整文档需声明数值state.count及元数据。配置与其他容器一样经Schema校验；未知属性拒绝。

## 手机与触控

粗指针设备的数字输入和Select使用16px文字，按钮至少44px宽；既有44px高度规则保持。Toggle使用原生checkbox与包裹label，整行文字可点，实际分组命中区域至少44px高，视觉勾选框仍小尺寸。

NumberInput在step为整数且min≥0时提供numeric输入提示，其余为decimal；这不额外限制输入只能为整数。enterKeyHint=done，Enter通过失焦校验并提交，非法值显示就地错误；范围内的有效输入仍在编辑时触发change。键盘最终外观由设备决定，不保证所有平台相同。触控时图形／节点列表滚到边界允许纵向滚动接回文章；桌面仍保留原滚动隔离。粗指针设备的全屏内边距取16px与对应safe-area变量的较大值。

ControlPanel中恰好六个NumberInput组成的Row按容器宽度使用6／3／2列，避免中间宽度5+1的不均衡排列；其他Row保持原布局。新增规则不更改状态协议或计算逻辑。
