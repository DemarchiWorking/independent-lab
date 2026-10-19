import type { AtributoChave } from "@tokens";

/**
 * Habilidades dos Funcionários de IA (GH-EQP-04) — o que cada agente
 * sabe FAZER, destravado por nível. É o que dá sentido de jogo a evoluir
 * um agente: nível não é número solto, é habilidade nova na lista.
 *
 * Catálogo estático, mesmo padrão de `CARGOS_IA`/`CATALOGO_MOBILIA`:
 * `lib/db` nunca importa daqui, só guarda `cargoId`/`nivel`.
 *
 * Princípio de projeto: o nível aumenta a PROFUNDIDADE, não a utilidade. O
 * nível 1 já entrega um material completo e usável (um canvas inteiro, dois
 * carrosséis prontos, um kit comercial funcional); evoluir acrescenta análise,
 * mais pautas e mais automação. Um microempreendedor que contrata o primeiro
 * nível não recebe um esboço.
 */

export type TipoEntregavel = "canvas" | "pop" | "carrossel" | "comercial" | "reel";

export interface HabilidadeIA {
  id: string;
  cargoId: string;
  nome: string;
  descricao: string;
  /** nível do agente a partir do qual a habilidade existe (1–3) */
  nivelMinimo: number;
  /** se produz um arquivo baixável, qual — `undefined` = habilidade que aprofunda um entregável */
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
      "Canvas completo, com as 9 células preenchidas a partir do seu cadastro e das suas ofertas, as primeiras ações da semana e os documentos que o seu mercado costuma exigir.",
    nivelMinimo: 1,
    entregavel: "canvas",
  },
  {
    id: "doc-pops",
    cargoId: "documentador",
    nome: "Manual de Processos (POPs)",
    descricao:
      "Procedimentos passo a passo para atender, entregar e fazer o pós-venda, com responsável, checklist de qualidade e controle de versões.",
    nivelMinimo: 1,
    entregavel: "pop",
  },
  {
    id: "doc-proximos-passos",
    cargoId: "documentador",
    nome: "Diagnóstico e plano de 90 dias",
    descricao:
      "Acrescenta ao canvas o diagnóstico, o plano de 90 dias e os indicadores, e ao manual os procedimentos financeiro e de presença digital.",
    nivelMinimo: 2,
  },
  {
    id: "doc-risco",
    cargoId: "documentador",
    nome: "Riscos e revisão trimestral",
    descricao:
      "Tabela de riscos do seu mercado com ação preventiva, revisão a cada 90 dias, e no manual a integração de novo colaborador e o tratamento de reclamações.",
    nivelMinimo: 3,
  },

  // ---- Social Media ----
  {
    id: "social-carrossel",
    cargoId: "social-media",
    nome: "Carrosséis prontos e calendário",
    descricao:
      "Duas pautas de carrossel com texto dos slides, legenda, hashtags e texto alternativo, mais um calendário de 2 semanas. Você edita e baixa as imagens.",
    nivelMinimo: 1,
    entregavel: "carrossel",
  },
  {
    id: "social-gancho-dor",
    cargoId: "social-media",
    nome: "Mais pautas e calendário de 4 semanas",
    descricao:
      "Acrescenta as pautas de mito ou verdade e de como pedir orçamento, e estende o calendário para 4 semanas.",
    nivelMinimo: 2,
  },
  {
    id: "social-autoridade",
    cargoId: "social-media",
    nome: "Bastidores, comunidade e reaproveitamento",
    descricao:
      "Acrescenta as pautas de bastidores e de comunidade e o plano para reaproveitar cada carrossel em outros formatos.",
    nivelMinimo: 3,
  },

  // ---- Editor de vídeo ----
  {
    id: "video-roteiro",
    cargoId: "editor-video",
    nome: "Roteiro de vídeo pronto para gravar",
    descricao:
      "Cena a cena, com a fala, o que mostrar, o texto de tela e o checklist de captura, no seu mercado e na sua cidade.",
    nivelMinimo: 1,
    entregavel: "reel",
  },
  {
    id: "video-ganchos",
    cargoId: "editor-video",
    nome: "Segunda dica e ganchos alternativos",
    descricao:
      "Acrescenta uma segunda dica ao roteiro e três aberturas diferentes para testar: o gancho decide se a plataforma entrega o vídeo.",
    nivelMinimo: 2,
  },
  {
    id: "video-reaproveitamento",
    cargoId: "editor-video",
    nome: "Cena de prova e plano de reaproveitamento",
    descricao:
      "Acrescenta uma cena de prova real e mostra onde o mesmo material rende de novo: Story, carrossel, mensagem e anúncio.",
    nivelMinimo: 3,
  },

  // ---- Comercial ----
  {
    id: "com-script",
    cargoId: "comercial",
    nome: "Kit comercial",
    descricao:
      "Critérios de lead (BANT), atendimento em 5 minutos no WhatsApp Business, mensagens prontas, script de ligação, cadência de acompanhamento e planilha de funil.",
    nivelMinimo: 1,
    entregavel: "comercial",
  },
  {
    id: "com-cadencia",
    cargoId: "comercial",
    nome: "Fluxo de qualificação e automação",
    descricao:
      "Acrescenta o fluxo de qualificação em formato estruturado, a cadência completa, mais mensagens e a automação certa para o seu orçamento.",
    nivelMinimo: 2,
  },
  {
    id: "com-reativacao",
    cargoId: "comercial",
    nome: "Reativação e checklist de teste",
    descricao:
      "Mensagem de retomada para clientes antigos, cadência de 45 e 90 dias e o checklist para testar a automação antes de ligá-la.",
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

/** Os entregáveis baixáveis de um cargo, na ordem do catálogo. */
export function entregaveisDoCargo(cargoId: string): TipoEntregavel[] {
  return CATALOGO_HABILIDADES.filter(
    (h): h is HabilidadeIA & { entregavel: TipoEntregavel } => h.cargoId === cargoId && Boolean(h.entregavel),
  ).map((h) => h.entregavel);
}

/** O primeiro entregável do cargo (o do nível 1) — atalho para telas com um só botão. */
export function entregavelDoCargo(cargoId: string): TipoEntregavel | undefined {
  return entregaveisDoCargo(cargoId)[0];
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
