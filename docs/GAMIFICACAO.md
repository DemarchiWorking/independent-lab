# Motor de Gamificação

> Como as ações reais do cliente viram progresso no jogo — e como o jogo empurra
> o cliente para cima na escada de valor. Este é o **core loop** do produto.

## O loop central

```
   Missão (próximo degrau)  ──►  Ação real (fechar serviço, agendar…)
          ▲                              │
          │                              ▼
   Nova missão  ◄──  Recompensa (XP · moeda · degrau) + feedback animado
```

Boas práticas aplicadas: **uma meta clara por vez**, **recompensa imediata e
visível**, **progressão sem paredes** (custo por nível cresce linearmente) e
**alinhamento entre meta de jogo e meta de negócio** (a missão É o próximo
degrau da escada de valor).

## XP é a fonte única de verdade

O nível nunca é gravado "à mão" — é sempre derivado do XP, com a **mesma
fórmula** em dois lugares que devem permanecer idênticos:

| Onde | Arquivo |
|---|---|
| App (TypeScript) | [`src/lib/gamificacao.ts`](../src/lib/gamificacao.ts) |
| Banco (SQL) | `public.nivel_por_xp` em [`0001_init.sql`](../supabase/migrations/0001_init.sql) |

`limiar(n) = 50·(n-1)·n` → L1=0 · L2=100 · L3=300 · L4=600 · L5=1000…

O onboarding concede **XP de boas-vindas** proporcional ao fit (`score·8`), então
um cliente ideal já entra em um nível mais alto — de forma consistente, sem
número de nível solto.

## Catálogo de eventos

Recompensas são fixas e auditáveis em [`engine.ts`](../src/features/gamificacao/engine.ts)
(`EVENTOS`). A UI nunca escolhe valores — só dispara o evento.

| Evento | XP | Moeda | Sobe degrau |
|---|---|---|---|
| cadastro_completo | 50 | 0 | — |
| diagnostico_agendado | 80 | 100 | — |
| servico_contratado | 200 | 300 | ✅ |
| parceria_formada | 150 | 120 | — |
| oferta_publicada | 40 | 0 | — |
| retro_90d | 120 | 80 | — |

## Progressão atômica (nada de corrida)

`aplicarProgresso` **nunca** faz read-modify-write no cliente:

- **File adapter:** incrementa e regrava (processo único).
- **Supabase:** RPC `aplicar_progresso` faz `update … set xp = xp + delta` e
  recalcula o nível em SQL, numa única transação
  ([`0002_gamificacao.sql`](../supabase/migrations/0002_gamificacao.sql)).

A `server action` [`recompensar`](../src/features/gamificacao/actions.ts) lê a
sessão, escolhe o delta pelo catálogo e revalida `/hub` e `/painel`.

## Missões

[`missoes.ts`](../src/features/gamificacao/missoes.ts) deriva a missão atual do
estado do negócio: se ainda não chegou ao degrau-alvo do onboarding, a missão é
subir um degrau; ao chegar, vira retenção (retro de 90 dias). Sempre **uma** por vez.

## O loop fechado (mundo → ação → progresso → mundo)

Um único caminho de recompensa —
[`RecompensaProvider`](../src/features/gamificacao/RecompensaContext.tsx) —
envolve todo o `GameShell` e é usado por **toda** ação jogável:

| Tela | Ação | Evento disparado |
|---|---|---|
| Hub | Concluir missão | o `evento` da missão atual |
| Marketplace | "Aceitar trabalho" | `servico_contratado` (sobe degrau) |
| Árvore de parcerias | "Desbloquear serviço" | `servico_desbloqueado` |
| Mapa | "Formar parceria" com um vizinho | `parceria_formada` |

Cada disparo: chama a server action → toast celebratório (+XP, +🪙, "Nível N!",
"Degrau N!") → `router.refresh()`, que busca os dados do servidor de novo — HUD,
missão e mapa **se atualizam sozinhos**, sem estado duplicado no cliente.

Em modo demo (`/`, sem sessão) o mesmo botão mostra um toast convidando a
entrar, em vez de tentar persistir — nunca falha silenciosamente.

> Verificado via HTTP contra a **mesma server action de produção**: 1 evento
> `servico_contratado` levou XP 760→960, degrau 1→2, e a missão mudou sozinha
> de "Alcançar: Diagnóstico Técnico" para "Alcançar: Automação Essencial".

## Testes

`npm test` (Vitest) — 17 casos cobrindo a curva de XP (bordas exatas,
monotonicidade, clamp), a pureza e as transições do motor de eventos, e o
scoring do onboarding.
