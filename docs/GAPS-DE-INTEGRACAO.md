# Gaps de integração — registro vivo

> Criado em 2026-07-28, numa sessão de loop contínuo pelo backlog. Objetivo:
> um lugar ÚNICO para achados do tipo "duas partes do sistema não batem" ou
> "isso existe mas não está costurado a nada" — coisas que `git log`/código
> sozinho não deixam óbvias, e que ficariam espalhadas (ou perdidas) se só
> vivessem em comentário de código. Atualizar sempre que achar um novo, e
> **apagar a linha quando o gap for fechado** (não deixar isto virar
> cemitério de TODO — se resolveu, sai daqui e vira nota no card do
> `BACKLOG-PRODUTO.md` correspondente).

## 🔴 Alto — vale atenção antes do primeiro cadastro real

### ~~RLS de `negocios` expõe a linha inteira~~ → migration escrita (`GH-MULTI-00`)

> **Status 2026-07-29:** `supabase/migrations/0026_negocios_rls_fachada.sql`
> implementa a correção descrita abaixo (view `negocios_publico` + policy
> restrita ao próprio tenant). Sintaxe validada com `pg-query-emscripten`,
> junto com as 26 migrations em sequência. **Ainda não aplicada contra
> Postgres real** — a verificação de semântica de runtime é a Fase 0 e
> precisa de `supabase start` (Docker) na máquina do usuário.
>
> Passou a ser urgente porque `GH-MULTI-03` colocou `supabaseAnon()` no
> browser: o risco deixou de ser latente no momento em que
> `NEXT_PUBLIC_SUPABASE_URL` existir no ambiente.
>
> **Segundo vazamento achado ao escrever a migration, na mesma superfície:**
> `public.vizinhos_do_tenant(bigint)` é `security invoker` e
> `returns setof public.negocios`; o Postgres concede `execute` a `PUBLIC`
> por padrão. Ou seja, além da leitura direta da tabela, existia um caminho
> por RPC (`rpc/vizinhos_do_tenant`) que devolvia a linha completa de todos
> os vizinhos de qualquer quarteirão. Sendo invoker, a função herda a RLS
> nova e o caminho fecha junto — mas isso está documentado dentro da própria
> migration para ninguém "consertar" o retorno vazio relaxando a policy.

### RLS de `negocios` expõe a linha inteira, não só a fachada pública

`negocios_leitura` (`supabase/migrations/0001_init.sql`) é
`for select to anon, authenticated using (true)` — **sem seleção de
coluna**. Isso foi decidido de propósito para o mapa/diretório regional
("vitrine pública"), mas como `xp`, `moeda_virtual`, `tecnologia`,
`processo`, `presenca`, `aquisicao`, `capacidade` moram na MESMA tabela,
tecnicamente qualquer cliente com a **anon key** (que é pública por design —
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, embutida no bundle do browser) consegue ler
esses campos direto da API REST do Supabase, **ignorando toda a whitelist de
campos públicos que o app aplica em código** (`GH-GROW-01`).

**Por que não é um problema HOJE:** nada no app usa `supabaseAnon()` de
dentro do browser ainda — todo acesso a dados passa por
`SupabaseRepository`, que usa exclusivamente `supabaseAdmin()` (service
role) a partir do servidor. `src/features/world/presenca/canal.ts` já
documenta isso explicitamente ("não há `.channel()`... nada aqui é
importado por `VisitaScreen.tsx` ou qualquer outro código em produção").

**Por que é um risco latente real:** o próprio roadmap
(`world/EVOLUCAO-MOTOR-2026.md` §3.5/§10, `G4`) planeja usar Supabase
Realtime Presence a partir do BROWSER — o dia que isso for implementado,
`supabaseAnon()` passa a rodar no cliente, e a policy `negocios_leitura`
atual expõe `xp`/`moeda_virtual`/os 5 atributos de QUALQUER negócio para
QUALQUER visitante da internet, sem precisar nem estar logado.

**O que fazer quando chegar a hora (antes de `G4`, não depois):**
dividir em (a) uma **view** pública só com as colunas de fachada
(`nome`, `segmento`, `quarteirao_id`, `lote`, `nivel`, `degrau_atual`,
`perfil_publico`) com policy `using (true)`, e (b) manter a tabela real
`negocios` com policy restrita a `tenant_id = tenant_atual()` (RLS de
verdade, não só código de app). Toda leitura pública (mapa, `GH-GROW-01`)
passaria a consultar a VIEW, nunca a tabela.

## 🟡 Médio — funcional, mas com uma ponta solta

### Chamar `GameRepository` direto (sem passar pela Server Action) não aplica a recompensa completa

Achado ao escrever `src/scripts/seed-demo.test.ts` (`GH-PITCH-01`):
`repo.contratarFuncionario(tenantId, cargoId)` só registra a contratação —
o XP/moeda/degrau/atributo de `funcionario_ia_contratado` são aplicados
pela Server Action (`features/gamificacao/actions.ts::recompensar()`), não
pelo repositório. Isso é arquitetura correta (repositório = persistência
pura, regra de negócio fica na camada de cima) mas é uma pegadinha real
para qualquer script/seed futuro que chame o repositório diretamente sem
passar pelo dispatcher — o negócio fica com "equipe contratada" mas sem o
efeito colateral que o clique real sempre teria. O seed de demo resolve
isso replicando manualmente o efeito (`contratarComRecompensa()`); qualquer
novo script parecido precisa fazer o mesmo, ou os números ficam
inconsistentes com o que a UI real produziria.

**Mesmo tema em `desbloquearNo`/`formarParceria`/`concluirLicao`**: esses
sim já incluem a recompensa na própria chamada do repositório
(`xp`/`atributos` são parâmetros diretos) — a inconsistência é
especificamente do par `contratarFuncionario`/`aceitarTrabalho`, que ficou
"fino" porque historicamente sempre foi chamado através do dispatcher
genérico. Se um dia esses dois ganharem action dedicada (fora do
dispatcher, como os outros já têm), vale considerar mover o efeito de
XP/moeda pra dentro do repositório também, por consistência.

### `souAdmin()` sem auditoria, e `GH-GROW-05` é candidato natural pra resolver isso

`src/lib/admin.ts` é allowlist por env var **ou substring `"demarchi"`** no
e-mail, sem nenhum log de quem acessou o quê. Hoje o único painel admin
(`/admin/eventos`) tem baixo risco se abusado (só cria campanhas). O card
`GH-EVT-05` (P3, já no backlog) documenta a migração para roles reais via
Supabase Auth — mas ele só vira urgente de verdade quando `GH-GROW-05`
(painel de oportunidades, que expõe budget/onboarding de TODOS os tenants)
for aberto. Ver decisão de adiar `GH-GROW-05` no próprio card do backlog.

### `lerMapaView(escopo?)` existe no contrato mas está inerte

`GH-MAPA-01` adicionou um parâmetro opcional `escopo` a `lerMapaView()`
(repository + os 2 adapters), mas **nenhum chamador passa isso ainda** — de
propósito, documentado no próprio card: a única tela (`MapaScreen`) troca
cidade/bairro no client sem novo fetch, e ligar `escopo` ali quebraria essa
UX sem `GH-MAPA-02` (zoom por nível) pronto pra substituí-la. Não é código
morto — é um contrato esperando o consumidor certo.

## 🟢 Baixo — decisões de escopo documentadas, não bugs

Estes são adiamentos DELIBERADOS, cada um já registrado no card do backlog
correspondente — listados aqui só para achar tudo num lugar só:

| Gap | Card | Por quê foi adiado |
|---|---|---|
| Escolha alugar-vs-comprar na Sede é rótulo fixo, não decisão do jogador | `GH-WORLD-02` | Decisão de produto (muda modelo de progressão), não técnica |
| Benchmark com 200 negócios semeados não foi feito | `GH-MAPA-01` | Precisa de script de seed; dataset real hoje é pequeno demais pra medir de verdade |
| Motor de simulação ECS/tick não implementado | `GH-SIM-01` (novo) | Maior card do backlog inteiro; merece sessão dedicada |
| 3 módulos do app-drawer sem levantamento (equipe humana, finanças, rh-motivação) | `GH-EQP-03`/`GH-FIN-01`/`GH-RH-01` (novos, Épico 12) | Sem requisito funcional levantado — não inventar critério de aceitação |
| Painel de oportunidades (cross-tenant, dado sensível) | `GH-GROW-05` | Card de maior sensibilidade do backlog — não apressar |

## ✅ Resolvido nesta sessão (histórico, referência rápida)

- **Constraint `segmento` do Supabase desalinhada do tipo TS** — `negocios`
  ainda checava os segmentos antigos (`imobiliaria`/`construtora`/
  `loteadora`) depois do pivot de ICP (commit `1ddc7e2`); cadastro real em
  modo `supabase` quebraria para 5 dos 8 segmentos. Corrigido em
  `0016_segmento_icp.sql`.
- **`Oferta` sem produtor** — `features/ofertas/OfertasPainel.tsx` +
  `actions.ts` (`publicarOferta`), seção nova em `/painel`. Primeiro
  produtor de `Oferta` no app; a vitrine pública (`/n/[slug]`) já lê.
- **Contato do perfil público sem inbox** — seção "Mensagens recebidas" em
  `/painel`, lê `listarSolicitacoesContato` (já existia).
