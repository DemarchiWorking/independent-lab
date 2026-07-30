-- ============================================================================
-- Corrige o CHECK de `segmento` para o ICP REAL (GH-OPS bloco 1, M-1).
--
-- O CHECK original de 0001_init.sql permitia
-- ('imobiliaria','construtora','loteadora','comercio','servico','outro') —
-- valores de um pivot de produto anterior. O cadastro de hoje
-- (src/lib/db/types.ts `Segmento`, features/onboarding/perguntas.ts) sempre
-- ofereceu ('engenharia','contabilidade','saude','tecnologia','alimentacao',
-- 'comercio','servico','outro'). Só 3 dos 8 valores coincidiam — as outras 5
-- opções (exatamente o ICP real: engenharia, contabilidade, saúde,
-- tecnologia, alimentação) violavam o CHECK dentro de
-- `criar_negocio_com_lote` e o cadastro falhava sem nunca ter sido detectado,
-- porque `GAMEHUB_DB=file` (o padrão local) não passa por este CHECK.
--
-- Sem nome explícito no CHECK de 0001, o Postgres usa a convenção
-- `<tabela>_<coluna>_check`. Em vez de arriscar esse nome auto-gerado (que
-- pode variar entre instalações), a migration DESCOBRE o nome real via
-- catálogo e o remove por ele — robusto a qualquer nome, inclusive se um dia
-- alguém rodar as migrations fora de ordem.
-- ============================================================================

do $$
declare
  v_nome_constraint text;
begin
  select con.conname into v_nome_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  join pg_attribute att on att.attrelid = rel.oid
                       and att.attnum = any (con.conkey)
  where nsp.nspname = 'public'
    and rel.relname = 'negocios'
    and att.attname = 'segmento'
    and con.contype = 'c'
  limit 1;

  if v_nome_constraint is not null then
    execute format('alter table public.negocios drop constraint %I', v_nome_constraint);
  end if;
end $$;

alter table public.negocios
  add constraint negocios_segmento_check check (
    segmento in (
      'engenharia', 'contabilidade', 'saude', 'tecnologia',
      'alimentacao', 'comercio', 'servico', 'outro'
    )
  );

comment on constraint negocios_segmento_check on public.negocios is
  'Espelha src/lib/db/types.ts (Segmento) — mudar os dois juntos. '
  'Testado em src/lib/db/segmento.test.ts (compara a união TS com esta lista).';
