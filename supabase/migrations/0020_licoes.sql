-- ============================================================================
-- Lições educacionais (GH-EDU-01) — mesmo padrão de `nos_desbloqueados`/
-- `parcerias_formadas`: tabela + RPC idempotente, nasce já com escrita só
-- via RPC (service_role), nunca policy de insert direta.
-- ============================================================================

create table public.licoes_concluidas (
  id            bigint generated always as identity primary key,
  tenant_id     bigint not null references public.negocios (id) on delete cascade,
  licao_id      text not null,
  concluida_em  timestamptz not null default now(),
  unique (tenant_id, licao_id)
);
create index licoes_concluidas_tenant_id_idx
  on public.licoes_concluidas (tenant_id);

alter table public.licoes_concluidas enable row level security;
alter table public.licoes_concluidas force row level security;

create policy licoes_leitura_propria on public.licoes_concluidas
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create or replace function public.concluir_licao(
  p_tenant_id  bigint,
  p_licao_id   text,
  p_xp         integer,
  p_tecnologia smallint default 0,
  p_processo   smallint default 0,
  p_presenca   smallint default 0,
  p_aquisicao  smallint default 0,
  p_capacidade smallint default 0
)
returns setof public.licoes_concluidas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existente public.licoes_concluidas;
begin
  -- idempotente: já concluída, devolve o registro existente sem pagar XP de novo
  select * into v_existente from public.licoes_concluidas
  where tenant_id = p_tenant_id and licao_id = p_licao_id;
  if found then
    return next v_existente;
    return;
  end if;

  update public.negocios
  set xp         = xp + p_xp,
      nivel      = public.nivel_por_xp(xp + p_xp),
      tecnologia = greatest(0, least(40, tecnologia + p_tecnologia)),
      processo   = greatest(0, least(40, processo + p_processo)),
      presenca   = greatest(0, least(40, presenca + p_presenca)),
      aquisicao  = greatest(0, least(40, aquisicao + p_aquisicao)),
      capacidade = greatest(0, least(40, capacidade + p_capacidade))
  where id = p_tenant_id;

  return query
  insert into public.licoes_concluidas (tenant_id, licao_id)
  values (p_tenant_id, p_licao_id)
  returning *;
end;
$$;

revoke execute on function public.concluir_licao(
  bigint, text, integer, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.concluir_licao(
  bigint, text, integer, smallint, smallint, smallint, smallint, smallint
) to service_role;
