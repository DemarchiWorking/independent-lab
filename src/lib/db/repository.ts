import type { AtributoChave } from "@tokens";
import type {
  Alocacao,
  BairroResumo,
  BenchmarkBairro,
  CapituloEntregue,
  ConviteResgatado,
  DestaqueBairro,
  Endereco,
  EscopoMapa,
  EventoGlobal,
  FuncionarioContratado,
  ItemMobiliaColocado,
  LicaoConcluida,
  Mapa,
  MapaResumo,
  MapaView,
  Negocio,
  NoDesbloqueado,
  Oferta,
  Onboarding,
  ParceriaFormada,
  ProgressoEventoGlobal,
  Sede,
  SolicitacaoContato,
  TrabalhoAceito,
  Usuario,
} from "./types";

/**
 * Contrato de persistência de DOMÍNIO. Credenciais e senha não moram aqui —
 * são responsabilidade do `AuthProvider` (lib/auth). `features/` conhece só
 * esta interface; trocar arquivos por Supabase é escrever outro adapter.
 * Ver docs/ARQUITETURA-MULTITENANT.md
 */
export interface GameRepository {
  /**
   * Round trip mais barato possível contra o banco — usado só pelo
   * healthcheck (`src/app/api/health/route.ts`) para distinguir "processo no
   * ar" de "processo no ar mas banco fora". Nunca lança: devolve `false` no
   * lugar. Ver `deploy/deploy.sh` (GH-OPS).
   */
  pingDb(): Promise<boolean>;
  /** ---- Geografia (global) ---- */
  lerMapa(): Promise<Mapa>;
  /**
   * Mapa enriquecido com o resumo do negócio em cada lote (read model da UI).
   * `escopo` (GH-MAPA-01) é opcional e só filtra — quando informado, só o
   * bairro pedido vem com `quarteiroes` populado; o shape inteiro do mundo
   * continua no retorno (nunca quebra quem itera `cidades`/`bairros` sem
   * saber do escopo). Hoje nenhum chamador passa `escopo` (a única tela,
   * `MapaScreen`, troca de cidade/bairro no client sem novo fetch — ver
   * decisão registrada em `docs/BACKLOG-PRODUTO.md` GH-MAPA-01); existe para
   * quando a navegação por zoom (`GH-MAPA-02`) precisar.
   */
  lerMapaView(escopo?: EscopoMapa): Promise<MapaView>;
  /** Contagem por cidade, sem carregar cada negócio (GH-MAPA-01) — para o
   *  nível de zoom mais alto (região). */
  lerMapaResumo(): Promise<MapaResumo>;
  /** Contagem por bairro dentro de UMA cidade (GH-MAPA-01) — para o nível de
   *  zoom intermediário. */
  lerBairroResumo(cidadeSlug: string): Promise<BairroResumo[]>;
  /** Médias agregadas dos 5 eixos entre os negócios de UM bairro (GH-MAPA-04)
   *  — nunca por nome, sempre anonimizado. `totalNegocios` conta o próprio
   *  tenant que chamou (a média inclui ele mesmo, mesmo critério de
   *  qualquer benchmark honesto). */
  lerBenchmarkBairro(cidadeSlug: string, bairroSlug: string): Promise<BenchmarkBairro>;
  /**
   * Destaque rotativo do bairro (GH-GROW-04) — negócio com mais eventos de
   * progresso dentro dos últimos `diasJanela` dias. `null` se ninguém no
   * bairro teve atividade na janela. Só considera `perfilPublico = true`
   * — reusa o opt-out já existente da vitrine pública (GH-GROW-01) em vez
   * de um segundo toggle de privacidade dedicado a isto.
   */
  lerDestaqueBairro(
    cidadeSlug: string,
    bairroSlug: string,
    diasJanela: number,
  ): Promise<DestaqueBairro | null>;

  /** ---- Tenant ---- */
  /**
   * Cria o negócio alocando atomicamente o primeiro lote livre do bairro.
   * Concorrência é resolvida no adapter (advisory lock no Postgres).
   */
  criarNegocio(dados: NovoNegocio): Promise<Negocio>;
  lerNegocio(tenantId: string): Promise<Negocio | null>;
  /** Todos os negócios com `perfilPublico = true` (GH-GROW-01) — para o
   *  `sitemap.xml` dinâmico. Só campos já públicos por design (mesma RLS
   *  aberta de `negocios_leitura`); nunca cruza com `Onboarding`. */
  listarNegociosPublicos(): Promise<Negocio[]>;

  /** ---- Membros ---- */
  vincularMembro(usuario: Usuario): Promise<void>;
  /** Descobre o tenant a partir da identidade autenticada (usado no login). */
  lerMembroPorUsuario(usuarioId: string): Promise<Usuario | null>;

  /** ---- Onboarding ---- */
  salvarOnboarding(onboarding: Onboarding): Promise<void>;
  lerOnboarding(tenantId: string): Promise<Onboarding | null>;

  /** ---- Vitrine ---- */
  listarOfertas(tenantId: string): Promise<Oferta[]>;
  criarOferta(oferta: Omit<Oferta, "id">): Promise<void>;
  /** Vizinhos do mesmo quarteirão — base das parcerias. 1 round trip. */
  listarVizinhos(tenantId: string): Promise<Negocio[]>;

  /** ---- Progressão (gamificação) ---- */
  /**
   * Incrementa XP/moeda/degrau ATOMICAMENTE (nunca read-modify-write no
   * cliente). Recalcula o nível a partir do novo XP. Retorna o negócio atualizado.
   */
  aplicarProgresso(tenantId: string, delta: DeltaProgresso): Promise<Negocio>;

  /** ---- Equipe de IA (ver docs/PRODUTO-IA-FUNCIONARIOS.md) ---- */
  /** `disponibilidade` de cada um vem enriquecida a partir de `Alocacao`
   *  (GH-EQP-01) — o chamador nunca cruza as duas listas na mão. */
  listarFuncionarios(tenantId: string): Promise<FuncionarioContratado[]>;
  /** Idempotente: contratar o mesmo cargo duas vezes retorna o registro existente. */
  contratarFuncionario(
    tenantId: string,
    cargoId: string,
  ): Promise<FuncionarioContratado>;
  /**
   * Sobe o nível de UM funcionário (GH-EQP-04), atômico: valida que o
   * funcionário é do tenant, que o salto é de exatamente +1, debita a
   * moeda e grava o nível novo na mesma transação. Lança
   * `funcionario_nao_encontrado`, `nivel_invalido` ou `saldo_insuficiente`.
   * O ganho de atributo da evolução é aplicado pela Server Action via
   * `aplicarProgresso` (fora desta transação, de propósito: é recompensa
   * de gamificação, não parte da integridade da compra).
   */
  evoluirFuncionario(
    tenantId: string,
    funcionarioId: string,
    novoNivel: number,
    custoMoeda: number,
  ): Promise<FuncionarioContratado>;

  /** ---- Alocação de equipe (GH-EQP-01) ---- */
  /** Só as alocações ainda ativas (`expiraEm` no futuro) — as expiradas
   *  continuam na tabela/arquivo (última alocação daquele recurso), mas não
   *  contam como "ocupado". */
  listarAlocacoesAtivas(tenantId: string): Promise<Alocacao[]>;
  /**
   * Aloca um recurso a um job/entrega pelo prazo informado. ATÔMICA: verifica
   * disponibilidade + reserva na mesma transação (evita dois jobs "roubando"
   * o mesmo recurso). Lança `funcionario_ocupado` se já houver alocação
   * ativa daquele funcionário — mesma classe de guarda de `GH-FDN-01/02`.
   */
  alocarFuncionario(
    tenantId: string,
    funcionarioId: string,
    jobId: string,
    prazoDias: number,
  ): Promise<Alocacao>;

  /** ---- Marketplace (guarda anti-farm, GH-FDN-01) ---- */
  listarTrabalhosAceitos(tenantId: string): Promise<TrabalhoAceito[]>;
  /** Idempotente: aceitar o mesmo job duas vezes retorna o registro existente
   *  (nunca paga XP/moeda de novo — mesmo padrão de `contratarFuncionario`).
   *  `requisitos` (GH-ATR-03) é o piso mínimo de atributos exigido — só
   *  avaliado na primeira aceitação (idempotência não reavalia requisito). */
  aceitarTrabalho(
    tenantId: string,
    jobId: string,
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<TrabalhoAceito>;

  /** ---- Árvore de parcerias (GH-FDN-02 + custo variável GH-ARV-01) ---- */
  listarNosDesbloqueados(tenantId: string): Promise<NoDesbloqueado[]>;
  /**
   * Atômica: valida saldo e "não desbloqueado ainda" antes de debitar,
   * inserir e (na mesma transação) aplicar XP/atributo do desbloqueio —
   * mesmo padrão de `comprarMobilia`. Lança `saldo_insuficiente` ou
   * `no_ja_desbloqueado`; a guarda amigável (checar antes) fica na Server
   * Action, a garantia real é aqui.
   */
  desbloquearNo(
    tenantId: string,
    noId: string,
    custoMoeda: number,
    xp: number,
    atributos?: Partial<Record<AtributoChave, number>>,
    /** Piso de atributos exigido para desbloquear (GH-ATR-03) — semântica
     *  OPOSTA de `atributos` acima: é o REQUISITO mínimo que o negócio já
     *  precisa ter, não o ganho aplicado ao desbloquear. */
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ no: NoDesbloqueado; negocio: Negocio }>;

  /** ---- Parcerias formadas no Mapa (GH-FDN-03) ---- */
  listarParceriasFormadas(tenantId: string): Promise<ParceriaFormada[]>;
  /**
   * Atômica: valida que `vizinhoTenantId` é de fato vizinho de quarteirão
   * (nunca confia em ID arbitrário vindo do client) e que a parceria ainda
   * não existe, antes de aplicar XP/moeda/atributo e inserir — mesmo padrão
   * de `desbloquearNo`. Lança `vizinho_invalido` ou `parceria_ja_formada`.
   */
  formarParceria(
    tenantId: string,
    vizinhoTenantId: string,
    xp: number,
    moeda: number,
    atributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ parceria: ParceriaFormada; negocio: Negocio }>;

  /** ---- Sede / World (ver docs/world/ARQUITETURA-WORLD.md) ---- */
  /** Sempre retorna uma sede — cria nível 1 automaticamente no primeiro acesso. */
  lerSede(tenantId: string): Promise<Sede>;
  /**
   * Evolui a sede ATOMICAMENTE: valida saldo suficiente, debita a moeda,
   * aplica XP (GH-WORLD-02) e sobe o nível numa única operação.
   * `novoNivel`/`custoMoeda`/`xp` já vêm validados/resolvidos contra o
   * catálogo estático pela Server Action (lib/db não conhece
   * `features/sede/niveis.ts`). Lança erro se o saldo for insuficiente ou o
   * nível já não for o esperado (evita corrida entre requisições).
   */
  evoluirSede(
    tenantId: string,
    nivelEsperadoAtual: number,
    novoNivel: number,
    custoMoeda: number,
    xp: number,
  ): Promise<{ sede: Sede; negocio: Negocio }>;

  /** ---- História (ver docs/world/EVOLUCAO-MOTOR-2026.md §7.1) ---- */
  listarCapitulosEntregues(tenantId: string): Promise<CapituloEntregue[]>;
  /**
   * Registra a entrega de um capítulo. **Idempotente**: entregar duas vezes o
   * mesmo capítulo devolve o registro existente, nunca duplica. É o que
   * permite o relógio *lazy* reavaliar a narrativa a cada page load sem medo.
   */
  entregarCapitulo(tenantId: string, capituloId: string): Promise<CapituloEntregue>;
  /**
   * Grava a escolha do jogador E aplica o efeito na MESMA transação — nunca
   * duas chamadas, que abririam janela para efeito aplicado sem escolha
   * registrada (ou o contrário). Lança se o capítulo já foi resolvido, o que
   * impede refarmar recompensa reenviando a requisição.
   */
  resolverCapitulo(
    tenantId: string,
    capituloId: string,
    escolhaId: string,
    delta: DeltaProgresso,
  ): Promise<{ capitulo: CapituloEntregue; negocio: Negocio }>;

  listarMobiliaColocada(tenantId: string): Promise<ItemMobiliaColocado[]>;
  /**
   * Atômico: valida saldo e slot livre antes de debitar, inserir e (na mesma
   * transação) aplicar o bônus de atributo do item — ver `ItemMobilia.bonus`
   * em `features/sede/catalogo.ts`. O ganho é permanente na compra; não há
   * "remover móvel" hoje, só mover de slot (ver `moverMobilia`).
   */
  comprarMobilia(
    tenantId: string,
    itemId: string,
    slot: number,
    custoMoeda: number,
    bonusAtributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ item: ItemMobiliaColocado; negocio: Negocio }>;
  /** Atômico: valida que o slot de destino está livre e pertence ao tenant. */
  moverMobilia(
    tenantId: string,
    itemColocadoId: string,
    novoSlot: number,
  ): Promise<ItemMobiliaColocado>;
  /**
   * Sobe o nível de um móvel/equipamento (GH-WORLD-07), atômico: valida
   * posse e salto de +1, debita a moeda e aplica de novo o bônus de
   * atributo do item — tudo na mesma transação (o bônus É parte da compra
   * aqui, diferente de `evoluirFuncionario`, onde a recompensa é
   * gamificação separada). Lança `item_nao_encontrado`, `nivel_invalido`
   * ou `saldo_insuficiente`.
   */
  evoluirMobilia(
    tenantId: string,
    itemColocadoId: string,
    novoNivel: number,
    custoMoeda: number,
    bonusAtributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<ItemMobiliaColocado>;

  /** ---- Lições (GH-EDU-01) ---- */
  listarLicoesConcluidas(tenantId: string): Promise<LicaoConcluida[]>;
  /**
   * Atômica e idempotente: concluir a mesma lição duas vezes retorna o
   * registro existente, nunca paga XP/atributo de novo — mesma família de
   * `desbloquearNo`/`formarParceria`. Sem custo/requisito (lição é sempre
   * "grátis" de acessar), por isso mais simples que aqueles dois.
   */
  concluirLicao(
    tenantId: string,
    licaoId: string,
    xp: number,
    atributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<LicaoConcluida>;

  /** ---- Convite de vizinho (GH-GROW-02) ---- */
  /** Só do próprio convidante — usado pra aplicar o teto de convites
   *  recompensados por período (a janela de tempo é decidida pelo chamador). */
  listarConvitesResgatados(tenantIdConvidante: string): Promise<ConviteResgatado[]>;
  /**
   * Atômica: aplica a recompensa mútua (XP/moeda) a AMBOS os negócios e
   * registra o resgate na MESMA operação. `xpConvidante`/`moedaConvidante`
   * podem ser 0 (chamador decide isso ANTES de chamar, ao aplicar o teto
   * anti-abuso — o convidado nunca deixa de ganhar por causa do teto do
   * convidante).
   */
  resgatarConvite(
    tenantIdConvidante: string,
    tenantIdConvidado: string,
    xpConvidante: number,
    moedaConvidante: number,
    xpConvidado: number,
    moedaConvidado: number,
  ): Promise<ConviteResgatado>;

  /** ---- Contato via perfil público (GH-GROW-01) ---- */
  listarSolicitacoesContato(tenantId: string): Promise<SolicitacaoContato[]>;
  /** A checagem de rate-limit é responsabilidade do chamador (Server Action)
   *  — este método só persiste. Nunca lança por conteúdo, só por I/O real. */
  criarSolicitacaoContato(
    input: Omit<SolicitacaoContato, "id" | "criadaEm">,
  ): Promise<SolicitacaoContato>;

  /** ---- Eventos globais (Épico 11, ver docs/BACKLOG-PRODUTO.md) ---- */
  /** Todos os eventos, de qualquer status — o chamador filtra por
   *  agendado/ativo/encerrado (relógio lazy, `features/eventos-globais/motor.ts`).
   *  Não é por tenant: é o mesmo "cartaz" para todo mundo. */
  listarEventosGlobais(): Promise<EventoGlobal[]>;
  /** Cria o evento. Sem validação de negócio aqui — quem chama (a Server
   *  Action) já checou `souAdmin` e `janelaValida`; o `check` da migration é
   *  a garantia real (fim > início, meta > 0). */
  criarEventoGlobal(evento: Omit<EventoGlobal, "criadoEm">): Promise<EventoGlobal>;
  listarProgressoEventos(tenantId: string): Promise<ProgressoEventoGlobal[]>;
  /**
   * Incrementa em 1 o progresso do tenant em TODO evento ativo cujo
   * `objetivo` bate com `eventoKey` — ATÔMICO por evento: soma a contagem e,
   * na primeira vez que bate a meta, aplica XP/moeda/atributo na MESMA
   * transação (mesmo padrão de `desbloquearNo`/`comprarMobilia`). Nunca
   * lança se não houver evento ativo com esse objetivo — é um no-op válido,
   * a maioria das ações do jogo não está dentro de nenhuma campanha.
   */
  incrementarProgressoEventos(
    tenantId: string,
    eventoKey: string,
  ): Promise<ProgressoEventoGlobal[]>;
}

export interface DeltaProgresso {
  xp: number;
  moeda: number;
  /** quantos degraus subir (0 na maioria dos eventos) */
  degraus: number;
  /** ganho por eixo (opcional); clamp em [0, teto] aplicado atomicamente —
   *  ver lib/atributos.ts `somarAtributo`, que o adapter deve espelhar. */
  atributos?: Partial<Record<AtributoChave, number>>;
}

/** Dados de entrada do cadastro; `id`, `endereco` e `nivel` (derivado do XP)
 *  são atribuídos pelo adapter. */
export interface NovoNegocio {
  nome: string;
  segmento: Negocio["segmento"];
  cidadeSlug: string;
  cidadeNome: string;
  bairroNome: string;
  degrauAlvo: number;
  /** XP de boas-vindas; o nível inicial é derivado dele */
  xpInicial: number;
  moedaVirtual: number;
  /** valores iniciais dos 5 eixos, calculados pelo onboarding a partir das
   *  10 respostas (features/onboarding/scoring.ts) */
  atributosIniciais: Negocio["atributos"];
  /** Opt-out do perfil público, decidido no formulário de cadastro (GH-GROW-01). */
  perfilPublico: boolean;
  /** Versão da política de privacidade aceita no cadastro (GH-OPS-04). */
  consentimentoVersao: string;
}

export type { Endereco };
