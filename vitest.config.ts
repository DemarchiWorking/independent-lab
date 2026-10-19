import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Segredo só dos testes: o app não tem mais segredo padrão em nenhum modo.
    env: { GAMEHUB_SECRET: "segredo-de-teste-independent-lab-0123456789abcdef" },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@tokens": fileURLToPath(new URL("./design-system/tokens.ts", import.meta.url)),
    },
  },
});
