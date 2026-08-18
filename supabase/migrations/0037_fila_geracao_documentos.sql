-- GH-DOC-01 — Fila de geração de documentação de negócio (Business Model
-- Canvas + Modelo de Negócio) por tenant, processada em lote pelo motor
-- headless (document-engine/, cron horário) e entregue dentro do próprio
-- jogo em /painel.
--
-- Duas tabelas: fila_geracao_documentos (fila de trabalho — só
-- service_role enxerga, mesmo princípio de fila de moderação/GH-OPS-05) e
-- documentos_gerados (resultado entregue — o próprio tenant lê o que é
-- seu). Cada rodada de geração INSERE linhas novas em documentos_gerados
-- (nunca sobrescreve) — o histórico de versões vive na tabela, sem
-- precisar de uma seção "Notas de Versão" dentro do markdown.
--
-- `0036` já revogou INSERT/UPDATE/DELETE de anon/authenticated por padrão
-- em toda tabela nova do schema public (ALTER DEFAULT PRIVILEGES) — aqui
-- só é preciso habilitar+forçar RLS e declarar as policies de SELECT.

create table public.fila_geracao_documentos (
  id                bigint generated always as identity primary key,
  tenant_id         bigint not null references public.negocios (id) on delete cascade,
  status            text not null default 'pendente'
                      check (status in ('pendente', 'processando', 'concluido', 'erro')),
  -- markdown com tudo que se sabia da empresa no momento do enfileiramento
  -- ("a ficha") — contexto lido pelo motor, e histórico auditável de
  -- "o que a IA sabia quando gerou".
  contexto_snapshot text not null,
  -- calculado em TS (crypto.createHash) antes de chamar a RPC — evita
  -- depender de pgcrypto só para isto.
  hash_contexto     text not null,
  tentativas        smallint not null default 0,
  erro              text,
  criado_em         timestamptz not null default now(),
  iniciado_em       timestamptz,
  concluido_em      timestamptz
);
create index fila_geracao_documentos_tenant_id_idx
  on public.fila_geracao_documentos (tenant_id);
create index fila_geracao_documentos_status_idx
  on public.fila_geracao_documentos (status)
  where status in ('pendente', 'processando');

create table public.documentos_gerados (
  id                bigint generated always as identity primary key,
  tenant_id         bigint not null references public.negocios (id) on delete cascade,
  fila_id           bigint references public.fila_geracao_documentos (id) on delete set null,
  tipo              text not null check (tipo in ('canvas', 'modelo-negocio')),
  titulo            text not null,
  conteudo_markdown text not null,
  gerado_em         timestamptz not null default now()
);
create index documentos_gerados_tenant_id_idx
  on public.documentos_gerados (tenant_id);

alter table public.fila_geracao_documentos enable row level security;
alter table public.fila_geracao_documentos force row level security;
alter table public.documentos_gerados enable row level security;
alter table public.documentos_gerados force row level security;

-- Fila: nenhuma policy de select para anon/authenticated — só service_role
-- (o motor) e Server Actions (que já filtram pelo tenant da sessão antes
-- de decidir o que mostrar, quando algum dia houver UI de status).

-- Documentos entregues: o próprio tenant lê os seus.
create policy documentos_gerados_leitura_propria on public.documentos_gerados
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Enfileiramento é sempre server-side (chamado por Server Action com
-- service_role, nunca policy de insert direta) — mesmo padrão de
-- criar_negocio_com_lote. Idempotente em duas camadas: não duplica item já
-- pendente/processando do tenant, e não reenfileira se o hash bate com a
-- última geração concluída (nada mudou desde então).
-- `returns setof` (não a linha composta direta) por precedente já
-- documentado neste projeto: PostgREST + `.single()` no supabase-js é mais
-- previsível com `setof` (ver nota em `0001_init.sql`/AGENTS.md).
create or replace function public.enfileirar_geracao_documento(
  p_tenant_id bigint,
  p_contexto  text,
  p_hash      text
)
returns setof public.fila_geracao_documentos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existente public.fila_geracao_documentos;
  v_nova      public.fila_geracao_documentos;
begin
  select * into v_existente
  from public.fila_geracao_documentos
  where tenant_id = p_tenant_id and status in ('pendente', 'processando')
  limit 1;

  if found then
    return next v_existente;
    return;
  end if;

  select * into v_existente
  from public.fila_geracao_documentos
  where tenant_id = p_tenant_id and status = 'concluido' and hash_contexto = p_hash
  order by concluido_em desc
  limit 1;

  if found then
    return next v_existente;
    return;
  end if;

  insert into public.fila_geracao_documentos (tenant_id, contexto_snapshot, hash_contexto)
  values (p_tenant_id, p_contexto, p_hash)
  returning * into v_nova;

  return next v_nova;
end;
$$;

revoke execute on function public.enfileirar_geracao_documento(bigint, text, text)
  from public, anon, authenticated;

grant execute on function public.enfileirar_geracao_documento(bigint, text, text)
  to service_role;
