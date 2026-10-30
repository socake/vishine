import { writeFile, mkdir } from "node:fs/promises";
import { stringify } from "yaml";
const ref = (s: string) => ({ ref: s }),
  op = (name: string, ...args: unknown[]) => ({ op: name, args }),
  bind = (x: unknown) => ({ bind: x }),
  get = (source: string, key: string) => bind(op("get", ref(source), key));
const set = (target: string, value: unknown) => ({
  action: "set",
  target,
  value,
});
const num = (initial: number, min: number, max: number) => ({
    type: "number",
    initial,
    min,
    max,
  }),
  str = (initial: string) => ({ type: "string", initial });
const scene = (
  id: string,
  type: string,
  props: object = {},
  children?: unknown[],
  on?: object,
) => ({
  id,
  type,
  props,
  ...(children ? { children } : {}),
  ...(on ? { on } : {}),
});
const field = (
  id: string,
  label: string,
  min: number,
  max: number,
  type = "NumberInput",
) =>
  scene(
    id,
    type,
    { label, value: bind(ref("state." + id)), min, max, step: 1 },
    undefined,
    { change: [set(id, ref("event.value"))] },
  );
const graph = (model: string, layout = "flow") =>
  scene(
    "diagram",
    "Graph",
    {
      nodes: get("derived." + model, "nodes"),
      edges: get("derived." + model, "edges"),
      layout,
      selected: bind(ref("state.selected")),
    },
    undefined,
    { select: [set("selected", ref("event.value"))] },
  );
const wrap = (children: unknown[]) => scene("root", "Container", {}, children);
const base = (
  id: string,
  title: string,
  description: string,
  state: object,
  derived: object,
  children: unknown[],
  data: object = {},
) => ({
  schemaVersion: 1,
  id,
  title,
  description,
  state,
  derived,
  data,
  scene: wrap(children),
});
const examples: Record<string, unknown> = {};
examples.gpu = base(
  "gpu-parallel",
  "128 GPU · 并行策略实验室",
  "选择 GPU，检查逻辑 Rank、模型分片与通信组。修改参数时，物理 GPU 总数必须等于并行度乘积。",
  {
    nodes: num(16, 1, 64),
    gpus: num(8, 1, 16),
    dp: num(16, 1, 512),
    tp: num(8, 1, 512),
    pp: num(1, 1, 512),
    cp: num(1, 1, 512),
    selected: str("19"),
  },
  {
    model: op(
      "gpu",
      ...["nodes", "gpus", "dp", "tp", "pp", "cp"].map((k) =>
        ref("state." + k),
      ),
    ),
    info: op("gpuInfo", ref("derived.model"), ref("state.selected")),
  },
  [
    scene("parameters", "Row", {}, [
      field("nodes", "节点数", 1, 64),
      field("gpus", "GPU / Node", 1, 16),
      field("dp", "DP", 1, 512),
      field("tp", "TP", 1, 512),
      field("pp", "PP", 1, 512),
      field("cp", "CP", 1, 512),
    ]),
    scene("equation", "Callout", { text: get("derived.model", "summary") }),
    graph("model", "grid"),
    scene("details", "Inspector", {
      title: "Rank 与通信组",
      text: bind(ref("derived.info")),
    }),
  ],
);
const ring = base(
  "ring-allreduce",
  "Ring AllReduce · 数据如何汇合",
  "四个 Rank，每个输入分成四块。示例中 Rank r 的每块值为 r+1；最终每块应为10。",
  { selected: str("0") },
  {
    model: op("ring", 4, 2, ref("step")),
    info: op("ringInfo", ref("derived.model"), ref("state.selected")),
  },
  [
    scene("transport", "PlaybackControl"),
    scene("phase", "Badge", { text: get("derived.model", "phase") }),
    graph("model", "ring"),
    scene("summary", "Text", { text: get("derived.model", "summary") }),
    scene("chunks", "Inspector", {
      title: "数据块的贡献来源",
      text: bind(ref("derived.info")),
    }),
  ],
);
examples.ring = {
  ...ring,
  steps: Array.from({ length: 7 }, (_, i) => ({
    id: "s" + i,
    title: i === 0 ? "初态" : i <= 3 ? "归约分发 " + i : "全量收集 " + (i - 3),
    description:
      i === 0
        ? "每个 Rank 拥有自己的四个数据块。"
        : i <= 3
          ? "所有 Rank 同时发送一个分块，接收方与本地分块相加。"
          : "转发已经完成归约的数据块，最终每个 Rank 都拥有完整结果。",
    actions: [],
  })),
};
function sequence(
  id: string,
  title: string,
  description: string,
  nodes: object[],
  frames: {
    title: string;
    description: string;
    edges: object[];
    active: string[];
  }[],
) {
  const b = base(
    id,
    title,
    description,
    { selected: str(""), frame: num(0, 0, frames.length - 1) },
    {
      current: op("at", ref("data.frames"), ref("state.frame")),
      model: op("get", ref("derived.current"), "model"),
    },
    [
      scene("transport", "PlaybackControl"),
      scene("steps", "Stepper"),
      scene(
        "diagram",
        "Graph",
        {
          nodes: bind(ref("data.nodes")),
          edges: get("derived.model", "edges"),
          active: get("derived.model", "active"),
          selected: bind(ref("state.selected")),
          layout: "flow",
        },
        undefined,
        { select: [set("selected", ref("event.value"))] },
      ),
      scene("selected", "Inspector", {
        title: "已选择对象",
        text: bind(ref("state.selected")),
      }),
    ],
    {
      nodes,
      frames: frames.map((f) => ({
        model: { edges: f.edges, active: f.active },
      })),
    },
  );
  return {
    ...b,
    steps: frames.map((f, i) => ({
      id: "s" + i,
      title: f.title,
      description: f.description,
      actions: [set("frame", i)],
    })),
  };
}
examples.tcp = sequence(
  "tcp-handshake",
  "TCP · 三次握手",
  "教学序列展示客户端与服务端的连接建立，不模拟丢包、重传与全部TCP状态。",
  [
    { id: "client", label: "客户端", detail: "主动打开" },
    { id: "network", label: "网络", detail: "消息传输" },
    { id: "server", label: "服务端", detail: "监听连接" },
  ],
  [
    {
      title: "准备",
      description: "服务端处于 LISTEN，客户端准备发起连接。",
      edges: [],
      active: ["server"],
    },
    {
      title: "SYN",
      description:
        "客户端发送 SYN，进入 SYN-SENT；服务端收到后进入 SYN-RECEIVED。",
      edges: [{ from: "client", to: "server", label: "SYN · seq=x" }],
      active: ["client", "server"],
    },
    {
      title: "SYN + ACK",
      description: "服务端确认客户端序列号，同时发送自己的初始序列号。",
      edges: [{ from: "server", to: "client", label: "SYN+ACK · ack=x+1" }],
      active: ["server", "client"],
    },
    {
      title: "ACK",
      description:
        "客户端发送 ACK，进入 ESTABLISHED；服务端收到确认后也进入 ESTABLISHED。",
      edges: [{ from: "client", to: "server", label: "ACK · ack=y+1" }],
      active: ["client", "server"],
    },
  ],
);
examples.kubernetes = sequence(
  "pod-scheduling",
  "Kubernetes · 一个 Pod 如何找到节点",
  "调度器选择节点；kubelet 在被选节点启动容器。图中的关系表示控制流程。",
  [
    { id: "api", label: "API Server", detail: "控制平面" },
    { id: "scheduler", label: "Scheduler", detail: "控制平面" },
    { id: "node-a", label: "Node A", detail: "kubelet" },
    { id: "node-b", label: "Node B", detail: "kubelet" },
    { id: "pod", label: "Pod", detail: "待调度工作负载" },
  ],
  [
    {
      title: "提交",
      description: "客户端向 API Server 提交 Pod，对象尚未绑定节点。",
      edges: [{ from: "pod", to: "api", label: "创建对象" }],
      active: ["pod", "api"],
    },
    {
      title: "筛选与评分",
      description: "调度器观察未调度 Pod，根据资源与约束筛选、评分候选节点。",
      edges: [
        { from: "api", to: "scheduler", label: "观察对象" },
        { from: "scheduler", to: "node-a", label: "候选" },
        { from: "scheduler", to: "node-b", label: "候选" },
      ],
      active: ["scheduler", "node-a", "node-b"],
    },
    {
      title: "绑定",
      description:
        "调度器通过 API Server 记录 Pod 与 Node B 的绑定。调度器不直接启动容器。",
      edges: [
        { from: "scheduler", to: "api", label: "绑定 Node B" },
        { from: "api", to: "node-b", label: "已绑定Pod" },
      ],
      active: ["api", "node-b"],
    },
    {
      title: "启动",
      description:
        "Node B 的 kubelet 观察到分配结果，协调运行时和网络组件启动 Pod，并回报状态。业务流量不经过 API Server。",
      edges: [
        { from: "node-b", to: "pod", label: "运行容器" },
        { from: "node-b", to: "api", label: "报告状态" },
      ],
      active: ["node-b", "pod"],
    },
  ],
);
examples.math = base(
  "quadratic-lab",
  "二次函数 · 参数怎样改变曲线",
  "拖动参数，公式与曲线共同变化。a=0 时函数退化为一次函数或常数函数。",
  { a: num(1, -5, 5), b: num(0, -10, 10), c: num(0, -10, 10) },
  {
    points: op("quadratic", ref("state.a"), ref("state.b"), ref("state.c")),
    formula: op(
      "concat",
      "f(x)=",
      ref("state.a"),
      "x^2 + (",
      ref("state.b"),
      ")x + (",
      ref("state.c"),
      ")",
    ),
    explanation: op(
      "if",
      op("eq", ref("state.a"), 0),
      "a=0：此时不是二次函数。",
      op(
        "if",
        op("gt", ref("state.a"), 0),
        "a>0：抛物线开口向上。",
        "a<0：抛物线开口向下。",
      ),
    ),
  },
  [
    scene("parameters", "Row", {}, [
      field("a", "a", -5, 5, "Slider"),
      field("b", "b", -10, 10, "Slider"),
      field("c", "c", -10, 10, "Slider"),
    ]),
    scene("formula", "Formula", { latex: bind(ref("derived.formula")) }),
    scene("plot", "Chart", {
      kind: "line",
      points: bind(ref("derived.points")),
      label: "f(x)",
    }),
    scene("explain", "ExplanationPanel", {
      title: "参数说明",
      text: bind(ref("derived.explanation")),
    }),
  ],
);
examples.english = base(
  "english-analysis",
  "英语 · 句子成分探索",
  "点击词语查看作者提供的成分说明。本例展示标注，不执行自动语法分析。",
  { selected: str("subject") },
  { explanation: op("get", ref("data.explanations"), ref("state.selected")) },
  [
    scene(
      "sentence",
      "RichText",
      {
        selected: bind(ref("state.selected")),
        tokens: bind(ref("data.tokens")),
      },
      undefined,
      { select: [set("selected", ref("event.value"))] },
    ),
    scene("explain", "ExplanationPanel", {
      title: "句子成分",
      text: bind(ref("derived.explanation")),
    }),
  ],
  {
    tokens: [
      { id: "subject", text: "The curious student", label: "主语" },
      { id: "verb", text: "reads", label: "谓语" },
      { id: "object", text: "a book", label: "宾语" },
      { id: "adverb", text: "every evening.", label: "时间状语" },
    ],
    explanations: {
      subject:
        "The curious student 是名词短语，充当主语。curious 修饰 student。",
      verb: "reads 是一般现在时，主语为第三人称单数，因此使用 -s 形式。",
      object: "a book 是名词短语，充当 reads 的宾语。",
      adverb: "every evening 表示习惯性动作发生的时间。",
    },
  },
);
const gpuDoc = examples.gpu as any;
gpuDoc.state.dimension = {
  type: "string",
  initial: "TP",
  options: ["DP", "TP", "PP", "CP"],
};
gpuDoc.derived.active = op(
  "gpuGroup",
  ref("derived.model"),
  ref("state.selected"),
  ref("state.dimension"),
);
gpuDoc.scene.children.find((n: any) => n.id === "diagram").props.active = bind(
  ref("derived.active"),
);
gpuDoc.scene.children.splice(
  2,
  0,
  scene(
    "dimension",
    "Select",
    {
      label: "高亮所选 Rank 的通信组",
      value: bind(ref("state.dimension")),
      options: ["DP", "TP", "PP", "CP"],
    },
    undefined,
    { change: [set("dimension", ref("event.value"))] },
  ),
);
// Stage coupled GPU parameters using the same generic state/actions protocol.
const gpu = examples.gpu as {
  state: Record<string, unknown>;
  scene: { children: any[] };
};
const keys = ["nodes", "gpus", "dp", "tp", "pp", "cp"];
for (const key of keys)
  gpu.state["draft_" + key] = structuredClone(gpu.state[key]);
gpu.scene.children[0].children.forEach((control: any) => {
  const key = control.id;
  control.props.value = bind(ref("state.draft_" + key));
  control.on.change = [set("draft_" + key, ref("event.value"))];
});
gpu.scene.children.splice(
  1,
  0,
  scene("apply", "Button", { label: "应用并行参数" }, undefined, {
    click: keys.map((key) => set(key, ref("state.draft_" + key))),
  }),
);
// Keep the visualization and its consequences together using a reusable layout.
const child = (doc: any, id: string) =>
  doc.scene.children.find((node: any) => node.id === id);
const unchanged = keys
  .map((key) => op("eq", ref("state." + key), ref("state.draft_" + key)))
  .reduce((a, b) => op("and", a, b));
child(gpuDoc, "apply").props = {
  label: bind(op("if", unchanged, "参数已应用", "应用并行参数")),
  disabled: bind(unchanged),
  primary: true,
};
const gpuAside = scene("gpu-inspection", "Column", {}, [
  child(gpuDoc, "dimension"),
  child(gpuDoc, "details"),
  scene("group-help", "Text", {
    text: "填色表示同一通信组，双线框标记当前 GPU。切换 DP / TP / PP / CP 可对比成员。",
  }),
]);
gpuDoc.scene.children = [
  child(gpuDoc, "parameters"),
  scene("apply-row", "Row", {}, [
    child(gpuDoc, "apply"),
    scene("draft-status", "Text", {
      text: bind(
        op(
          "if",
          unchanged,
          "当前布局与参数一致。",
          "参数尚未应用；图中仍显示上一次有效布局。",
        ),
      ),
    }),
  ]),
  child(gpuDoc, "equation"),
  scene("gpu-workbench", "Workbench", {}, [child(gpuDoc, "diagram"), gpuAside]),
];
const ringDoc = examples.ring as any;
ringDoc.derived.blocks = op(
  "ringBlocks",
  ref("derived.model"),
  ref("state.selected"),
);
ringDoc.scene.children = [
  child(ringDoc, "transport"),
  scene("ring-workbench", "Workbench", {}, [
    scene("ring-visual", "Column", {}, [
      child(ringDoc, "phase"),
      child(ringDoc, "diagram"),
      child(ringDoc, "summary"),
    ]),
    scene("ring-inspection", "Column", {}, [
      scene("rank-label", "Heading", {
        text: bind(op("concat", "Rank ", ref("state.selected"), " · 当前分块")),
      }),
      scene("block-view", "DataBlocks", { items: bind(ref("derived.blocks")) }),
      child(ringDoc, "chunks"),
    ]),
  ]),
];
const descriptions: Record<string, Record<string, string>> = {
  tcp: {
    client:
      "客户端主动发起连接。先发送 SYN，收到 SYN+ACK 后发送 ACK；此时客户端进入 ESTABLISHED。",
    network:
      "网络负责承载报文。图中箭头表示端到端通信方向；本教学序列省略实际路由器以及丢包、重传。",
    server:
      "服务端先监听连接，收到 SYN 后回复 SYN+ACK；收到最后的 ACK 后连接建立。",
  },
  kubernetes: {
    api: "API Server 接收并校验 Pod 对象，提供控制平面的读写接口。它不转发 Pod 的业务流量。",
    scheduler:
      "调度器观察尚未绑定节点的 Pod，筛选、评分候选节点，然后通过 API 写入绑定结果；它不直接启动容器。",
    "node-a":
      "Node A 是候选工作节点。本例最终选择 Node B，因此 Node A 不启动该 Pod。",
    "node-b":
      "Node B 的 kubelet 观察到分配给本节点的 Pod 后，协调容器运行时启动工作负载，并向 API Server 报告状态。",
    pod: "Pod 是本例的待调度工作负载。它先被创建为 API 对象，再绑定 Node B，最后由该节点的 kubelet 启动。",
  },
};
for (const id of ["tcp", "kubernetes"]) {
  const doc = examples[id] as any;
  doc.state.selected.initial = doc.data.nodes[0].id;
  doc.data.explanations = descriptions[id];
  doc.derived.explanation = op(
    "get",
    ref("data.explanations"),
    ref("state.selected"),
  );
  child(doc, "selected").props = {
    title: "选中对象 · 职责与边界",
    text: bind(ref("derived.explanation")),
  };
  doc.scene.children = [
    child(doc, "transport"),
    child(doc, "steps"),
    scene(id + "-workbench", "Workbench", {}, [
      child(doc, "diagram"),
      child(doc, "selected"),
    ]),
  ];
}
// Author-controlled semantic placement, shared by any positioned Graph.
const k8s = examples.kubernetes as any;
k8s.data.nodes = k8s.data.nodes.map((n: any) => ({
  ...n,
  ...(
    {
      api: { x: 0, y: 0, group: "控制平面" },
      scheduler: { x: 1, y: 0, group: "控制平面" },
      "node-a": { x: 0, y: 0.5, group: "工作节点" },
      "node-b": { x: 1, y: 0.5, group: "工作节点" },
      pod: { x: 1, y: 1, group: "工作负载" },
    } as any
  )[n.id],
}));
k8s.scene.children[2].children[0].props.layout = "positioned";
const tcp = examples.tcp as any;
tcp.data.nodes = tcp.data.nodes
  .filter((n: any) => n.id !== "network")
  .map((n: any, i: number) => ({ ...n, x: i, y: 0.5 }));
tcp.scene.children[2].children[0].props.layout = "positioned";
const math = examples.math as any;
child(math, "plot").props.xDomain = [-5, 5];
child(math, "plot").props.yDomain = [-30, 30];
math.derived.sample = op(
  "add",
  op(
    "add",
    op("multiply", ref("state.a"), 4),
    op("multiply", ref("state.b"), 2),
  ),
  ref("state.c"),
);
math.scene.children = [
  scene("math-workbench", "Workbench", { side: "start" }, [
    scene("math-controls", "Column", {}, [
      child(math, "formula"),
      child(math, "parameters"),
      scene("presets", "Grid", { columns: 2 }, [
        scene("open-up", "Button", { label: "向上开口" }, undefined, {
          click: [set("a", 1), set("b", 0), set("c", 0)],
        }),
        scene("open-down", "Button", { label: "向下开口" }, undefined, {
          click: [set("a", -1), set("b", 0), set("c", 0)],
        }),
      ]),
      child(math, "explain"),
      scene("sample", "Text", {
        text: bind(op("concat", "代入 x = 2 → f(2) = ", ref("derived.sample"))),
      }),
    ]),
    scene("math-visual", "Column", {}, [
      child(math, "plot"),
      scene("axes-help", "Text", {
        text: "固定坐标范围：x ∈ [−5, 5]，y ∈ [−30, 30]。变化超出范围时曲线会裁切；可在图内缩放探索，点击顶部重置恢复。",
      }),
    ]),
  ]),
];

// Group controls explicitly; the renderer stays independent of lesson domains.
gpuDoc.scene.children.splice(
  0,
  2,
  scene(
    "gpu-controls",
    "ControlPanel",
    { label: "并行参数" },
    gpuDoc.scene.children.slice(0, 2),
  ),
);
gpuAside.children!.splice(
  0,
  1,
  scene(
    "group-controls",
    "ControlPanel",
    { label: "通信组视图" },
    gpuAside.children!.slice(0, 1),
  ),
);
const mathControls = math.scene.children[0].children[0].children;
mathControls.splice(
  1,
  2,
  scene(
    "function-controls",
    "ControlPanel",
    { label: "函数参数" },
    mathControls.slice(1, 3),
  ),
);

// Only author-facing state labels appear in the static explanation.
for (const [key, label] of Object.entries({
  nodes: "计算节点数",
  gpus: "每节点 GPU 数",
  dp: "DP · 数据并行",
  tp: "TP · 张量并行",
  pp: "PP · 流水线并行",
  cp: "CP · 上下文并行",
}))
  gpuDoc.state[key].label = label;
for (const [key, label] of Object.entries({
  a: "二次项系数 a",
  b: "一次项系数 b",
  c: "常数项 c",
}))
  math.state[key].label = label;

await mkdir("../../assets/knowledge-examples", { recursive: true });
for (const [id, doc] of Object.entries(examples)) {
  const source = stringify(doc, { aliasDuplicateObjects: false });
  await writeFile(`examples/${id}.yaml`, source);
  await writeFile(`../../assets/knowledge-examples/${id}.yaml`, source);
}
