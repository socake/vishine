import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  base: "./",
  build: {
    outDir: "../../assets/knowledge-dist",
    emptyOutDir: true,
    manifest: "manifest.json",
    target: "es2022",
    rollupOptions: {
      input: fileURLToPath(new URL("./src/loader.ts", import.meta.url)),
      output: {
        entryFileNames: "loader-[hash].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "files/[name]-[hash][extname]",
      },
    },
  },
});
