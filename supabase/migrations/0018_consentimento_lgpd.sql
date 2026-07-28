-- ============================================================================
-- Consentimento LGPD + opt-out de perfil público (GH-OPS-04 + GH-GROW-01) —
-- os dois cards são deliberadamente entregues juntos: o próprio backlog
-- (GH-GROW-01) exige que o cadastro informe, no momento do consentimento,
-- que o negócio ganhará uma página pública, e dê a opção de recusar.
--
-- `consentimento_em`/`consentimento_versao` não são dado sensível em si —
-- só registram QUANDO e QUAL versão da política o dono aceitou (mesmo
-- espírito de `criado_em`, não de `onboardings`, que é o dado sensível
-- de verdade). `perfil_publico` é o opt-out: default true (aberto), mas
-- SEMPRE decidido explicitamente no formulário de cadastro, nunca assumido
-- silenciosamente por trás — ver `src/features/auth/actions.ts::cadastrar`.
-- ============================================================================

alter table public.negocios
  add column perfil_publico       boolean not null default true,
  add column consentimento_em     timestamptz,
  add column consentimento_versao text;

-- Assinatura muda (2 parâmetros novos) — exige `drop function` da versão
-- anterior, mesmo motivo já documentado em 0012/0015: parâmetro novo cria
-- sobrecarga, não substitui.
drop function if exists public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint
);

create or replace function public.criar_negocio_com_lote(
  p_cidade_slug          text,
  p_cidade_nome          text,
  p_bairro_nome          text,
  p_bairro_slug          text,
  p_nome                 text,
  p_segmento             text,
  p_degrau_alvo          smallint,
  p_xp                   integer,
  p_moeda                integer,
  p_tecnologia           smallint default 0,
  p_processo             smallint default 0,
  p_presenca             smallint default 0,
  p_aquisicao            smallint default 0,
  p_capacidade           smallint default 0,
  p_perfil_publico       boolean default true,
  p_consentimento_versao text default null
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

  perform pg_advisory_xact_lock(hashtextextended('bairro:' || v_bairro_id, 0));

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
    tecnologia, processo, presenca, aquisicao, capacidade,
    perfil_publico, consentimento_em, consentimento_versao
  )
  values (
    p_nome, p_segmento, v_quarteirao_id, v_lote,
    1, p_degrau_alvo, p_xp, public.nivel_por_xp(p_xp), p_moeda,
    greatest(0, least(40, p_tecnologia)),
    greatest(0, least(40, p_processo)),
    greatest(0, least(40, p_presenca)),
    greatest(0, least(40, p_aquisicao)),
    greatest(0, least(40, p_capacidade)),
    p_perfil_publico, now(), p_consentimento_versao
  )
  returning * into v_negocio;

  return next v_negocio;
end;
$$;

revoke execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint, boolean, text
) from public, anon, authenticated;
grant execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint, boolean, text
) to service_role;
