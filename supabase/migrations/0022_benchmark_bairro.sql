-- ============================================================================
-- Benchmark regional (GH-MAPA-04) — médias agregadas dos 5 eixos por
-- bairro. Mesmo espírito de `mapa_resumo`/`bairro_resumo` (0017): leitura
-- pública, sem `security definer`, sujeita às mesmas RLS já abertas de
-- cidades/bairros/quarteiroes/negocios. NUNCA cruza com `onboardings`
-- (budget/score) — só as colunas de fachada já usadas no mapa.
-- ============================================================================

create or replace function public.benchmark_bairro(
  p_cidade_slug text,
  p_bairro_slug text
)
returns table (
  total_negocios    int,
  media_tecnologia  numeric,
  media_processo    numeric,
  media_presenca    numeric,
  media_aquisicao   numeric,
  media_capacidade  numeric
)
language sql
stable
set search_path = ''
as $$
  select
    count(n.id)::int,
    coalesce(avg(n.tecnologia), 0),
    coalesce(avg(n.processo), 0),
    coalesce(avg(n.presenca), 0),
    coalesce(avg(n.aquisicao), 0),
    coalesce(avg(n.capacidade), 0)
  from public.cidades c
  join public.bairros b on b.cidade_id = c.id
  left join public.quarteiroes q on q.bairro_id = b.id
  left join public.negocios n on n.quarteirao_id = q.id
  where c.slug = p_cidade_slug and b.slug = p_bairro_slug;
$$;

grant execute on function public.benchmark_bairro(text, text) to anon, authenticated;
