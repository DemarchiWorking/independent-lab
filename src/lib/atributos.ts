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

/**
 * Piso mínimo por eixo exigido para aceitar um job do marketplace ou
 * desbloquear um nó da árvore de parcerias (GH-ATR-03). Eixos ausentes ou
 * com valor `<= 0` não exigem nada — mapa parcial de propósito.
 */
export type Requisitos = Partial<Record<AtributoChave, number>>;

/** Um eixo que não atinge o mínimo exigido, com o quanto falta. */
export interface AtributoFaltante {
  chave: AtributoChave;
  label: string;
  atual: number;
  minimo: number;
  falta: number;
}

/**
 * Eixos que NÃO atingem o mínimo exigido, na ordem canônica de
 * ATRIBUTO_CHAVES. Lista vazia = requisito atendido. Pura.
 * Compara com >=: atingir o mínimo exato ATENDE o requisito.
 */
export function atributosFaltantes(
  atuais: Atributos,
  requisitos: Requisitos,
): AtributoFaltante[] {
  const faltantes: AtributoFaltante[] = [];
  for (const chave of ATRIBUTO_CHAVES) {
    const minimo = requisitos[chave];
    if (!minimo || minimo <= 0) continue;
    const atual = atuais[chave].valor;
    if (atual >= minimo) continue;
    faltantes.push({ chave, label: ATRIBUTO_LABEL[chave], atual, minimo, falta: minimo - atual });
  }
  return faltantes;
}

/** Atalho booleano sobre `atributosFaltantes` — true quando o requisito é atendido. */
export function atendeRequisitos(atuais: Atributos, requisitos: Requisitos): boolean {
  return atributosFaltantes(atuais, requisitos).length === 0;
}

/** Ex.: "Requisito não atendido: Tecnologia 8/20, Capacidade 6/12." */
export function mensagemRequisito(faltantes: readonly AtributoFaltante[]): string {
  if (faltantes.length === 0) return "";
  const partes = faltantes.map((f) => `${f.label} ${f.atual}/${f.minimo}`);
  return `Requisito não atendido: ${partes.join(", ")}.`;
}
