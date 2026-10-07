import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: file("./web/"),
  publicDir: file("../public/"),
  plugins: [react()],
  resolve: {
    alias: [
      { find: "next/navigation", replacement: file("./web/compat/navigation.ts") },
      { find: "next/link", replacement: file("./web/compat/link.tsx") },
      { find: "next/image", replacement: file("./web/compat/image.tsx") },
      { find: "@/lib/http", replacement: file("./web/http.ts") },
      { find: "@/lib/speech", replacement: file("./web/speech.ts") },
      { find: "@", replacement: file("../src/") },
    ],
    dedupe: ["react", "react-dom"],
  },
  // Only public endpoint settings are embedded; never load AI credentials.
  define: {
    "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(process.env.NATIVE_API_URL || "https://cook-api.corerevive.cn/api/v1"),
    "process.env.NEXT_PUBLIC_API_BASE": JSON.stringify(process.env.NATIVE_API_URL || "https://cook-api.corerevive.cn/api/v1"),
    "process.env.NEXT_PUBLIC_RECIPE_AGENT_URL": JSON.stringify("https://cook.corerevive.cn/api/client/recipe-chef"),
    "process.env.NEXT_PUBLIC_RECIPE_FINDER_AGENT_URL": JSON.stringify("https://cook.corerevive.cn/api/client/recipe-finder"),
    "process.env.NEXT_PUBLIC_USE_MOCK": JSON.stringify("false"),
  },
  css: { postcss: file("../") },
  server: { host: "127.0.0.1", port: 4178, strictPort: true, fs: { allow: [file("../")] } },
  build: { outDir: file("./dist/"), emptyOutDir: true, target: ["es2022", "safari16"] },
});
