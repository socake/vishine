import { memo, useEffect, useMemo, useRef, useState, useId } from "react";
import { Icon, ButtonControl } from "./Controls";
import {
  layoutGraph,
  routeEdges,
  wrapLabel,
  NODE_HEIGHT,
} from "./graph-geometry";
export interface GraphNode {
  disabled?: boolean;
  status?: "idle" | "running" | "complete" | "error";
  x?: number;
  y?: number;
  id: string;
  label: string;
  group?: string;
  detail?: string;
}
export interface GraphEdge {
  active?: boolean;
  from: string;
  to: string;
  label?: string;
}
function GraphView({
  nodes,
  edges,
  layout,
  selected,
  active,
  onSelect,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: string;
  selected: string;
  active: string[];
  onSelect: (id: string) => void;
}) {
  const marker = useId().replaceAll(":", "");
  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(360);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const resize = () => setViewportWidth(Math.round(el.clientWidth));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout]);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (layout !== "grid") return;
    const grid = gridRef.current;
    const selected = grid?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (grid && selected) {
      const group = selected.closest(".ki-node-group")!;
      grid.scrollTop =
        group.getBoundingClientRect().top -
        grid.getBoundingClientRect().top +
        grid.scrollTop -
        4;
    }
  }, [layout]);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const groups = useMemo(
    () =>
      nodes.reduce<Record<string, GraphNode[]>>(
        (out, n) => {
          (out[n.group || ""] ??= []).push(n);
          return out;
        },
        Object.create(null) as Record<string, GraphNode[]>,
      ),
    [nodes],
  );
  const geometryKey = JSON.stringify([
    layout,
    viewportWidth,
    nodes.map((n) => [n.id, n.x, n.y]),
    edges.map((e) => [e.from, e.to]),
  ]);
  const routeKey = JSON.stringify([
    geometryKey,
    edges.map((e) => [e.from, e.to, e.label]),
  ]);
  const geometry = useMemo(
    () =>
      layoutGraph(
        layout === "grid" || nodes.length > 512 ? [] : nodes,
        edges,
        layout,
        viewportWidth,
      ),
    [geometryKey],
  );
  const routes = useMemo(
    () =>
      layout === "grid" || nodes.length > 512
        ? []
        : routeEdges(
            edges,
            geometry.positions,
            geometry.width,
            geometry.height,
          ),
    [routeKey],
  );
  const en = document.documentElement.lang.startsWith("en");
  const statusText = (status: GraphNode["status"]) =>
    ({
      idle: en ? "Idle" : "空闲",
      running: en ? "Running" : "运行中",
      complete: en ? "Complete" : "已完成",
      error: en ? "Error" : "异常",
    })[status || "idle"];
  const locate = () => {
    const area = layout === "grid" ? gridRef.current : viewportRef.current;
    const target = area?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (area && target) {
      const a = area.getBoundingClientRect(),
        r = target.getBoundingClientRect();
      area.scrollTo({
        left:
          area.scrollLeft + r.left - a.left - (area.clientWidth - r.width) / 2,
        top:
          area.scrollTop + r.top - a.top - (area.clientHeight - r.height) / 2,
        behavior: "instant",
      });
    }
  };
  if (nodes.length > 512)
    return <p role="alert">节点数超过512，请缩小范围。</p>;
  const chosen = nodes.find((n) => n.id === selected);
  if (!nodes.length)
    return (
      <p className="ki-empty" role="status">
        {en
          ? "No nodes to display. Adjust the inputs or reset the visualization."
          : "当前没有可显示的节点。请调整参数或重置图解。"}
      </p>
    );
  if (layout === "grid")
    return (
      <div className="ki-grid-graph">
        <div className="ki-selection" aria-live="polite">
          <strong>
            {chosen
              ? `${en ? "Selected" : "已选"} ${chosen.label}`
              : en
                ? "Select a node"
                : "选择节点"}
          </strong>
          <span>
            {chosen?.group} · {chosen?.detail}
          </span>
          <ButtonControl
            size="small"
            variant="ghost"
            onClick={locate}
            disabled={!chosen}
          >
            <Icon name="locate" />
            {en ? "Locate selection" : "定位选中"}
          </ButtonControl>
          <small>
            {en ? "Highlighted group" : "高亮组"} {active.length} ·{" "}
            {en ? "Double border = selected" : "双线框＝已选"}
          </small>
        </div>
        <div
          className="ki-node-groups"
          ref={gridRef}
          tabIndex={0}
          role="region"
          aria-label={en ? "Node groups" : "节点分组"}
        >
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} className="ki-node-group">
              {group && (
                <button
                  className="ki-group-toggle"
                  aria-expanded={!closed.has(group)}
                  onClick={() =>
                    setClosed((old) => {
                      const next = new Set(old);
                      if (next.has(group)) next.delete(group);
                      else next.add(group);
                      return next;
                    })
                  }
                >
                  <span>{group}</span>
                  <small>
                    {items!.length} {en ? "nodes" : "节点"}
                  </small>
                  <Icon name={closed.has(group) ? "right" : "down"} />
                </button>
              )}
              {!closed.has(group) && (
                <div className="ki-node-grid">
                  {items!.map((n) => (
                    <button
                      key={n.id}
                      className="ki-node"
                      disabled={n.disabled}
                      data-status={n.status || "idle"}
                      aria-busy={n.status === "running" || undefined}
                      aria-label={`${n.label} ${n.detail || ""}${n.status ? " · " + statusText(n.status) : ""}`}
                      aria-pressed={selected === n.id}
                      data-active={active.includes(n.id)}
                      onClick={() => !n.disabled && onSelect(n.id)}
                      onKeyDown={(e) => {
                        if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                          e.preventDefault();
                          const buttons =
                            e.currentTarget.parentElement!.querySelectorAll(
                              "button:not(:disabled)",
                            );
                          const current = Array.from(buttons).indexOf(
                            e.currentTarget,
                          );
                          if (current < 0) return;
                          (
                            buttons[
                              (current +
                                (e.key === "ArrowRight" ? 1 : -1) +
                                buttons.length) %
                                buttons.length
                            ] as HTMLElement
                          ).focus();
                        }
                      }}
                    >
                      <strong>{n.label}</strong>
                      <small>{n.detail || n.id}</small>
                      {n.status && n.status !== "idle" && (
                        <span className="ki-node-status">
                          {statusText(n.status)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  const { width, height, positions } = geometry;
  const fit = () => {
    setScale(1);
    viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "instant" });
  };
  return (
    <div className="ki-diagram" data-layout={layout}>
      <div className="ki-zoom">
        <button
          onClick={() => setScale((s) => Math.min(2, s + 0.25))}
          aria-label="Zoom in"
          disabled={scale === 2}
        >
          <Icon name="plus" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(1, s - 0.25))}
          aria-label="Zoom out"
          disabled={scale === 1}
        >
          <Icon name="minus" />
        </button>
        <button onClick={fit} aria-label={en ? "Reset zoom" : "恢复缩放"}>
          <Icon name="fit" />
          {en ? "Fit" : "适应宽度"} · {Math.round(scale * 100)}%
        </button>
        <button
          onClick={locate}
          disabled={!chosen}
          aria-label={en ? "Locate selection" : "定位选中"}
        >
          <Icon name="locate" />
        </button>
      </div>
      {routes.some((r) => r.blocked) && (
        <p className="ki-navigation-hint" role="status">
          {en
            ? "Some connections could not avoid obstacles. Adjust authored positions for this topology."
            : "部分连线未找到无障碍路径，请调整此拓扑的节点位置。"}
        </p>
      )}
      {scale > 1 && (
        <p className="ki-navigation-hint" role="status">
          {en
            ? "Zoomed view: scroll horizontally, or choose Fit to see the whole diagram."
            : "已放大：可横向滚动查看，或点“适应宽度”恢复全图。"}
        </p>
      )}
      <div
        ref={viewportRef}
        className="ki-graph-scroll"
        tabIndex={0}
        role="region"
        aria-label="Diagram"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            width: `${scale * 100}%`,
            minWidth: width,
          }}
          role="group"
          aria-label="Interactive graph"
        >
          <defs>
            <marker
              id={marker}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="var(--accent)" />
            </marker>
          </defs>
          {layout === "positioned" &&
            Object.entries(groups)
              .filter(([group]) => group)
              .map(([group, items]) => {
                const ys = items.map((n) => positions.get(n.id)!.y),
                  top = Math.min(...ys) - 50,
                  bottom = Math.max(...ys) + 36;
                return (
                  <g key={group} className="ki-graph-band">
                    <rect
                      x="2"
                      y={top}
                      width={width - 4}
                      height={bottom - top}
                      rx="8"
                    />
                    <text x="14" y={top + 17}>
                      {group}
                    </text>
                  </g>
                );
              })}
          {edges.map((edge, i) => {
            const r = routes[i];
            return (
              <g
                key={`${edge.from}-${edge.to}-${i}`}
                className="ki-edge"
                data-selected={edge.from === selected || edge.to === selected}
                data-related={edge.from === hovered || edge.to === hovered}
                data-transmitting={edge.active !== false}
              >
                <title>{`${edge.from} → ${edge.to}${edge.label ? ": " + edge.label : ""}`}</title>
                <path
                  className="ki-edge-line"
                  d={r.path}
                  markerEnd={
                    edge.active === false ? undefined : `url(#${marker})`
                  }
                />
                {r.label && (
                  <g className="ki-edge-label">
                    <rect
                      x={r.label.x}
                      y={r.label.y}
                      width={r.label.width}
                      height={r.label.height}
                      rx="4"
                    />
                    <text textAnchor="middle">
                      {r.lines.map((line, j) => (
                        <tspan
                          key={j}
                          x={r.label!.x + r.label!.width / 2}
                          y={r.label!.y + 16 + j * 15}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const p = positions.get(n.id)!;
            const lines = wrapLabel(n.label, 88, 2);
            const detail =
              n.status && n.status !== "idle"
                ? statusText(n.status)
                : n.detail || "";
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                role="button"
                tabIndex={n.disabled ? -1 : 0}
                aria-disabled={n.disabled || undefined}
                aria-busy={n.status === "running" || undefined}
                data-status={n.status || "idle"}
                onMouseEnter={() => !n.disabled && setHovered(n.id)}
                onMouseLeave={() => setHovered("")}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered("")}
                aria-label={`${n.label} ${n.detail || ""}${n.status ? " · " + statusText(n.status) : ""}`}
                aria-pressed={selected === n.id}
                className="ki-svg-node"
                data-active={active.includes(n.id)}
                onClick={() => !n.disabled && onSelect(n.id)}
                onKeyDown={(e) => {
                  if (!n.disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(n.id);
                  }
                }}
              >
                <title>{`${n.label}${n.detail ? ": " + n.detail : ""}${n.status ? " · " + statusText(n.status) : ""}`}</title>
                <rect
                  x="-52"
                  y={-NODE_HEIGHT / 2}
                  width="104"
                  height={NODE_HEIGHT}
                  rx="8"
                />
                {selected === n.id && (
                  <rect
                    className="ki-selected-outline"
                    x="-48"
                    y={-NODE_HEIGHT / 2 + 4}
                    width="96"
                    height={NODE_HEIGHT - 8}
                    rx="5"
                  />
                )}
                <text textAnchor="middle">
                  {lines.map((line, i) => (
                    <tspan
                      key={i}
                      x="0"
                      y={(lines.length === 1 ? -5 : -13) + i * 15}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                <text textAnchor="middle" y="21" className="ki-small">
                  {wrapLabel(detail, 90, 1)[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ki-state-legend">
        <span>{en ? "Border: selected" : "双线框：选中"}</span>
        <span>{en ? "Fill: highlighted" : "底色：高亮"}</span>
        <span>{en ? "Dashed flow: transmitting" : "流动虚线：传输中"}</span>
      </div>
      {routes.some((r, i) => edges[i].label && !r.label) && (
        <details className="ki-edge-notes">
          <summary>{en ? "Connection labels" : "连线说明"}</summary>
          <ul>
            {routes.map((r, i) =>
              edges[i].label && !r.label ? (
                <li key={i}>
                  {nodes.find((n) => n.id === edges[i].from)?.label} →{" "}
                  {nodes.find((n) => n.id === edges[i].to)?.label}：
                  {edges[i].label}
                </li>
              ) : null,
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

export const Graph = memo(GraphView);
