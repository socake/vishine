# 已注册组件（experimental v0.1）

本清单由 catalog.ts 生成。注册表示可实例化，不代表完整无障碍与所有组合均已验收。具体结果见 ACCEPTANCE.md。所有属性可使用绑定；缺省值由实现提供，推荐作者显式填写内容和控件范围。

## Workbench

图形与解释同屏的双栏讲解区；小屏上下排列。允许子组件。

属性：side。事件：无。

## DataBlocks

显示分块值、来源与完成状态。

属性：items。事件：无。

## ControlPanel

轻底色操作区，组合输入、动作与就地反馈，与结果呈现分区。允许子组件。

属性：label、gap。事件：无。

## Container

垂直容器。允许子组件。

属性：gap。事件：无。

## Row

可换行横向布局。允许子组件。

属性：gap。事件：无。

## Column

垂直布局。允许子组件。

属性：gap。事件：无。

## Grid

响应式网格。允许子组件。

属性：columns、gap。事件：无。

## Card

内容面板。允许子组件。

属性：title。事件：无。

## Tabs

键盘可操作的标签页。允许子组件。

属性：labels。事件：无。

## Text

安全纯文本。

属性：text。事件：无。

## Heading

组件内标题。

属性：text。事件：无。

## RichText

作者标注的可选词元。

属性：tokens、selected。事件：select。

## Markdown

受限段落、粗体和行内代码；不支持原始HTML。

属性：text。事件：无。

## CodeBlock

代码行号与可选行高亮。

属性：code、language、highlight。事件：select。

## Callout

说明。

属性：text。事件：无。

## Badge

状态标签。

属性：text。事件：无。

## Table

可横向滚动的数据表。

属性：columns、rows。事件：无。

## Formula

按需加载KaTeX。

属性：latex。事件：无。

## Button

派发声明式动作。

属性：label、disabled、primary、variant、size、busy。事件：click。

## Slider

范围输入。

属性：label、value、min、max、step、disabled。事件：change。

## NumberInput

数值输入。

属性：label、value、min、max、step、disabled。事件：change。

## Select

枚举输入。

属性：label、value、options、disabled。事件：change。

## Toggle

布尔输入。

属性：label、value、disabled。事件：change。

## Graph

节点分组、选择及有向关系。

属性：nodes、edges、layout、selected、active。事件：select。

## Node

可选知识节点。

属性：label、detail、disabled、status、x、y。事件：select。

## Edge

Graph子节点的有向关系。

属性：from、to、label、active。事件：无。

## Group

语义分组。允许子组件。

属性：label。事件：无。

## Chart

按需加载ECharts。

属性：kind、points、label、xDomain、yDomain。事件：select。

## Inspector

选中内容详情。

属性：text、title。事件：无。

## ExplanationPanel

解释内容。

属性：text、title。事件：无。

## Stepper

步骤跳转。

属性：无。事件：无。

## PlaybackControl

上一步、下一步、播放、暂停、速度。

属性：无。事件：无。

## Legend

文字图例。

属性：items。事件：无。
