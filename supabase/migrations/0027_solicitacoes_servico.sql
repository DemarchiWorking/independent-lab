-- ============================================================================
-- Solicitações de serviço (labdatadev) — o cliente, DENTRO do jogo (pelo
-- computador/celular do escritório), pede um serviço real ao Laboratório
-- Demarchi: "quero um site", "quero um app", "quero uma automação", ou
-- "quero uma funcionalidade nova numa plataforma que já foi entregue".
--
-- É a ponte jogo → negócio real: a jogabilidade ensina maturidade digital;
-- esta tabela é onde o interesse vira um pedido acionável, gerido no painel
-- admin (/admin/labdatadev). Ver documentos/ecossistema/06-consultoria-e-entregaveis.md.
--
-- Padrão de persistência: mesma classe de `ofertas` (0001) — escrita direta
-- pela Server Action com a service_role key (nunca policy de insert), leitura
-- do próprio tenant liberada por RLS. O painel admin lê TODAS via service_role
-- (que ignora RLS), depois de `souAdmin(sessao.email)` em src/lib/admin.ts.
--
-- `status` é um campo GRAVADO (não derivado): representa o andamento do
-- atendimento no mundo real, que só o admin muda — diferente de status
-- derivados de relógio (eventos/história).
-- ============================================================================

create table public.solicitacoes_servico (
  id            bigint generated always as identity primary key,
  tenant_id     bigint not null references public.negocios(id),
  tipo          text not null check (tipo in (
    'site', 'app', 'automacao', 'funcionalidade'
  )),
  titulo        text not null,
  descricao     text not null,
  status        text not null default 'recebida' check (status in (
    'recebida', 'em_analise', 'em_producao', 'entregue', 'recusada'
  )),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.solicitacoes_servico (tenant_id);
create index on public.solicitacoes_servico (status);

alter table public.solicitacoes_servico enable row level security;
alter table public.solicitacoes_servico force row level security;

-- O cliente vê SÓ as próprias solicitações (é dado privado do negócio dele).
-- Escrita (insert/update de status) e leitura-admin (todas) só via
-- service_role, nas Server Actions gated — sem policy de insert/update aqui.
create policy solicitacoes_do_proprio on public.solicitacoes_servico
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));
