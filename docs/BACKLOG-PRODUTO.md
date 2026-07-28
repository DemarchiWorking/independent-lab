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
| 11 | [Eventos Globais — Gamificação em Tempo Real](#épico-11--eventos-globais--gamificação-em-tempo-real-p1) | Campanhas com prazo que todos os jogadores veem ao mesmo tempo — dá "pulso" de comunidade ao ecossistema |
| 12 | [Módulos Futuros do App-Drawer](#épico-12--módulos-futuros-do-app-drawer-sem-levantamento-ainda) | Placeholders sem levantamento (equipe humana, finanças, rh-motivação) — formalizados nesta sessão, não executáveis ainda |
| 13 | [Multiplayer Real](#épico-13--multiplayer-real-presença-ao-vivo-via-supabase) | Presença ao vivo via Supabase Realtime — plano BMAD completo em `architecture/BMAD-MULTIPLAYER-VPS.md`; ordem dos 2 primeiros cards é dependência de segurança real, não só prioridade |

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

### GH-FDN-03 — Persistir seleção de bairro/cidade e parcerias formadas no Mapa ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P |
| Depende de | `GH-FDN-02` (mesmo padrão) |

**Descrição:** `MapaScreen` guarda `parceriaCom` (quais vizinhos já viraram
parceria) em `useState` local. Mesma classe de problema do `GH-FDN-02`.

**Critérios de aceitação:**
- [x] "Parceria formada" sobrevive a reload — `parceriasFormadas: string[]`
      do servidor (`hub/page.tsx` → `GameShell` → `MapaScreen`), nunca
      `useState` local
- [x] Uma parceria não pode ser formada duas vezes com o mesmo vizinho —
      `unique(tenant_id, vizinho_tenant_id)` (migration `0014_parcerias_mapa.sql`)
      + guarda pura `jaFormouParceria` (`features/mapa/guarda.ts`, testada)

**Achado ao implementar:** `parceria_formada` rodava pelo dispatcher
genérico `recompensar()` **sem nenhuma guarda de idempotência** — só o
`useState` local impedia o re-clique, perdido a cada reload. Este card
fechou os dois problemas juntos (persistência + farm hole real), não só o
que o título descreve.

**Regras de segurança:** RPC `formar_parceria` valida que `vizinhoTenantId`
é de fato vizinho de quarteirão via join (mesma lógica de
`vizinhos_do_tenant`) — nunca confia em ID arbitrário vindo do client.
Action dedicada `features/mapa/actions.ts` (fora do dispatcher genérico,
mesmo motivo de `desbloquearNo`).

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

### GH-ATR-03 — Requisito mínimo de atributo em entregas e nós da árvore ✅

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
- [x] Catálogo de jobs e nós ganham `requisitos: Partial<Atributos>`
      (`Job.requisitos` em `features/marketplace/data.ts`, `HexNode.requisitos`
      em `features/parcerias/data.ts` — substitui o antigo `minScore`, que
      era exibido mas nunca validado)
- [x] UI mostra comparação lado a lado (atual vs. requisito) antes da
      confirmação, com indicação visual clara de atendido/não atendido
      (`components/ui/RequisitoAtributos.tsx`, usado em `MarketplaceScreen` e
      `HexTreeScreen`)
- [x] Servidor **recusa** a ação se o requisito não for atendido (não é só
      aviso visual — é validação real): checagem em `recompensar()`
      (`servico_contratado`) e `desbloquearNo()`, **e** na RPC atômica
      (`aceitar_trabalho`/`desbloquear_no`, migration
      `0012_atr_requisitos.sql`) — dupla garantia, mesmo padrão de
      `GH-ARV-01`

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

### GH-EQP-02 — Fluxo em 2 etapas: aceitar job → alocar quem executa ✅

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

**Decisão de contribuição (confirmada com o usuário):** cada `CargoIA`
contribui um valor fixo (`CONTRIBUICAO_ATRIBUTO_ALOCACAO`, `catalogo.ts`)
só no eixo que já fortalece (`eixoFortalecido`) — não um vetor de 5 valores
por cargo (o catálogo não tinha esse dado calibrado).

**Critérios de aceitação:**
- [x] Modal de seleção mostra atributos de cada recurso disponível —
      `SelecionarFuncionarioModal.tsx` (reusa `RibbonPanel`), lista
      `FuncionarioContratado[]` com livre/ocupado via `disponibilidade`
- [x] Soma dinâmica (`Total`) atualiza ao marcar/desmarcar — cálculo
      client-side espelha exatamente `contribuicaoDaEquipe()` (pura,
      testada) usado no servidor
- [x] Confirmar só habilita quando o total (baseline + equipe) atende o
      requisito mínimo — `atendeRequisitos()`
- [x] Servidor recalcula e valida de novo antes de persistir — nova action
      dedicada `features/marketplace/actions.ts` → `aceitarTrabalhoComEquipe()`,
      fora do dispatcher genérico `recompensar()` (mesmo motivo de
      `desbloquearNo`), aloca cada funcionário via RPC `alocar_funcionario`
      (primeira vez que é chamada de verdade, GH-EQP-01 já existia sem
      nenhum caller) e só então aceita o job

**Regras de segurança:** dupla validação (client para UX, servidor para
integridade) — mesmo princípio já aplicado em `GH-FDN-01`. Nota de
implementação: `aceitarTrabalho` é chamado **sem** `job.requisitos` (de
propósito — o requisito já foi checado com a soma da equipe incluída;
repassar `job.requisitos` faria a RPC recusar de novo contra só a baseline
do negócio, sem a equipe, quebrando o propósito do card).

**Dados trafegados:** lista de `funcionarioId`s selecionados + `jobId`.

---

### GH-EQP-04 — Habilidades, níveis e entregáveis dos Funcionários de IA ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | G |
| Depende de | `GH-ATR-01`, `GH-EQP-01` |

**Descrição:** os Funcionários de IA passam a **produzir material real e
baixável**, personalizado pelas respostas do onboarding — é o que
transforma "linha numa lista de contratados" em produto com valor
percebido. Cada agente ganha habilidades destravadas por nível.

**Arquitetura (3 camadas separadas de propósito):**
1. **Geração pura** (`features/equipe-ia/entregaveis/`): perfil →
   estrutura de dados. Sem I/O, sem relógio — 18 testes.
   `vocabulario.ts` é a fonte ÚNICA do conhecimento de nicho (licitação,
   ART, merenda escolar…), consumida pelos 3 geradores: melhorar o texto
   de um segmento melhora os três entregáveis de uma vez.
2. **Renderização** (`render.ts`): estrutura → HTML autocontido e
   imprimível, cor/fonte de `design-system/tokens.ts`. Escapa conteúdo do
   usuário (`escaparHtml`) — nome de negócio vai para dentro do arquivo.
3. **Transporte** (`/api/entregavel/[tipo]`): download.

**Entregáveis por cargo:**
| Cargo | Entregável | Formato |
|---|---|---|
| Documentador | Business Model Canvas (9 blocos) | HTML imprimível |
| Social Media | Post pronto | PNG 1080×1080 (`next/og`) |
| Comercial | Script comercial + estratégia de cadência | HTML imprimível |

**Níveis (1–3):** `CUSTO_EVOLUCAO_FUNCIONARIO` (1200🪙 → 3000🪙),
migration `0024_funcionario_nivel.sql` com RPC atômica. Nível controla
**profundidade**, não conteúdo diferente: nv2 acrescenta próximos passos
no canvas / gargalo no post / cadência no script; nv3 acrescenta leitura
de risco / argumento de autoridade / objeção de timing. Evoluir também dá
+2 no eixo que o cargo já fortalece.

**🔒 Regra de multi-tenancy da rota de download:** o tenant vem SEMPRE de
`lerSessao()`, **nunca** de query param — diferente de
`/api/og/conquista` (público, só fachada). O canvas carrega dado de
onboarding (faixa de investimento, gargalo declarado), o mais sensível do
sistema. Uma rota só para os 3 tipos = um único ponto de autenticação
para auditar. Servidor também recusa se o cargo não estiver contratado.

**Nota de qualidade encontrada na verificação:** gerando contra o dado
semeado real, o post saía "Precisa resolver isso em **mendes**?" — o
fallback sem onboarding usava o slug cru. Corrigido (`humanizarSlug`),
com teste. Detalhe pequeno, mas era justamente no arquivo que o
empresário publica.

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

### GH-ARV-02 — Gating em 3 níveis (disponível / comprável / bloqueado) ✅

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
- [x] 3 estados visualmente distintos: disponível, comprável, inalcançável
      (`HexTile.tsx` — hexágono dimmed + badge coral com ícone "close",
      nunca só cor; legenda do grid ganhou a entrada correspondente).
      "Bloqueado" continua sendo condição estrutural estática do catálogo
      (hoje só `infra`) — não havia dependência pai→filho entre nós para
      generalizar, então não foi criada (YAGNI; documentado como decisão em
      `docs/PROXIMA-TAREFA.md` antes deste card)
- [x] Nó inalcançável mostra o motivo (qual atributo falta e quanto) — já
      resolvido pelo `RequisitoAtributos.tsx` de `GH-ATR-03` no painel de
      detalhe; este card só precisou refletir o mesmo cálculo no grid
      (função pura `noInalcancavel()` em `features/parcerias/guarda.ts`,
      testada isoladamente)

**Regras de segurança:** nenhuma nova (reusa validação de `GH-ATR-03`).

**Dados trafegados:** nenhum dado novo.

---

## Épico 5 — World: Sede, Mobília, Avatares (P1/P2)

> Ver arquitetura completa em [`world/ARQUITETURA-WORLD.md`](world/ARQUITETURA-WORLD.md).
> Maior impacto visual para o pitch — mas o maior esforço. Construído em
> fases **W1→W6**, cada uma demonstrável isoladamente. **Não pular fases.**

### GH-WORLD-01 — Fundação de dados (sedes, catálogo de mobília, avatares) ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | — |
| Corresponde a | Fase **W1** de `ARQUITETURA-WORLD.md` §6 |

**Descrição:** Migration + `GameRepository` para as 4 entidades novas:
`sedes`, `itens_mobilia_catalogo`, `itens_mobilia_colocados`, `avatares` —
schema já rascunhado em `ARQUITETURA-WORLD.md` §4.

**Nota de correção (2026-07-28):** os checkboxes abaixo ficaram
desatualizados — a fundação já estava pronta desde `0004_sede.sql`, só com
schema **deliberadamente mais simples** que o rascunho original:
- `sedes` e `itens_mobilia_colocados` são tabelas reais (RLS forçada); ✅
- `itens_mobilia_catalogo` **nunca virou tabela** — é catálogo estático
  (`CATALOGO_MOBILIA` em `features/sede/catalogo.ts`), mesmo padrão de
  `CARGOS_IA`, já citado como intenção em `ARQUITETURA-WORLD.md` linha 94;
- **não existe tabela `avatares`** — avatar (dono + Funcionários de IA) é
  projeção client-side de `funcionarios_contratados` + sessão, nunca
  persistido (`ESTADO-DO-PROJETO.md` linha 211: "avatar do World já existe,
  sem migration nova"). Decisão consciente, não gap.

**Critérios de aceitação:**
- [x] Migration Supabase seguindo o padrão de `0001`–`0003` (RLS forçada,
      índice em `tenant_id`, `unique` onde fizer sentido) — `0004_sede.sql`
- [x] File-adapter espelha a mesma capacidade —
      `lerSede`/`evoluirSede`/`listarMobiliaColocada`/`comprarMobilia`/
      `moverMobilia` em `file-adapter.ts`
- [x] Toda empresa cadastrada recebe uma sede inicial automaticamente (nível
      1) — lazy-create no primeiro `lerSede()`, não dentro da transação de
      cadastro; aceito porque é idempotente e nunca deixa um tenant sem sede
      (mesmo critério de "boas práticas" abaixo)
- [x] SQL validado por parser real (`pg-query-emscripten`, scratchpad) —
      `0004_sede.sql` parseado (sintaxe + corpo plpgsql) nesta sessão, único
      item que ainda não tinha essa confirmação registrada

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

### GH-WORLD-02 — Tela estática "Minha Sede" (comprar/ver, sem canvas) 🟡 parcial

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

**Nota de correção (2026-07-28):** o comparativo atual×próxima e a grade de
mobília já estavam prontos (`SedeScreen.tsx`), só não registrados. Dos dois
critérios restantes, o de XP foi fechado nesta sessão; o de alugar-vs-comprar
segue **deliberadamente em aberto** — é decisão de produto (muda o modelo de
progressão da Sede), não algo para inventar sem alinhar com o usuário.

**Critérios de aceitação:**
- [x] Comparativo "sede atual × próxima" com capacidade e custo recorrente —
      `SedeScreen.tsx`, painel "Melhorar sede"
- [x] Grade de mobília com preço e bônus percentual por atributo (liga com
      `GH-ATR-02` — comprar móvel eleva atributo)
- [x] Evoluir de sede é um evento de gamificação: `XP_EVOLUCAO_SEDE` (150,
      `features/sede/niveis.ts`) aplicado atomicamente na RPC `evoluir_sede`
      (migration `0015_sede_evoluir_xp.sql`) — **não** conta como avanço de
      degrau (o critério original dizia "pode", não "deve"; adicionar isso
      exigiria decidir SE evoluir a sede deveria empurrar o negócio na
      escada de valor, o que é produto, não bug)
- [ ] Escolha explícita entre **alugar** (menor capacidade, custo recorrente
      menor) e **comprar/própria** (custo único alto, sem mensalidade) — hoje
      `tipo: "alugada"|"propria"` em `niveis.ts` é um rótulo FIXO por nível
      (progressão linear 1→2→3→4), não uma bifurcação que o jogador escolhe.
      Gap real, mantido em aberto de propósito.

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

### GH-WORLD-06 — Visitar sede de vizinho (somente leitura) ✅

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-WORLD-05` |
| Corresponde a | Fase **W6** |

**Descrição:** A partir do Mapa/Painel, visitar a sede de QUALQUER
vizinho — somente leitura, aberta por padrão no MVP (decisão que substitui
a exigência de opt-in `sede.publicada` desta versão anterior do card — ver
`docs/world/VISITAR-VIZINHO.md` §1). Painel de proposta comercial
(Funcionários de IA) é o entregável central desta feature — ver
`docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md`.

**Critérios de aceitação:**
- [x] Botão "Visitar" aparece para qualquer vizinho — visita é aberta por
      padrão no MVP, sem publicação/opt-in
- [x] Visita é read-only (nenhuma ação de compra/edição possível na sede
      alheia) — `VisitaScreen.tsx` nunca importa `moverMobilia`/
      `comprarMobilia`/`evoluirSede`
- [x] Painel de pitch comercial mostra proposta personalizada pelo eixo
      mais fraco do negócio visitado

**Regras de segurança:**
- Leitura via Server Component autenticado (`lerSessao` exige sessão),
  mesmo padrão de `lerSede`/`listarMobiliaColocada` hoje — nenhuma RLS ou
  RPC nova necessária (`SupabaseRepository` sempre usa `service_role`,
  ver `docs/world/VISITAR-VIZINHO.md` §2)
- Visitar a própria sede redireciona para `/world` (não é bug, é caso
  degenerado sem UI própria)

**Dados trafegados:** layout da sede do vizinho — aberto por decisão de
produto do MVP (não mais "só quando publicada"). Nunca expõe dado
financeiro/onboarding do visitado (moeda virtual, XP, respostas de
onboarding continuam privados).

---

### GH-WORLD-07 — Upgrade de equipamento com bônus escalonado ✅

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-WORLD-02`, `GH-ATR-02` |

**Descrição:** cada móvel/equipamento comprado pode ser evoluído até o
nível 3, e cada nível **reaplica o bônus de atributo do item** — melhora
de status direta para o escritório. Dá profundidade à Sede sem precisar
de catálogo novo: os 7 itens existentes ganham 3 níveis cada.

**Modelo (puro, em `features/sede/upgrade.ts`, 7 testes):**
- Bônus total no nível N = `base × N` — simples de explicar na tela.
- Custo do upgrade para o nível N = `preço base × N`. Escala junto com o
  benefício, garantindo que evoluir **nunca** seja mais barato que
  comprar um item novo (testado) — a escolha entre os dois é o
  interessante do jogo.
- Teto: nível 3.

**Atomicidade:** migration `0025_mobilia_nivel.sql`, RPC `evoluir_mobilia`
faz débito + bônus de atributo na MESMA transação (aqui o bônus É parte
da compra, diferente de `evoluirFuncionario`, onde o ganho é recompensa
de gamificação aplicada à parte). Valida posse (`tenant_id`) e salto de
exatamente +1 — dois cliques rápidos não compram dois níveis com a mesma
moeda.

**UI:** botão "Melhorar equipamentos" na Sede → modal listando os itens
com nível atual, bônus acumulado e custo do próximo nível.

---

### GH-SIM-01 — Motor de simulação: tick determinístico + ECS mínimo

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | **G** (o maior card do backlog inteiro) |
| Depende de | — |
| Corresponde a | **G0→G1** de `world/EVOLUCAO-MOTOR-2026.md` §10 |

**Descrição:** formalização de um card que já existia como plano em
`docs/world/EVOLUCAO-MOTOR-2026.md` (pesquisa de mercado 2026 + roadmap
G0–G6), mas nunca tinha virado item do backlog formal — encontrado nesta
sessão ao alinhar o que está em `.md` soltos contra `BACKLOG-PRODUTO.md`.
O próprio documento de pesquisa considera este o "desbloqueio conceitual"
do World: uma camada de simulação (ECS + tick determinístico) que viabiliza
humor/rotina da equipe, produção e progressão ociosa — sem ela, G3
(temporada/retenção) vira "checklist com pontos" e G2 (pipeline de arte)
"troca visual sem ganho de profundidade" (§10 do documento).

**Não implementar sem sessão dedicada.** É esforço G — múltiplas fases,
arquitetura nova (pasta `sim/`, ver §5.3 do documento) — não cabe no ritmo
de cards P/M desta sessão. Registrado aqui só para o backlog formal não
ficar cego a um plano que já existe e já tem pesquisa feita por trás.

**Critérios de aceitação:** ver `world/EVOLUCAO-MOTOR-2026.md` §10 e §11
(riscos) antes de abrir este card — não duplicado aqui de propósito, o
documento é a fonte única e evolui independente deste índice.

**Regras de segurança:** relevantes quando o card for aberto — o próprio
documento já adianta a mais importante (§7.4): "forjar tempo decorrido"
precisa ser guardado com `now()` do servidor, nunca do cliente, mesmo
princípio já usado em `lib/disponibilidade.ts`/`features/historia/relogio.ts`.

---

## Épico 6 — Mapa-múndi Multi-tenant (P1/P2)

> Escala o ecossistema de "um quarteirão" para "bairro → cidade → região".
> Ver [`world/MAPA-MUNDI-VALE-DO-CAFE.md`](world/MAPA-MUNDI-VALE-DO-CAFE.md).

### GH-MAPA-01 — Consulta agregada por cidade/bairro (performance) 🟡 parcial

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
- [x] View/consulta que retorna `{ cidade, total_negocios, total_bairros }`
      sem carregar cada negócio — `GameRepository.lerMapaResumo()`, RPC
      `mapa_resumo()` (migration `0017_mapa_resumo.sql`, `left join` +
      `count`, leitura pública sem `security definer` — mesma RLS já
      aberta de cidades/bairros/negocios)
- [x] Idem para bairros dentro de uma cidade — `lerBairroResumo(cidadeSlug)`,
      RPC `bairro_resumo(p_cidade_slug)`
- [x] `lerMapaView()` ganhou `escopo?: EscopoMapa` opcional — quando
      informado, só o bairro pedido vem com `quarteiroes` populado
- [ ] Medição antes/depois documentada no PR (com dados semeados suficientes
      — ex.: 200 negócios) — **não feito nesta sessão**: exigiria escrever
      um script de seed sintético só para provar o ganho, e hoje o mundo real
      tem 7 cidades sem bairro nenhum pré-semeado (`lib/regiao.ts` +
      `supabase/seed.sql` — bairros só nascem no primeiro cadastro real). A
      própria pesquisa desta sessão confirma: "performance" aqui é hoje
      teórica, não um gargalo observado. Falta seed script + benchmark real
      antes de fechar este checkbox.

**Nota de integração (2026-07-28):** `escopo` em `lerMapaView()` **não está
sendo usado por nenhum chamador ainda** — de propósito. A única tela real
(`MapaScreen`) recebe o mundo inteiro do servidor e troca cidade/bairro
**no client, sem novo fetch** (é assim que a troca de pill é instantânea
hoje). Passar `escopo` a partir de `hub/page.tsx` quebraria essa UX sem
`GH-MAPA-02` (zoom com fetch por nível) para substituí-la — por isso o
parâmetro existe no contrato (repository + os 2 adapters), mas fica **inerte**
até `GH-MAPA-02` decidir a nova estratégia de fetch. Documentado aqui para
não parecer código morto/esquecido numa auditoria futura.

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

### GH-MAPA-04 — Benchmark regional (com calibração editorial) ✅

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
- [x] Mostra a posição do negócio em relação à média do bairro — seção
      "Você e a média do seu bairro" em `/painel`, RPC `benchmark_bairro`
      (migration `0022_benchmark_bairro.sql`, mesmo padrão de leitura
      pública de `mapa_resumo`/`bairro_resumo` do `GH-MAPA-01`)
- [x] Enquadramento sempre orientado a ação — `features/mapa/benchmark.ts`
      (`eixoParaFocar`/`mensagemFoco`, puras, testadas): escolhe o eixo com
      MAIOR distância abaixo da média e sugere a ação real do jogo que
      resolve (ex.: "contratar o Comercial/SDR de IA"), nunca teoria solta
- [x] Nenhum negócio exposto por nome — só a média agregada do bairro
      (`totalNegocios` + `medias`), nunca lista individual

**Verificação:** testado contra o dado semeado real (`GH-PITCH-01`, 6
negócios) — a média de `tecnologia` calculada bateu exata (10,1666... =
61/6) contra o cálculo manual.

**Regras de segurança:** comparações usam **agregados anonimizados** (média
do bairro), nunca "empresa X é melhor que você". Dados de onboarding
(budget/score) **jamais** entram no benchmark — a RPC só toca as mesmas
colunas de fachada já usadas no mapa (`GH-MAPA-01`).

**Dados trafegados:** médias agregadas + atributos do próprio tenant.

**Boas práticas:** este card carrega risco reputacional real — o produto é
apresentado no Sebrae para PMEs. Revisar o texto com cuidado: benchmark que
motiva, não que envergonha. Teste de string dedicado garante que a
mensagem nunca menciona "vizinho"/"concorrente"/"rival"/"melhor que".

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

### GH-GROW-01 — Perfil público do negócio (vitrine indexável) ✅

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
- [x] Rota pública SSR — `src/app/n/[slug]/page.tsx`, Server Component puro
- [x] Metadados corretos (title, description, Open Graph) por negócio —
      `generateMetadata()`
- [x] `sitemap.xml` gerado dinamicamente — `src/app/sitemap.ts` (primeiro
      deste app), só com `perfilPublico = true`; `robots.ts` também novo,
      bloqueia `/hub`/`/painel`/`/world`/`/admin`
- [x] Só expõe dados de fachada — whitelist explícita no JSX de
      `page.tsx` (nome/segmento/cidade/bairro/nível/degrau/ofertas), nunca
      `atributos`/`xp`/`moedaVirtual`
- [x] Negócio pode optar por não aparecer — `Negocio.perfilPublico`
      (opt-out no formulário de cadastro, ver `GH-OPS-04`, entregue junto)
- [x] Slug derivado (`features/growth/slug.ts`, `slugDoNegocio`/`idDoSlug`)
      em vez de coluna nova — nome+id, sem migration de unicidade

**Regras de segurança:**
- [x] Whitelist explícita no código (não serializa `Negocio` inteiro)
- [x] Sem e-mail/telefone do dono em texto puro — formulário
      (`ContatoForm.tsx` → `enviarSolicitacaoContato`) persiste o contato do
      VISITANTE, nunca expõe o do dono
- [x] Rate limiting anti-spam — em memória, por `(tenantId, IP)`, 3 a cada
      10min (`features/growth/actions.ts`); documentado como MVP-adequado
      (1 processo PM2, sem load balancer — ver `AGENTS.md`), migraria pra
      Redis só se escalar horizontalmente

**Dados trafegados:** nome do negócio, segmento, cidade, bairro, nível,
degrau, serviços oferecidos. **Nunca:** e-mail, telefone, budget declarado,
score de fit, respostas do onboarding.

**Boas práticas:** LGPD — o negócio precisa saber, no cadastro, que terá
página pública, e poder desativar. Documentar isso no fluxo de onboarding.
**Feito junto com `GH-OPS-04`** (mesmo checkbox de consentimento no Wizard).

**Gaps que existiam neste card e já foram fechados** (mesma sessão,
lote seguinte): UI para o dono publicar `Oferta` e inbox de mensagens de
contato — ambos agora em `/painel` (`features/ofertas/`).

**Gap real que segue em aberto:**
- `sitemap.ts`/`robots.ts` usam `NEXT_PUBLIC_SITE_URL` (novo env var) — sem
  ele, cai em `localhost:8081`, o que produz um sitemap inválido em
  produção. Precisa ser setado no `.env` da VPS antes do primeiro deploy
  real (`GH-OPS-01`).

---

### GH-GROW-02 — Convite de vizinho com recompensa mútua ✅

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
- [x] Link de convite único por tenant — token HMAC assinado
      (`features/growth/convite.ts`, mesma técnica de `lib/auth/sessao.ts`,
      duplicada de propósito por não ser exportada de lá), `/cadastro?convite=<token>`
- [x] Recompensa só é paga quando o convidado completa o cadastro — resgate
      acontece dentro de `cadastrar()` (`resgatarConviteSeExistir`), nunca
      ao gerar/clicar o link
- [x] Recompensa em moeda virtual/XP (`XP_CONVITE`=150, `MOEDA_CONVITE`=120,
      mesma ordem de `parceria_formada`) — RPC `resgatar_convite`
      (migration `0021_convites.sql`), atômica para os dois negócios
- [x] Teto anti-abuso: `LIMITE_CONVITES_POR_JANELA`=5 a cada 30 dias por
      convidante — acima disso o CONVIDANTE para de ganhar, o convidado
      **sempre** ganha (nunca penaliza quem está entrando)
- [x] Contexto concreto — `/cadastro` mostra "Convite de X — junte-se ao
      Bairro, Cidade" e pré-preenche essas respostas no Wizard (o jogador
      pode trocar)

**Regras de segurança:**
- [x] Token assinado (HMAC) com expiração de 30 dias, verificado com
      `timingSafeEqual` (mesmo padrão de `lib/auth/sessao.ts`)
- [x] Auto-convite: estruturalmente impossível pela regra já existente de
      e-mail único por conta (`auth.emailExiste`) — a mesma pessoa não
      recria a própria conta com o mesmo e-mail; abuso via e-mails
      diferentes da mesma pessoa não é detectável só com dado de cadastro,
      por isso o teto por período + log de IP cobrem esse caso
- [x] Log de IP quando o teto é atingido (`console.warn`, revisão manual
      via `pm2 logs`) — não bloqueia automaticamente, conforme o card pedia
- [x] Nenhum e-mail é enviado pelo app — o dono copia o link manualmente
      (`ConvitePainel.tsx`, botão "Copiar")

**Dados trafegados:** token de convite (opaco), `tenantId` do convidante.
O convite não carrega dados do convidado antes dele se cadastrar.

**Simplificação consciente:** "o quarteirão real onde o vizinho vai entrar"
é mostrado como contexto (bairro/cidade do convidante), mas a alocação do
lote em si continua seguindo a regra já existente (primeiro lote livre do
bairro) — não força o convidado para o MESMO quarteirão do convidante char
por char. Forçar isso exigiria mudar `criar_negocio_com_lote`/`alocarLote`
para aceitar um quarteirão-alvo, o que é mudança de arquitetura maior que
não foi necessária para a mecânica funcionar (na prática, na maioria das
vezes vai cair no mesmo quarteirão mesmo, por ser o primeiro com vaga).

---

### GH-GROW-03 — Conquistas compartilháveis (share card) ✅

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

**Decisão de arquitetura:** conquistas **não têm tabela própria** —
"desbloqueada" é sempre derivado do estado já existente (degrau, equipe,
parcerias, nós da árvore, nível de sede), mesmo princípio de `DEGRAUS`.
Evita persistência nova para um dado 100% calculável.

**Critérios de aceitação:**
- [x] 6 conquistas com nome, descrição e progresso percentual
      (`features/conquistas/catalogo.ts`), agrupadas em "concluídas"/"em
      andamento" (`ConquistasPainel.tsx`, seção nova em `/painel`)
- [x] Imagem OG dinâmica ao desbloquear — `src/app/api/og/conquista/route.tsx`
      (`next/og` `ImageResponse`), botão "Compartilhar" por conquista
      concluída
- [x] Compartilhar é sempre ação manual — só existe um link/botão que o
      dono abre; nada é postado automaticamente
- [x] Marca do ecossistema discreta na imagem ("labdatadev · gamehub" no rodapé)

**Regras de segurança:** whitelist idêntica a `GH-GROW-01` — a imagem só
mostra nome do negócio + texto da conquista, nunca XP/moeda/atributos
brutos. Rota pública de propósito (sem sessão) — é assim que redes sociais
buscam a imagem ao gerar preview do link; documentado no cabeçalho do
`route.tsx` para não parecer credencial exposta numa auditoria futura.

**Dados trafegados:** dados de fachada renderizados em imagem.

---

### GH-GROW-04 — Ranking/destaque do bairro (prova social positiva) ✅

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | `GH-MAPA-04` |

**Descrição:** Destaque rotativo de negócios do bairro (ex.: "Negócio em
maior evolução este mês"). Cria motivo recorrente para o empresário voltar
e para compartilhar.

**Decisão de arquitetura — "evolução" sem histórico:** o sistema não guarda
snapshot de atributos ao longo do tempo, então "delta" verdadeiro (antes ×
depois) não existe hoje. Em vez de criar uma tabela de histórico só para
isto, o destaque usa uma proxy honesta: **contagem de eventos de progresso
reais nos últimos 30 dias** (contratação de Funcionário de IA, lição
concluída, nó desbloqueado, parceria formada) — RPC `destaque_bairro`
(migration `0023_destaque_bairro.sql`). Satisfaz o espírito do critério
(favorece atividade recente sobre tamanho acumulado) sem inventar
persistência nova.

**Critérios de aceitação:**
- [x] Destaque baseado em atividade recente, não em tamanho absoluto — um
      negócio pequeno com 5 eventos no mês bate um negócio grande parado
- [x] Rotativo — emerge da janela de 30 dias deslizando no tempo, não de
      sorteio; quem estava ativo há 31 dias some da conta sozinho
- [x] Opt-out — reusa `perfilPublico` (GH-GROW-01) em vez de um segundo
      toggle de privacidade dedicado a isto (mesma decisão de escopo já
      documentada para simplificar sem perder a garantia real)

**Verificação:** testado contra o dado semeado (`GH-PITCH-01`) — Radiz
Engenharia (3 contratações + 1 parceria + 1 lição = 5 eventos) venceu o
destaque do bairro, exatamente como esperado.

**Regras de segurança:** só dados de fachada; nenhum negócio é exibido
negativamente (a seção em `/painel` só mostra quem ganhou, nunca uma lista
comparativa com quem "perdeu").

**Dados trafegados:** nome, segmento, contagem de eventos recentes (agregado).

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

**Decisão desta sessão (2026-07-28): adiado de propósito, não implementado.**
Pesquisa completa já foi feita (ver abaixo) — falta só a implementação, numa
sessão que possa dar a este card a atenção que ele pede, não como item 4 de
5 num lote. Motivo: é o único card do backlog que exige **cruzar dados
privados entre tenants** (hoje a RLS de `onboardings` é estritamente
`tenant_id = tenant_atual()` — este painel seria o PRIMEIRO ponto do sistema
a furar essa fronteira de proposito, ainda que por um caminho legítimo). Não
é o tipo de coisa para apressar.

**O que a pesquisa já confirmou, pronto para quando este card for aberto:**
- **Não existe hoje nenhum método no `GameRepository` que liste dados de
  MÚLTIPLOS tenants com onboarding incluído** — precisa ser escrito do zero.
  O único precedente de leitura "todos os tenants" é `listarNegociosPublicos()`
  (`GH-GROW-01`, nesta mesma sessão), mas esse só toca campos JÁ públicos —
  não serve de template para dados privados.
- O padrão de gate já está estabelecido e deve ser replicado literalmente:
  `souAdmin()` (`src/lib/admin.ts`) + re-checagem independente **dentro de
  cada Server Action** (nunca confiar só no gate da página) — ver
  `src/app/admin/eventos/page.tsx` (mensagem neutra "Página não encontrada"
  pra quem não é admin) e `src/features/eventos-globais/actions.ts`
  (`criarEventoGlobal`/`listarTodosEventos` re-checam `souAdmin` cada um).
- **Gap real em `souAdmin()` que este card deveria fechar ou pelo menos não
  ignorar:** hoje é allowlist por env var **OU substring `"demarchi"` no
  e-mail** (aceita `qualquer.coisa.demarchi@gmail.com`) — e não há NENHUM
  log de auditoria de quem acessou o quê. O próprio `GH-EVT-05` (já no
  backlog, P3) documenta o plano de migrar para roles reais via Supabase
  Auth `app_metadata`. Dado que GH-GROW-05 é "o card de maior sensibilidade
  do backlog" segundo ele mesmo, ele é o gatilho natural para finalmente
  puxar `GH-EVT-05` também — não faz sentido dar acesso a budget de todos
  os tenants atrás de um gate que aceita substring de e-mail sem nenhum
  registro de quem entrou.
- A implementação em Supabase precisará necessariamente usar
  `supabaseAdmin()` (`service_role`, já o único cliente que `SupabaseRepository`
  usa hoje) para o cruzamento — não é uma mudança de trust boundary nova,
  mas o PRIMEIRO lugar onde esse bypass de RLS é usado para EXPOR dado
  privado de vários tenants de uma vez, não só para escrever atomicamente no
  próprio tenant. Vale um comentário de cabeçalho bem explícito no método
  novo, para não parecer um bug numa auditoria futura.

---

## Épico 8 — Camada Educacional (P1/P2)

> Diferencial para o pitch do Sebrae: não é só um jogo, é **plataforma de
> ensino de empreendedorismo** onde a lição é aplicada ao negócio real do
> jogador no mesmo instante.

### GH-EDU-01 — Trilha de aprendizado ancorada na escada de valor ✅

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
- [x] Conteúdo em markdown versionado no repo — `features/licoes/catalogo.ts`
      (`CATALOGO_LICOES`, 5 lições, 1 por degrau), não CMS externo
- [x] Lição sempre ligada a uma ação concreta — cada `Licao.acao` aponta
      para um botão real do jogo (aceitar job, desbloquear nó, contratar
      Funcionário de IA, evoluir Sede)
- [x] Concluir uma lição é evento de gamificação — `XP_LICAO` (40, bem
      abaixo de ações pagas como `servico_contratado`=200), RPC
      `concluir_licao` (migration `0020_licoes.sql`), mesma família
      idempotente de `desbloquearNo`/`formarParceria`
- [x] Linguagem acessível — tom direto, exemplos de PME real (planilha,
      resposta de lead, retrabalho entre sistemas), sem jargão de MBA

**Onde aparece:** `LicaoCard` no Hub (`HubScreen.tsx`), mostrando a lição do
`degrauAtual` do negócio — some da tela quando já concluída. **Decisão de
integração:** não virou aba nova no menu lateral nem módulo do app-drawer
— o card no Hub já satisfazia "ligada a uma ação concreta" sem precisar de
navegação nova; se um dia crescer para trilha completa multi-lição por
degrau, aí sim vale uma tela própria (fora de escopo hoje).

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

### GH-OPS-04 — Política de privacidade e consentimento (LGPD) ✅

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
- [x] Página de política de privacidade acessível — `/privacidade`
      (`src/app/privacidade/page.tsx`), primeira página de conteúdo
      estático do app
- [x] Consentimento explícito no cadastro, informando que o perfil terá
      página pública — checkbox obrigatório no último passo do `Wizard`
      (`consentimento`), checado no servidor em `cadastrar()` (nunca só
      desabilita o botão)
- [x] Caminho claro para solicitar exclusão — documentado em `/privacidade`
      ("use o formulário de contato do seu painel")
- [x] Documentado quais campos são públicos vs. privados — espelha
      literalmente a whitelist de `GH-GROW-01` no texto de `/privacidade`

**Regras de segurança:** este card é pré-requisito legal, não opcional.
Coletar budget declarado sem informar o uso é exposição desnecessária.

**Dados trafegados:** metadado de consentimento — `Negocio.consentimentoEm`/
`consentimentoVersao` (migration `0018_consentimento_lgpd.sql`), aplicado
junto com o opt-out de perfil público (`GH-GROW-01`, entregues no mesmo
lote, como o próprio card já pedia).

---

## Épico 10 — Pitch Readiness (Sebrae) (P0)

### GH-PITCH-01 — Roteiro de demo à prova de falhas 🟡 parcial

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | Épico 1 completo |

**Descrição:** Roteiro escrito da demo ao vivo, com dados semeados
previamente e caminho testado — evitando descobrir um bug na frente da banca.

**Critérios de aceitação:**
- [x] Script de seed — `src/scripts/seed-demo.test.ts` (`SEED_DEMO=1 npx
      vitest run src/scripts/seed-demo.test.ts`), 6 negócios (mesmos nomes
      já usados em `HubScreen.tsx`) no bairro Centro/Mendes, estados
      variados (equipe de IA, parceria, sede evoluída, nó da árvore, lição,
      oferta publicada). Conta de login própria só para a "herói" da demo
      (Radiz Engenharia). **Validado numericamente**: toda a aritmética de
      XP/moeda/atributo dos eventos aplicados (contratação, parceria,
      sede, lição, nó) foi conferida à mão contra o resultado persistido —
      bateu exato em todos os casos.
- [x] Roteiro passo a passo cronometrado — `docs/pitch/ROTEIRO-DEMO.md`
      (~6 min, cadastro→hub→mapa→equipe IA→marketplace→sede→painel→vitrine)
- [ ] Testado de ponta a ponta no ambiente **de produção** — não feito
      (não existe produção ainda, depende de `GH-OPS-01`); testado via
      repositório direto (`GAMEHUB_DB=file`) nesta sessão, não via clique
      no navegador (ver nota abaixo)
- [x] Plano B documentado — `docs/pitch/ROTEIRO-DEMO.md` §Plano B
      (`iniciar.bat` + `GAMEHUB_DB=file`, mesmo seed funciona local)

**Nota de verificação:** a prova de correção usada foi a mais forte
disponível sem navegador (ler o JSON persistido de cada negócio e conferir
manualmente cada delta de XP/moeda/atributo contra o que cada evento
deveria aplicar) — não uma checagem visual em browser. Um teste de clique
real ainda vale a pena antes do dia do pitch, mas a lógica de negócio em si
já está provada correta.

**Achado ao escrever o script:** contratar Funcionário de IA direto pelo
repositório (sem passar pelo dispatcher `recompensar()`) não aplica XP/
moeda/degrau/atributo sozinho — é a Server Action que faz a chamada extra.
O seed replica isso explicitamente (`contratarComRecompensa()`), e a ordem
das contratações respeita `degrauMinimo` de cada cargo (o repositório
sozinho não valida esse gate, só o dispatcher faz).

**Regras de segurança:** dados de demo devem ser **fictícios plausíveis** —
nunca dados reais de empresas conhecidas sem autorização.

---

### GH-PITCH-02 — Narrativa de impacto regional (material do pitch) ✅

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | P |
| Depende de | — |

**Descrição:** O Sebrae avalia **impacto no ecossistema**, não elegância
técnica. Preparar a narrativa: o problema real das PMEs do interior do RJ,
por que gamificação resolve engajamento onde consultoria tradicional falha,
e a visão de bairro → cidade → estado.

**Critérios de aceitação:** todos em `docs/pitch/NARRATIVA-IMPACTO.md`:
- [x] Uma frase que explica o produto para quem não é técnico
- [x] Números honestos (o que já funciona vs. o que é visão) — separado em
      duas seções explícitas, nunca misturado
- [x] Conexão explícita com desenvolvimento econômico regional — ancorado
      no ICP real (PMEs do Vale do Café que fornecem via licitação)
- [x] Modelo de sustentabilidade claro — assinatura dos Funcionários de IA
      (preço já calibrado, R$297–897/mês) como receita concreta hoje;
      comissão de marketplace como direção de médio prazo, marcado como
      visão, não compromisso

**Boas práticas:** honestidade sobre o estágio é vantagem competitiva num
pitch — bancas experientes detectam exagero, e um MVP honesto com visão
clara pontua mais que um protótipo vendido como produto maduro.

---

## Épico 11 — Eventos Globais / Gamificação em Tempo Real (P1)

> Campanhas com prazo definido, criadas pelo fundador (admin), visíveis a
> **todos os negócios ao mesmo tempo** — "Semana da Automação: 3 serviços
> vendidos ganham bônus". Reusa o catálogo `EventoKey` de
> `features/gamificacao/engine.ts` como `objetivo`: contar "quantos
> `servico_contratado` esse tenant gerou dentro da janela" é o que
> `recompensar()` já sabe fazer, não uma taxonomia nova. Decisão de
> arquitetura (perguntada ao usuário, não assumida): criação via **tela de
> admin no app** (não catálogo em código) e visibilidade via **relógio lazy**
> (não WebSocket/SSE) — sem infraestrutura de tempo real nova, mesmo padrão
> já usado no motor de história.

### GH-EVT-01 — Modelo de dados + regras puras ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P |
| Depende de | — |

**Descrição:** Tipos (`EventoGlobal`, `ProgressoEventoGlobal`), status
derivado da janela (`agendado`/`ativo`/`encerrado`, nunca gravado) e guarda
anti-farm, testados isoladamente antes de qualquer persistência — mesma
ordem usada para o motor de história.

**Critérios de aceitação:**
- [x] `features/eventos-globais/tipos.ts` — `EventoGlobal.objetivo:
      EventoKey` (reusa o catálogo existente, não inventa um novo)
- [x] `features/eventos-globais/motor.ts` — `statusDe`, `progressoPercentual`
      (nunca passa de 100), `atingiuMeta`, `janelaValida`, `eventosVisiveis`
      (esconde encerrados) — puro, 19 testes
- [x] `features/eventos-globais/guarda.ts` — `jaRecompensado` (mesma classe
      de `jaAceitouTrabalho`/`jaDesbloqueouNo`)
- [x] `lib/admin.ts` — `souAdmin(email)`, allowlist via
      `GAMEHUB_ADMIN_EMAILS` (MVP sem tabela de roles)

**Regras de segurança:** nenhuma ainda — camada pura, sem I/O.

---

### GH-EVT-02 — Persistência (tipos, repository, adapters, migration) ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-EVT-01`, `GH-ATR-03` (commitado antes, sem conflito) |

**Descrição:** Ligar o modelo de dados à persistência real e ao dispatcher
de gamificação.

**Critérios de aceitação:**
- [x] Migration `0013_eventos_globais.sql` — tabelas `eventos_globais`
      (leitura pública, mesmo padrão de `negocios`/`ofertas`) e
      `progresso_eventos_globais` (RLS por `tenant_atual()`); RPCs
      `criar_evento_global` e `incrementar_progresso_eventos` (atômica: soma
      1, e se bater a meta pela primeira vez aplica XP/moeda/atributo na
      MESMA transação — mesmo padrão de `desbloquear_no`); validada via
      `pg-query-emscripten` (parse + corpo plpgsql das duas funções OK)
- [x] `GameRepository` ganha `listarEventosGlobais`, `criarEventoGlobal`,
      `listarProgressoEventos`, `incrementarProgressoEventos` — implementados
      nos dois adapters (`EventoGlobal`/`ProgressoEventoGlobal` movidos para
      `lib/db/types.ts`, `objetivo` fica `string` ali — `lib/` não importa de
      `features/`; a narrowing para `EventoKey` acontece em `NovoEventoGlobal`)
- [x] `incrementarProgressoEventos` chamado a partir de
      `recompensar()` (`gamificacao/actions.ts`) e de `desbloquearNo()`
      (`parcerias/actions.ts`, para o objetivo `servico_desbloqueado`, que
      não passa por `recompensar()` desde `GH-ARV-01`)

**Regras de segurança:** escrita só via RPC (`service_role`), nunca insert
direto do client — mesmo padrão de `comprarMobilia`/`desbloquearNo`.

**Boas práticas:** ao integrar, chamar `incrementarProgressoEventos` DEPOIS
que a recompensa base do evento já foi aplicada com sucesso — nunca antes
(evita contar progresso de uma ação que falhou).

---

### GH-EVT-03 — Server actions (admin cria, jogador lê) ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P–M |
| Depende de | `GH-EVT-02` |

**Descrição:** `criarEventoGlobal(input)` — gated por `souAdmin(sessao.email)`,
valida `janelaValida` antes de chamar o repositório. `listarEventosAtivos()`
— sem gate (qualquer jogador logado), filtra com `eventosVisiveis` +
`agoraGlobal()` de `features/historia/relogio.ts`.

**Critérios de aceitação:**
- [x] Tentar criar evento sem ser admin retorna erro do servidor, nunca só
      esconde o botão na UI
- [x] Datas inválidas (fim ≤ início) rejeitadas no servidor, não só no
      `<input type="datetime-local">`
- [x] `listarEventosAtivos()` retorna também o progresso do tenant logado em
      cada evento (uma chamada, não N+1)

**Regras de segurança:** o e-mail usado no `souAdmin` vem da `Sessao`
assinada (`lerSessao()`), nunca de um campo enviado pelo client.

---

### GH-EVT-04 — UI (tela de admin + banner do jogador) ✅

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | `GH-EVT-03` |

**Descrição:** `/admin/eventos` — formulário com os parâmetros do evento
(título, descrição, objetivo, meta, início/fim, recompensa). Tela do
jogador — nova entrada "Eventos" no menu lateral (`GameShell.tsx`), lista
de eventos ativos/agendados com barra de progresso (`progressoPercentual`).

**Critérios de aceitação:**
- [x] `/admin/eventos` inacessível (mensagem neutra "Página não encontrada",
      não erro técnico) para quem não está na allowlist
- [x] Evento criado aparece para outro tenant assim que a janela abre —
      provado end-to-end via rota temporária: admin criou o evento, ação de
      jogador incrementou o progresso e a recompensa foi creditada
      (`xp`/`moedaVirtual` conferidos em `data/negocio.json`), sem WebSocket
- [x] Barra de progresso reflete `contagem/meta` do servidor, nunca
      `useState` local
- [ ] Toast/feedback ao bater a meta reusando `RecompensaContext` — **não
      feito**; hoje o card na aba "Eventos" mostra "— concluído!" inline,
      mas só aparece quando o jogador entra na aba, não como toast
      imediato. Follow-up de baixo esforço, não bloqueia o épico.

**Boas práticas:** reusar `ActionButton`/`HexTile`-style dos componentes já
existentes em `components/ui/` — não criar estilo avulso (regra não
negociável do `AGENTS.md`).

**Nota de validação:** a troca de aba usa `AnimatePresence`, que trava sem
`requestAnimationFrame` em navegador headless não composto (mesmo gotcha já
documentado no `AGENTS.md` para o canvas do World) — verificado via rota
temporária chamando as Server Actions direto, não via clique. Num navegador
real isso não acontece.

---

### GH-EVT-05 — Roles reais via Supabase Auth (dívida técnica documentada)

| Campo | Valor |
|---|---|
| Prioridade | P3 |
| Esforço | M |
| Depende de | `GH-EVT-03` |

**Descrição:** `souAdmin()` (`src/lib/admin.ts`) hoje é uma allowlist por
env var (`GAMEHUB_ADMIN_EMAILS`) **mais** um atalho pessoal do fundador
(qualquer e-mail contendo `"demarchi"`, por substring). Funciona para "só o
fundador administra", mas não escala e o atalho por substring é frouxo por
design (aceita `algo.demarchi@qualquer.com`). Este card É o plano de saída,
documentado agora para não reabrir a investigação depois — **não
implementar ainda**, só quando o gatilho abaixo disparar.

**Gatilho para puxar este card:** mais de ~2-3 admins reais, OU a primeira
ação administrativa que precise de RLS no Postgres (não só RPC atrás de
`souAdmin()` na Server Action).

**Plano (Supabase RBAC, caminho oficialmente documentado pela Supabase):**
1. Guardar o papel em `auth.users.app_metadata` (nunca `user_metadata` —
   esse o próprio usuário edita; `app_metadata` só via Admin API/
   service_role): `supabaseAdmin().auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } })`.
2. `SupabaseAuthProvider.autenticar()`/`registrar()`
   (`src/lib/auth/supabase-provider.ts`) passam a devolver `role` dentro de
   `Identidade` (`src/lib/auth/provider.ts`); `criarSessao()`
   (`src/lib/auth/sessao.ts`) grava `role` no cookie assinado — `Sessao`
   ganha o campo.
3. `souAdmin()` morre — vira `sessao.role === "admin"`, lido direto do
   cookie, sem round-trip a mais nem env var.
4. Opcional, só se/quando existir RLS que precise saber o papel DENTRO do
   Postgres (ex.: admin inserir em `eventos_globais` sem passar pela RPC
   `criar_evento_global`): um Auth Hook `custom_access_token_hook` injeta
   `app_metadata.role` no JWT na emissão do token, e a policy checa
   `(select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` — evita
   consultar uma tabela de roles a cada policy.
5. `local-provider.ts` (modo `GAMEHUB_DB=file`, sem Supabase) precisa do
   mesmo campo `role` no registro de `Usuario` para o dev local não
   divergir do comportamento de produção.

**Regras de segurança:** a garantia real de hoje (mesmo antes deste card)
já não é `souAdmin()` — é que toda escrita em `eventos_globais` só
acontece via RPC com `service_role`, nunca policy de insert direta (ver
`0013_eventos_globais.sql`). `souAdmin()`/`role` é só a UX de esconder o
menu de quem não é admin.

---

## Épico 12 — Módulos Futuros do App-Drawer (sem levantamento ainda)

> Encontrados nesta sessão ao alinhar o que existe em `.md` soltos contra
> este backlog formal: `features/roadmap/modules.tsx` já cadastra estes 3
> stubs (aparecem com selo "Em breve" no app-drawer do `GameShell`), e
> `docs/menu-inicial/ARQUITETURA-MENU-INICIAL.md` §4 já registra a intenção
> de cada um — mas nenhum teve requisito funcional levantado (nenhum print
> do Startup Panic analisado para eles, ao contrário de todo outro épico
> deste documento). **Não inventar critérios de aceitação aqui sem
> levantamento** — são placeholders de escopo, não cards prontos para
> execução.

### GH-EQP-03 — Contratação de equipe humana (distinta de Funcionários de IA)

| Campo | Valor |
|---|---|
| Prioridade | P3 |
| Esforço | G (sem levantamento) |
| Depende de | — |

**Descrição:** stub `contratar` em `features/roadmap/modules.tsx`. Precisa de
levantamento próprio antes de virar card executável — em particular, como
se distingue de Funcionários de IA na mecânica de alocação (`GH-EQP-01/02`
já cobre IA; equipe humana levanta questões novas: custo real vs. simulado,
disponibilidade, talvez folha de pagamento simulada).

### GH-FIN-01 — Simulador de fluxo de caixa (sem transação real)

| Campo | Valor |
|---|---|
| Prioridade | P3 |
| Esforço | G (sem levantamento) |
| Depende de | — |

**Descrição:** stub `financas` em `features/roadmap/modules.tsx`. Regra de
ouro já vale de antemão (repetida de todo o resto do backlog): moeda virtual
🪙 e R$ real nunca se misturam — qualquer simulação de caixa é só gamificação,
nunca cobrança de verdade.

### GH-RH-01 — Saúde/motivação da equipe (afeta velocidade de entrega)

| Campo | Valor |
|---|---|
| Prioridade | P3 |
| Esforço | G (sem levantamento) |
| Depende de | — |

**Descrição:** stub `rh-motivacao` em `features/roadmap/modules.tsx`. Tem
sobreposição conceitual com a camada de "humor/necessidades" que
`world/EVOLUCAO-MOTOR-2026.md` §7.2 já desenha para `GH-SIM-01` (G1) — ao
levantar este card, ler aquela seção primeiro para não duplicar mecânica.

---

## Épico 13 — Multiplayer Real (Presença ao vivo via Supabase)

> Plano estratégico completo (Business/Model/Architecture/Development) em
> [`architecture/BMAD-MULTIPLAYER-VPS.md`](architecture/BMAD-MULTIPLAYER-VPS.md)
> — cards aqui são o resumo executável, aquele documento é a fonte de
> verdade da decisão. **Ordem dos 2 primeiros cards não é flexível** — é
> dependência real de segurança, não só prioridade de negócio.

### GH-MULTI-00 — Hardening de RLS de `negocios` (pré-requisito de segurança)

| Campo | Valor |
|---|---|
| Prioridade | **P0 — bloqueia `GH-MULTI-02`** |
| Esforço | P |
| Depende de | — (mas exige Postgres real para validar, não só escrever) |

**Descrição:** `negocios_leitura` (`0001_init.sql`) é
`for select to anon, authenticated using (true)` — sem seleção de coluna.
Isso é seguro **hoje** porque nada no app chama `supabaseAnon()` do
browser. `GH-MULTI-02` é o primeiro código que faria isso — no instante
em que a anon key roda no cliente, ela é extraível por qualquer visitante,
e essa policy passa a expor `xp`/`moeda_virtual`/os 5 atributos de
qualquer negócio a quem tiver a key. Ver achado completo em
`GAPS-DE-INTEGRACAO.md` (🔴) e desenho da correção em
`architecture/BMAD-MULTIPLAYER-VPS.md` §4.1.

**Critérios de aceitação:**
- [ ] View `public.negocios_publico` só com colunas de fachada
      (`id, nome, segmento, quarteirao_id, lote, nivel, degrau_atual,
      perfil_publico, criado_em`), leitura pública
- [ ] Policy `negocios_leitura` (atual) substituída por uma restrita a
      `id = tenant_atual()` para `authenticated`
- [ ] Validado contra Postgres real (`supabase start && supabase db
      reset`) — provar que `anon` lê a view normalmente E não lê mais
      `xp`/`moeda_virtual`/atributos da tabela

**⚠️ Correção (revisão de 2026-07-28):** uma versão anterior deste card
pedia "migrar toda leitura pública para a view". **Removido — era
trabalho desnecessário:** `SupabaseRepository` só usa `supabaseAdmin()`
(service_role), que ignora RLS por definição, então nenhuma leitura do
app é afetada por essa policy. Este card é **só migration + verificação**,
sem mudança de código de aplicação, risco de regressão ≈ 0.

**Regras de segurança:** 🔴 este card é o que torna seguro ligar o
primeiro código Supabase no browser. Não pular, não adiar depois de
`GH-MULTI-02` estar pronto — a ordem é a proteção.

**Dados trafegados:** nenhum dado novo — só reorganiza quem lê o quê.

---

### GH-MULTI-01 — Provisionar VPS + Supabase reais

| Campo | Valor |
|---|---|
| Prioridade | P0 |
| Esforço | — |
| Depende de | `GH-MULTI-00` |

**Descrição:** Este card **é** `GH-OPS-01` + `GH-OPS-03` do Épico 9 —
referenciado aqui, não duplicado. Presença ao vivo não existe sem um
projeto Supabase real (Realtime não roda em `GAMEHUB_DB=file`). Ver
critérios completos nos cards originais.

---

### GH-MULTI-02 — Canal de presença real (Supabase Realtime Presence) 🟡 código feito

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P–M |
| Depende de | Código: nenhum. Ir ao ar: `GH-MULTI-00`, `GH-MULTI-01` |

**Descrição:** Implementa de verdade `features/world/presenca/canal.ts`
(antes só `declare function`, deliberadamente inerte). Estado atual e
decisões de design em
[`world/PLANO-PRESENCA-REALTIME.md`](world/PLANO-PRESENCA-REALTIME.md).

**Critérios de aceitação:**
- [x] `entrarNaSala(salaTenantId, eu, aoMudar)` conecta ao canal
      `sede:<tenantId>`, anuncia presença e devolve função de saída —
      **API mudou** para uma função só (era `assinarPresenca` +
      `publicarPresenca`): duas funções criariam canais diferentes, e
      `track()` num canal não-inscrito nunca chega a ninguém. Ver o
      plano para o raciocínio completo
- [x] Payload só carrega `{ tenantId, nome, entrouEm }` — nunca
      atributos/XP/moeda (mesma whitelist de `GH-GROW-01`/`GH-GROW-03`)
- [x] Degrada graciosamente (no-op, nunca lança) quando
      `NEXT_PUBLIC_SUPABASE_URL` não está configurado (`GAMEHUB_DB=file`)
- [x] Presença nunca é persistida — efêmera, mesma decisão já tomada para
      conquistas (`GH-GROW-03`) e posição do avatar (`GH-WORLD-05`)
- [x] 15 testes (9 puros + 6 com canal simulado): escopo do canal, `track`
      só após `SUBSCRIBED`, dedup por tenant, ordenação estável, no-op sem
      config, cleanup desinscreve
- [ ] **Verificação viva** — duas abas, dois tenants, uma vendo a outra.
      Bloqueada por Fase 0 + `GH-MULTI-00` + `GH-MULTI-01`. Enquanto isso
      não acontecer, o módulo está provado só contra canal simulado.

**Nota de segurança operacional:** nenhuma tela chama `entrarNaSala`
hoje — o módulo é inerte por construção até `GH-MULTI-03` ligá-lo. Isso é
proposital: garante que a anon key não vai parar no browser antes de
`GH-MULTI-00` estar aplicado.

**Regras de segurança:** canal escopado por tenant (`sede:<tenantId>`),
nunca um canal global "todo mundo online" — evita vazar padrão de uso
cruzando quem visita quem.

**Dados trafegados:** `tenantId` + `nome` do visitante, efêmero, nunca
persistido.

---

### GH-MULTI-03 — Integrar presença real no `VisitaScreen`

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | P |
| Depende de | `GH-MULTI-02` |

**Descrição:** `VisitaScreen.tsx` hoje mostra um avatar "visitante" só
cosmético/local. Este card soma presença REAL por cima — outros
visitantes de verdade aparecem como avatares adicionais, sem tocar em
`render/`/`engine/` (que continuam puros, sem rede).

**Critérios de aceitação:**
- [ ] Visitantes reais aparecem no `estadoCena.avatares` além do dono/equipe
- [ ] Ao sair da tela, presença é anunciada como encerrada (sem depender
      só do timeout do canal)
- [ ] Extensão futura para `WorldScreen.tsx` (o próprio dono vendo quem
      visita) é possível reusando o mesmo hook, mas **fora de escopo
      deste card** — visão, não compromisso.

**Regras de segurança:** nenhuma nova — herda a whitelist de `GH-MULTI-02`.

**Dados trafegados:** mesmos de `GH-MULTI-02`, só renderizados.

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
