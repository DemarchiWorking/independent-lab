-- ============================================================================
-- Gamificação: progressão atômica. `nivel_por_xp` já vem do 0001.
-- ============================================================================

-- Incremento atômico (update ... set xp = xp + delta). Sem read-modify-write
-- no cliente → sem corrida. Recalcula nível e limita degrau a [1,5].
create or replace function public.aplicar_progresso(
  p_tenant_id bigint,
  p_xp        integer,
  p_moeda     integer,
  p_degraus   smallint
)
returns setof public.negocios
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.negocios n
  set xp            = greatest(0, n.xp + p_xp),
      moeda_virtual = greatest(0, n.moeda_virtual + p_moeda),
      degrau_atual  = greatest(1, least(5, n.degrau_atual + p_degraus)),
      nivel         = public.nivel_por_xp(greatest(0, n.xp + p_xp))
  where n.id = p_tenant_id
  returning n.*;
end;
$$;

revoke execute on function public.aplicar_progresso(bigint, integer, integer, smallint)
  from public, anon, authenticated;
grant execute on function public.aplicar_progresso(bigint, integer, integer, smallint)
  to service_role;
