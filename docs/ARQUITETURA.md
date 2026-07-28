# Arquitetura — labdatadev-gamehub

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Padrão labdatadev; SSR + rotas file-based |
| Linguagem | **TypeScript strict** | Zero `any` (regra inegociável) |
| Estilo | **Tailwind CSS** | Cores só por token; mobile-first |
| Animação | **Framer Motion** | Navegação suave do hub |
| Backend/DB | **Supabase** (Postgres + Auth) | Estado do jogo, XP, progresso |
| Estado UI | **Zustand** | Estado do jogo no cliente (leve) |

## Camadas (regras de dependência)

```
app/         →  rotas finas, só orquestram (chamam features)
  ↓
features/    →  regra de negócio (hub, simulador, gamificacao)
  ↓
components/  →  UI reutilizável (design system) — NUNCA importa de features/
lib/         →  supabase, tipos, helpers puros
```

**Regra:** `components/ui` nunca importa de `features/`. Rotas em `app/` não
contêm lógica de negócio.

## Domínios (features/)

- **`hub/`** — o mapa/metaverso: zonas, navegação, layout do espaço.
- **`simulador/`** — motor de simulação: recursos, decisões, trade-offs, tick.
- **`gamificacao/`** — XP, níveis, missões, conquistas, regras de progressão.

## Modelo de dados (rascunho — Supabase)

| Tabela | Campos principais |
|---|---|
| `players` | id, user_id, nome_empresa, nivel, xp |
| `resources` | player_id, caixa, tempo, energia, reputacao |
| `zones` | id, chave (comercial, operacoes...), desbloqueada |
| `missions` | id, titulo, objetivo, recompensa_xp, status |
| `achievements` | id, player_id, chave, conquistado_em |
| `events` | id, player_id, tipo, origem (real/jogo), payload, criado_em |

## Convenções

- Cores **só por token** (Tailwind config / design tokens) — nunca hex avulso.
- Mobile-first (320px → desktop).
- `"use client"` só quando obrigatório (animação, interação, estado).
- `npx tsc --noEmit` antes de qualquer commit.

## Próximo passo técnico

Scaffold do Next.js dentro desta pasta:

```bash
npx create-next-app@latest . --ts --tailwind --app --src-dir --import-alias "@/*"
```

> Rodar **dentro** de `labdatadev-gamehub` (a estrutura de `src/` já foi pensada
> pra casar com o `--src-dir`).
