-- GH-OPS-05 — Fila de denúncia/moderação de conteúdo público.
--
-- POR QUE: desde 0026_negocios_rls_fachada.sql, `negocios_publico` e
-- `ofertas` (leitura pública desde 0001) expõem texto livre digitado pelo
-- próprio empresário (nome do negócio, título/descrição de oferta) a
-- qualquer visitante do mapa — inclusive `anon` sem cadastro. Hoje não
-- existe NENHUM jeito de tirar um conteúdo abusivo do ar sem um humano
-- mexer direto no banco. Isso é seguro em modo demo (poucos tenants,
-- todos conhecidos), mas vira risco real assim que o mapa for divulgado
-- publicamente (Sebrae, redes sociais) — exatamente o próximo passo do
-- produto. Este card resolve só a fila de denúncia + a flag de ocultar;
-- NÃO adiciona moderação automática (nenhum filtro de palavrão, nenhuma
-- IA revisora) — escopo mínimo, sem over-engineering para um volume que
-- ainda não existe.

-- Flag simples em `ofertas`: oculta da vitrine sem apagar o dado (o dono
-- ainda vê a própria oferta e pode editar; só some da leitura pública).
alter table public.ofertas
  add column moderado_oculto boolean not null default false,
  add column moderado_em     timestamptz;

-- A leitura pública de ofertas (0001_init.sql) usava `using (true)`; passa
-- a respeitar a flag.
drop policy if exists ofertas_leitura on public.ofertas;
create policy ofertas_leitura on public.ofertas
  for select to anon, authenticated
  using (moderado_oculto = false);

-- Dono continua vendo a própria oferta mesmo se oculta (para poder corrigir
-- e pedir revisão) — policy adicional, não substitui a de cima.
create policy ofertas_leitura_propria on public.ofertas
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

create table public.denuncias_conteudo (
  id                    bigint generated always as identity primary key,
  -- referência polimórfica por nome de tabela — só `ofertas` é suportado
  -- por `moderar_conteudo()` hoje; qualquer outra origem fica registrada
  -- para triagem manual até o escopo crescer de verdade.
  tabela_origem         text not null check (tabela_origem in ('ofertas', 'negocios', 'solicitacoes_contato')),
  registro_id           bigint not null,
  -- nullable: um visitante sem cadastro pode denunciar (ex.: alguém que
  -- viu o mapa sem ter jogado ainda).
  tenant_denunciante_id bigint references public.negocios (id) on delete set null,
  motivo                text not null check (length(motivo) > 0),
  status                text not null default 'pendente'
                          check (status in ('pendente', 'revisado_ok', 'revisado_removido')),
  revisado_em           timestamptz,
  criada_em             timestamptz not null default now()
);

create index denuncias_conteudo_origem_idx
  on public.denuncias_conteudo (tabela_origem, registro_id);

create index denuncias_conteudo_pendentes_idx
  on public.denuncias_conteudo (criada_em)
  where status = 'pendente';

alter table public.denuncias_conteudo enable row level security;
alter table public.denuncias_conteudo force row level security;

-- Fila é só do painel admin (service_role) — nenhuma policy de select para
-- `anon`/`authenticated`: com `force row level security` e nenhuma policy
-- aplicável, a leitura direta devolve zero linhas, igual ao padrão de
-- `negocios_leitura_propria` (0026).

create or replace function public.registrar_denuncia(
  p_tabela_origem         text,
  p_registro_id           bigint,
  p_tenant_denunciante_id bigint,
  p_motivo                text
)
returns setof public.denuncias_conteudo
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  insert into public.denuncias_conteudo (
    tabela_origem, registro_id, tenant_denunciante_id, motivo
  )
  values (
    p_tabela_origem, p_registro_id, p_tenant_denunciante_id, p_motivo
  )
  returning *;
end;
$$;

revoke execute on function public.registrar_denuncia(text, bigint, bigint, text)
  from public, anon, authenticated;
grant execute on function public.registrar_denuncia(text, bigint, bigint, text)
  to service_role;

-- Decisão do admin sobre UMA denúncia. `p_ocultar = true` só tem efeito
-- real quando `tabela_origem = 'ofertas'` (única tabela com coluna de
-- moderação hoje); para as outras, registra a decisão mas não altera
-- visibilidade — extensão fica para quando o volume justificar.
create or replace function public.moderar_conteudo(
  p_denuncia_id bigint,
  p_ocultar     boolean
)
returns setof public.denuncias_conteudo
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tabela   text;
  v_registro bigint;
begin
  select tabela_origem, registro_id into v_tabela, v_registro
  from public.denuncias_conteudo
  where id = p_denuncia_id
  for update;

  if v_tabela is null then
    raise exception 'denuncia_nao_encontrada';
  end if;

  if v_tabela = 'ofertas' and p_ocultar then
    update public.ofertas
    set moderado_oculto = true,
        moderado_em     = now()
    where id = v_registro;
  end if;

  return query
  update public.denuncias_conteudo
  set status      = case when p_ocultar then 'revisado_removido' else 'revisado_ok' end,
      revisado_em = now()
  where id = p_denuncia_id
  returning *;
end;
$$;

revoke execute on function public.moderar_conteudo(bigint, boolean)
  from public, anon, authenticated;
grant execute on function public.moderar_conteudo(bigint, boolean)
  to service_role;
