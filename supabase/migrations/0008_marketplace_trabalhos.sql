-- ============================================================================
-- Marketplace: guarda anti-farm (GH-FDN-01) — registra o job aceito por
-- tenant, no mesmo padrão de `funcionarios_contratados` (0003).
--
-- Antes desta migration, "Aceitar trabalho" só disparava o evento de
-- gamificação sem registrar QUAL job foi aceito — clicar repetido no mesmo
-- job pagava XP/moeda toda vez. `unique(tenant_id, job_id)` é a garantia real
-- (a checagem em `recompensar()` é só mensagem amigável).
-- ============================================================================

create table public.trabalhos_aceitos (
  id         bigint generated always as identity primary key,
  tenant_id  bigint not null references public.negocios (id) on delete cascade,
  job_id     text not null check (
               job_id in ('excel-sql', 'uxui', 'landing', 'aws', 'n8n')),
  aceito_em  timestamptz not null default now(),
  -- um tenant não aceita o mesmo job duas vezes (idempotência no banco)
  unique (tenant_id, job_id)
);
create index trabalhos_aceitos_tenant_id_idx
  on public.trabalhos_aceitos (tenant_id);

alter table public.trabalhos_aceitos enable row level security;
alter table public.trabalhos_aceitos force row level security;

-- Privado ao tenant (mesmo critério de funcionarios_contratados) — quais
-- jobs foram aceitos não é vitrine pública.
create policy trabalhos_leitura_propria on public.trabalhos_aceitos
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create policy trabalhos_insere_propria on public.trabalhos_aceitos
  for insert to authenticated
  with check (tenant_id = (select private.tenant_atual()));
