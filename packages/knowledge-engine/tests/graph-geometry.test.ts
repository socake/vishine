import test from "node:test";
import assert from "node:assert/strict";
import {
  layoutGraph,
  routeEdges,
  overlaps,
  boxAt,
  segmentHits,
  wrapLabel,
} from "../src/components/graph-geometry";
test("flow orders dependencies and separates siblings at mobile and desktop widths", () => {
  const nodes = ["a", "b", "c", "d"].map((id) => ({ id })),
    edges = [
      { from: "a", to: "b" },
      { from: "a", to: "c" },
      { from: "b", to: "d" },
      { from: "c", to: "d" },
    ];
  for (const width of [240, 486]) {
    const l = layoutGraph(nodes, edges, "flow", width);
    assert.ok(l.positions.get("a")!.y < l.positions.get("b")!.y);
    assert.ok(l.positions.get("b")!.y < l.positions.get("d")!.y);
    const p = [...l.positions.values()];
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++)
        assert.equal(overlaps(boxAt(p[i]), boxAt(p[j])), false);
  }
});
test("coincident authored positions separate deterministically", () => {
  const n = ["a", "b", "c"].map((id) => ({ id, x: 0.5, y: 0.5 }));
  const a = layoutGraph(n, [], "positioned", 280),
    b = layoutGraph(n, [], "positioned", 280);
  assert.deepEqual(a, b);
  assert.equal(new Set([...a.positions.values()].map((p) => p.y)).size, 3);
});
test("routing goes around an intervening node and keeps labels clear", () => {
  const positions = new Map([
    ["a", { x: 60, y: 160 }],
    ["blocker", { x: 210, y: 160 }],
    ["b", { x: 360, y: 160 }],
  ]);
  const r = routeEdges(
    [{ from: "a", to: "b", label: "数据路径" }],
    positions,
    420,
    320,
  )[0];
  assert.equal(r.blocked, false);
  assert.ok(r.points.length > 2);
  for (let i = 1; i < r.points.length; i++)
    assert.equal(
      segmentHits(
        r.points[i - 1],
        r.points[i],
        boxAt(positions.get("blocker")!),
      ),
      false,
    );
  if (r.label)
    for (const p of positions.values())
      assert.equal(overlaps(r.label, boxAt(p)), false);
});
test("self links have a nonempty path outside their node", () => {
  const r = routeEdges(
    [{ from: "a", to: "a", label: "retry" }],
    new Map([["a", { x: 180, y: 160 }]]),
    360,
    320,
  )[0];
  assert.equal(r.blocked, false);
  assert.ok(r.path.length > 30);
});
test("ring layouts remain operable at 320px article width and labels do not overlap nodes", () => {
  const nodes = [0, 1, 2, 3].map((id) => ({ id: String(id) }));
  const edges = nodes.map((n, i) => ({
    from: n.id,
    to: String((i + 1) % 4),
    label: "NVLink / IB",
  }));
  const l = layoutGraph(nodes, edges, "ring", 240),
    r = routeEdges(edges, l.positions, l.width, l.height);
  assert.ok(r.every((r) => !r.blocked));
  assert.ok(
    l.height <= 360,
    "four-node narrow ring keeps a compact silhouette",
  );
  assert.ok(
    Math.abs(l.positions.get("1")!.y - l.positions.get("3")!.y) < 1,
    "opposite nodes are not pushed into a vertical chain",
  );
  for (const route of r)
    if (route.label)
      for (const p of l.positions.values())
        assert.equal(overlaps(route.label, boxAt(p)), false);
});
test("long labels wrap with bounded visible lines, empty layout is finite", () => {
  assert.equal(
    wrapLabel("这是一个非常长的节点名称，需要保持布局稳定并保留完整说明", 88, 2)
      .length,
    2,
  );
  assert.ok(
    wrapLabel(
      "这是一个非常长的节点名称，需要保持布局稳定并保留完整说明",
      88,
      2,
    )[1].endsWith("…"),
  );
  const l = layoutGraph([], [], "positioned", 240);
  assert.ok(Number.isFinite(l.height));
});
test("cyclic and 100-node graphs have deterministic non-overlapping positions", () => {
  const nodes = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
  const edges = nodes.map((n, i) => ({
    from: n.id,
    to: String((i + 1) % 100),
  }));
  const l = layoutGraph(nodes, edges, "flow", 486),
    p = [...l.positions.values()];
  assert.equal(p.length, 100);
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++)
      assert.equal(overlaps(boxAt(p[i]), boxAt(p[j])), false);
});

test("edge labels never cover another routed connection", () => {
  const p = new Map([
    ["a", { x: 60, y: 70 }],
    ["b", { x: 420, y: 70 }],
    ["c", { x: 60, y: 200 }],
    ["d", { x: 420, y: 310 }],
  ]);
  const routes = routeEdges(
    [
      { from: "a", to: "d", label: "long route" },
      { from: "c", to: "a", label: "return" },
      { from: "b", to: "d", label: "second route" },
    ],
    p,
    480,
    380,
  );
  for (const r of routes)
    if (r.label)
      for (const other of routes)
        for (let i = 1; i < other.points.length; i++)
          assert.equal(
            segmentHits(other.points[i - 1], other.points[i], r.label),
            false,
          );
});
