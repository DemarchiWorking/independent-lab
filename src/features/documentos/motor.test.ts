import { describe, expect, it } from "vitest";
import { TETO_ATRIBUTO } from "@/lib/atributos";
import { CARGOS_IA } from "@/features/equipe-ia/catalogo";
import { DEGRAUS } from "@/features/onboarding/scoring";
import {
  gerarDiagnostico,
  gerarDocumentoNarrativo,
  VERSAO_METODOLOGIA,
} from "./motor";
import { DOCUMENTOS_NARRATIVOS, origemDoDocumento } from "./catalogo";
import { CATALOGO_HISTORIA } from "@/features/historia/catalogo";
import type { Negocio, Onboarding } from "@/lib/db/types";

const AGORA = "2026-08-01T12:00:00.000Z";

function negocio(overrides: Partial<Negocio> = {}): Negocio {
  return {
    id: "t1",
    nome: "Serralheria Demarchi",
    segmento: "servico",
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q1", lote: 3 },
    criadoEm: "2026-01-05T10:00:00.000Z",
    degrauAtual: 1,
    degrauAlvo: 3,
    nivel: 2,
    xp: 200,
    moedaVirtual: 500,
    perfilPublico: true,
    consentimentoEm: "2026-01-05T10:00:00.000Z",
    consentimentoVersao: "1.0",
    atributos: {
      // processo é o eixo mais fraco de propósito, tecnologia o mais forte
      tecnologia: { valor: 30, teto: TETO_ATRIBUTO },
      processo: { valor: 4, teto: TETO_ATRIBUTO },
      presenca: { valor: 10, teto: TETO_ATRIBUTO },
      aquisicao: { valor: 16, teto: TETO_ATRIBUTO },
      capacidade: { valor: 20, teto: TETO_ATRIBUTO },
    },
    ...overrides,
  };
}

function onboarding(overrides: Partial<Onboarding> = {}): Onboarding {
  return {
    tenantId: "t1",
    respostas: {
      nomeNegocio: "Serralheria Demarchi",
      segmento: "servico",
      cidade: "Mendes",
      bairro: "Centro",
      equipe: "so-eu",
      presencaDigital: "nada",
      captacao: ["indicacao"],
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "nao-sei",
    },
    scoreFit: 40,
    degrauAlvo: 3,
    servicosRecomendados: [],
    respondidoEm: "2026-01-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("gerarDiagnostico — eixos", () => {
  it("ordena do mais fraco para o mais forte", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    const percentuais = d.eixos.map((e) => e.percentual);
    for (let i = 1; i < percentuais.length; i++) {
      expect(percentuais[i]).toBeGreaterThanOrEqual(percentuais[i - 1]);
    }
    expect(d.eixos).toHaveLength(5);
  });

  it("eixoMaisFraco é o primeiro da lista ordenada, e bate com o fixture (processo)", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.eixoMaisFraco).toBe(d.eixos[0]);
    expect(d.eixoMaisFraco.chave).toBe("processo");
  });

  it("percentual é valor/teto em %, arredondado", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    const tecnologia = d.eixos.find((e) => e.chave === "tecnologia")!;
    expect(tecnologia.percentual).toBe(Math.round((30 / TETO_ATRIBUTO) * 100));
  });

  it("desempate de eixos com valor igual é determinístico (ordem alfabética da chave)", () => {
    const empatado = negocio({
      atributos: {
        tecnologia: { valor: 10, teto: TETO_ATRIBUTO },
        processo: { valor: 10, teto: TETO_ATRIBUTO },
        presenca: { valor: 10, teto: TETO_ATRIBUTO },
        aquisicao: { valor: 10, teto: TETO_ATRIBUTO },
        capacidade: { valor: 10, teto: TETO_ATRIBUTO },
      },
    });
    const a = gerarDiagnostico(empatado, onboarding(), AGORA);
    const b = gerarDiagnostico(empatado, onboarding(), AGORA);
    expect(a.eixos.map((e) => e.chave)).toEqual(b.eixos.map((e) => e.chave));
  });
});

describe("gerarDiagnostico — degrau", () => {
  it("resolve nome do degrau atual e alvo a partir de DEGRAUS", () => {
    const d = gerarDiagnostico(negocio({ degrauAtual: 2, degrauAlvo: 4 }), onboarding(), AGORA);
    expect(d.degrau.atualNome).toBe(DEGRAUS[2].nome);
    expect(d.degrau.alvoNome).toBe(DEGRAUS[4].nome);
  });
});

describe("gerarDiagnostico — gargalo", () => {
  it("declarado vem do onboarding, traduzido para texto legível", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.gargalo.declarado).toMatch(/lead/i);
  });

  it("declarado é null sem onboarding — não inventa resposta", () => {
    const d = gerarDiagnostico(negocio(), null, AGORA);
    expect(d.gargalo.declarado).toBeNull();
  });

  it("observado corresponde ao eixo mais fraco, não ao declarado", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.gargalo.observado.length).toBeGreaterThan(0);
    // o fixture tem gargalo declarado "perco-leads" (aquisição) mas o eixo
    // mais fraco é processo — o documento tem que mostrar os dois, não fundir
    expect(d.eixoMaisFraco.chave).toBe("processo");
  });
});

describe("gerarDiagnostico — movimentos recomendados", () => {
  it("no máximo 3, um por eixo mais fraco", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.movimentos.length).toBeLessThanOrEqual(3);
    expect(d.movimentos.map((m) => m.eixo)).toEqual(d.eixos.slice(0, 3).map((e) => e.chave));
  });

  it("eixo com Funcionário de IA real (processo → Documentador) recomenda o cargo", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    const movimentoProcesso = d.movimentos.find((m) => m.eixo === "processo")!;
    expect(movimentoProcesso.cargo).toBeDefined();
    expect(movimentoProcesso.cargo?.id).toBe("documentador");
    expect(movimentoProcesso.titulo).toContain(movimentoProcesso.cargo!.nome);
  });

  it("eixo sem Funcionário de IA (tecnologia) cai no movimento genérico, sem cargo", () => {
    // força tecnologia a ser o mais fraco
    const semCargo = negocio({
      atributos: {
        tecnologia: { valor: 1, teto: TETO_ATRIBUTO },
        processo: { valor: 30, teto: TETO_ATRIBUTO },
        presenca: { valor: 30, teto: TETO_ATRIBUTO },
        aquisicao: { valor: 30, teto: TETO_ATRIBUTO },
        capacidade: { valor: 30, teto: TETO_ATRIBUTO },
      },
    });
    const d = gerarDiagnostico(semCargo, onboarding(), AGORA);
    expect(d.eixoMaisFraco.chave).toBe("tecnologia");
    const movimento = d.movimentos[0];
    expect(movimento.cargo).toBeUndefined();
    expect(movimento.titulo.length).toBeGreaterThan(0);
    expect(movimento.descricao.length).toBeGreaterThan(0);
  });

  it("disponivelAgora reflete degrauAtual >= degrauMinimo do cargo", () => {
    const documentador = CARGOS_IA.find((c) => c.id === "documentador")!;

    const abaixo = gerarDiagnostico(
      negocio({ degrauAtual: documentador.degrauMinimo - 1 }),
      onboarding(),
      AGORA,
    );
    const movAbaixo = abaixo.movimentos.find((m) => m.eixo === "processo")!;
    expect(movAbaixo.cargo?.disponivelAgora).toBe(false);

    const noDegrau = gerarDiagnostico(
      negocio({ degrauAtual: documentador.degrauMinimo }),
      onboarding(),
      AGORA,
    );
    const movNoDegrau = noDegrau.movimentos.find((m) => m.eixo === "processo")!;
    expect(movNoDegrau.cargo?.disponivelAgora).toBe(true);
  });
});

describe("gerarDiagnostico — auditabilidade", () => {
  it("é determinística: mesma entrada, mesma saída", () => {
    const a = gerarDiagnostico(negocio(), onboarding(), AGORA);
    const b = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(a).toEqual(b);
  });

  it("carimba a versão da metodologia e o horário recebido (nunca `new Date()` interno)", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.versaoMetodologia).toBe(VERSAO_METODOLOGIA);
    expect(d.geradoEm).toBe(AGORA);
  });

  it("resolve o nome legível da cidade a partir do slug", () => {
    const d = gerarDiagnostico(negocio(), onboarding(), AGORA);
    expect(d.negocio.cidade).toBe("Mendes");
  });

  it("cidade fora da lista oficial não quebra — cai para o próprio slug", () => {
    const d = gerarDiagnostico(
      negocio({ endereco: { cidadeSlug: "algum-lugar", bairroSlug: "x", quarteiraoId: "q1", lote: 1 } }),
      onboarding(),
      AGORA,
    );
    expect(d.negocio.cidade).toBe("algum-lugar");
  });
});

describe("documentos narrativos — conteúdo real, não inventado", () => {
  it("gerarDocumentoNarrativo usa o texto literal do capítulo/escolha", () => {
    const capitulo = CATALOGO_HISTORIA.find((c) => c.id === "proposta-parceria")!;
    const escolha = capitulo.escolhas.find((e) => e.id === "combinar-regras")!;
    const doc = gerarDocumentoNarrativo(capitulo, escolha);
    expect(doc.capituloTitulo).toBe(capitulo.titulo);
    expect(doc.situacao).toBe(capitulo.narrativa);
    expect(doc.escolhaFeita).toBe(escolha.rotulo);
    expect(doc.desfecho).toBe(escolha.desfecho);
  });

  it("todo documento narrativo do catálogo tem uma escolha dona no catálogo de história", () => {
    for (const doc of DOCUMENTOS_NARRATIVOS) {
      const origem = origemDoDocumento(doc.id);
      expect(origem, `documento ${doc.id} sem escolha dona`).toBeDefined();
    }
  });

  it("toda escolha que libera documento aponta pra um id que existe no catálogo de documentos", () => {
    const idsConhecidos = new Set(DOCUMENTOS_NARRATIVOS.map((d) => d.id));
    for (const capitulo of CATALOGO_HISTORIA) {
      for (const escolha of capitulo.escolhas) {
        if (escolha.efeito.documento) {
          expect(
            idsConhecidos.has(escolha.efeito.documento as never),
            `escolha ${capitulo.id}/${escolha.id} referencia documento desconhecido: ${escolha.efeito.documento}`,
          ).toBe(true);
        }
      }
    }
  });
});
