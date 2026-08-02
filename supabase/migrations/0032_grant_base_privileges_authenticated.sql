-- GH-OPS-08 — Corrige bug crítico P0 (mais fundamental que o de `0031`):
-- nenhuma tabela real do jogo tinha GRANT de privilégio básico para
-- `anon`/`authenticated` — só a view `negocios_publico` (`0026`) tinha
-- (`grant select on public.negocios_publico to anon, authenticated`).
--
-- COMO FOI ACHADO: Fase 0 executada de ponta a ponta pela primeira vez
-- (`supabase start` local + as 32 migrations aplicadas em sequência contra
-- Postgres real + 2 tenants semeados + chamada real à API REST com JWT de
-- `authenticated`, ver `docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md`).
-- `select * from negocios` como `authenticated` devolvia
-- `permission denied for table negocios`, com o hint do próprio Postgres:
-- `GRANT SELECT ON public.negocios TO authenticated`.
--
-- POR QUE ISSO ACONTECE (RLS não é o primeiro portão): Postgres avalia
-- privilégio de tabela (`GRANT`) ANTES de row level security. RLS só
-- decide QUAIS LINHAS uma query já autorizada pode ver — nunca substitui o
-- `GRANT` de base. Toda policy `for select/insert/update/delete to
-- authenticated` escrita desde `0001` pressupunha (incorretamente) que
-- `create policy` sozinho já liberava o acesso.
--
-- IMPACTO REAL: qualquer código client-side usando `supabaseAnon()` (que é
-- exatamente o que `GH-MULTI-02/03` liga) falharia em TODA leitura/escrita
-- de tabela privada, não só nas que a policy pretendia bloquear. Nunca foi
-- pego antes pelo mesmo motivo do `0031`: `SupabaseRepository` usa
-- exclusivamente `supabaseAdmin()` (service_role, que ignora tanto GRANT
-- quanto RLS por padrão do Supabase).
--
-- CORREÇÃO: conceder exatamente o verbo que cada policy já autoriza — nunca
-- mais que isso (ex.: `negocios` não ganha INSERT/DELETE para
-- `authenticated`, porque cadastro/remoção continuam sendo só via RPC
-- `security definer` rodando como `service_role`). RLS continua sendo quem
-- decide QUAIS linhas, este GRANT só abre o portão de qual TABELA.

-- tabelas de leitura pública (mapa/diretório) — anon e authenticated
grant select on public.bairros                to anon, authenticated;
grant select on public.cidades                to anon, authenticated;
grant select on public.quarteiroes            to anon, authenticated;
grant select on public.eventos_globais        to anon, authenticated;
grant select on public.ofertas                to anon, authenticated;

-- leitura restrita ao próprio tenant (authenticated apenas)
grant select on public.alocacoes              to authenticated;
grant select on public.assinaturas            to authenticated;
grant select on public.capitulos_entregues    to authenticated;
grant select on public.convites_resgatados    to authenticated;
grant select on public.itens_mobilia_colocados to authenticated;
grant select on public.licoes_concluidas      to authenticated;
grant select on public.membros                to authenticated;
grant select on public.nos_desbloqueados      to authenticated;
grant select on public.parcerias_formadas     to authenticated;
grant select on public.progressao_eventos_log to authenticated;
grant select on public.progresso_eventos_globais to authenticated;
grant select on public.sedes                  to authenticated;
grant select on public.solicitacoes_contato   to authenticated;
grant select on public.solicitacoes_orcamento to authenticated;
grant select on public.trabalhos_aceitos      to authenticated;

-- negocios: leitura + atualização da própria linha (nunca insert/delete —
-- cadastro/remoção continuam exclusivos da RPC service_role)
grant select, update on public.negocios to authenticated;

-- onboardings: leitura + atualização do próprio (mesmo motivo de negocios)
grant select, update on public.onboardings to authenticated;

-- funcionarios_contratados: leitura + insert direto já é coberto por RPC
-- (`registrar_assinatura`/contratação), mas a policy de insert existe desde
-- `0003` — mantendo o mesmo verbo que a policy já autoriza
grant select, insert on public.funcionarios_contratados to authenticated;

-- ofertas: dono gerencia a própria vitrine (insert/update/delete), leitura
-- pública já coberta pelo grant conjunto acima
grant insert, update, delete on public.ofertas to authenticated;

-- Nota: `denuncias_conteudo` (`0029`) e `assinaturas`/`solicitacoes_*`
-- (escrita) permanecem SEM grant de insert/update/delete para
-- anon/authenticated de propósito — fila de moderação e escrita financeira
-- só entram via RPC `security definer` como `service_role`, nunca direto
-- do cliente. Não é uma omissão deste patch, é a mesma disciplina de
-- "escrita perigosa nunca é authenticated direto" já documentada em
-- `docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md` §1.

-- Validação obrigatória (feita nesta revisão, ver docs/architecture/
-- DBA-ARQUITETURA-ESCALA-2026.md): após este grant, tenant A autenticado lê
-- a própria linha de `negocios`/`membros`/`onboardings` e recebe ZERO
-- linhas ao tentar ler as do tenant B (RLS filtra, não erro de permissão) —
-- provado com dois usuários reais e JWT assinado contra Postgres real.

-- =============================================================================
-- Segunda causa raiz, achada rodando a suíte de seed contra este mesmo banco
-- (`SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts`, o passo 3-4 da
-- Fase 0): `service_role` também não tinha SELECT/INSERT/UPDATE/DELETE em
-- NENHUMA tabela real, apesar de `rolbypassrls = true`. `BYPASSRLS` só pula a
-- avaliação de policy — o `GRANT` de tabela continua sendo exigido antes
-- disso, para QUALQUER role, sem exceção nem para quem ignora RLS.
--
-- POR QUE NINGUÉM VIU ISSO ANTES: todas as 32 migrations aplicam limpo
-- (`pg-query-emscripten` só valida sintaxe) e todo teste anterior deste
-- projeto rodou em `GAMEHUB_DB=file` (zero Postgres envolvido). Esta é a
-- PRIMEIRA vez que `SupabaseRepository.local()` (leitura direta de
-- `quarteiroes`, sem passar por RPC) executou contra um Postgres real —
-- e falhou com `permission denied for table quarteiroes`, mesmo usando a
-- SERVICE ROLE KEY.
--
-- CAUSA RAIZ ENCONTRADA (`pg_default_acl`): o schema `public` deste projeto
-- tem `ALTER DEFAULT PRIVILEGES` diferentes por QUEM cria o objeto —
-- objetos criados por `supabase_admin` herdam privilégio amplo para os 4
-- roles; objetos criados por `postgres` (que é como o CLI aplica as
-- migrations, tanto local quanto — supõe-se, a confirmar no primeiro deploy
-- real — num projeto hospedado) herdam só
-- `Dxtm` (delete/truncate/references/trigger) para `anon`/`authenticated`/
-- `service_role`, nunca select/insert/update. Ou seja: **é o comportamento
-- documentado da plataforma, não um bug do Postgres** — só não é intuitivo,
-- e nenhuma migration anterior sabia que precisava compensar isso.
--
-- CORREÇÃO: `service_role` é o role de confiança do servidor (a chave nunca
-- sai do backend) e já ignora RLS por design — não há ganho de segurança em
-- restringir verbo por tabela para ele, ao contrário de `anon`/
-- `authenticated` acima. Concede-se tudo, de uma vez, nas tabelas que já
-- existem, e fixa-se `ALTER DEFAULT PRIVILEGES` para que toda migration
-- FUTURA (`0033` em diante) herde o grant automaticamente — ninguém precisa
-- lembrar de repetir isto de novo.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges for role postgres in schema public
  grant all privileges on tables to service_role;
alter default privileges for role postgres in schema public
  grant all privileges on sequences to service_role;

-- Validação obrigatória (feita nesta revisão): com este grant,
-- `SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts` contra
-- `GAMEHUB_DB=supabase` apontando para este Postgres local completa sem
-- erro de permissão — a leitura direta de `quarteiroes` (que falhava antes
-- deste patch) passa a funcionar como em modo `file`.
