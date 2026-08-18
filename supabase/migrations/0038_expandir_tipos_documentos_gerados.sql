-- GH-DOC-01 — expande o corpus de documentos gerados por rodada de 2 para 6
-- tipos (Canvas + Modelo de Negócio já existiam; adiciona SWOT, Resumo
-- Executivo, Roadmap de Melhoria Contínua e Proposta Comercial — ver
-- document-engine/knowledge-base/01-corpus-oficial-gamehub.md, seção
-- "Escopo atual de geração").
--
-- Só altera o `check` de `documentos_gerados.tipo` — aditivo, não quebra
-- nenhuma linha já gravada (os 2 tipos antigos continuam válidos).

alter table public.documentos_gerados
  drop constraint documentos_gerados_tipo_check;

alter table public.documentos_gerados
  add constraint documentos_gerados_tipo_check
  check (tipo in (
    'canvas',
    'modelo-negocio',
    'swot',
    'resumo-executivo',
    'roadmap-melhoria-continua',
    'proposta-comercial'
  ));
