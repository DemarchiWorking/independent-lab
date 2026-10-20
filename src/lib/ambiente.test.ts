import { describe, expect, it } from "vitest";
import { validarAmbiente } from "./ambiente";

const segredo = "a".repeat(40);
const prod = (extra: Record<string, string> = {}) =>
  ({ NODE_ENV: "production", GAMEHUB_SECRET: segredo, NEXT_PUBLIC_SITE_URL: "https://lab.exemplo.com", GAMEHUB_DATA_DIR: "/dados", ...extra }) as NodeJS.ProcessEnv;

describe("validarAmbiente", () => {
  it("configuração completa de produção não tem erro nem aviso de dados", () => {
    const r = validarAmbiente(prod({ GAMEHUB_ADMIN_EMAILS: "a@b.c", GAMEHUB_IA_ADMIN_EMAIL: "dono@exemplo.com" }));
    expect(r.erros).toEqual([]);
    expect(r.avisos).toEqual([]);
  });

  it("avisa que o admin da IA é o padrão e quando o cadastro de admin está liberado", () => {
    const base = { GAMEHUB_ADMIN_EMAILS: "a@b.c" };
    expect(validarAmbiente(prod(base)).avisos.join()).toMatch(/admin@admin\.com/);
    const liberado = validarAmbiente(prod({ ...base, GAMEHUB_IA_ADMIN_EMAIL: "x@y.z", GAMEHUB_LIBERAR_CADASTRO_ADMIN: "1" }));
    expect(liberado.avisos.join()).toMatch(/GAMEHUB_LIBERAR_CADASTRO_ADMIN/);
    expect(liberado.erros).toEqual([]);
  });

  it("credencial da Anthropic no ambiente do app: erro em produção, aviso em desenvolvimento", () => {
    for (const nome of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN"]) {
      const r = validarAmbiente(prod({ GAMEHUB_ADMIN_EMAILS: "a@b.c", [nome]: "segredo" }));
      expect(r.erros.join(), nome).toMatch(new RegExp(nome));
    }
    const dev = validarAmbiente({ NODE_ENV: "development", GAMEHUB_SECRET: segredo, ANTHROPIC_API_KEY: "k" } as NodeJS.ProcessEnv);
    expect(dev.erros).toEqual([]);
    expect(dev.avisos.join()).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("sem segredo, ou com segredo curto, recusa", () => {
    expect(validarAmbiente(prod({ GAMEHUB_SECRET: "" })).erros[0]).toMatch(/GAMEHUB_SECRET/);
    expect(validarAmbiente(prod({ GAMEHUB_SECRET: "curto" })).erros[0]).toMatch(/GAMEHUB_SECRET/);
  });

  it("produção exige URL pública com https", () => {
    expect(validarAmbiente(prod({ NEXT_PUBLIC_SITE_URL: "http://localhost:8081" })).erros.join()).toMatch(/https/);
  });

  it("driver inválido e supabase sem credenciais recusam", () => {
    expect(validarAmbiente(prod({ GAMEHUB_DB: "mongo" })).erros.join()).toMatch(/GAMEHUB_DB/);
    const r = validarAmbiente(prod({ GAMEHUB_DB: "supabase" }));
    expect(r.erros.filter((e) => e.includes("SUPABASE")).length).toBe(3);
  });

  it("modo arquivo sem pasta de dados avisa, mas não recusa", () => {
    const env = prod();
    delete env.GAMEHUB_DATA_DIR;
    const r = validarAmbiente(env);
    expect(r.erros).toEqual([]);
    expect(r.avisos.join()).toMatch(/GAMEHUB_DATA_DIR/);
  });
});
