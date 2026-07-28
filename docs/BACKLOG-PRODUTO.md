# Backlog de Produto — labdatadev-gamehub

> **Autor:** visão de Líder de Produto Sênior. **Objetivo do produto:** evoluir
> o gamehub de MVP funcional para um **polo tecnológico regional gamificado**
> — ecossistema estilo Startup Panic/Habbo onde cada negócio real de um
> bairro, cidade (e no limite, um estado) tem presença viva, aprende
> empreendedorismo jogando, e **o próprio ecossistema divulga a MEI
> labdatadev organicamente**, sem time de marketing ou comercial.
>
> **Uso pretendido:** cada card abaixo é uma unidade de trabalho para o
> Claude Code executar **em sequência, um de cada vez**. A ordem dos épicos e
> dos cards dentro deles **é a ordem de implementação recomendada** — reflete
> dependência técnica real, não só prioridade de negócio.
>
> **Convenção de ID:** `GH-<ÉPICO>-<NN>`. **Prioridade:** P0 (bloqueia o
> pitch/é risco ativo) · P1 (alto valor, sem bloqueio) · P2 (importante,
> pode esperar) · P3 (visão de longo prazo). **Esforço:** P (< 1 sessão) ·
> M (1 sessão focada) · G (múltiplas sessões/fases).

---

## Como ler este backlog

Cada card assume que você já leu:
- [`ESTADO-DO-PROJETO.md`](ESTADO-DO-PROJETO.md) — o que já existe
- [`analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md`](analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md) — os `RF-*` referenciados aqui
- [`AGENTS.md`](../AGENTS.md) — regras não-negociáveis (TS strict, RLS, gate de qualidade)

**Nenhum card introduz arquitetura nova sem justificar** — quando um card
estende um padrão existente (ex.: `aplicarProgresso`, `GameRepository`,
RLS forçada), isso está explícito para o Claude Code reusar, não reinventar.

## Mapa dos épicos (ordem de execução)

| # | Épico | Por quê nessa posição |
|---|---|---|
| 1 | [Fundação de Integridade](#épico-1--fundação-de-integridade-p0) | Corrige riscos ativos de demo (farm de XP, estado que se perde) — barato, remove vergonha no pitch |
| 2 | [Economia de Atributos](#épico-2--economia-de-atributos-p0-p1) | Maior gap estrutural — sem isso a gamificação é unidimensional |
| 3 | [Alocação de Equipe em Entregas](#épico-3--alocação-de-equipe-em-entregas-p1) | **Elevado a P0** — depende do Épico 2; torna a equipe um recurso escasso de verdade |
| 4 | [Árvore de Maturidade Evoluída](#épico-4--árvore-de-maturidade-evoluída-p1) | **Elevado a P0** — depende do Épico 2; dá profundidade à trilha já existente |
| 5 | [World — Sede, Mobília, Avatares](#épico-5--world--sede-mobília-avatares-p1-p2) | Maior impacto visual pro pitch; construído em fases (W1→W6) |
| 6 | [Mapa-múndi Multi-tenant](#épico-6--mapa-múndi-multi-tenant-p1-p2) | Escala o ecossistema além de um quarteirão |
| 7 | [Growth Engine — Ecossistema Auto-propagável](#épico-7--growth-engine--ecossistema-auto-propagável-p0-p1) | **O pedido central desta sessão** — divulgação sem time de marketing |
| 8 | [Camada Educacional](#épico-8--camada-educacional-p1-p2) | Diferencial para o pitch do Sebrae — "ensino", não só "jogo" |
| 9 | [Deploy Real + Segurança em Produção](#épico-9--deploy-real--segurança-em-produção-p0) | Sem isso nada dos épicos acima chega a usuário real |
| 10 | [Pitch Readiness](#épico-10--pitch-readiness-sebrae-p0) | Checklist final antes da apresentação |

---

## Épico 1 — Fundação de Integridade (P0)

> Corrigir os gaps conhecidos que, se demonstrados ao vivo, quebram a
> credibilidade do produto. Todos de esforço baixo — fazer primeiro.

### GH-FDN-01 — Guarda anti-farm no Marketplace ✅

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | — |

**Descrição:** Hoje "Aceitar trabalho" no marketplace pode ser clicado
repetidamente no mesmo job, pagando XP/moeda toda vez — a mesma classe de
bug já corrigida em Funcionários de IA (`GH` anterior). Aplicar o mesmo
padrão: guarda **autoritativa no servidor**, não só desabilitar o botão.

**Critérios de aceitação:**
- [x] Aceitar o mesmo job pela segunda vez retorna erro do servidor, sem
      pagar XP/moeda de novo (provado via chamada direta a `recompensar()`,
      não só clicando na UI)
- [x] Teste automatizado cobrindo o caso de re-aceite —
      `features/marketplace/guarda.test.ts` (4 casos, função pura extraída)
- [x] UI reflete o estado "já aceito" vindo do servidor
      (`trabalhosAceitos: string[]` threaded de `/hub` → `GameShell` →
      `MarketplaceScreen`, nunca `useState` local)

**Regras de segurança:**
- Validação de idempotência dentro da própria Server Action, antes de
  chamar `aplicarProgresso` (mesmo padrão de `features/gamificacao/actions.ts`
  usado para `funcionario_ia_contratado`)
- Nunca confiar em flag vinda do client indicando "já aceito"

**Dados trafegados:** nenhum dado novo — reusa `tenantId` da sessão e o
`jobId` do catálogo estático (sem PII adicional).

**Boas práticas:** manter o catálogo de jobs como dado estático por ora
(`features/marketplace/data.ts`); a idempotência trava por
`(tenantId, jobId)`, análoga a `unique(tenant_id, cargo_id)` já usada em
Funcionários de IA.

---

### GH-FDN-02 — Persistir estado da Árvore de Parcerias por tenant ✅

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P–M |
| Depende de | — |

**Descrição:** `HexTreeScreen` guarda "desbloqueado" em `useState` local —
some ao recarregar a página. Isso quebra a demo (jogador desbloqueia um nó,
atualiza a página, perdeu). Persistir seguindo o padrão de
`funcionarios_contratados`.

**Critérios de aceitação:**
- [x] Nó desbloqueado continua desbloqueado após `router.refresh()` e reload
      completo da página (`nosDesbloqueados: string[]` do servidor, nunca
      `useState` local)
- [x] Nova tabela/registro segue o padrão RLS forçada + índice em `tenant_id`
      (Supabase, migration `0009`) e arquivo por tenant (file-adapter,
      `nos.json`)
- [x] `GameRepository` ganha `listarNosDesbloqueados`/`desbloquearNo`,
      espelhando `listarFuncionarios`/`contratarFuncionario` — provado via
      chamada direta a `recompensar()` (2º desbloqueio recusado, XP intacto)

**Regras de segurança:**
- RLS: leitura e escrita só do próprio tenant (dado é estratégico —
  mostra em que trilha de maturidade o negócio investiu)
- Guarda idempotente igual ao `GH-FDN-01`

**Dados trafegados:** `tenantId` + `noId` (string do catálogo estático) +
timestamp — nenhuma informação sensível.

**Boas práticas:** reusar literalmente o padrão de código de
`FuncionarioContratado`/`contratarFuncionario` (mesmo shape, outro domínio)
— não inventar uma abstração genérica "estado desbloqueável" ainda; DRY
prematuro custaria mais do que a duplicação controlada.

---

### GH-FDN-03 — Persistir seleção de bairro/cidade e parcerias formadas no Mapa

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P |
| Depende de | `GH-FDN-02` (mesmo padrão) |

**Descrição:** `MapaScreen` guarda `parceriaCom` (quais vizinhos já viraram
parceria) em `useState` local. Mesma classe de problema do `GH-FDN-02`.

**Critérios de aceitação:**
- [ ] "Parceria formada" sobrevive a reload
- [ ] Uma parceria não pode ser formada duas vezes com o mesmo vizinho
      (idempotência server-side)

**Regras de segurança:** RLS por tenant; validar que o `vizinhoId` informado
está de fato no mesmo quarteirão do tenant (nunca confiar em ID arbitrário
vindo do client).

**Dados trafegados:** `tenantId`, `vizinhoTenantId`, timestamp. Nenhuma PII.

---

## Épico 2 — Economia de Atributos (P0/P1)

> **O maior gap estrutural do produto** (ver
> [`SINTESE-REQUISITOS-FUNCIONAIS.md`](analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md) §4).
> Sem isto, XP e degrau são a única dimensão de progresso — raso comparado à
> referência (Startup Panic) e sem lastro real de negócio.

### GH-ATR-01 — Modelar os 5 eixos de atributo do negócio ✅

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | M |
| Depende de | — |
| RFs cobertos | `RF-ATR-01`, `RF-ATR-07` |

**Descrição:** Adicionar ao domínio `Negocio` cinco atributos numéricos:
**Tecnologia, Processo, Presença, Aquisição, Capacidade** — tradução direta
da tríade T/U/A do Startup Panic + Marketing/Motivação para o vocabulário de
PME real (ver mapeamento em `economia-de-atributos.md` §5). Cada um com
`valor` e `teto` (ex.: `7/40`).

**Critérios de aceitação:**
- [x] `Negocio.atributos: { tecnologia, processo, presenca, aquisicao,
      capacidade }`, cada um `{ valor: number; teto: number }`
      (`src/lib/atributos.ts`, `src/lib/db/types.ts`)
- [x] Onboarding calcula o valor **inicial** de cada eixo a partir das 10
      respostas (ex.: `gargalo: "manual"` inicia Processo baixo) —
      `features/onboarding/scoring.ts` `atributosIniciais()`
- [x] Migration Supabase com as 5 colunas (decisão: colunas `smallint` em
      `negocios`, não tabela 1:1 — justificado no cabeçalho de
      `0005_atributos.sql`, mesmo padrão de xp/moeda_virtual/nivel) +
      espelho no file-adapter
- [x] HUD ou painel mostra os 5 eixos com **cor consistente por atributo**
      em todas as telas (`RF-ATR-07`) — `components/ui/AtributosBar.tsx`,
      usado em `/painel` e na Sede, tokens em `design-system/tokens.ts`
- [x] Testes cobrindo o cálculo inicial a partir de cada combinação relevante
      de resposta do onboarding — `scoring.test.ts` + `atributos.test.ts`
      (18 testes)

**Regras de segurança:**
- Atributos só mudam via função atômica (ver `GH-ATR-02`) — nunca
  read-modify-write no cliente
- RLS: leitura pública do **resumo agregado** (para benchmark, Épico do
  mercado), leitura detalhada só do próprio tenant

**Dados trafegados:** 5 números inteiros por negócio (não-PII, dado de
produto). Se exposto publicamente (fachada), é informação de "gamificação",
não de negócio sensível — decisão de exposição documentada no card
`GH-MAPA-*` de benchmark.

**Boas práticas:** manter a mesma cor por atributo em TODA a UI (padrão já
identificado nos prints: roxo/azul/laranja/verde/vermelho) — declarar essas
cores como **tokens** em `design-system/tokens.ts`, não hardcode por tela.

---

### GH-ATR-02 — Função atômica `aplicarGanhoAtributo` ✅

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P–M |
| Depende de | `GH-ATR-01` |
| RFs cobertos | `RF-ATR-02`, `RF-ATR-04` |

**Descrição:** Estender o padrão de `aplicarProgresso` (XP/moeda/degrau) para
também aplicar ganho de atributo. Toda entrega, feature desbloqueada ou
Funcionário de IA contratado eleva um eixo específico.

**Critérios de aceitação:**
- [x] `DeltaProgresso` ganha um campo opcional de ganho por atributo
      (`atributos?: Partial<Record<AtributoChave, number>>`)
- [x] RPC Supabase `aplicar_progresso` estendida na mesma transação (não uma
      segunda chamada — evita estado inconsistente entre XP e atributo) —
      `0005_atributos.sql`
- [x] Cada evento do catálogo (`EVENTOS` em `engine.ts`) declara **qual
      atributo ganha e quanto** (ex.: `funcionario_ia_contratado` resolve o
      eixo pelo `CargoIA.eixoFortalecido` do cargo contratado — cargo
      `comercial` eleva Aquisição)
- [x] Teste garante que o ganho nunca ultrapassa o teto do atributo
      (`atributos.test.ts`, clamp em [0, teto])
- [x] **Extra além do card:** bônus de mobília da Sede (`ItemMobilia.bonus`)
      agora também eleva atributo de verdade na compra — `comprarMobilia`
      ganhou os mesmos 5 deltas, aplicados atomicamente na mesma transação
      do débito (`0006_mobilia_bonus.sql`), fechando o link com `GH-WORLD-02`

**Regras de segurança:** mesma transação atômica de hoje — sem corrida entre
requisições concorrentes (`update ... set atributo = atributo + delta`, não
leitura seguida de escrita).

**Dados trafegados:** delta numérico por atributo, associado ao evento —
mesmo nível de sensibilidade do XP hoje.

---

### GH-ATR-03 — Requisito mínimo de atributo em entregas e nós da árvore

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-ATR-01` |
| RFs cobertos | `RF-ATR-03`, `RF-ARV-03` |

**Descrição:** Cada job do marketplace e cada nó da árvore de maturidade
ganha um **requisito mínimo por atributo**. A UI compara o total disponível
(negócio + equipe alocada) com o requisito **antes** de permitir confirmar
— replicando a tela `Selecionar funcionário` do Startup Panic
(`marketplace-servicos.md` §3).

**Critérios de aceitação:**
- [ ] Catálogo de jobs e nós ganham `requisitos: Partial<Atributos>`
- [ ] UI mostra comparação lado a lado (atual vs. requisito) antes da
      confirmação, com indicação visual clara de atendido/não atendido
- [ ] Servidor **recusa** a ação se o requisito não for atendido (não é só
      aviso visual — é validação real)

**Regras de segurança:** a checagem de requisito é feita no servidor com os
dados atuais do banco, nunca com valores enviados pelo client.

**Dados trafegados:** nenhum dado novo além dos já existentes (atributos do
negócio + requisitos do catálogo estático).

---

## Épico 3 — Alocação de Equipe em Entregas (P1)

> Torna a equipe (humana e de IA) um recurso finito e disputado — o que dá
> peso real à decisão de "aceitar ou recusar" um job. Depende do Épico 2.

### GH-EQP-01 — Modelo de disponibilidade de recurso (humano ou IA) ✅

| Campo | Valor |
|---|---|
| Prioridade | **P0** (elevado — Trilha A) |
| Esforço | M |
| Depende de | `GH-ATR-01` |
| RFs cobertos | `RF-EQP-04`, `RF-MKT-04` |

**Descrição:** Cada membro de equipe (Funcionário de IA contratado, e no
futuro humano) tem estado `livre`/`alocado`. Alocar em um job/entrega o
torna indisponível pelo tempo estimado.

**Critérios de aceitação:**
- [x] `FuncionarioContratado` ganha campo de disponibilidade
      (`disponibilidade: Disponibilidade`, enriquecido na leitura por
      `listarFuncionarios`/`contratarFuncionario` — nunca persistido junto)
- [x] Um recurso alocado não pode ser alocado a uma segunda entrega
      simultânea (RPC `alocar_funcionario` com advisory lock por
      funcionário, migration `0010`)
- [x] Ao concluir/expirar o prazo da entrega, o recurso volta a `livre`
      automaticamente — **derivado na leitura, sem cron nem job de fundo**
      (`lib/disponibilidade.ts`, mesmo princípio "relógio lazy" de
      atributos/história). Provado em runtime: alocar → recusar 2ª tentativa
      → "voltar no tempo" a alocação → livre de novo sozinho → realocar OK.

**Regras de segurança:** a alocação é uma operação atômica (verificar
disponibilidade + reservar, numa transação) — evita condição de corrida
(dois jobs "roubando" o mesmo recurso ao mesmo tempo).

**Dados trafegados:** `tenantId`, `funcionarioId`, `jobId`, prazo — dado
operacional, não sensível.

---

### GH-EQP-02 — Fluxo em 2 etapas: aceitar job → alocar quem executa

| Campo | Valor |
|---|---|
| Prioridade | **P0** (elevado — Trilha A, destrava valor de negócio direto) |
| Esforço | M |
| Depende de | `GH-EQP-01`, `GH-ATR-03` |
| RFs cobertos | `RF-MKT-02`, `RF-MKT-03` |

**Descrição:** Substitui o "Aceitar trabalho" de 1 clique por um segundo
passo de seleção de executor, com soma dinâmica de atributos comparada ao
requisito — réplica direta da tela `Selecionar funcionário` documentada em
`marketplace-servicos.md` §3.

**Critérios de aceitação:**
- [ ] Modal de seleção mostra atributos de cada recurso disponível
- [ ] Soma dinâmica (`Total`) atualiza ao marcar/desmarcar um recurso
- [ ] Confirmar só habilita quando o total atende o requisito mínimo
- [ ] Servidor recalcula e valida de novo antes de persistir (nunca confia
      no total calculado no client)

**Regras de segurança:** dupla validação (client para UX, servidor para
integridade) — mesmo princípio já aplicado em `GH-FDN-01`.

**Dados trafegados:** lista de `funcionarioId`s selecionados + `jobId`.

---

## Épico 4 — Árvore de Maturidade Evoluída (P1)

### GH-ARV-01 — Custo variável de desbloqueio por nó ✅

| Campo | Valor |
|---|---|
| Prioridade | **P0** (elevado — Trilha A) |
| Esforço | P |
| Depende de | — |
| RFs cobertos | `RF-ARV-04` |

**Descrição:** Hoje todo nó da árvore custa o mesmo (implícito). No Startup
Panic o custo varia por nó (`$285`, `$293`, `$347`...). Adicionar `custo:
number` (em moeda virtual 🪙) por nó do catálogo, e descontar ao desbloquear.

**Critérios de aceitação:**
- [x] Cada nó do catálogo (`features/parcerias/data.ts`) tem `custo`
      (300–3000🪙, crescente com `score` — `crm`, o de maior fit, é o mais caro)
- [x] Desbloquear desconta moeda virtual do tenant (nunca deixa saldo
      negativo — RPC `desbloquear_no` recusa com `saldo_insuficiente` antes
      de tocar no saldo, não clampa; provado em runtime: tenant com 500🪙
      tentando um nó de 1200🪙 continua com exatamente 500🪙 depois)
- [x] UI mostra o custo antes de confirmar (`HexTreeScreen`: custo sempre
      visível no painel de detalhe + no próprio botão)

**Nota de arquitetura:** este card mudou a natureza da ação — deixou de ser
um evento genérico do catálogo (`recompensar()`) e passou a ser uma compra
com custo variável, mesma classe de `comprarMobilia`/`evoluirSede`. O
`servico_desbloqueado` saiu do dispatcher genérico e ganhou action própria
(`features/parcerias/actions.ts`), com RPC atômica (`0011_arv_custo.sql`,
mesmo padrão de `comprar_mobilia`/0004: `exists` é só mensagem amigável, a
garantia real é o `unique` já existente de GH-FDN-02).

**Regras de segurança:** validação server-side de saldo suficiente antes de
debitar (transação atômica).

**Dados trafegados:** valor de moeda virtual — nunca R$ real (regra de
ouro do projeto).

---

### GH-ARV-02 — Gating em 3 níveis (disponível / comprável / bloqueado)

| Campo | Valor |
|---|---|
| Prioridade | **P0** (elevado — Trilha A) |
| Esforço | M |
| Depende de | `GH-ARV-01`, `GH-ATR-03` |
| RFs cobertos | `RF-ARV-02` |

**Descrição:** Hoje a árvore só tem 2 estados (livre/bloqueado). Adicionar o
terceiro estado observado no Startup Panic: nó visível mas **inalcançável**
(requisito de atributo muito acima do atual), distinto de "bloqueado por
não ter desbloqueado o pai".

**Critérios de aceitação:**
- [ ] 3 estados visualmente distintos: disponível, comprável, inalcançável
- [ ] Nó inalcançável mostra o motivo (qual atributo falta e quanto)

**Regras de segurança:** nenhuma nova (reusa validação de `GH-ATR-03`).

**Dados trafegados:** nenhum dado novo.

---

## Épico 5 — World: Sede, Mobília, Avatares (P1/P2)

> Ver arquitetura completa em [`world/ARQUITETURA-WORLD.md`](world/ARQUITETURA-WORLD.md).
> Maior impacto visual para o pitch — mas o maior esforço. Construído em
> fases **W1→W6**, cada uma demonstrável isoladamente. **Não pular fases.**

### GH-WORLD-01 — Fundação de dados (sedes, catálogo de mobília, avatares)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | — |
| Corresponde a | Fase **W1** de `ARQUITETURA-WORLD.md` §6 |

**Descrição:** Migration + `GameRepository` para as 4 entidades novas:
`sedes`, `itens_mobilia_catalogo`, `itens_mobilia_colocados`, `avatares` —
schema já rascunhado em `ARQUITETURA-WORLD.md` §4.

**Critérios de aceitação:**
- [ ] Migration Supabase seguindo o padrão de `0001`–`0003` (RLS forçada,
      índice em `tenant_id`, `unique` onde fizer sentido)
- [ ] File-adapter espelha a mesma capacidade
- [ ] Toda empresa cadastrada recebe uma sede inicial automaticamente (nível
      "alugada", grid pequeno) — sem intervenção manual
- [ ] SQL validado por parser real (mesma técnica usada nas migrations
      anteriores — `pg_query_emscripten`) já que não há Docker/Postgres local

**Regras de segurança:**
- RLS: layout/mobília da sede é **privado por padrão** (`sede.publicada =
  false`); nível/tipo da sede (fachada) é público — ver decisão de
  visibilidade em `world/MAPA-MUNDI-VALE-DO-CAFE.md` §2
- `itens_mobilia_catalogo` é geografia global (leitura pública, escrita só
  service_role)

**Dados trafegados:** posição de móveis (x/y no grid), nível de sede, tipo
de avatar — dado de produto, não PII. Layout privado nunca trafega para
outro tenant.

**Boas práticas:** criar a sede inicial **dentro da mesma transação** do
cadastro (ou logo em seguida, idempotente) — nunca deixar um tenant sem sede.

---

### GH-WORLD-02 — Tela estática "Minha Sede" (comprar/ver, sem canvas)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-WORLD-01` |
| Corresponde a | Fase **W2** |

**Descrição:** Réplica funcional (não visual-canvas ainda) das telas
`Melhorar escritório` e `Loja de móveis` do Startup Panic
(`sede-escritorio-e-mobilia.md`) — reusa `RibbonPanel`/`ActionButton`/
`master-detail` já existentes no design system. **Não abrir o Pixi ainda** —
provar a mecânica antes de investir em renderização.

**Critérios de aceitação:**
- [ ] Comparativo "sede atual × próxima" com capacidade e custo recorrente
- [x] Grade de mobília com preço e bônus percentual por atributo (liga com
      `GH-ATR-02` — comprar móvel eleva atributo)
- [ ] Evoluir de sede é um evento de gamificação (mesmo padrão de
      `funcionario_ia_contratado`): XP, pode contar como avanço de degrau
- [ ] Escolha explícita entre **alugar** (menor capacidade, custo recorrente
      menor) e **comprar/própria** (custo único alto, sem mensalidade)

**Regras de segurança:** compra de mobília só com moeda virtual (nunca R$
real); custo recorrente da sede é **simulado**, não cobrado de verdade
(mesma regra de `RF-FIN-01`).

**Dados trafegados:** nenhum dado sensível — decisões de compra em moeda
virtual.

---

### GH-WORLD-03 — Canvas Pixi: grid da sala + móveis posicionados ✅

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | G |
| Depende de | `GH-WORLD-02` |
| Corresponde a | Fase **W3** |

**Descrição:** Introduzir a camada de renderização dedicada (**PixiJS**,
decisão fundamentada em `ARQUITETURA-WORLD.md` §3) — canvas mostrando o
grid da sala com os móveis já comprados, posicionados automaticamente (sem
drag-and-drop ainda).

**Critérios de aceitação:**
- [x] Componente client-only (`dynamic(() => import(...), { ssr: false })`
      — Pixi usa `window`, não roda no servidor) — `render/WorldCanvas.tsx`
- [x] Sincronização de estado entre Pixi e React via casca fina
      (`CenaWorld.sincronizar`); toda a regra vive em `engine/`, puro e testado
- [x] Funciona em viewport mobile (`ResizeObserver` + escala da raiz)
- [x] Sem regressão de performance no resto do app: o Pixi entra por import
      dinâmico dentro do efeito, então fica fora do bundle inicial — `/world`
      pesa 154 kB First Load, na mesma faixa das outras rotas

**Como foi renderizado sem assets:** desenho procedural com `Graphics`
derivado dos tokens (`render/desenho.ts`) — piso xadrez, duas paredes de
fundo contínuas, móveis com silhueta própria por categoria (mesa+monitor,
rack com LEDs, sofá com encosto, vaso com folhagem). Sem sprite sheet: a
cena escala em qualquer resolução e não carrega imagem nenhuma.

**Regras de segurança:** nenhuma nova — é camada de apresentação.

**Dados trafegados:** nenhum dado novo.

**Boas práticas:** seguir o padrão de integração documentado (template
oficial Phaser+React adaptado para Pixi, `useRef` para a instância) — não
inventar um bridge próprio do zero.

---

### GH-WORLD-04 — Colocação livre de móveis ✅ (clique-para-mover, não drag)

| Campo | Valor |
|---|---|
| Prioridade | P3 |
| Esforço | M |
| Depende de | `GH-WORLD-03` |
| Corresponde a | Fase **W4** |

**Critérios de aceitação:**
- [x] Jogador reposiciona móveis dentro do grid da sede, respeitando as
      dimensões do nível contratado (destinos válidos ficam destacados)
- [x] Posição persiste
- [x] Sem sobreposição inválida de móveis

**Desvio consciente do card:** ficou **clique-no-móvel → clique-no-destino**,
não drag-and-drop. Dois motivos: (a) é o mesmo gesto que já existia no
`SedeScreen`, então o jogador não reaprende nada; (b) drag em canvas
isométrico no mobile briga com o scroll da página — e mobile-first é regra
não-negociável. O drag continua possível depois, por cima da mesma ação.

**Desvio consciente no modelo de dados:** a posição continua persistida como
`slot` (índice linear), não `pos_x/pos_y`. O `slot` É a célula do grid — a
tradução slot ↔ (cx, cy) vive em `engine/sala.ts`, com teste de bijeção. Isso
evitou migration nova E manteve a validação atômica de posse/ocupação que já
estava escrita e testada em `mover_mobilia`. Se um dia um móvel ocupar mais
de 1 tile, aí sim vale migrar para x/y.

**Regras de segurança:** validação de posição/colisão no servidor antes de
persistir — inalterada, é a mesma RPC `mover_mobilia` de `0004_sede.sql`.

**Dados trafegados:** `slot` por item — dado de produto, não PII.

---

### GH-WORLD-05 — Avatares (dono + Funcionários de IA) ✅

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-WORLD-03` |
| Corresponde a | Fase **W5** |

**Descrição:** Cada Funcionário de IA contratado ganha um avatar visível na
sede — torna concreto algo que hoje só existe como linha numa lista
(decisão revisada de `PRODUTO-IA-FUNCIONARIOS.md` §9).

**Critérios de aceitação:**
- [x] Avatar aparece automaticamente ao contratar um cargo (sem ação manual)
      — a sala lê `listarFuncionarios`, não há passo de "criar avatar"
- [x] Visual distinto por cargo: a cor do boneco vem do
      `CargoIA.eixoFortalecido`, então Comercial (Aquisição) é verde e
      Documentador (Processo) é azul — amarra visualmente com a economia de
      atributos, em vez de ser cor decorativa
- [x] Sede "cresce" visualmente conforme a equipe de IA aumenta
- [x] **Além do card:** o avatar do dono **anda** pela sala (clique no chão),
      com BFS que desvia da mobília e depth-sort fracionário — o boneco passa
      corretamente atrás e na frente dos móveis no meio de um passo

**Sem tabela `avatares`:** o avatar é projeção de dado que já existe
(`funcionarios_contratados` + a sessão do dono). Persistir posição de boneco
seria estado novo sem uso real — a posição é efêmera, de sessão. Se a W6
(visitar vizinho) precisar de pose persistida, aí vira migration.

**Regras de segurança:** nenhuma nova.

**Dados trafegados:** vínculo `avatar ↔ funcionario_contratado` — nenhuma
informação sensível.

---

### GH-WORLD-06 — Visitar sede de vizinho (somente leitura)

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-WORLD-05`, Épico 6 |
| Corresponde a | Fase **W6** |

**Descrição:** A partir do Mapa, visitar a sede de um vizinho que optou por
publicar (`sede.publicada = true`) — somente leitura, fecha o ciclo social
do World.

**Critérios de aceitação:**
- [ ] Botão "Visitar" só aparece se o vizinho publicou a sede
- [ ] Visita é read-only (nenhuma ação de compra/edição possível na sede
      alheia)
- [ ] Dono da sede pode revogar a publicação a qualquer momento

**Regras de segurança:**
- RLS: `select` liberado só quando `publicada = true`, sempre validado no
  servidor (RPC dedicada, não policy aberta por engano)
- Publicar é **opt-in explícito** — nunca padrão (`false` por default, ver
  `MAPA-MUNDI-VALE-DO-CAFE.md` §2)

**Dados trafegados:** layout da sede do vizinho (só quando publicada) —
dado de produto voluntariamente compartilhado, nunca dado financeiro/PII.

---

## Épico 6 — Mapa-múndi Multi-tenant (P1/P2)

> Escala o ecossistema de "um quarteirão" para "bairro → cidade → região".
> Ver [`world/MAPA-MUNDI-VALE-DO-CAFE.md`](world/MAPA-MUNDI-VALE-DO-CAFE.md).

### GH-MAPA-01 — Consulta agregada por cidade/bairro (performance)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P–M |
| Depende de | — |

**Descrição:** Hoje `lerMapaView()` carrega **o mundo inteiro** numa query
(todas as cidades → bairros → quarteirões → negócios). Funciona com dezenas
de negócios; com centenas vira gargalo. Criar consulta agregada para os
níveis de zoom altos.

**Critérios de aceitação:**
- [ ] View/consulta que retorna `{ cidade, total_negocios, total_bairros }`
      sem carregar cada negócio
- [ ] Idem para bairros dentro de uma cidade
- [ ] `lerMapaView()` detalhado passa a receber escopo (bairro específico),
      não o mundo todo
- [ ] Medição antes/depois documentada no PR (com dados semeados suficientes
      para a diferença ser visível — ex.: 200 negócios)

**Regras de segurança:** agregados são públicos (contagem de negócios por
cidade não é dado sensível); o detalhe continua sujeito às policies atuais.

**Dados trafegados:** contagens agregadas — reduz drasticamente o volume
trafegado no zoom alto.

---

### GH-MAPA-02 — Navegação por zoom em 3 camadas (Região → Cidade → Quarteirão)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M–G |
| Depende de | `GH-MAPA-01` |

**Descrição:** Transformar o mapa atual (que parece "planta baixa") em um
mapa de jogo navegável com 3 níveis de zoom — Z1 Região (Vale do Café), Z2
Cidade, Z3 Quarteirão (a vista isométrica atual).

**Critérios de aceitação:**
- [ ] Z1: cidades como pins/ilhas com contagem de negócios; clicar → Z2
- [ ] Z2: bairros como distritos com densidade; clicar → Z3
- [ ] Z3: a vista isométrica atual (8 lotes)
- [ ] Transição animada entre níveis (usa `lib/motion.ts` já existente)
- [ ] Cada nível carrega **só** os dados daquele escopo (`GH-MAPA-01`)

**Regras de segurança:** nenhuma nova.

**Dados trafegados:** proporcional ao zoom — princípio de menor volume.

---

### GH-MAPA-03 — Identidade visual do pin por status do negócio

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | P |
| Depende de | `GH-MAPA-02`, `GH-WORLD-01` |

**Descrição:** Leitura instantânea do ecossistema: ícone/cor por **segmento**
(já existe), altura/porte por **nível da sede** (novo), selo por **degrau na
escada de valor** (dado já existe), pulso no próprio negócio (já existe).

**Critérios de aceitação:**
- [ ] Olhando o mapa, dá pra identificar sem clicar: que tipo de negócio é,
      quão maduro está, e qual é o seu
- [ ] Acessibilidade: a informação nunca depende **só** de cor (usar
      ícone + forma + rótulo também)

**Regras de segurança:** só expõe dados já classificados como "fachada
pública" — nunca onboarding/budget.

**Dados trafegados:** nome, segmento, nível, degrau (fachada pública).

---

### GH-MAPA-04 — Benchmark regional (com calibração editorial)

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-ATR-01` |
| RFs cobertos | `RF-ATR-06` |

**Descrição:** Equivalente à tela `Participação de mercado` do Startup Panic
— mas **deliberadamente recalibrado**. No jogo original o rival tem 96% e o
jogador 3%, o que é desmotivador para um empresário real.

**Critérios de aceitação:**
- [ ] Mostra a posição do negócio em relação à média do bairro/cidade, **não
      um ranking humilhante**
- [ ] Enquadramento sempre orientado a ação ("você está 2 pontos abaixo da
      média em Presença — o serviço X resolve isso"), nunca a derrota
- [ ] Nenhum negócio é exposto negativamente por nome para outro

**Regras de segurança:** comparações usam **agregados anonimizados** (média
do bairro), nunca "empresa X é melhor que você". Dados de onboarding
(budget/score) **jamais** entram no benchmark público.

**Dados trafegados:** médias agregadas + atributos do próprio tenant.

**Boas práticas:** este card carrega risco reputacional real — o produto é
apresentado no Sebrae para PMEs. Revisar o texto com cuidado: benchmark que
motiva, não que envergonha.

---

## Épico 7 — Growth Engine: Ecossistema Auto-propagável (P0/P1)

> **O pedido central desta sessão:** fazer o ecossistema divulgar a MEI
> labdatadev de forma contínua, sem time de marketing nem comercial.
>
> ⚠️ **Princípio de honestidade:** nenhum card aqui cria propagação
> enganosa, spam, ou publica em nome do usuário sem consentimento explícito.
> Crescimento vem de **valor entregue + facilidade de compartilhar**, não de
> automação intrusiva. Isso não é só ética — é o que evita o produto ser
> banido de plataformas e queimar a marca no Sebrae.

### GH-GROW-01 — Perfil público do negócio (vitrine indexável)

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | M |
| Depende de | — |

**Descrição:** Cada negócio cadastrado ganha uma **página pública** (ex.:
`/n/<slug>`) — nome, segmento, cidade/bairro, nível, serviços que oferece,
e um CTA de contato. É o motor de divulgação orgânica: cada cadastro cria
uma página que o Google indexa, atraindo buscas por "imobiliária em Mendes".

**Por que isso divulga a labdatadev sozinho:** cada página traz um rodapé
discreto "Faça parte do ecossistema — labdatadev". Quanto mais negócios
entram, mais páginas apontam para o hub. É SEO composto, sem custo marginal.

**Critérios de aceitação:**
- [ ] Rota pública SSR (não client-only) — precisa ser indexável
- [ ] Metadados corretos (title, description, Open Graph) por negócio
- [ ] `sitemap.xml` gerado dinamicamente com todos os perfis públicos
- [ ] Só expõe dados de **fachada** (nunca onboarding/budget/contato privado)
- [ ] Negócio pode **optar por não aparecer** (opt-out explícito e fácil)
- [ ] Página carrega rápido (é a primeira impressão de quem chega pelo Google)

**Regras de segurança:**
- **Whitelist explícita** de campos públicos no código — nunca "serializar o
  objeto negócio inteiro" (risco de vazar campo novo sem perceber no futuro)
- Sem e-mail/telefone do dono expostos em texto puro (usar formulário de
  contato intermediado, evita scraping)
- Rate limiting no formulário de contato (anti-spam)

**Dados trafegados:** nome do negócio, segmento, cidade, bairro, nível,
degrau, serviços oferecidos. **Nunca:** e-mail, telefone, budget declarado,
score de fit, respostas do onboarding.

**Boas práticas:** LGPD — o negócio precisa saber, no cadastro, que terá
página pública, e poder desativar. Documentar isso no fluxo de onboarding.

---

### GH-GROW-02 — Convite de vizinho com recompensa mútua

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-FDN-03` |

**Descrição:** Mecânica de crescimento viral honesta: convidar um negócio
vizinho real para ocupar um lote do seu quarteirão. **Ambos** ganham
recompensa quando o convidado completa o cadastro — alinha o incentivo com
o crescimento do ecossistema.

**Critérios de aceitação:**
- [ ] Link de convite único por tenant (rastreável)
- [ ] Recompensa só é paga quando o convidado **completa** o onboarding
      (não ao clicar — evita farm)
- [ ] Recompensa é em moeda virtual/XP, nunca em dinheiro real
- [ ] Limite anti-abuso: teto de convites recompensados por período
- [ ] O convite mostra o quarteirão real onde o vizinho vai entrar (contexto
      concreto: "junte-se ao Centro de Mendes")

**Regras de segurança:**
- Token de convite assinado, com expiração
- Guarda server-side contra auto-convite (mesmo e-mail/tenant)
- Detecção de padrão de abuso (muitos cadastros do mesmo IP em sequência) —
  no mínimo logar para revisão manual, mesmo que não bloqueie automaticamente
- **Nunca** enviar e-mail em nome do usuário sem ele acionar explicitamente

**Dados trafegados:** token de convite (opaco), `tenantId` do convidante.
O convite **não** carrega dados do convidado antes dele se cadastrar.

---

### GH-GROW-03 — Conquistas compartilháveis (share card)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-ATR-01` |
| RFs cobertos | `RF-CNQ-01`, `RF-CNQ-02` |

**Descrição:** Sistema de conquistas (equivalente ao `Conquistas` do Startup
Panic) **+** geração de imagem compartilhável ao desbloquear uma — "Minha
empresa chegou ao nível 5 no Vale do Café". O empresário compartilha porque
o orgulho é dele; a marca labdatadev vai junto na imagem.

**Critérios de aceitação:**
- [ ] Conquistas com nome, condição, recompensa e progresso percentual
      visível, agrupadas em "em andamento"/"concluídas"
- [ ] Ao concluir, oferece imagem gerada (OG image dinâmica) para compartilhar
- [ ] Compartilhar é **sempre ação manual do usuário** — o app nunca posta
      sozinho em rede social alguma
- [ ] A imagem contém a marca do ecossistema de forma discreta e elegante

**Regras de segurança:** a imagem gerada só pode conter dados de fachada
pública (mesma whitelist de `GH-GROW-01`) — jamais faturamento, budget ou
dados de outro negócio.

**Dados trafegados:** dados de fachada renderizados em imagem.

---

### GH-GROW-04 — Ranking/destaque do bairro (prova social positiva)

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-MAPA-04` |

**Descrição:** Destaque rotativo de negócios do bairro (ex.: "Negócio em
maior evolução este mês"). Cria motivo recorrente para o empresário voltar
e para compartilhar.

**Critérios de aceitação:**
- [ ] Destaque baseado em **evolução** (delta), não em tamanho absoluto —
      dá chance a negócio pequeno, evita que os grandes monopolizem
- [ ] Rotativo: ninguém fica permanentemente no topo
- [ ] Aparecer no destaque é **opt-out** possível

**Regras de segurança:** só dados de fachada; nenhum negócio é exibido
negativamente.

**Dados trafegados:** nome, segmento, delta de evolução (agregado).

---

### GH-GROW-05 — Painel de oportunidades para a labdatadev (o comercial automático)

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-ATR-01` |

**Descrição:** **É aqui que "sem time comercial" se concretiza.** Um painel
admin (só para o Antonio) que ordena os negócios cadastrados por
**oportunidade real**, cruzando: score de fit do onboarding, degrau atual vs.
degrau-alvo, atributos mais fracos, e serviços recomendados ainda não
contratados. O sistema faz a prospecção; o humano só executa a conversa.

**Critérios de aceitação:**
- [ ] Lista ordenada por potencial, com o **motivo** explícito de cada
      recomendação ("Presença 3/40, declarou budget R$1.5–3.5k, ainda no
      degrau 1")
- [ ] Filtro por cidade/bairro/segmento
- [ ] Acesso **restrito** — rota admin, nunca acessível a tenant comum
- [ ] Registra quando uma oportunidade virou contato (evita reabordagem)

**Regras de segurança:**
- 🔴 **Card de maior sensibilidade do backlog.** Expõe dados de onboarding
  (budget, gargalos) de todos os tenants — exatamente o que a RLS protege
  hoje
- Autorização por papel (`admin`), verificada **no servidor** em toda
  requisição, não só escondendo o link no menu
- Auditoria: registrar quem acessou o painel e quando
- Considerar 2FA para a conta admin antes de expor em produção
- Rota admin **fora** do sitemap e com `noindex`

**Dados trafegados:** dados comerciais sensíveis (budget declarado, score,
gargalos) — **jamais** podem vazar para outro tenant ou para rota pública.

**Boas práticas:** o usuário declarou o budget no onboarding esperando
recomendação personalizada — usar para prospecção interna é legítimo e
esperado; **vender ou compartilhar com terceiros não é**. Documentar isso na
política de privacidade antes do primeiro cadastro real.

---

## Épico 8 — Camada Educacional (P1/P2)

> Diferencial para o pitch do Sebrae: não é só um jogo, é **plataforma de
> ensino de empreendedorismo** onde a lição é aplicada ao negócio real do
> jogador no mesmo instante.

### GH-EDU-01 — Trilha de aprendizado ancorada na escada de valor

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-ATR-01` |

**Descrição:** Cada degrau da escada de valor ganha conteúdo educacional
curto (o "porquê" por trás da recomendação). Ex.: ao receber a missão
"Organize seus processos", o jogador acessa uma lição de 3 minutos sobre
por que processo documentado destrava crescimento.

**Critérios de aceitação:**
- [ ] Conteúdo em markdown versionado no repo (não CMS externo por ora)
- [ ] Lição sempre ligada a uma **ação concreta** no jogo (nunca teoria solta)
- [ ] Concluir uma lição é um evento de gamificação (XP)
- [ ] Linguagem acessível — o ICP é empresário de PME, não estudante de
      administração

**Regras de segurança:** conteúdo estático, sem input de usuário — risco
baixo. Se evoluir para conteúdo gerado, sanitizar antes de renderizar.

**Dados trafegados:** progresso de leitura por tenant.

---

### GH-EDU-02 — Diagnóstico guiado como produto de entrada

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-EDU-01` |

**Descrição:** Transformar o Degrau 1 (Auditoria Digital Gratuita) numa
experiência guiada dentro do app — o jogador responde, recebe um diagnóstico
visual dos 5 atributos, e vê exatamente onde está o gargalo. É o produto de
entrada da escada de valor virando experiência de produto.

**Critérios de aceitação:**
- [ ] Relatório visual dos 5 eixos com pontos fortes/fracos
- [ ] Cada fraqueza aponta para uma ação disponível no jogo
- [ ] Exportável em PDF (o empresário quer mostrar pro sócio)

**Regras de segurança:** o PDF contém dados do próprio negócio — gerar
server-side e nunca deixar o link acessível sem sessão válida.

**Dados trafegados:** atributos e recomendações do próprio tenant.

---

## Épico 9 — Deploy Real + Segurança em Produção (P0)

> Nada dos épicos acima chega a um usuário real sem isto. Todo o
> ferramental já existe (`deploy/`) — falta executar e validar.

### GH-OPS-01 — Primeiro deploy real na VPS

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P–M |
| Depende de | — |

**Descrição:** Executar `deploy/vps-setup.sh` numa VPS real pela primeira
vez. Todo o script está escrito e validado por sintaxe, mas **nunca rodou**.

**Critérios de aceitação:**
- [ ] App acessível pela internet (HTTP no mínimo, HTTPS se houver domínio)
- [ ] PM2 sobrevive a reboot da VPS
- [ ] `deploy/deploy.sh` roda com sucesso numa segunda vez (idempotência real)
- [ ] Nginx faz proxy corretamente; porta 8081 **não** exposta diretamente

**Regras de segurança:**
- `GAMEHUB_SECRET` gerado com entropia real na VPS (o script já faz)
- Firewall: só 22/80/443 públicos
- `.env` com permissão restrita, nunca versionado
- Confirmar que `SUPABASE_SERVICE_ROLE_KEY` (se usada) não é exposta ao
  browser

**Dados trafegados:** ⚠️ a partir daqui, dados de **pessoas reais**. Antes
do primeiro cadastro real: política de privacidade mínima publicada.

---

### GH-OPS-02 — Remote GitHub + CD automático

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | `GH-OPS-01` |

**Critérios de aceitação:**
- [ ] Repositório remoto criado e push feito
- [ ] Secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` configurados
- [ ] Push na `main` dispara deploy e o gate de qualidade bloqueia deploy
      quebrado (testar propositalmente com um commit que falha o typecheck)

**Regras de segurança:**
- Chave SSH **dedicada** ao CI (não a chave pessoal do Antonio), com escopo
  mínimo
- Revisar que nenhum segredo entrou no histórico antes do push público
  (já verificado uma vez; reverificar antes de tornar público)
- Considerar repositório **privado** enquanto houver dados/segredos em
  discussão nos docs

---

### GH-OPS-03 — Validar RLS em runtime + testes de isolamento

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | M |
| Depende de | `GH-OPS-01` |

**Descrição:** As policies RLS foram validadas **só por parsing estático**.
Nunca rodaram contra um Postgres real. Este é o card que separa "acho que
está isolado" de "provei que está isolado".

**Critérios de aceitação:**
- [ ] `supabase start && supabase db reset` roda sem erro
- [ ] Teste automatizado provando que o tenant A **não consegue** ler
      `onboardings` do tenant B (o dado mais sensível do sistema)
- [ ] Teste provando que `negocios` (fachada) É legível entre tenants —
      confirma que a exposição intencional funciona como projetado
- [ ] Teste do fluxo completo de cadastro com `GAMEHUB_DB=supabase`

**Regras de segurança:** 🔴 este card **é** a garantia de segurança
multi-tenant. Enquanto não for concluído, tratar o modo `supabase` como
não-validado para produção com dados reais de múltiplos clientes.

**Dados trafegados:** dados de teste, nunca reais.

---

### GH-OPS-04 — Política de privacidade e consentimento (LGPD)

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P–M |
| Depende de | — |
| Bloqueia | primeiro cadastro real |

**Descrição:** O onboarding coleta dados de negócio real (budget, gargalos,
localização). Antes de qualquer cadastro de pessoa real, é preciso deixar
claro o que é coletado, para quê, e o que fica público.

**Critérios de aceitação:**
- [ ] Página de política de privacidade acessível
- [ ] Consentimento explícito no cadastro, informando que o perfil terá
      página pública (`GH-GROW-01`)
- [ ] Caminho claro para o usuário solicitar exclusão dos dados
- [ ] Documentado quais campos são públicos vs. privados (espelhando a
      whitelist do código)

**Regras de segurança:** este card é pré-requisito legal, não opcional.
Coletar budget declarado sem informar o uso é exposição desnecessária.

**Dados trafegados:** metadado de consentimento (data, versão da política).

---

## Épico 10 — Pitch Readiness (Sebrae) (P0)

### GH-PITCH-01 — Roteiro de demo à prova de falhas

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | Épico 1 completo |

**Descrição:** Roteiro escrito da demo ao vivo, com dados semeados
previamente e caminho testado — evitando descobrir um bug na frente da banca.

**Critérios de aceitação:**
- [ ] Script de seed que cria um bairro plausível com 6–8 negócios
- [ ] Roteiro passo a passo (cadastro → hub → mapa → contratar IA → ver
      progresso) cronometrado
- [ ] Testado de ponta a ponta no ambiente **de produção**, não só local
- [ ] Plano B documentado se a internet falhar (rodar local com
      `GAMEHUB_DB=file` + `iniciar.bat`)

**Regras de segurança:** dados de demo devem ser **fictícios plausíveis** —
nunca dados reais de empresas conhecidas sem autorização.

---

### GH-PITCH-02 — Narrativa de impacto regional (material do pitch)

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | — |

**Descrição:** O Sebrae avalia **impacto no ecossistema**, não elegância
técnica. Preparar a narrativa: o problema real das PMEs do interior do RJ,
por que gamificação resolve engajamento onde consultoria tradicional falha,
e a visão de bairro → cidade → estado.

**Critérios de aceitação:**
- [ ] Uma frase que explica o produto para quem não é técnico
- [ ] Números honestos (o que já funciona vs. o que é visão) — **nunca
      apresentar visão como se fosse funcionalidade pronta**
- [ ] Conexão explícita com desenvolvimento econômico regional
- [ ] Modelo de sustentabilidade claro (como o projeto se paga)

**Boas práticas:** honestidade sobre o estágio é vantagem competitiva num
pitch — bancas experientes detectam exagero, e um MVP honesto com visão
clara pontua mais que um protótipo vendido como produto maduro.

---

## Resumo executivo — ordem sugerida de execução

**Sprint 1 (destrava a demo):** `GH-FDN-01` → `GH-FDN-02` → `GH-FDN-03` →
`GH-PITCH-01`

**Sprint 2 (profundidade de jogo):** `GH-ATR-01` → `GH-ATR-02` →
`GH-ATR-03` → `GH-ARV-01`

**Sprint 3 (produção real):** `GH-OPS-04` → `GH-OPS-01` → `GH-OPS-02` →
`GH-OPS-03`

**Sprint 4 (crescimento):** `GH-GROW-01` → `GH-GROW-05` → `GH-GROW-02` →
`GH-GROW-03`

**Sprint 5 (equipe + mundo):** `GH-EQP-01` → `GH-EQP-02` → `GH-WORLD-01` →
`GH-WORLD-02`

**Sprint 6+ (escala e visão):** `GH-MAPA-01/02` → `GH-WORLD-03..06` →
`GH-EDU-01/02` → `GH-MAPA-03/04` → `GH-GROW-04`

> **Nota de priorização:** `GH-OPS-04` (LGPD) aparece antes de `GH-OPS-01`
> (deploy) de propósito — não faz sentido colocar no ar um sistema que
> coleta budget de empresário real sem política de privacidade publicada.
