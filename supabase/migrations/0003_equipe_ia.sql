-- ============================================================================
-- Equipe de IA: funcionários (agentes Claude) contratados por tenant.
-- Produto central do pivot — ver docs/PRODUTO-IA-FUNCIONARIOS.md.
-- ============================================================================

create table public.funcionarios_contratados (
  id            bigint generated always as identity primary key,
  tenant_id     bigint not null references public.negocios (id) on delete cascade,
  cargo_id      text not null check (
                  cargo_id in ('documentador', 'social-media', 'editor-video', 'comercial')),
  contratado_em timestamptz not null default now(),
  -- um tenant não contrata o mesmo cargo duas vezes (idempotência no banco)
  unique (tenant_id, cargo_id)
);
create index funcionarios_contratados_tenant_id_idx
  on public.funcionarios_contratados (tenant_id);

alter table public.funcionarios_contratados enable row level security;
alter table public.funcionarios_contratados force row level security;

-- Privado ao tenant (como onboardings) — quem foi contratado não é vitrine
-- pública ainda; decisão revisável (ver §9 do doc de produto).
create policy funcionarios_leitura_propria on public.funcionarios_contratados
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create policy funcionarios_insere_propria on public.funcionarios_contratados
  for insert to authenticated
  with check (tenant_id = (select private.tenant_atual()));
