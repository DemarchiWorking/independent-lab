import { describe, expect, it } from "vitest";
import { CATALOGO_CONQUISTAS, conquistaPorId, type ContextoConquistas } from "./catalogo";
import type { Atributos, Negocio } from "@/lib/db/types";

function contexto(overrides: Partial<ContextoConquistas> = {}): ContextoConquistas {
  const atributos: Atributos = {
    tecnologia: { valor: 10, teto: 40 },
    processo: { valor: 10, teto: 40 },
    presenca: { valor: 10, teto: 40 },
    aquisicao: { valor: 10, teto: 40 },
    capacidade: { valor: 10, teto: 40 },
  };
  const negocio: Negocio = {
    id: "t1",
    nome: "Negócio Teste",
    segmento: "comercio",
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-01-01T00:00:00.000Z",
    degrauAtual: 1,
    degrauAlvo: 2,
    nivel: 1,
    xp: 0,
    moedaVirtual: 500,
    atributos,
    perfilPublico: true,
    consentimentoEm: "2026-01-01T00:00:00.000Z",
    consentimentoVersao: "v1",
  };
  return {
    negocio,
    totalFuncionarios: 0,
    totalParcerias: 0,
    totalNosDesbloqueados: 0,
    nivelSede: 1,
    ...overrides,
  };
}

describe("conquistas — catálogo (GH-GROW-03)", () => {
  it("nenhuma conquista desbloqueada no estado inicial (exceto o que já vale por padrão)", () => {
    const ctx = contexto();
    for (const c of CATALOGO_CONQUISTAS) {
      expect(c.condicao(ctx)).toBe(false);
    }
  });

  it("primeiro-passo desbloqueia no degrau 2", () => {
    const conquista = conquistaPorId("primeiro-passo")!;
    expect(conquista.condicao(contexto({ negocio: { ...contexto().negocio, degrauAtual: 2 } }))).toBe(true);
  });

  it("equipe-formada desbloqueia com 1 funcionário", () => {
    const conquista = conquistaPorId("equipe-formada")!;
    expect(conquista.condicao(contexto({ totalFuncionarios: 1 }))).toBe(true);
    expect(conquista.progresso(contexto({ totalFuncionarios: 0 }))).toBe(0);
  });

  it("maturidade-digital exige TODOS os eixos na metade do teto", () => {
    const conquista = conquistaPorId("maturidade-digital")!;
    const meio: Atributos = {
      tecnologia: { valor: 20, teto: 40 },
      processo: { valor: 20, teto: 40 },
      presenca: { valor: 20, teto: 40 },
      aquisicao: { valor: 20, teto: 40 },
      capacidade: { valor: 19, teto: 40 }, // um abaixo — não conta
    };
    const ctx = contexto();
    expect(conquista.condicao({ ...ctx, negocio: { ...ctx.negocio, atributos: meio } })).toBe(false);

    meio.capacidade.valor = 20;
    expect(conquista.condicao({ ...ctx, negocio: { ...ctx.negocio, atributos: meio } })).toBe(true);
  });

  it("progresso nunca passa de 100 nem fica negativo", () => {
    for (const c of CATALOGO_CONQUISTAS) {
      const p = c.progresso(contexto({ totalFuncionarios: 999, totalParcerias: 999, totalNosDesbloqueados: 999, nivelSede: 999 }));
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("conquistaPorId retorna undefined para id inválido", () => {
    expect(conquistaPorId("nao-existe")).toBeUndefined();
  });
});
