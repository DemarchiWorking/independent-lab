import { describe, expect, it } from "vitest";
import { agoraGlobal, dentroDaJanela, diaDoNegocio, diasEntre, rotuloDeTempo } from "./relogio";
import {
  capituloPorId,
  capitulosPendentes,
  deltaDaEscolha,
  escolhaPorId,
  gatilhoAtendido,
  proximoCapitulo,
} from "./motor";
import { CATALOGO_HISTORIA } from "./catalogo";
import { atributosVazios } from "@/lib/atributos";
import type { Capitulo, EstadoNarrativo } from "./tipos";

describe("relógio global", () => {
  it("agoraGlobal devolve um instante ISO válido e comparável", () => {
    const a = agoraGlobal();
    expect(Number.isNaN(Date.parse(a))).toBe(false);
    expect(diasEntre(a, agoraGlobal())).toBeGreaterThanOrEqual(0);
  });
});

const NASCIMENTO = "2026-01-01T12:00:00.000Z";

function estado(over: Partial<EstadoNarrativo> = {}): EstadoNarrativo {
  return {
    criadoEm: NASCIMENTO,
    xp: 0,
    degrauAtual: 1,
    atributos: atributosVazios(),
    segmento: "comercio",
    tamanhoEquipe: 0,
    capitulosResolvidos: new Set(),
    capitulosEntregues: new Set(),
    ...over,
  };
}

/** "N dias depois do cadastro", em ISO. */
function dia(n: number): string {
  return new Date(Date.parse(NASCIMENTO) + n * 86_400_000).toISOString();
}

describe("relógio", () => {
  it("conta dias corridos completos", () => {
    expect(diasEntre(NASCIMENTO, dia(0))).toBe(0);
    expect(diasEntre(NASCIMENTO, dia(1))).toBe(1);
    expect(diasEntre(NASCIMENTO, dia(30))).toBe(30);
  });

  it("meio dia ainda não conta como dia cheio", () => {
    const meio = new Date(Date.parse(NASCIMENTO) + 43_200_000).toISOString();
    expect(diasEntre(NASCIMENTO, meio)).toBe(0);
  });

  it("nunca devolve dias negativos (relógio para trás)", () => {
    expect(diasEntre(dia(10), NASCIMENTO)).toBe(0);
  });

  it("data inválida degrada para 0 em vez de NaN", () => {
    expect(diasEntre("não é data", dia(5))).toBe(0);
    expect(diaDoNegocio(NASCIMENTO, "lixo")).toBe(0);
  });

  it("janela de evento global: abre na data e fecha depois", () => {
    const alvo = "2026-08-10T00:00:00.000Z";
    const antes = "2026-08-09T23:00:00.000Z";
    const dentro = "2026-08-15T00:00:00.000Z";
    const depois = "2026-08-25T00:00:00.000Z";
    expect(dentroDaJanela(alvo, antes, 10)).toBe(false);
    expect(dentroDaJanela(alvo, dentro, 10)).toBe(true);
    expect(dentroDaJanela(alvo, depois, 10)).toBe(false);
  });

  it("sem janela, o evento vale para sempre a partir da data", () => {
    expect(dentroDaJanela("2026-01-01T00:00:00.000Z", "2030-01-01T00:00:00.000Z")).toBe(true);
  });

  it("rótulo de tempo é humano", () => {
    expect(rotuloDeTempo(0)).toBe("Primeiro dia");
    expect(rotuloDeTempo(1)).toBe("1 dia de estrada");
    expect(rotuloDeTempo(15)).toBe("15 dias de estrada");
    expect(rotuloDeTempo(30)).toBe("1 mês de estrada");
    expect(rotuloDeTempo(365)).toBe("1 ano de estrada");
  });
});

describe("gatilhos", () => {
  it("diasAposCadastro respeita o relógio pessoal do jogador", () => {
    const g = { tipo: "diasAposCadastro", dias: 5 } as const;
    expect(gatilhoAtendido(g, estado(), dia(4))).toBe(false);
    expect(gatilhoAtendido(g, estado(), dia(5))).toBe(true);
    expect(gatilhoAtendido(g, estado(), dia(99))).toBe(true);
  });

  it("dois jogadores com cadastros diferentes recebem no SEU dia 5", () => {
    const g = { tipo: "diasAposCadastro", dias: 5 } as const;
    const antigo = estado({ criadoEm: "2026-01-01T00:00:00.000Z" });
    const novo = estado({ criadoEm: "2026-06-01T00:00:00.000Z" });
    const agora = "2026-06-03T00:00:00.000Z";
    expect(gatilhoAtendido(g, antigo, agora)).toBe(true); // já passou muito
    expect(gatilhoAtendido(g, novo, agora)).toBe(false); // só 2 dias de casa
  });

  it("dataFixa é global: independe de quando o jogador se cadastrou", () => {
    const g = { tipo: "dataFixa", iso: "2026-08-10T00:00:00.000Z", janelaDias: 10 } as const;
    const veterano = estado({ criadoEm: "2025-01-01T00:00:00.000Z" });
    const novato = estado({ criadoEm: "2026-08-09T00:00:00.000Z" });
    const durante = "2026-08-12T00:00:00.000Z";
    expect(gatilhoAtendido(g, veterano, durante)).toBe(true);
    expect(gatilhoAtendido(g, novato, durante)).toBe(true);
  });

  it("xpMinimo e degrauMinimo", () => {
    expect(gatilhoAtendido({ tipo: "xpMinimo", xp: 500 }, estado({ xp: 499 }), dia(1))).toBe(false);
    expect(gatilhoAtendido({ tipo: "xpMinimo", xp: 500 }, estado({ xp: 500 }), dia(1))).toBe(true);
    expect(
      gatilhoAtendido({ tipo: "degrauMinimo", degrau: 3 }, estado({ degrauAtual: 3 }), dia(1)),
    ).toBe(true);
  });

  it("atributoMinimo e atributoAbaixo são opostos no mesmo limiar", () => {
    const a = atributosVazios();
    a.aquisicao = { valor: 10, teto: 40 };
    const e = estado({ atributos: a });
    expect(gatilhoAtendido({ tipo: "atributoMinimo", chave: "aquisicao", valor: 12 }, e, dia(1))).toBe(false);
    expect(gatilhoAtendido({ tipo: "atributoAbaixo", chave: "aquisicao", valor: 12 }, e, dia(1))).toBe(true);
  });

  it("equipeMinima dispara ao contratar Funcionário de IA", () => {
    const g = { tipo: "equipeMinima", quantidade: 1 } as const;
    expect(gatilhoAtendido(g, estado({ tamanhoEquipe: 0 }), dia(1))).toBe(false);
    expect(gatilhoAtendido(g, estado({ tamanhoEquipe: 1 }), dia(1))).toBe(true);
  });

  it("aposCapitulo exige capítulo RESOLVIDO, não só entregue", () => {
    const g = { tipo: "aposCapitulo", capituloId: "retro-30" } as const;
    expect(
      gatilhoAtendido(g, estado({ capitulosEntregues: new Set(["retro-30"]) }), dia(1)),
    ).toBe(false);
    expect(
      gatilhoAtendido(g, estado({ capitulosResolvidos: new Set(["retro-30"]) }), dia(1)),
    ).toBe(true);
  });

  it("todos: exige que cada gatilho interno valha", () => {
    const g = {
      tipo: "todos",
      de: [
        { tipo: "diasAposCadastro", dias: 10 },
        { tipo: "xpMinimo", xp: 100 },
      ],
    } as const;
    expect(gatilhoAtendido(g, estado({ xp: 100 }), dia(9))).toBe(false);
    expect(gatilhoAtendido(g, estado({ xp: 99 }), dia(10))).toBe(false);
    expect(gatilhoAtendido(g, estado({ xp: 100 }), dia(10))).toBe(true);
  });
});

describe("motor — seleção de capítulos", () => {
  const cat: Capitulo[] = [
    {
      id: "b", peso: 20, titulo: "B", remetente: "x", narrativa: "n",
      gatilho: { tipo: "diasAposCadastro", dias: 0 },
      escolhas: [{ id: "1", rotulo: "r", descricao: "d", tom: "neutro", efeito: {}, desfecho: "f" }],
    },
    {
      id: "a", peso: 10, titulo: "A", remetente: "x", narrativa: "n",
      gatilho: { tipo: "diasAposCadastro", dias: 0 },
      escolhas: [{ id: "1", rotulo: "r", descricao: "d", tom: "neutro", efeito: {}, desfecho: "f" }],
    },
    {
      id: "futuro", peso: 5, titulo: "F", remetente: "x", narrativa: "n",
      gatilho: { tipo: "diasAposCadastro", dias: 99 },
      escolhas: [{ id: "1", rotulo: "r", descricao: "d", tom: "neutro", efeito: {}, desfecho: "f" }],
    },
  ];

  it("entrega em ordem de peso, não de array", () => {
    expect(capitulosPendentes(cat, estado(), dia(0)).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("não entrega capítulo cujo gatilho ainda não venceu", () => {
    expect(capitulosPendentes(cat, estado(), dia(0)).map((c) => c.id)).not.toContain("futuro");
  });

  it("não reentrega o que já foi entregue", () => {
    const e = estado({ capitulosEntregues: new Set(["a"]) });
    expect(capitulosPendentes(cat, e, dia(0)).map((c) => c.id)).toEqual(["b"]);
  });

  it("proximoCapitulo devolve um de cada vez", () => {
    expect(proximoCapitulo(cat, estado(), dia(0))?.id).toBe("a");
    expect(proximoCapitulo(cat, estado({ capitulosEntregues: new Set(["a"]) }), dia(0))?.id).toBe("b");
  });

  it("devolve null quando não há nada pendente", () => {
    const e = estado({ capitulosEntregues: new Set(["a", "b"]) });
    expect(proximoCapitulo(cat, e, dia(0))).toBeNull();
  });

  it("respeita filtro de segmento", () => {
    const soImob: Capitulo[] = [
      { ...cat[1], id: "so-imob", segmentos: ["imobiliaria"] },
    ];
    expect(capitulosPendentes(soImob, estado({ segmento: "comercio" }), dia(0))).toHaveLength(0);
    expect(capitulosPendentes(soImob, estado({ segmento: "imobiliaria" }), dia(0))).toHaveLength(1);
  });

  it("é determinístico — mesma entrada, mesma saída", () => {
    const a = capitulosPendentes(cat, estado(), dia(3)).map((c) => c.id);
    const b = capitulosPendentes(cat, estado(), dia(3)).map((c) => c.id);
    expect(a).toEqual(b);
  });
});

describe("motor — conversão para delta de progresso", () => {
  it("mapeia o efeito para o delta atômico", () => {
    expect(deltaDaEscolha({ xp: 50, moeda: -20, atributos: { presenca: 2 } })).toEqual({
      xp: 50, moeda: -20, degraus: 0, atributos: { presenca: 2 },
    });
  });

  it("efeito vazio vira delta neutro", () => {
    expect(deltaDaEscolha({})).toEqual({ xp: 0, moeda: 0, degraus: 0, atributos: undefined });
  });

  // Regra de projeto: quem sobe degrau é ação real de negócio, não narrativa.
  it("história NUNCA mexe em degrau", () => {
    expect(deltaDaEscolha({ xp: 9999 }).degraus).toBe(0);
  });
});

describe("catálogo — integridade e regras de produto", () => {
  it("ids de capítulo são únicos", () => {
    const ids = CATALOGO_HISTORIA.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ids de escolha são únicos dentro de cada capítulo", () => {
    for (const c of CATALOGO_HISTORIA) {
      const ids = c.escolhas.map((e) => e.id);
      expect(new Set(ids).size, `capítulo ${c.id}`).toBe(ids.length);
    }
  });

  it("todo capítulo oferece escolha real (2+ opções)", () => {
    for (const c of CATALOGO_HISTORIA) {
      expect(c.escolhas.length, `capítulo ${c.id}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("todo capítulo tem narrativa e desfecho preenchidos", () => {
    for (const c of CATALOGO_HISTORIA) {
      expect(c.narrativa.length, `capítulo ${c.id}`).toBeGreaterThan(40);
      for (const e of c.escolhas) {
        expect(e.desfecho.length, `escolha ${c.id}/${e.id}`).toBeGreaterThan(10);
      }
    }
  });

  // A trava mais importante do arquivo: consequência negativa é custo de
  // oportunidade, jamais destruição de progresso (EVOLUCAO-MOTOR-2026 §7.2).
  it("nenhuma escolha tira XP", () => {
    for (const c of CATALOGO_HISTORIA) {
      for (const e of c.escolhas) {
        expect(e.efeito.xp ?? 0, `${c.id}/${e.id}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("perda de atributo é no máximo -1 por escolha (arranhão, não ferida)", () => {
    for (const c of CATALOGO_HISTORIA) {
      for (const e of c.escolhas) {
        for (const [chave, v] of Object.entries(e.efeito.atributos ?? {})) {
          expect(v, `${c.id}/${e.id}/${chave}`).toBeGreaterThanOrEqual(-1);
        }
      }
    }
  });

  it("custo em moeda é limitado — nada de escolha que quebra o jogador", () => {
    for (const c of CATALOGO_HISTORIA) {
      for (const e of c.escolhas) {
        expect(e.efeito.moeda ?? 0, `${c.id}/${e.id}`).toBeGreaterThanOrEqual(-500);
      }
    }
  });

  it("todo capítulo encadeado aponta para um capítulo que existe", () => {
    const ids = new Set(CATALOGO_HISTORIA.map((c) => c.id));
    const conferir = (g: Capitulo["gatilho"]): void => {
      if (g.tipo === "aposCapitulo") expect(ids.has(g.capituloId)).toBe(true);
      if (g.tipo === "todos") g.de.forEach(conferir);
    };
    CATALOGO_HISTORIA.forEach((c) => conferir(c.gatilho));
  });

  it("helpers acham capítulo e escolha do catálogo real", () => {
    const c = capituloPorId(CATALOGO_HISTORIA, "chegada");
    expect(c).toBeDefined();
    expect(escolhaPorId(c!, "arrumar-casa")).toBeDefined();
    expect(escolhaPorId(c!, "inexistente")).toBeUndefined();
  });

  it("o jogador do dia 0 recebe a chegada primeiro", () => {
    expect(proximoCapitulo(CATALOGO_HISTORIA, estado(), dia(0))?.id).toBe("chegada");
  });

  it("um mês offline não despeja tudo de uma vez — entrega em fila", () => {
    const e = estado();
    const pendentes = capitulosPendentes(CATALOGO_HISTORIA, e, dia(35));
    expect(pendentes.length).toBeGreaterThan(1);
    expect(proximoCapitulo(CATALOGO_HISTORIA, e, dia(35))?.id).toBe("chegada");
  });
});
