-- ============================================================================
-- Upgrade de equipamento da sede (GH-WORLD-07) — cada móvel comprado pode
-- ser evoluído até o nível 3, e cada nível aplica de novo o bônus de
-- atributo do item (bônus total = bônus base × nível).
--
-- Mesmo padrão atômico de `comprar_mobilia` (0004) + `0006_mobilia_bonus`:
-- débito de moeda E ganho de atributo na MESMA transação, com clamp em
-- [0, 40] espelhando `somarAtributo` de `lib/atributos.ts` (a regra de
-- clamp vive nos dois lugares de propósito — SQL não importa TS).
-- ============================================================================

alter table public.itens_mobilia_colocados
  add column nivel smallint not null default 1 check (nivel between 1 and 3);

create or replace function public.evoluir_mobilia(
  p_tenant_id        bigint,
  p_item_colocado_id bigint,
  p_novo_nivel       smallint,
  p_custo            integer,
  p_tecnologia       smallint default 0,
  p_processo         smallint default 0,
  p_presenca         smallint default 0
)
returns setof public.itens_mobilia_colocados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda       integer;
  v_nivel_atual smallint;
begin
  -- o item tem que ser DESTE tenant (mesma guarda de evoluir_funcionario)
  select nivel into v_nivel_atual
  from public.itens_mobilia_colocados
  where id = p_item_colocado_id and tenant_id = p_tenant_id
  for update;

  if v_nivel_atual is null then
    raise exception 'item_nao_encontrado';
  end if;

  if p_novo_nivel <> v_nivel_atual + 1 then
    raise exception 'nivel_invalido';
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

  -- débito + bônus do nível novo, na mesma transação
  update public.negocios
  set moeda_virtual = moeda_virtual - p_custo,
      tecnologia    = greatest(0, least(40, tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, processo + p_processo)),
      presenca      = greatest(0, least(40, presenca + p_presenca))
  where id = p_tenant_id;

  return query
  update public.itens_mobilia_colocados
  set nivel = p_novo_nivel
  where id = p_item_colocado_id and tenant_id = p_tenant_id
  returning *;
end;
$$;

revoke execute on function public.evoluir_mobilia(
  bigint, bigint, smallint, integer, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.evoluir_mobilia(
  bigint, bigint, smallint, integer, smallint, smallint, smallint
) to service_role;
