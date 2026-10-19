import { describe, expect, it } from "vitest";
import { atributosVazios } from "@/lib/atributos";
import type { Negocio, Oferta, Onboarding, Respostas } from "@/lib/db/types";
import { contextoPublico, montarContexto } from "./contexto";

const AGORA = "2026-10-19T15:00:00.000Z";

function negocio(over: Partial<Negocio> = {}): Negocio {
  return {
    id: "n1",
    nome: "Studio Bela Cabelos",
    segmento: "servico",
    endereco: { cidadeSlug: "barra-do-pirai", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-01-01T00:00:00.000Z",
    degrauAtual: 2,
    degrauAlvo: 3,
    nivel: 1,
    xp: 0,
    moedaVirtual: 0,
    atributos: atributosVazios(),
    perfilPublico: true,
    consentimentoEm: "2026-01-01T00:00:00.000Z",
    consentimentoVersao: "v1",
    ...over,
  };
}

function oferta(over: Partial<Oferta> = {}): Oferta {
  return { id: "o1", tenantId: "n1", titulo: "Corte", descricao: "Corte e escova", preco: "R$ 80", criadaEm: "2026-02-01T00:00:00.000Z", ...over };
}

const respostas: Respostas = {
  nomeNegocio: "Studio Bela Cabelos",
  segmento: "servico",
  cidade: "Barra do Piraí",
  bairro: "Centro",
  equipe: "so-eu",
  presencaDigital: "social",
  captacao: ["indicacao"],
  objetivo: "vender-mais",
  gargalo: "manual",
  investimento: "ate-500",
};

function onboarding(): Onboarding {
  return { tenantId: "n1", respostas, scoreFit: 70, degrauAlvo: 3, servicosRecomendados: [], respondidoEm: AGORA };
}

describe("montarContexto", () => {
  it("usa as respostas reais quando há onboarding", () => {
    const c = montarContexto({ negocio: negocio(), onboarding: onboarding(), ofertas: [], parceiros: [], nivelAgente: 2, agora: AGORA });
    expect(c.cidade).toBe("Barra do Piraí");
    expect(c.privado.objetivo).toBe("vender-mais");
    expect(c.privado.temOnboarding).toBe(true);
    expect(c.nivel).toBe(2);
    expect(c.agora).toBe(AGORA);
  });

  it("sem onboarding usa valores neutros, marca o fato e humaniza o slug da cidade", () => {
    const c = montarContexto({ negocio: negocio(), onboarding: null, ofertas: [], parceiros: [], nivelAgente: 1, agora: AGORA });
    expect(c.privado.temOnboarding).toBe(false);
    expect(c.cidade).toBe("Barra Do Pirai");
    expect(c.privado.equipe).toBe("so-eu");
  });

  it("detecta o nicho pelo nome e pelas ofertas", () => {
    const c = montarContexto({ negocio: negocio(), onboarding: null, ofertas: [], parceiros: [], nivelAgente: 1, agora: AGORA });
    expect(c.nicho).toBe("beleza");
    const sem = montarContexto({ negocio: negocio({ nome: "JM Soluções" }), onboarding: null, ofertas: [oferta({ titulo: "Corte feminino" })], parceiros: [], nivelAgente: 1, agora: AGORA });
    expect(sem.nicho).toBe("beleza");
  });

  it("limita e limpa texto livre: nome, oferta, cidade", () => {
    const c = montarContexto({
      negocio: negocio({ nome: `${"A".repeat(300)}\nLinha dois` }),
      onboarding: { ...onboarding(), respostas: { ...respostas, cidade: `  Mendes\u0000\n\n  ` } },
      ofertas: [oferta({ titulo: "T\n".repeat(100), descricao: "d".repeat(1000), preco: "9".repeat(200) })],
      parceiros: [],
      nivelAgente: 1,
      agora: AGORA,
    });
    expect(Array.from(c.nome).length).toBeLessThanOrEqual(80);
    expect(c.nome).not.toContain("\n");
    expect(c.cidade).toBe("Mendes");
    expect(Array.from(c.ofertas[0].titulo).length).toBeLessThanOrEqual(80);
    expect(c.ofertas[0].titulo).not.toContain("\n");
    expect(Array.from(c.ofertas[0].descricao).length).toBeLessThanOrEqual(240);
    expect(Array.from(c.ofertas[0].preco).length).toBeLessThanOrEqual(40);
  });

  it("ordena as ofertas da mais nova para a mais antiga, no máximo 5, e descarta as sem título", () => {
    const ofertas = Array.from({ length: 8 }, (_, i) => oferta({ id: `o${i}`, titulo: `Oferta ${i}`, criadaEm: `2026-02-0${i + 1}T00:00:00.000Z` }));
    ofertas.push(oferta({ id: "vazia", titulo: "   ", criadaEm: "2026-03-01T00:00:00.000Z" }));
    const c = montarContexto({ negocio: negocio(), onboarding: null, ofertas, parceiros: [], nivelAgente: 1, agora: AGORA });
    expect(c.ofertas.map((o) => o.titulo)).toEqual(["Oferta 7", "Oferta 6", "Oferta 5", "Oferta 4"]);
  });

  it("parceiros: só o nome e o segmento, no máximo 5", () => {
    const parceiros = Array.from({ length: 8 }, (_, i) => negocio({ id: `p${i}`, nome: `Parceiro ${i}`, segmento: "comercio" }));
    const c = montarContexto({ negocio: negocio(), onboarding: null, ofertas: [], parceiros, nivelAgente: 1, agora: AGORA });
    expect(c.parceiros).toHaveLength(5);
    expect(Object.keys(c.parceiros[0]).sort()).toEqual(["nome", "segmento"]);
  });

  it("o nível é sempre 1, 2 ou 3", () => {
    for (const [entrada, esperado] of [[0, 1], [1, 1], [2, 2], [3, 3], [9, 3], [-4, 1]] as const) {
      expect(montarContexto({ negocio: negocio(), onboarding: null, ofertas: [], parceiros: [], nivelAgente: entrada, agora: AGORA }).nivel).toBe(esperado);
    }
  });

  it("é puro", () => {
    const entrada = { negocio: negocio(), onboarding: onboarding(), ofertas: [oferta()], parceiros: [], nivelAgente: 2, agora: AGORA };
    expect(montarContexto(entrada)).toEqual(montarContexto(entrada));
  });
});

describe("contextoPublico", () => {
  it("remove o bloco privado por inteiro", () => {
    const c = montarContexto({ negocio: negocio(), onboarding: onboarding(), ofertas: [oferta()], parceiros: [], nivelAgente: 1, agora: AGORA });
    const pub = contextoPublico(c);
    expect(pub).not.toHaveProperty("privado");
    expect(JSON.stringify(pub)).not.toMatch(/gargalo|investimento|presencaDigital|vender-mais|ate-500/);
    expect(pub.nome).toBe(c.nome);
    expect(pub.ofertas).toEqual(c.ofertas);
  });
});
