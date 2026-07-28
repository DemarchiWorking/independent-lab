-- ============================================================================
-- Persistir parceria formada no Mapa (GH-FDN-03) + fechar guarda anti-farm
-- que hoje não existe: `parceria_formada` roda pelo dispatcher genérico
-- `recompensar()` sem NENHUMA checagem de idempotência — só o `useState`
-- local de `MapaScreen` impedia o re-clique, e isso se perde no reload.
-- Vai direto para o padrão RPC (como 0011 teve que corrigir depois que 0009
-- criou o mesmo buraco para `nos_desbloqueados`) — não repete o ciclo
-- "insert direto → travar depois".
-- ============================================================================

create table public.parcerias_formadas (
  id                 bigint generated always as identity primary key,
  tenant_id          bigint not null references public.negocios (id) on delete cascade,
  vizinho_tenant_id  bigint not null references public.negocios (id) on delete cascade,
  formada_em         timestamptz not null default now(),
  -- um tenant não forma parceria duas vezes com o mesmo vizinho
  unique (tenant_id, vizinho_tenant_id)
);
create index parcerias_formadas_tenant_id_idx
  on public.parcerias_formadas (tenant_id);

alter table public.parcerias_formadas enable row level security;
alter table public.parcerias_formadas force row level security;

create policy parcerias_leitura_propria on public.parcerias_formadas
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Sem policy de insert: escrita só via RPC (service_role), desde o dia 1 —
-- diferente de 0009, que teve que corrigir isso depois em 0011. Aqui já
-- nasce certo porque a validação real ("é mesmo vizinho de quarteirão?")
-- não pode viver numa policy simples de RLS.
create or replace function public.formar_parceria(
  p_tenant_id         bigint,
  p_vizinho_tenant_id bigint,
  p_xp                integer,
  p_moeda             integer,
  -- só "aquisição" existe hoje (engine.ts: EVENTOS.parceria_formada é fixo);
  -- não generaliza para os 5 eixos como `desbloquear_no` porque não há hoje
  -- mais de uma variação deste evento — YAGNI, mesmo raciocínio de GH-FDN-02.
  p_aquisicao         smallint default 0
)
returns setof public.parcerias_formadas
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_vizinho_tenant_id = p_tenant_id then
    raise exception 'vizinho_invalido';
  end if;

  -- a garantia real de segurança deste card: nunca confiar que o
  -- `vizinhoTenantId` vindo do client é de fato vizinho de quarteirão —
  -- mesmo join usado por `vizinhos_do_tenant` (0001).
  if not exists (
    select 1
    from public.negocios eu
    join public.negocios v on v.quarteirao_id = eu.quarteirao_id
    where eu.id = p_tenant_id and v.id = p_vizinho_tenant_id
  ) then
    raise exception 'vizinho_invalido';
  end if;

  if exists (
    select 1 from public.parcerias_formadas
    where tenant_id = p_tenant_id and vizinho_tenant_id = p_vizinho_tenant_id
  ) then
    raise exception 'parceria_ja_formada';
  end if;

  update public.negocios
  set xp            = xp + p_xp,
      moeda_virtual = moeda_virtual + p_moeda,
      nivel         = public.nivel_por_xp(xp + p_xp),
      aquisicao     = greatest(0, least(40, aquisicao + p_aquisicao))
  where id = p_tenant_id;

  return query
  insert into public.parcerias_formadas (tenant_id, vizinho_tenant_id)
  values (p_tenant_id, p_vizinho_tenant_id)
  returning *;
end;
$$;

revoke execute on function public.formar_parceria(
  bigint, bigint, integer, integer, smallint
) from public, anon, authenticated;
grant execute on function public.formar_parceria(
  bigint, bigint, integer, integer, smallint
) to service_role;
