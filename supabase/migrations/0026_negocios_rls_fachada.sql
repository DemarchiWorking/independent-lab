-- GH-MULTI-00 — Endurecimento da RLS de `negocios`.
--
-- POR QUE AGORA: até `GH-MULTI-03`, a chave `anon` do Supabase nunca havia
-- rodado num browser — `SupabaseRepository` usa exclusivamente
-- `supabaseAdmin()` (service_role), que ignora RLS por definição, e o único
-- outro uso de `supabaseAnon()` era `signInWithPassword`, que não lê
-- `negocios`. A presença ao vivo mudou isso: a partir do momento em que
-- `NEXT_PUBLIC_SUPABASE_URL` existe, a anon key é extraível do bundle e a
-- API REST do Supabase passa a ser alcançável POR FORA do app.
--
-- O QUE ESTAVA EXPOSTO: a policy `negocios_leitura` (0001_init.sql) é
-- `for select to anon, authenticated using (true)` — sem recorte de coluna.
-- Ou seja, qualquer pessoa com a anon key podia ler a linha INTEIRA de
-- qualquer negócio: `xp`, `moeda_virtual`, os 4 atributos
-- (`tecnologia`/`processo`/`presenca`/`aquisicao`), `degrau_alvo` e as
-- marcas de consentimento. Nada disso é vitrine — é diagnóstico comercial.
--
-- ESTA MIGRATION NÃO MUDA NENHUMA LINHA DE CÓDIGO DA APLICAÇÃO. Todas as
-- leituras do app são service_role e continuam idênticas; o risco de
-- regressão é ≈ 0. Ver `docs/architecture/BMAD-MULTIPLAYER-VPS.md` §4.1.

-- 1. View de fachada: SÓ as colunas que já são públicas por design (as
--    mesmas que o mapa e `/n/[slug]` mostram para qualquer visitante).
--    O `where` respeita o opt-out de LGPD introduzido em 0018.
create view public.negocios_publico as
select id,
       nome,
       segmento,
       quarteirao_id,
       lote,
       nivel,
       degrau_atual,
       perfil_publico,
       criado_em
from public.negocios
where perfil_publico = true;

-- ⚠️ NÃO marque esta view como `security_invoker = true`.
--
-- Parece endurecimento e é o oposto: com `security_invoker`, a view passa a
-- avaliar a RLS de `negocios` sob o papel de quem consulta. Como a policy
-- abaixo restringe a leitura ao próprio tenant, um `anon` consultando a
-- view receberia ZERO linhas — a vitrine pública sumiria em silêncio, sem
-- erro nenhum, e o mapa ficaria vazio para quem não está logado. É
-- justamente por rodar com os privilégios do dono da view que ela consegue
-- ser a única janela controlada para a tabela restrita.
grant select on public.negocios_publico to anon, authenticated;

-- 2. Fecha a tabela real. `anon` deixa de ter qualquer policy de select:
--    com `force row level security` (0001_init.sql) e nenhuma policy que
--    lhe sirva, a leitura direta devolve zero linhas.
drop policy if exists negocios_leitura on public.negocios;

create policy negocios_leitura_propria on public.negocios
  for select to authenticated
  using (id = (select private.tenant_atual()));

-- 3. EFEITO COLATERAL DESEJADO, que precisa estar escrito para ninguém
--    "consertar" isto depois por engano:
--
--    `public.vizinhos_do_tenant(bigint)` (0001_init.sql) é
--    `security invoker` e `returns setof public.negocios`. O Postgres
--    concede `execute` a PUBLIC por padrão, então HOJE qualquer portador da
--    anon key pode chamar `rpc/vizinhos_do_tenant` e receber a linha
--    COMPLETA de todos os vizinhos de qualquer quarteirão — o mesmo dado
--    que a policy larga já expunha, por um segundo caminho.
--
--    Sendo invoker, a função herda a RLS de quem chama. Com a policy nova,
--    um `authenticated` passa a ver só a própria linha; como a função faz
--    `join ... where vizinho.id <> eu.id`, o retorno vira vazio. Isso é
--    correto: a lista de vizinhos para consumo do cliente deve sair de
--    `negocios_publico`, não de uma RPC que devolve a tabela inteira.
--
--    O app NÃO é afetado: `SupabaseRepository` chama tudo com
--    `supabaseAdmin()` (service_role), que ignora RLS por definição. Se um
--    dia uma tela client-side precisar dos vizinhos, ela deve consultar a
--    view — não relaxar esta policy nem marcar a função como definer.

comment on view public.negocios_publico is
  'Fachada pública de negocios (GH-MULTI-00): apenas colunas de vitrine, '
  'apenas de quem não fez opt-out. A tabela negocios em si só é legível '
  'pelo próprio tenant. Não marcar como security_invoker.';
