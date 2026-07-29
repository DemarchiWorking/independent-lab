import { describe, expect, it } from "vitest";
import { gerarCanvas } from "./canvas";
import { gerarPost } from "./post";
import { gerarScript } from "./script";
import { gerarReel } from "./reel";
import { perfilDoNegocio, type PerfilNegocio } from "./tipos";
import { vocabulario } from "./vocabulario";
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

describe("entregáveis — Roteiro de Reels (Editor de Vídeo de IA)", () => {
  it("o roteiro abre por Gancho e fecha por CTA — é o que faz vídeo curto funcionar", () => {
    const cenas = gerarReel(perfil()).cenas;
    expect(cenas[0].papel).toBe("Gancho");
    expect(cenas[cenas.length - 1].papel).toBe("CTA");
  });

  it("nenhuma cena sai sem fala ou sem orientação de imagem", () => {
    for (const c of gerarReel(perfil({ nivelAgente: 3 })).cenas) {
      expect(c.fala.length).toBeGreaterThan(10);
      expect(c.imagem.length).toBeGreaterThan(10);
    }
  });

  it("as janelas de tempo são contínuas e batem com a duração total", () => {
    const reel = gerarReel(perfil({ nivelAgente: 3 }));
    const inicios = reel.cenas.map((c) => Number(c.tempo.split("–")[0]));
    // sem buraco nem sobreposição: cada cena começa onde a anterior acabou
    for (let i = 1; i < inicios.length; i++) {
      expect(inicios[i]).toBeGreaterThan(inicios[i - 1]);
    }
    const fim = reel.cenas[reel.cenas.length - 1].tempo;
    expect(Number(fim.replace("s", "").split("–")[1])).toBe(reel.duracaoSegundos);
  });

  it("evoluir o agente acrescenta cena — nível não é número solto", () => {
    const n1 = gerarReel(perfil({ nivelAgente: 1 }));
    const n2 = gerarReel(perfil({ nivelAgente: 2 }));
    const n3 = gerarReel(perfil({ nivelAgente: 3 }));
    expect(n2.cenas.length).toBeGreaterThan(n1.cenas.length);
    expect(n3.cenas.length).toBeGreaterThan(n2.cenas.length);
    expect(n2.cenas.some((c) => c.papel === "Prova")).toBe(true);
    expect(n3.cenas.some((c) => c.papel === "Objeção")).toBe(true);
  });

  it("ganchos alternativos só no nível 2+, reaproveitamento só no 3", () => {
    expect(gerarReel(perfil({ nivelAgente: 1 })).ganchosAlternativos).toEqual([]);
    expect(gerarReel(perfil({ nivelAgente: 2 })).ganchosAlternativos.length).toBe(3);
    expect(gerarReel(perfil({ nivelAgente: 2 })).reaproveitamento).toEqual([]);
    expect(gerarReel(perfil({ nivelAgente: 3 })).reaproveitamento.length).toBeGreaterThan(0);
  });

  it("fala do nicho e da cidade — material genérico não serve para PME regional", () => {
    const reel = gerarReel(perfil());
    const texto = reel.cenas.map((c) => c.fala).join(" ");
    expect(texto).toContain("Mendes");
    expect(texto).toContain("Radiz Engenharia");
    // vocabulário do segmento engenharia, não texto genérico
    expect(texto.toLowerCase()).toContain("edital");
  });

  it("a palavra do CTA é maiúscula e sem acento — o espectador digita no celular", () => {
    for (const objetivo of ["mais-leads", "organizar", "vender-mais", "aparecer", "automatizar"] as const) {
      const reel = gerarReel(perfil({ respostas: { ...perfil().respostas, objetivo } }));
      const cta = reel.cenas[reel.cenas.length - 1].fala;
      const palavra = cta.match(/“([^”]+)”/)?.[1] ?? "";
      expect(palavra).toMatch(/^[A-Z]+$/);
    }
  });

  /**
   * Guarda de regressão do bug que existiu aqui: o gancho conjugava a
   * primeira palavra da dor do nicho. Funcionava para as dores escritas no
   * infinitivo ("perder prazo de edital") e produzia frase quebrada nas
   * escritas como sintagma nominal ("agenda cheia sem sobrar tempo" →
   * "e ainda agenda cheia…"). Metade dos segmentos saía errada, e o
   * fixture usava justamente um dos que funcionavam.
   */
  it("o gancho cita a dor do nicho VERBATIM, em todos os 8 segmentos", () => {
    const segmentos = [
      "engenharia", "contabilidade", "saude", "tecnologia",
      "alimentacao", "comercio", "servico", "outro",
    ] as const;
    for (const segmento of segmentos) {
      const reel = gerarReel(perfil({ segmento }));
      const dor = vocabulario(segmento).dorTipica;
      expect(reel.cenas[0].fala).toContain(dor);
    }
  });

  it("hashtags trazem o segmento e a cidade sem acento", () => {
    const reel = gerarReel(perfil({ cidade: "Barra do Piraí" }));
    expect(reel.hashtags).toContain("#engenharia");
    expect(reel.hashtags).toContain("#barradopirai");
  });
});

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
    expect(() => gerarReel(p)).not.toThrow();
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
