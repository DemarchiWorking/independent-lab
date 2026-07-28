-- ============================================================================
-- Corrige `negocios.segmento` — a constraint CHECK ficou presa aos segmentos
-- antigos (imobiliaria/construtora/loteadora), da persona original de
-- imobiliárias. O tipo `Segmento` em `src/lib/db/types.ts` já foi migrado
-- para o ICP real do labdatadev/Siga Pregão (commit 1ddc7e2, "nichos e
-- clientes-alvo reais") — engenharia/contabilidade/saude/tecnologia/
-- alimentacao/comercio/servico/outro — mas nenhuma migration acompanhou.
-- Bug real, não só desatualização de doc: em modo `GAMEHUB_DB=supabase`,
-- cadastro com qualquer um dos 5 segmentos novos falha na constraint.
--
-- Busca o nome real da constraint via `pg_constraint` em vez de assumir o
-- nome auto-gerado (`negocios_segmento_check`) — mais robusto se o nome
-- tiver sido outro por algum motivo.
-- ============================================================================

do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.negocios'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%segmento%';

  if v_constraint is not null then
    execute format('alter table public.negocios drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.negocios
  add constraint negocios_segmento_check
  check (segmento in (
    'engenharia', 'contabilidade', 'saude', 'tecnologia',
    'alimentacao', 'comercio', 'servico', 'outro'
  ));
