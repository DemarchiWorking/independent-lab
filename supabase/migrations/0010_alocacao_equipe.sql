-- ============================================================================
-- Alocação de equipe (GH-EQP-01): um Funcionário de IA (e, no futuro, humano)
-- fica indisponível enquanto alocado numa entrega, pelo prazo estimado.
--
-- "Livre" é DERIVADO na leitura (`expira_em` no passado) — nenhum cron nem
-- job de fundo libera nada; mesmo princípio "relógio lazy" já usado em
-- atributos (0005) e história (0007). Por isso a tabela guarda uma linha por
-- funcionário (PK = funcionario_id), sobrescrita a cada nova alocação — é
-- log de "estado atual", não histórico append-only (YAGNI por ora).
-- ============================================================================

create table public.alocacoes (
  funcionario_id bigint primary key
                  references public.funcionarios_contratados (id) on delete cascade,
  tenant_id      bigint not null references public.negocios (id) on delete cascade,
  job_id         text not null,
  alocado_em     timestamptz not null default now(),
  expira_em      timestamptz not null
);
create index alocacoes_tenant_id_idx on public.alocacoes (tenant_id);

alter table public.alocacoes enable row level security;
alter table public.alocacoes force row level security;

-- Privado ao tenant (dado operacional — quem está ocupado com o quê).
create policy alocacoes_leitura_propria on public.alocacoes
  for select to authenticated
  using (tenant_id = (select private.tenant_atual()));

-- Sem policy de insert/update: escrita só via RPC (service_role), abaixo.

-- ---------------------------------------------------------------------------
-- alocar_funcionario — atômica: um advisory lock por funcionário serializa
-- duas tentativas concorrentes de alocar o MESMO recurso (mesma técnica já
-- usada em criar_negocio_com_lote/0001 para o advisory lock por bairro).
--
-- Não dá pra usar só `unique(funcionario_id)` como guarda: a linha PRECISA
-- sobreviver depois de expirar (para o histórico "última alocação"), então
-- reservar de novo é um UPDATE da mesma linha, não um INSERT — e só o lock
-- explícito evita a corrida de "os dois viram livre ao mesmo tempo e os dois
-- inserem".
-- ---------------------------------------------------------------------------
create or replace function public.alocar_funcionario(
  p_tenant_id      bigint,
  p_funcionario_id bigint,
  p_job_id         text,
  p_dias           smallint
)
returns setof public.alocacoes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expira_atual timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('alocar_funcionario:' || p_funcionario_id, 0));

  select expira_em into v_expira_atual
  from public.alocacoes
  where funcionario_id = p_funcionario_id;

  if v_expira_atual is not null and v_expira_atual > now() then
    raise exception 'funcionario_ocupado';
  end if;

  return query
  insert into public.alocacoes (funcionario_id, tenant_id, job_id, alocado_em, expira_em)
  values (p_funcionario_id, p_tenant_id, p_job_id, now(), now() + make_interval(days => p_dias))
  on conflict (funcionario_id) do update
    set tenant_id  = excluded.tenant_id,
        job_id     = excluded.job_id,
        alocado_em = excluded.alocado_em,
        expira_em  = excluded.expira_em
  returning *;
end;
$$;

revoke execute on function public.alocar_funcionario(bigint, bigint, text, smallint)
  from public, anon, authenticated;
grant execute on function public.alocar_funcionario(bigint, bigint, text, smallint)
  to service_role;
