import { describe, expect, it } from "vitest";
import { CARGOS_IA } from "@/features/equipe-ia/catalogo";
import { senioridadeDe } from "@/features/equipe-ia/senioridade";
import { escolherPitch } from "@/features/vendas/pitchVisita";
import { atributosVazios } from "@/lib/atributos";
import type { Negocio } from "@/lib/db/types";
import { aberturaDe, OPCOES_POR_CONVERSA, opcoesPara } from "./catalogo";
import {
  AVATAR_DONO,
  AVATAR_VISITANTE,
  avatarIdDeIa,
  iaDeAvatarId,
  nomeDoInterlocutor,
  type Interlocutor,
} from "./tipos";

const AGORA = "2026-03-01T12:00:00.000Z";
const CONTRATADO = "2026-02-20T12:00:00.000Z"; // 9 dias → Pleno

const NEGOCIO: Negocio = {
  id: "t-vizinho",
  nome: "Marcenaria do Vale",
  segmento: "comercio",
  endereco: { cidadeSlug: "colatina", bairroSlug: "centro", quarteiraoId: "q1", lote: 3 },
  criadoEm: "2026-01-05T10:00:00.000Z",
  degrauAtual: 2,
  degrauAlvo: 4,
  nivel: 3,
  xp: 420,
  moedaVirtual: 900,
  // `presenca` é o eixo mais fraco de propósito: torna o pitch escolhido
  // determinístico (social-media), em vez de depender do desempate do zero.
  atributos: {
    ...atributosVazios(),
    tecnologia: { valor: 40, teto: 100 },
    processo: { valor: 35, teto: 100 },
    presenca: { valor: 8, teto: 100 },
    aquisicao: { valor: 30, teto: 100 },
    capacidade: { valor: 25, teto: 100 },
  },
  consentimentoLgpdEm: "2026-01-05T10:00:00.000Z",
};

/** Todos os interlocutores possíveis, para varrer as invariantes de uma vez. */
function todosOsInterlocutores(): Interlocutor[] {
  const lista: Interlocutor[] = [];

  for (const cargo of CARGOS_IA) {
    lista.push({
      tipo: "ia-propria",
      avatarId: `ia:${cargo.id}`,
      cargo,
      senioridade: senioridadeDe(CONTRATADO, AGORA),
      disponibilidade: { estado: "livre" },
    });
    lista.push({
      tipo: "ia-propria",
      avatarId: `ia:${cargo.id}`,
      cargo,
      senioridade: senioridadeDe(CONTRATADO, AGORA),
      disponibilidade: {
        estado: "alocado",
        jobId: "migrar-excel-sqlserver",
        expiraEm: "2026-03-04T18:00:00.000Z",
      },
    });
    lista.push({
      tipo: "ia-visitada",
      avatarId: `ia:${cargo.id}`,
      cargo,
      nomeAnfitriao: NEGOCIO.nome,
    });
  }

  lista.push({
    tipo: "jogador-visitado",
    avatarId: "dono",
    negocio: NEGOCIO,
    nivelSedeNome: "Sala comercial",
    pitch: escolherPitch(NEGOCIO),
  });

  return lista;
}

describe("interação — ids de avatar (a conversa depende de bater ida e volta)", () => {
  it("ida e volta preserva a chave do funcionário", () => {
    for (const chave of ["documentador", "241990b9f344746b", "a-b_c.1"]) {
      expect(iaDeAvatarId(avatarIdDeIa(chave))).toBe(chave);
    }
  });

  it("o dono e o visitante NÃO são avatares de IA", () => {
    expect(iaDeAvatarId(AVATAR_DONO)).toBeNull();
    expect(iaDeAvatarId(AVATAR_VISITANTE)).toBeNull();
  });

  it("id desconhecido ou prefixo vazio devolve null em vez de string vazia", () => {
    expect(iaDeAvatarId("qualquer-coisa")).toBeNull();
    expect(iaDeAvatarId("")).toBeNull();
    // `"ia:"` sem chave resolveria para `""` e faria `find` casar com nada —
    // melhor null explícito do que uma busca silenciosamente vazia
    expect(iaDeAvatarId("ia:")).toBeNull();
  });

  it("dono e visitante têm ids distintos", () => {
    expect(AVATAR_DONO).not.toBe(AVATAR_VISITANTE);
  });
});

describe("interação — invariantes de todo interlocutor", () => {
  const interlocutores = todosOsInterlocutores();

  it("cobre os três tipos de interlocutor", () => {
    expect(new Set(interlocutores.map((i) => i.tipo))).toEqual(
      new Set(["ia-propria", "ia-visitada", "jogador-visitado"]),
    );
  });

  it("todo interlocutor oferece exatamente 4 opções", () => {
    for (const i of interlocutores) {
      expect(opcoesPara(i)).toHaveLength(OPCOES_POR_CONVERSA);
    }
  });

  it("ids das opções são únicos dentro da mesma conversa", () => {
    for (const i of interlocutores) {
      const ids = opcoesPara(i).map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("nenhum rótulo, desfecho ou abertura sai vazio", () => {
    for (const i of interlocutores) {
      expect(aberturaDe(i).trim().length).toBeGreaterThan(0);
      expect(nomeDoInterlocutor(i).trim().length).toBeGreaterThan(0);
      for (const o of opcoesPara(i)) {
        expect(o.rotulo.trim().length).toBeGreaterThan(0);
        expect(o.desfecho.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("nenhum texto vaza `undefined`/`NaN` de dado faltando", () => {
    for (const i of interlocutores) {
      const textos = [aberturaDe(i), ...opcoesPara(i).flatMap((o) => [o.rotulo, o.desfecho])];
      for (const t of textos) {
        expect(t).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });

  it("todo href de `ir-para` é uma rota interna absoluta com CTA", () => {
    for (const i of interlocutores) {
      for (const o of opcoesPara(i)) {
        if (o.efeito.tipo !== "ir-para") continue;
        expect(o.efeito.href.startsWith("/")).toBe(true);
        expect(o.efeito.cta.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("nenhuma conversa muta estado — não há efeito de recompensa", () => {
    const permitidos = new Set(["fala", "ir-para", "focar-pitch", "encerrar"]);
    for (const i of interlocutores) {
      for (const o of opcoesPara(i)) {
        expect(permitidos.has(o.efeito.tipo)).toBe(true);
      }
    }
  });

  it("regra 6 do AGENTS.md: moeda virtual 🪙 nunca aparece na conversa", () => {
    for (const i of interlocutores) {
      const textos = [aberturaDe(i), ...opcoesPara(i).flatMap((o) => [o.rotulo, o.desfecho])];
      for (const t of textos) {
        expect(t).not.toContain("🪙");
      }
    }
  });

  it("`focar-pitch` só existe na visita ao dono vizinho", () => {
    for (const i of interlocutores) {
      const temFoco = opcoesPara(i).some((o) => o.efeito.tipo === "focar-pitch");
      expect(temFoco).toBe(i.tipo === "jogador-visitado");
    }
  });
});

describe("interação — Funcionário de IA na minha sede", () => {
  const cargo = CARGOS_IA[0];
  const base = {
    tipo: "ia-propria" as const,
    avatarId: `ia:${cargo.id}`,
    cargo,
    senioridade: senioridadeDe(CONTRATADO, AGORA),
  };

  it("a resposta de disponibilidade muda entre livre e alocado", () => {
    const livre = opcoesPara({ ...base, disponibilidade: { estado: "livre" } });
    const alocado = opcoesPara({
      ...base,
      disponibilidade: {
        estado: "alocado",
        jobId: "migrar-excel-sqlserver",
        expiraEm: "2026-03-04T18:00:00.000Z",
      },
    });

    const d = (o: ReturnType<typeof opcoesPara>) =>
      o.find((x) => x.id === "disponibilidade")?.desfecho ?? "";

    expect(d(livre)).not.toBe(d(alocado));
    expect(d(livre)).toContain("livre");
    expect(d(alocado)).toContain("migrar-excel-sqlserver");
  });

  it("a opção de tarefa leva ao marketplace", () => {
    const tarefa = opcoesPara({ ...base, disponibilidade: { estado: "livre" } }).find(
      (o) => o.id === "tarefa",
    );
    expect(tarefa?.efeito).toEqual({
      tipo: "ir-para",
      href: "/hub?ver=marketplace",
      cta: "Ver serviços disponíveis",
    });
  });

  it("a resposta de habilidades reflete a senioridade — júnior vê menos", () => {
    const desfecho = (dias: number) =>
      opcoesPara({
        ...base,
        senioridade: senioridadeDe(
          CONTRATADO,
          new Date(Date.parse(CONTRATADO) + dias * 86_400_000).toISOString(),
        ),
        disponibilidade: { estado: "livre" },
      }).find((o) => o.id === "habilidades")?.desfecho ?? "";

    expect(desfecho(0)).toContain("1 de 4");
    expect(desfecho(0)).toContain("Júnior");
    expect(desfecho(90)).toContain("4 de 4");
    expect(desfecho(90)).toContain("Especialista");
  });

  it("cada cargo abre a conversa com a própria voz", () => {
    const aberturas = CARGOS_IA.map((c) =>
      aberturaDe({ ...base, cargo: c, disponibilidade: { estado: "livre" } }),
    );
    expect(new Set(aberturas).size).toBe(CARGOS_IA.length);
  });

  it("cada cargo pede tarefa com as próprias palavras", () => {
    const rotulos = CARGOS_IA.map(
      (c) =>
        opcoesPara({ ...base, cargo: c, disponibilidade: { estado: "livre" } }).find(
          (o) => o.id === "tarefa",
        )?.rotulo,
    );
    expect(new Set(rotulos).size).toBe(CARGOS_IA.length);
  });
});

describe("interação — vitrine na sede do vizinho", () => {
  it("o preço do Funcionário de IA visitado é R$ real, nunca moeda virtual", () => {
    for (const cargo of CARGOS_IA) {
      const preco = opcoesPara({
        tipo: "ia-visitada",
        avatarId: `ia:${cargo.id}`,
        cargo,
        nomeAnfitriao: NEGOCIO.nome,
      }).find((o) => o.id === "preco");

      expect(preco?.desfecho).toContain("R$");
      expect(preco?.desfecho).toContain(cargo.precoMensal.toLocaleString("pt-BR"));
    }
  });

  it("o dono vizinho se apresenta com segmento, degrau e nível de sede reais", () => {
    const quemE = opcoesPara({
      tipo: "jogador-visitado",
      avatarId: "dono",
      negocio: NEGOCIO,
      nivelSedeNome: "Sala comercial",
      pitch: escolherPitch(NEGOCIO),
    }).find((o) => o.id === "quem-e");

    expect(quemE?.desfecho).toContain(NEGOCIO.nome);
    expect(quemE?.desfecho).toContain("Loja Produto (estoque)");
    expect(quemE?.desfecho).toContain("degrau 2");
    expect(quemE?.desfecho).toContain("Sala comercial");
  });

  it("a fala sobre a operação reusa o pitch do eixo mais fraco", () => {
    const pitch = escolherPitch(NEGOCIO);
    const operacao = opcoesPara({
      tipo: "jogador-visitado",
      avatarId: "dono",
      negocio: NEGOCIO,
      nivelSedeNome: "Sala comercial",
      pitch,
    }).find((o) => o.id === "operacao");

    expect(operacao?.desfecho).toContain(pitch.headline);
  });
});
