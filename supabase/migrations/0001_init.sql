-- ============================================================================
-- labdatadev-gamehub — schema inicial multi-tenant
-- Tenant = negócio. Geografia é global; todo o resto é isolado por tenant_id.
-- Padrões aplicados: identificadores minúsculos, bigint identity, FK indexada,
-- RLS forçada com helper security definer em schema privado.
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. Geografia (global, compartilhada) — cidade > bairro > quarteirão > lote
-- ---------------------------------------------------------------------------

create table public.cidades (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  nome        text not null,
  prioritaria boolean not null default false,
  criado_em   timestamptz not null default now()
);

create table public.bairros (
  id        bigint generated always as identity primary key,
  cidade_id bigint not null references public.cidades (id) on delete cascade,
  slug      text not null,
  nome      text not null,
  criado_em timestamptz not null default now(),
  unique (cidade_id, slug)
);
create index bairros_cidade_id_idx on public.bairros (cidade_id);

create table public.quarteiroes (
  id        bigint generated always as identity primary key,
  bairro_id bigint not null references public.bairros (id) on delete cascade,
  numero    smallint not null check (numero > 0),
  criado_em timestamptz not null default now(),
  unique (bairro_id, numero)
);
create index quarteiroes_bairro_id_idx on public.quarteiroes (bairro_id);

-- ---------------------------------------------------------------------------
-- 2. Tenants
-- ---------------------------------------------------------------------------

create table public.negocios (
  id            bigint generated always as identity primary key,
  nome          text not null check (length(trim(nome)) > 0),
  segmento      text not null check (
                  segmento in ('imobiliaria','construtora','loteadora',
                               'comercio','servico','outro')),
  quarteirao_id bigint not null references public.quarteiroes (id),
  lote          smallint not null check (lote between 1 and 8),
  degrau_atual  smallint not null default 1 check (degrau_atual between 1 and 5),
  degrau_alvo   smallint not null default 1 check (degrau_alvo between 1 and 5),
  nivel         smallint not null default 1 check (nivel >= 1),
  xp            integer  not null default 0 check (xp >= 0),
  moeda_virtual integer  not null default 0 check (moeda_virtual >= 0),
  criado_em     timestamptz not null default now(),
  -- um negócio por lote: garante a integridade do mapa no banco
  unique (quarteirao_id, lote)
);
create index negocios_quarteirao_id_idx on public.negocios (quarteirao_id);

-- Liga o usuário do Supabase Auth ao seu tenant. Base de toda a RLS.
create table public.membros (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  tenant_id bigint not null references public.negocios (id) on delete cascade,
  nome      text not null,
  papel     text not null default 'dono' check (papel in ('dono','equipe')),
  criado_em timestamptz not null default now()
);
create index membros_tenant_id_idx on public.membros (tenant_id);

-- Respostas do onboarding — dado comercial sensível (budget, score). Privado.
create table public.onboardings (
  tenant_id             bigint primary key
                          references public.negocios (id) on delete cascade,
  respostas             jsonb not null,
  score_fit             smallint not null check (score_fit between 0 and 100),
  degrau_alvo           smallint not null check (degrau_alvo between 1 and 5),
  servicos_recomendados text[] not null default '{}',
  respondido_em         timestamptz not null default now()
);

-- Vitrine pública do negócio.
create table public.ofertas (
  id        bigint generated always as identity primary key,
  tenant_id bigint not null references public.negocios (id) on delete cascade,
  titulo    text not null check (length(trim(titulo)) > 0),
  descricao text not null default '',
  preco     text not null default '',
  criada_em timestamptz not null default now()
);
create index ofertas_tenant_id_idx on public.ofertas (tenant_id);

-- ---------------------------------------------------------------------------
-- 3. Helper de tenant (security definer, schema privado)
--    Evita recursão de RLS em `membros` e é chamado 1x por query via (select ...)
-- ---------------------------------------------------------------------------

create or replace function private.tenant_atual()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id
  from public.membros m
  where m.user_id = (select auth.uid());
$$;

revoke execute on function private.tenant_atual()
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.cidades      enable row level security;
alter table public.bairros      enable row level security;
alter table public.quarteiroes  enable row level security;
alter table public.negocios     enable row level security;
alter table public.membros      enable row level security;
alter table public.onboardings  enable row level security;
alter table public.ofertas      enable row level security;

-- força RLS inclusive para o dono da tabela
alter table public.negocios    force row level security;
alter table public.membros     force row level security;
alter table public.onboardings force row level security;
alter table public.ofertas     force row level security;

-- 4.1 Geografia: mapa é público (leitura). Escrita só via service_role/RPC.
create policy cidades_leitura on public.cidades
  for select to anon, authenticated using (true);
create policy bairros_leitura on public.bairros
  for select to anon, authenticated using (true);
create policy quarteiroes_leitura on public.quarteiroes
  for select to anon, authenticated using (true);

-- 4.2 Negócios: diretório regional é público por design (é a vitrine);
--     alteração só do próprio tenant.
create policy negocios_leitura on public.negocios
  for select to anon, authenticated using (true);

create policy negocios_atualiza_proprio on public.negocios
  for update to authenticated
  using (id = (select private.tenant_atual()))
  with check (id = (select private.tenant_atual()));

-- 4.3 Membros: só enxerga o próprio time.
create policy membros_do_tenant on public.membros
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- 4.4 Onboarding: estritamente privado (contém budget e score comercial).
create policy onboarding_proprio on public.onboardings
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create policy onboarding_atualiza_proprio on public.onboardings
  for update to authenticated
  using (tenant_id = (select private.tenant_atual()))
  with check (tenant_id = (select private.tenant_atual()));

-- 4.5 Ofertas: leitura pública (vitrine), escrita só do dono.
create policy ofertas_leitura on public.ofertas
  for select to anon, authenticated using (true);

create policy ofertas_insere_proprio on public.ofertas
  for insert to authenticated
  with check (tenant_id = (select private.tenant_atual()));

create policy ofertas_atualiza_proprio on public.ofertas
  for update to authenticated
  using (tenant_id = (select private.tenant_atual()))
  with check (tenant_id = (select private.tenant_atual()));

create policy ofertas_remove_proprio on public.ofertas
  for delete to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Nenhuma policy de INSERT em negocios/membros/onboardings:
-- o cadastro é feito server-side pela RPC abaixo (service_role).

-- ---------------------------------------------------------------------------
-- 5. Nível derivado do XP (fonte única). Idêntico a src/lib/gamificacao.ts:
--    limiar(n) = 50·(n-1)·n  →  n = floor((1 + sqrt(1 + xp/12.5)) / 2)
-- ---------------------------------------------------------------------------

create or replace function public.nivel_por_xp(p_xp integer)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select greatest(1, least(50,
    floor((1 + sqrt(1 + greatest(0, p_xp)::float / 12.5)) / 2)::int
  ))::smallint;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC de cadastro — aloca lote e cria o tenant atomicamente
--    Advisory lock por bairro serializa a corrida por lote entre cadastros
--    simultâneos; o unique (quarteirao_id, lote) é a rede de segurança.
-- ---------------------------------------------------------------------------

create or replace function public.criar_negocio_com_lote(
  p_cidade_slug  text,
  p_cidade_nome  text,
  p_bairro_nome  text,
  p_bairro_slug  text,
  p_nome         text,
  p_segmento     text,
  p_degrau_alvo  smallint,
  p_xp           integer,
  p_moeda        integer
)
returns setof public.negocios
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cidade_id     bigint;
  v_bairro_id     bigint;
  v_quarteirao_id bigint;
  v_numero        smallint;
  v_lote          smallint;
  v_negocio       public.negocios;
begin
  insert into public.cidades (slug, nome)
  values (p_cidade_slug, p_cidade_nome)
  on conflict (slug) do update set nome = excluded.nome
  returning id into v_cidade_id;

  insert into public.bairros (cidade_id, slug, nome)
  values (v_cidade_id, p_bairro_slug, p_bairro_nome)
  on conflict (cidade_id, slug) do update set nome = excluded.nome
  returning id into v_bairro_id;

  -- serializa a alocação dentro deste bairro até o fim da transação
  perform pg_advisory_xact_lock(hashtextextended('bairro:' || v_bairro_id, 0));

  -- primeiro (quarteirão, lote) livre do bairro
  select q.id, g.n
    into v_quarteirao_id, v_lote
  from public.quarteiroes q
  cross join generate_series(1, 8) as g(n)
  where q.bairro_id = v_bairro_id
    and not exists (
      select 1 from public.negocios ne
      where ne.quarteirao_id = q.id and ne.lote = g.n
    )
  order by q.numero, g.n
  limit 1;

  -- todos os quarteirões lotados (ou bairro novo) → abre o próximo
  if v_quarteirao_id is null then
    select coalesce(max(numero), 0) + 1 into v_numero
    from public.quarteiroes where bairro_id = v_bairro_id;

    insert into public.quarteiroes (bairro_id, numero)
    values (v_bairro_id, v_numero)
    returning id into v_quarteirao_id;

    v_lote := 1;
  end if;

  insert into public.negocios (
    nome, segmento, quarteirao_id, lote,
    degrau_atual, degrau_alvo, xp, nivel, moeda_virtual
  )
  values (
    p_nome, p_segmento, v_quarteirao_id, v_lote,
    1, p_degrau_alvo, p_xp, public.nivel_por_xp(p_xp), p_moeda
  )
  returning * into v_negocio;

  return next v_negocio;
end;
$$;

-- Cadastro é server-side: só o service_role pode chamar.
-- (revogar de PUBLIC também remove o direito herdado pelo service_role,
--  por isso o grant explícito logo abaixo.)
revoke execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer
) from public, anon, authenticated;

grant execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer
) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Vizinhos do quarteirão (evita N+1 no cliente: 1 round trip)
-- ---------------------------------------------------------------------------

create or replace function public.vizinhos_do_tenant(p_tenant_id bigint)
returns setof public.negocios
language sql
stable
set search_path = ''
as $$
  select vizinho.*
  from public.negocios eu
  join public.negocios vizinho
    on vizinho.quarteirao_id = eu.quarteirao_id
   and vizinho.id <> eu.id
  where eu.id = p_tenant_id
  order by vizinho.lote;
$$;
