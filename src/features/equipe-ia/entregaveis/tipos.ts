import type { Respostas, Segmento } from "@/lib/db/types";
import type { TipoEntregavel } from "../habilidades";

/**
 * Modelo dos entregáveis dos Funcionários de IA (GH-EQP-04).
 *
 * Três camadas, cada uma só conhece a anterior:
 *
 *   dados do usuário ──► CONTEXTO ──► GERADOR (puro) ──► DOCUMENTO ──► RENDERER
 *   (repositório)        (este arq.)   canvas.ts, ...     (blocos)     html/md/json/png/react
 *
 * O gerador nunca toca em HTML, Markdown nem imagem: devolve um `Documento`
 * em blocos. Cada formato de saída é um renderer sobre o MESMO documento,
 * então o canvas na tela, o arquivo para imprimir e o Markdown nunca
 * divergem — e um formato novo (PDF, Google Docs) é um renderer novo, não
 * um gerador novo.
 */

export type Nivel = 1 | 2 | 3;

/** Número qualquer (vindo do banco) → nível válido. */
export function nivelValido(n: number): Nivel {
  return n >= 3 ? 3 : n >= 2 ? 2 : 1;
}

// ------------------------------------------------------------------ contexto

/**
 * O que o dono PUBLICOU no hub — é informação pública do negócio. Estes
 * campos podem aparecer em material voltado ao cliente (post, mensagem).
 */
export interface OfertaPublica {
  titulo: string;
  descricao: string;
  /** texto livre digitado pelo dono: "R$ 80", "a partir de R$ 50", "sob consulta" */
  preco: string;
}

/** Negócio vizinho com o qual há parceria formada E que aceitou perfil público. */
export interface ParceiroPublico {
  nome: string;
  segmento: Segmento;
}

/**
 * As respostas do cadastro. São PRIVADAS: dizem onde o negócio está fraco
 * (gargalo), quanto ele pode gastar e como capta. Só entram em documento
 * interno (canvas, plano, kit comercial). Material que o dono publica para
 * clientes (carrossel, vídeo) nunca lê este objeto — a separação é checada
 * por teste e pelo linter em `qualidade.ts`.
 */
export interface DadosPrivados {
  equipe: Respostas["equipe"];
  presencaDigital: Respostas["presencaDigital"];
  captacao: string[];
  objetivo: Respostas["objetivo"];
  gargalo: Respostas["gargalo"];
  investimento: Respostas["investimento"];
  degrau: number;
  /** `false` = negócio criado por seed/demonstração, sem respostas reais */
  temOnboarding: boolean;
}

export interface ContextoNegocio {
  /** identidade pública */
  nome: string;
  segmento: Segmento;
  /** nicho detectado pelo nome e pelas ofertas (ex.: "beleza"); cai no segmento */
  nicho: string;
  cidade: string;
  bairro: string;
  ofertas: OfertaPublica[];
  parceiros: ParceiroPublico[];
  /** só para documento interno */
  privado: DadosPrivados;
  /** nível do Funcionário de IA que gera (1–3): quanto maior, mais profundo */
  nivel: Nivel;
  /** instante da geração, injetado: o gerador não lê relógio */
  agora: string;
}

// ----------------------------------------------------------------- documento

export type CelulaCanvas =
  | "parcerias"
  | "atividades"
  | "recursos"
  | "proposta"
  | "relacionamento"
  | "canais"
  | "segmentos"
  | "custos"
  | "receitas";

export type TomDestaque = "info" | "atencao" | "sucesso";

export type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "destaque"; titulo?: string; texto: string; tom: TomDestaque }
  | { tipo: "lista"; itens: string[]; ordenada?: boolean }
  | { tipo: "checklist"; itens: string[] }
  | { tipo: "passos"; passos: Array<{ titulo: string; detalhe?: string }> }
  /** texto pronto para copiar e colar (WhatsApp, e-mail) */
  | { tipo: "mensagem"; rotulo: string; quando?: string; texto: string }
  | { tipo: "tabela"; colunas: string[]; linhas: string[][] }
  /** o Business Model Canvas no desenho padrão de 5 colunas */
  | { tipo: "canvas"; celulas: Record<CelulaCanvas, string[]> }
  | { tipo: "cartoes"; cartoes: Array<{ titulo: string; itens: string[] }> }
  | { tipo: "cena"; tempo: string; papel: string; fala: string; imagem: string; legenda: string };

export interface Secao {
  id: string;
  titulo: string;
  intro?: string;
  blocos: Bloco[];
}

export interface MetaDocumento {
  /** versionamento exigido pelo playbook (data + autor) */
  versao: string;
  geradoEm: string;
  proximaRevisao: string;
  autor: string;
  nivelAgente: Nivel;
  /** de onde saíram os dados do documento — transparência para o dono (LGPD) */
  baseadoEm: string[];
  /**
   * `interno`: usa respostas do cadastro, não deve ser publicado.
   * `publico`: só usa informação pública do negócio e pode circular.
   */
  circulacao: "interno" | "publico";
}

export interface Documento {
  tipo: TipoEntregavel;
  titulo: string;
  subtitulo: string;
  meta: MetaDocumento;
  secoes: Secao[];
  /** estrutura para integração (só no JSON): fluxo de qualificação, briefing de vídeo... */
  dados?: Record<string, unknown>;
}

// ------------------------------------------------------------------ mercado

export interface Dica {
  titulo: string;
  pontos: string[];
}

export interface Mito {
  mito: string;
  verdade: string;
}

export interface Objecao {
  objecao: string;
  resposta: string;
}

export interface PopExecucao {
  objetivo: string;
  passos: string[];
  qualidade: string[];
  erros: string[];
}

/**
 * Conhecimento de um mercado (segmento ou nicho), escrito SEMPRE do ponto de
 * vista certo. O vocabulário antigo misturava as duas pontas: usava a dor do
 * dono ("cliente que só lembra do contador quando o prazo venceu") como se
 * fosse a dor do comprador, e a frase saía dirigida à pessoa errada.
 *
 * - campos `cliente*`/`dores`/`desejos`/`gatilhos`: o COMPRADOR;
 * - `riscos`/`custos`/`recursos`/`atividadesChave`: o DONO do negócio.
 */
export interface PerfilMercado {
  id: string;
  /** "Salão e barbearia" — para o resumo do documento */
  rotulo: string;
  /** substantivo para "trabalha com ___": "projetos, obras e laudos técnicos" */
  oQueVende: string;
  /** como se chama o que o cliente recebe: "o serviço", "o pedido", "o projeto" */
  entrega: string;
  /** "quem precisa de obra, laudo ou projeto" */
  tipoDeCliente: string;
  clientes: string[];
  /** dores do COMPRADOR, em sintagma nominal ("obra que atrasa e estoura o orçamento") */
  dores: string[];
  /** o que o comprador quer, em sintagma nominal ("prazo e valor combinados por escrito") */
  desejos: string[];
  /** momentos em que o comprador procura o serviço */
  gatilhos: string[];
  /** provas que o DONO pode mostrar — instruções, nunca fatos inventados */
  provas: string[];
  dicas: Dica[];
  mitos: Mito[];
  /** perguntas para entender o cliente na conversa */
  perguntas: string[];
  /** objeções típicas do mercado, além das universais */
  objecoes: Objecao[];
  /** onde o comprador é encontrado ou atraído */
  canais: string[];
  atividadesChave: string[];
  recursos: string[];
  parcerias: string[];
  receitas: string[];
  custos: string[];
  /** documentos e registros a manter em dia (checklist — confirmar com o contador/órgão) */
  documentos: string[];
  /** passo a passo da entrega (POP de execução) */
  execucao: PopExecucao;
  indicadores: string[];
  riscos: string[];
  hashtags: string[];
  /** vende para o poder público (licitação) — só então ele entra no canvas */
  vendeParaGoverno: boolean;
  /** trabalha com hora marcada — habilita mensagens de agendamento */
  agendamento: boolean;
}

// ------------------------------------------------------------------ carrossel

export type PapelSlide = "capa" | "conteudo" | "prova" | "cta";

export interface SlideCarrossel {
  papel: PapelSlide;
  titulo: string;
  texto: string;
}

export type AnguloPauta = "dicas" | "mitos" | "passo-a-passo" | "oferta" | "bastidores" | "local";

export interface PautaCarrossel {
  id: string;
  angulo: AnguloPauta;
  rotulo: string;
  /** o que esta pauta busca: "gerar pedidos de orçamento" */
  objetivo: string;
  slides: SlideCarrossel[];
  legenda: string;
  hashtags: string[];
  /** descrição do carrossel para quem usa leitor de tela (cole no texto alternativo) */
  textoAlternativo: string;
  /** o que fotografar ou mostrar — o dono tem a imagem, a IA não inventa */
  orientacaoVisual: string;
  /**
   * `true` quando a pauta traz campos `[entre colchetes]` que só o dono sabe
   * (um bastidor real, um depoimento). A IA não inventa fato sobre o negócio:
   * o editor avisa e bloqueia o download até os campos serem preenchidos.
   */
  rascunho: boolean;
}

export interface DiaCalendario {
  /** "Semana 1 · terça" */
  quando: string;
  pautaId: string | null;
  formato: string;
  tarefa: string;
}

export interface PacoteCarrossel {
  titulo: string;
  subtitulo: string;
  meta: MetaDocumento;
  /** assinatura que vai no rodapé de cada slide */
  assinatura: string;
  pautas: PautaCarrossel[];
  calendario: DiaCalendario[];
  boasPraticas: string[];
  reaproveitamento: string[];
  metricas: string[];
}

// ----------------------------------------------------------------------- reel

export interface CenaReel {
  /** janela de tempo da cena, no formato "0–6s" */
  tempo: string;
  /** função da cena no roteiro: Gancho, Dor, Prova, CTA… */
  papel: string;
  /** o que se FALA */
  fala: string;
  /** o que se VÊ — orientação de gravação */
  imagem: string;
  /** texto que aparece na tela (quem assiste sem som precisa entender) */
  legenda: string;
}

export interface RoteiroReel {
  titulo: string;
  subtitulo: string;
  meta: MetaDocumento;
  duracaoSegundos: number;
  cenas: CenaReel[];
  legenda: string;
  hashtags: string[];
  ganchosAlternativos: string[];
  reaproveitamento: string[];
  capturaChecklist: string[];
  formatos: string[];
}

export type { TipoEntregavel };
