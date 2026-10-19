import { describe, expect, it } from "vitest";
import { validarAmbiente } from "./ambiente";

const segredo = "a".repeat(40);
const prod = (extra: Record<string, string> = {}) =>
  ({ NODE_ENV: "production", GAMEHUB_SECRET: segredo, NEXT_PUBLIC_SITE_URL: "https://lab.exemplo.com", GAMEHUB_DATA_DIR: "/dados", ...extra }) as NodeJS.ProcessEnv;

describe("validarAmbiente", () => {
  it("configuração completa de produção não tem erro nem aviso de dados", () => {
    const r = validarAmbiente(prod({ GAMEHUB_ADMIN_EMAILS: "a@b.c" }));
    expect(r.erros).toEqual([]);
    expect(r.avisos).toEqual([]);
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
