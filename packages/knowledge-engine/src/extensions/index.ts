import type { Operator, Value } from "../protocol/types";
const n = (v: Value) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1)
    throw Error("需要正整数");
  return v;
};
const record = (v: Value) => v as Record<string, Value>;
export const extensions: Record<string, Operator> = {
  gpu: (nodes, gpus, dp, tp, pp, cp) => {
    const [N, G, D, T, P, C] = [nodes, gpus, dp, tp, pp, cp].map(n);
    if (N * G > 512) throw Error("首版最多展示512张GPU");
    if (N * G !== D * T * P * C)
      throw Error(`并行度乘积 ${D * T * P * C} 与 GPU 总数 ${N * G} 不一致`);
    return {
      nodes: Array.from({ length: N * G }, (_, rank) => ({
        id: String(rank),
        label: `GPU ${rank % G}`,
        group: `Node ${Math.floor(rank / G)}`,
        detail: `Rank ${rank}`,
      })),
      edges: [],
      total: N * G,
      dimensions: [D, T, P, C],
      gpus: G,
      summary: `WORLD_SIZE = ${N} × ${G} = DP ${D} × TP ${T} × PP ${P} × CP ${C} = ${N * G}。Rank顺序：TP → CP → DP → PP。`,
    };
  },
  gpuGroup: (model, selected, dimension) => {
    const m = record(model),
      [D, T, P, C] = m.dimensions as number[];
    const rank = Number(selected),
      axis = ["TP", "CP", "DP", "PP"].indexOf(String(dimension));
    if (
      axis < 0 ||
      !Number.isInteger(rank) ||
      rank < 0 ||
      rank >= Number(m.total)
    )
      return [];
    const coord = (r: number) => [
      r % T,
      Math.floor(r / T) % C,
      Math.floor(r / (T * C)) % D,
      Math.floor(r / (T * C * D)) % P,
    ];
    const q = coord(rank);
    return Array.from({ length: Number(m.total) }, (_, i) => i)
      .filter((i) => coord(i).every((v, j) => j === axis || v === q[j]))
      .map(String);
  },
  gpuInfo: (model, selected) => {
    const m = record(model),
      [D, T, P, C] = m.dimensions as number[],
      r = Number(selected),
      G = m.gpus as number;
    if (!Number.isInteger(r) || r < 0 || r >= Number(m.total))
      return "选择一张 GPU 查看 Rank、模型分片与通信组。";
    const coord = (x: number) => [
      x % T,
      Math.floor(x / T) % C,
      Math.floor(x / (T * C)) % D,
      Math.floor(x / (T * C * D)) % P,
    ];
    const q = coord(r),
      groups = ["TP", "CP", "DP", "PP"].map((name, axis) => {
        const ranks = Array.from(
          { length: Number(m.total) },
          (_, i) => i,
        ).filter((i) => coord(i).every((v, j) => j === axis || v === q[j]));
        return `${name} 组：[${ranks.join(", ")}]`;
      });
    return `Rank ${r} · Node ${Math.floor(r / G)} / GPU ${r % G}\n模型：PP阶段 ${q[3]}，TP分片 ${q[0]}\nCP序列分区 ${q[1]}，DP副本 ${q[2]}\n${groups.join("\n")}\nCP切分序列，组内复制权重；此处DP不包含CP。`;
  },
  ring: (count, gpus, iteration) => {
    const N = n(count),
      G = n(gpus),
      step = Number(iteration);
    if (N > 16 || !Number.isInteger(step) || step < 0)
      throw Error("Ring支持2–16个Rank及非负步骤");
    if (N < 2) throw Error("Ring至少需要2个Rank");
    const rounds = Math.min(step, 2 * (N - 1));
    let chunks: number[][][] = Array.from({ length: N }, (_, rank) =>
      Array.from({ length: N }, () => [rank]),
    );
    const edges: Value[] = [];
    for (let s = 0; s < rounds; s++) {
      const before = structuredClone(chunks);
      for (let sender = 0; sender < N; sender++) {
        const receiver = (sender + 1) % N;
        const reduce = s < N - 1;
        const local = reduce ? s : s - (N - 1);
        const chunk = (sender - local + (reduce ? 0 : 1) + N * 2) % N;
        chunks[receiver][chunk] = reduce
          ? [...new Set([...before[receiver][chunk], ...before[sender][chunk]])]
          : [...before[sender][chunk]];
        if (s === rounds - 1)
          edges.push({
            from: String(sender),
            to: String(receiver),
            label: `块 ${chunk} · ${Math.floor(sender / G) === Math.floor(receiver / G) ? "NVLink" : "IB/RDMA"}`,
          });
      }
    }
    if (rounds === 0)
      for (let sender = 0; sender < N; sender++)
        edges.push({
          from: String(sender),
          to: String((sender + 1) % N),
          active: false,
          label:
            Math.floor(sender / G) === Math.floor(((sender + 1) % N) / G)
              ? "NVLink"
              : "IB/RDMA",
        });
    return {
      nodes: Array.from({ length: N }, (_, rank) => ({
        id: String(rank),
        label: `Rank ${rank}`,
        detail: `Node ${Math.floor(rank / G)}`,
      })),
      edges,
      chunks,
      phase:
        rounds === 0
          ? "初始数据"
          : rounds <= N - 1
            ? "ReduceScatter"
            : "AllGather",
      summary: `第 ${rounds} / ${2 * (N - 1)} 轮。${rounds === 2 * (N - 1) ? "所有 Rank 已得到完整归约结果。" : "每轮所有 Rank 同步发送一个分块。"}节点内 NVLink、节点间 IB/RDMA 是此示例的拓扑假设。`,
    };
  },
  ringBlocks: (model, rank) => {
    const m = record(model),
      chunks = m.chunks as number[][][],
      r = Number(rank);
    if (!Number.isInteger(r) || !chunks[r]) return [];
    return chunks[r].map((sources, i) => ({
      label: `分块 ${i}`,
      value: sources.reduce((s, x) => s + x + 1, 0),
      detail: `来源 Rank ${[...sources].sort((a, b) => a - b).join(" + ")}`,
      complete: sources.length === chunks.length,
    }));
  },
  ringInfo: (model, rank) => {
    const m = record(model),
      r = Number(rank),
      chunks = m.chunks as number[][][];
    if (!Number.isInteger(r) || !chunks[r])
      return "选择 Rank 查看每个数据块已经包含哪些输入。";
    return (
      `Rank ${r}\n` +
      chunks[r]
        .map(
          (sources, i) =>
            `块 ${i}：来自 Rank ${[...sources].sort((a, b) => a - b).join(" + ")}，示例和值 ${sources.reduce((s, x) => s + x + 1, 0)}`,
        )
        .join("\n")
    );
  },
  quadratic: (a, b, c) => {
    if ([a, b, c].some((v) => typeof v !== "number"))
      throw Error("系数必须为数字");
    return Array.from({ length: 81 }, (_, i) => {
      const x = -10 + i / 4;
      return [x, Number(a) * x * x + Number(b) * x + Number(c)];
    });
  },
};
