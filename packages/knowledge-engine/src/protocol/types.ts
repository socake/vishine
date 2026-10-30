export type Value =
  null | boolean | number | string | Value[] | { [key: string]: Value };
export type Expr =
  | null
  | boolean
  | number
  | string
  | { ref: string }
  | { op: string; args: Expr[] };
export type Bound = Value | { bind: Expr };
export type Action =
  | { action: "set"; target: string; value: Expr }
  | { action: "toggle"; target: string }
  | { action: "reset" | "next" | "previous" | "play" | "pause" }
  | { action: "goto"; index: number };
export interface StateSpec {
  label?: string;
  type: "number" | "string" | "boolean";
  initial: Value;
  min?: number;
  max?: number;
  options?: Value[];
}
export interface Scene {
  id: string;
  type: string;
  props?: Record<string, Bound>;
  children?: Scene[];
  on?: Record<string, Action[]>;
  visible?: Expr;
}
export interface Lesson {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  state: Record<string, StateSpec>;
  data?: Record<string, Value>;
  derived?: Record<string, Expr>;
  scene: Scene;
  steps?: {
    id: string;
    title: string;
    description: string;
    actions: Action[];
  }[];
}
export type Operator = (...args: Value[]) => Value;
