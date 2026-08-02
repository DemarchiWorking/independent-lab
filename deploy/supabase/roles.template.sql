-- Achado rodando este stack pela primeira vez de verdade (2026-08-01, ver
-- docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md): a imagem
-- `supabase/postgres` só define senha para os roles `postgres` e
-- `supabase_admin` no seu próprio `migrate.sh` (ver `ALTER USER
-- supabase_admin WITH PASSWORD` lá dentro) — os roles que PostgREST e
-- GoTrue usam para conectar (`authenticator`, `supabase_auth_admin`) ficam
-- SEM senha utilizável, e `rest`/`auth` falhavam com "password
-- authentication failed" mesmo com `POSTGRES_PASSWORD` correto no `.env`.
--
-- O setup oficial do Supabase self-hosted resolve isso montando um
-- `roles.sql` equivalente — este arquivo faz o mesmo, substituído por
-- `sed` no entrypoint do serviço `db` (mesma técnica já usada pelo `kong`
-- neste compose para `__ANON_KEY__`/`__SERVICE_ROLE_KEY__`), porque SQL de
-- init não faz substituição de variável de ambiente sozinho.
--
-- Só os dois roles que este stack REDUZIDO realmente usa para autenticar
-- via rede (`realtime` usa `supabase_admin`, que `migrate.sh` já cobre).
alter role authenticator with password '__POSTGRES_PASSWORD__';
alter role supabase_auth_admin with password '__POSTGRES_PASSWORD__';

-- O compose oficial do Supabase monta um `realtime.sql` próprio
-- (`./volumes/db/realtime.sql`) que cria este schema antes do container
-- `realtime` rodar suas próprias migrations Ecto — também cortado na
-- redução para 5 containers. Sem isto, `DB_AFTER_CONNECT_QUERY: SET
-- search_path TO _realtime` aponta pra um schema inexistente e o Ecto
-- falha com "no schema has been selected to create in" na primeira
-- migration (achado rodando pela 1ª vez de verdade, 2026-08-01).
create schema if not exists _realtime;
grant all on schema _realtime to supabase_admin;
