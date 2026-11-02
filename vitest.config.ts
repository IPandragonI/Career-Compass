import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // Vitest 5 transforme avec oxc (l’option esbuild est ignorée).
  oxc: { jsx: { runtime: "automatic" } },
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"] },
});
