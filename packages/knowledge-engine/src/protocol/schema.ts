import { components, propsSchemas, operators } from "./catalog";
const closed = (properties: object, required: string[] = []) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const expr = { $ref: "#/$defs/expression" },
  action = { $ref: "#/$defs/action" };
export const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://vishine.local/schemas/knowledge-v1",
  ...closed(
    {
      schemaVersion: { const: 1 },
      id: { type: "string", pattern: "^[a-z][a-z0-9-]{0,63}$" },
      title: { type: "string", minLength: 1, maxLength: 200 },
      description: { type: "string", minLength: 1, maxLength: 4000 },
      state: {
        type: "object",
        maxProperties: 64,
        additionalProperties: closed(
          {
            type: { enum: ["number", "string", "boolean"] },
            initial: { type: ["number", "string", "boolean"] },
            label: { type: "string", minLength: 1, maxLength: 100 },
            min: { type: "number" },
            max: { type: "number" },
            options: { type: "array", maxItems: 100 },
          },
          ["type", "initial"],
        ),
      },
      data: { type: "object" },
      derived: {
        type: "object",
        maxProperties: 64,
        additionalProperties: expr,
      },
      scene: { $ref: "#/$defs/scene" },
      steps: {
        type: "array",
        maxItems: 512,
        items: closed(
          {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            actions: { type: "array", maxItems: 32, items: action },
          },
          ["id", "title", "description", "actions"],
        ),
      },
    },
    ["schemaVersion", "id", "title", "description", "state", "scene"],
  ),
  $defs: {
    expression: {
      anyOf: [
        { type: ["number", "string", "boolean", "null"] },
        closed(
          {
            ref: {
              type: "string",
              pattern:
                "^(state|data|derived)\\.[a-zA-Z][a-zA-Z0-9_-]*$|^event\\.value$|^step$",
            },
          },
          ["ref"],
        ),
        closed(
          {
            op: { enum: operators },
            args: { type: "array", maxItems: 32, items: expr },
          },
          ["op", "args"],
        ),
      ],
    },
    action: {
      oneOf: [
        closed(
          { action: { const: "set" }, target: { type: "string" }, value: expr },
          ["action", "target", "value"],
        ),
        closed({ action: { const: "toggle" }, target: { type: "string" } }, [
          "action",
          "target",
        ]),
        closed(
          { action: { enum: ["reset", "next", "previous", "play", "pause"] } },
          ["action"],
        ),
        closed(
          { action: { const: "goto" }, index: { type: "integer", minimum: 0 } },
          ["action", "index"],
        ),
      ],
    },
    scene: {
      oneOf: Object.entries(components).map(([type, c]) =>
        closed(
          {
            id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_-]*$" },
            type: { const: type },
            props: propsSchemas[type],
            visible: expr,
            ...(c.children || type === "Graph"
              ? {
                  children: {
                    type: "array",
                    maxItems: type === "Workbench" ? 2 : 256,
                    ...(type === "Workbench" ? { minItems: 2 } : {}),
                    items: { $ref: "#/$defs/scene" },
                  },
                }
              : {}),
            ...(c.events
              ? {
                  on: closed(
                    Object.fromEntries(
                      c.events.map((event) => [
                        event,
                        { type: "array", maxItems: 16, items: action },
                      ]),
                    ),
                  ),
                }
              : {}),
          },
          [
            "id",
            "type",
            ...(type === "Workbench" ? ["children"] : []),
            ...(c.required?.length ? ["props"] : []),
          ],
        ),
      ),
    },
  },
};
