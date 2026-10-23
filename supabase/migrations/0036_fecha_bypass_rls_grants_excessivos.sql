-- ============================================================================
-- GH-SEC-01 — Fecha bypass CRÍTICO de RLS achado em auditoria DBA
-- independente (2026-08-02), no mesmo incidente da correção do login
-- (`d1ae454`, `email_confirm`).
--
-- ACHADO (evidência ao vivo, `information_schema.role_table_grants`): esta
-- imagem (`supabase/postgres:17.6.1.136`) concede, por `ALTER DEFAULT
-- PRIVILEGES` de fábrica, INSERT/UPDATE/DELETE em TODA tabela/view do
-- schema `public` para `anon` E `authenticated` — mesmo em objetos criados
-- pelo role `postgres` (as migrations). `0033` documentou e testou o
-- OPOSTO (só `Dxtm`, sem escrita) contra `supabase start` local — o
-- comportamento diverge entre o CLI local e este self-host. A premissa da
-- `0033` (`grant select, update` explícito = "exatamente o verbo que a
-- policy autoriza") pressupunha que não havia mais nada concedido por
-- baixo; havia.
--
-- Por que isso ficou inerte até agora: em toda tabela BASE, RLS (FORCE
-- ROW LEVEL SECURITY, sem nenhuma policy permissiva de insert/update/
-- delete para anon/authenticated) nega por padrão mesmo com o GRANT
-- presente — então nenhuma tabela real era escrevível.
--
-- A EXCEÇÃO, e o motivo desta migration ser P0: `public.negocios_publico`
-- (`0026`) é uma view SEM `security_invoker`, dona é `postgres`
-- (`rolbypassrls = true`), e é "auto-updatable" (uma tabela só no FROM,
-- sem agregação) — então UPDATE/DELETE/INSERT na view não passam pela RLS
-- de `negocios` NUNCA, só pelo GRANT. Com o GRANT de fábrica presente,
-- QUALQUER PORTADOR DA ANON KEY (pública por design, extraível do bundle
-- do navegador) conseguia, direto pela API REST (Kong publicado em
-- `0.0.0.0:8010`), escrever `nivel`/`degrau_atual`/`nome`/etc. de QUALQUER
-- negócio, ou apagar o tenant inteiro (`DELETE` propagando por 20+ FKs
-- `ON DELETE CASCADE` — sede, mobília, funcionários, assinaturas,
-- progresso, o próprio `membros` do cliente). Pré-autenticação, exposto à
-- internet, com perda de dado irreversível sem backup. Isto ANULAVA a
-- `0035` inteira (que fechou o mesmo tipo de escrita só na tabela base).
--
-- Confirmado com `OPTIONS /rest/v1/negocios_publico` (PostgREST anuncia
-- `Allow: OPTIONS,GET,HEAD,POST,PUT,PATCH,DELETE`) antes desta migration.
--
-- FIX: revoga o excesso de fábrica em TODAS as tabelas/views de uma vez
-- (`ALL TABLES IN SCHEMA` também cobre views no Postgres — fecha a view E
-- as 25 tabelas no mesmo comando), depois reabre EXATAMENTE os dois casos
-- que `0033` já declarava como intencionais (`funcionarios_contratados`
-- insert, `ofertas` insert/update/delete — dono gerencia a própria
-- vitrine). `negocios`/`onboardings` NÃO são reabertos aqui — `0035` já
-- tinha revogado `update` deles de propósito e continua assim. E fixa
-- `ALTER DEFAULT PRIVILEGES` pros dois roles, pra nenhuma tabela/view
-- FUTURA repetir isto sem ninguém perceber.
-- ============================================================================

revoke insert, update, delete on all tables in schema public from anon, authenticated;

grant insert on public.funcionarios_contratados to authenticated;
grant insert, update, delete on public.ofertas to authenticated;

alter default privileges for role postgres in schema public
  revoke insert, update, delete on tables from anon, authenticated;

-- ----------------------------------------------------------------------------
-- GH-SEC-02 (baixo, mesma auditoria) — 3 tabelas tinham RLS habilitada mas
-- NÃO forçada, violando o padrão documentado em AGENTS.md ("RLS forçada").
-- Não era explorável (owner é `postgres`, que ignora FORCE por ter
-- BYPASSRLS de qualquer forma) — corrigido por consistência, pra uma
-- auditoria futura (`relrowsecurity=true and relforcerowsecurity=false`)
-- voltar sempre vazia.
-- ----------------------------------------------------------------------------

alter table public.bairros force row level security;
alter table public.cidades force row level security;
alter table public.quarteiroes force row level security;

-- ----------------------------------------------------------------------------
-- GH-SEC-03 (baixo, mesma auditoria) — 2 FKs sem índice. Preventivo para o
-- Épico 14 (100-1000 simultâneos): sem índice, DELETE de tenant e joins de
-- vizinhança viram seq scan.
-- ----------------------------------------------------------------------------

create index if not exists parcerias_formadas_vizinho_tenant_id_idx
  on public.parcerias_formadas (vizinho_tenant_id);

create index if not exists denuncias_conteudo_tenant_denunciante_id_idx
  on public.denuncias_conteudo (tenant_denunciante_id);
