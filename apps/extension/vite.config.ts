import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  envDir: resolve(__dirname, "../.."),
  publicDir: "public",
  build: {
    outDir: "dist", emptyOutDir: true,
    rollupOptions: {
      input: { popup: resolve(__dirname, "popup.html"), background: resolve(__dirname, "src/background/index.ts"), blockScreen: resolve(__dirname, "src/content/blockScreen.ts") },
      output: {
        entryFileNames: chunk => chunk.name === "background" ? "src/background.js" : chunk.name === "blockScreen" ? "src/content/blockScreen.js" : "assets/[name]-[hash].js",
        chunkFileNames: "src/chunks/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
