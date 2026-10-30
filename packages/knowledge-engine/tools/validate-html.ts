import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { Engine } from "../src/core/engine";
import { extensions } from "../src/extensions";
let count = 0;
const seen = new Set<string>();
async function visit(path: string): Promise<void> {
  if ((await stat(path)).isDirectory()) {
    for (const file of await readdir(path)) await visit(join(path, file));
    return;
  }
  if (!path.endsWith(".html")) return;
  const html = await readFile(path, "utf8");
  for (const match of html.matchAll(
    /<script\b[^>]*data-ki-config[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    if (seen.has(match[1])) continue;
    seen.add(match[1]);
    try {
      const e = new Engine(JSON.parse(match[1]), extensions);
      for (let i = 0; i < (e.doc.steps?.length || 0); i++) e.move(i);
      e.destroy();
      count++;
    } catch (error) {
      throw Error(`${path}: ${(error as Error).message}`);
    }
  }
}
if (!process.argv[2])
  throw Error("Usage: npm run validate:html -- /path/to/hugo/public");
await visit(process.argv[2]);
console.log(`PASS: ${count} distinct rendered lesson configurations validated`);
