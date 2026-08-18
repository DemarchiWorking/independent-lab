/**
 * Tipos de domínio — multi-tenant.
 * Regra: tudo que não é geografia global carrega `tenantId`.
 * Ver docs/ARQUITETURA-MULTITENANT.md
 */

import type { Atributos } from "@/lib/atributos";
import type { AtributoChave } from "@tokens";
export type { Atributos, AtributoValor } from "@/lib/atributos";

/**
 * Nichos calibrados no perfil de cliente do labdatadev/Siga Pregão
 * (empresas regionais que fornecem para o poder público via licitação) —
 * substituiu o conjunto original focado em imobiliárias.
 */
export type Segmento =
  | "engenharia"
  | "contabilidade"
  | "saude"
  | "tecnologia"
  | "alimentacao"
  | "comercio"
  | "servico"
  | "outro";

export type PapelUsuario = "dono" | "equipe";

/** ---------- Geografia (global, compartilhada) ---------- */

export interface Lote {
  numero: number;
  /** tenant que ocupa o lote; null = livre */
  tenantId: string | null;
}

export interface Quarteirao {
  id: string;
  nome: string;
  lotes: Lote[];
}

export interface Bairro {
  slug: string;
  nome: string;
  quarteiroes: Quarteirao[];
}

export interface Cidade {
  slug: string;
  nome: string;
  /** cidade prioritária no ICP do labdatadev */
  prioritaria: boolean;
  bairros: Bairro[];
}

export interface Mapa {
  cidades: Cidade[];
}

/** Endereço do negócio no mapa gamificado. */
export interface Endereco {
  cidadeSlug: string;
  bairroSlug: string;
  quarteiraoId: string;
  lote: number;
}

/** ---------- Tenant ---------- */

export interface Negocio {
  id: string;
  nome: string;
  segmento: Segmento;
  endereco: Endereco;
  criadoEm: string;
  /** posição na escada de valor (1–5) */
  degrauAtual: number;
  degrauAlvo: number;
  nivel: number;
  xp: number;
  moedaVirtual: number;
  /** os 5 eixos da economia de atributos — ver lib/atributos.ts */
  atributos: Atributos;
  /** Opt-out do perfil público indexável (GH-GROW-01) — default `true`,
   *  decidido explicitamente no cadastro (GH-OPS-04), nunca assumido. */
  perfilPublico: boolean;
  /** Metadado de consentimento LGPD (GH-OPS-04) — quando e qual versão da
   *  política o dono aceitou. Não é dado sensível em si (ao contrário de
   *  `Onboarding`, que guarda as respostas reais). */
  consentimentoEm: string;
  consentimentoVersao: string;
  /** CEP bruto informado no cadastro, quando resolvido por
   *  `lib/localizacao/cep.ts` — dado **privado**, só para auditoria/suporte;
   *  nenhuma tela lê este campo. `undefined` se o cadastro foi manual. */
  cep?: string;
}

export interface Usuario {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  criadoEm: string;
}

/** As 10 respostas + o que foi calculado a partir delas. */
export interface Onboarding {
  tenantId: string;
  respostas: Respostas;
  scoreFit: number;
  degrauAlvo: number;
  servicosRecomendados: string[];
  respondidoEm: string;
}

export interface Respostas {
  nomeNegocio: string;
  segmento: Segmento;
  cidade: string;
  bairro: string;
  /** Problema que o negócio resolve para OS CLIENTES DELE — distinto de
   *  `gargalo`, que é o problema INTERNO do próprio negócio. Alimenta o
   *  Modelo de Negócio (pergunta #1 do corpus oficial GameHub). */
  problemaPrincipal: string;
  equipe: "so-eu" | "2-5" | "6-15" | "16-30" | "30+";
  presencaDigital:
    | "nada"
    | "social"
    | "portais"
    | "site-desatualizado"
    | "site-portais";
  captacao: string[];
  /** ICP real do Lab Demarchi/Siga Pregão — fornecer pro poder público via
   *  licitação. Entra no `scoreFit` (ver `features/onboarding/scoring.ts`). */
  licitacaoPublico:
    | "vende-regularmente"
    | "ja-vendeu"
    | "tem-interesse"
    | "nao-e-foco";
  modeloReceita:
    | "projeto-unico"
    | "assinatura-recorrente"
    | "comissao-resultado"
    | "venda-produto"
    | "combinacao";
  ticketMedio:
    | "ate-500"
    | "500-2000"
    | "2000-10000"
    | "10000-50000"
    | "acima-50000"
    | "nao-sei";
  clientesPagantes: "nenhum" | "1-5" | "6-20" | "21-50" | "mais-50";
  /** Entra no `degrauAlvo` (ver `features/onboarding/scoring.ts`). */
  faturamentoFaixa:
    | "ate-10k"
    | "10-30k"
    | "30-100k"
    | "100-300k"
    | "acima-300k"
    | "prefiro-nao-informar";
  /** Texto curto — "por que um cliente escolhe você e não o concorrente". */
  diferencial: string;
  /** Opcional na prática — "ainda não tenho" é resposta válida. Sem isso,
   *  a Proposta Comercial omite a seção "Prova social" inteira. */
  provaSocial: string;
  /** Opcional na prática — "não sei" é resposta válida. */
  concorrentesConhecidos: string;
  objetivo:
    | "mais-leads"
    | "organizar"
    | "vender-mais"
    | "aparecer"
    | "automatizar";
  gargalo:
    | "perco-leads"
    | "manual"
    | "sem-dados"
    | "imagem-fraca"
    | "sem-processo";
  investimento: "nao-sei" | "ate-500" | "500-1500" | "1500-3500" | "3500+";
}

/** O que o negócio divulga no hub (vitrine regional). */
export interface Oferta {
  id: string;
  tenantId: string;
  titulo: string;
  descricao: string;
  preco: string;
  criadaEm: string;
}

/**
 * Um Funcionário de IA contratado pelo tenant (produto central — ver
 * docs/PRODUTO-IA-FUNCIONARIOS.md). `cargoId` referencia o catálogo estático
 * em `features/equipe-ia/catalogo.ts` — mantido como string aqui para não
 * inverter a dependência (lib/db não importa de features/).
 *
 * ⚠️ Contratar aqui registra a INTENÇÃO/relação real (uma entrada de
 * pipeline para o Antonio seguir), não cobra automaticamente — não há
 * gateway de pagamento integrado ainda.
 */
/**
 * Disponibilidade de um Funcionário de IA (GH-EQP-01) — derivada na leitura
 * a partir de `Alocacao`, nunca um flag persistido: liberar um recurso ao
 * expirar o prazo não depende de cron nem job de fundo, mesmo princípio
 * "relógio lazy" já usado em atributos (0005) e história (0007).
 */
export type Disponibilidade =
  | { estado: "livre" }
  | { estado: "alocado"; jobId: string; expiraEm: string };

export interface FuncionarioContratado {
  id: string;
  tenantId: string;
  cargoId: string;
  contratadoEm: string;
  disponibilidade: Disponibilidade;
  /** 1–3 (GH-EQP-04) — controla a profundidade dos entregáveis que este
   *  agente produz e quais habilidades estão destravadas. Ver
   *  `features/equipe-ia/habilidades.ts`. */
  nivel: number;
}

/**
 * Estado de assinatura real (R$) de um Funcionário de IA contratado
 * (GH-COM-02, `0029_assinaturas.sql`) — sem gateway de pagamento
 * integrado ainda, é só o ESTADO (pendente/ativa/inadimplente/cancelada)
 * para o painel admin e o painel do cliente mostrarem antes do Stripe
 * existir. `precoCentavos` é snapshot do preço no momento da assinatura,
 * nunca lido de volta do catálogo (histórico de cobrança não pode
 * depender de um catálogo que muda com o tempo).
 */
export interface Assinatura {
  id: string;
  tenantId: string;
  funcionarioContratadoId: string;
  precoCentavos: number;
  periodicidade: "mensal" | "anual";
  status: "pendente" | "ativa" | "inadimplente" | "cancelada";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  ativadaEm?: string;
  proximaCobrancaEm?: string;
  canceladaEm?: string;
  criadaEm: string;
}

/**
 * Alocação de um recurso (Funcionário de IA hoje, humano no futuro) a um
 * job/entrega — GH-EQP-01. `funcionarioId` É a chave (não um `id` avulso):
 * existe no máximo UMA linha por funcionário, sobrescrita a cada nova
 * alocação — é log de "estado atual", não histórico append-only (YAGNI por
 * ora; se um dia precisar de histórico de alocações, é migration nova).
 */
export interface Alocacao {
  funcionarioId: string;
  tenantId: string;
  jobId: string;
  alocadoEm: string;
  expiraEm: string;
}

/** Nó da árvore de parcerias desbloqueado por um tenant — persistência
 *  (GH-FDN-02): `noId` referencia `features/parcerias/data.ts` (catálogo
 *  estático, mesmo padrão de `cargoId`/`jobId`), nunca duplicado por tenant. */
export interface NoDesbloqueado {
  id: string;
  tenantId: string;
  noId: string;
  desbloqueadoEm: string;
}

/** Job do marketplace aceito por um tenant — guarda anti-farm (GH-FDN-01):
 *  `jobId` referencia `features/marketplace/data.ts` (catálogo estático,
 *  mesmo padrão de `cargoId`), nunca duplicado por tenant. */
export interface TrabalhoAceito {
  id: string;
  tenantId: string;
  jobId: string;
  aceitoEm: string;
}

/** Parceria formada com um vizinho de quarteirão (GH-FDN-03) — persistência
 *  análoga a `NoDesbloqueado`, mas `vizinhoTenantId` referencia OUTRO
 *  `Negocio` real (não um catálogo estático): no Supabase é FK de verdade
 *  para `negocios`, diferente de `noId`/`jobId`/`cargoId`. */
export interface ParceriaFormada {
  id: string;
  tenantId: string;
  vizinhoTenantId: string;
  formadaEm: string;
}

/**
 * Campanha com prazo, criada por um admin, visível a todos os tenants
 * (Épico 11 — Eventos Globais). `objetivo` é uma string livre por design —
 * mesmo padrão de `jobId`/`noId`/`cargoId` nesta camada: o catálogo que dá
 * significado a ela (`EventoKey` de `features/gamificacao/engine.ts`) é
 * responsabilidade da action, não do repositório (`lib/` nunca importa de
 * `features/`). Status (agendado/ativo/encerrado) nunca é gravado — é
 * sempre derivado de `inicioEm`/`fimEm` comparado com "agora" (relógio
 * lazy, ver `features/eventos-globais/motor.ts`). */
export interface EventoGlobal {
  id: string;
  titulo: string;
  descricao: string;
  objetivo: string;
  meta: number;
  inicioEm: string;
  fimEm: string;
  recompensa: {
    xp: number;
    moeda: number;
    atributo?: { chave: AtributoChave; ganho: number };
  };
  criadoPor: string;
  criadoEm: string;
}

/** Progresso de UM tenant em UM evento global. Nasce só quando a primeira
 *  ação relevante acontece dentro da janela — sem linha "zerada"
 *  pré-criada para cada par tenant×evento. */
export interface ProgressoEventoGlobal {
  eventoId: string;
  tenantId: string;
  contagem: number;
  completoEm: string | null;
}

/**
 * Lição educacional concluída por um tenant (GH-EDU-01). `licaoId` referencia
 * `features/licoes/catalogo.ts` (catálogo estático, mesmo padrão de
 * `capituloId`/`noId`/`jobId`). Sem `escolhaId`/`resolvidoEm` como
 * `CapituloEntregue`: lição não tem escolha, só "concluí ou não".
 */
export interface LicaoConcluida {
  id: string;
  tenantId: string;
  licaoId: string;
  concluidaEm: string;
}

/**
 * Contato recebido pela página pública do negócio (GH-GROW-01). O visitante
 * deixa o PRÓPRIO contato aqui — nunca expomos e-mail/telefone do dono em
 * texto puro na página pública, isto é o "formulário intermediado" que
 * substitui isso.
 */
export interface SolicitacaoContato {
  id: string;
  tenantId: string;
  nomeRemetente: string;
  contatoRemetente: string;
  mensagem: string;
  criadaEm: string;
}

/**
 * Convite de vizinho resgatado (GH-GROW-02) — registra que `tenantIdConvidado`
 * completou o cadastro a partir do link de `tenantIdConvidante`, para (a)
 * nunca recompensar duas vezes o mesmo cadastro e (b) aplicar o teto
 * anti-abuso de convites recompensados por período (contagem por
 * `tenantIdConvidante` numa janela de tempo, feita pelo chamador).
 */
export interface ConviteResgatado {
  id: string;
  tenantIdConvidante: string;
  tenantIdConvidado: string;
  resgatadoEm: string;
}

/** Sessão autenticada. */
export interface Sessao {
  usuarioId: string;
  tenantId: string;
  nome: string;
  email: string;
  /** Papel administrativo cross-tenant — ver `lib/auth/provider.ts`
   *  (`Identidade.role`). Ausente = usuário comum. */
  role?: "admin";
}

/**
 * Solicitação de serviço que um cliente faz ao Laboratório Demarchi de dentro
 * do jogo (site/app/automação/funcionalidade). `tipo` e `status` são `string`
 * de propósito aqui (lib/ não conhece o catálogo) — as uniões estreitas vivem
 * em `features/labdatadev/tipos.ts`. Ver `documentos/ecossistema/`.
 */
export interface SolicitacaoServico {
  id: string;
  tenantId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
  atualizadoEm: string;
}

/** ---------- Read model do mapa (para a UI, não o domínio) ----------
 *  Enriquece a geografia com um resumo do negócio em cada lote ocupado. */

export interface NegocioResumo {
  id: string;
  nome: string;
  segmento: Segmento;
  nivel: number;
  degrauAtual: number;
}

export interface LoteView {
  numero: number;
  negocio: NegocioResumo | null;
}

export interface QuarteiraoView {
  id: string;
  nome: string;
  lotes: LoteView[];
}

export interface BairroView {
  slug: string;
  nome: string;
  quarteiroes: QuarteiraoView[];
}

export interface CidadeView {
  slug: string;
  nome: string;
  prioritaria: boolean;
  bairros: BairroView[];
}

export interface MapaView {
  cidades: CidadeView[];
}

/** ---------- Read model agregado do mapa (GH-MAPA-01) ----------
 *  "Só contagem", sem carregar cada negócio — para os níveis de zoom altos
 *  (região/cidade), onde a UI só precisa saber "quantos", não "quais". */

export interface CidadeResumo {
  slug: string;
  nome: string;
  totalBairros: number;
  totalNegocios: number;
}

export interface MapaResumo {
  cidades: CidadeResumo[];
}

export interface BairroResumo {
  slug: string;
  nome: string;
  totalNegocios: number;
}

/**
 * Destaque rotativo do bairro (GH-GROW-04) — negócio com mais eventos de
 * PROGRESSO RECENTE (contratação, lição, nó desbloqueado, parceria) numa
 * janela de dias — nunca por tamanho absoluto (dá chance a negócio
 * pequeno; "rotativo" emerge naturalmente porque a janela desliza no
 * tempo, não porque há sorteio). Só fachada pública, nunca dado sensível.
 */
export interface DestaqueBairro {
  tenantId: string;
  nome: string;
  segmento: Segmento;
  eventosRecentes: number;
}

/**
 * Benchmark regional agregado (GH-MAPA-04) — médias anonimizadas dos 5
 * eixos entre os negócios do MESMO bairro. Nunca compara nome a nome (só
 * "você × média"), e nunca inclui dado de onboarding (budget/score) — só
 * as mesmas colunas de fachada já usadas em `GH-MAPA-01`.
 */
export interface BenchmarkBairro {
  totalNegocios: number;
  medias: Record<AtributoChave, number>;
}

/** Escopo opcional de `lerMapaView()` (GH-MAPA-01) — quando informado, só o
 *  bairro pedido vem populado com quarteirões/lotes; os demais continuam na
 *  resposta com `quarteiroes: []` (mantém o shape de `MapaView` inteiro, só
 *  muda o que vem preenchido — evita quebrar quem itera `mapa.cidades` sem
 *  saber que existe escopo). */
export interface EscopoMapa {
  cidadeSlug: string;
  bairroSlug: string;
}

/** ---------- Sede (o "World" — ver docs/world/ARQUITETURA-WORLD.md) ---------- */

/**
 * A sede física do negócio. `nivel` referencia o catálogo estático
 * `features/sede/niveis.ts` (mesmo padrão de `cargoId` → catálogo estático
 * usado em Funcionários de IA — lib/db não conhece o catálogo, só o id).
 */
export interface Sede {
  tenantId: string;
  nivel: number;
  criadaEm: string;
  atualizadaEm: string;
}

/**
 * Um móvel comprado e posicionado num slot fixo da sede. `itemId` referencia
 * `features/sede/catalogo.ts`. `slot` é a posição (0..N-1) dentro do grid da
 * sala — reposicionável, nunca duplicado (unique por tenant+slot).
 */
export interface ItemMobiliaColocado {
  id: string;
  tenantId: string;
  itemId: string;
  slot: number;
  colocadoEm: string;
  /** 1–3 (GH-WORLD-07) — cada nível aplica de novo o bônus de atributo do
   *  item (bônus total = base × nível). Ver `features/sede/upgrade.ts`. */
  nivel: number;
}

/**
 * Um capítulo de história entregue ao jogador. `capituloId` referencia o
 * catálogo estático `features/historia/catalogo.ts` — mesmo padrão de
 * `cargoId`/`itemId`: lib/db guarda só o id, nunca o conteúdo narrativo.
 *
 * `escolhaId` nulo = entregue mas ainda não respondido (carta aberta na mesa).
 * Preenchido = o jogador decidiu, e o efeito já foi aplicado atomicamente.
 */
export interface CapituloEntregue {
  id: string;
  tenantId: string;
  capituloId: string;
  entregueEm: string;
  escolhaId: string | null;
  resolvidoEm: string | null;
}

/**
 * ---------- Admin cross-tenant ----------
 * Read model do painel `/admin/clientes`: dados de vitrine do tenant +
 * onboarding (score comercial) + assinaturas, numa única leitura. Nunca
 * exposto ao browser (só Server Action gated por `sessao.role ===
 * "admin"`, ver `features/admin-clientes/actions.ts`) — por isso pode
 * juntar campos que, individualmente, são privados por tenant.
 */
export interface ClienteAdmin {
  id: string;
  nome: string;
  segmento: Segmento;
  cidadeNome: string;
  bairroNome: string;
  degrauAtual: number;
  degrauAlvo: number;
  nivel: number;
  xp: number;
  criadoEm: string;
  onboarding: {
    scoreFit: number;
    degrauAlvo: number;
    servicosRecomendados: string[];
    respondidoEm: string;
  } | null;
  assinaturas: Assinatura[];
}

/**
 * ---------- Documentação de negócio gerada por IA (GH-DOC-01) ----------
 * Resultado entregue ao cliente pelo motor headless (`document-engine/`,
 * cron horário) — cada rodada INSERE linhas novas, nunca sobrescreve; o
 * histórico de versões vive na tabela. Só existe no driver Supabase (esta
 * esteira depende do Postgres + do motor rodando na VPS — modo `file` é
 * demo/dev sem infra, ver `listarMeusDocumentos` no file-adapter).
 */
export interface DocumentoGerado {
  id: string;
  tenantId: string;
  tipo:
    | "canvas"
    | "modelo-negocio"
    | "swot"
    | "resumo-executivo"
    | "roadmap-melhoria-continua"
    | "proposta-comercial"
    | "analise-concorrencia";
  titulo: string;
  conteudoMarkdown: string;
  geradoEm: string;
}
