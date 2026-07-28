-- ============================================================================
-- Solicitações de contato via perfil público (GH-GROW-01) — o visitante da
-- página pública deixa o PRÓPRIO contato aqui; a página nunca expõe
-- e-mail/telefone do dono em texto puro. Isto é o "formulário intermediado".
--
-- Sem policy de insert (nem para `anon`): a escrita acontece de dentro da
-- Server Action `enviarSolicitacaoContato`, que roda com `service_role`
-- (mesmo cliente que TODO o resto do `SupabaseRepository` usa — ver
-- `src/lib/supabase/client.ts`) e é onde o rate-limit anti-spam mora. Uma
-- policy de insert para `anon` seria uma segunda porta de entrada sem
-- rate-limit nenhum — não existe hoje de propósito.
-- ============================================================================

create table public.solicitacoes_contato (
  id                bigint generated always as identity primary key,
  tenant_id         bigint not null references public.negocios (id) on delete cascade,
  nome_remetente    text not null check (length(trim(nome_remetente)) > 0),
  contato_remetente text not null check (length(trim(contato_remetente)) > 0),
  mensagem          text not null check (length(trim(mensagem)) > 0),
  criada_em         timestamptz not null default now()
);
create index solicitacoes_contato_tenant_id_idx
  on public.solicitacoes_contato (tenant_id);

alter table public.solicitacoes_contato enable row level security;
alter table public.solicitacoes_contato force row level security;

-- Só o próprio dono lê as mensagens recebidas.
create policy solicitacoes_contato_leitura_propria on public.solicitacoes_contato
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));
