-- GH-DOC-02 — 7º documento gerado pelo document-engine: Análise de
-- Concorrência (Tarefa B, docs/PROXIMA-TAREFA.md). Compara o tenant a
-- outros negócios REAIS do mesmo segmento e cidade — nunca concorrente
-- fictício (ver document-engine/knowledge-base/06-analise-concorrencia.md).
--
-- Duas mudanças:
-- 1) expande o `check` de `documentos_gerados.tipo` de 6 para 7 valores
--    (mesmo padrão aditivo da migration 0038).
-- 2) nova RPC `concorrentes_regiao`, mesmo padrão arquitetural de
--    `vizinhos_do_tenant`/`formar_parceria` (0001/0014): resolve
--    segmento + cidade do tenant via join quarteirao→bairro→cidade, e
--    retorna outros negócios do MESMO segmento e MESMA cidade, só os que
--    optaram por `perfil_publico = true` (mesmo dado já público hoje em
--    `vizinhos_do_tenant`/`destaque_bairro`) — nunca expõe dado privado de
--    onboarding.

alter table public.documentos_gerados
  drop constraint documentos_gerados_tipo_check;

alter table public.documentos_gerados
  add constraint documentos_gerados_tipo_check
  check (tipo in (
    'canvas',
    'modelo-negocio',
    'swot',
    'resumo-executivo',
    'roadmap-melhoria-continua',
    'proposta-comercial',
    'analise-concorrencia'
  ));

create or replace function public.concorrentes_regiao(
  p_tenant_id bigint,
  p_limite    int default 6
)
returns table (
  nome         text,
  segmento     text,
  nivel        smallint,
  degrau_atual smallint,
  bairro_nome  text,
  criado_em    timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_segmento  text;
  v_cidade_id bigint;
begin
  select n.segmento, b.cidade_id
    into v_segmento, v_cidade_id
  from public.negocios n
  join public.quarteiroes q on q.id = n.quarteirao_id
  join public.bairros b     on b.id = q.bairro_id
  where n.id = p_tenant_id;

  if v_segmento is null then
    raise exception 'tenant_nao_encontrado';
  end if;

  return query
    select
      c.nome,
      c.segmento,
      c.nivel,
      c.degrau_atual,
      b2.nome as bairro_nome,
      c.criado_em
    from public.negocios c
    join public.quarteiroes q2 on q2.id = c.quarteirao_id
    join public.bairros b2     on b2.id = q2.bairro_id
    where b2.cidade_id = v_cidade_id
      and c.segmento = v_segmento
      and c.id <> p_tenant_id
      and c.perfil_publico = true
    order by c.criado_em desc
    limit p_limite;
end;
$$;

-- Chamada exclusivamente pelo document-engine (service_role, fora do
-- contexto HTTP de um usuário logado) — mesmo padrão de `formar_parceria`,
-- nunca exposta a anon/authenticated direto.
revoke execute on function public.concorrentes_regiao(bigint, int)
  from public, anon, authenticated;
grant execute on function public.concorrentes_regiao(bigint, int)
  to service_role;
