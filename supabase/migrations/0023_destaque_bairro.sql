-- ============================================================================
-- Destaque rotativo do bairro (GH-GROW-04) — negócio com mais eventos de
-- PROGRESSO RECENTE (contratação, lição, nó desbloqueado, parceria) dentro
-- de uma janela de dias. Nunca por tamanho absoluto — dá chance a negócio
-- pequeno; "rotativo" emerge da janela deslizante, não de sorteio.
--
-- Opt-out: reusa `perfil_publico` (GH-GROW-01) em vez de um segundo
-- toggle de privacidade dedicado a isto — quem já optou por não aparecer
-- na vitrine pública também não entra no destaque.
--
-- Leitura pública (mesmo espírito de `mapa_resumo`/`benchmark_bairro`) —
-- sem `security definer`, sujeita às RLS já abertas das tabelas envolvidas.
-- ============================================================================

create or replace function public.destaque_bairro(
  p_cidade_slug text,
  p_bairro_slug text,
  p_desde       timestamptz
)
returns table (
  tenant_id        bigint,
  nome             text,
  segmento         text,
  eventos_recentes bigint
)
language sql
stable
set search_path = ''
as $$
  select
    n.id,
    n.nome,
    n.segmento,
    (
      coalesce((select count(*) from public.licoes_concluidas lc
                where lc.tenant_id = n.id and lc.concluida_em >= p_desde), 0)
      + coalesce((select count(*) from public.parcerias_formadas pf
                  where pf.tenant_id = n.id and pf.formada_em >= p_desde), 0)
      + coalesce((select count(*) from public.nos_desbloqueados nd
                  where nd.tenant_id = n.id and nd.desbloqueado_em >= p_desde), 0)
      + coalesce((select count(*) from public.funcionarios_contratados fc
                  where fc.tenant_id = n.id and fc.contratado_em >= p_desde), 0)
    ) as eventos_recentes
  from public.negocios n
  join public.quarteiroes q on q.id = n.quarteirao_id
  join public.bairros b     on b.id = q.bairro_id
  join public.cidades c     on c.id = b.cidade_id
  where c.slug = p_cidade_slug
    and b.slug = p_bairro_slug
    and n.perfil_publico = true
  order by eventos_recentes desc, n.id asc
  limit 1;
$$;

grant execute on function public.destaque_bairro(text, text, timestamptz) to anon, authenticated;
