# 02 · Siga Pregão e o ecossistema de licitações (B2G)

**Fonte:** `claude-code/shalon/*` e `claude-code/ambiente-producao/` (estudo
estático). É o produto-carro-chefe da B2G Marketing / Siga Pregão — vender para
o **governo** via licitações públicas (compras.gov.br / PNCP / Comprasnet).

Este "app" é na verdade um **conjunto de subprojetos** em maturidades
diferentes. Documento cada um e depois como se juntam num único app do jogo.

## Objetivo (do ecossistema)

Levar um MEI/PME de "não vende para o governo" até "ganha licitações
públicas": descobrir editais, entender o pregão, cadastrar proposta e
acompanhar a sessão — com automação e IA reduzindo o trabalho manual.

## Subprojetos

### A · `sigapregao` — Landing page (Next.js 15)
- **Objetivo:** capturar interesse e explicar o SaaS.
- **Telas:** `app/page.tsx` — landing única (hero, features, prova social,
  pricing, CTA).
- **RF-01:** apresentar proposta de valor + planos; CTA de cadastro/contato.
- **Estado:** no ar (marca Siga Pregão, tokens `#080e1d`/`#00d4c8`).

### B · `shalon-mvp` — Marca própria → governo (Flask · Docker)
- **Objetivo:** microserviço que leva o cliente do **produto de marca própria**
  (Etapa 1) à **venda para o governo** (Etapa 2, premium), com base para robô +
  IA agêntica + resolvedor de captcha.
- **RF-02:** Etapa 1 — cadastro/curadoria de produto de marca própria.
- **RF-03:** Etapa 2 (premium) — pipeline de licitação em compras.gov.br.
- **Estado:** MVP Flask dockerizado (Caddy + compose de produção).

### C · `licitapro` (LICITA.PRO) — protótipo de área de membros
- **Objetivo:** landing de evento sobre licitações + área de membros com
  catálogo de **importação da China** e conteúdo **premium**. HTML+Tailwind+
  localStorage, zero build — serve de **input de prompt** para a versão
  React/Next futura.
- **Telas:** `index.html` (landing), `licitacoes.html` (lista de editais),
  `produtos.html` (catálogo de importação), `login.html`, `admin.html`.
  - **RF-04 (index):** apresentar o evento/oferta e capturar lead.
  - **RF-05 (licitacoes):** listar editais com filtro/busca.
  - **RF-06 (produtos):** catálogo de produtos importáveis com preço/margem.
  - **RF-07 (login):** autenticação simples (localStorage no protótipo).
  - **RF-08 (admin):** CRUD de conteúdo premium/produtos.

### D · `ambiente-producao` — Robô de Licitações (Go + Python)
- **Objetivo:** coleta de alto volume e operação em licitações federais.
- **Arquitetura:** `collector-go` (APIs oficiais PNCP / dadosabertos) →
  `scraper-py` (Scrapy, páginas sem API) → `rpa-py` (Playwright: login gov.br,
  cadastrar proposta, acompanhar sessão) → PostgreSQL + Redis + `web`.
  - **RF-09:** coletar editais via APIs oficiais (alto volume).
  - **RF-10:** scraping de detalhe/atas/anexos onde não há API.
  - **RF-11:** RPA de fluxos autenticados (proposta, acompanhamento).
  - **RF-12:** persistir em Postgres e orquestrar por filas (Redis).
- **Estado:** ambiente de produção (backend de dados; não tem UI de jogo).

### E · `automacao-licita` — scraper Python de comprasnet
- **Objetivo:** coletor/estado de comprasnet (`comprasnet.py`, `main.py`).
- **Estado:** script; alimenta o mesmo pipeline de dados.

## Papel no jogo

**App "🏛️ Siga Pregão" — o produto B2G dentro do escritório.** É o degrau mais
"avançado" do jogador: representa uma empresa madura o suficiente para vender
ao setor público.

- **Integração N2 (curto prazo):** janela embutida com a landing (subprojeto A)
  + um "mural de editais" com dados **mockados** (ou já reais, vindos do
  pipeline D) — só leitura, para o efeito "uau" no pitch.
- **Integração N3 (produto):** mini-app nativo `features/licitacoes/` que lê
  editais do Supabase (populados pelo robô D) e deixa o jogador "simular"
  participar de um pregão como missão de gamificação.
- **Gating:** liberar num degrau alto (empresa "pronta para o governo"); a
  chegada do app pode ser uma conquista narrativa forte.

## Requisitos de integração

- **RI-01:** o robô (D/E) e o app do jogo **não compartilham processo** — o
  jogo só **lê** um read model (tabela/edital resumido), nunca dispara RPA.
- **RI-02:** dado de licitação é público, mas credenciais gov.br **jamais**
  entram no jogo (regra de ação proibida: nunca inserir credenciais).
- **RI-03:** se o mural for N3, seguir o padrão de RLS + `unstable_cache` já
  usado no mapa regional; editais são read-only para o jogador.
- **RI-04:** moeda do jogo (🪙) nunca sugere compra real de plano Siga Pregão —
  CTA de assinatura é link externo explícito.
