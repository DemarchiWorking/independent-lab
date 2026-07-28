import type { AtributoChave } from "@tokens";

/**
 * Economia de atributos — primitiva de domínio, pura e sem dependências.
 * Ver docs/analise-prints/telas/economia-de-atributos.md (o sistema que
 * amarra marketplace, árvore de maturidade, mobília e Funcionários de IA).
 *
 * Cinco eixos, tradução do T/U/A + Marketing/Motivação do Startup Panic para
 * o vocabulário de PME real:
 *   Tecnologia  — automação, dados, infra (o core da labdatadev)
 *   Processo    — o quanto a operação é organizada/repetível
 *   Presença    — marca, site, presença digital
 *   Aquisição   — capacidade de gerar leads
 *   Capacidade  — saúde/disponibilidade da equipe
 *
 * O teto é uma constante do sistema (não por-negócio) — se no futuro a sede
 * ou outra mecânica passar a elevar o teto em si, isso vira uma migration
 * nova; hoje seria complexidade sem uso real (YAGNI).
 */

export const ATRIBUTO_CHAVES: readonly AtributoChave[] = [
  "tecnologia",
  "processo",
  "presenca",
  "aquisicao",
  "capacidade",
] as const;

export const TETO_ATRIBUTO = 40;

export interface AtributoValor {
  valor: number;
  teto: number;
}

export type Atributos = Record<AtributoChave, AtributoValor>;

export const ATRIBUTO_LABEL: Record<AtributoChave, string> = {
  tecnologia: "Tecnologia",
  processo: "Processo",
  presenca: "Presença",
  aquisicao: "Aquisição",
  capacidade: "Capacidade",
};

/**
 * Classes Tailwind estáticas por eixo — o scanner do Tailwind não resolve
 * `text-attr-${chave}` construído em runtime, então cada variante precisa
 * existir como string literal em algum lugar do código-fonte. Centralizado
 * aqui para não duplicar esse mapeamento em cada componente que colore por
 * atributo (toast, `AtributosBar`, etc.).
 */
export const ATRIBUTO_TEXT_CLASS: Record<AtributoChave, string> = {
  tecnologia: "text-attr-tecnologia",
  processo: "text-attr-processo",
  presenca: "text-attr-presenca",
  aquisicao: "text-attr-aquisicao",
  capacidade: "text-attr-capacidade",
};

export const ATRIBUTO_BG_CLASS: Record<AtributoChave, string> = {
  tecnologia: "bg-attr-tecnologia",
  processo: "bg-attr-processo",
  presenca: "bg-attr-presenca",
  aquisicao: "bg-attr-aquisicao",
  capacidade: "bg-attr-capacidade",
};

/** Atributos zerados, todos com o teto padrão — ponto de partida antes do
 *  onboarding calcular os valores iniciais reais. */
export function atributosVazios(): Atributos {
  return Object.fromEntries(
    ATRIBUTO_CHAVES.map((chave) => [chave, { valor: 0, teto: TETO_ATRIBUTO }]),
  ) as Atributos;
}

/**
 * Soma um ganho a um atributo, sempre dentro de [0, teto]. Pura — mesma
 * entrada, mesma saída. É a ÚNICA função que decide o valor final de um
 * atributo; adapters (file/Supabase) e SQL devem espelhar exatamente esta
 * regra de clamp (mesmo princípio de `nivelPorXp` em lib/gamificacao.ts).
 */
export function somarAtributo(atual: AtributoValor, ganho: number): AtributoValor {
  const valor = Math.max(0, Math.min(atual.teto, atual.valor + ganho));
  return { valor, teto: atual.teto };
}

/** Aplica um mapa de ganhos (um ou vários eixos) a um conjunto de atributos. */
export function aplicarGanhos(
  atributos: Atributos,
  ganhos: Partial<Record<AtributoChave, number>>,
): Atributos {
  const resultado = { ...atributos };
  for (const chave of ATRIBUTO_CHAVES) {
    const ganho = ganhos[chave];
    if (ganho) resultado[chave] = somarAtributo(atributos[chave], ganho);
  }
  return resultado;
}
