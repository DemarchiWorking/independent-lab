-- ============================================================================
-- Árvore de parcerias: persiste o nó desbloqueado por tenant (GH-FDN-02) —
-- mesmo padrão de `trabalhos_aceitos` (0008) / `funcionarios_contratados`
-- (0003). Antes desta migration, `HexTreeScreen` guardava "desbloqueado" em
-- `useState` local — sumia ao recarregar a página.
-- ============================================================================

create table public.nos_desbloqueados (
  id               bigint generated always as identity primary key,
  tenant_id        bigint not null references public.negocios (id) on delete cascade,
  no_id            text not null check (
                     no_id in ('web', 'automacao', 'bi', 'ads', 'crm', 'infra')),
  desbloqueado_em  timestamptz not null default now(),
  -- um tenant não desbloqueia o mesmo nó duas vezes (idempotência no banco)
  unique (tenant_id, no_id)
);
create index nos_desbloqueados_tenant_id_idx
  on public.nos_desbloqueados (tenant_id);

alter table public.nos_desbloqueados enable row level security;
alter table public.nos_desbloqueados force row level security;

-- Privado ao tenant (dado estratégico — em que trilha de maturidade o
-- negócio investiu; mesmo critério de trabalhos_aceitos/funcionarios_contratados).
create policy nos_leitura_propria on public.nos_desbloqueados
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create policy nos_insere_propria on public.nos_desbloqueados
  for insert to authenticated
  with check (tenant_id = (select private.tenant_atual()));
