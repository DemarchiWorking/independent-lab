# Banco de Dados Regional de Parceiros — labdatadev-gamehub

> ⚠️ **Nota (2026-08-01): rascunho conceitual superado pelo schema real.**
> Nenhuma das tabelas abaixo (`partners`, `services`, `deals`,
> `partnerships`, `game_state`, `improvement_logs`) foi implementada como
> descrito aqui. O schema efetivamente aplicado (`supabase/migrations/0001`
> a `0030`) usa `negocios`/`membros`/`onboardings`/etc., com `bigint
> identity` em vez de `uuid` e nomenclatura diferente — ver
> [`docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md`](../architecture/DBA-ARQUITETURA-ESCALA-2026.md)
> para o estado real e o roadmap atual. O conceito de `deals` (§ desta
> página) foi implementado com outro nome e forma em
> `solicitacoes_orcamento` (migration `0027`, card `GH-COM-01`). Mantido
> abaixo por valor histórico — não usar como referência de schema atual.

> Base **regional** (Vale do Café / mercado imobiliário) com informações dos
> parceiros reais. Alimenta o hub (salas), o marketplace e a árvore de parceiros.
> Backend: **Supabase (Postgres)**. Rascunho v1 — evoluir com o produto.

---

## 1. Visão

Cada **parceiro** é uma empresa/profissional real da região que entra no hub como
uma "sala"/empresa jogável. O banco guarda dados cadastrais, de relacionamento,
de serviços e de parceria — separando sempre **estado do jogo** de **dado real**.

## 2. Entidades principais

### `partners` — parceiro (empresa regional)
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `nome` | text | razão/nome comercial |
| `segmento` | enum | imobiliaria, construtora, loteadora, contabilidade, outro |
| `cidade` | text | ex.: Vassouras, Barra do Piraí |
| `regiao` | text | ex.: Vale do Café |
| `cnpj` | text | opcional; validar |
| `contato_json` | jsonb | telefone, email, whatsapp, site, instagram |
| `logo_url` | text | avatar/sala no hub |
| `reputacao` | numeric | 0–5 (avaliações reais) |
| `status` | enum | prospect, ativo, parceiro, inativo |
| `criado_em` | timestamptz | |

### `services` — catálogo de serviços de TI (labdatadev)
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `titulo` | text | ex.: "Migração Excel → SQL Server" |
| `categoria` | enum | automacao, dados, web, infra, bi, integracao, uxui |
| `descricao` | text | |
| `preco_base` | numeric | R$ (real) |
| `tempo_estimado_dias` | int | |
| `pontuacao_min` | int | requisito (gamificação) |

### `deals` — negócio/contratação real
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `partner_id` | uuid FK → partners | |
| `service_id` | uuid FK → services | |
| `valor` | numeric | R$ fechado |
| `status` | enum | orcamento, aceito, entrega, concluido, cancelado |
| `origem` | enum | hub, indicacao, marketplace, direto |
| `referrer_partner_id` | uuid FK null | quem indicou (parceria) |
| `sla_json` | jsonb | prazos, marcos |
| `criado_em` | timestamptz | |

### `partnerships` — parcerias entre players
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `partner_a` / `partner_b` | uuid FK | |
| `tipo` | enum | indicacao, revenda, cooferta, alianca |
| `comissao_pct` | numeric | % rastreado |
| `status` | enum | proposta, ativa, encerrada |

### `game_state` — estado de jogo do parceiro (separado do real)
| Campo | Tipo | Nota |
|---|---|---|
| `partner_id` | uuid FK PK | |
| `nivel` | int | |
| `xp` | int | |
| `moeda_virtual` | int | 🪙 (nunca = R$) |
| `sala_json` | jsonb | layout/cosmético da sala |
| `conquistas` | jsonb | |

### `improvement_logs` — melhoria contínua (ciclo 90 dias)
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `partner_id` | uuid FK null | null = interno labdatadev |
| `ciclo` | text | ex.: 2026-Q3 |
| `tipo` | enum | retro, feedback, processo, incidente |
| `resumo` | text | |
| `acao` | text | ação de melhoria |
| `arquivo_url` | text | anexo (pasta melhoria-continua) |

## 3. Relacionamentos

```
partners 1──* deals *──1 services
partners *──* partners (via partnerships)
partners 1──1 game_state
partners 1──* improvement_logs
deals *──1 partners (referrer, parceria/indicação)
```

## 4. Regras & segurança

- **RLS (Row Level Security)** por parceiro/usuário no Supabase.
- **LGPD:** dados de contato só com consentimento; anonimizar em rankings.
- **Separação de moeda:** `moeda_virtual` (game_state) **jamais** conversível em
  `valor` (deals). Ver [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) §6.
- **Regionalização:** `regiao`/`cidade` indexados — expansão por região futura.

## 5. Próximo passo

Transcrever este rascunho em `migrations` SQL do Supabase quando a Fase 3
(marketplace real) começar. Semear `partners` com a base real do labdatadev.
