import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { Engine } from "../src/core/engine";
import { extensions } from "../src/extensions";
import type { Lesson, Value } from "../src/protocol/types";
const doc = (): Lesson => ({
  schemaVersion: 1,
  id: "test",
  title: "Test",
  description: "Test",
  state: {
    x: { type: "number", initial: 2, min: 0, max: 100 },
    y: { type: "number", initial: 3 },
    flag: { type: "boolean", initial: false },
  },
  derived: {
    sum: { op: "add", args: [{ ref: "state.x" }, { ref: "state.y" }] },
  },
  scene: {
    id: "root",
    type: "Text",
    props: {
      text: { bind: { op: "concat", args: ["sum=", { ref: "derived.sum" }] } },
    },
  },
});
test("one control drives derived and rendered props; isolated stores", () => {
  const a = new Engine(doc()),
    b = new Engine(doc());
  a.dispatch([{ action: "set", target: "x", value: 5 }]);
  assert.equal(a.derived.sum, 8);
  assert.equal(a.props(a.doc.scene).text, "sum=8");
  assert.equal(b.derived.sum, 5);
  a.reset();
  assert.equal(a.derived.sum, 5);
});
test("transaction reads one snapshot and commits once", () => {
  const e = new Engine(doc());
  let signals = 0;
  e.subscribe(() => signals++);
  e.dispatch([
    { action: "set", target: "x", value: { ref: "state.y" } },
    { action: "set", target: "y", value: { ref: "state.x" } },
  ]);
  assert.deepEqual([e.state.x, e.state.y], [3, 2]);
  assert.equal(signals, 1);
});
test("failed transaction leaves no partial write", () => {
  const e = new Engine(doc());
  e.dispatch([
    { action: "set", target: "x", value: 8 },
    { action: "set", target: "y", value: "bad" },
  ]);
  assert.equal(e.state.x, 2);
  assert.equal(e.derived.sum, 5);
  assert.match(e.error, /state/);
});
test("duplicate transaction writes rejected", () => {
  const e = new Engine(doc());
  e.dispatch([
    { action: "set", target: "x", value: 1 },
    { action: "set", target: "x", value: 2 },
  ]);
  assert.match(e.error, /重复/);
});
test("derived dependency order and cycle validation", () => {
  const d = doc();
  d.scene.props = { text: "test" };
  d.derived = { first: { ref: "derived.last" }, last: { ref: "state.x" } };
  assert.equal(new Engine(d).derived.first, 2);
  d.derived.last = { ref: "derived.first" };
  assert.throws(() => new Engine(d), /循环/);
});
test("unknown references, operations and state fields rejected", () => {
  for (const expression of [
    { ref: "state.unknown" },
    { op: "eval", args: ["alert(1)"] },
  ]) {
    const d = doc();
    d.derived = { bad: expression as never };
    assert.throws(() => new Engine(d));
  }
});
test("unknown protocol and component properties rejected", () => {
  for (const input of [
    { ...doc(), schemaVersion: 2 },
    { ...doc(), script: "bad" },
    {
      ...doc(),
      scene: { id: "root", type: "Text", props: { innerHTML: "bad" } },
    },
  ])
    assert.throws(() => new Engine(input));
});
test("prototype properties rejected recursively", () => {
  assert.throws(
    () =>
      new Engine(
        JSON.parse(
          JSON.stringify(doc()).replace(
            '"description":"Test"',
            '"description":"Test","data":{"__proto__":{"evil":true}}',
          ),
        ),
      ),
    /禁止/,
  );
});
test("expression failure rolls back", () => {
  const d = doc();
  d.scene.props = { text: "test" };
  d.derived = { inverse: { op: "divide", args: [1, { ref: "state.x" }] } };
  const e = new Engine(d);
  e.dispatch([{ action: "set", target: "x", value: 0 }]);
  assert.equal(e.state.x, 2);
  assert.equal(e.derived.inverse, 0.5);
});
test("deterministic steps, reverse and reset", () => {
  const d = doc();
  d.steps = [0, 1, 2].map((i) => ({
    id: "s" + i,
    title: "step",
    description: "step",
    actions: [
      {
        action: "set",
        target: "x",
        value: { op: "add", args: [{ ref: "state.x" }, 1] },
      },
    ],
  }));
  const e = new Engine(d);
  assert.equal(e.state.x, 3);
  e.move(2);
  assert.equal(e.state.x, 5);
  e.move(1);
  assert.equal(e.state.x, 4);
  e.reset();
  assert.equal(e.state.x, 3);
});
test("play is idempotent and destroy cancels scheduled work", async () => {
  const d = doc();
  d.steps = [0, 1, 2].map((i) => ({
    id: "s" + i,
    title: "step",
    description: "step",
    actions: [],
  }));
  const e = new Engine(d);
  e.setSpeed(4);
  e.play();
  e.play();
  await new Promise((r) => setTimeout(r, 280));
  assert.equal(e.step, 1);
  e.destroy();
  await new Promise((r) => setTimeout(r, 280));
  assert.equal(e.step, 1);
});
test("128 GPU rank19 mapping and groups", () => {
  const m = extensions.gpu(16, 8, 16, 8, 1, 1) as Record<string, Value>;
  assert.equal((m.nodes as Value[]).length, 128);
  const info = String(extensions.gpuInfo(m, "19"));
  assert.match(info, /Node 2 \/ GPU 3/);
  assert.match(info, /TP 组：\[16, 17, 18, 19, 20, 21, 22, 23\]/);
  assert.match(info, /3, 11, 19/);
});
test("GPU CP, PP and invalid dimensions", () => {
  assert.equal(
    (extensions.gpu(16, 8, 4, 8, 2, 2) as Record<string, Value>).total,
    128,
  );
  for (const args of [
    [16, 8, 16, 8, 2, 1],
    [0, 8, 16, 8, 1, 1],
    [1.2, 8, 1, 8, 1, 1],
  ])
    assert.throws(() => extensions.gpu(...args));
});
for (const N of [2, 4, 8, 16])
  test(`Ring ${N}: final every block includes every rank exactly once`, () => {
    const m = extensions.ring(N, 2, 2 * (N - 1)) as Record<string, Value>;
    const chunks = m.chunks as number[][][];
    for (const rank of chunks)
      for (const block of rank)
        assert.deepEqual(
          [...block].sort((a, b) => a - b),
          Array.from({ length: N }, (_, i) => i),
        );
  });
test("Ring first round updates from snapshot, not sequential mutation", () => {
  const m = extensions.ring(4, 2, 1) as Record<string, Value>;
  assert.deepEqual((m.chunks as number[][][])[0][3], [0, 3]);
});
test("quadratic degenerates to line at a=0", () => {
  const p = extensions.quadratic(0, 2, 1) as number[][];
  assert.equal(p.length, 81);
  p.forEach(([x, y]) => assert.equal(y, 2 * x + 1));
});
for (const name of ["gpu", "ring", "tcp", "kubernetes", "math", "english"])
  test(`${name} YAML: every step resolves and resets`, () => {
    const d = parse(readFileSync(`examples/${name}.yaml`, "utf8"));
    const e = new Engine(d, extensions);
    for (let i = 0; i < (d.steps?.length || 1); i++) {
      e.move(i);
      const visit = (s: Lesson["scene"]) => {
        e.props(s);
        s.children?.forEach(visit);
      };
      visit(e.doc.scene);
    }
    e.reset();
    e.destroy();
  });
test("unseen resistor configuration uses only generic operators", () => {
  const d = doc();
  d.id = "resistor";
  d.derived = {
    series: { op: "add", args: [{ ref: "state.x" }, { ref: "state.y" }] },
    parallel: {
      op: "divide",
      args: [
        { op: "multiply", args: [{ ref: "state.x" }, { ref: "state.y" }] },
        { ref: "derived.series" },
      ],
    },
  };
  d.scene.props = {
    text: { bind: { op: "concat", args: ["R=", { ref: "derived.parallel" }] } },
  };
  const e = new Engine(d);
  assert.equal(e.derived.parallel, 1.2);
  e.dispatch([{ action: "set", target: "x", value: 3 }]);
  assert.equal(e.derived.parallel, 1.5);
});

for (const name of ["gallery", "resistor"])
  test(`${name}: composed JSON fixture resolves`, () => {
    const e = new Engine(
      JSON.parse(readFileSync(`examples/${name}.json`, "utf8")),
      extensions,
    );
    e.reset();
    e.destroy();
  });

test("binding result types are validated before commit", () => {
  const d = doc();
  d.scene.props = { text: { bind: { ref: "state.x" } } };
  assert.throws(() => new Engine(d), /类型不匹配/);
});
test("GPU highlight selects exactly the requested axis group", () => {
  const m = extensions.gpu(16, 8, 16, 8, 1, 1);
  assert.equal((extensions.gpuGroup(m, "19", "DP") as Value[]).length, 16);
  assert.equal((extensions.gpuGroup(m, "19", "TP") as Value[]).length, 8);
});

test("inputs require accessible labels even through bindings", () => {
  for (const scene of [
    { id: "button", type: "Button" },
    { id: "button", type: "Button", props: { label: { bind: "" } } },
  ]) {
    const d = doc();
    d.scene = scene as never;
    assert.throws(() => new Engine(d));
  }
});

test("selection survives forward/backward steps and selection does not stop playback", () => {
  const d = doc();
  d.steps = [0, 1, 2].map((i) => ({
    id: "s" + i,
    title: "step",
    description: "step",
    actions: [{ action: "set", target: "x", value: i }],
  }));
  const e = new Engine(d);
  e.dispatch([{ action: "set", target: "y", value: 19 }], null, {
    interaction: "selection",
  });
  e.move(1);
  assert.equal(e.state.y, 19);
  e.move(0);
  assert.equal(e.state.y, 19);
  e.play();
  e.dispatch([{ action: "set", target: "y", value: 7 }], null, {
    interaction: "selection",
  });
  assert.equal(e.playing, true);
  e.dispatch([]);
  assert.equal(e.playing, true);
  e.destroy();
});
test("reset invalidates local presentation state and restores speed", () => {
  const e = new Engine(doc());
  const before = e.resetRevision;
  e.setSpeed(4);
  e.reset();
  assert.equal(e.resetRevision, before + 1);
  assert.equal(e.speed, 1);
});
test("parameter changes are retained in deterministic playback baseline", () => {
  const d = doc();
  d.steps = [0, 1, 2].map((i) => ({
    id: "s" + i,
    title: "step",
    description: "step",
    actions: [
      {
        action: "set",
        target: "x",
        value: { op: "multiply", args: [{ ref: "state.y" }, i] },
      },
    ],
  }));
  const e = new Engine(d);
  e.dispatch([{ action: "set", target: "y", value: 8 }]);
  e.move(2);
  assert.equal(e.state.x, 16);
  e.move(1);
  assert.equal(e.state.x, 8);
  e.reset();
  assert.equal(e.state.y, 3);
});

test("Ring displayed blocks track selected Rank and complete only with every source", () => {
  const initial = extensions.ringBlocks(
    extensions.ring(4, 2, 0),
    "2",
  ) as Record<string, Value>[];
  assert.equal(initial.length, 4);
  assert.ok(initial.every((b) => b.value === 3 && !b.complete));
  const final = extensions.ringBlocks(extensions.ring(4, 2, 6), "2") as Record<
    string,
    Value
  >[];
  assert.ok(final.every((b) => b.value === 10 && b.complete));
});

test("Ring initial topology is present without claiming a transmission", () => {
  const model = extensions.ring(4, 2, 0) as Record<string, Value>;
  assert.equal((model.edges as Value[]).length, 4);
  assert.ok(
    (model.edges as Record<string, Value>[]).every(
      (edge) => edge.active === false,
    ),
  );
  const moved = extensions.ring(4, 2, 1) as Record<string, Value>;
  assert.ok(
    (moved.edges as Record<string, Value>[]).every((edge) =>
      String(edge.label).includes("块"),
    ),
  );
});
test("authored graph placement is bounded by schema", () => {
  const d = doc();
  d.scene = {
    id: "diagram",
    type: "Graph",
    props: {
      layout: "positioned",
      nodes: [{ id: "a", label: "A", x: 0, y: 1 }],
      edges: [],
    },
  };
  assert.doesNotThrow(() => new Engine(d));
  (d.scene.props!.nodes as any[])[0].x = 2;
  assert.throws(() => new Engine(d));
});

test("unrelated state changes preserve cached topology and immutable props", () => {
  const source = parse(readFileSync("examples/gpu.yaml", "utf8"));
  let calls = 0;
  const e = new Engine(source, {
    ...extensions,
    gpu: (...args) => {
      calls++;
      return extensions.gpu(...args);
    },
  });
  const original = e.derived.model;
  const initialCalls = calls;
  e.dispatch([{ action: "set", target: "selected", value: "20" }], null, {
    interaction: "selection",
  });
  e.dispatch([{ action: "set", target: "draft_dp", value: 8 }]);
  assert.equal(calls, initialCalls);
  assert.equal(e.derived.model, original);
  assert.notEqual(e.derived.info, "");
  assert.ok(Object.isFrozen(original));
  assert.throws(() => {
    (original as Record<string, Value>).summary = "changed";
  }, TypeError);
});
test("transitive cached computations invalidate only changed dependencies", () => {
  const d = doc();
  d.derived!.twice = { op: "multiply", args: [{ ref: "derived.sum" }, 2] };
  let adds = 0,
    multiplies = 0;
  const e = new Engine(d, {
    add: (a, b) => {
      adds++;
      return Number(a) + Number(b);
    },
    multiply: (a, b) => {
      multiplies++;
      return Number(a) * Number(b);
    },
  });
  e.dispatch([{ action: "toggle", target: "flag" }]);
  assert.deepEqual([adds, multiplies], [1, 1]);
  e.dispatch([{ action: "set", target: "x", value: 8 }]);
  assert.equal(e.derived.twice, 22);
  assert.deepEqual([adds, multiplies], [2, 2]);
});
test("failed cached candidate cannot replace committed values or bypass validation", () => {
  const d = doc();
  d.scene = {
    id: "value",
    type: "NumberInput",
    props: { label: "Y", value: { bind: { ref: "state.y" } } },
  };
  const e = new Engine(d);
  const props = e.props(e.doc.scene);
  e.dispatch([{ action: "set", target: "y", value: "bad" }]);
  assert.equal(e.props(e.doc.scene), props);
  assert.equal(e.state.y, 3);
  e.dispatch([{ action: "set", target: "y", value: 9 }]);
  assert.equal(e.props(e.doc.scene).value, 9);
  assert.equal(e.derived.sum, 11);
});
test("step dependency cache preserves reverse replay and resets", () => {
  const d = doc();
  d.derived!.frame = { op: "add", args: [{ ref: "step" }, { ref: "state.x" }] };
  d.steps = [0, 1, 2].map((i) => ({
    id: String(i),
    title: String(i),
    description: "step",
    actions: [],
  }));
  const e = new Engine(d);
  e.move(2);
  assert.equal(e.derived.frame, 4);
  e.move(0);
  assert.equal(e.derived.frame, 2);
  e.reset();
  assert.equal(e.derived.frame, 2);
});
test("cached schema still rejects unknown fields and invalid nested bound nodes", () => {
  const d = doc();
  d.scene = {
    id: "g",
    type: "Graph",
    props: { nodes: { bind: { ref: "data.nodes" } } },
  };
  d.data = { nodes: [{ id: "a", label: "A", injected: true }] };
  assert.throws(() => new Engine(d));
});

test("invalid derived graph candidate is never accepted through the property cache", () => {
  const d = doc();
  d.data = {
    good: [{ id: "a", label: "A" }],
    bad: [{ id: "a", label: "A", disabled: "invalid" }],
  };
  d.derived!.nodes = {
    op: "if",
    args: [{ ref: "state.flag" }, { ref: "data.bad" }, { ref: "data.good" }],
  };
  d.scene = {
    id: "graph",
    type: "Graph",
    props: { nodes: { bind: { ref: "derived.nodes" } } },
  };
  const e = new Engine(d),
    original = e.props(e.doc.scene);
  e.dispatch([{ action: "toggle", target: "flag" }]);
  assert.equal(e.state.flag, false);
  assert.match(e.error, /disabled/);
  assert.equal(e.props(e.doc.scene), original);
  e.dispatch([{ action: "set", target: "x", value: 8 }]);
  assert.equal(e.error, "");
  e.dispatch([{ action: "toggle", target: "flag" }]);
  assert.equal(e.state.flag, false);
  assert.match(e.error, /disabled/);
});

test("bound coordinate limits reject invalid initialization and roll back updates", () => {
  for (const coord of [-1, 99]) {
    const d = doc();
    d.data = { coord };
    d.scene = {
      id: "node",
      type: "Node",
      props: { label: "N", x: { bind: { ref: "data.coord" } } },
    };
    assert.throws(() => new Engine(d), /x/);
  }
  const d = doc();
  d.state!.x.initial = 0;
  d.scene = {
    id: "node",
    type: "Node",
    props: { label: "N", x: { bind: { ref: "state.x" } } },
  };
  const e = new Engine(d);
  e.dispatch([{ action: "set", target: "x", value: 1 }]);
  assert.equal(e.props(e.doc.scene).x, 1);
  e.dispatch([{ action: "set", target: "x", value: 99 }]);
  assert.equal(e.state.x, 1);
  assert.match(e.error, /x/);
});

test("table validates row arrays for both literal and bound data", () => {
  for (const bound of [false, true]) {
    const d = doc();
    d.data = { rows: [7] };
    d.scene = {
      id: "table",
      type: "Table",
      props: { rows: bound ? { bind: { ref: "data.rows" } } : [7] },
    };
    assert.throws(() => new Engine(d), /rows/);
    d.data.rows = [[7, "value"]];
    if (!bound) d.scene.props!.rows = [[7, "value"]];
    assert.doesNotThrow(() => new Engine(d));
  }
});

test("unimplemented Graph columns option is not advertised or accepted", () => {
  const d = doc();
  d.scene = { id: "graph", type: "Graph", props: { columns: 4 } };
  assert.throws(() => new Engine(d));
});
