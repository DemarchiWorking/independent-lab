import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nome: string) => (cookieStore.has(nome) ? { value: cookieStore.get(nome)! } : undefined),
    set: (nome: string, valor: string) => {
      cookieStore.set(nome, valor);
    },
    delete: (nome: string) => {
      cookieStore.delete(nome);
    },
  }),
  headers: async () => new Headers(),
}));

describe("lerSessao — validação de tenantId por driver (GH-WORLD)", () => {
  const secretOriginal = process.env.GAMEHUB_SECRET;
  const driverOriginal = process.env.GAMEHUB_DB;

  beforeEach(() => {
    cookieStore.clear();
    process.env.GAMEHUB_SECRET = "segredo-de-teste-com-mais-de-16-chars";
    vi.resetModules();
  });

  afterEach(() => {
    process.env.GAMEHUB_SECRET = secretOriginal;
    process.env.GAMEHUB_DB = driverOriginal;
  });

  it("aceita tenantId hexadecimal quando o driver ativo é file (o padrão de dev local)", async () => {
    process.env.GAMEHUB_DB = "file";
    const { criarSessao, lerSessao } = await import("./sessao");
    await criarSessao({ tenantId: "c599bcde14b3434d05f9be9c", usuarioId: "u1", nome: "Teste" } as never);

    const sessao = await lerSessao();
    expect(sessao?.tenantId).toBe("c599bcde14b3434d05f9be9c");
  });

  it("rejeita tenantId não-numérico quando o driver ativo é supabase", async () => {
    process.env.GAMEHUB_DB = "supabase";
    const { criarSessao, lerSessao } = await import("./sessao");
    await criarSessao({ tenantId: "c599bcde14b3434d05f9be9c", usuarioId: "u1", nome: "Teste" } as never);

    expect(await lerSessao()).toBeNull();
  });

  it("aceita tenantId numérico quando o driver ativo é supabase", async () => {
    process.env.GAMEHUB_DB = "supabase";
    const { criarSessao, lerSessao } = await import("./sessao");
    await criarSessao({ tenantId: "42", usuarioId: "u1", nome: "Teste" } as never);

    const sessao = await lerSessao();
    expect(sessao?.tenantId).toBe("42");
  });
});
