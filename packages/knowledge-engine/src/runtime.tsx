import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  Component,
} from "react";
import { ButtonControl, Icon, SelectControl } from "./components/Controls";
import { NumberInput } from "./components/NumberInput";
import { createRoot } from "react-dom/client";
import { Engine } from "./core/engine";
import { extensions } from "./extensions";
import { Graph, type GraphNode, type GraphEdge } from "./components/Graph";
import type { Scene, Value } from "./protocol/types";
import "./style.css";
const Formula = lazy(() => import("./components/Formula")),
  Chart = lazy(() => import("./components/Chart"));
const en = document.documentElement.lang.startsWith("en");
const t = en
  ? {
      reset: "Reset",
      full: "Fullscreen",
      exit: "Exit fullscreen",
      play: "Play",
      pause: "Pause",
      prev: "Previous",
      next: "Next",
      speed: "Speed",
      loading: "Loading visualization…",
      step: "Step",
      error:
        "Unable to display this visualization. The static explanation remains available.",
      selection: "Selected",
    }
  : {
      reset: "重置",
      full: "全屏探索",
      exit: "退出全屏",
      play: "播放",
      pause: "暂停",
      prev: "上一步",
      next: "下一步",
      speed: "播放速度",
      loading: "正在加载图解…",
      step: "步骤",
      error: "图解暂时无法显示，下方静态说明仍可阅读。",
      selection: "当前选择",
    };
interface Props {
  node: Scene;
  p: Record<string, Value>;
  engine: Engine;
  children: React.ReactNode;
  emit: (event: string, value?: Value) => void;
}
type Renderer = (props: Props) => React.ReactNode;
const renderers = new Map<string, Renderer>();
export function registerComponent(name: string, render: Renderer) {
  if (renderers.has(name)) throw Error("Duplicate renderer " + name);
  renderers.set(name, render);
}
const text = (v: Value | undefined) =>
  v === undefined ? "" : typeof v === "string" ? v : JSON.stringify(v);
for (const type of ["Container", "Row", "Column", "Grid", "Card", "Group"])
  registerComponent(type, ({ p, children }) => (
    <div
      className={`ki-${type.toLowerCase()}`}
      style={{
        gap: Math.max(0, Math.min(48, Number(p.gap) || 16)),
        ...(type === "Grid"
          ? ({
              "--ki-columns": Math.max(1, Math.min(6, Number(p.columns) || 2)),
            } as React.CSSProperties)
          : {}),
      }}
    >
      {(p.title || p.label) && (
        <div className="ki-panel-title">{text(p.title || p.label)}</div>
      )}
      {children}
    </div>
  ));
registerComponent("ControlPanel", ({ p, children }) => (
  <div
    className="ki-control-panel"
    role="group"
    aria-label={text(p.label) || (en ? "Visualization controls" : "图解操作")}
    style={{ gap: Math.max(0, Math.min(48, Number(p.gap ?? 12))) }}
  >
    {children}
  </div>
));
registerComponent("Workbench", ({ p, children }) => (
  <div className="ki-workbench" data-side={p.side || "end"}>
    {children}
  </div>
));
registerComponent("DataBlocks", ({ p }) => (
  <div className="ki-data-blocks" aria-live="polite">
    {((p.items as Record<string, Value>[]) || []).map((item) => (
      <div
        className="ki-data-block"
        key={text(item.label)}
        data-complete={Boolean(item.complete)}
      >
        <span>{text(item.label)}</span>
        <strong>{text(item.value)}</strong>
        <small>{text(item.detail)}</small>
        <span className="ki-block-state">
          {item.complete ? (en ? "Complete" : "完整") : en ? "Partial" : "部分"}
        </span>
      </div>
    ))}
  </div>
));
registerComponent("NumberInput", ({ p, emit }) => (
  <NumberInput
    label={text(p.label)}
    value={Number(p.value)}
    min={Number(p.min ?? 0)}
    max={Number(p.max ?? 512)}
    step={Number(p.step ?? 1)}
    disabled={Boolean(p.disabled)}
    onChange={(value) => emit("change", value)}
  />
));
registerComponent("Text", ({ p }) => <p className="ki-text">{text(p.text)}</p>);
registerComponent("Heading", ({ p }) => (
  <div role="heading" aria-level={3} className="ki-heading">
    {text(p.text)}
  </div>
));
registerComponent("Callout", ({ p }) => (
  <aside className="ki-callout">{text(p.text)}</aside>
));
registerComponent("Badge", ({ p }) => (
  <span className="ki-badge">{text(p.text)}</span>
));
for (const type of ["Inspector", "ExplanationPanel"])
  registerComponent(type, ({ p }) => (
    <aside className="ki-inspector" aria-live="polite">
      <strong>{text(p.title) || t.selection}</strong>
      <p>{text(p.text)}</p>
    </aside>
  ));
registerComponent("Button", ({ p, emit }) => (
  <ButtonControl
    disabled={Boolean(p.disabled)}
    busy={Boolean(p.busy)}
    variant={
      (p.variant as "primary" | "secondary" | "ghost") ||
      (p.primary ? "primary" : "secondary")
    }
    size={p.size as "small" | "regular"}
    data-primary={Boolean(p.primary)}
    onClick={() => emit("click")}
  >
    {text(p.label)}
  </ButtonControl>
));
for (const type of ["Slider", "Select", "Toggle"])
  registerComponent(type, ({ p, emit }) => {
    const id = useId();
    const value = p.value;
    if (type === "Toggle")
      return (
        <label
          className="ki-toggle"
          htmlFor={id}
          data-disabled={Boolean(p.disabled)}
        >
          <input
            id={id}
            type="checkbox"
            disabled={Boolean(p.disabled)}
            checked={Boolean(value)}
            onChange={(e) => emit("change", e.target.checked)}
          />
          <span>{text(p.label)}</span>
        </label>
      );
    return (
      <div className="ki-field">
        <label htmlFor={id}>
          {text(p.label)}
          {type === "Slider" && <output> {text(value)}</output>}
        </label>
        {type === "Select" ? (
          <SelectControl
            id={id}
            disabled={Boolean(p.disabled)}
            value={String(value ?? "")}
            onChange={(e) => emit("change", e.target.value)}
          >
            {((p.options as Value[]) || []).map((v) => (
              <option key={text(v)} value={text(v)}>
                {text(v)}
              </option>
            ))}
          </SelectControl>
        ) : (
          <input
            id={id}
            disabled={Boolean(p.disabled)}
            type={
              type === "Slider"
                ? "range"
                : type === "Toggle"
                  ? "checkbox"
                  : "number"
            }
            min={Number(p.min ?? 0)}
            max={Number(p.max ?? 512)}
            step={Number(p.step ?? 1)}
            {...(type === "Toggle"
              ? { checked: Boolean(value) }
              : { value: String(value ?? 0) })}
            onChange={(e) => {
              if (type === "Toggle") emit("change", e.target.checked);
              else if (e.target.value !== "")
                emit("change", e.target.valueAsNumber);
            }}
          />
        )}
      </div>
    );
  });
registerComponent("RichText", ({ p, emit }) => (
  <div className="ki-tokens">
    {((p.tokens as Record<string, Value>[]) || []).map((token) => (
      <button
        key={text(token.id)}
        aria-pressed={p.selected === token.id}
        onClick={() => emit("select", token.id)}
      >
        <strong>{text(token.text)}</strong>
        <small>{text(token.label)}</small>
      </button>
    ))}
  </div>
));
registerComponent("CodeBlock", ({ p, emit }) => (
  <pre className="ki-code" aria-label={text(p.language) || "Code"}>
    <code>
      {String(p.code || "")
        .split("\n")
        .map((line, i) => (
          <button
            key={i}
            className={p.highlight === i ? "is-active" : ""}
            onClick={() => emit("select", i)}
          >
            <span>{i + 1}</span>
            {line || " "}
          </button>
        ))}
    </code>
  </pre>
));
registerComponent("Markdown", ({ p }) => (
  <div className="ki-markdown">
    {String(p.text || "")
      .split(/\n\s*\n/)
      .map((paragraph, i) => (
        <p key={i}>
          {paragraph
            .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
            .map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : part.startsWith("`") ? (
                <code key={j}>{part.slice(1, -1)}</code>
              ) : (
                part
              ),
            )}
        </p>
      ))}
  </div>
));
registerComponent("Table", ({ p }) => (
  <div className="ki-table-scroll" tabIndex={0}>
    <table>
      <thead>
        <tr>
          {((p.columns as Value[]) || []).map((c, i) => (
            <th key={i}>{text(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {((p.rows as Value[][]) || []).map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{text(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));
registerComponent("Formula", ({ p }) => (
  <Suspense fallback={<code>{text(p.latex)}</code>}>
    <Formula latex={text(p.latex)} />
  </Suspense>
));
registerComponent("Chart", function ChartView({ p, emit }) {
  const select = useCallback((id: string) => emit("select", id), [emit]);
  return (
    <Suspense fallback={<p>{t.loading}</p>}>
      <Chart
        points={(p.points as Value[]) || []}
        kind={String(p.kind || "line")}
        label={text(p.label)}
        xDomain={p.xDomain as number[] | undefined}
        yDomain={p.yDomain as number[] | undefined}
        onSelect={select}
      />
    </Suspense>
  );
});
const emptyGraphItems: never[] = [];
registerComponent("Graph", ({ p, node, engine }) => {
  const inputNodes = (p.nodes as unknown as GraphNode[]) || emptyGraphItems;
  const inputEdges = (p.edges as unknown as GraphEdge[]) || emptyGraphItems;
  const nodes = node.children?.length ? [...inputNodes] : inputNodes;
  const edges = node.children?.length ? [...inputEdges] : inputEdges;
  const childEvents = useMemo(() => {
    const events = new Map<string, Scene["on"]>();
    const visit = (s: Scene) => {
      if (s.type === "Node") events.set(s.id, s.on);
      s.children?.forEach(visit);
    };
    node.children?.forEach(visit);
    return events;
  }, [node]);
  const select = useCallback(
    (id: string) =>
      engine.dispatch(
        [...(node.on?.select || []), ...(childEvents.get(id)?.select || [])],
        id,
        { interaction: "selection" },
      ),
    [engine, node, childEvents],
  );
  function collect(s: Scene, group = "") {
    const props = engine.props(s);
    if (s.visible !== undefined && !engine.evaluate(s.visible)) return;
    if (s.type === "Node")
      nodes.push({
        id: s.id,
        label: text(props.label),
        detail: text(props.detail),
        group,
        x: props.x as number | undefined,
        y: props.y as number | undefined,
        disabled: Boolean(props.disabled),
        status: props.status as GraphNode["status"],
      });
    if (s.type === "Edge")
      edges.push({
        from: text(props.from),
        to: text(props.to),
        label: text(props.label),
        active: props.active as boolean | undefined,
      });
    s.children?.forEach((child) =>
      collect(child, s.type === "Group" ? text(props.label) : group),
    );
  }
  node.children?.forEach((n) => collect(n));
  useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    if (
      ids.size !== nodes.length ||
      edges.some((e) => !ids.has(e.from) || !ids.has(e.to))
    )
      throw Error("Graph: duplicate ID or invalid edge");
  }, [nodes, edges]);
  return (
    <Graph
      nodes={nodes}
      edges={edges}
      layout={String(p.layout || "flow")}
      selected={text(p.selected)}
      active={(p.active as string[]) || emptyGraphItems}
      onSelect={select}
    />
  );
});
registerComponent("Node", ({ p, node, emit }) => (
  <button
    className="ki-node"
    disabled={Boolean(p.disabled)}
    data-status={text(p.status)}
    aria-busy={p.status === "running" || undefined}
    onClick={() => emit("select", node.id)}
  >
    <strong>{text(p.label)}</strong>
    {p.detail && <small>{text(p.detail)}</small>}
    {p.status && p.status !== "idle" && (
      <span className="ki-node-status">
        {
          (
            {
              running: en ? "Running" : "运行中",
              complete: en ? "Complete" : "已完成",
              error: en ? "Error" : "异常",
            } as Record<string, string>
          )[text(p.status)]
        }
      </span>
    )}
  </button>
));
registerComponent("Edge", ({ p }) => (
  <span>
    {text(p.from)} → {text(p.to)} {text(p.label)}
  </span>
));
registerComponent("Legend", ({ p }) => (
  <ul className="ki-legend">
    {((p.items as Value[]) || []).map((item, i) => (
      <li key={i}>{text(item)}</li>
    ))}
  </ul>
));
registerComponent("Tabs", function Tabs({ p, node, engine }) {
  const [selected, set] = useState(0);
  const id = useId();
  return (
    <div className="ki-tabs">
      <div role="tablist">
        {node.children?.map((s, i) => (
          <button
            key={s.id}
            id={`${id}-t${i}`}
            role="tab"
            aria-selected={selected === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={selected === i ? 0 : -1}
            onClick={() => set(i)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const len = node.children!.length;
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? len - 1
                      : (selected + (e.key === "ArrowRight" ? 1 : -1) + len) %
                        len;
                set(next);
                document.getElementById(`${id}-t${next}`)?.focus();
              }
            }}
          >
            {text(((p.labels as Value[]) || [])[i]) || s.id}
          </button>
        ))}
      </div>
      {node.children?.map((s, i) => (
        <div
          key={s.id}
          id={`${id}-p${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-t${i}`}
          hidden={selected !== i}
        >
          <View node={s} engine={engine} />
        </div>
      ))}
    </div>
  );
});
registerComponent("Stepper", ({ engine }) => (
  <div className="ki-steps">
    {engine.doc.steps?.map((s, i) => (
      <button
        key={s.id}
        aria-current={engine.step === i ? "step" : undefined}
        onClick={() => engine.dispatch([{ action: "goto", index: i }])}
      >
        {i + 1}. {s.title}
      </button>
    ))}
  </div>
));
registerComponent("PlaybackControl", ({ engine }) => (
  <div className="ki-playback">
    <button
      aria-label={t.prev}
      title={t.prev}
      disabled={engine.step === 0}
      onClick={() => engine.dispatch([{ action: "previous" }])}
    >
      <Icon name="previous" />
      <span className="ki-step-label">{t.prev}</span>
    </button>
    <button
      data-primary="true"
      onClick={() =>
        engine.dispatch([{ action: engine.playing ? "pause" : "play" }])
      }
    >
      <Icon name={engine.playing ? "pause" : "play"} />
      {engine.playing ? t.pause : t.play}
    </button>
    <button
      aria-label={t.next}
      title={t.next}
      disabled={engine.step === (engine.doc.steps?.length || 1) - 1}
      onClick={() => engine.dispatch([{ action: "next" }])}
    >
      <span className="ki-step-label">{t.next}</span>
      <Icon name="next" />
    </button>
    <label>
      <span className="ki-speed-label">{t.speed}</span>
      <SelectControl
        value={engine.speed}
        onChange={(e) => engine.setSpeed(Number(e.target.value))}
      >
        {[0.5, 1, 2, 4].map((n) => (
          <option key={n} value={n}>
            {n}×
          </option>
        ))}
      </SelectControl>
    </label>
  </div>
));
function View({ node, engine }: { node: Scene; engine: Engine }) {
  const emit = useCallback(
    (event: string, value: Value = null) =>
      engine.dispatch(node.on?.[event] || [], value, {
        interaction: event === "select" ? "selection" : "input",
      }),
    [node, engine],
  );
  if (node.visible !== undefined && !engine.evaluate(node.visible)) return null;
  const Renderer = renderers.get(node.type);
  if (!Renderer) throw Error("Unknown component " + node.type);
  return (
    <div className="ki-component" data-component={node.type}>
      <Renderer node={node} p={engine.props(node)} engine={engine} emit={emit}>
        {node.type !== "Tabs" &&
          node.type !== "Graph" &&
          node.children?.map((child) => (
            <View key={child.id} node={child} engine={engine} />
          ))}
      </Renderer>
    </div>
  );
}
class Boundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? (
      <p role="alert">{t.error}</p>
    ) : (
      this.props.children
    );
  }
}
function App({
  engine,
  host,
  onReady,
}: {
  engine: Engine;
  host: HTMLElement;
  onReady: () => void;
}) {
  useSyncExternalStore(engine.subscribe, engine.snapshot);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    host.dataset.playing = String(engine.playing);
  }, [engine.playing, host]);
  useEffect(() => {
    onReady();
    let ownedFullscreen = document.fullscreenElement === host;
    const change = () => {
      const active = document.fullscreenElement === host;
      setFullscreen(active);
      if (ownedFullscreen && !document.fullscreenElement)
        host
          .querySelector<HTMLButtonElement>(".ki-tools button:last-child")
          ?.focus();
      ownedFullscreen = active;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement === host) {
        event.preventDefault();
        void document.exitFullscreen().catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", change);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("fullscreenchange", change);
      document.removeEventListener("keydown", escape);
    };
  }, [host, onReady]);
  const step = engine.doc.steps?.[engine.step];
  return (
    <>
      <header className="ki-header">
        <div>
          <strong>{engine.doc.title}</strong>
          <p>{engine.doc.description}</p>
        </div>
        <div className="ki-tools">
          <button
            onClick={() => engine.reset()}
            aria-label={t.reset}
            title={t.reset}
          >
            <Icon name="reset" />
          </button>
          <button
            aria-label={fullscreen ? t.exit : t.full}
            title={fullscreen ? t.exit : t.full}
            onClick={async (e) => {
              const button = e.currentTarget;
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await host.requestFullscreen();
                button.focus();
              } catch {
                engine.error = en
                  ? "Fullscreen is unavailable in this browser."
                  : "此浏览器无法进入全屏。";
                engine.pause();
              }
            }}
          >
            <Icon name="expand" />
          </button>
        </div>
      </header>
      {engine.notice === "reset" && (
        <p className="ki-status" role="status">
          {en
            ? "Restored initial parameters, selection and view."
            : "已恢复初始参数、选中对象与视图。"}
        </p>
      )}
      {engine.error && (
        <p className="ki-error" role="alert">
          {engine.error}
        </p>
      )}
      {step && (
        <div className="ki-narration" aria-live="polite">
          <progress
            value={engine.step + 1}
            max={engine.doc.steps!.length}
            aria-label={en ? "Lesson progress" : "讲解进度"}
          />
          <strong>
            {t.step} {engine.step + 1} / {engine.doc.steps!.length} ·{" "}
            {step.title}
          </strong>
          <p>{step.description}</p>
        </div>
      )}
      <Boundary key={engine.resetRevision} onError={() => {}}>
        <View node={engine.doc.scene} engine={engine} />
      </Boundary>
    </>
  );
}
export function mount(host: HTMLElement, config: unknown) {
  const engine = new Engine(config, extensions);
  const target = host.querySelector<HTMLElement>("[data-ki-mount]")!;
  const fallback = host.querySelector<HTMLElement>("[data-ki-fallback]");
  const root = createRoot(target);
  const ready = () => {
    host.dataset.ready = "true";
    if (fallback instanceof HTMLDetailsElement) fallback.open = false;
    host.querySelector("[data-ki-loading]")?.remove();
  };
  const onError = () => {
    if (fallback) fallback.hidden = false;
    host.dataset.ready = "error";
  };
  root.render(
    <Boundary onError={onError}>
      <App engine={engine} host={host} onReady={ready} />
    </Boundary>,
  );
  const hidden = () => {
    if (document.hidden && engine.playing) engine.pause();
  };
  document.addEventListener("visibilitychange", hidden);
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting && engine.playing) engine.pause();
  });
  observer.observe(host);
  return () => {
    engine.destroy();
    observer.disconnect();
    document.removeEventListener("visibilitychange", hidden);
    root.unmount();
  };
}
