-- ============================================================================
-- Corrige a recompensa duplicada (GH-OPS Bloco 3, M-10).
--
-- O problema: `recompensar()` (features/gamificacao/actions.ts) faz um
-- pré-check ("já aceitou esse job?") e DEPOIS chama `aceitar_trabalho` — dois
-- round trips. Se duas requisições chegarem quase juntas (duplo-clique,
-- reenvio de formulário, retry de rede), as duas passam pelo pré-check ANTES
-- de qualquer uma escrever, e as duas recebem de volta um `aceitar_trabalho`
-- "bem-sucedido" — uma porque criou a linha, a outra porque a função já era
-- idempotente e devolveu a linha da primeira. Só que `recompensar()` não
-- tinha como DISTINGUIR os dois casos, e pagava XP/moeda nos dois.
--
-- A garantia de não duplicar a LINHA sempre existiu (`unique(tenant_id,
-- job_id)`, 0008). O que faltava era o retorno dizer se a chamada CRIOU a
-- linha ou só encontrou uma já existente — só assim o chamador sabe se deve
-- pagar.
--
-- `contratar_funcionario` (equipe-ia) tem o mesmo problema, mas nunca teve
-- RPC — era `upsert` direto do client Supabase em `supabase-adapter.ts`. Essa
-- parte foi resolvida em código (insert puro + captura de SQLSTATE 23505),
-- sem precisar de migration; só `aceitar_trabalho`, por ser RPC, precisa
-- mudar de retorno aqui.
-- ============================================================================

drop function if exists public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
);

create function public.aceitar_trabalho(
  p_tenant_id      bigint,
  p_job_id         text,
  p_min_tecnologia smallint default 0,
  p_min_processo   smallint default 0,
  p_min_presenca   smallint default 0,
  p_min_aquisicao  smallint default 0,
  p_min_capacidade smallint default 0
)
returns table (
  id         bigint,
  tenant_id  bigint,
  job_id     text,
  aceito_em  timestamptz,
  -- `true` quando a linha JÁ existia antes desta chamada (idempotência —
  -- sequencial ou por corrida genuína). O chamador só paga XP/moeda quando
  -- `false`.
  ja_existia boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio   public.negocios;
  v_existente public.trabalhos_aceitos;
begin
  -- Caminho sequencial: a chamada anterior já commitou. Continua idempotente
  -- SEM reavaliar requisito (o direito já foi concedido; ver comentário
  -- original em 0012).
  select * into v_existente from public.trabalhos_aceitos
  where tenant_id = p_tenant_id and job_id = p_job_id;
  if found then
    return query
    select v_existente.id, v_existente.tenant_id, v_existente.job_id,
           v_existente.aceito_em, true;
    return;
  end if;

  select * into v_negocio from public.negocios where id = p_tenant_id;
  if not found then
    raise exception 'negocio_nao_encontrado';
  end if;

  if v_negocio.tecnologia < p_min_tecnologia
     or v_negocio.processo   < p_min_processo
     or v_negocio.presenca   < p_min_presenca
     or v_negocio.aquisicao  < p_min_aquisicao
     or v_negocio.capacidade < p_min_capacidade then
    raise exception 'atributo_insuficiente';
  end if;

  return query
  insert into public.trabalhos_aceitos (tenant_id, job_id)
  values (p_tenant_id, p_job_id)
  returning id, tenant_id, job_id, aceito_em, false;

exception
  when unique_violation then
    -- Caminho concorrente de verdade: outra transação inseriu ENTRE o nosso
    -- SELECT e o nosso INSERT (READ COMMITTED não impede isso — é o próprio
    -- caso que este bloco existe para cobrir). PL/pgSQL cria um savepoint
    -- implícito para o bloco com EXCEPTION; ao cair aqui, o INSERT que
    -- falhou já foi desfeito, e devolvemos a linha do vencedor da corrida em
    -- vez de propagar o erro — mesma garantia do caminho sequencial acima,
    -- só que para o caso raro de concorrência real.
    return query
    select t.id, t.tenant_id, t.job_id, t.aceito_em, true
    from public.trabalhos_aceitos t
    where t.tenant_id = p_tenant_id and t.job_id = p_job_id;
end;
$$;

revoke execute on function public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
) from public, anon, authenticated;
grant execute on function public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
) to service_role;

comment on function public.aceitar_trabalho(
  bigint, text, smallint, smallint, smallint, smallint, smallint
) is
  'Retorna `ja_existia` (GH-OPS M-10) — o chamador só paga XP/moeda quando '
  'false. Sem teste automatizado de concorrência real contra Postgres '
  '(exigiria banco vivo, fora do que os testes deste projeto cobrem — só '
  'função pura). Verificação manual: docs/deploy/05-MULTIPLAYER-E-ESCALA.md '
  '§Recompensa duplicada — dois cliques rápidos no mesmo job/cargo só pagam '
  'XP/moeda uma vez.';
