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

### `Oferta` — persistência pronta há tempo, ainda sem produtor

`GameRepository.listarOfertas`/`criarOferta` existem desde antes desta
sessão, nos dois adapters, mas **nenhuma tela deixa o dono criar uma
oferta**. A página pública (`GH-GROW-01`, `/n/[slug]`) já é uma consumidora
real — mostra a lista (vazia até alguém publicar algo). Falta: uma tela em
`/painel` ou `/hub` onde o dono escreve título/descrição/preço.

### Contato do perfil público não tem inbox

`GH-GROW-01` persiste `solicitacoes_contato` (rate-limited, intermediado —
nunca expõe e-mail/telefone do dono) mas **não existe UI para o dono ler as
mensagens recebidas**. `repo.listarSolicitacoesContato(tenantId)` já existe
e funciona; falta só uma seção no painel.

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
