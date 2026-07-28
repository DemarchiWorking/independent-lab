-- ============================================================================
-- Convite de vizinho com recompensa mútua (GH-GROW-02) — token assinado
-- (HMAC, verificado em `features/growth/convite.ts`, mesma técnica de
-- `lib/auth/sessao.ts`) gerado fora do banco; esta tabela só registra o
-- RESGATE (quando o convidado completa o cadastro), pra nunca recompensar
-- duas vezes e pra aplicar o teto anti-abuso por período.
-- ============================================================================

create table public.convites_resgatados (
  id                   bigint generated always as identity primary key,
  tenant_id_convidante bigint not null references public.negocios (id) on delete cascade,
  tenant_id_convidado  bigint not null references public.negocios (id) on delete cascade,
  resgatado_em         timestamptz not null default now(),
  -- um negócio convidado só resgata um convite (é criado uma vez só, faz
  -- sentido mesmo sem a unique, mas é rede de segurança barata)
  unique (tenant_id_convidado)
);
create index convites_resgatados_convidante_idx
  on public.convites_resgatados (tenant_id_convidante);

alter table public.convites_resgatados enable row level security;
alter table public.convites_resgatados force row level security;

create policy convites_leitura_propria on public.convites_resgatados
  for select to authenticated
  using (tenant_id_convidante = (select private.tenant_atual()));

-- Escrita só via RPC (service_role) — mesmo padrão de parcerias_formadas.
create or replace function public.resgatar_convite(
  p_tenant_id_convidante bigint,
  p_tenant_id_convidado  bigint,
  p_xp_convidante        integer,
  p_moeda_convidante     integer,
  p_xp_convidado         integer,
  p_moeda_convidado      integer
)
returns setof public.convites_resgatados
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.convites_resgatados
    where tenant_id_convidado = p_tenant_id_convidado
  ) then
    raise exception 'convite_ja_resgatado';
  end if;

  if p_xp_convidante <> 0 or p_moeda_convidante <> 0 then
    update public.negocios
    set xp            = xp + p_xp_convidante,
        moeda_virtual = moeda_virtual + p_moeda_convidante,
        nivel         = public.nivel_por_xp(xp + p_xp_convidante)
    where id = p_tenant_id_convidante;
  end if;

  update public.negocios
  set xp            = xp + p_xp_convidado,
      moeda_virtual = moeda_virtual + p_moeda_convidado,
      nivel         = public.nivel_por_xp(xp + p_xp_convidado)
  where id = p_tenant_id_convidado;

  return query
  insert into public.convites_resgatados (tenant_id_convidante, tenant_id_convidado)
  values (p_tenant_id_convidante, p_tenant_id_convidado)
  returning *;
end;
$$;

revoke execute on function public.resgatar_convite(
  bigint, bigint, integer, integer, integer, integer
) from public, anon, authenticated;
grant execute on function public.resgatar_convite(
  bigint, bigint, integer, integer, integer, integer
) to service_role;
