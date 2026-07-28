import type { AtributoChave } from "@tokens";
import type {
  Alocacao,
  CapituloEntregue,
  Endereco,
  EventoGlobal,
  FuncionarioContratado,
  ItemMobiliaColocado,
  Mapa,
  MapaView,
  Negocio,
  NoDesbloqueado,
  Oferta,
  Onboarding,
  ProgressoEventoGlobal,
  Sede,
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
  /** ---- Geografia (global) ---- */
  lerMapa(): Promise<Mapa>;
  /** Mapa enriquecido com o resumo do negócio em cada lote (read model da UI). */
  lerMapaView(): Promise<MapaView>;

  /** ---- Tenant ---- */
  /**
   * Cria o negócio alocando atomicamente o primeiro lote livre do bairro.
   * Concorrência é resolvida no adapter (advisory lock no Postgres).
   */
  criarNegocio(dados: NovoNegocio): Promise<Negocio>;
  lerNegocio(tenantId: string): Promise<Negocio | null>;

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

  /** ---- Sede / World (ver docs/world/ARQUITETURA-WORLD.md) ---- */
  /** Sempre retorna uma sede — cria nível 1 automaticamente no primeiro acesso. */
  lerSede(tenantId: string): Promise<Sede>;
  /**
   * Evolui a sede ATOMICAMENTE: valida saldo suficiente, debita a moeda e
   * sobe o nível numa única operação. `novoNivel`/`custoMoeda` já vêm
   * validados contra o catálogo estático pela Server Action (lib/db não
   * conhece `features/sede/niveis.ts`). Lança erro se o saldo for insuficiente
   * ou o nível já não for o esperado (evita corrida entre requisições).
   */
  evoluirSede(
    tenantId: string,
    nivelEsperadoAtual: number,
    novoNivel: number,
    custoMoeda: number,
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
}

export type { Endereco };
