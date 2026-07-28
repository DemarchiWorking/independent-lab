-- ============================================================================
-- Motor de história: capítulos entregues por tenant e a escolha do jogador.
-- Ver docs/world/EVOLUCAO-MOTOR-2026.md §7.1 (pirâmide de loops).
--
-- O conteúdo narrativo NÃO mora no banco — vive no catálogo estático em
-- features/historia/catalogo.ts. Aqui guardamos só o id, exatamente como
-- cargo_id e item_id fazem. Assim o texto pode ser reescrito, traduzido ou
-- corrigido sem migration, e o progresso do jogador continua válido.
--
-- `unique (tenant_id, capitulo_id)` é a espinha da idempotência: o relógio é
-- *lazy* e reavalia a narrativa a cada leitura, então tentar entregar duas
-- vezes precisa ser inofensivo por construção, não por sorte de timing.
-- ============================================================================

create table public.capitulos_entregues (
  id           bigint generated always as identity primary key,
  tenant_id    bigint not null references public.negocios (id) on delete cascade,
  capitulo_id  text   not null,
  entregue_em  timestamptz not null default now(),
  escolha_id   text,
  resolvido_em timestamptz,
  unique (tenant_id, capitulo_id),
  -- escolha e data de resolução andam juntas ou não andam
  constraint escolha_coerente check (
    (escolha_id is null and resolvido_em is null) or
    (escolha_id is not null and resolvido_em is not null)
  )
);

create index capitulos_entregues_tenant_idx
  on public.capitulos_entregues (tenant_id, entregue_em desc);

alter table public.capitulos_entregues enable row level security;
alter table public.capitulos_entregues force row level security;

-- A história de um negócio é privada: é o retrato das decisões dele.
create policy capitulos_leitura_propria on public.capitulos_entregues
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Sem policy de escrita: só via RPC (service_role), abaixo.

-- ---------------------------------------------------------------------------
-- entregar_capitulo — idempotente por construção. `on conflict do nothing`
-- seguido de select devolve a linha certa tanto no caso novo quanto no
-- já-existente (mesmo padrão de contratarFuncionario).
-- ---------------------------------------------------------------------------
create or replace function public.entregar_capitulo(
  p_tenant_id   bigint,
  p_capitulo_id text
)
returns setof public.capitulos_entregues
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.capitulos_entregues (tenant_id, capitulo_id)
  values (p_tenant_id, p_capitulo_id)
  on conflict (tenant_id, capitulo_id) do nothing;

  return query
  select * from public.capitulos_entregues
  where tenant_id = p_tenant_id and capitulo_id = p_capitulo_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- resolver_capitulo — grava a escolha E aplica o efeito na MESMA transação.
--
-- O `for update` + a checagem de `escolha_id is not null` é o que impede
-- refarmar recompensa reenviando a requisição: a segunda chamada encontra a
-- linha já resolvida e levanta exceção antes de tocar em xp/moeda/atributo.
-- ---------------------------------------------------------------------------
create or replace function public.resolver_capitulo(
  p_tenant_id   bigint,
  p_capitulo_id text,
  p_escolha_id  text,
  p_xp          integer default 0,
  p_moeda       integer default 0,
  p_tecnologia  smallint default 0,
  p_processo    smallint default 0,
  p_presenca    smallint default 0,
  p_aquisicao   smallint default 0,
  p_capacidade  smallint default 0
)
returns setof public.capitulos_entregues
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_escolha text;
begin
  select escolha_id into v_escolha
  from public.capitulos_entregues
  where tenant_id = p_tenant_id and capitulo_id = p_capitulo_id
  for update;

  if not found then
    raise exception 'capitulo_nao_entregue';
  end if;
  if v_escolha is not null then
    raise exception 'capitulo_ja_resolvido';
  end if;

  -- mesma regra de clamp de aplicar_progresso (0005): moeda nunca negativa,
  -- atributo sempre dentro de [0, 40]
  update public.negocios n
  set xp            = greatest(0, n.xp + p_xp),
      moeda_virtual = greatest(0, n.moeda_virtual + p_moeda),
      nivel         = public.nivel_por_xp(greatest(0, n.xp + p_xp)),
      tecnologia    = greatest(0, least(40, n.tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, n.processo + p_processo)),
      presenca      = greatest(0, least(40, n.presenca + p_presenca)),
      aquisicao     = greatest(0, least(40, n.aquisicao + p_aquisicao)),
      capacidade    = greatest(0, least(40, n.capacidade + p_capacidade))
  where n.id = p_tenant_id;

  return query
  update public.capitulos_entregues
  set escolha_id = p_escolha_id, resolvido_em = now()
  where tenant_id = p_tenant_id and capitulo_id = p_capitulo_id
  returning *;
end;
$$;

revoke execute on function public.entregar_capitulo(bigint, text)
  from public, anon, authenticated;
grant execute on function public.entregar_capitulo(bigint, text)
  to service_role;

revoke execute on function public.resolver_capitulo(
  bigint, text, text, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.resolver_capitulo(
  bigint, text, text, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) to service_role;
