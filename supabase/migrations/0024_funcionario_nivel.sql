-- ============================================================================
-- Nível do Funcionário de IA (GH-EQP-04) — evoluir um agente melhora a
-- PROFUNDIDADE do entregável que ele produz (canvas com próximos passos,
-- script com cadência de follow-up, post que cita o gargalo declarado).
-- Ver `src/features/equipe-ia/entregaveis/`.
--
-- Escrita só via RPC (service_role), mesmo padrão de `desbloquear_no`
-- (0011) / `formar_parceria` (0014): o débito de moeda e a mudança de
-- nível acontecem na MESMA transação, com o saldo travado por `for update`
-- — dois cliques rápidos não compram duas evoluções com a mesma moeda.
-- ============================================================================

alter table public.funcionarios_contratados
  add column nivel smallint not null default 1 check (nivel between 1 and 3);

create or replace function public.evoluir_funcionario(
  p_tenant_id      bigint,
  p_funcionario_id bigint,
  p_novo_nivel     smallint,
  p_custo          integer
)
returns setof public.funcionarios_contratados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda       integer;
  v_nivel_atual smallint;
begin
  -- o funcionário tem que ser DESTE tenant: sem isso, um tenant poderia
  -- evoluir o agente de outro passando um id arbitrário
  select nivel into v_nivel_atual
  from public.funcionarios_contratados
  where id = p_funcionario_id and tenant_id = p_tenant_id
  for update;

  if v_nivel_atual is null then
    raise exception 'funcionario_nao_encontrado';
  end if;

  -- só evolui de um em um, e nunca além do teto do check constraint
  if p_novo_nivel <> v_nivel_atual + 1 then
    raise exception 'nivel_invalido';
  end if;

  select moeda_virtual into v_moeda
  from public.negocios where id = p_tenant_id
  for update;
  if v_moeda is null then
    raise exception 'negocio_nao_encontrado';
  end if;
  if v_moeda < p_custo then
    raise exception 'saldo_insuficiente';
  end if;

  update public.negocios
  set moeda_virtual = moeda_virtual - p_custo
  where id = p_tenant_id;

  return query
  update public.funcionarios_contratados
  set nivel = p_novo_nivel
  where id = p_funcionario_id and tenant_id = p_tenant_id
  returning *;
end;
$$;

revoke execute on function public.evoluir_funcionario(bigint, bigint, smallint, integer)
  from public, anon, authenticated;
grant execute on function public.evoluir_funcionario(bigint, bigint, smallint, integer)
  to service_role;
