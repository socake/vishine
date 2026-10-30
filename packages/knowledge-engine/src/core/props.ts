import type { Value } from "../protocol/types";
type Spec = {
  minimum?: number;
  maximum?: number;
  minLength?: number;
  minItems?: number;
  maxItems?: number;
  type?: string;
  enum?: unknown[];
  items?: Spec;
  properties?: Record<string, Spec>;
  required?: string[];
  additionalProperties?: boolean;
};
export function checkProp(value: Value, spec: Spec, path: string): void {
  const fail = (message: string): never => {
    throw Error(path + ": " + message);
  };
  if (
    typeof value === "string" &&
    spec.minLength !== undefined &&
    value.length < spec.minLength
  )
    fail("文本不能为空");
  if (spec.enum && !spec.enum.includes(value)) fail("值不在允许范围内");
  if (spec.type === "array") {
    if (!Array.isArray(value)) fail("需要数组");
    const values = value as Value[];
    if (spec.minItems !== undefined && values.length < spec.minItems)
      fail("数组过短");
    if (spec.maxItems !== undefined && values.length > spec.maxItems)
      fail("数组过长");
    if (values.length > 2048) fail("数组超过2048项");
    if (spec.items)
      values.forEach((v, i) => checkProp(v, spec.items!, path + "/" + i));
    return;
  }
  if (spec.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail("需要对象");
    const object = value as Record<string, Value>;
    for (const k of spec.required || [])
      if (!Object.hasOwn(object, k)) fail("缺少字段 " + k);
    for (const [k, v] of Object.entries(object)) {
      if (spec.properties?.[k])
        checkProp(v, spec.properties[k], path + "/" + k);
      else if (spec.additionalProperties === false) fail("未知字段 " + k);
    }
    return;
  }
  if (spec.type && typeof value !== spec.type) fail("类型不匹配: " + spec.type);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("需要有限数字");
    if (spec.minimum !== undefined && value < spec.minimum)
      fail("数值低于下限 " + spec.minimum);
    if (spec.maximum !== undefined && value > spec.maximum)
      fail("数值超过上限 " + spec.maximum);
  }
}
