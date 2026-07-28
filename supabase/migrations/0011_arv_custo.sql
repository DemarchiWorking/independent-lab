-- ============================================================================
-- Custo variável de desbloqueio por nó (GH-ARV-01) — cada nó da árvore de
-- parcerias passa a ter um custo em moeda virtual, descontado atomicamente
-- ao desbloquear (nunca deixa saldo negativo).
--
-- Isto substitui o INSERT direto de 0009_parcerias_nos.sql por uma RPC —
-- agora que há dinheiro envolvido, o padrão correto é o mesmo de
-- comprar_mobilia (0004): o `exists` é só mensagem de erro amigável — a
-- garantia real continua sendo o `unique(tenant_id, no_id)` já existente; o
-- saldo é travado com `for update` na MESMA transação do débito, para dois
-- desbloqueios concorrentes não gastarem a mesma moeda duas vezes.
-- ============================================================================

-- a escrita agora só acontece via RPC (service_role) — mesmo padrão de
-- itens_mobilia_colocados (0004), que nunca teve policy de insert
drop policy if exists nos_insere_propria on public.nos_desbloqueados;

create or replace function public.desbloquear_no(
  p_tenant_id  bigint,
  p_no_id      text,
  p_custo      integer,
  p_xp         integer,
  p_tecnologia smallint default 0,
  p_processo   smallint default 0,
  p_presenca   smallint default 0,
  p_aquisicao  smallint default 0,
  p_capacidade smallint default 0
)
returns setof public.nos_desbloqueados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda integer;
begin
  if exists (
    select 1 from public.nos_desbloqueados
    where tenant_id = p_tenant_id and no_id = p_no_id
  ) then
    raise exception 'no_ja_desbloqueado';
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
      xp            = xp + p_xp,
      nivel         = public.nivel_por_xp(xp + p_xp),
      tecnologia    = greatest(0, least(40, tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, processo + p_processo)),
      presenca      = greatest(0, least(40, presenca + p_presenca)),
      aquisicao     = greatest(0, least(40, aquisicao + p_aquisicao)),
      capacidade    = greatest(0, least(40, capacidade + p_capacidade))
  where id = p_tenant_id;

  return query
  insert into public.nos_desbloqueados (tenant_id, no_id)
  values (p_tenant_id, p_no_id)
  returning *;
end;
$$;

revoke execute on function public.desbloquear_no(
  bigint, text, integer, integer, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.desbloquear_no(
  bigint, text, integer, integer, smallint, smallint, smallint, smallint, smallint
) to service_role;
