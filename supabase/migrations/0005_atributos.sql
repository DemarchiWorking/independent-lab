-- ============================================================================
-- Economia de atributos: os 5 eixos do negócio (Tecnologia, Processo,
-- Presença, Aquisição, Capacidade). Ver
-- docs/analise-prints/telas/economia-de-atributos.md e
-- src/lib/atributos.ts (a mesma regra de clamp em TypeScript).
--
-- Decisão: 5 colunas smallint em `negocios` (não uma tabela 1:1 separada) —
-- é dado 1:1 sem ciclo de vida próprio, exatamente como xp/moeda_virtual/
-- nivel já são. `teto` não é armazenado por linha: hoje é uma constante do
-- sistema (40, igual em todo negócio); se um dia precisar variar por
-- negócio, essa é uma migration nova — YAGNI por ora.
-- ============================================================================

alter table public.negocios
  add column tecnologia smallint not null default 0
    check (tecnologia between 0 and 40),
  add column processo   smallint not null default 0
    check (processo between 0 and 40),
  add column presenca   smallint not null default 0
    check (presenca between 0 and 40),
  add column aquisicao  smallint not null default 0
    check (aquisicao between 0 and 40),
  add column capacidade smallint not null default 0
    check (capacidade between 0 and 40);

-- ---------------------------------------------------------------------------
-- criar_negocio_com_lote — recriada com os 5 valores iniciais (o onboarding
-- já os calcula a partir das 10 respostas; nascem no INSERT, não numa
-- segunda chamada separada).
-- ---------------------------------------------------------------------------
drop function if exists public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer
);

create or replace function public.criar_negocio_com_lote(
  p_cidade_slug  text,
  p_cidade_nome  text,
  p_bairro_nome  text,
  p_bairro_slug  text,
  p_nome         text,
  p_segmento     text,
  p_degrau_alvo  smallint,
  p_xp           integer,
  p_moeda        integer,
  p_tecnologia   smallint default 0,
  p_processo     smallint default 0,
  p_presenca     smallint default 0,
  p_aquisicao    smallint default 0,
  p_capacidade   smallint default 0
)
returns setof public.negocios
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cidade_id     bigint;
  v_bairro_id     bigint;
  v_quarteirao_id bigint;
  v_numero        smallint;
  v_lote          smallint;
  v_negocio       public.negocios;
begin
  insert into public.cidades (slug, nome)
  values (p_cidade_slug, p_cidade_nome)
  on conflict (slug) do update set nome = excluded.nome
  returning id into v_cidade_id;

  insert into public.bairros (cidade_id, slug, nome)
  values (v_cidade_id, p_bairro_slug, p_bairro_nome)
  on conflict (cidade_id, slug) do update set nome = excluded.nome
  returning id into v_bairro_id;

  -- serializa a alocação dentro deste bairro até o fim da transação
  perform pg_advisory_xact_lock(hashtextextended('bairro:' || v_bairro_id, 0));

  -- primeiro (quarteirão, lote) livre do bairro
  select q.id, g.n
    into v_quarteirao_id, v_lote
  from public.quarteiroes q
  cross join generate_series(1, 8) as g(n)
  where q.bairro_id = v_bairro_id
    and not exists (
      select 1 from public.negocios ne
      where ne.quarteirao_id = q.id and ne.lote = g.n
    )
  order by q.numero, g.n
  limit 1;

  -- todos os quarteirões lotados (ou bairro novo) → abre o próximo
  if v_quarteirao_id is null then
    select coalesce(max(numero), 0) + 1 into v_numero
    from public.quarteiroes where bairro_id = v_bairro_id;

    insert into public.quarteiroes (bairro_id, numero)
    values (v_bairro_id, v_numero)
    returning id into v_quarteirao_id;

    v_lote := 1;
  end if;

  insert into public.negocios (
    nome, segmento, quarteirao_id, lote,
    degrau_atual, degrau_alvo, xp, nivel, moeda_virtual,
    tecnologia, processo, presenca, aquisicao, capacidade
  )
  values (
    p_nome, p_segmento, v_quarteirao_id, v_lote,
    1, p_degrau_alvo, p_xp, public.nivel_por_xp(p_xp), p_moeda,
    greatest(0, least(40, p_tecnologia)),
    greatest(0, least(40, p_processo)),
    greatest(0, least(40, p_presenca)),
    greatest(0, least(40, p_aquisicao)),
    greatest(0, least(40, p_capacidade))
  )
  returning * into v_negocio;

  return next v_negocio;
end;
$$;

revoke execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint
) to service_role;

-- ---------------------------------------------------------------------------
-- aplicar_progresso — recriada com os 5 deltas de atributo (default 0, sem
-- efeito). Mesma transação do XP/moeda/degrau — nunca uma segunda chamada
-- separada, que abriria uma janela de estado inconsistente.
-- ---------------------------------------------------------------------------
drop function if exists public.aplicar_progresso(bigint, integer, integer, smallint);

create or replace function public.aplicar_progresso(
  p_tenant_id  bigint,
  p_xp         integer,
  p_moeda      integer,
  p_degraus    smallint,
  p_tecnologia smallint default 0,
  p_processo   smallint default 0,
  p_presenca   smallint default 0,
  p_aquisicao  smallint default 0,
  p_capacidade smallint default 0
)
returns setof public.negocios
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.negocios n
  set xp            = greatest(0, n.xp + p_xp),
      moeda_virtual = greatest(0, n.moeda_virtual + p_moeda),
      degrau_atual  = greatest(1, least(5, n.degrau_atual + p_degraus)),
      nivel         = public.nivel_por_xp(greatest(0, n.xp + p_xp)),
      tecnologia    = greatest(0, least(40, n.tecnologia + p_tecnologia)),
      processo      = greatest(0, least(40, n.processo + p_processo)),
      presenca      = greatest(0, least(40, n.presenca + p_presenca)),
      aquisicao     = greatest(0, least(40, n.aquisicao + p_aquisicao)),
      capacidade    = greatest(0, least(40, n.capacidade + p_capacidade))
  where n.id = p_tenant_id
  returning n.*;
end;
$$;

revoke execute on function public.aplicar_progresso(
  bigint, integer, integer, smallint, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.aplicar_progresso(
  bigint, integer, integer, smallint, smallint, smallint, smallint, smallint, smallint
) to service_role;
