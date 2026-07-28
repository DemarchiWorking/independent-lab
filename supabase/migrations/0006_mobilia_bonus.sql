-- ============================================================================
-- Liga o bônus de atributo da mobília (já existia como dado em
-- `ItemMobilia.bonus`, features/sede/catalogo.ts) à economia de atributos
-- real (0005_atributos.sql). Comprar um móvel agora eleva o eixo declarado,
-- na MESMA transação do débito + inserção — mesmo princípio de
-- aplicar_progresso: nunca uma segunda chamada separada.
--
-- Sem "remover móvel" hoje (só mover de slot) — o ganho é permanente na
-- compra, sem necessidade de reverter ao desfazer.
-- ============================================================================

drop function if exists public.comprar_mobilia(bigint, text, smallint, integer);

create or replace function public.comprar_mobilia(
  p_tenant_id  bigint,
  p_item_id    text,
  p_slot       smallint,
  p_custo      integer,
  p_tecnologia smallint default 0,
  p_processo   smallint default 0,
  p_presenca   smallint default 0,
  p_aquisicao  smallint default 0,
  p_capacidade smallint default 0
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
  set moeda_virtual = moeda_virtual - p_custo,
      tecnologia    = greatest(0, least(40, tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, processo + p_processo)),
      presenca      = greatest(0, least(40, presenca + p_presenca)),
      aquisicao     = greatest(0, least(40, aquisicao + p_aquisicao)),
      capacidade    = greatest(0, least(40, capacidade + p_capacidade))
  where id = p_tenant_id;

  return query
  insert into public.itens_mobilia_colocados (tenant_id, item_id, slot)
  values (p_tenant_id, p_item_id, p_slot)
  returning *;
end;
$$;

revoke execute on function public.comprar_mobilia(
  bigint, text, smallint, integer, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.comprar_mobilia(
  bigint, text, smallint, integer, smallint, smallint, smallint, smallint, smallint
) to service_role;
