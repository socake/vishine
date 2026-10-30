import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { Engine } from "../src/core/engine";
import { extensions } from "../src/extensions";
let count = 0,
  failed = false;
async function visit(path: string) {
  if ((await stat(path)).isDirectory()) {
    for (const file of await readdir(path)) await visit(join(path, file));
    return;
  }
  if (!/\.(yaml|yml|json)$/.test(path)) return;
  try {
    const source = await readFile(path, "utf8");
    const config = path.endsWith(".json")
      ? JSON.parse(source)
      : parse(source, { maxAliasCount: 0, uniqueKeys: true });
    const engine = new Engine(config, extensions);
    for (let i = 0; i < (engine.doc.steps?.length || 0); i++) engine.move(i);
    engine.destroy();
    count++;
    console.log("PASS", path);
  } catch (error) {
    failed = true;
    console.error("FAIL", path, (error as Error).message);
  }
}
for (const path of process.argv.slice(2)) await visit(path);
if (!count && !failed) {
  console.error("Usage: npm run validate -- <file or directory>");
  process.exitCode = 1;
} else {
  console.log(`${count} configurations valid`);
  process.exitCode = failed ? 1 : 0;
}
