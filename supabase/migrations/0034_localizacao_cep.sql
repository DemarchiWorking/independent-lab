-- ============================================================================
-- CEP como origem opcional de cidade/bairro no cadastro (Épico 13 — Escala e
-- Replicação). O app resolve CEP → cidade/bairro reais via ViaCEP no
-- servidor (`lib/localizacao/cep.ts`) ANTES de chamar esta função — aqui só
-- guardamos o CEP bruto, dado privado de auditoria/suporte, nunca exposto em
-- `negocios_publico` (0026) nem em nenhuma leitura pública.
--
-- Mesmo motivo já documentado em 0005/0012/0015/0018: parâmetro novo em
-- `criar_negocio_com_lote` cria sobrecarga (drop + create), nunca substitui
-- a assinatura anterior no meio do caminho. `p_cep default null` mantém
-- compatível qualquer chamador que ainda não passe o argumento.
-- ============================================================================

alter table public.negocios add column if not exists cep text;

comment on column public.negocios.cep is
  'CEP bruto (8 dígitos) informado no cadastro, quando resolvido via ViaCEP. '
  'Dado privado — nunca exposto em negocios_publico nem em leitura pública; '
  'só para auditoria/suporte.';

drop function if exists public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint, boolean, text
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
  p_consentimento_versao text default null,
  p_cep                  text default null
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
    perfil_publico, consentimento_em, consentimento_versao, cep
  )
  values (
    p_nome, p_segmento, v_quarteirao_id, v_lote,
    1, p_degrau_alvo, p_xp, public.nivel_por_xp(p_xp), p_moeda,
    greatest(0, least(40, p_tecnologia)),
    greatest(0, least(40, p_processo)),
    greatest(0, least(40, p_presenca)),
    greatest(0, least(40, p_aquisicao)),
    greatest(0, least(40, p_capacidade)),
    p_perfil_publico, now(), p_consentimento_versao, p_cep
  )
  returning * into v_negocio;

  return next v_negocio;
end;
$$;

revoke execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint, boolean, text, text
) from public, anon, authenticated;

grant execute on function public.criar_negocio_com_lote(
  text, text, text, text, text, text, smallint, integer, integer,
  smallint, smallint, smallint, smallint, smallint, boolean, text, text
) to service_role;
