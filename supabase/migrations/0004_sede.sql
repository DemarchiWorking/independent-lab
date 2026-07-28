-- ============================================================================
-- Sede / World: escritório do tenant, comprável/evoluível, mobiliável.
-- Ver docs/world/ARQUITETURA-WORLD.md.
--
-- Padrão: RLS forçada (privado ao tenant — decisão em MAPA-MUNDI-VALE-DO-CAFE
-- §2, "comece privado"), RPCs atômicas com `for update` (mesmo padrão de
-- aplicar_progresso em 0002 e criar_negocio_com_lote em 0001).
-- ============================================================================

create table public.sedes (
  tenant_id     bigint primary key references public.negocios (id) on delete cascade,
  nivel         smallint not null default 1 check (nivel >= 1),
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create table public.itens_mobilia_colocados (
  id          bigint generated always as identity primary key,
  tenant_id   bigint not null references public.negocios (id) on delete cascade,
  -- referencia o catálogo estático em features/sede/catalogo.ts (não é FK —
  -- mesmo padrão de cargo_id em funcionarios_contratados)
  item_id     text not null,
  slot        smallint not null check (slot >= 0),
  colocado_em timestamptz not null default now(),
  unique (tenant_id, slot)
);
create index itens_mobilia_colocados_tenant_id_idx
  on public.itens_mobilia_colocados (tenant_id);

alter table public.sedes enable row level security;
alter table public.sedes force row level security;
alter table public.itens_mobilia_colocados enable row level security;
alter table public.itens_mobilia_colocados force row level security;

-- Privado ao tenant (mesmo critério de onboardings) — leitura pública da
-- fachada da sede fica para quando a visita a vizinhos for implementada
-- (GH-WORLD-06 no backlog).
create policy sedes_leitura_propria on public.sedes
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create policy mobilia_leitura_propria on public.itens_mobilia_colocados
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Sem policy de insert/update: escrita só via RPC (service_role), que impõe
-- as regras de saldo/concorrência abaixo.

-- ---------------------------------------------------------------------------
-- evoluir_sede — atômica: garante a linha, trava a linha (for update),
-- confere nível esperado (evita corrida de duplo-clique) e saldo, debita e
-- sobe o nível numa só transação.
-- ---------------------------------------------------------------------------
create or replace function public.evoluir_sede(
  p_tenant_id      bigint,
  p_nivel_esperado smallint,
  p_novo_nivel     smallint,
  p_custo          integer
)
returns setof public.sedes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda       integer;
  v_nivel_atual smallint;
begin
  insert into public.sedes (tenant_id, nivel)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do nothing;

  select moeda_virtual into v_moeda
  from public.negocios where id = p_tenant_id
  for update;
  if v_moeda is null then
    raise exception 'negocio_nao_encontrado';
  end if;

  select nivel into v_nivel_atual
  from public.sedes where tenant_id = p_tenant_id
  for update;
  if v_nivel_atual is distinct from p_nivel_esperado then
    raise exception 'nivel_desatualizado';
  end if;
  if v_moeda < p_custo then
    raise exception 'saldo_insuficiente';
  end if;

  update public.negocios
  set moeda_virtual = moeda_virtual - p_custo
  where id = p_tenant_id;

  return query
  update public.sedes
  set nivel = p_novo_nivel, atualizada_em = now()
  where tenant_id = p_tenant_id
  returning *;
end;
$$;

-- ---------------------------------------------------------------------------
-- comprar_mobilia — atômica: confere saldo e debita antes de inserir; o
-- `exists` de slot é só uma mensagem de erro amigável — a garantia real é o
-- `unique(tenant_id, slot)`, que rejeita a segunda inserção concorrente.
-- ---------------------------------------------------------------------------
create or replace function public.comprar_mobilia(
  p_tenant_id bigint,
  p_item_id   text,
  p_slot      smallint,
  p_custo     integer
)
returns setof public.itens_mobilia_colocados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda integer;
begin
  if exists (
    select 1 from public.itens_mobilia_colocados
    where tenant_id = p_tenant_id and slot = p_slot
  ) then
    raise exception 'slot_ocupado';
  end if;

  select moeda_virtual into v_moeda
  from public.negocios where id = p_tenant_id
  for update;
  if v_moeda is null then
    raise exception 'negocio_nao_encontrado';
  end if;
  if v_moeda < p_custo then
    raise exception 'saldo_insuficiente';
  end if;

  update public.negocios
  set moeda_virtual = moeda_virtual - p_custo
  where id = p_tenant_id;

  return query
  insert into public.itens_mobilia_colocados (tenant_id, item_id, slot)
  values (p_tenant_id, p_item_id, p_slot)
  returning *;
end;
$$;

-- ---------------------------------------------------------------------------
-- mover_mobilia — sem custo; reposiciona um item já comprado. `unique` na
-- tabela é a garantia final contra corrida de dois móveis pro mesmo slot.
-- ---------------------------------------------------------------------------
create or replace function public.mover_mobilia(
  p_tenant_id         bigint,
  p_item_colocado_id  bigint,
  p_novo_slot         smallint
)
returns setof public.itens_mobilia_colocados
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.itens_mobilia_colocados
    where tenant_id = p_tenant_id
      and slot = p_novo_slot
      and id <> p_item_colocado_id
  ) then
    raise exception 'slot_ocupado';
  end if;

  return query
  update public.itens_mobilia_colocados
  set slot = p_novo_slot
  where id = p_item_colocado_id and tenant_id = p_tenant_id
  returning *;
end;
$$;

revoke execute on function public.evoluir_sede(bigint, smallint, smallint, integer)
  from public, anon, authenticated;
grant execute on function public.evoluir_sede(bigint, smallint, smallint, integer)
  to service_role;

revoke execute on function public.comprar_mobilia(bigint, text, smallint, integer)
  from public, anon, authenticated;
grant execute on function public.comprar_mobilia(bigint, text, smallint, integer)
  to service_role;

revoke execute on function public.mover_mobilia(bigint, bigint, smallint)
  from public, anon, authenticated;
grant execute on function public.mover_mobilia(bigint, bigint, smallint)
  to service_role;
