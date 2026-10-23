-- ============================================================================
-- Economia de moedas fechada + Contratos (entregas semanais e de jornada).
--
-- A moeda virtual só vale alguma coisa se NÃO der para fabricá-la fora das
-- regras do jogo. Esta migration faz três coisas:
--
-- 1. Fecha a última escrita direta que o navegador ainda tinha sobre a
--    economia. `0035`/`0036` já revogaram `update` em `negocios` e quase todo
--    `insert` de `authenticated`, mas `0036` deixou
--    `grant insert on funcionarios_contratados to authenticated` (+ a policy
--    `funcionarios_insere_propria` de `0003`). Desde que contratar CUSTA moeda,
--    isso deixou de ser inerte: um jogador logado poderia contratar qualquer
--    cargo de graça por `POST /rest/v1/funcionarios_contratados`, com a anon
--    key e o próprio JWT. O app inteiro escreve via RPC (service_role), então
--    revogar não muda nenhum caminho do app. As demais policies de escrita
--    (`trabalhos`, `nos`, `negocios`) são removidas por defesa em profundidade;
--    `drop policy if exists` é idempotente caso já tenham sido removidas.
--
-- 2. `contratos_concluidos` + `concluir_contrato`: pagamento atômico e
--    idempotente por (tenant, contrato, período).
--
-- 3. `contratar_funcionario`: contratar passou a custar moeda; débito e
--    inserção na mesma transação, com o saldo travado por `for update`.
--
-- Auditoria (`0031`): o ledger `progressao_eventos_log` é alimentado por
-- trigger em `negocios`, então estas RPCs já aparecem nele. Aqui só rotulamos
-- a origem (`gamehub.origem`, opcional e aditivo, ver `0031`) para o relatório
-- distinguir "contrato:<id>" de "contratacao:<cargo>".
-- ============================================================================

-- ---------------------------------------------------------------- 1. fecha
revoke insert on public.funcionarios_contratados from authenticated;
drop policy if exists funcionarios_insere_propria on public.funcionarios_contratados;
drop policy if exists trabalhos_insere_propria on public.trabalhos_aceitos;
drop policy if exists nos_insere_propria on public.nos_desbloqueados;
drop policy if exists negocios_atualiza_proprio on public.negocios;

-- ------------------------------------------------------------- 2. contratos
create table public.contratos_concluidos (
  id            bigint generated always as identity primary key,
  tenant_id     bigint not null references public.negocios (id) on delete cascade,
  contrato_id   text not null,
  -- chave do ciclo: 'unico', '2026-W43', 'ciclo-1'
  periodo       text not null,
  -- número declarado nos contratos de entrega real (ex.: vendas da semana)
  valor         integer check (valor is null or valor between 0 and 100000),
  concluido_em  timestamptz not null default now(),
  constraint contratos_concluidos_unico unique (tenant_id, contrato_id, periodo)
);
create index contratos_concluidos_tenant_id_idx
  on public.contratos_concluidos (tenant_id);

alter table public.contratos_concluidos enable row level security;
alter table public.contratos_concluidos force row level security;

-- Privado ao tenant; escrita só via RPC (service_role).
create policy contratos_leitura_propria on public.contratos_concluidos
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create or replace function public.concluir_contrato(
  p_tenant_id   bigint,
  p_contrato_id text,
  p_periodo     text,
  p_valor       integer,
  p_xp          integer,
  p_moeda       integer,
  p_tecnologia  smallint default 0,
  p_processo    smallint default 0,
  p_presenca    smallint default 0,
  p_aquisicao   smallint default 0,
  p_capacidade  smallint default 0
)
returns table (
  id            bigint,
  tenant_id     bigint,
  contrato_id   text,
  periodo       text,
  valor         integer,
  concluido_em  timestamptz,
  ja_concluido  boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_novo public.contratos_concluidos;
begin
  -- `on conflict do nothing` + unique = duas requisições simultâneas pelo
  -- mesmo contrato/período: uma insere, a outra cai no ramo "já concluído".
  insert into public.contratos_concluidos as c (tenant_id, contrato_id, periodo, valor)
  values (p_tenant_id, p_contrato_id, p_periodo, p_valor)
  on conflict on constraint contratos_concluidos_unico do nothing
  returning c.* into v_novo;

  if v_novo.id is null then
    return query
    select c.id, c.tenant_id, c.contrato_id, c.periodo, c.valor, c.concluido_em, true
    from public.contratos_concluidos c
    where c.tenant_id = p_tenant_id
      and c.contrato_id = p_contrato_id
      and c.periodo = p_periodo;
    return;
  end if;

  -- rótulo do ledger de auditoria (0031); local à transação
  perform set_config('gamehub.origem', 'contrato:' || p_contrato_id, true);

  update public.negocios n
  set xp            = n.xp + p_xp,
      nivel         = public.nivel_por_xp(n.xp + p_xp),
      moeda_virtual = greatest(0, n.moeda_virtual + p_moeda),
      tecnologia    = greatest(0, least(40, n.tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, n.processo + p_processo)),
      presenca      = greatest(0, least(40, n.presenca + p_presenca)),
      aquisicao     = greatest(0, least(40, n.aquisicao + p_aquisicao)),
      capacidade    = greatest(0, least(40, n.capacidade + p_capacidade))
  where n.id = p_tenant_id;

  return query
  select v_novo.id, v_novo.tenant_id, v_novo.contrato_id, v_novo.periodo,
         v_novo.valor, v_novo.concluido_em, false;
end;
$$;

revoke execute on function public.concluir_contrato(
  bigint, text, text, integer, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.concluir_contrato(
  bigint, text, text, integer, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) to service_role;

-- --------------------------------------------------- 3. contratação com custo
create or replace function public.contratar_funcionario(
  p_tenant_id bigint,
  p_cargo_id  text,
  p_custo     integer
)
returns setof public.funcionarios_contratados
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moeda     integer;
  v_existente public.funcionarios_contratados;
begin
  -- trava o saldo primeiro: dois cliques rápidos não gastam a mesma moeda
  select moeda_virtual into v_moeda
  from public.negocios where id = p_tenant_id
  for update;
  if v_moeda is null then
    raise exception 'negocio_nao_encontrado';
  end if;

  -- idempotente: já contratado devolve o registro, sem cobrar de novo
  select * into v_existente from public.funcionarios_contratados
  where tenant_id = p_tenant_id and cargo_id = p_cargo_id;
  if found then
    return next v_existente;
    return;
  end if;

  if p_custo < 0 or v_moeda < p_custo then
    raise exception 'saldo_insuficiente';
  end if;

  -- rótulo do ledger de auditoria (0031); local à transação
  perform set_config('gamehub.origem', 'contratacao:' || p_cargo_id, true);

  update public.negocios
  set moeda_virtual = moeda_virtual - p_custo
  where id = p_tenant_id;

  return query
  insert into public.funcionarios_contratados (tenant_id, cargo_id)
  values (p_tenant_id, p_cargo_id)
  returning *;
end;
$$;

revoke execute on function public.contratar_funcionario(bigint, text, integer)
  from public, anon, authenticated;
grant execute on function public.contratar_funcionario(bigint, text, integer)
  to service_role;
