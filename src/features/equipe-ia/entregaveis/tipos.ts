import type { Negocio, Onboarding, Respostas, Segmento } from "@/lib/db/types";

/**
 * Entregáveis dos Funcionários de IA (GH-EQP-04) — o que cada agente
 * PRODUZ de verdade, não só o que ele "representa" numa lista.
 *
 * Arquitetura: geração é **pura** (perfil → estrutura de dados), separada
 * de renderização (estrutura → HTML/PNG) e de transporte (rota que baixa).
 * Mesma disciplina de `features/world/engine/` (regra pura) vs. `render/`
 * (desenho): a lógica de negócio de "o que o canvas de uma contabilidade
 * de Mendes deve dizer" é testável sem tocar em I/O nenhum.
 */

/** Entrada única de todo gerador — o que sabemos do negócio. */
export interface PerfilNegocio {
  nomeNegocio: string;
  segmento: Segmento;
  cidade: string;
  bairro: string;
  respostas: Respostas;
  degrauAtual: number;
  /** nível do Funcionário de IA que está gerando (1–3) — quanto maior,
   *  mais profundo o entregável. É o que dá sentido a evoluir o agente. */
  nivelAgente: number;
}

/** Os 9 quadros do Business Model Canvas (Osterwalder & Pigneur, 2010). */
export type ChaveBloco =
  | "parcerias"
  | "atividades"
  | "recursos"
  | "proposta"
  | "relacionamento"
  | "canais"
  | "clientes"
  | "custos"
  | "receitas";

/**
 * Quão bem definido está o quadro, **derivado das respostas do cadastro**
 * (ver `maturidadeDosBlocos` em canvas.ts). Não é opinião do agente: cada
 * regra aponta a resposta que a sustenta, e o canvas diz isso ao leitor.
 */
export type Maturidade = "definido" | "parcial" | "a-definir";

export interface BlocoCanvas {
  chave: ChaveBloco;
  /** posição na ordem de leitura recomendada (1 = clientes) */
  numero: number;
  titulo: string;
  /** pergunta-guia que o quadro precisa responder */
  pergunta: string;
  /** a resposta: o que vai no quadro, já no vocabulário do nicho */
  itens: string[];
  /** a melhor prática do segmento para este quadro */
  boaPratica: string;
  /** o número que diz se o quadro está funcionando */
  indicador: string;
  /** como o quadro está hoje, segundo o cadastro */
  maturidade: Maturidade;
  /** por que essa maturidade — a resposta do cadastro que a sustenta */
  evidencia: string;
  /** hipótese a validar com clientes reais — só a partir do nível 2 */
  hipotese?: string;
}

export interface ControleDocumento {
  documento: string;
  versao: string;
  classificacao: string;
  metodologia: string;
  elaboradoPor: string;
  revisao: string;
}

export interface ItemResumo {
  rotulo: string;
  texto: string;
}

export interface Prioridade {
  bloco: string;
  porque: string;
  acao: string;
}

export interface FasePlano {
  fase: string;
  acoes: string[];
}

export interface RiscoCanvas {
  risco: string;
  mitigacao: string;
}

export interface CanvasNegocio {
  titulo: string;
  subtitulo: string;
  controle: ControleDocumento;
  /** 5 linhas que um investidor ou o Sebrae leria primeiro */
  resumoExecutivo: ItemResumo[];
  /** 0–100: média do quanto cada quadro está definido */
  indiceClareza: number;
  rotuloClareza: string;
  /** os 9 quadros, na ordem de leitura recomendada */
  blocos: BlocoCanvas[];
  /** os até 3 quadros menos definidos e o que fazer — todos os níveis */
  prioridades: Prioridade[];
  /** só a partir do nível 2 do agente */
  proximosPassos: string[];
  /** plano de 90 dias em 3 fases — só a partir do nível 2 */
  plano90Dias: FasePlano[];
  /** matriz de riscos — só a partir do nível 3 */
  riscos: RiscoCanvas[];
  /** checklist de validação com clientes reais — só a partir do nível 3 */
  checklistValidacao: string[];
}

export interface PostSocial {
  headline: string;
  corpo: string;
  cta: string;
  hashtags: string[];
}

export interface CenaReel {
  /** janela de tempo da cena, no formato "0–3s" */
  tempo: string;
  /** função da cena no roteiro: Gancho, Dor, Prova, CTA… */
  papel: string;
  /** o que se FALA (ou o texto na tela, se for vídeo mudo) */
  fala: string;
  /** o que se VÊ — orientação de gravação, não efeito especial */
  imagem: string;
}

export interface RoteiroReel {
  titulo: string;
  subtitulo: string;
  duracaoSegundos: number;
  cenas: CenaReel[];
  legenda: string;
  hashtags: string[];
  /** ganchos alternativos para testar — só a partir do nível 2 */
  ganchosAlternativos: string[];
  /** onde mais o mesmo material rende — só a partir do nível 3 */
  reaproveitamento: string[];
}

export interface ObjecaoComercial {
  objecao: string;
  resposta: string;
}

export interface ScriptComercial {
  titulo: string;
  abertura: string;
  descoberta: string[];
  argumentos: string[];
  objecoes: ObjecaoComercial[];
  fechamento: string;
  /** estratégia de cadência — só a partir do nível 2 */
  cadencia: string[];
}

/**
 * Monta o perfil a partir do que já está persistido. `onboarding` pode ser
 * `null` (negócio criado por seed/demo sem onboarding): nesse caso caímos
 * em respostas neutras, e o entregável sai genérico em vez de quebrar —
 * mesma degradação limpa de `RequisitoAtributos` sem `atributos`.
 */
export function perfilDoNegocio(
  negocio: Negocio,
  onboarding: Onboarding | null,
  nivelAgente: number,
): PerfilNegocio {
  const respostas: Respostas = onboarding?.respostas ?? {
    nomeNegocio: negocio.nome,
    segmento: negocio.segmento,
    // slug → nome legível: sem isso o post sairia "…em mendes?" em vez de
    // "…em Mendes?" — detalhe pequeno que faz o material parecer amador
    // justamente no arquivo que o empresário vai publicar.
    cidade: humanizarSlug(negocio.endereco.cidadeSlug),
    bairro: humanizarSlug(negocio.endereco.bairroSlug),
    problemaPrincipal: "",
    equipe: "so-eu",
    presencaDigital: "nada",
    captacao: [],
    licitacaoPublico: "nao-e-foco",
    modeloReceita: "projeto-unico",
    ticketMedio: "nao-sei",
    clientesPagantes: "nenhum",
    faturamentoFaixa: "prefiro-nao-informar",
    diferencial: "",
    provaSocial: "",
    concorrentesConhecidos: "",
    objetivo: "mais-leads",
    gargalo: "perco-leads",
    investimento: "nao-sei",
  };

  return {
    nomeNegocio: negocio.nome,
    segmento: negocio.segmento,
    cidade: respostas.cidade,
    bairro: respostas.bairro,
    respostas,
    degrauAtual: negocio.degrauAtual,
    nivelAgente,
  };
}

/** `barra-do-pirai` → `Barra Do Pirai`. Só para o caminho de fallback (sem
 *  onboarding); quando há onboarding, a cidade já vem digitada pelo dono. */
function humanizarSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
