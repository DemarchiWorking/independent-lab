import { describe, expect, it } from "vitest";
import { calcular } from "./scoring";
import type { Respostas } from "@/lib/db/types";

function respostas(over: Partial<Respostas> = {}): Respostas {
  return {
    nomeNegocio: "Teste",
    segmento: "imobiliaria",
    cidade: "Vassouras",
    bairro: "Centro",
    equipe: "6-15",
    presencaDigital: "site-desatualizado",
    captacao: ["indicacao"],
    objetivo: "mais-leads",
    gargalo: "perco-leads",
    investimento: "1500-3500",
    ...over,
  };
}

describe("scoring do onboarding", () => {
  // Regressão: Mendes é a região-alvo citada pelo fundador e não estava na
  // lista de cidades prioritárias — o negócio não pontuava fit geográfico.
  it.each(["Mendes", "Vassouras", "Barra do Piraí", "Barra do Pirai"])(
    "cidade prioritária %s pontua fit geográfico",
    (cidade) => {
      const comCidade = calcular(respostas({ cidade }));
      const foraDaRegiao = calcular(respostas({ cidade: "São Paulo" }));
      expect(comCidade.scoreFit).toBe(foraDaRegiao.scoreFit + 15);
    },
  );

  it("ICP ideal pontua alto e mira degrau alto", () => {
    const r = calcular(respostas());
    expect(r.scoreFit).toBeGreaterThanOrEqual(90);
    // imobiliária + equipe 6-15 dá +1 no degrau-alvo (base 3 → 4)
    expect(r.degrauAlvo).toBe(4);
    expect(r.degrauAtual).toBe(1); // nunca pula degraus
  });

  it("XP inicial é proporcional ao fit", () => {
    const alto = calcular(respostas());
    const baixo = calcular(
      respostas({
        segmento: "outro",
        cidade: "Outra",
        equipe: "so-eu",
        investimento: "nao-sei",
        gargalo: "imagem-fraca",
      }),
    );
    expect(alto.xpInicial).toBeGreaterThan(baixo.xpInicial);
  });

  it("sem presença digital rebaixa o degrau-alvo (precisa de base antes)", () => {
    const semBase = calcular(
      respostas({ presencaDigital: "nada", investimento: "1500-3500" }),
    );
    const comBase = calcular(respostas({ investimento: "1500-3500" }));
    expect(semBase.degrauAlvo).toBeLessThan(comBase.degrauAlvo);
  });

  it("score fica no intervalo [0, 100]", () => {
    const r = calcular(
      respostas({
        segmento: "outro",
        cidade: "Outra",
        equipe: "so-eu",
        investimento: "nao-sei",
        gargalo: "imagem-fraca",
      }),
    );
    expect(r.scoreFit).toBeGreaterThanOrEqual(0);
    expect(r.scoreFit).toBeLessThanOrEqual(100);
  });

  it("recomenda CRM quando o gargalo é perder leads", () => {
    const r = calcular(respostas({ gargalo: "perco-leads" }));
    expect(r.servicosRecomendados).toContain("Integração CRM");
  });

  describe("atributosIniciais (economia de atributos)", () => {
    it("gargalo 'manual' inicia Processo baixo (exemplo literal do card GH-ATR-01)", () => {
      const manual = calcular(respostas({ gargalo: "manual" }));
      const semGargaloManual = calcular(respostas({ gargalo: "imagem-fraca" }));
      expect(manual.atributosIniciais.processo.valor).toBeLessThan(
        semGargaloManual.atributosIniciais.processo.valor,
      );
    });

    it("gargalo 'sem-processo' também inicia Processo baixo", () => {
      const r = calcular(respostas({ gargalo: "sem-processo" }));
      const base = calcular(respostas({ gargalo: "imagem-fraca" }));
      expect(r.atributosIniciais.processo.valor).toBeLessThan(
        base.atributosIniciais.processo.valor,
      );
    });

    it("presença digital 'nada' inicia Presença muito baixa; 'site-portais' alta", () => {
      const semNada = calcular(respostas({ presencaDigital: "nada" }));
      const comTudo = calcular(respostas({ presencaDigital: "site-portais" }));
      expect(semNada.atributosIniciais.presenca.valor).toBeLessThan(
        comTudo.atributosIniciais.presenca.valor,
      );
    });

    it("gargalo 'perco-leads' inicia Aquisição baixa", () => {
      const r = calcular(respostas({ gargalo: "perco-leads" }));
      const base = calcular(respostas({ gargalo: "imagem-fraca" }));
      expect(r.atributosIniciais.aquisicao.valor).toBeLessThan(
        base.atributosIniciais.aquisicao.valor,
      );
    });

    it("equipe maior inicia Capacidade mais alta", () => {
      const grande = calcular(respostas({ equipe: "30+" }));
      const pequena = calcular(respostas({ equipe: "so-eu" }));
      expect(grande.atributosIniciais.capacidade.valor).toBeGreaterThan(
        pequena.atributosIniciais.capacidade.valor,
      );
    });

    it("todos os 5 eixos nascem dentro de [0, teto] — nunca fora de faixa", () => {
      const r = calcular(respostas());
      for (const eixo of Object.values(r.atributosIniciais)) {
        expect(eixo.valor).toBeGreaterThanOrEqual(0);
        expect(eixo.valor).toBeLessThanOrEqual(eixo.teto);
      }
    });

    // Âncora do PISO MÍNIMO possível de atributosIniciais (pior conjunto de
    // respostas do onboarding). Os testes de catálogo anti-softlock em
    // marketplace/guarda.test.ts e parcerias/guarda.test.ts (GH-ATR-03)
    // assumem literalmente este valor — se este teste quebrar por uma
    // mudança na fórmula de scoring, os requisitos dos catálogos também
    // precisam ser revisados para não softlockear negócios novos.
    it("pior conjunto de respostas produz o piso mínimo de atributosIniciais (GH-ATR-03)", () => {
      const pior = calcular(
        respostas({
          presencaDigital: "nada",
          equipe: "so-eu",
          gargalo: "manual",
          captacao: ["indicacao", "sem-processo"],
        }),
      );
      expect(pior.atributosIniciais.tecnologia.valor).toBe(8);
      expect(pior.atributosIniciais.processo.valor).toBe(6);
      expect(pior.atributosIniciais.presenca.valor).toBe(2);
      expect(pior.atributosIniciais.aquisicao.valor).toBe(6);
      expect(pior.atributosIniciais.capacidade.valor).toBe(6);
      for (const eixo of Object.values(pior.atributosIniciais)) {
        expect(eixo.teto).toBe(40);
      }
    });
  });
});
