-- GH-COM-01 — Solicitação de orçamento (fluxo "deals" do produto).
--
-- POR QUE: `docs/PRODUTO-IA-FUNCIONARIOS.md` §7 descreve o fluxo alvo desde
-- 2026-07-26 ("Cliente pede orçamento de um Funcionário de IA, de um serviço
-- avulso, ou de um produto") como pendente — só existia como rascunho
-- conceitual em `docs/database/SCHEMA-PARCEIROS-REGIONAL.md` (tabela
-- `deals`, nunca aplicada). Sem esta tabela, o loop comercial do jogo
-- (jogar → contratar de verdade) não fecha: hoje `funcionarios_contratados`
-- registra a contratação DENTRO do jogo (moeda virtual), mas não existe
-- nenhum jeito do empresário pedir a contratação REAL (R$) sem falar direto
-- com o Antonio por fora do app.
--
-- Nomenclatura e forma seguem `solicitacoes_contato` (0019_contato_publico.sql):
-- mesma decisão de não expor policy de insert a `anon`/`authenticated` — a
-- escrita passa por Server Action com rate-limit (ver comentário de 0019),
-- não pela RLS, para não abrir uma segunda porta de entrada sem limite.

create table public.solicitacoes_orcamento (
  id                     bigint generated always as identity primary key,
  tenant_id              bigint not null references public.negocios (id) on delete cascade,
  tipo                   text not null check (tipo in ('funcionario_ia', 'job_marketplace', 'servico_avulso')),
  -- id do catálogo de origem (cargo_id de equipe-ia, job_id do marketplace,
  -- ou texto livre p/ servico_avulso) — catálogos são estáticos em
  -- features/, nunca em lib/db/types.ts (AGENTS.md regra 3), então aqui é
  -- só o identificador, sem FK.
  referencia_id          text not null check (length(referencia_id) > 0),
  escopo                 text not null check (length(escopo) > 0),
  urgencia               text not null default 'normal' check (urgencia in ('baixa', 'normal', 'alta')),
  -- R$ real (aproximado, informado pelo cliente) — NUNCA moeda virtual 🪙.
  -- Nullable: cliente pode preferir não informar orçamento antes de falar
  -- com o Antonio.
  orcamento_aproximado_centavos integer check (orcamento_aproximado_centavos is null or orcamento_aproximado_centavos > 0),
  status                 text not null default 'orcamento'
                           check (status in ('orcamento', 'aceito', 'entrega', 'concluido', 'cancelado')),
  -- notas do Antonio no painel admin — nunca exibidas ao cliente.
  observacoes_internas   text,
  criada_em              timestamptz not null default now(),
  atualizada_em          timestamptz not null default now(),
  concluida_em           timestamptz
);

create index solicitacoes_orcamento_tenant_id_idx
  on public.solicitacoes_orcamento (tenant_id, criada_em desc);

-- Fila de trabalho do painel admin: status em aberto, mais antigo primeiro.
create index solicitacoes_orcamento_status_idx
  on public.solicitacoes_orcamento (status, criada_em)
  where status not in ('concluido', 'cancelado');

alter table public.solicitacoes_orcamento enable row level security;
alter table public.solicitacoes_orcamento force row level security;

create policy solicitacoes_orcamento_leitura_propria on public.solicitacoes_orcamento
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Escrita (insert do cliente, update de status pelo admin) só via RPC,
-- mesmo padrão de solicitacoes_contato.

create or replace function public.criar_solicitacao_orcamento(
  p_tenant_id     bigint,
  p_tipo          text,
  p_referencia_id text,
  p_escopo        text,
  p_urgencia      text default 'normal',
  p_orcamento_aproximado_centavos integer default null
)
returns setof public.solicitacoes_orcamento
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  insert into public.solicitacoes_orcamento (
    tenant_id, tipo, referencia_id, escopo, urgencia, orcamento_aproximado_centavos
  )
  values (
    p_tenant_id, p_tipo, p_referencia_id, p_escopo, p_urgencia, p_orcamento_aproximado_centavos
  )
  returning *;
end;
$$;

revoke execute on function public.criar_solicitacao_orcamento(
  bigint, text, text, text, text, integer
) from public, anon, authenticated;
grant execute on function public.criar_solicitacao_orcamento(
  bigint, text, text, text, text, integer
) to service_role;

-- Transição de status pelo painel admin. Não dispara XP/gamificação aqui de
-- propósito (regra 5 do AGENTS.md: progressão só muda via
-- `repo.aplicarProgresso`) — a Server Action do admin chama esta função E,
-- separadamente, `aplicar_progresso` quando o status virar 'concluido', se
-- o produto decidir que isso deve valer XP.
create or replace function public.atualizar_status_orcamento(
  p_id          bigint,
  p_novo_status text
)
returns setof public.solicitacoes_orcamento
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atual text;
begin
  select status into v_atual
  from public.solicitacoes_orcamento
  where id = p_id
  for update;

  if v_atual is null then
    raise exception 'solicitacao_nao_encontrada';
  end if;

  if v_atual in ('concluido', 'cancelado') then
    raise exception 'solicitacao_ja_finalizada';
  end if;

  if p_novo_status not in ('orcamento', 'aceito', 'entrega', 'concluido', 'cancelado') then
    raise exception 'status_invalido';
  end if;

  return query
  update public.solicitacoes_orcamento
  set status        = p_novo_status,
      atualizada_em = now(),
      concluida_em  = case when p_novo_status = 'concluido' then now() else concluida_em end
  where id = p_id
  returning *;
end;
$$;

revoke execute on function public.atualizar_status_orcamento(bigint, text)
  from public, anon, authenticated;
grant execute on function public.atualizar_status_orcamento(bigint, text)
  to service_role;
