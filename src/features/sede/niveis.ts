/**
 * Catálogo de níveis de sede — mesmo padrão de `DEGRAUS`
 * (features/onboarding/scoring.ts): objeto estático, id numérico, nunca
 * persistido inteiro (a sede guarda só `nivel`, o resto é derivado daqui).
 *
 * Espelha a mecânica de "Melhorar escritório" do Startup Panic
 * (docs/analise-prints/telas/sede-escritorio-e-mobilia.md) — trade-off real:
 * mais capacidade custa mais fixo por mês.
 *
 * `custoMensal` é **simulado** (nunca cobrado de verdade — mesma regra do
 * módulo de finanças, ver docs/analise-prints/telas/eventos-financas-e-progressao.md §2).
 */

export interface NivelSede {
  nivel: number;
  nome: string;
  tipo: "alugada" | "propria";
  capacidadeFuncionarios: number;
  custoMensal: number;
  /** custo em moeda virtual 🪙 para evoluir A PARTIR do nível anterior */
  custoEvolucao: number;
  /** quantos espaços de mobília a sala comporta neste nível */
  slots: number;
  descricao: string;
}

export const NIVEL_SEDE_MAX = 4;

/** XP concedido ao evoluir a sede (GH-WORLD-02) — gap fechado: evoluir de
 *  nível não disparava nenhum evento de gamificação, ao contrário de todo
 *  outro evento do catálogo (`funcionario_ia_contratado`, `servico_*` etc).
 *  Valor fixo por evolução, não escalado por nível — mesma ordem de
 *  grandeza de `parceria_formada` (150), sem dado de produto que justifique
 *  variar por nível ainda. */
export const XP_EVOLUCAO_SEDE = 150;

export const NIVEIS_SEDE: Record<number, NivelSede> = {
  1: {
    nivel: 1,
    nome: "Sala Compartilhada",
    tipo: "alugada",
    capacidadeFuncionarios: 3,
    custoMensal: 0,
    custoEvolucao: 0,
    slots: 3,
    descricao: "Uma mesa, um roteador e muita vontade. Todo negócio começa aqui.",
  },
  2: {
    nivel: 2,
    nome: "Sala Própria",
    tipo: "alugada",
    capacidadeFuncionarios: 8,
    custoMensal: 300,
    custoEvolucao: 1500,
    slots: 6,
    descricao: "Espaço só seu, alugado — cabe uma equipe pequena e já parece profissional.",
  },
  3: {
    nivel: 3,
    nome: "Andar Completo",
    tipo: "propria",
    capacidadeFuncionarios: 20,
    custoMensal: 0,
    custoEvolucao: 5000,
    slots: 10,
    descricao: "Sede própria, sem mensalidade. O investimento é alto, mas o teto some.",
  },
  4: {
    nivel: 4,
    nome: "Prédio Comercial",
    tipo: "propria",
    capacidadeFuncionarios: 50,
    custoMensal: 0,
    custoEvolucao: 15000,
    slots: 14,
    descricao: "O nível máximo de hoje — vitrine do quarteirão, referência regional.",
  },
};

export function nivelSede(n: number): NivelSede {
  return NIVEIS_SEDE[n] ?? NIVEIS_SEDE[1];
}

export function proximoNivelSede(n: number): NivelSede | null {
  return n < NIVEL_SEDE_MAX ? NIVEIS_SEDE[n + 1] : null;
}
