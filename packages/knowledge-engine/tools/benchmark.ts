import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import { parse } from "yaml";
import { Engine } from "../src/core/engine";
import { extensions } from "../src/extensions";
import { layoutGraph, routeEdges } from "../src/components/graph-geometry";
const report: Record<string, unknown> = {};
const measure = (fn: () => void, n = 100) => {
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    samples: n,
    median: times[Math.floor(n * 0.5)],
    p95: times[Math.floor(n * 0.95)],
    max: times[n - 1],
  };
};
for (const size of [128, 512]) {
  const doc = parse(readFileSync("examples/gpu.yaml", "utf8"));
  doc.state.nodes.initial = size / 8;
  doc.state.dp.initial = size / 8;
  let calls = 0,
    i = 0;
  const e = new Engine(doc, {
    ...extensions,
    gpu: (...args) => {
      calls++;
      return extensions.gpu(...args);
    },
  });
  calls = 0;
  report["select" + size] = {
    ...measure(() =>
      e.dispatch(
        [{ action: "set", target: "selected", value: String(i++ % size) }],
        null,
        { interaction: "selection" },
      ),
    ),
    modelComputations: calls,
  };
  calls = 0;
  report["draft" + size] = {
    ...measure(() =>
      e.dispatch([
        { action: "set", target: "draft_dp", value: 16 + (i++ % 2) },
      ]),
    ),
    modelComputations: calls,
  };
}
for (const n of [20, 100]) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: String(i) }));
  const edges = nodes
    .slice(1)
    .map((node, i) => ({ from: String(i), to: node.id, label: "data" }));
  report["flow" + n] = measure(() => {
    const g = layoutGraph(nodes, edges, "flow", 700);
    routeEdges(edges, g.positions, g.width, g.height);
  }, 3);
}
const manifest = JSON.parse(
  readFileSync("../../assets/knowledge-dist/manifest.json", "utf8"),
);
report.resources = Object.fromEntries(
  Object.entries(manifest)
    .filter(([, v]: any) => v.file.endsWith(".js"))
    .map(([k, v]: any) => {
      const b = readFileSync("../../assets/knowledge-dist/" + v.file);
      return [k, { bytes: b.length, gzip: gzipSync(b).length }];
    }),
);
const output = JSON.stringify(
  {
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    results: report,
  },
  null,
  2,
);
console.log(output);
if (process.argv[2]) writeFileSync(process.argv[2], output + "\n");
