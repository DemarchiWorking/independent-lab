import type { AtributoChave } from "@tokens";

/**
 * Habilidades dos Funcionários de IA (GH-EQP-04) — o que cada agente
 * sabe FAZER, destravado por nível. É o que dá sentido de jogo a evoluir
 * um agente: nível não é número solto, é habilidade nova na lista.
 *
 * Catálogo estático, mesmo padrão de `CARGOS_IA`/`CATALOGO_MOBILIA`:
 * `lib/db` nunca importa daqui, só guarda `cargoId`/`nivel`.
 */

export type TipoEntregavel = "canvas" | "post" | "script" | "reel";

export interface HabilidadeIA {
  id: string;
  cargoId: string;
  nome: string;
  descricao: string;
  /** nível do agente a partir do qual a habilidade existe (1–3) */
  nivelMinimo: number;
  /** se produz um arquivo baixável, qual — `undefined` = habilidade passiva */
  entregavel?: TipoEntregavel;
}

export const NIVEL_MAX_FUNCIONARIO = 3;

/**
 * Custo em moeda virtual 🪙 para evoluir PARA o nível N (índice = nível
 * de destino). Escala forte de propósito: evoluir um agente compete com
 * contratar outro cargo, e essa escolha é o interessante.
 */
export const CUSTO_EVOLUCAO_FUNCIONARIO: Record<number, number> = {
  2: 1200,
  3: 3000,
};

/** Ganho de atributo ao evoluir, no eixo que o cargo já fortalece. */
export const GANHO_ATRIBUTO_EVOLUCAO = 2;

export const CATALOGO_HABILIDADES: readonly HabilidadeIA[] = [
  // ---- Documentador ----
  {
    id: "doc-canvas",
    cargoId: "documentador",
    nome: "Modelo de Negócio (Canvas)",
    descricao:
      "Monta o Business Model Canvas do seu negócio a partir das respostas do seu cadastro.",
    nivelMinimo: 1,
    entregavel: "canvas",
  },
  {
    id: "doc-proximos-passos",
    cargoId: "documentador",
    nome: "Próximos passos no canvas",
    descricao:
      "Acrescenta ao canvas um plano de ação ligado ao gargalo que você declarou.",
    nivelMinimo: 2,
  },
  {
    id: "doc-risco",
    cargoId: "documentador",
    nome: "Leitura de risco do segmento",
    descricao: "Aponta no canvas o risco que mais trava negócios do seu nicho.",
    nivelMinimo: 3,
  },

  // ---- Social Media ----
  {
    id: "social-post",
    cargoId: "social-media",
    nome: "Post pronto para publicar",
    descricao:
      "Gera uma arte de post com a identidade visual da marca, no ângulo do seu objetivo de 90 dias.",
    nivelMinimo: 1,
    entregavel: "post",
  },
  {
    id: "social-gancho-dor",
    cargoId: "social-media",
    nome: "Gancho pela dor real",
    descricao: "O post passa a citar o gargalo específico que você declarou.",
    nivelMinimo: 2,
  },
  {
    id: "social-autoridade",
    cargoId: "social-media",
    nome: "Argumento de autoridade",
    descricao: "Acrescenta ao post o argumento que costuma destravar o seu nicho.",
    nivelMinimo: 3,
  },

  // ---- Editor de vídeo ----
  {
    id: "video-roteiro",
    cargoId: "editor-video",
    nome: "Roteiro de Reels pronto para gravar",
    descricao:
      "Cena a cena, com o que falar e o que aparecer na tela — gancho, dor, virada e CTA, no seu segmento e na sua cidade.",
    nivelMinimo: 1,
    entregavel: "reel",
  },
  {
    id: "video-ganchos",
    cargoId: "editor-video",
    nome: "Ganchos alternativos para testar",
    descricao:
      "Acrescenta uma cena de prova e três aberturas diferentes — o gancho é o único trecho que decide se a plataforma entrega o vídeo.",
    nivelMinimo: 2,
  },
  {
    id: "video-reaproveitamento",
    cargoId: "editor-video",
    nome: "Plano de reaproveitamento",
    descricao:
      "Onde o mesmo material rende de novo: Story, carrossel, e-mail e criativo de anúncio — sem regravar nada.",
    nivelMinimo: 3,
  },

  // ---- Comercial ----
  {
    id: "com-script",
    cargoId: "comercial",
    nome: "Script comercial",
    descricao:
      "Abertura, perguntas de descoberta, argumentos, objeções e fechamento — adaptados ao seu segmento.",
    nivelMinimo: 1,
    entregavel: "script",
  },
  {
    id: "com-cadencia",
    cargoId: "comercial",
    nome: "Estratégia de cadência",
    descricao:
      "Acrescenta ao script o plano de follow-up dia a dia, com objeções extras.",
    nivelMinimo: 2,
  },
  {
    id: "com-reativacao",
    cargoId: "comercial",
    nome: "Reativação de lead frio",
    descricao: "Gatilho de retomada para quem disse “agora não é o momento”.",
    nivelMinimo: 3,
  },
];

/** Habilidades de um cargo, com a marca de quais já estão destravadas. */
export function habilidadesDoCargo(
  cargoId: string,
  nivel: number,
): Array<HabilidadeIA & { destravada: boolean }> {
  return CATALOGO_HABILIDADES.filter((h) => h.cargoId === cargoId).map((h) => ({
    ...h,
    destravada: nivel >= h.nivelMinimo,
  }));
}

/** O entregável baixável de um cargo, se houver (habilidade de nível 1). */
export function entregavelDoCargo(cargoId: string): TipoEntregavel | undefined {
  return CATALOGO_HABILIDADES.find((h) => h.cargoId === cargoId && h.entregavel)?.entregavel;
}

/** Cargo dono de um entregável — usado pela rota de download para saber
 *  qual funcionário (e portanto qual nível) gera o arquivo pedido. */
export function cargoDoEntregavel(tipo: TipoEntregavel): string | undefined {
  return CATALOGO_HABILIDADES.find((h) => h.entregavel === tipo)?.cargoId;
}

export function custoEvolucao(nivelDestino: number): number | undefined {
  return CUSTO_EVOLUCAO_FUNCIONARIO[nivelDestino];
}

/** Eixo que a evolução reforça — o mesmo que o cargo já fortalece. */
export function ganhoEvolucao(eixo: AtributoChave): Partial<Record<AtributoChave, number>> {
  return { [eixo]: GANHO_ATRIBUTO_EVOLUCAO };
}
