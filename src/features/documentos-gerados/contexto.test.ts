import { describe, expect, it } from "vitest";
import { construirFichaMarkdown, type ContextoNegocio } from "./contexto";
import { atributosVazios } from "@/lib/atributos";
import type { Negocio } from "@/lib/db/types";

function negocio(over: Partial<Negocio> = {}): Negocio {
  return {
    id: "1",
    nome: "Radiz Engenharia",
    segmento: "engenharia",
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-08-18T00:00:00.000Z",
    degrauAtual: 1,
    degrauAlvo: 3,
    nivel: 2,
    xp: 150,
    moedaVirtual: 500,
    atributos: atributosVazios(),
    perfilPublico: true,
    consentimentoEm: "2026-08-18T00:00:00.000Z",
    consentimentoVersao: "2026-08-18",
    ...over,
  };
}

function contexto(over: Partial<ContextoNegocio> = {}): ContextoNegocio {
  return {
    negocio: negocio(),
    onboarding: null,
    ofertas: [],
    funcionarios: [],
    parcerias: [],
    sede: null,
    ...over,
  };
}

describe("construirFichaMarkdown", () => {
  // Regressão: `negocio.atributos[chave]` é `{ valor, teto }` (AtributoValor),
  // não um número — interpolar o objeto direto no template renderizava
  // "[object Object]/40" em produção (achado real gerando um documento de
  // verdade, GH-DOC-01/02), quebrando a seção 3 em TODO documento gerado.
  it("renderiza o valor numérico de cada atributo, nunca '[object Object]'", () => {
    const md = construirFichaMarkdown(
      contexto({
        negocio: negocio({
          atributos: {
            tecnologia: { valor: 12, teto: 40 },
            processo: { valor: 8, teto: 40 },
            presenca: { valor: 20, teto: 40 },
            aquisicao: { valor: 5, teto: 40 },
            capacidade: { valor: 30, teto: 40 },
          },
        }),
      }),
    );
    expect(md).not.toContain("[object Object]");
    expect(md).toContain("- Tecnologia: 12/40");
    expect(md).toContain("- Processo: 8/40");
    expect(md).toContain("- Presença: 20/40");
    expect(md).toContain("- Aquisição: 5/40");
    expect(md).toContain("- Capacidade: 30/40");
  });

  it("inclui o nome e segmento do negócio na ficha", () => {
    const md = construirFichaMarkdown(contexto());
    expect(md).toContain("# Ficha do negócio — Radiz Engenharia");
    expect(md).toContain("- Nome: Radiz Engenharia");
  });

  it("sem onboarding, avisa explicitamente em vez de omitir a seção", () => {
    const md = construirFichaMarkdown(contexto({ onboarding: null }));
    expect(md).toContain("_Onboarding ainda não respondido — nenhum dado disponível._");
  });
});
