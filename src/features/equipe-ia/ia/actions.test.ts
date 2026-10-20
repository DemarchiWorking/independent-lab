import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/lib/db/types";
import { configPadrao, garantirConfig, lerConfig } from "./config";
import { criarTenant } from "./teste-ambiente-ia";

/**
 * As ações do admin da IA são a fronteira que importa: a tela só esconde o
 * botão, quem protege é o servidor. Cada caso chama a ação como um cliente
 * qualquer chamaria.
 */

const mocks = vi.hoisted(() => ({ sessao: null as Sessao | null, repo: null as unknown }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/auth/sessao", () => ({ lerSessao: async () => mocks.sessao }));
vi.mock("@/lib/db", () => ({ getRepository: () => mocks.repo }));

const { salvarConfigIA, rodarMelhoriaAgora, creditarSaldoDeTeste } = await import("./actions");

let pasta = "";
const anterior = process.env.GAMEHUB_DATA_DIR;
const anteriorAdmin = process.env.GAMEHUB_IA_ADMIN_EMAIL;

beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-acoes-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
  delete process.env.GAMEHUB_IA_ADMIN_EMAIL;
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.env.GAMEHUB_DATA_DIR = anterior;
  if (anteriorAdmin === undefined) delete process.env.GAMEHUB_IA_ADMIN_EMAIL;
  else process.env.GAMEHUB_IA_ADMIN_EMAIL = anteriorAdmin;
  await rm(pasta, { recursive: true, force: true });
});

const sessao = (email: string): Sessao => ({ usuarioId: "u1", tenantId: "a".repeat(24), nome: "Alguém", email });

function entrada(extra: Record<string, unknown> = {}) {
  const c = configPadrao();
  return {
    ativa: c.ativa,
    modo: c.modo,
    melhoriaContinua: c.melhoriaContinua,
    modeloUsuario: c.modeloUsuario,
    modeloLote: c.modeloLote,
    maxTokensSaida: c.maxTokensSaida,
    intervaloVarreduraMin: c.intervaloVarreduraMin,
    limites: { ...c.limites },
    ...extra,
  };
}

describe("salvarConfigIA", () => {
  it("sem sessão é recusado e nada muda", async () => {
    await garantirConfig();
    mocks.sessao = null;
    const r = await salvarConfigIA(entrada({ ativa: false }));
    expect(r.ok).toBe(false);
    expect((await lerConfig()).ativa).toBe(true);
  });

  it("qualquer e-mail que não seja o admin da IA é recusado, mesmo sendo admin dos eventos", async () => {
    await garantirConfig();
    process.env.GAMEHUB_ADMIN_EMAILS = "admin@gmail.com";
    for (const email of ["admin@gmail.com", "dono@padaria.com.br", "admin@admin.com.br", "ADMIN2@admin.com"]) {
      mocks.sessao = sessao(email);
      const r = await salvarConfigIA(entrada({ ativa: false }));
      expect(r.ok, email).toBe(false);
      expect(r.erro).toMatch(/permissão/);
    }
    expect((await lerConfig()).ativa).toBe(true);
    delete process.env.GAMEHUB_ADMIN_EMAILS;
  });

  it("o admin da IA salva, e a mudança fica no histórico com o e-mail de quem fez", async () => {
    await garantirConfig();
    mocks.sessao = sessao("Admin@Admin.com");
    const r = await salvarConfigIA(entrada({ ativa: false, limites: { ...configPadrao().limites, gastoMaxUsdDia: 1.5 } }));
    expect(r).toMatchObject({ ok: true });
    const c = await lerConfig();
    expect(c.ativa).toBe(false);
    expect(c.limites.gastoMaxUsdDia).toBe(1.5);
    expect(c.historico[0].por).toBe("Admin@Admin.com");
    expect(c.cobrarPorRequisicao).toBe(false);
  });

  it("o operador pode trocar quem é o admin da IA por variável de ambiente", async () => {
    await garantirConfig();
    process.env.GAMEHUB_IA_ADMIN_EMAIL = "dono@exemplo.com";
    mocks.sessao = sessao("admin@admin.com");
    expect((await salvarConfigIA(entrada({ ativa: false }))).ok).toBe(false);
    mocks.sessao = sessao("dono@exemplo.com");
    expect((await salvarConfigIA(entrada({ ativa: false }))).ok).toBe(true);
  });

  it("valor inválido, mesmo do admin, é recusado sem alterar a configuração", async () => {
    await garantirConfig();
    mocks.sessao = sessao("admin@admin.com");
    for (const ruim of [entrada({ modeloUsuario: "gpt-5" }), entrada({ modo: "creditos" }), entrada({ maxTokensSaida: 5 }), null, "texto", entrada({ cobrarPorRequisicao: true, ativa: "x" })]) {
      expect((await salvarConfigIA(ruim)).ok).toBe(false);
    }
    expect((await lerConfig()).historico).toEqual([]);
  });

  it("o admin não consegue ligar a cobrança por requisição enviando o campo", async () => {
    await garantirConfig();
    mocks.sessao = sessao("admin@admin.com");
    await salvarConfigIA(entrada({ cobrarPorRequisicao: true, ativa: false }));
    expect((await lerConfig()).cobrarPorRequisicao).toBe(false);
  });

  it("o toggle de créditos de API não liga sem o worker ter a chave; o modo continua assinatura", async () => {
    await garantirConfig();
    mocks.sessao = sessao("admin@admin.com");
    const r = await salvarConfigIA(entrada({ modo: "api" }));
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/créditos de API/);
    expect((await lerConfig()).modo).toBe("assinatura");
  });
});

describe("rodarMelhoriaAgora", () => {
  it("só o admin da IA dispara a varredura", async () => {
    const t = await criarTenant("Studio Acao", { cargos: ["documentador"] });
    mocks.repo = t.repo;
    await garantirConfig();
    mocks.sessao = sessao("jogador@exemplo.com");
    expect((await rodarMelhoriaAgora()).ok).toBe(false);
    mocks.sessao = sessao("admin@admin.com");
    const r = await rodarMelhoriaAgora();
    expect(r.ok).toBe(true);
    // sem worker vivo a varredura não enfileira nada, e diz por quê
    expect(r.varredura).toMatchObject({ pulou: "worker-parado" });
  });
});

describe("creditarSaldoDeTeste", () => {
  async function negocioReal() {
    const { FileRepository } = await import("@/lib/db/file-adapter");
    const { atributosVazios } = await import("@/lib/atributos");
    const repo = new FileRepository();
    const n = await repo.criarNegocio({
      nome: "Negócio do Admin",
      segmento: "tecnologia",
      cidadeSlug: "mendes",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      degrauAlvo: 1,
      xpInicial: 0,
      moedaVirtual: 100,
      atributosIniciais: atributosVazios(),
      perfilPublico: false,
      consentimentoVersao: "2026-10-20",
    });
    mocks.repo = repo;
    return { repo, tenantId: n.id };
  }

  it("o admin da IA recebe milhões de moedas, XP e degraus, pela porta de progressão", async () => {
    const { repo, tenantId } = await negocioReal();
    mocks.sessao = { ...sessao("admin@admin.com"), tenantId };
    const r = await creditarSaldoDeTeste();
    expect(r.ok).toBe(true);
    const n = await repo.lerNegocio(tenantId);
    expect(n?.moedaVirtual).toBe(5_000_100);
    expect(n?.degrauAtual).toBe(5);
    expect(n?.nivel).toBeGreaterThan(1);
  });

  it("quem não é o admin da IA é recusado e nada muda", async () => {
    const { repo, tenantId } = await negocioReal();
    mocks.sessao = { ...sessao("dono@padaria.com.br"), tenantId };
    expect((await creditarSaldoDeTeste()).ok).toBe(false);
    expect((await repo.lerNegocio(tenantId))?.moedaVirtual).toBe(100);
  });

  it("em produção é recusado até para o admin", async () => {
    const { repo, tenantId } = await negocioReal();
    mocks.sessao = { ...sessao("admin@admin.com"), tenantId };
    vi.stubEnv("NODE_ENV", "production");
    try {
      const r = await creditarSaldoDeTeste();
      expect(r.ok).toBe(false);
      expect(r.erro).toMatch(/produção/);
    } finally {
      vi.unstubAllEnvs();
    }
    expect((await repo.lerNegocio(tenantId))?.moedaVirtual).toBe(100);
  });

  it("sem sessão é recusado", async () => {
    mocks.sessao = null;
    expect((await creditarSaldoDeTeste()).ok).toBe(false);
  });
});
