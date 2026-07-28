-- ============================================================================
-- Piso de atributos para desbloquear/aceitar (GH-ATR-03) — jobs do
-- marketplace e nós da árvore de parcerias passam a exigir um mínimo por
-- eixo (tecnologia/processo/presença/aquisição/capacidade), além do custo em
-- moeda virtual que já existia. Sem isso, GH-ARV-02 (gating de 3 estados) e
-- GH-EQP-02 (seleção de executor) não têm piso real para se apoiar.
--
-- Mesmo padrão de convenção de `0011_arv_custo.sql`: a checagem na Server
-- Action é só mensagem amigável — a garantia real é aqui, dentro da MESMA
-- transação que debita o custo/grava o registro, travada com `for update`
-- (desbloquear_no) para não deixar uma corrida conceder o nó a um negócio
-- que não atende o requisito no instante do commit.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) desbloquear_no — adiciona 5 parâmetros novos (p_min_*) à assinatura de
--    0011. Como parâmetros novos criam uma SOBRECARGA em vez de substituir a
--    função existente, primeiro derrubamos a assinatura antiga explicitamente.
-- ---------------------------------------------------------------------------
drop function if exists public.desbloquear_no(
  bigint, text, integer, integer, smallint, smallint, smallint, smallint, smallint
);

create or replace function public.desbloquear_no(
  p_tenant_id      bigint,
  p_no_id          text,
  p_custo          integer,
  p_xp             integer,
  p_tecnologia     smallint default 0,
  p_processo       smallint default 0,
  p_presenca       smallint default 0,
  p_aquisicao      smallint default 0,
  p_capacidade     smallint default 0,
  p_min_tecnologia smallint default 0,
  p_min_processo   smallint default 0,
  p_min_presenca   smallint default 0,
  p_min_aquisicao  smallint default 0,
  p_min_capacidade smallint default 0
)
returns setof public.nos_desbloqueados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio public.negocios;
begin
  if exists (
    select 1 from public.nos_desbloqueados
    where tenant_id = p_tenant_id and no_id = p_no_id
  ) then
    raise exception 'no_ja_desbloqueado';
  end if;

  -- precisa da linha inteira (não só moeda_virtual) para checar o piso de
  -- atributos abaixo — mesmo `for update` de antes, trava o negócio pelo
  -- resto da transação.
  select * into v_negocio
  from public.negocios where id = p_tenant_id
  for update;
  if v_negocio is null then
    raise exception 'negocio_nao_encontrado';
  end if;

  -- piso de atributos (GH-ATR-03): checa ANTES do saldo, mesma ordem da
  -- Server Action (`atributosFaltantes` roda antes do check de moeda).
  if v_negocio.tecnologia < p_min_tecnologia
     or v_negocio.processo   < p_min_processo
     or v_negocio.presenca   < p_min_presenca
     or v_negocio.aquisicao  < p_min_aquisicao
     or v_negocio.capacidade < p_min_capacidade then
    raise exception 'atributo_insuficiente';
  end if;

  if v_negocio.moeda_virtual < p_custo then
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
  bigint, text, integer, integer,
  smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.desbloquear_no(
  bigint, text, integer, integer,
  smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint, smallint
) to service_role;

-- ---------------------------------------------------------------------------
-- 2) aceitar_trabalho — função nova, mesmo racional de desbloquear_no mas
--    sem custo em moeda (aceitar um job nunca custou moeda, só desbloqueio
--    de nó custa). A escrita em trabalhos_aceitos passa a só acontecer via
--    RPC (service_role) — mesma migração de padrão que 0011 fez para
--    nos_desbloqueados.
-- ---------------------------------------------------------------------------
drop policy if exists trabalhos_insere_propria on public.trabalhos_aceitos;

create or replace function public.aceitar_trabalho(
  p_tenant_id      bigint,
  p_job_id         text,
  p_min_tecnologia smallint default 0,
  p_min_processo   smallint default 0,
  p_min_presenca   smallint default 0,
  p_min_aquisicao  smallint default 0,
  p_min_capacidade smallint default 0
)
returns setof public.trabalhos_aceitos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio   public.negocios;
  v_existente public.trabalhos_aceitos;
begin
  -- idempotente de propósito: se o job já foi aceito, o direito já foi
  -- concedido — devolve o registro existente SEM reavaliar requisito (o
  -- negócio pode ter perdido atributo desde então por algum motivo futuro,
  -- mas o trabalho já aceito não deve ser revogado).
  select * into v_existente from public.trabalhos_aceitos
  where tenant_id = p_tenant_id and job_id = p_job_id;
  if found then
    return next v_existente;
    return;
  end if;

  select * into v_negocio from public.negocios where id = p_tenant_id;
  if not found then
    raise exception 'negocio_nao_encontrado';
  end if;

  if v_negocio.tecnologia < p_min_tecnologia
     or v_negocio.processo   < p_min_processo
     or v_negocio.presenca   < p_min_presenca
     or v_negocio.aquisicao  < p_min_aquisicao
     or v_negocio.capacidade < p_min_capacidade then
    raise exception 'atributo_insuficiente';
  end if;

  return query
  insert into public.trabalhos_aceitos (tenant_id, job_id)
  values (p_tenant_id, p_job_id)
  returning *;
end;
$$;

revoke execute on function public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
) to service_role;
