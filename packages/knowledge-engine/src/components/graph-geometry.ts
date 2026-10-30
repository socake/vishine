/** Bounded deterministic layout/routing, independent of React and lesson domains. */
export interface Point {
  x: number;
  y: number;
}
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface LayoutNode {
  id: string;
  x?: number;
  y?: number;
}
export interface LayoutEdge {
  from: string;
  to: string;
  label?: string;
}
export const NODE_WIDTH = 104,
  NODE_HEIGHT = 64;
export const boxAt = (p: Point, padding = 0): Box => ({
  x: p.x - NODE_WIDTH / 2 - padding,
  y: p.y - NODE_HEIGHT / 2 - padding,
  width: NODE_WIDTH + padding * 2,
  height: NODE_HEIGHT + padding * 2,
});
export function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
export function segmentHits(a: Point, b: Point, r: Box) {
  let low = 0,
    high = 1;
  const d = { x: b.x - a.x, y: b.y - a.y };
  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? "width" : "height";
    if (Math.abs(d[axis]) < 0.001) {
      if (a[axis] <= r[axis] || a[axis] >= r[axis] + r[size]) return false;
      continue;
    }
    let t0 = (r[axis] - a[axis]) / d[axis],
      t1 = (r[axis] + r[size] - a[axis]) / d[axis];
    if (t0 > t1) [t0, t1] = [t1, t0];
    low = Math.max(low, t0);
    high = Math.min(high, t1);
    if (low >= high) return false;
  }
  return high > 0 && low < 1;
}
export function layoutGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  mode: string,
  available: number,
) {
  let width = Math.max(240, Math.round(available || 360)),
    height = 160;
  const positions = new Map<string, Point>();
  if (!nodes.length) return { width, height, positions };
  if (mode === "ring") {
    width = Math.max(width, nodes.length > 4 ? nodes.length * 52 : 240);
    height = Math.max(360, nodes.length > 4 ? nodes.length * 48 : 360);
    nodes.forEach((n, i) =>
      positions.set(n.id, {
        x:
          width / 2 +
          (width / 2 - 60) * Math.sin((i / nodes.length) * 2 * Math.PI),
        y:
          height / 2 -
          (height / 2 - 70) * Math.cos((i / nodes.length) * 2 * Math.PI),
      }),
    );
  } else if (mode === "positioned") {
    const minY = Math.min(...nodes.map((n) => n.y ?? 0.5));
    nodes.forEach((n) =>
      positions.set(n.id, {
        x: 60 + (n.x ?? 0.5) * (width - 120),
        y: 70 + ((n.y ?? 0.5) - minY) * 240,
      }),
    );
  } else {
    // DAG levels; cyclic/unconnected remainders use stable input order.
    const indegree = new Map(nodes.map((n) => [n.id, 0])),
      level = new Map(nodes.map((n) => [n.id, 0]));
    for (const e of edges)
      if (indegree.has(e.to) && indegree.has(e.from) && e.from !== e.to)
        indegree.set(e.to, indegree.get(e.to)! + 1);
    const queue = nodes
        .filter((n) => indegree.get(n.id) === 0)
        .map((n) => n.id),
      done = new Set<string>();
    for (let k = 0; k < queue.length; k++) {
      const id = queue[k];
      done.add(id);
      for (const e of edges.filter(
        (e) => e.from === id && e.to !== id && indegree.has(e.to),
      )) {
        level.set(e.to, Math.max(level.get(e.to)!, level.get(id)! + 1));
        indegree.set(e.to, indegree.get(e.to)! - 1);
        if (indegree.get(e.to) === 0) queue.push(e.to);
      }
    }
    const rows = new Map<number, LayoutNode[]>();
    nodes.forEach((n) => {
      const l = done.has(n.id) ? level.get(n.id)! : 0;
      rows.set(l, [...(rows.get(l) || []), n]);
    });
    const columns = Math.max(1, Math.floor((width - 24) / 144));
    let row = 0;
    for (const [, items] of [...rows].sort(([a], [b]) => a - b))
      for (let i = 0; i < items.length; i += columns) {
        const batch = items.slice(i, i + columns);
        batch.forEach((n, j) =>
          positions.set(n.id, {
            x: (width / (batch.length + 1)) * (j + 1),
            y: 70 + row * 124,
          }),
        );
        row++;
      }
  }
  // Separate coincident/overlapping authored positions, including dense rings.
  const placed: Point[] = [];
  for (const n of nodes) {
    const p = positions.get(n.id)!;
    while (placed.some((q) => overlaps(boxAt(p, 7), boxAt(q, 7)))) p.y += 100;
    placed.push(p);
    height = Math.max(height, p.y + 70);
  }
  return { width, height, positions };
}
function ports(p: Point) {
  return [
    { x: p.x, y: p.y - NODE_HEIGHT / 2 },
    { x: p.x + NODE_WIDTH / 2, y: p.y },
    { x: p.x, y: p.y + NODE_HEIGHT / 2 },
    { x: p.x - NODE_WIDTH / 2, y: p.y },
  ].map((b, i) => ({
    boundary: b,
    outside: { x: b.x + [0, 12, 0, -12][i], y: b.y + [-12, 0, 12, 0][i] },
  }));
}
const length = (points: Point[]) =>
  points
    .slice(1)
    .reduce(
      (sum, p, i) =>
        sum + Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y),
      0,
    );
export interface Route {
  points: Point[];
  path: string;
  blocked: boolean;
  label?: Box;
  lines: string[];
}
export function wrapLabel(text: string, maxWidth = 140, maxLines = 2) {
  const lines: string[] = [];
  let line = "",
    weight = 0;
  const limit = maxWidth / 12;
  for (const char of text) {
    const size = /[^\x00-\xff]/.test(char) ? 1 : 0.58;
    if (weight + size > limit && line) {
      lines.push(line);
      line = "";
      weight = 0;
    }
    line += char;
    weight += size;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines)
    return [
      ...lines.slice(0, maxLines - 1),
      lines[maxLines - 1].slice(0, -1) + "…",
    ];
  return lines;
}
export function routeEdges(
  edges: LayoutEdge[],
  positions: Map<string, Point>,
  width: number,
  height: number,
) {
  const obstacles = [...positions.values()].map((p) => boxAt(p, 5));
  const labels: Box[] = [];
  const routes = edges.map((edge, index): Route => {
    const a = positions.get(edge.from)!,
      b = positions.get(edge.to)!;
    let best: Point[] | undefined,
      score = Infinity;
    const xs = [16, width - 16, (a.x + b.x) / 2],
      ys = [16, height - 16, (a.y + b.y) / 2];
    // Shared gutters and obstacle-adjacent lanes; cap work for large graphs.
    for (const r of obstacles.slice(0, 64)) {
      xs.push(r.x - 10, r.x + r.width + 10);
      ys.push(r.y - 10, r.y + r.height + 10);
    }
    for (const s of ports(a))
      for (const t of ports(b)) {
        // Every candidate includes two 12px port extensions and at least
        // three middle points. Skip ports that cannot beat the current route.
        const lowerBound =
          24 +
          Math.abs(s.outside.x - t.outside.x) +
          Math.abs(s.outside.y - t.outside.y) +
          24 +
          index * 0.001;
        if (lowerBound >= score) continue;
        const candidates: Point[][] = [];
        if (edge.from !== edge.to)
          candidates.push(
            [s.outside, { x: t.outside.x, y: s.outside.y }, t.outside],
            [s.outside, { x: s.outside.x, y: t.outside.y }, t.outside],
          );
        for (const x of new Set(xs))
          candidates.push([
            s.outside,
            { x, y: s.outside.y },
            { x, y: t.outside.y },
            t.outside,
          ]);
        for (const y of new Set(ys))
          candidates.push([
            s.outside,
            { x: s.outside.x, y },
            { x: t.outside.x, y },
            t.outside,
          ]);
        for (const middle of candidates) {
          const points = [s.boundary, ...middle, t.boundary];
          const cost = length(points) + middle.length * 8 + index * 0.001;
          if (cost >= score) continue;
          if (edge.from === edge.to && length(middle) < NODE_WIDTH) continue;
          if (
            middle.some(
              (p) => p.x < 8 || p.x > width - 8 || p.y < 8 || p.y > height - 8,
            )
          )
            continue;
          if (
            middle
              .slice(1)
              .some((p, i) =>
                obstacles.some((r) => segmentHits(middle[i], p, r)),
              )
          )
            continue;
          if (cost < score) {
            best = points;
            score = cost;
          }
        }
      }
    const points = (best || [a, b]).filter(
      (p, i, all) => i === 0 || p.x !== all[i - 1].x || p.y !== all[i - 1].y,
    );
    const lines = wrapLabel(edge.label || "");
    return {
      points,
      path: points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" "),
      blocked: !best,
      lines,
    };
  });
  for (const route of routes) {
    const { points, lines } = route;
    let label: Box | undefined;
    if (lines.length) {
      const w = Math.min(
          156,
          Math.max(
            44,
            ...lines.map(
              (s) =>
                [...s].reduce(
                  (n, c) => n + (/[^\x00-\xff]/.test(c) ? 12 : 7),
                  0,
                ) + 12,
            ),
          ),
        ),
        h = lines.length * 15 + 10;
      const candidates: Box[] = [];
      const segments = points
        .slice(1)
        .map((q, i) => ({ p: points[i], q }))
        .filter(({ p, q }) => Math.hypot(q.x - p.x, q.y - p.y) >= 24)
        .sort(
          (a, b) =>
            Math.hypot(b.q.x - b.p.x, b.q.y - b.p.y) -
            Math.hypot(a.q.x - a.p.x, a.q.y - a.p.y),
        );
      for (const { p, q } of segments) {
        const x = (p.x + q.x) / 2,
          y = (p.y + q.y) / 2;
        for (const offset of [12, 30, 50]) {
          if (Math.abs(p.x - q.x) < 1)
            candidates.push(
              { x: x + offset, y: y - h / 2, width: w, height: h },
              { x: x - offset - w, y: y - h / 2, width: w, height: h },
            );
          else
            candidates.push(
              { x: x - w / 2, y: y - offset - h, width: w, height: h },
              { x: x - w / 2, y: y + offset, width: w, height: h },
            );
        }
      }
      label = candidates.find(
        (r) =>
          r.x >= 4 &&
          r.y >= 4 &&
          r.x + r.width <= width - 4 &&
          r.y + r.height <= height - 4 &&
          !obstacles.some((o) => overlaps(r, o)) &&
          !labels.some((o) => overlaps(r, o)) &&
          !routes.some((other) =>
            other.points
              .slice(1)
              .some((p, i) => segmentHits(other.points[i], p, r)),
          ),
      );
      if (label) {
        labels.push(label);
        route.label = label;
      }
    }
  }
  return routes;
}
