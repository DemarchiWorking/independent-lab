import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CATALOGO_CONTRATOS, contratoPorId, RENDA_SEMANAL_MAXIMA } from "./catalogo";
import { situacaoDosContratos, validarConclusao } from "./motor";
import { cicloDoNegocio, diasParaProximaSemana, periodoDe, semanaIso } from "./periodo";
import { EVENTOS, MOEDA_INICIAL } from "@/features/gamificacao/engine";
import { CARGOS_IA, cargoPorId } from "@/features/equipe-ia/catalogo";
import { atributosVazios } from "@/lib/atributos";
import type { Evidencia } from "./tipos";
import type { ContratoConcluido } from "@/lib/db/types";

// Segunda-feira 2026-10-19 12:00 em Brasília = 15:00Z
const SEG = "2026-10-19T15:00:00.000Z";
const CADASTRO = "2026-10-01T15:00:00.000Z";

const evidenciaBase: Evidencia = {
  ofertasCriadasEm: [],
  tamanhoEquipe: 0,
  degrauAtual: 1,
  degrauAlvo: 3,
};

function feito(contratoId: string, periodo: string, valor: number | null = null): ContratoConcluido {
  return { id: "x", tenantId: "t", contratoId, periodo, valor, concluidoEm: SEG };
}

describe("períodos", () => {
  it("a semana vira na segunda 00h de Brasília, não 00h UTC", () => {
    // domingo 23h59 em Brasília = segunda 02h59Z → ainda a semana ANTERIOR
    expect(semanaIso("2026-10-19T02:59:00.000Z")).toBe("2026-W42");
    // segunda 00h00 em Brasília = 03h00Z → semana nova
    expect(semanaIso("2026-10-19T03:00:00.000Z")).toBe("2026-W43");
  });

  it("virada de ano usa a semana ISO (quinta decide o ano)", () => {
    expect(semanaIso("2026-01-01T15:00:00.000Z")).toBe("2026-W01");
    expect(semanaIso("2025-12-29T15:00:00.000Z")).toBe("2026-W01");
  });

  it("dias para renovar: segunda = 7, domingo = 1", () => {
    expect(diasParaProximaSemana(SEG)).toBe(7);
    expect(diasParaProximaSemana("2026-10-25T15:00:00.000Z")).toBe(1);
  });

  it("ciclo de 90 dias a partir do cadastro", () => {
    expect(cicloDoNegocio(CADASTRO, "2026-10-02T00:00:00.000Z")).toBe(1);
    expect(cicloDoNegocio(CADASTRO, "2026-12-29T15:00:00.000Z")).toBe(1); // dia 89
    expect(cicloDoNegocio(CADASTRO, "2026-12-30T15:00:00.000Z")).toBe(2); // dia 90
  });

  it("periodoDe respeita a cadência", () => {
    expect(periodoDe("unico", CADASTRO, SEG)).toBe("unico");
    expect(periodoDe("semanal", CADASTRO, SEG)).toBe("2026-W43");
    expect(periodoDe("ciclo90", CADASTRO, SEG)).toBe("ciclo-1");
  });
});

describe("situação dos contratos", () => {
  const sit = (
    concluidos: ContratoConcluido[],
    ev: Partial<Evidencia> = {},
    agora = SEG,
  ) =>
    situacaoDosContratos(
      CATALOGO_CONTRATOS,
      concluidos,
      { ...evidenciaBase, ...ev },
      CADASTRO,
      agora,
    );
  const de = (lista: ReturnType<typeof sit>, id: string) =>
    lista.find((s) => s.contrato.id === id)!;

  it("começa com os contratos livres disponíveis e os dependentes travados", () => {
    const s = sit([]);
    expect(de(s, "vendas-semana").status).toBe("disponivel");
    expect(de(s, "clientes-semana").status).toBe("disponivel");
    expect(de(s, "oferta-semana").status).toBe("pendente");
    expect(de(s, "entregavel-semana").status).toBe("bloqueado");
    expect(de(s, "retro-90d").status).toBe("bloqueado");
  });

  it("oferta publicada NESTA semana libera o contrato; a de semana passada não", () => {
    const velha = sit([], { ofertasCriadasEm: ["2026-10-10T15:00:00.000Z"] });
    expect(de(velha, "oferta-semana").status).toBe("pendente");
    const nova = sit([], { ofertasCriadasEm: ["2026-10-19T13:00:00.000Z"] });
    expect(de(nova, "oferta-semana").status).toBe("disponivel");
  });

  it("concluído na semana vira concluído e renova na seguinte", () => {
    const f = feito("vendas-semana", "2026-W43", 7);
    expect(de(sit([f]), "vendas-semana").status).toBe("concluido");
    expect(de(sit([f]), "vendas-semana").valor).toBe(7);
    const proxima = sit([f], {}, "2026-10-26T15:00:00.000Z");
    expect(de(proxima, "vendas-semana").status).toBe("disponivel");
  });

  it("contrato único nunca renova", () => {
    const f = feito("diagnostico", "unico");
    expect(de(sit([f], {}, "2027-06-01T15:00:00.000Z"), "diagnostico").status).toBe(
      "concluido",
    );
  });

  it("equipe contratada destrava o entregável; alvo alcançado destrava a retro", () => {
    expect(de(sit([], { tamanhoEquipe: 1 }), "entregavel-semana").status).toBe("disponivel");
    expect(de(sit([], { degrauAtual: 3 }), "retro-90d").status).toBe("disponivel");
  });
});

describe("validação de pagamento (única porta de entrada)", () => {
  const v = (id: string, valor: unknown, concluidos: ContratoConcluido[] = [], ev: Partial<Evidencia> = {}) =>
    validarConclusao(
      contratoPorId(id)!,
      concluidos,
      { ...evidenciaBase, ...ev },
      CADASTRO,
      SEG,
      valor,
    );

  it("contrato com número exige inteiro dentro do limite", () => {
    for (const ruim of [undefined, -1, 1.5, "7", 10_000, Number.NaN]) {
      expect(v("vendas-semana", ruim).ok, String(ruim)).toBe(false);
    }
    expect(v("vendas-semana", 0)).toEqual({ ok: true, periodo: "2026-W43", valor: 0 });
    expect(v("vendas-semana", 12)).toEqual({ ok: true, periodo: "2026-W43", valor: 12 });
  });

  it("não paga duas vezes no mesmo período", () => {
    const r = v("vendas-semana", 5, [feito("vendas-semana", "2026-W43", 5)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/já cumprido/);
  });

  it("não paga contrato sem a prova (oferta) nem sem o requisito (equipe)", () => {
    expect(v("oferta-semana", undefined).ok).toBe(false);
    expect(v("entregavel-semana", undefined).ok).toBe(false);
    expect(v("entregavel-semana", undefined, [], { tamanhoEquipe: 2 }).ok).toBe(true);
  });

  it("contrato declarado sem número ignora qualquer valor enviado pelo cliente", () => {
    const r = v("diagnostico", 999999);
    expect(r).toEqual({ ok: true, periodo: "unico", valor: null });
  });
});

describe("catálogo e economia", () => {
  it("ids únicos e recompensas positivas", () => {
    const ids = CATALOGO_CONTRATOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CATALOGO_CONTRATOS) {
      expect(c.recompensa.moeda, c.id).toBeGreaterThan(0);
      expect(c.recompensa.xp, c.id).toBeGreaterThan(0);
    }
  });

  it("diagnóstico e retro leem a recompensa do motor de eventos (fonte única)", () => {
    expect(contratoPorId("diagnostico")!.recompensa.moeda).toBe(EVENTOS.diagnostico_agendado.moeda);
    expect(contratoPorId("retro-90d")!.recompensa.moeda).toBe(EVENTOS.retro_90d.moeda);
  });

  it("a renda semanal máxima é a soma dos semanais (trava o ritmo do jogo)", () => {
    expect(RENDA_SEMANAL_MAXIMA).toBe(440);
  });

  it("quem entra com a moeda inicial NÃO consegue o Canvas — a parceria da história é que fecha a conta", () => {
    const documentador = cargoPorId("documentador")!;
    expect(MOEDA_INICIAL).toBeLessThan(documentador.custoMoeda);
    expect(documentador.degrauMinimo).toBe(1);
  });

  it("sem a parceria, só os contratos já pagam o Canvas em uma semana", () => {
    const documentador = cargoPorId("documentador")!;
    const semParceria = CATALOGO_CONTRATOS.filter(
      (c) => c.cadencia === "semanal" && !c.requisito && c.verificacao.tipo !== "oferta",
    ).reduce((s, c) => s + c.recompensa.moeda, 0);
    expect(MOEDA_INICIAL + semParceria).toBeGreaterThanOrEqual(documentador.custoMoeda);
  });

  it("contratar nunca paga prêmio em moeda (era uma torneira)", () => {
    expect(EVENTOS.funcionario_ia_contratado.moeda).toBe(0);
    for (const c of CARGOS_IA) expect(c.custoMoeda, c.id).toBeGreaterThan(0);
  });
});

describe("persistência (FileRepository em diretório temporário)", () => {
  let dir: string;
  let repo: import("@/lib/db").GameRepository;
  let tenantId: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "gamehub-contratos-"));
    vi.spyOn(process, "cwd").mockReturnValue(dir);
    vi.resetModules();
    const { FileRepository } = await import("@/lib/db/file-adapter");
    repo = new FileRepository();
    const negocio = await repo.criarNegocio({
      nome: "Teste Contratos",
      segmento: "comercio",
      cidadeSlug: "mendes",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      degrauAlvo: 3,
      xpInicial: 0,
      moedaVirtual: MOEDA_INICIAL,
      atributosIniciais: atributosVazios(),
      perfilPublico: true,
      consentimentoVersao: "t",
    });
    tenantId = negocio.id;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("concluirContrato paga uma vez e é idempotente por período", async () => {
    const delta = { xp: 40, moeda: 120, degraus: 0 };
    const a = await repo.concluirContrato(tenantId, "vendas-semana", "2026-W43", 9, delta);
    expect(a.jaConcluido).toBe(false);
    const b = await repo.concluirContrato(tenantId, "vendas-semana", "2026-W43", 9, delta);
    expect(b.jaConcluido).toBe(true);
    const n = await repo.lerNegocio(tenantId);
    expect(n!.moedaVirtual).toBe(MOEDA_INICIAL + 120);
    // outra semana paga de novo
    await repo.concluirContrato(tenantId, "vendas-semana", "2026-W44", 11, delta);
    expect((await repo.lerNegocio(tenantId))!.moedaVirtual).toBe(MOEDA_INICIAL + 240);
    expect(await repo.listarContratosConcluidos(tenantId)).toHaveLength(2);
  });

  it("contratar cobra o custo, recusa sem saldo e não cobra duas vezes", async () => {
    const antes = (await repo.lerNegocio(tenantId))!.moedaVirtual; // 340
    await expect(repo.contratarFuncionario(tenantId, "comercial", 900)).rejects.toThrow(
      "saldo_insuficiente",
    );
    expect((await repo.lerNegocio(tenantId))!.moedaVirtual).toBe(antes);
    expect(await repo.listarFuncionarios(tenantId)).toHaveLength(0);

    await repo.contratarFuncionario(tenantId, "documentador", 300);
    expect((await repo.lerNegocio(tenantId))!.moedaVirtual).toBe(antes - 300);
    await repo.contratarFuncionario(tenantId, "documentador", 300);
    expect((await repo.lerNegocio(tenantId))!.moedaVirtual).toBe(antes - 300);
  });
});
