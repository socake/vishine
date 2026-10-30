import { checkProp } from "./props";
import validate from "../protocol/generated-validator.js";
import { components } from "../protocol/catalog";
import type {
  Action,
  Expr,
  Lesson,
  Operator,
  Scene,
  Value,
} from "../protocol/types";
const bad = new Set(["__proto__", "prototype", "constructor"]);
export class KnowledgeError extends Error {
  constructor(
    public path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
  }
}
const fail = (path: string, message: string): never => {
  throw new KnowledgeError(path, message);
};
export function safe(value: unknown, depth = 0): void {
  if (depth > 40) fail("/", "配置嵌套超过40层");
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (bad.has(k)) fail("/" + k, "禁止的属性名称");
      safe(v, depth + 1);
    }
  }
}
const number = (v: Value) => {
  if (typeof v !== "number" || !Number.isFinite(v))
    fail("/expression", "需要有限数字");
  return v as number;
};
const boolean = (value: Value): boolean => {
  if (typeof value !== "boolean") fail("/expression", "需要布尔值");
  return value as boolean;
};
export const baseOperators: Record<string, Operator> = {
  add: (a, b) => number(a) + number(b),
  subtract: (a, b) => number(a) - number(b),
  multiply: (a, b) => number(a) * number(b),
  divide: (a, b) => {
    if (number(b) === 0) fail("/expression", "除数不能为0");
    return number(a) / number(b);
  },
  eq: (a, b) => a === b,
  gt: (a, b) => number(a) > number(b),
  lt: (a, b) => number(a) < number(b),
  and: (a, b) => boolean(a) && boolean(b),
  or: (a, b) => boolean(a) || boolean(b),
  not: (a) => !boolean(a),
  if: (c, a, b) => (boolean(c) ? a : b),
  concat: (...args) =>
    args
      .map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x)))
      .join(""),
  get: (a, k) => {
    if (
      typeof k !== "string" ||
      bad.has(k) ||
      !a ||
      Array.isArray(a) ||
      typeof a !== "object" ||
      !Object.hasOwn(a, k)
    )
      fail("/expression", "无效字段");
    return (a as Record<string, Value>)[k as string];
  },
  at: (a, n) => {
    if (
      !Array.isArray(a) ||
      !Number.isInteger(n) ||
      number(n) < 0 ||
      number(n) >= a.length
    )
      fail("/expression", "索引越界");
    return (a as Value[])[n as number];
  },
  length: (a) => {
    if (!Array.isArray(a) && typeof a !== "string")
      fail("/expression", "需要数组或文本");
    return (a as Value[]).length;
  },
  round: (a) => Math.round(number(a) * 100) / 100,
};
const clone = <T>(v: T): T => structuredClone(v);
// Cached values are immutable; registered computations must be pure.
const freezeValue = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freezeValue);
  }
  return value;
};
export class Engine {
  readonly doc: Lesson;
  private initial: Record<string, Value>;
  private runBase: Record<string, Value>;
  private stepTargets = new Set<string>();
  resetRevision = 0;
  notice = "";
  state: Record<string, Value>;
  derived: Record<string, Value> = {};
  step = 0;
  playing = false;
  speed = 1;
  error = "";
  private timer: ReturnType<typeof setInterval> | undefined;
  private listeners = new Set<() => void>();
  private revision = 0;
  private order: string[] = [];
  private derivedRefs = new Map<string, string[]>();
  private derivedCache = new Map<string, { inputs: Value[]; value: Value }>();
  private propCache = new WeakMap<Scene, Record<string, Value>>();
  private destroyed = false;
  constructor(
    input: unknown,
    private operators: Record<string, Operator> = {},
  ) {
    safe(input);
    if (JSON.stringify(input).length > 500000) fail("/", "配置超过500KB");
    if (!validate(input)) {
      const errors = (
        validate as unknown as {
          errors: { instancePath: string; message: string }[];
        }
      ).errors;
      fail(
        errors?.[0]?.instancePath || "/",
        errors?.[0]?.message || "配置无效",
      );
    }
    this.doc = freezeValue(clone(input as Lesson));
    this.initial = Object.fromEntries(
      Object.entries(this.doc.state).map(([k, v]) => [k, v.initial]),
    );
    this.state = clone(this.initial);
    this.runBase = clone(this.initial);
    this.operators = { ...baseOperators, ...operators };
    this.validateState(this.state);
    this.compile();
    this.derived = this.calculate(this.state, 0);
    if (this.doc.steps?.length) this.move(0, false);
  }
  private refs(expr: Expr, out: string[] = []): string[] {
    if (expr && typeof expr === "object") {
      if ("ref" in expr) out.push(expr.ref);
      else {
        if (!this.operators[expr.op])
          fail("/expression", "未注册计算能力 " + expr.op);
        expr.args.forEach((x) => this.refs(x, out));
      }
    }
    return out;
  }
  private compile() {
    const d = this.doc.derived || {},
      visiting = new Set<string>(),
      done = new Set<string>();
    const check = (r: string) => {
      if (r === "step" || r === "event.value") return;
      const [scope, key] = r.split(".");
      if (
        !Object.hasOwn(
          scope === "state"
            ? this.doc.state
            : scope === "data"
              ? this.doc.data || {}
              : d,
          key,
        )
      )
        fail("/references", `引用不存在: ${r}`);
    };
    const visit = (key: string) => {
      if (done.has(key)) return;
      if (visiting.has(key)) fail("/derived/" + key, "派生状态循环");
      visiting.add(key);
      const refs = [...new Set(this.refs(d[key]))];
      this.derivedRefs.set(key, refs);
      for (const ref of refs) {
        check(ref);
        if (ref === "event.value")
          fail("/derived/" + key, "派生状态不能读取事件");
        if (ref.startsWith("derived.")) visit(ref.slice(8));
      }
      visiting.delete(key);
      done.add(key);
      this.order.push(key);
    };
    Object.keys(d).forEach(visit);
    const ids = new Set<string>();
    let count = 0;
    const walk = (s: Scene) => {
      if (++count > 512) fail("/scene", "组件超过512个");
      if (ids.has(s.id)) fail("/scene/" + s.id, "重复组件ID");
      ids.add(s.id);
      if (s.visible !== undefined) this.refs(s.visible).forEach(check);
      for (const v of Object.values(s.props || {}))
        if (v && typeof v === "object" && !Array.isArray(v) && "bind" in v)
          this.refs(v.bind as Expr).forEach(check);
      for (const actions of Object.values(s.on || {}))
        this.checkActions(actions, check);
      s.children?.forEach(walk);
    };
    walk(this.doc.scene);
    const steps = new Set<string>();
    this.doc.steps?.forEach((s, i) => {
      if (steps.has(s.id)) fail("/steps/" + i, "重复步骤ID");
      steps.add(s.id);
      this.checkActions(s.actions, check);
      s.actions.forEach((action) => {
        if ("target" in action) this.stepTargets.add(action.target);
      });
      if (s.actions.some((a) => !["set", "toggle"].includes(a.action)))
        fail("/steps/" + i, "步骤只允许set/toggle");
      for (const a of s.actions)
        if (a.action === "set" && this.refs(a.value).includes("event.value"))
          fail("/steps/" + i, "步骤不能读取事件");
    });
  }
  private checkActions(actions: Action[], check: (r: string) => void) {
    const targets = new Set<string>();
    for (const a of actions) {
      if ("target" in a) {
        if (!Object.hasOwn(this.doc.state, a.target))
          fail("/actions", "状态不存在 " + a.target);
        if (targets.has(a.target))
          fail("/actions", "一次事件不能重复写入同一状态");
        targets.add(a.target);
        if (
          a.action === "toggle" &&
          this.doc.state[a.target].type !== "boolean"
        )
          fail("/actions", "toggle只支持布尔状态");
      }
      if (a.action === "set") this.refs(a.value).forEach(check);
    }
    if (
      actions.some((a) => !["set", "toggle"].includes(a.action)) &&
      actions.length !== 1
    )
      fail("/actions", "播放控制动作必须单独执行");
  }
  private validateState(s: Record<string, Value>) {
    for (const [k, spec] of Object.entries(this.doc.state)) {
      const v = s[k];
      if (
        typeof v !== spec.type ||
        (typeof v === "number" &&
          (!Number.isFinite(v) ||
            (spec.min !== undefined && v < spec.min) ||
            (spec.max !== undefined && v > spec.max))) ||
        (spec.options && !spec.options.includes(v))
      )
        fail("/state/" + k, "值不符合类型或范围");
    }
  }
  evaluate(
    expr: Expr,
    state = this.state,
    derived = this.derived,
    event: Value = null,
    step = this.step,
    depth = 0,
  ): Value {
    if (depth > 30) fail("/expression", "表达式过深");
    if (expr === null || typeof expr !== "object") return expr;
    if ("ref" in expr) {
      if (expr.ref === "step") return step;
      if (expr.ref === "event.value") return event;
      const [scope, key] = expr.ref.split(".");
      return (
        scope === "state"
          ? state
          : scope === "derived"
            ? derived
            : this.doc.data || {}
      )[key];
    }
    const fn = this.operators[expr.op];
    if (!fn) fail("/expression", "未知操作符");
    const value = fn(
      ...expr.args.map((x) =>
        this.evaluate(x, state, derived, event, step, depth + 1),
      ),
    );
    if (typeof value === "number" && !Number.isFinite(value))
      fail("/expression", "计算产生非有限数字");
    return value;
  }
  private calculate(s: Record<string, Value>, step: number) {
    const out: Record<string, Value> = {};
    for (const k of this.order) {
      const inputs = this.derivedRefs
        .get(k)!
        .map((ref) => this.evaluate({ ref }, s, out, null, step));
      const cached = this.derivedCache.get(k);
      if (
        cached &&
        inputs.every((value, i) => Object.is(value, cached.inputs[i]))
      )
        out[k] = cached.value;
      else {
        out[k] = freezeValue(
          this.evaluate(this.doc.derived![k], s, out, null, step),
        );
        this.derivedCache.set(k, { inputs, value: out[k] });
      }
    }
    this.validateView(s, out, step);
    return out;
  }
  props(
    s: Scene,
    state = this.state,
    derived = this.derived,
    step = this.step,
  ): Record<string, Value> {
    const previous = this.propCache.get(s);
    const values: Record<string, Value> = {};
    let changed = !previous;
    for (const [key, v] of Object.entries(s.props || {})) {
      const value =
        v && typeof v === "object" && !Array.isArray(v) && "bind" in v
          ? this.evaluate(v.bind as Expr, state, derived, null, step)
          : (v as Value);
      if (!previous || !Object.is(previous[key], value)) {
        checkProp(
          value,
          components[s.type].props[key],
          "/scene/" + s.id + "/props/" + key,
        );
        changed = true;
      }
      values[key] = freezeValue(value);
    }
    if (!changed) return previous!;
    this.propCache.set(s, Object.freeze(values));
    return values;
  }

  private validateView(
    state: Record<string, Value>,
    derived: Record<string, Value>,
    step: number,
  ) {
    const visit = (s: Scene) => {
      this.props(s, state, derived, step);
      s.children?.forEach(visit);
    };
    visit(this.doc.scene);
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.revision;
  private emit() {
    this.revision++;
    this.listeners.forEach((f) => f());
  }
  private apply(
    actions: Action[],
    state: Record<string, Value>,
    step: number,
    event: Value = null,
  ) {
    if (actions.length === 0)
      return { state, derived: this.calculate(state, step) };
    const next = clone(state),
      derived =
        state === this.state && step === this.step
          ? this.derived
          : this.calculate(state, step);
    for (const a of actions) {
      if (a.action === "set")
        next[a.target] = this.evaluate(a.value, state, derived, event, step);
      if (a.action === "toggle") next[a.target] = !state[a.target];
    }
    this.validateState(next);
    return { state: next, derived: this.calculate(next, step) };
  }
  dispatch(
    actions: Action[],
    event: Value = null,
    options: { interaction?: "selection" | "input" } = {},
  ) {
    if (this.destroyed || actions.length === 0) return;
    try {
      this.checkActions(actions, () => {});
      const first = actions[0];
      if (first && !["set", "toggle"].includes(first.action)) {
        switch (first.action) {
          case "reset":
            this.reset();
            break;
          case "next":
            this.move(this.step + 1);
            break;
          case "previous":
            this.move(this.step - 1);
            break;
          case "goto":
            this.move(first.index);
            break;
          case "play":
            this.play();
            break;
          case "pause":
            this.pause();
            break;
        }
        return;
      }
      const { state: next, derived } = this.apply(
        actions,
        this.state,
        this.step,
        event,
      );
      if (options.interaction !== "selection") this.pause(false);
      for (const action of actions) {
        if ("target" in action && !this.stepTargets.has(action.target))
          this.runBase[action.target] = clone(next[action.target]);
      }
      this.state = next;
      this.derived = derived;
      this.notice =
        options.interaction === "selection" ? "selection" : "updated";
      this.error = "";
      this.emit();
    } catch (e) {
      this.error = (e as Error).message;
      this.emit();
    }
  }
  move(index: number, emit = true) {
    const steps = this.doc.steps || [];
    if (!steps.length) return;
    this.pause(false);
    index = Math.max(0, Math.min(index, steps.length - 1));
    let result = { state: clone(this.runBase), derived: this.derived };
    for (let i = 0; i <= index; i++)
      result = this.apply(steps[i].actions, result.state, i);
    this.state = result.state;
    this.step = index;
    if (emit) this.notice = "";
    this.derived = result.derived;
    this.error = "";
    if (emit) this.emit();
  }
  play() {
    if (this.playing || this.destroyed || !this.doc.steps?.length) return;
    if (this.step >= this.doc.steps.length - 1) this.move(0);
    this.playing = true;
    this.timer = setInterval(() => {
      try {
        const next = this.step + 1;
        this.move(next, false);
        if (next < this.doc.steps!.length - 1) this.play();
        this.emit();
      } catch (e) {
        this.pause(false);
        this.error = (e as Error).message;
        this.emit();
      }
    }, 1000 / this.speed);
    this.emit();
  }
  pause(emit = true) {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.playing = false;
    if (emit) this.emit();
  }
  setSpeed(speed: number) {
    this.speed = Math.max(0.25, Math.min(4, speed));
    const resume = this.playing;
    this.pause(false);
    if (resume) this.play();
    else this.emit();
  }
  reset() {
    this.pause(false);
    this.runBase = clone(this.initial);
    this.resetRevision++;
    this.speed = 1;
    this.notice = "reset";
    this.state = clone(this.initial);
    this.step = 0;
    this.derived = this.calculate(this.state, 0);
    if (this.doc.steps?.length) this.move(0, false);
    this.error = "";
    this.emit();
  }
  destroy() {
    this.pause(false);
    this.destroyed = true;
    this.listeners.clear();
  }
}
export { components };
