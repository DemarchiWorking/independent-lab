-- ============================================================================
-- Marcos de recompensa únicos (auditoria de segurança 2026-10).
--
-- `recompensar()` pagava XP/moeda a cada chamada para eventos sem guarda
-- própria (diagnóstico agendado, retrospectiva de 90 dias). Um jogador podia
-- chamar a server action em laço. Cada evento desses passa a exigir um
-- "marco" único por negócio: o primeiro registro paga, os seguintes não.
-- Mesmo padrão das tabelas de lição/parceria: escrita só via RPC
-- (service_role), leitura só do próprio tenant.
-- ============================================================================

create table public.marcos_concluidos (
  id             bigint generated always as identity primary key,
  tenant_id      bigint not null references public.negocios (id) on delete cascade,
  marco_id       text not null check (char_length(marco_id) between 1 and 64),
  registrado_em  timestamptz not null default now(),
  unique (tenant_id, marco_id)
);
create index marcos_concluidos_tenant_id_idx
  on public.marcos_concluidos (tenant_id);

alter table public.marcos_concluidos enable row level security;
alter table public.marcos_concluidos force row level security;

create policy marcos_leitura_propria on public.marcos_concluidos
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- true = marco novo (pode pagar); false = já existia (não paga de novo).
create or replace function public.registrar_marco(
  p_tenant_id bigint,
  p_marco_id  text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inseridos integer;
begin
  insert into public.marcos_concluidos (tenant_id, marco_id)
  values (p_tenant_id, p_marco_id)
  on conflict (tenant_id, marco_id) do nothing;
  get diagnostics v_inseridos = row_count;
  return v_inseridos = 1;
end;
$$;

revoke execute on function public.registrar_marco(bigint, text) from public, anon, authenticated;
grant execute on function public.registrar_marco(bigint, text) to service_role;
