-- GH-OPS-06 — Ledger de progressão (auditoria, anti-cheat, analytics).
--
-- POR QUE: hoje `xp`/`moeda_virtual`/os 5 atributos de `negocios` só têm o
-- VALOR ATUAL — nenhuma das 11 funções que os alteram (aplicar_progresso,
-- evoluir_sede, comprar_mobilia, desbloquear_no, resolver_capitulo,
-- concluir_licao, resgatar_convite, aceitar_trabalho, formar_parceria,
-- evoluir_funcionario, evoluir_mobilia) deixa rastro de QUANDO ou POR QUE
-- um valor mudou. Sem isso: (a) não dá para investigar um tenant que
-- "farmou" XP por um bug específico — só dá para ver o resultado final;
-- (b) não dá para responder "quais eventos mais engajam" sem re-derivar de
-- 9 tabelas diferentes; (c) se um valor ficar corrompido (bug, migration
-- malfeita), não existe como recompor o histórico.
--
-- DECISÃO DE DESIGN — trigger, não reescrever as 11 funções: reescrever
-- cada função para chamar um `insert` explícito no ledger seria invasivo
-- (11 `create or replace function`, risco de regressão em lógica já
-- validada em produção) e violaria "não redesenhar o que já funciona" só
-- para ganhar um log. Em vez disso, um único trigger `after update` em
-- `negocios` compara OLD/NEW e grava o delta de qualquer uma das 7 colunas
-- de progressão — funciona para as 11 funções hoje E para qualquer futura,
-- sem precisar lembrar de instrumentar cada uma.
--
-- LIMITAÇÃO ACEITA (documentada, não é bug): a coluna `origem` fica
-- genérica ('nao_rotulado') a menos que o chamador grave
-- `select set_config('gamehub.origem', '<nome_da_acao>', true)` antes do
-- update — isso é OPCIONAL e aditivo (nenhuma função existente precisa
-- mudar para o ledger funcionar; rotular a origem é uma melhoria futura de
-- baixo risco, uma linha por função, quando o produto precisar de relatório
-- por tipo de evento em vez de só por delta).
--
-- ESCALA: tabela simples (sem partição) — na faixa de tenants deste MVP
-- regional (centenas, não milhões), um índice por `(tenant_id, criado_em)`
-- é suficiente. Se o volume crescer muito (ex.: milhões de linhas/mês),
-- a evolução recomendada é `partition by range (criado_em)` mensal — ver
-- `docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md` para o gatilho exato
-- e o passo a passo; não implementado agora de propósito (não desenhar
-- para um volume que ainda não existe).

create table public.progressao_eventos_log (
  id              bigint generated always as identity primary key,
  tenant_id       bigint not null references public.negocios (id) on delete cascade,
  origem          text not null default 'nao_rotulado',
  xp_delta        integer not null default 0,
  moeda_delta     integer not null default 0,
  -- só os eixos que de fato mudaram, ex.: {"tecnologia": 3, "aquisicao": 1}
  atributos_delta jsonb not null default '{}'::jsonb,
  degrau_anterior smallint,
  degrau_novo     smallint,
  criado_em       timestamptz not null default now()
);

create index progressao_eventos_log_tenant_idx
  on public.progressao_eventos_log (tenant_id, criado_em desc);

alter table public.progressao_eventos_log enable row level security;
alter table public.progressao_eventos_log force row level security;

create policy progressao_eventos_log_leitura_propria on public.progressao_eventos_log
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Sem policy de insert/update/delete para nenhum role — a única via de
-- escrita é o trigger abaixo, que roda com o privilégio do dono da tabela
-- (comportamento padrão de trigger function, não precisa de
-- `security definer` explícito) e por isso nunca é bloqueado pela RLS.

create or replace function private.registrar_progresso_log()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_atributos jsonb := '{}'::jsonb;
begin
  if new.tecnologia <> old.tecnologia then
    v_atributos := v_atributos || jsonb_build_object('tecnologia', new.tecnologia - old.tecnologia);
  end if;
  if new.processo <> old.processo then
    v_atributos := v_atributos || jsonb_build_object('processo', new.processo - old.processo);
  end if;
  if new.presenca <> old.presenca then
    v_atributos := v_atributos || jsonb_build_object('presenca', new.presenca - old.presenca);
  end if;
  if new.aquisicao <> old.aquisicao then
    v_atributos := v_atributos || jsonb_build_object('aquisicao', new.aquisicao - old.aquisicao);
  end if;
  if new.capacidade <> old.capacidade then
    v_atributos := v_atributos || jsonb_build_object('capacidade', new.capacidade - old.capacidade);
  end if;

  -- nada de progressão mudou (ex.: update só tocou perfil_publico) — não
  -- gera linha nenhuma no ledger.
  if new.xp = old.xp
     and new.moeda_virtual = old.moeda_virtual
     and new.degrau_atual = old.degrau_atual
     and v_atributos = '{}'::jsonb
  then
    return new;
  end if;

  insert into public.progressao_eventos_log (
    tenant_id, origem, xp_delta, moeda_delta, atributos_delta,
    degrau_anterior, degrau_novo
  )
  values (
    new.id,
    coalesce(nullif(current_setting('gamehub.origem', true), ''), 'nao_rotulado'),
    new.xp - old.xp,
    new.moeda_virtual - old.moeda_virtual,
    v_atributos,
    old.degrau_atual,
    new.degrau_atual
  );

  return new;
end;
$$;

create trigger negocios_registrar_progresso_log
  after update on public.negocios
  for each row
  execute function private.registrar_progresso_log();
