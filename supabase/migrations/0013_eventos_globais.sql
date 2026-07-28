-- ============================================================================
-- Eventos globais (campanhas com prazo, visíveis para todos os tenants ao
-- mesmo tempo — ex.: "Semana da Automação: 3 serviços vendidos ganham
-- bônus"). `objetivo` reusa o mesmo catálogo de EventoKey de
-- src/features/gamificacao/engine.ts: contar "quantos `servico_contratado`
-- esse tenant gerou dentro da janela" é o que `recompensar()` já sabe fazer.
--
-- Leitura pública (mesmo padrão de cidades/bairros/negócios em 0001_init) —
-- todo jogador vê os eventos ativos. Escrita só via RPC (service_role),
-- chamada pelo server DEPOIS de `souAdmin(sessao.email)` checar a allowlist
-- em `src/lib/admin.ts` — não há tabela de roles nesta fase, a garantia real
-- é que só código server-side segura a service_role key.
--
-- Status (agendado/ativo/encerrado) é sempre DERIVADO de início/fim
-- comparado com `now()` — relógio lazy, nunca um campo gravado (mesmo
-- padrão de features/historia/relogio.ts).
-- ============================================================================

create table public.eventos_globais (
  id                        text primary key,
  titulo                    text not null,
  descricao                 text not null,
  objetivo                  text not null check (objetivo in (
    'cadastro_completo', 'diagnostico_agendado', 'servico_contratado',
    'servico_desbloqueado', 'parceria_formada', 'oferta_publicada',
    'retro_90d', 'funcionario_ia_contratado'
  )),
  meta                      integer not null check (meta > 0),
  inicio_em                 timestamptz not null,
  fim_em                    timestamptz not null check (fim_em > inicio_em),
  recompensa_xp             integer not null default 0 check (recompensa_xp >= 0),
  recompensa_moeda          integer not null default 0 check (recompensa_moeda >= 0),
  recompensa_atributo_chave text check (
    recompensa_atributo_chave is null or recompensa_atributo_chave in (
      'tecnologia', 'processo', 'presenca', 'aquisicao', 'capacidade'
    )
  ),
  recompensa_atributo_ganho smallint,
  criado_por                text not null,
  criado_em                 timestamptz not null default now()
);

create table public.progresso_eventos_globais (
  id          bigint generated always as identity primary key,
  evento_id   text not null references public.eventos_globais(id),
  tenant_id   bigint not null references public.negocios(id),
  contagem    integer not null default 0,
  completo_em timestamptz,
  unique (evento_id, tenant_id)
);
create index on public.progresso_eventos_globais (tenant_id);

alter table public.eventos_globais            enable row level security;
alter table public.eventos_globais            force row level security;
alter table public.progresso_eventos_globais  enable row level security;
alter table public.progresso_eventos_globais  force row level security;

-- leitura pública dos eventos — é o "cartaz" que todo jogador precisa ver
create policy eventos_globais_leitura on public.eventos_globais
  for select to anon, authenticated using (true);

-- progresso é estratégico por tenant (mostra o que cada negócio está
-- perseguindo) — só o próprio dono enxerga o próprio avanço
create policy progresso_eventos_do_proprio on public.progresso_eventos_globais
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- nenhuma policy de insert/update em ambas: escrita só pelas RPCs abaixo

create or replace function public.criar_evento_global(
  p_id                text,
  p_titulo            text,
  p_descricao         text,
  p_objetivo          text,
  p_meta              integer,
  p_inicio_em         timestamptz,
  p_fim_em            timestamptz,
  p_recompensa_xp     integer,
  p_recompensa_moeda  integer,
  p_criado_por        text,
  p_atributo_chave    text default null,
  p_atributo_ganho    smallint default null
)
returns setof public.eventos_globais
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  insert into public.eventos_globais (
    id, titulo, descricao, objetivo, meta, inicio_em, fim_em,
    recompensa_xp, recompensa_moeda, recompensa_atributo_chave,
    recompensa_atributo_ganho, criado_por
  )
  values (
    p_id, p_titulo, p_descricao, p_objetivo, p_meta, p_inicio_em, p_fim_em,
    p_recompensa_xp, p_recompensa_moeda, p_atributo_chave, p_atributo_ganho,
    p_criado_por
  )
  returning *;
end;
$$;

revoke execute on function public.criar_evento_global(
  text, text, text, text, integer, timestamptz, timestamptz, integer, integer,
  text, text, smallint
) from public, anon, authenticated;
grant execute on function public.criar_evento_global(
  text, text, text, text, integer, timestamptz, timestamptz, integer, integer,
  text, text, smallint
) to service_role;

-- Incrementa o progresso de UM tenant em TODOS os eventos ativos cujo
-- objetivo bate com a ação que acabou de acontecer (ex.: "servico_contratado").
-- Ao bater a meta pela primeira vez, aplica a recompensa na MESMA transação
-- (mesmo padrão atômico de desbloquear_no/comprar_mobilia) — nunca duas
-- chamadas, que abririam janela para recompensa duplicada ou perdida.
--
-- NÃO é chamada por nenhum código ainda: a integração em
-- src/features/gamificacao/actions.ts (recompensar()) e
-- src/features/parcerias/actions.ts (desbloquearNo()) fica para depois —
-- esses dois arquivos estão sendo editados por outra sessão em paralelo
-- (GH-ATR-03) no momento em que esta migration foi escrita. Ver
-- docs/BACKLOG-PRODUTO.md → GH-EVT-02.
create or replace function public.incrementar_progresso_eventos(
  p_tenant_id  bigint,
  p_evento_key text,
  p_agora      timestamptz default now()
)
returns setof public.progresso_eventos_globais
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evento record;
  v_contagem integer;
  v_completo_em timestamptz;
begin
  for v_evento in
    select * from public.eventos_globais
    where objetivo = p_evento_key
      and inicio_em <= p_agora
      and fim_em >= p_agora
  loop
    insert into public.progresso_eventos_globais (evento_id, tenant_id, contagem)
    values (v_evento.id, p_tenant_id, 1)
    on conflict (evento_id, tenant_id)
    do update set contagem = public.progresso_eventos_globais.contagem + 1
    returning contagem into v_contagem;

    select completo_em into v_completo_em
    from public.progresso_eventos_globais
    where evento_id = v_evento.id and tenant_id = p_tenant_id;

    if v_contagem >= v_evento.meta and v_completo_em is null then
      update public.progresso_eventos_globais
      set completo_em = p_agora
      where evento_id = v_evento.id and tenant_id = p_tenant_id;

      update public.negocios
      set moeda_virtual = moeda_virtual + v_evento.recompensa_moeda,
          xp            = xp + v_evento.recompensa_xp,
          nivel         = public.nivel_por_xp(xp + v_evento.recompensa_xp),
          tecnologia    = case when v_evento.recompensa_atributo_chave = 'tecnologia'
                               then greatest(0, least(40, tecnologia + v_evento.recompensa_atributo_ganho))
                               else tecnologia end,
          processo      = case when v_evento.recompensa_atributo_chave = 'processo'
                               then greatest(0, least(40, processo + v_evento.recompensa_atributo_ganho))
                               else processo end,
          presenca      = case when v_evento.recompensa_atributo_chave = 'presenca'
                               then greatest(0, least(40, presenca + v_evento.recompensa_atributo_ganho))
                               else presenca end,
          aquisicao     = case when v_evento.recompensa_atributo_chave = 'aquisicao'
                               then greatest(0, least(40, aquisicao + v_evento.recompensa_atributo_ganho))
                               else aquisicao end,
          capacidade    = case when v_evento.recompensa_atributo_chave = 'capacidade'
                               then greatest(0, least(40, capacidade + v_evento.recompensa_atributo_ganho))
                               else capacidade end
      where id = p_tenant_id;
    end if;
  end loop;

  return query
  select * from public.progresso_eventos_globais where tenant_id = p_tenant_id;
end;
$$;

revoke execute on function public.incrementar_progresso_eventos(bigint, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.incrementar_progresso_eventos(bigint, text, timestamptz)
  to service_role;
