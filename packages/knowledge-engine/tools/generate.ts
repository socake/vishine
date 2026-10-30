import Ajv from "ajv/dist/2020.js";
import standalone from "ajv/dist/standalone/index.js";
import { writeFile, mkdir } from "node:fs/promises";
import { schema } from "../src/protocol/schema";
import { components, operators, actions } from "../src/protocol/catalog";
const ajv = new Ajv({
  strict: false,
  inlineRefs: false,
  discriminator: true,
  allErrors: true,
  code: { source: true, esm: true, lines: true },
  allowUnionTypes: true,
});
await mkdir("schemas", { recursive: true });
await writeFile(
  "schemas/knowledge-v1.schema.json",
  JSON.stringify(schema, null, 2) + "\n",
);
await writeFile(
  "schemas/components.json",
  JSON.stringify(
    {
      engineVersion: "0.1.0",
      status: "experimental",
      schemaVersion: 1,
      components,
      operators,
      actions,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "src/protocol/generated-validator.js",
  standalone(
    ajv,
    ajv.compile({
      ...schema,
      $defs: {
        ...schema.$defs,
        scene: {
          ...schema.$defs.scene,
          discriminator: { propertyName: "type" },
        },
      },
    }),
  ).replaceAll(
    'require("ajv/dist/runtime/ucs2length").default',
    "(str => Array.from(str).length)",
  ),
);

let docs =
  "# 已注册组件（experimental v0.1）\n\n本清单由 catalog.ts 生成。注册表示可实例化，不代表完整无障碍与所有组合均已验收。具体结果见 ACCEPTANCE.md。所有属性可使用绑定；缺省值由实现提供，推荐作者显式填写内容和控件范围。\n";
for (const [name, entry] of Object.entries(components)) {
  docs += `\n## ${name}\n\n${entry.description}。${entry.children ? "允许子组件。" : ""}\n\n属性：${Object.keys(entry.props).join("、") || "无"}。事件：${entry.events?.join("、") || "无"}。\n`;
}
await writeFile("../../docs/interactive/COMPONENTS.md", docs);
