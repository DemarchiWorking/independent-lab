import type { Negocio } from "@/lib/db/types";

/**
 * Contexto derivado do jogo (GH-GROW-03) — conquistas nunca precisam de
 * persistência própria: "desbloqueada" é sempre calculado a partir do
 * estado já existente (nível, atributos, equipe, parcerias, sede), mesmo
 * princípio de `DEGRAUS`/gating da árvore de parcerias. Sem tabela nova.
 */
export interface ContextoConquistas {
  negocio: Negocio;
  totalFuncionarios: number;
  totalParcerias: number;
  totalNosDesbloqueados: number;
  nivelSede: number;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  /** Já desbloqueada com o contexto atual? */
  condicao: (ctx: ContextoConquistas) => boolean;
  /** 0–100. Sempre 100 quando `condicao` já é `true`. */
  progresso: (ctx: ContextoConquistas) => number;
}

function pct(atual: number, meta: number): number {
  return Math.max(0, Math.min(100, Math.round((atual / meta) * 100)));
}

export const CATALOGO_CONQUISTAS: readonly Conquista[] = [
  {
    id: "primeiro-passo",
    nome: "Primeiro Passo",
    descricao: "Chegou ao degrau 2 da escada de valor.",
    condicao: (ctx) => ctx.negocio.degrauAtual >= 2,
    progresso: (ctx) => (ctx.negocio.degrauAtual >= 2 ? 100 : pct(ctx.negocio.degrauAtual, 2)),
  },
  {
    id: "equipe-formada",
    nome: "Equipe Formada",
    descricao: "Contratou o primeiro Funcionário de IA.",
    condicao: (ctx) => ctx.totalFuncionarios >= 1,
    progresso: (ctx) => pct(ctx.totalFuncionarios, 1),
  },
  {
    id: "rede-regional",
    nome: "Rede Regional",
    descricao: "Formou a primeira parceria com um vizinho de quarteirão.",
    condicao: (ctx) => ctx.totalParcerias >= 1,
    progresso: (ctx) => pct(ctx.totalParcerias, 1),
  },
  {
    id: "trilha-de-maturidade",
    nome: "Trilha de Maturidade",
    descricao: "Desbloqueou 3 nós na Árvore de Parcerias.",
    condicao: (ctx) => ctx.totalNosDesbloqueados >= 3,
    progresso: (ctx) => pct(ctx.totalNosDesbloqueados, 3),
  },
  {
    id: "sede-propria",
    nome: "Sede Própria",
    descricao: "Evoluiu a sede para o nível 3 (sede própria, sem mensalidade).",
    condicao: (ctx) => ctx.nivelSede >= 3,
    progresso: (ctx) => pct(ctx.nivelSede, 3),
  },
  {
    id: "maturidade-digital",
    nome: "Maturidade Digital",
    descricao: "Todos os 5 eixos de atributo acima da metade do teto.",
    condicao: (ctx) =>
      Object.values(ctx.negocio.atributos).every((a) => a.valor >= a.teto / 2),
    progresso: (ctx) => {
      const valores = Object.values(ctx.negocio.atributos);
      const media = valores.reduce((soma, a) => soma + a.valor / (a.teto / 2), 0) / valores.length;
      return pct(media, 1);
    },
  },
];

export function conquistaPorId(id: string): Conquista | undefined {
  return CATALOGO_CONQUISTAS.find((c) => c.id === id);
}
