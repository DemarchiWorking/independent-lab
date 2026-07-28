# Índice de documentação — labdatadev-gamehub

> Comece por **[`ESTADO-DO-PROJETO.md`](ESTADO-DO-PROJETO.md)** se está
> retomando o trabalho — ele resume o que está pronto e por onde continuar.

## 🎯 Começar por aqui

| Documento | Quando ler |
|---|---|
| [ESTADO-DO-PROJETO.md](ESTADO-DO-PROJETO.md) | **Sempre primeiro**, ao retomar |
| [BACKLOG-PRODUTO.md](BACKLOG-PRODUTO.md) | 🎯 **O que fazer agora** — 33 cards priorizados, um por vez |
| [PRODUTO-IA-FUNCIONARIOS.md](PRODUTO-IA-FUNCIONARIOS.md) | Entender o produto atual (o pivot) |
| [analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md](analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md) | **Antes de implementar qualquer feature de jogo** |

## 🎮 Análise de referência e motor de jogo

| Documento | Conteúdo |
|---|---|
| [analise-prints/01-INDICE-MESTRE.md](analise-prints/01-INDICE-MESTRE.md) | Os 56 prints do Startup Panic transcritos e categorizados |
| [analise-prints/telas/economia-de-atributos.md](analise-prints/telas/economia-de-atributos.md) | 🔑 O sistema T/U/A que amarra toda a gamificação |
| [world/ARQUITETURA-WORLD.md](world/ARQUITETURA-WORLD.md) | O World — sede navegável, mobília, comprar/alugar |
| [world/MAPA-MUNDI-VALE-DO-CAFE.md](world/MAPA-MUNDI-VALE-DO-CAFE.md) | Mapa multi-tenant, pontos por empresa, zoom por camadas |
| [menu-inicial/ARQUITETURA-MENU-INICIAL.md](menu-inicial/ARQUITETURA-MENU-INICIAL.md) | A navegação atual e onde o World se pluga |

## 💼 Negócio & produto

| Documento | Conteúdo |
|---|---|
| [PRODUTO-IA-FUNCIONARIOS.md](PRODUTO-IA-FUNCIONARIOS.md) | Funcionários de IA — catálogo, preço, fluxo de orçamento |
| [CONTEXTO-NEGOCIO.md](CONTEXTO-NEGOCIO.md) | Modelo de negócio geral, ICP, monetização, riscos |
| [CONCEITO.md](CONCEITO.md) | Visão de produto e game design (metaverso) |

## 🏗️ Arquitetura & dados

| Documento | Conteúdo |
|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | Stack e arquitetura geral |
| [ARQUITETURA-MULTITENANT.md](ARQUITETURA-MULTITENANT.md) | Cadastro, login, multi-tenancy, Supabase, mapa regional |
| [GAMIFICACAO.md](GAMIFICACAO.md) | Motor de XP, eventos, missões, loop de recompensa |
| [database/SCHEMA-PARCEIROS-REGIONAL.md](database/SCHEMA-PARCEIROS-REGIONAL.md) | Modelo conceitual de parceiros/deals/parcerias |

## 🎨 Design

| Documento | Conteúdo |
|---|---|
| [design/DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md) | Tokens, paleta, componentes |
| [design/ANALISE-STARTUP-PANIC.md](design/ANALISE-STARTUP-PANIC.md) | Referência visual (prints analisados) |
| [design/MAPA-DE-TELAS.md](design/MAPA-DE-TELAS.md) | Todos os contextos de tela mapeados |
| [design/SCREENS-INVENTORY.md](design/SCREENS-INVENTORY.md) | Inventário de telas × features |
| [design/ONBOARDING-10-PERGUNTAS.md](design/ONBOARDING-10-PERGUNTAS.md) | As 10 perguntas do cadastro |

## ♻️ Operação & deploy

| Local | Conteúdo |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Runbook operacional — lido automaticamente pelo Claude Code (local e na VPS) |
| [`../deploy/README.md`](../deploy/README.md) | Guia humano de deploy na VPS (Nginx + PM2) |
| [`../melhoria-continua/`](../melhoria-continua/README.md) | Playbooks de serviço, retros de 90 dias |
| [`../supabase/migrations/`](../supabase/migrations/) | Schema SQL, RLS, RPCs |
| [`../.env.example`](../.env.example) | Variáveis de ambiente |

## Ordem de leitura sugerida (primeira vez no projeto)

1. [ESTADO-DO-PROJETO.md](ESTADO-DO-PROJETO.md) — onde estamos
2. [PRODUTO-IA-FUNCIONARIOS.md](PRODUTO-IA-FUNCIONARIOS.md) — o que vendemos
3. [CONTEXTO-NEGOCIO.md](CONTEXTO-NEGOCIO.md) — por que e para quem
4. [ARQUITETURA-MULTITENANT.md](ARQUITETURA-MULTITENANT.md) — como os dados funcionam
5. [GAMIFICACAO.md](GAMIFICACAO.md) — como o jogo motiva o negócio
