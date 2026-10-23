import { describe, expect, it } from "vitest";
import { missaoAtual, type ContextoMissao } from "./missoes";
import { CATALOGO_CONTRATOS } from "@/features/contratos/catalogo";
import { situacaoDosContratos } from "@/features/contratos/motor";
import { CATALOGO_HISTORIA } from "@/features/historia/catalogo";
import { capituloPorId, deltaDaEscolha, gatilhoAtendido, proximoCapitulo } from "@/features/historia/motor";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { MOEDA_INICIAL } from "./engine";
import { atributosVazios } from "@/lib/atributos";
import type { EstadoNarrativo } from "@/features/historia/tipos";
import type { Negocio } from "@/lib/db/types";

const CRIADO = "2026-10-01T15:00:00.000Z";
const AGORA = "2026-10-19T15:00:00.000Z"; // segunda, semana 2026-W43

function negocio(over: Partial<Negocio> = {}): Negocio {
  return {
    id: "t1",
    nome: "Loja",
    segmento: "comercio",
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q", lote: 1 },
    criadoEm: CRIADO,
    degrauAtual: 1,
    degrauAlvo: 3,
    nivel: 1,
    xp: 0,
    moedaVirtual: MOEDA_INICIAL,
    atributos: atributosVazios(),
    perfilPublico: true,
    consentimentoEm: CRIADO,
    consentimentoVersao: "t",
    ...over,
  };
}

function ctx(over: Partial<ContextoMissao> & { n?: Partial<Negocio>; ofertas?: string[] } = {}): ContextoMissao {
  const n = negocio(over.n);
  const cargos = over.cargosContratados ?? [];
  return {
    negocio: n,
    cargosContratados: cargos,
    capitulosResolvidos: over.capitulosResolvidos ?? new Set(),
    contratos:
      over.contratos ??
      situacaoDosContratos(
        CATALOGO_CONTRATOS,
        [],
        {
          ofertasCriadasEm: over.ofertas ?? [],
          tamanhoEquipe: cargos.length,
          degrauAtual: n.degrauAtual,
          degrauAlvo: n.degrauAlvo,
        },
        CRIADO,
        AGORA,
      ),
  };
}

describe("Jornada — o caminho de quem acabou de entrar", () => {
  it("passo 1: responder à carta do Laboratório", () => {
    const m = missaoAtual(ctx());
    expect(m.id).toBe("parceria-laboratorio");
    expect(m.passo).toBe(1);
    expect(m.acao).toBeNull(); // a carta já está na tela
  });

  it("passo 2: com a moeda da parceria, o Canvas nível 1 é o próximo passo", () => {
    const m = missaoAtual(
      ctx({ capitulosResolvidos: new Set(["parceria-laboratorio"]), n: { moedaVirtual: 500 } }),
    );
    expect(m.id).toBe("canvas-nivel-1");
    expect(m.alvo).toEqual({ tipo: "view", view: "equipe-ia" });
  });

  it("sem moeda para o Canvas, a jornada manda juntar via contratos — nunca trava", () => {
    const m = missaoAtual(ctx({ capitulosResolvidos: new Set(["parceria-laboratorio"]) }));
    expect(m.id).toBe("canvas-nivel-1-juntar");
    expect(m.titulo).toContain(String(cargoPorId("documentador")!.custoMoeda - MOEDA_INICIAL));
    expect(m.alvo).toEqual({ tipo: "view", view: "contratos" });
  });

  it("depois do Canvas, o foco passa a medir e a vender", () => {
    const base = {
      capitulosResolvidos: new Set(["parceria-laboratorio"]),
      cargosContratados: ["documentador"],
      n: { moedaVirtual: 200, degrauAtual: 2 },
    };
    expect(missaoAtual(ctx(base)).id).toBe("vendas-semana");
  });

  it("oferta pendente leva à vitrine; oferta publicada leva a receber", () => {
    const base = {
      capitulosResolvidos: new Set(["parceria-laboratorio"]),
      cargosContratados: ["documentador"],
      n: { moedaVirtual: 200, degrauAtual: 2 },
    };
    // pula o passo 3 marcando o fechamento como feito
    const feito = (c: ContextoMissao): ContextoMissao => ({
      ...c,
      contratos: c.contratos.map((s) =>
        s.contrato.id === "vendas-semana" ? { ...s, status: "concluido" as const } : s,
      ),
    });
    const semOferta = missaoAtual(feito(ctx(base)));
    expect(semOferta.id).toBe("oferta-semana");
    expect(semOferta.alvo).toEqual({ tipo: "rota", href: "/painel" });

    const comOferta = missaoAtual(feito(ctx({ ...base, ofertas: ["2026-10-19T13:00:00.000Z"] })));
    expect(comOferta.id).toBe("oferta-semana-receber");
  });

  it("tudo cumprido: semana fechada, com saída para o Marketplace", () => {
    const c = ctx({
      capitulosResolvidos: new Set(["parceria-laboratorio"]),
      cargosContratados: ["documentador", "social-media", "editor-video", "comercial"],
      n: { moedaVirtual: 0, degrauAtual: 3, degrauAlvo: 3 },
    });
    const fechados: ContextoMissao = {
      ...c,
      contratos: c.contratos.map((s) => ({ ...s, status: "concluido" as const })),
    };
    const m = missaoAtual(fechados);
    expect(m.id).toBe("semana-cumprida");
    expect(m.alvo).toEqual({ tipo: "view", view: "marketplace" });
  });
});

describe("História — a parceria com o admin e o caminho até o Canvas", () => {
  const estado = (over: Partial<EstadoNarrativo> = {}): EstadoNarrativo => ({
    criadoEm: CRIADO,
    xp: 0,
    degrauAtual: 1,
    atributos: atributosVazios() as unknown as EstadoNarrativo["atributos"],
    segmento: "comercio",
    tamanhoEquipe: 0,
    cargosContratados: new Set(),
    capitulosResolvidos: new Set(),
    capitulosEntregues: new Set(),
    ...over,
  });

  it("a carta do Laboratório vem logo depois da chegada, no dia 0", () => {
    const antes = proximoCapitulo(CATALOGO_HISTORIA, estado(), CRIADO);
    expect(antes?.id).toBe("chegada");
    const depois = proximoCapitulo(
      CATALOGO_HISTORIA,
      estado({
        capitulosEntregues: new Set(["chegada"]),
        capitulosResolvidos: new Set(["chegada"]),
      }),
      CRIADO,
    );
    expect(depois?.id).toBe("parceria-laboratorio");
  });

  it("TODA escolha da parceria paga o Canvas: moeda inicial + prêmio ≥ custo do Documentador", () => {
    const cap = capituloPorId(CATALOGO_HISTORIA, "parceria-laboratorio")!;
    const custo = cargoPorId("documentador")!.custoMoeda;
    for (const e of cap.escolhas) {
      const { moeda } = deltaDaEscolha(e.efeito);
      expect(MOEDA_INICIAL + moeda, e.id).toBeGreaterThanOrEqual(custo);
    }
  });

  it("o capítulo do Canvas só aparece depois de contratar o Documentador", () => {
    const cap = capituloPorId(CATALOGO_HISTORIA, "canvas-na-mesa")!;
    expect(gatilhoAtendido(cap.gatilho, estado(), AGORA)).toBe(false);
    expect(
      gatilhoAtendido(cap.gatilho, estado({ cargosContratados: new Set(["social-media"]) }), AGORA),
    ).toBe(false);
    expect(
      gatilhoAtendido(cap.gatilho, estado({ cargosContratados: new Set(["documentador"]) }), AGORA),
    ).toBe(true);
  });

  it("todo capítulo tem uma escolha que não custa moeda — ninguém fica sem saída", () => {
    for (const c of CATALOGO_HISTORIA) {
      const gratis = c.escolhas.some((e) => (e.efeito.moeda ?? 0) >= 0);
      expect(gratis, c.id).toBe(true);
    }
  });

  it("a história sempre aponta para vender: os capítulos novos citam a ação de venda", () => {
    for (const id of ["parceria-laboratorio", "canvas-na-mesa", "primeira-semana-vendas"]) {
      const c = capituloPorId(CATALOGO_HISTORIA, id)!;
      expect(c.narrativa.toLowerCase(), id).toMatch(/vend/);
    }
  });
});
