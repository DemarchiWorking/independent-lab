-- Cidades do ICP primário do Laboratório Demarchi (Vale do Café / Sul-RJ).
-- Ver labdatadev-context/03-market/icp_definition.md
--
-- ⚠️ ESPELHA src/lib/regiao.ts (fonte única no app). Este arquivo roda noutro
-- runtime (psql), por isso a duplicação é inevitável — ao adicionar uma
-- cidade, altere OS DOIS.
insert into public.cidades (slug, nome, prioritaria) values
  ('mendes',         'Mendes',         true),
  ('vassouras',      'Vassouras',      true),
  ('barra-do-pirai', 'Barra do Piraí', true),
  ('pirai',          'Piraí',          true),
  ('volta-redonda',  'Volta Redonda',  true),
  ('resende',        'Resende',        true),
  ('outra',          'Outra',          false)
on conflict (slug) do update
  set nome = excluded.nome,
      prioritaria = excluded.prioritaria;
