-- GH-COM-02 — Estado de assinatura real (R$), sem gateway de pagamento.
--
-- POR QUE: `docs/PRODUTO-IA-FUNCIONARIOS.md` é explícito — "Funcionário de
-- IA" é vendido por ASSINATURA MENSAL (R$ 297 a 897), não por tarefa (§3,
-- §5); e §7 diz "não implementar pagamento real dentro do app ainda...
-- cobrança real (Stripe/gateway) é fase posterior". Esta migration modela
-- só o ESTADO da assinatura (pendente/ativa/inadimplente/cancelada) — não
-- processa cobrança nenhuma. Serve para o painel admin e o painel do
-- cliente já mostrarem status real antes do gateway existir, e para a
-- integração futura (Stripe) ter uma tabela pronta em vez de nascer junto
-- com a pressa do primeiro cliente pagante.
--
-- POR QUE 1:1 com `funcionarios_contratados` e não uma tabela de "planos"
-- solto: o catálogo de cargos (preço, nome) já vive em
-- `features/equipe-ia/catalogo.ts` (regra 3 do AGENTS.md — catálogo estático
-- fica em features/, nunca em lib/db). Duplicar isso em uma tabela `planos`
-- criaria uma segunda fonte de verdade de preço. Em vez disso, o preço é
-- GRAVADO (snapshot) no momento em que a assinatura é criada — histórico de
-- cobrança nunca deve depender de um catálogo que muda com o tempo.
--
-- POR QUE centavos: evita erro de ponto flutuante em valor monetário real;
-- mesma prática recomendada para qualquer integração futura com Stripe
-- (que já trabalha em centavos nativamente).

create table public.assinaturas (
  id                        bigint generated always as identity primary key,
  tenant_id                 bigint not null references public.negocios (id) on delete cascade,
  funcionario_contratado_id bigint not null unique
                              references public.funcionarios_contratados (id) on delete cascade,
  -- snapshot do preço no momento da assinatura — R$ real, NUNCA moeda
  -- virtual 🪙. Ver nota acima sobre por que não é uma FK para catálogo.
  preco_centavos            integer not null check (preco_centavos > 0),
  periodicidade             text not null default 'mensal' check (periodicidade in ('mensal', 'anual')),
  status                    text not null default 'pendente'
                              check (status in ('pendente', 'ativa', 'inadimplente', 'cancelada')),
  -- preenchidos só quando o gateway (Stripe) for integrado; nulos até lá.
  stripe_customer_id        text,
  stripe_subscription_id    text unique,
  ativada_em                timestamptz,
  proxima_cobranca_em       timestamptz,
  cancelada_em              timestamptz,
  criada_em                 timestamptz not null default now()
);

create index assinaturas_tenant_id_idx
  on public.assinaturas (tenant_id);

create index assinaturas_status_idx
  on public.assinaturas (status)
  where status in ('pendente', 'inadimplente');

alter table public.assinaturas enable row level security;
alter table public.assinaturas force row level security;

create policy assinaturas_leitura_propria on public.assinaturas
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Escrita só via RPC (service_role) — hoje chamada pelo painel admin;
-- amanhã, pelo webhook do gateway de pagamento.

create or replace function public.registrar_assinatura(
  p_tenant_id                 bigint,
  p_funcionario_contratado_id bigint,
  p_preco_centavos            integer,
  p_periodicidade             text default 'mensal'
)
returns setof public.assinaturas
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- garante que o funcionário contratado é mesmo deste tenant — nunca
  -- confiar em client para essa checagem (regra 4 do AGENTS.md).
  if not exists (
    select 1 from public.funcionarios_contratados
    where id = p_funcionario_contratado_id and tenant_id = p_tenant_id
  ) then
    raise exception 'funcionario_nao_pertence_ao_tenant';
  end if;

  return query
  insert into public.assinaturas (
    tenant_id, funcionario_contratado_id, preco_centavos, periodicidade
  )
  values (
    p_tenant_id, p_funcionario_contratado_id, p_preco_centavos, p_periodicidade
  )
  returning *;
end;
$$;

revoke execute on function public.registrar_assinatura(bigint, bigint, integer, text)
  from public, anon, authenticated;
grant execute on function public.registrar_assinatura(bigint, bigint, integer, text)
  to service_role;

create or replace function public.atualizar_status_assinatura(
  p_id                     bigint,
  p_novo_status            text,
  p_stripe_customer_id     text default null,
  p_stripe_subscription_id text default null,
  p_proxima_cobranca_em    timestamptz default null
)
returns setof public.assinaturas
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_novo_status not in ('pendente', 'ativa', 'inadimplente', 'cancelada') then
    raise exception 'status_invalido';
  end if;

  return query
  update public.assinaturas
  set status                 = p_novo_status,
      stripe_customer_id     = coalesce(p_stripe_customer_id, stripe_customer_id),
      stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
      proxima_cobranca_em    = coalesce(p_proxima_cobranca_em, proxima_cobranca_em),
      ativada_em             = case when p_novo_status = 'ativa' and ativada_em is null
                                     then now() else ativada_em end,
      cancelada_em           = case when p_novo_status = 'cancelada'
                                     then now() else cancelada_em end
  where id = p_id
  returning *;
end;
$$;

revoke execute on function public.atualizar_status_assinatura(
  bigint, text, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.atualizar_status_assinatura(
  bigint, text, text, text, timestamptz
) to service_role;
