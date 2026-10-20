import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ciclo } from "../../../../ia-worker/worker.mjs";
import type { Sessao } from "@/lib/db/types";
import { gravarConfig } from "@/features/equipe-ia/ia/config";
import { bemComportado, criarTenant, esvaziarFila, garantirConfigDeTeste as garantirConfig, MODOS, servidorApi, usarModo, worker } from "@/features/equipe-ia/ia/teste-ambiente-ia";

/**
 * Rota `/api/ia/[tipo]` e a rota de entregáveis servindo a versão de IA, com
 * repositório real em arquivos, worker real e a API da Anthropic simulada.
 */

const mocks = vi.hoisted(() => ({ sessao: null as Sessao | null, repo: null as unknown }));

vi.mock("@/lib/auth/sessao", () => ({ lerSessao: async () => mocks.sessao }));
vi.mock("@/lib/db", () => ({ getRepository: () => mocks.repo }));

const rotaIA = await import("./[tipo]/route");
const rotaEntregavel = await import("../entregavel/[tipo]/route");

let pasta = "";
const anterior = process.env.GAMEHUB_DATA_DIR;

beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-rota-ia-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.env.GAMEHUB_DATA_DIR = anterior;
  await rm(pasta, { recursive: true, force: true });
});

async function cenario(nome = "Studio Bela Cabelos", opcoes: Parameters<typeof criarTenant>[1] = {}) {
  const t = await criarTenant(nome, opcoes);
  mocks.repo = t.repo;
  mocks.sessao = { usuarioId: "u1", tenantId: t.tenantId, nome: "Dono", email: "dono@teste.com" };
  await garantirConfig();
  return t;
}

const params = (tipo: string) => ({ params: Promise.resolve({ tipo }) });
const get = (tipo: string) => rotaIA.GET(new Request(`http://localhost/api/ia/${tipo}`), params(tipo));
const post = (tipo: string, corpo: unknown, cabecalhos: Record<string, string> = {}) =>
  rotaIA.POST(
    new Request(`http://localhost/api/ia/${tipo}`, {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", ...cabecalhos },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
    params(tipo),
  );

describe.each(MODOS)("[modo %s]", (modo) => {
  beforeEach(() => usarModo(modo));

describe("acesso", () => {
  it("sem login é 401; material desconhecido é 404; sem o funcionário contratado é 403", async () => {
    await cenario();
    mocks.sessao = null;
    expect((await get("canvas")).status).toBe(401);
    mocks.sessao = { usuarioId: "u1", tenantId: "a".repeat(24), nome: "x", email: "x@x.com" };
    expect((await get("segredos")).status).toBe(404);
    expect((await get("canvas")).status).toBe(403);
  });

  it("o negócio vem da sessão: tenantId no corpo ou na URL é ignorado", async () => {
    const a = await cenario("Studio A");
    const b = await criarTenant("Studio B");
    const r = await post("canvas", { acao: "pedir", tenantId: b.tenantId });
    expect(r.status).toBe(200);
    // o pedido foi feito para A (sessão), nunca para B
    const { listarIds } = await import("@/features/equipe-ia/ia/fila");
    const ids = await listarIds("pendente");
    expect(ids).toHaveLength(1);
    expect(ids[0].startsWith(a.tenantId)).toBe(true);
  });

  it("POST de outro site é 403 e não enfileira nada", async () => {
    await cenario();
    const r = await post("canvas", { acao: "pedir" }, { "sec-fetch-site": "cross-site", origin: "https://golpe.example" });
    expect(r.status).toBe(403);
    const { listarIds } = await import("@/features/equipe-ia/ia/fila");
    expect(await listarIds("pendente")).toEqual([]);
  });

  it("corpo inválido é 400, grande demais é 413, ação desconhecida é 400", async () => {
    await cenario();
    expect((await post("canvas", "{quebrado")).status).toBe(400);
    expect((await post("canvas", [1, 2])).status).toBe(400);
    expect((await post("canvas", { acao: "x".repeat(2000) })).status).toBe(413);
    expect((await post("canvas", { acao: "apagar-tudo" })).status).toBe(400);
  });

  it("respostas nunca vão para cache de proxy", async () => {
    await cenario();
    expect((await get("canvas")).headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("consentimento e pedido", () => {
  it("quem não autorizou a IA recebe 409 até autorizar; autorizar e revogar", async () => {
    await cenario("Padaria Antiga", { consentir: false });
    const inicial = (await (await get("canvas")).json()) as { consentido: boolean };
    expect(inicial.consentido).toBe(false);

    const recusado = await post("canvas", { acao: "pedir" });
    expect(recusado.status).toBe(409);
    expect(recusado.headers.get("x-motivo")).toBe("sem-consentimento");

    const autorizado = (await (await post("canvas", { acao: "autorizar" })).json()) as { consentido: boolean };
    expect(autorizado.consentido).toBe(true);
    expect((await post("canvas", { acao: "pedir" })).status).toBe(200);

    const revogado = (await (await post("canvas", { acao: "revogar" })).json()) as { consentido: boolean };
    expect(revogado.consentido).toBe(false);
  });

  it("chave geral desligada responde 503 com o motivo; teto diário responde 429", async () => {
    await cenario();
    const c = await garantirConfig();
    await gravarConfig({ ...c, ativa: false });
    const off = await post("canvas", { acao: "pedir" });
    expect(off.status).toBe(503);
    expect(off.headers.get("x-motivo")).toBe("desativada");

    await gravarConfig({ ...c, ativa: true, limites: { ...c.limites, pedidosPorNegocioDia: 0 } });
    expect((await post("canvas", { acao: "pedir" })).status).toBe(429);
  });

  it("pedido repetido não duplica e o estado mostra a fila", async () => {
    await cenario();
    await post("canvas", { acao: "pedir" });
    const de_novo = (await (await post("canvas", { acao: "pedir" })).json()) as { jaEstava: boolean; estado: { fila: { estado: string; posicao: number } } };
    expect(de_novo.jaEstava).toBe(true);
    expect(de_novo.estado.fila).toEqual({ estado: "na-fila", posicao: 1 });
  });
});

describe("do pedido à entrega ao usuário", () => {
  it("o usuário pede, o worker processa, e a rota de entregáveis passa a servir a versão de IA em HTML, Markdown e JSON", async () => {
    await cenario();
    const srv = await servidorApi(bemComportado);
    try {
      const est = worker(srv.url);
      expect((await post("canvas", { acao: "pedir" })).status).toBe(200);
      await esvaziarFila(est);

      // a própria consulta de estado recolhe o resultado (não espera o agendador)
      const estado = (await (await get("canvas")).json()) as { versao: { n: number } | null; fila: { estado: string }; workerVivo: boolean };
      expect(estado.versao?.n).toBe(1);
      expect(estado.fila.estado).toBe("nenhum");
      expect(estado.workerVivo).toBe(true);

      const pedir = (saida: string) => rotaEntregavel.GET(new Request(`http://localhost/api/entregavel/canvas?saida=${saida}`), params("canvas"));
      const html = await (await pedir("html")).text();
      expect(html).toContain("Suas três prioridades desta semana");
      expect(html).toMatch(/refinado por IA/i);
      expect(await (await pedir("md")).text()).toContain("Suas três prioridades desta semana");
      const json = (await (await pedir("json")).json()) as { meta: { geradoPor: string; versaoIA: number } };
      expect(json.meta).toMatchObject({ geradoPor: "ia", versaoIA: 1 });
    } finally {
      await srv.fechar();
    }
  });

  it("carrossel de IA vale também para o PNG e o ZIP", async () => {
    await cenario();
    const srv = await servidorApi(bemComportado);
    try {
      const est = worker(srv.url);
      await post("carrossel", { acao: "pedir" });
      await esvaziarFila(est);
      await get("carrossel");
      const png = await rotaEntregavel.GET(new Request("http://localhost/api/entregavel/carrossel?saida=png&pauta=dicas&slide=1&formato=quadrado&tema=escuro"), params("carrossel"));
      expect(png.status).toBe(200);
      expect(png.headers.get("content-type")).toBe("image/png");
      const json = (await (await rotaEntregavel.GET(new Request("http://localhost/api/entregavel/carrossel?saida=json"), params("carrossel"))).json()) as { pacote: { meta: { geradoPor: string } } };
      expect(json.pacote.meta.geradoPor).toBe("ia");
    } finally {
      await srv.fechar();
    }
  });

  it("se a camada de IA falhar, o usuário continua recebendo o material de regras", async () => {
    const t = await cenario();
    // registro corrompido no disco: a IA nunca pode derrubar a entrega
    const fs = await import("node:fs/promises");
    await fs.mkdir(path.join(pasta, "tenants", t.tenantId, "ia"), { recursive: true });
    await fs.writeFile(path.join(pasta, "tenants", t.tenantId, "ia", "canvas.json"), "{quebrado");
    const r = await rotaEntregavel.GET(new Request("http://localhost/api/entregavel/canvas?saida=json"), params("canvas"));
    expect(r.status).toBe(200);
    expect(((await r.json()) as { secoes: unknown[] }).secoes.length).toBeGreaterThan(3);
  });

  it("resultado velho de outro estado dos dados não é servido: o worker ocioso não muda o que o usuário vê", async () => {
    await cenario();
    const srv = await servidorApi(bemComportado);
    try {
      const est = worker(srv.url);
      await ciclo(est);
      const antes = (await (await rotaEntregavel.GET(new Request("http://localhost/api/entregavel/canvas?saida=json"), params("canvas"))).json()) as { meta: { geradoPor?: string } };
      expect(antes.meta.geradoPor).toBeUndefined();
    } finally {
      await srv.fechar();
    }
  });
});

  describe("primeira geração automática", () => {
    it("abrir o material de quem autorizou já enfileira a geração, e o estado mostra a fila", async () => {
      await cenario();
      const { listarIds } = await import("@/features/equipe-ia/ia/fila");
      const estado = (await (await get("canvas")).json()) as { fila: { estado: string; posicao: number }; versao: unknown };
      expect(estado.fila).toEqual({ estado: "na-fila", posicao: 1 });
      expect(estado.versao).toBeNull();
      expect(await listarIds("pendente")).toHaveLength(1);
      // consultar de novo (a tela consulta a cada 5 s) não duplica
      await get("canvas");
      expect(await listarIds("pendente")).toHaveLength(1);
    });

    it("quem não autorizou não tem nada enfileirado ao abrir; autorizar já inicia a geração", async () => {
      await cenario("Padaria Nova", { consentir: false });
      const { listarIds } = await import("@/features/equipe-ia/ia/fila");
      expect(((await (await get("canvas")).json()) as { consentido: boolean }).consentido).toBe(false);
      expect(await listarIds("pendente")).toEqual([]);

      const depois = (await (await post("canvas", { acao: "autorizar" })).json()) as { consentido: boolean; fila: { estado: string } };
      expect(depois.consentido).toBe(true);
      expect(depois.fila.estado).toBe("na-fila");
      expect(await listarIds("pendente")).toHaveLength(1);
    });
  });

});
