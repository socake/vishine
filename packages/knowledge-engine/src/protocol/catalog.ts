const str = { type: "string" },
  num = { type: "number" },
  bool = { type: "boolean" },
  arr = { type: "array" },
  obj = { type: "object" };
const choice = (...values: string[]) => ({ enum: values });
export const components: Record<
  string,
  {
    props: Record<string, object>;
    children?: boolean;
    events?: string[];
    description: string;
    required?: string[];
  }
> = {
  Workbench: {
    props: { side: choice("start", "end") },
    children: true,
    description: "图形与解释同屏的双栏讲解区；小屏上下排列",
  },
  DataBlocks: {
    props: { items: arr },
    description: "显示分块值、来源与完成状态",
  },
  ControlPanel: {
    props: { label: str, gap: num },
    children: true,
    description: "轻底色操作区，组合输入、动作与就地反馈，与结果呈现分区",
  },
  Container: { props: { gap: num }, children: true, description: "垂直容器" },
  Row: { props: { gap: num }, children: true, description: "可换行横向布局" },
  Column: { props: { gap: num }, children: true, description: "垂直布局" },
  Grid: {
    props: { columns: num, gap: num },
    children: true,
    description: "响应式网格",
  },
  Card: { props: { title: str }, children: true, description: "内容面板" },
  Tabs: {
    props: { labels: arr },
    children: true,
    description: "键盘可操作的标签页",
  },
  Text: { props: { text: str }, description: "安全纯文本" },
  Heading: { props: { text: str }, description: "组件内标题" },
  RichText: {
    props: { tokens: arr, selected: str },
    events: ["select"],
    description: "作者标注的可选词元",
  },
  Markdown: {
    props: { text: str },
    description: "受限段落、粗体和行内代码；不支持原始HTML",
  },
  CodeBlock: {
    props: { code: str, language: str, highlight: num },
    events: ["select"],
    description: "代码行号与可选行高亮",
  },
  Callout: { props: { text: str }, description: "说明" },
  Badge: { props: { text: str }, description: "状态标签" },
  Table: {
    props: { columns: arr, rows: { type: "array", items: arr } },
    description: "可横向滚动的数据表",
  },
  Formula: { props: { latex: str }, description: "按需加载KaTeX" },
  Button: {
    props: {
      label: str,
      disabled: bool,
      primary: bool,
      variant: choice("primary", "secondary", "ghost"),
      size: choice("small", "regular"),
      busy: bool,
    },
    events: ["click"],
    description: "派发声明式动作",
  },
  Slider: {
    props: { label: str, value: num, min: num, max: num, step: num },
    events: ["change"],
    description: "范围输入",
  },
  NumberInput: {
    props: { label: str, value: num, min: num, max: num, step: num },
    events: ["change"],
    description: "数值输入",
  },
  Select: {
    props: { label: str, value: str, options: arr },
    events: ["change"],
    description: "枚举输入",
  },
  Toggle: {
    props: { label: str, value: bool },
    events: ["change"],
    description: "布尔输入",
  },
  Graph: {
    props: {
      nodes: arr,
      edges: arr,
      layout: choice("grid", "ring", "flow", "positioned"),
      selected: str,
      active: arr,
    },
    events: ["select"],
    description: "节点分组、选择及有向关系",
  },
  Node: {
    props: {
      label: str,
      detail: str,
      disabled: bool,
      status: choice("idle", "running", "complete", "error"),
      x: { type: "number", minimum: 0, maximum: 1 },
      y: { type: "number", minimum: 0, maximum: 1 },
    },
    events: ["select"],
    description: "可选知识节点",
  },
  Edge: {
    props: { from: str, to: str, label: str, active: bool },
    description: "Graph子节点的有向关系",
  },
  Group: { props: { label: str }, children: true, description: "语义分组" },
  Chart: {
    props: {
      kind: choice("line", "bar", "scatter"),
      points: arr,
      label: str,
      xDomain: arr,
      yDomain: arr,
    },
    events: ["select"],
    description: "按需加载ECharts",
  },
  Inspector: { props: { text: str, title: str }, description: "选中内容详情" },
  ExplanationPanel: {
    props: { text: str, title: str },
    description: "解释内容",
  },
  Stepper: { props: {}, description: "步骤跳转" },
  PlaybackControl: {
    props: {},
    description: "上一步、下一步、播放、暂停、速度",
  },
  Legend: { props: { items: arr }, description: "文字图例" },
};
for (const type of ["Slider", "NumberInput", "Select", "Toggle"]) {
  components[type].props.disabled = bool;
  components[type].required = ["label", "value"];
  components[type].props.label = { type: "string", minLength: 1 };
}
components.Button.required = ["label"];
components.Button.props.label = { type: "string", minLength: 1 };
// Structured payloads are closed; ordinary data remains JSON, never executable markup.
const closed = (properties: Record<string, object>, required: string[]) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
components.DataBlocks.props.items = {
  type: "array",
  items: closed({ label: str, value: num, detail: str, complete: bool }, [
    "label",
    "value",
    "detail",
    "complete",
  ]),
};
components.Chart.props.xDomain = {
  type: "array",
  items: num,
  minItems: 2,
  maxItems: 2,
};
components.Chart.props.yDomain = {
  type: "array",
  items: num,
  minItems: 2,
  maxItems: 2,
};
components.Graph.props.nodes = {
  type: "array",
  items: closed(
    {
      id: str,
      label: str,
      group: str,
      detail: str,
      disabled: bool,
      status: choice("idle", "running", "complete", "error"),
      x: { type: "number", minimum: 0, maximum: 1 },
      y: { type: "number", minimum: 0, maximum: 1 },
    },
    ["id", "label"],
  ),
};
components.Graph.props.edges = {
  type: "array",
  items: closed({ from: str, to: str, label: str, active: bool }, [
    "from",
    "to",
  ]),
};
components.Graph.props.active = { type: "array", items: str };
components.RichText.props.tokens = {
  type: "array",
  items: closed({ id: str, text: str, label: str }, ["id", "text"]),
};
components.Select.props.options = { type: "array", items: str };
components.Tabs.props.labels = { type: "array", items: str };
components.Legend.props.items = { type: "array", items: str };
components.Chart.props.points = {
  type: "array",
  items: { type: "array", items: num, minItems: 2, maxItems: 2 },
};
export const actions = [
  "set",
  "toggle",
  "reset",
  "next",
  "previous",
  "play",
  "pause",
  "goto",
];
export const operators = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "eq",
  "gt",
  "lt",
  "and",
  "or",
  "not",
  "if",
  "concat",
  "get",
  "at",
  "length",
  "round",
  "gpu",
  "gpuInfo",
  "gpuGroup",
  "ring",
  "ringInfo",
  "ringBlocks",
  "quadratic",
];
export const bindingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["bind"],
  properties: { bind: { $ref: "#/$defs/expression" } },
};
export const propsSchemas = Object.fromEntries(
  Object.entries(components).map(([type, c]) => [
    type,
    {
      type: "object",
      additionalProperties: false,
      required: c.required || [],
      properties: Object.fromEntries(
        Object.entries(c.props).map(([k, v]) => [
          k,
          { anyOf: [v, bindingSchema] },
        ]),
      ),
    },
  ]),
);
