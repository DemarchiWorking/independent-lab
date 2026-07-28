-- ============================================================================
-- Consulta agregada por cidade/bairro (GH-MAPA-01) — `lerMapaView()` hoje
-- carrega o mundo inteiro numa query (toda cidade → bairro → quarteirão →
-- negócio). Funciona com dezenas de negócios; com centenas vira gargalo
-- (o próprio card já reconhece isso). Estas duas funções dão um read model
-- "só contagem" para os níveis de zoom altos, sem carregar cada negócio.
--
-- Leitura pública (mesma política já aplicada a cidades/bairros/quarteiroes/
-- negocios em 0001_init.sql — o mapa é vitrine, não dado privado), então
-- SEM `security definer`: roda com o privilégio de quem chama, sujeito às
-- mesmas RLS policies de leitura já existentes.
-- ============================================================================

create or replace function public.mapa_resumo()
returns table (
  cidade_slug    text,
  cidade_nome    text,
  total_bairros  bigint,
  total_negocios bigint
)
language sql
stable
set search_path = ''
as $$
  select
    c.slug,
    c.nome,
    count(distinct b.id) as total_bairros,
    count(n.id)          as total_negocios
  from public.cidades c
  left join public.bairros b      on b.cidade_id = c.id
  left join public.quarteiroes q  on q.bairro_id = b.id
  left join public.negocios n     on n.quarteirao_id = q.id
  group by c.id, c.slug, c.nome
  order by c.nome;
$$;

create or replace function public.bairro_resumo(p_cidade_slug text)
returns table (
  bairro_slug    text,
  bairro_nome    text,
  total_negocios bigint
)
language sql
stable
set search_path = ''
as $$
  select
    b.slug,
    b.nome,
    count(n.id) as total_negocios
  from public.bairros b
  join public.cidades c           on c.id = b.cidade_id
  left join public.quarteiroes q  on q.bairro_id = b.id
  left join public.negocios n     on n.quarteirao_id = q.id
  where c.slug = p_cidade_slug
  group by b.id, b.slug, b.nome
  order by b.nome;
$$;

grant execute on function public.mapa_resumo() to anon, authenticated;
grant execute on function public.bairro_resumo(text) to anon, authenticated;
