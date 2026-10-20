import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EstadoWorker } from "./contrato";
import { aplicarEdicaoAdmin, configPadrao, garantirConfig, lerConfig, MODELOS_PADRAO, normalizarConfig, type EdicaoAdmin } from "./config";
import { lerResultado, lerIdDePedido } from "./fila";

const AGORA = new Date("2026-10-20T12:00:00.000Z");

function edicao(extra: Partial<EdicaoAdmin> = {}): EdicaoAdmin {
  const c = configPadrao(AGORA);
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

function batimento(modos: Array<"api" | "assinatura">): EstadoWorker {
  return {
    contrato: 1,
    pid: 1,
    iniciadoEm: AGORA.toISOString(),
    batimentoEm: AGORA.toISOString(),
    versaoWorker: "1.0.0",
    modoConfigurado: "api",
    modosDisponiveis: modos,
    pausadoAte: null,
    motivoPausa: null,
    ocupadoCom: null,
    ultimo: null,
    hoje: { dia: "2026-10-20", jobs: 0, falhas: 0, entradaTokens: 0, saidaTokens: 0, custoUsd: 0 },
  };
}

describe("configuração padrão", () => {
  it("API como modo padrão, melhoria contínua ligada e cobrança por requisição desativada", () => {
    const c = configPadrao(AGORA);
    expect(c).toMatchObject({ ativa: true, modo: "api", melhoriaContinua: true, cobrarPorRequisicao: false, intervaloVarreduraMin: 60 });
    expect(c.modeloUsuario).toBe("claude-sonnet-5-5");
    expect(c.modeloLote).toBe("claude-haiku-5-5");
    expect(Object.keys(c.modelos)).toEqual(Object.keys(MODELOS_PADRAO));
  });

  it("lixo no arquivo volta ao padrão em vez de quebrar a tela do admin", () => {
    for (const lixo of [null, "x", 7, [], { modo: 9, limites: "a", ativa: "sim", modeloUsuario: "gpt-5", maxTokensSaida: -1 }]) {
      const c = normalizarConfig(lixo, AGORA);
      expect(c.modo).toBe("api");
      expect(c.ativa).toBe(true);
      expect(c.modeloUsuario).toBe("claude-sonnet-5-5");
      expect(c.maxTokensSaida).toBe(12_000);
    }
  });

  it("o arquivo não consegue ligar a cobrança nem mudar o preço de um modelo", () => {
    const c = normalizarConfig(
      { cobrarPorRequisicao: true, modelos: { "claude-haiku-5-5": { entradaUsdPorMTok: 0, saidaUsdPorMTok: 0, thinking: null } } },
      AGORA,
    );
    expect(c.cobrarPorRequisicao).toBe(false);
    expect(c.modelos["claude-haiku-5-5"].entradaUsdPorMTok).toBe(0.1);
  });

  it("valores fora da faixa voltam ao padrão, valores válidos são mantidos", () => {
    const c = normalizarConfig({ ativa: false, modo: "assinatura", maxTokensSaida: 20_000, limites: { jobsPorDia: 99_999, gastoMaxUsdDia: 12.5 } }, AGORA);
    expect(c).toMatchObject({ ativa: false, modo: "assinatura", maxTokensSaida: 20_000 });
    expect(c.limites.jobsPorDia).toBe(300);
    expect(c.limites.gastoMaxUsdDia).toBe(12.5);
  });
});

describe("edição pelo admin", () => {
  const atual = configPadrao(AGORA);
  const opcoes = (modos: Array<"api" | "assinatura"> = ["api"]) => ({ por: "admin@admin.com", agora: AGORA, batimento: batimento(modos) });

  it("aplica, registra no histórico quem mudou o quê e mantém a cobrança desativada", () => {
    const r = aplicarEdicaoAdmin(atual, edicao({ ativa: false, modeloLote: "claude-sonnet-5-5", limites: { ...atual.limites, gastoMaxUsdDia: 2 } }), opcoes());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.ativa).toBe(false);
      expect(r.config.cobrarPorRequisicao).toBe(false);
      expect(r.mudancas).toEqual(expect.arrayContaining(["IA desligada", expect.stringContaining("modelo da melhoria"), expect.stringContaining("teto de gasto")]));
      expect(r.config.historico).toHaveLength(1);
      expect(r.config.historico[0]).toMatchObject({ por: "admin@admin.com", em: AGORA.toISOString() });
      expect(r.config.atualizadoPor).toBe("admin@admin.com");
    }
  });

  it("sem mudança nenhuma, não cria linha de histórico", () => {
    const r = aplicarEdicaoAdmin(atual, edicao(), opcoes());
    expect(r.ok && r.mudancas).toEqual([]);
    expect(r.ok && r.config.historico).toEqual([]);
  });

  it("assinatura só com o worker dizendo que tem token, claude e a confirmação do operador", () => {
    const sem = aplicarEdicaoAdmin(atual, edicao({ modo: "assinatura" }), opcoes(["api"]));
    expect(sem.ok).toBe(false);
    expect(sem.ok === false && sem.erro).toMatch(/IA_PERMITIR_ASSINATURA/);
    expect(aplicarEdicaoAdmin(atual, edicao({ modo: "assinatura" }), { por: "x", agora: AGORA, batimento: null }).ok).toBe(false);
    expect(aplicarEdicaoAdmin(atual, edicao({ modo: "assinatura" }), opcoes(["api", "assinatura"])).ok).toBe(true);
  });

  it("voltar de assinatura para API é sempre permitido", () => {
    const emAssinatura = { ...atual, modo: "assinatura" as const };
    expect(aplicarEdicaoAdmin(emAssinatura, edicao({ modo: "api" }), { por: "x", agora: AGORA, batimento: null }).ok).toBe(true);
  });

  it("recusa valores inválidos, modelo fora da lista e tipos errados, sem alterar nada", () => {
    const ruins: Array<Partial<EdicaoAdmin>> = [
      { modeloUsuario: "gpt-5" },
      { modeloLote: "claude-opus-5-5\u0000" },
      { maxTokensSaida: 100 },
      { maxTokensSaida: 12.5 },
      { intervaloVarreduraMin: 5 },
      { limites: { ...atual.limites, gastoMaxUsdDia: -1 } },
      { limites: { ...atual.limites, jobsPorDia: 1e9 } },
      { limites: { ...atual.limites, refinosPorDocumento: 1.5 } },
      { ativa: "sim" as unknown as boolean },
      { modo: "creditos" as unknown as "api" },
    ];
    for (const r of ruins) expect(aplicarEdicaoAdmin(atual, edicao(r), opcoes()).ok, JSON.stringify(r)).toBe(false);
    expect(aplicarEdicaoAdmin(atual, null, opcoes()).ok).toBe(false);
  });

  it("o histórico guarda só as 20 últimas mudanças", () => {
    let c = atual;
    for (let i = 0; i < 25; i++) {
      const r = aplicarEdicaoAdmin(c, edicao({ ativa: !c.ativa, limites: { ...c.limites }, modo: c.modo }), opcoes());
      if (!r.ok) throw new Error(r.erro);
      c = r.config;
    }
    expect(c.historico).toHaveLength(20);
  });
});

describe("arquivo de configuração", () => {
  let pasta = "";
  const anterior = process.env.GAMEHUB_DATA_DIR;
  beforeEach(async () => {
    pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-cfg-"));
    process.env.GAMEHUB_DATA_DIR = pasta;
  });
  afterEach(async () => {
    process.env.GAMEHUB_DATA_DIR = anterior;
    await rm(pasta, { recursive: true, force: true });
  });

  it("garantirConfig cria o arquivo uma vez e não sobrescreve o que o admin gravou", async () => {
    const primeira = await garantirConfig();
    expect(primeira.modo).toBe("api");
    await mkdir(path.join(pasta, "ia"), { recursive: true });
    await writeFile(path.join(pasta, "ia", "config.json"), JSON.stringify({ ...primeira, ativa: false }));
    expect((await garantirConfig()).ativa).toBe(false);
    expect((await lerConfig()).ativa).toBe(false);
  });

  it("config ilegível abre com o padrão", async () => {
    await mkdir(path.join(pasta, "ia"), { recursive: true });
    await writeFile(path.join(pasta, "ia", "config.json"), "{quebrado");
    expect((await lerConfig()).modo).toBe("api");
  });
});

describe("conferência de resultado vindo da pasta", () => {
  const dono = "a".repeat(24);
  const id = `${dono}-canvas-0f0f0f0f`;
  const bom = () => ({
    contrato: 1,
    id,
    estado: "concluido",
    meta: { tenantId: dono, tipo: "canvas", contextoHash: "h", nivel: 2, rodada: 1, geradorVersao: 1, feedback: ["x"], reenvios: 0, prioridade: "usuario" },
    modelo: "claude-haiku-5-5",
    modo: "api",
    saida: { qualquer: "coisa" },
    uso: { entrada: 10, saida: 5 },
    custoUsd: 0.01,
    duracaoMs: 100,
    finalizadoEm: AGORA.toISOString(),
    motivo: null,
    mensagem: null,
  });

  it("aceita um resultado íntegro e descarta o feedback (não vem do worker)", () => {
    const r = lerResultado(bom(), id);
    expect(r).toMatchObject({ id, estado: "concluido", meta: { tenantId: dono, tipo: "canvas", feedback: null, prioridade: "usuario" } });
  });

  it("recusa id que não bate com o nome do arquivo, dono trocado e metadados inválidos", () => {
    expect(lerResultado({ ...bom(), id: "outro" }, id)).toBeNull();
    expect(lerResultado({ ...bom(), meta: { ...bom().meta, tenantId: "b".repeat(24) } }, id)).toBeNull();
    expect(lerResultado({ ...bom(), meta: { ...bom().meta, tipo: "pop" } }, id)).toBeNull();
    expect(lerResultado({ ...bom(), custoUsd: -1 }, id)).toBeNull();
    expect(lerResultado({ ...bom(), custoUsd: 1e9 }, id)).toBeNull();
    expect(lerResultado({ ...bom(), uso: { entrada: -5, saida: 1 } }, id)).toBeNull();
    expect(lerResultado({ ...bom(), modo: "creditos" }, id)).toBeNull();
    expect(lerResultado({ ...bom(), estado: "talvez" }, id)).toBeNull();
    expect(lerResultado(null, id)).toBeNull();
    expect(lerResultado("texto", id)).toBeNull();
  });

  it("o id do pedido é conferido contra o formato do app", () => {
    expect(lerIdDePedido(id)).toEqual({ tenantId: dono, tipo: "canvas" });
    for (const ruim of ["../x", `${dono}-canvas`, `${"z".repeat(24)}-canvas-0f0f0f0f`, `${dono}-virus-0f0f0f0f`, `${dono}-canvas-ZZZZZZZZ`]) {
      expect(lerIdDePedido(ruim)).toBeNull();
    }
  });
});
