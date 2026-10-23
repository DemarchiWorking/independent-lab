# labdatadev-gamehub Document Engine — Contexto Operacional (GH-DOC-01)

Esteira automatizada de geração de documentação de negócio (Business Model
Canvas + Modelo de Negócio) para cada tenant (negócio) do
[`labdatadev-gamehub`](..) que pediu geração pelo botão "Gerar / atualizar"
em `/painel` (`src/features/documentos-gerados/`).

Mesmo padrão arquitetural do document-engine do V4mos
(`/opt/v4mos/document-engine/`), adaptado a uma diferença de design
importante: **aqui a fila é explícita e a ficha já vem pronta**. O app
Next.js monta a ficha completa (`contexto_snapshot`, markdown) e enfileira
via RPC `enfileirar_geracao_documento` (idempotente por hash — ver
`supabase/migrations/0037_fila_geracao_documentos.sql`) — este motor só
**drena a fila** (`fila_geracao_documentos` com `status = 'pendente'`), não
escaneia formulários nem recalcula hash.

## O que existe aqui

```
document-engine/
├── CLAUDE.md                 ← este arquivo
├── knowledge-base/           ← metodologia (corpus oficial, BMC + OFC + escada de valor do gamehub) — leia tudo antes de gerar
├── clients/                  ← rascunho de cada rodada (uma pasta por tenant_id-fila_id), não versionado
├── scripts/
│   ├── scan-and-generate.mjs ← engine principal: drena a fila, chama o Claude Code, grava documentos_gerados
│   └── lib/                  ← helpers (REST client do Supabase, env loader, prompt builder)
├── cron/run-hourly.sh        ← wrapper chamado pelo cron (a cada hora, minuto 0)
└── logs/                     ← log de cada execução (manual ou cron), um arquivo por dia
```

## Fonte de dados

Supabase self-hosted **próprio do gamehub** (`deploy/supabase/`, containers
`gamehub-supabase-*`), Kong publicado em `127.0.0.1:8010` — **não** é o
mesmo stack Supabase do Company HQ nem do V4mos. Credenciais (service role
key) vêm de `../.env` (raiz do app Next.js) — **nunca duplicar a chave
neste diretório**.

Tabelas relevantes (`supabase/migrations/0037_fila_geracao_documentos.sql`):
- `fila_geracao_documentos` — um item por rodada pedida (`tenant_id`,
  `status`, `contexto_snapshot` = a ficha em markdown, `hash_contexto`,
  `tentativas`). Só `service_role` enxerga (sem policy de select para
  anon/authenticated).
- `documentos_gerados` — onde o resultado é gravado. Cada rodada INSERE
  linhas novas (nunca sobrescreve) — histórico de versões vive na tabela.
  O próprio tenant lê os seus via RLS (`tenant_id = private.tenant_atual()`).

**Critério de elegibilidade:** só processa itens com `status = 'pendente'`.
Itens `processando` travados (motor morto no meio de uma rodada) ficam de
fora de propósito — não há retry automático sem teto; decida manualmente
(`node scripts/scan-and-generate.mjs` de novo já resolve a maioria dos casos,
porque o próximo pedido do usuário gera um item novo).

## Como executar

### Modo automático (cron)
`cron/run-hourly.sh`, instalado no crontab do root para rodar a cada hora
(minuto 0). Log de cada rodada em `logs/YYYY-MM-DD.log`.

### Modo manual (linha de comando)
```bash
cd /root/labdatadev-gamehub/document-engine
node scripts/scan-and-generate.mjs
```
Processa todos os itens `pendente` da fila agora, sem esperar a próxima
hora cheia.

### Modo manual (interativo, dentro de uma sessão Claude Code aberta aqui)
Se o usuário pedir "roda a fila de documentação agora" ou "gera a
documentação do negócio X": rode `node scripts/scan-and-generate.mjs`
primeiro — ele já faz o trabalho pesado. Se precisar investigar um item
específico sem depender do script, consulte a fila via
`docker exec gamehub-supabase-db psql -U postgres -d postgres -c "select id, tenant_id, status, tentativas, erro from fila_geracao_documentos order by criado_em desc limit 20;"`.

## Estrutura de saída por rodada (`clients/<tenant_id>-<fila_id>/`)

**Escopo atual: 7 documentos** (expandido de 2 para 6 na migration `0038`,
depois para 7 na migration `0039` — ver
`knowledge-base/01-corpus-oficial-gamehub.md`, seção "Escopo atual de
geração", e `knowledge-base/00-INDEX.md` para o arquivo de metodologia de
cada um).

- `context-ficha.md` — a ficha recebida da fila (cópia do `contexto_snapshot`, para auditoria)
- `context-concorrentes.md` — concorrentes REAIS (mesmo segmento + cidade, `perfil_publico = true`) via RPC `concorrentes_regiao` (migration 0039), ou o aviso de lista vazia
- `01-business-model-canvas.md` — 9 blocos, ordem oficial 5→4→6→7→9→2→1→3→8
- `02-modelo-de-negocio.md` — posicionamento OFC + escada de valor do gamehub + unit economics + próximas ações (contém "Notas de Versão", append-only)
- `03-analise-swot.md` — SWOT cruzada (matriz Ofensiva/Reforço/Confronto/Defensiva), ancorada nos 5 atributos e no degrau da ficha
- `04-resumo-executivo.md` — 1 página standalone, sem jargão de jogo, para o dono mostrar a alguém de fora
- `05-roadmap-melhoria-continua.md` — pipeline Kaizen ancorado nos 5 atributos, com "Histórico de Revisões" (append-only)
- `06-proposta-comercial.md` — peça de venda do tenant para os clientes DELE, baseada nas ofertas reais da vitrine
- `07-analise-concorrencia.md` — comparação com os concorrentes reais de `context-concorrentes.md`, nunca concorrente inventado

Custo por rodada é proporcionalmente maior (7 documentos em vez de 2, mesma
chamada `claude -p`) — timeout do motor subiu de 15 para 25 min (migration
0038) e depois para 30 min (migration 0039) por negócio
(`scan-and-generate.mjs`, `CLAUDE_TIMEOUT_MS`) para dar folga.

Estes arquivos em `clients/` são só rascunho de trabalho — a fonte da
verdade entregue ao usuário é `documentos_gerados` no Postgres,
lido pelo `/painel` via `listarMeusDocumentos`.

## Regras inegociáveis

1. **Nunca inventar dados financeiros ou de mercado** que a ficha não forneceu — estimativas sempre rotuladas `[HIPÓTESE]` com a lógica exposta.
2. **Nunca misturar moeda virtual do jogo (🪙/XP) com R$ real** — ver `docs/CONTEXTO-NEGOCIO.md`/`AGENTS.md` do app: essa regra é não-negociável em todo o produto, não só aqui.
3. **Nunca sobrescrever o histórico de rodadas** de um tenant já processado — cada rodada é uma linha nova em `documentos_gerados`.
4. **Nunca processar item que não esteja `pendente`.**
5. **Custo de API**: cada item roda `claude -p` (modelo Sonnet) com permissão restrita a `Read Write` dentro da pasta do cliente. A fila já é o controle de volume — não rode em loop desnecessário.

## Onde reportar problemas / evoluir o sistema

Atualizar este `CLAUDE.md` e `knowledge-base/01-corpus-oficial-gamehub.md`
conforme o Laboratório Demarchi aprender novas práticas com negócios reais
do gamehub.
