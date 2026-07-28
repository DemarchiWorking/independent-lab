-- ============================================================================
-- evoluir_sede passa a dar XP (GH-WORLD-02 — gap fechado: evoluir a sede não
-- disparava nenhum evento de gamificação, ao contrário de todo outro evento
-- do catálogo). Assinatura muda (novo parâmetro p_xp) — exige `drop
-- function` da versão antiga, mesmo motivo já documentado em
-- 0012_atr_requisitos.sql para desbloquear_no: parâmetro novo cria
-- sobrecarga, não substitui a função existente.
-- ============================================================================

drop function if exists public.evoluir_sede(bigint, smallint, smallint, integer);

create or replace function public.evoluir_sede(
  p_tenant_id      bigint,
  p_nivel_esperado smallint,
  p_novo_nivel     smallint,
  p_custo          integer,
  p_xp             integer default 0
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
  set moeda_virtual = moeda_virtual - p_custo,
      xp            = xp + p_xp,
      nivel         = public.nivel_por_xp(xp + p_xp)
  where id = p_tenant_id;

  return query
  update public.sedes
  set nivel = p_novo_nivel, atualizada_em = now()
  where tenant_id = p_tenant_id
  returning *;
end;
$$;

revoke execute on function public.evoluir_sede(bigint, smallint, smallint, integer, integer)
  from public, anon, authenticated;
grant execute on function public.evoluir_sede(bigint, smallint, smallint, integer, integer)
  to service_role;
