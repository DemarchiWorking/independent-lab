-- ============================================================================
-- Acervo de documentos (GH-OPS Bloco 4) — só METADADO, nunca o conteúdo.
--
-- `CapituloCard.tsx` promete "Documento liberado no seu acervo" desde que a
-- história existe; até aqui isso não persistia nada. Esta tabela só cobre o
-- Diagnóstico de Maturidade Digital (o documento CARRO-CHEFE, sem "dono"
-- narrativo) — os 5 documentos de história continuam sem tabela própria,
-- porque `capitulos_entregues.escolha_id` (0007) já é a prova de que o
-- jogador tem direito a eles. Criar uma segunda tabela pra isso duplicaria
-- estado que já existe (mesmo racional de "sem tabela `avatares`" em
-- GH-WORLD-05).
--
-- Por que só metadado: o conteúdo do Diagnóstico é sempre REGENERADO do dado
-- vivo (`src/features/documentos/motor.ts`) — nunca fica desatualizado, e não
-- precisa de Storage nenhum (o motivo de o stack self-hosted de GH-OPS Bloco 2
-- não ter `storage`/`imgproxy`). `unique(tenant_id, doc_id)` mantém UMA linha
-- por documento por tenant — cada emissão nova faz upsert, não insert, então
-- a tabela nunca cresce sem limite.
-- ============================================================================

create table public.documentos_emitidos (
  tenant_id           bigint not null references public.negocios (id) on delete cascade,
  doc_id              text not null check (doc_id in ('diagnostico-maturidade')),
  primeira_emissao_em timestamptz not null default now(),
  ultima_emissao_em   timestamptz not null default now(),
  versao_metodologia  text not null,
  primary key (tenant_id, doc_id)
);

alter table public.documentos_emitidos enable row level security;
alter table public.documentos_emitidos force row level security;

-- Privado ao tenant — dado sobre a PRÓPRIA maturidade do negócio, mesmo
-- critério de `onboardings` (nunca exposto a terceiros, nem em visita).
create policy documentos_leitura_propria on public.documentos_emitidos
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- SEM policy de insert/update para `authenticated`: a escrita é sempre via
-- `service_role` dentro da Server Action que gera o documento — mesmo
-- desenho que `nos_desbloqueados`/`trabalhos_aceitos` adotaram depois que a
-- escrita virou centralizada (ver comentário de `drop policy` em
-- `0011_arv_custo.sql`). Não repetir aqui o erro que aquela migration corrigiu.

-- ----------------------------------------------------------------------------
-- `registrar_emissao_documento` — upsert que PRESERVA `primeira_emissao_em`.
--
-- Um upsert comum via PostgREST substitui TODAS as colunas enviadas no
-- conflito — se `primeira_emissao_em` fosse mandado a cada chamada, a
-- segunda visualização do documento reescreveria "quando foi a primeira vez"
-- com a data de agora, quebrando o próprio propósito da coluna. `on conflict
-- ... do update set` só nas duas colunas que DEVEM mudar é o jeito correto
-- de fazer isso no Postgres — dá pra fazer via REST, mas exigiria dois round
-- trips (select, depois insert OU update) com uma corrida no meio; a RPC
-- resolve em uma operação atômica, mesmo padrão do resto do schema.
-- ----------------------------------------------------------------------------
create function public.registrar_emissao_documento(
  p_tenant_id          bigint,
  p_doc_id             text,
  p_versao_metodologia text
)
returns public.documentos_emitidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linha public.documentos_emitidos;
begin
  insert into public.documentos_emitidos (tenant_id, doc_id, versao_metodologia)
  values (p_tenant_id, p_doc_id, p_versao_metodologia)
  on conflict (tenant_id, doc_id) do update
    set ultima_emissao_em  = now(),
        versao_metodologia = excluded.versao_metodologia
  returning * into v_linha;
  return v_linha;
end;
$$;

revoke execute on function public.registrar_emissao_documento(bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.registrar_emissao_documento(bigint, text, text)
  to service_role;
