import { describe, expect, it } from "vitest";
import { gerarCanvas } from "./canvas";
import { gerarPost } from "./post";
import { gerarScript } from "./script";
import { perfilDoNegocio, type PerfilNegocio } from "./tipos";
import { atributosVazios } from "@/lib/atributos";
import type { Negocio, Respostas } from "@/lib/db/types";

function perfil(over: Partial<PerfilNegocio> = {}): PerfilNegocio {
  const respostas: Respostas = {
    nomeNegocio: "Radiz Engenharia",
    segmento: "engenharia",
    cidade: "Mendes",
    bairro: "Centro",
    equipe: "2-5",
    presencaDigital: "social",
    captacao: ["indicacao"],
    objetivo: "mais-leads",
    gargalo: "perco-leads",
    investimento: "1500-3500",
    ...over.respostas,
  };
  return {
    nomeNegocio: "Radiz Engenharia",
    segmento: "engenharia",
    cidade: "Mendes",
    bairro: "Centro",
    degrauAtual: 2,
    nivelAgente: 1,
    ...over,
    respostas,
  };
}

describe("entregáveis — Canvas (Documentador de IA)", () => {
  it("gera os 9 blocos do Business Model Canvas", () => {
    expect(gerarCanvas(perfil()).blocos).toHaveLength(9);
  });

  it("nenhum bloco sai vazio — canvas com buraco não serve pra nada", () => {
    for (const bloco of gerarCanvas(perfil()).blocos) {
      expect(bloco.itens.length).toBeGreaterThan(0);
    }
  });

  it("é personalizado pelo segmento, não é template fixo", () => {
    const eng = JSON.stringify(gerarCanvas(perfil({ segmento: "engenharia" })));
    const ali = JSON.stringify(
      gerarCanvas(perfil({ segmento: "alimentacao", respostas: { segmento: "alimentacao" } as Respostas })),
    );
    expect(eng).not.toBe(ali);
    expect(eng).toContain("licitação");
    expect(ali).toContain("merenda");
  });

  it("nível 1 não traz próximos passos; nível 2 traz", () => {
    expect(gerarCanvas(perfil({ nivelAgente: 1 })).proximosPassos).toEqual([]);
    expect(gerarCanvas(perfil({ nivelAgente: 2 })).proximosPassos.length).toBeGreaterThan(0);
  });

  it("nível maior aprofunda (mais itens), nunca reduz", () => {
    const conta = (n: number) =>
      gerarCanvas(perfil({ nivelAgente: n })).blocos.reduce((s, b) => s + b.itens.length, 0);
    expect(conta(2)).toBeGreaterThan(conta(1));
    expect(conta(3)).toBeGreaterThanOrEqual(conta(2));
  });

  it("negócio sem canal de captação recebe orientação, não um bloco vazio", () => {
    const semCanal = gerarCanvas(perfil({ respostas: { captacao: [] } as unknown as Respostas }));
    const canais = semCanal.blocos.find((b) => b.titulo === "Canais")!;
    expect(canais.itens.length).toBeGreaterThan(0);
    expect(canais.itens.join(" ")).toMatch(/prioridade|indicação/i);
  });

  it("é puro — mesmo perfil, mesmo resultado", () => {
    expect(gerarCanvas(perfil())).toEqual(gerarCanvas(perfil()));
  });
});

describe("entregáveis — Post (Social Media de IA)", () => {
  it("o ângulo muda conforme o objetivo declarado, não é post genérico", () => {
    const leads = gerarPost(perfil({ respostas: { objetivo: "mais-leads" } as Respostas }));
    const aparecer = gerarPost(perfil({ respostas: { objetivo: "aparecer" } as Respostas }));
    expect(leads.headline).not.toBe(aparecer.headline);
    expect(leads.cta).not.toBe(aparecer.cta);
  });

  it("hashtags saem sem acento e sem espaço (cidade composta)", () => {
    const post = gerarPost(perfil({ cidade: "Barra do Piraí" }));
    for (const tag of post.hashtags) {
      expect(tag).toMatch(/^#[a-z0-9]+$/);
    }
  });

  it("nível 2+ menciona o gargalo declarado; nível 1 não", () => {
    expect(gerarPost(perfil({ nivelAgente: 1 })).corpo).not.toMatch(/leads que se perdem/);
    expect(gerarPost(perfil({ nivelAgente: 2 })).corpo).toMatch(/leads que se perdem/);
  });

  it("sempre tem CTA e nome do negócio no corpo", () => {
    const post = gerarPost(perfil());
    expect(post.cta.length).toBeGreaterThan(0);
    expect(post.corpo).toContain("Radiz Engenharia");
  });
});

describe("entregáveis — Script comercial (Comercial/SDR de IA)", () => {
  it("tem abertura, descoberta, argumentos, objeções e fechamento", () => {
    const s = gerarScript(perfil());
    expect(s.abertura.length).toBeGreaterThan(0);
    expect(s.descoberta.length).toBeGreaterThan(0);
    expect(s.argumentos.length).toBeGreaterThan(0);
    expect(s.objecoes.length).toBeGreaterThan(0);
    expect(s.fechamento.length).toBeGreaterThan(0);
  });

  it("nível 1 não traz cadência; nível 2 traz a estratégia de follow-up", () => {
    expect(gerarScript(perfil({ nivelAgente: 1 })).cadencia).toEqual([]);
    expect(gerarScript(perfil({ nivelAgente: 2 })).cadencia.length).toBeGreaterThan(0);
  });

  it("nível 3 acrescenta objeção de timing e gatilho de reativação", () => {
    const s3 = gerarScript(perfil({ nivelAgente: 3 }));
    expect(s3.objecoes.some((o) => /momento/i.test(o.objecao))).toBe(true);
    expect(s3.cadencia.join(" ")).toMatch(/Gatilho/);
  });

  it("toda objeção tem resposta preenchida", () => {
    for (const o of gerarScript(perfil({ nivelAgente: 3 })).objecoes) {
      expect(o.resposta.length).toBeGreaterThan(10);
    }
  });

  it("menciona a cidade do negócio na abertura (prospecção local)", () => {
    expect(gerarScript(perfil({ cidade: "Vassouras" })).abertura).toContain("Vassouras");
  });
});

describe("entregáveis — perfilDoNegocio", () => {
  const negocio: Negocio = {
    id: "t1",
    nome: "Negócio Teste",
    segmento: "comercio",
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-01-01T00:00:00.000Z",
    degrauAtual: 2,
    degrauAlvo: 3,
    nivel: 3,
    xp: 500,
    moedaVirtual: 1000,
    atributos: atributosVazios(),
    perfilPublico: true,
    consentimentoEm: "2026-01-01T00:00:00.000Z",
    consentimentoVersao: "v1",
  };

  it("sem onboarding (negócio de seed) degrada para respostas neutras, não quebra", () => {
    const p = perfilDoNegocio(negocio, null, 1);
    expect(p.nomeNegocio).toBe("Negócio Teste");
    expect(p.respostas.segmento).toBe("comercio");
    // slug humanizado: o post não pode sair "…em mendes?"
    expect(p.cidade).toBe("Mendes");
    expect(() => gerarCanvas(p)).not.toThrow();
    expect(() => gerarPost(p)).not.toThrow();
    expect(() => gerarScript(p)).not.toThrow();
  });

  it("com onboarding, usa as respostas reais", () => {
    const p = perfilDoNegocio(
      negocio,
      {
        tenantId: "t1",
        respostas: { ...perfil().respostas, cidade: "Resende" },
        scoreFit: 70,
        degrauAlvo: 3,
        servicosRecomendados: [],
        respondidoEm: "2026-01-01T00:00:00.000Z",
      },
      2,
    );
    expect(p.cidade).toBe("Resende");
    expect(p.nivelAgente).toBe(2);
  });
});
