import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // O tsconfig usa `jsx: preserve` (o Next faz a transformação). No Vitest o
  // transformador (oxc, no Vite atual) precisa converter o JSX, senão qualquer
  // teste que importe um .tsx falha.
  oxc: { jsx: { runtime: "automatic" } },
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
