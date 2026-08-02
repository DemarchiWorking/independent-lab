# DBA & Arquitetura — Banco de Dados para Escala e Produtização (2026-08-01)

> Papel: revisão de **Arquiteto + DBA sênior** sobre o schema real do
> gamehub, respondendo três perguntas do fundador: (1) o banco está pronto
> para escalar? (2) o que falta para produtizar o jogo (transformar em
> negócio cobrável)? (3) qual o plano de banco de dados daqui para frente?
>
> **Não é um redesenho do zero.** O schema existente já segue disciplina de
> nível produção (RLS forçada, funções atômicas, isolamento por tenant
> consistente — ver §1). Redesenhar do zero jogaria fora um ano de decisão
> correta só para "parecer novo". O trabalho de arquitetura aqui é: achar os
> buracos reais, fechá-los com o mesmo padrão já estabelecido, e documentar
> o que decidir mais tarde. Esta continua sendo a decisão certa — foi
> reafirmada, não revisitada, na segunda parte desta revisão (§1.1 abaixo).
>
> Migrations desta revisão: `0027_solicitacoes_orcamento.sql`,
> `0028_assinaturas.sql`, `0029_moderacao_conteudo.sql`,
> `0030_progressao_auditoria.sql` (parte 1, mesmo dia), mais
> `0031_fix_tenant_atual_execute.sql` e
> `0032_grant_base_privileges_authenticated.sql` (parte 2, mesmo dia — a
> Fase 0 finalmente executada, ver §1.1). Cards de backlog correspondentes:
> `GH-COM-01`, `GH-COM-02`, `GH-OPS-05`, `GH-OPS-06`, `GH-OPS-03` (fechado),
> `GH-OPS-08` (novo, ver §1.1) — ver `docs/BACKLOG-PRODUTO.md`.

---

## 1. Avaliação do schema atual (`0001`–`0026`)

### Pontos fortes (preservar, não mexer)

- **Modelo de tenant limpo e consistente**: `negocios.id` é a raiz de todo
  tenant; toda tabela privada carrega `tenant_id bigint references
  negocios(id) on delete cascade` — sem exceção, sem nome alternativo
  (`empresa_id`, etc.) em 20+ tabelas. Isso é raro de ver mantido por 26
  migrations sem desviar.
- **RLS forçada de verdade**: `enable row level security` + `force row
  level security` em toda tabela por tenant — a segunda cláusula garante
  que nem o owner da tabela escapa, prática que times seniores esquecem.
- **Escrita perigosa nunca é `authenticated` direto**: progressão de
  XP/moeda/atributo só muda via função `security definer` com `for update`
  (trava a linha, evita corrida em compra simultânea), sempre com
  `revoke ... from public, anon, authenticated` + `grant ... to
  service_role`. É o padrão certo para dinheiro (ainda que virtual).
- **Correção de bugs reais registrada como migration, não como patch
  silencioso** (`0016`, `0026`) — histórico honesto, dá para auditar
  decisão.
- **`0026` (hardening de RLS antes de multiplayer)** é exatamente o tipo de
  disciplina que evita vazamento de dado comercial sensível (xp/moeda são
  sinal de diagnóstico de negócio, não só pontuação de jogo).

### Riscos reais (por ordem de severidade)

**✅ P0 (era) — as migrations nunca rodaram contra um Postgres de
verdade.** Resolvido nesta revisão — ver §1.1 para o relato completo, com
os dois bugs reais que só apareceram ao rodar de fato (nenhum dos dois era
detectável por parser de sintaxe). O texto original desta seção (histórico,
mantido para contexto de por que isto era P0):

> Confirmado em `docs/architecture/BMAD-MULTIPLAYER-VPS.md` e
> `docs/ESTADO-DO-PROJETO.md`: até hoje, `GAMEHUB_DB=supabase` nunca foi
> testado em runtime — só existe validação por **parser de sintaxe** (SQL e
> PL/pgSQL), que pega erro de sintaxe mas **não pega erro de referência**
> (coluna que não existe, tipo incompatível, `unique` que colide, ordem de
> `drop`/`create` errada entre migrations). Isso significa que o schema
> real, hoje, **é uma hipótese não testada**, não um fato.

### 1.1 Fase 0 executada de verdade (2026-08-01) — de hipótese a fato

Rodada nesta revisão, na própria VPS (Docker já disponível): `supabase
init` + `supabase start` (stack local isolada, prefixo de container
`labdatadev-gamehub`, portas `54320`–`54329` — nunca toca no Supabase de
produção do Company HQ nem no do V4MOS, que continuaram rodando ao lado sem
interrupção). Resultado:

1. **As 32 migrations (`0001`–`0032`) aplicam limpo contra Postgres 17
   real**, do zero, via `supabase db reset`.
2. `SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts` — o fluxo
   mais integrador do repo (cadastro de 6 negócios, onboarding, sede
   evoluída, equipe de IA contratada, parceria formada, nó da árvore
   desbloqueado, lição concluída, oferta publicada, usuário de demo criado
   via GoTrue real) — **passa 100%** contra `GAMEHUB_DB=supabase` apontando
   para este Postgres. Nunca tinha rodado fora do modo `file`.
3. Isolamento testado com HTTP real (API REST do PostgREST local + JWT
   `authenticated` assinado com o `JWT_SECRET` do projeto, dois usuários
   reais em `auth.users`): tenant A lê a própria linha de
   `negocios`/`membros`/`onboardings`/`progressao_eventos_log`, recebe `[]`
   ao tentar ler as mesmas tabelas do tenant B, e um `UPDATE` forjado contra
   a linha do tenant B afeta **0 linhas** (não erro — RLS filtra
   silenciosamente, como desenhado). `anon` sem login lê a vitrine
   `negocios_publico` (sem `xp`/`moeda_virtual`) e recebe `permission
   denied` ao tentar ler `negocios` direto — nunca teve policy para `anon`
   nessa tabela, o que é o comportamento correto.

**Dois bugs P0 reais foram encontrados — nenhum visível por parsing
estático, os dois só existem quando o Postgres real avalia privilégio:**

- **`0031` (já existia, escrito numa sessão anterior no mesmo dia):**
  `private.tenant_atual()` tinha `execute` revogado de TODOS os roles, sem
  nenhum `grant` de volta — toda policy que a referencia quebrava com
  `permission denied for function`, não filtrava silenciosamente.
- **`0032` (novo, escrito e verificado nesta revisão):** achado mais
  fundamental — **nenhuma tabela real do schema tinha `GRANT`
  `select`/`insert`/`update`/`delete` para `anon`, `authenticated` OU
  `service_role`**, só a view `negocios_publico` (`0026`). Causa raiz:
  `ALTER DEFAULT PRIVILEGES` deste projeto Supabase concede privilégio
  amplo só a objetos criados pelo role `supabase_admin`; objetos criados
  pelo role `postgres` (que é como as migrations rodam, local e — supõe-se
  até o primeiro deploy real confirmar — em produção hospedada também)
  herdam só `delete/truncate/references/trigger`, nunca select/insert/
  update, para nenhum dos três roles. **Isto bloqueava não só
  multiplayer/`authenticated` — bloqueava o próprio backend do app**:
  `SupabaseRepository` usando `supabaseAdmin()` (service_role) falhava em
  toda leitura direta de tabela, porque `BYPASSRLS` (que `service_role`
  tem) só pula a avaliação de *policy*, nunca dispensa o `GRANT` de tabela
  que vem antes. Corrigido com grant explícito por tabela para
  `anon`/`authenticated` (mesmo verbo que cada policy já autorizava — nunca
  mais que isso) e grant amplo + `ALTER DEFAULT PRIVILEGES` para
  `service_role` (que já ignora RLS por design; não há defesa em
  restringir verbo para ele). Ver o comentário completo em
  `supabase/migrations/0032_grant_base_privileges_authenticated.sql`.

**Conclusão prática:** o modo `GAMEHUB_DB=supabase` **nunca teria
funcionado**, nem para o app rodando sozinho, até esta revisão — não só
para o multiplayer que dependia dele. Isso muda a leitura de
`docs/ESTADO-DO-PROJETO.md`/`PROXIMA-TAREFA.md` (que listavam "deploy real"
como próximo passo independente): deploy real teria falhado na primeira
query, e o erro (`permission denied for table`) não é óbvio de diagnosticar
sem saber que faltava este grant. **Rodar Fase 0 antes do primeiro deploy
real deixou de ser recomendação — é o motivo pelo qual o primeiro deploy
real não teria funcionado sem ela.**

**O que a Fase 0 NÃO cobriu (fica para quando houver Postgres hospedado de
verdade, não só local):** comportamento de rede/latência real, backup e
disaster recovery (§2 já recomendava reusar o cluster do Company HQ — ainda
não testado), e se o `ALTER DEFAULT PRIVILEGES` de um projeto Supabase
Cloud hospedado segue exatamente o mesmo padrão do CLI local (alta
probabilidade, já que o CLI usa a mesma imagem de Postgres, mas não é 100%
garantido até o primeiro deploy real confirmar).

**🟠 P1 — RLS protege hoje só contra acesso via REST/anon key, não contra
bug no código server-side.** `SupabaseRepository` usa exclusivamente
`supabaseAdmin()` (service_role, que ignora RLS por definição — documentado
no próprio arquivo). Isso é uma escolha correta para o modo atual
(zero client-side Supabase), mas significa que a RLS **não é hoje uma rede
de segurança ativa** — é a arquitetura para quando o multiplayer client-side
chegar (`GH-MULTI-01..03`). Registrar isso não é um bug a corrigir agora; é
um risco a não esquecer: se qualquer feature futura vazar `tenant_id`
errado numa Server Action, a RLS não pega, porque quem lê é sempre
service_role.

**🟠 P1 — zero rastro de auditoria em progressão até esta revisão.**
Antes de `0030`, não havia como responder "por que este negócio tem 40.000
🪙" sem reconstruir manualmente por 9 tabelas. Fechado nesta revisão via
ledger (ver §3).

**🟡 P2 — conteúdo público sem moderação.** `ofertas` (leitura pública desde
`0001`) e a vitrine `negocios_publico` (`0026`) expõem texto livre de
qualquer tenant a qualquer visitante, sem mecanismo de denúncia/ocultação.
Aceitável em modo demo fechado; vira risco real assim que o mapa for
divulgado (pitch Sebrae, redes sociais) — que é o próximo passo natural do
produto. Fechado nesta revisão via `0029`.

**🟡 P2 — nenhuma tabela sustenta o modelo de receita real.** O produto
central documentado (`PRODUTO-IA-FUNCIONARIOS.md`) é **assinatura mensal em
R$** — mas o banco só modela a contratação DENTRO do jogo (moeda virtual,
`funcionarios_contratados`). Não existe onde registrar "este tenant pediu
orçamento" nem "esta assinatura está ativa/inadimplente". Fechado
parcialmente nesta revisão via `0027`/`0028` (ver §4 para o que ainda falta
— gateway de pagamento real).

**🟢 P3 — leituras agregadas (`mapa_resumo`, `bairro_resumo`,
`benchmark_bairro`, `destaque_bairro`) são calculadas ao vivo a cada
chamada**, sem cache/materialização. Não é um problema na escala atual
(dezenas/centenas de negócios por bairro) — é um problema em **milhares**
de negócios por bairro. Ver §5 para o gatilho de quando materializar.

---

## 2. Decisão de infraestrutura — onde este banco deve rodar

A VPS (`labd.cloud`) já roda um Supabase self-hosted completo em
`/opt/company/supabase/` (Company HQ) e o V4MOS roda seu próprio Supabase
dedicado. **Recomendação: NÃO subir um terceiro Postgres.** Em vez disso:

- Provisionar o gamehub como **um schema adicional dentro do cluster
  Postgres já existente** (ex.: `create schema gamehub_public` ao lado de
  `public`, ou um projeto Supabase separado apontando para o mesmo Postgres
  físico, se o self-host permitir múltiplos projetos) — reaproveita
  conexão, backup, monitoramento e pooler (pgbouncer) já operados para
  Company HQ.
- Isso também resolve, de graça, um problema que apareceria mais cedo ou
  mais tarde: **backup e disaster recovery testados uma vez, para um
  cluster só**, em vez de 3 rotinas de backup diferentes para 3 Postgres
  (Company HQ, V4MOS, gamehub) na mesma VPS pequena.
- Trade-off honesto: um incidente no Postgres compartilhado afeta os 3
  produtos ao mesmo tempo. Para o estágio atual (MVP/pitch, não produção
  crítica 24/7), esse risco é aceitável frente ao ganho operacional. Revisar
  esta decisão quando o gamehub tiver clientes pagantes reais (pós-`GH-COM-02`
  com gateway ligado) — nesse ponto, isolamento de blast radius passa a
  valer o custo operacional extra.
- Continua valendo a decisão já registrada em memória do projeto: **nunca
  seguir `deploy/vps-setup.sh` literalmente** (ele assume VPS dedicada,
  portas 80/443 do sistema, nomes de container genéricos) — adaptar para
  Nginx próprio em porta livre, igual ao padrão já usado por
  `v4mos-nginx`/`labdatadev-nginx`.

---

## 3. O que esta revisão adicionou (migrations `0027`–`0030`)

| Migration | Card | O que resolve |
|---|---|---|
| `0027_solicitacoes_orcamento.sql` | `GH-COM-01` | Fluxo "pedir orçamento" (documentado desde 2026-07-26 em `PRODUTO-IA-FUNCIONARIOS.md` §7, nunca implementado) — status `orcamento→aceito→entrega→concluido→cancelado`, painel admin trabalha a partir daqui. |
| `0028_assinaturas.sql` | `GH-COM-02` | Estado de assinatura real (R$, em centavos) 1:1 com `funcionarios_contratados` — pendente/ativa/inadimplente/cancelada, com campos `stripe_*` prontos e vazios até o gateway ser ligado. **Não processa pagamento** — só estado. |
| `0029_moderacao_conteudo.sql` | `GH-OPS-05` | Flag `moderado_oculto` em `ofertas` + fila `denuncias_conteudo` — pré-requisito de bom senso antes de divulgar o mapa publicamente. |
| `0030_progressao_auditoria.sql` | `GH-OPS-06` | Ledger append-only de toda mudança de xp/moeda/atributo em `negocios`, via trigger — não exige tocar nenhuma das 11 funções existentes. |

Todas seguem exatamente as convenções já estabelecidas: `bigint generated
always as identity`, RLS forçada, funções `security definer` com
`set search_path = ''`, comentário explicando o "porquê" antes do "o quê".
Sintaxe validada com o parser real do Postgres (`pg-query-emscripten`,
mesma técnica já documentada em `AGENTS.md`) — **isto valida sintaxe, não
substitui o Phase 0 do §1** (aplicar de verdade e testar isolamento).

---

## 4. O que falta para produtizar de verdade (virar negócio cobrável)

Em ordem de dependência real:

1. **Rodar o Phase 0 (§1)** — sem isso, nada abaixo tem chão.
2. **Ligar um gateway de pagamento real** a `assinaturas` (Stripe é a
   opção natural — já existe skill `/stripe` disponível neste ambiente).
   `0028` deixou os campos `stripe_customer_id`/`stripe_subscription_id`
   prontos para isso; falta o webhook handler (`atualizar_status_assinatura`
   já existe para ele chamar) e o checkout. **Antes disso, nenhuma cobrança
   real deve sair do papel** — regra já registrada em
   `PRODUTO-IA-FUNCIONARIOS.md` §7, mantida aqui.
3. **Painel admin para a fila de orçamento e moderação** — `0027`/`0029`
   dão a tabela; falta a tela (`/admin/orcamentos`, `/admin/moderacao`,
   mesmo padrão de `/admin/eventos` que já existe e é gated por
   `GAMEHUB_ADMIN_EMAILS`).
4. **Ponte de lead-gen com o CRM do labdatadev-site** (insight
   estratégico, não técnico): o onboarding de 10 perguntas já captura sinal
   BANT-like (segmento, gargalo, objetivo, investimento) de todo negócio
   cadastrado. Isso é, hoje, um funil de leads qualificados para a
   consultoria REAL do Laboratório Demarchi que não está conectado ao CRM
   que já existe no projeto `labdatadev-site`. Não requer tabela nova —
   requer decidir um mecanismo de exportação (view, export periódico, ou
   webhook em `criar_negocio_com_lote`) e é provavelmente o maior alavancador
   de receita de curto prazo, porque reaproveita dado que já existe. Vale
   discussão de produto antes de virar código.
5. **Conteúdo do jogo ainda é 100% código, não dado** — cargos, jobs, nós
   da árvore, mobília, lições, capítulos de história vivem em
   `features/*/catalogo.ts` (decisão arquitetural deliberada, documentada em
   `AGENTS.md` regra 3). Isso é **correto para o estágio atual** (poucas
   pessoas mexendo, deploy rápido) — mas é um limitador se o objetivo virar
   "adicionar conteúdo sem precisar de deploy" (ex.: Antonio querendo lançar
   uma campanha nova sem chamar um agente de IA para editar código). Não
   recomendo mover isso para o banco agora — é troca de uma arquitetura
   testada por uma incerta, sem pressão de negócio que justifique hoje.
   Revisitar quando o volume de conteúdo ou a necessidade de edição
   não-técnica justificar o custo.

---

## 5. Plano de escala — o que fazer e QUANDO (evitar over-engineering)

| Gatilho | Ação recomendada |
|---|---|
| ~~**Agora** — Rodar Fase 0~~ | ✅ Feito nesta revisão (§1.1). Próximo gatilho real é o primeiro deploy contra um Postgres hospedado (não só local), para confirmar que o `ALTER DEFAULT PRIVILEGES` observado localmente se repete lá. |
| **Antes de divulgar o mapa publicamente** | `0029` já aplicado + painel de moderação (item 3 do §4). |
| **Antes do primeiro cliente pagante real** | Gateway de pagamento ligado a `0028` (item 2 do §4) + decisão de isolamento de infra revisitada (§2). |
| **`progressao_eventos_log` passando de ~5-10 milhões de linhas** | Converter para `partition by range (criado_em)` mensal — criar a tabela particionada nova, copiar dado, trocar nome, mesmo padrão de qualquer migração de partição Postgres. Não fazer antes disso: é complexidade real por um problema que ainda não existe. |
| **Contagem de negócios por bairro passando de ~1.000-5.000** | Trocar `mapa_resumo`/`bairro_resumo`/`benchmark_bairro`/`destaque_bairro` de função `stable` (calculada ao vivo) para **materialized view** com `refresh` agendado (ex.: a cada 5-15 min via cron/n8n, que já existe na VPS) — mesma lógica, só troca de "calcular toda vez" para "calcular periodicamente e servir cache". Índices já existem nas tabelas-base; a mudança é só na camada de leitura. |
| **Mais de 1 região/país com fuso horário diferente** | Hoje `agoraGlobal()` (relógio de história) assume um relógio único — revisitar antes de expandir geografia para fora do Vale do Café/Brasil. |
| **Necessidade real de non-technical content ops** | Só então mover catálogos de `features/*/catalogo.ts` para tabelas (item 5 do §4) — com versionamento e audit log, não como tabela solta. |

---

## 6. Resumo executivo (para o pitch/decisão rápida)

1. **O banco já é bom.** Não precisa nem deveria ser redesenhado do zero —
   confirmado, não só suposto: 32 migrations rodaram contra Postgres real,
   com o fluxo de negócio mais integrador do app passando 100%.
2. **O maior risco não era de arquitetura, era de verificação — e agora
   está fechado.** Rodar Fase 0 achou 2 bugs P0 reais (execute de função e,
   mais grave, `GRANT` de tabela ausente para todo role incluindo
   `service_role`) que nenhum parser de sintaxe pegaria e que teriam
   quebrado o primeiro deploy real na primeira query. Ambos corrigidos
   (`0031`, `0032`) e reverificados — ver §1.1.
3. **Para produtizar de verdade** (cobrar de cliente real), falta: gateway
   de pagamento (schema já pronto em `0028`), painel admin para orçamento e
   moderação (schema já pronto em `0027`/`0029`), e uma decisão de produto
   sobre a ponte onboarding→CRM real (maior alavancagem, menor esforço
   técnico). Ver `docs/PRODUTIZACAO-PUNCH-LIST.md` para a versão acionável,
   com ordem de execução.
4. **Nada precisa de partição, cache ou re-arquitetura hoje** — os
   gatilhos de quando fazer isso estão no §5, para não construir
   complexidade que o volume atual não pede.
5. **Próximo passo real de infraestrutura:** o primeiro deploy contra um
   Postgres hospedado de verdade (não só local) — para confirmar que a
   causa raiz do bug do `0032` (`ALTER DEFAULT PRIVILEGES` por role que
   cria o objeto) se comporta igual fora do ambiente local do CLI.
