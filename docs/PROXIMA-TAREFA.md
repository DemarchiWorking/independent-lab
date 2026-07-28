# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28, commit `8700f22`. Se `git log -1` mostrar outro
> `HEAD`, confira `git status` antes de confiar neste arquivo — pode haver
> sessão concorrente em andamento (aconteceu duas vezes nesta pasta; ver
> [[concurrent-session-protocol]] na memória).

## Estado

MVP para pitch Sebrae. Commitado e com `npm run typecheck && npm test &&
npm run build` verdes:

- Motor de história (`features/historia/`), guardas anti-farm de
  marketplace/parcerias (GH-FDN-01/02), disponibilidade de funcionário-IA
  sem cron (GH-EQP-01), custo variável na árvore de parcerias (GH-ARV-01).
- `GH-ATR-03` — requisito mínimo de atributo em jobs/nós.
- **Épico 11 completo** (GH-EVT-01..04) — eventos globais com prazo,
  criados via `/admin/eventos` (gated por `GAMEHUB_ADMIN_EMAILS`), visíveis
  a todos os jogadores via relógio lazy, progresso automático em
  `recompensar()`/`desbloquearNo()`. Validado end-to-end via rota
  temporária: admin cria evento → jogador aceita jobs → progresso
  incrementa → recompensa aplicada uma única vez ao bater a meta.

## Próxima tarefa: `GH-ARV-02` ou `GH-EQP-02`

Os dois únicos P0 restantes da Trilha A, ambos desbloqueados agora que
`GH-ATR-03` está commitado. Cards completos em `docs/BACKLOG-PRODUTO.md`.
Não há critério óbvio de qual ir primeiro — checar esforço/dependência de
cada um no backlog antes de escolher.

## Follow-up de baixo esforço (não bloqueia nada)

`GH-EVT-04` ficou com um critério em aberto: bater a meta de um evento
global não dispara toast — só aparece "— concluído!" inline no card, e só
quando o jogador abre a aba "Eventos". Dá pra ligar no
`RecompensaContext` existente se algum dia importar.

## Onde mexer (eventos globais, se for evoluir o Épico 11)

- Tipos: `src/lib/db/types.ts` (`EventoGlobal`, `ProgressoEventoGlobal`) —
  `objetivo` é `string` ali de propósito (`lib/` não importa `features/`);
  a narrowing pro `EventoKey` real fica em
  `features/eventos-globais/tipos.ts` (`NovoEventoGlobal`).
- Regras puras: `features/eventos-globais/motor.ts`/`guarda.ts`.
- Persistência: `lib/db/repository.ts`/`file-adapter.ts`/`supabase-adapter.ts`
  (métodos `*EventosGlobais`/`*ProgressoEventos`), migration `0013`.
- Actions: `features/eventos-globais/actions.ts`.
- UI: `/admin/eventos` (criação) e `features/eventos-globais/EventosScreen.tsx`
  (aba "Eventos" no `GameShell`).

## Antes de considerar pronto

```bash
npm run typecheck
npm test
npm run build
```

Para fluxo dependente de tempo/estado, teste manual via rota temporária em
`src/app/api/selftest-*/route.ts` chamando a Server Action direto — bypassa
o clique na UI, que é **não confiável em navegador headless não composto**
(o `AnimatePresence` trava sem `requestAnimationFrame`; ver "Armadilhas
conhecidas" no `AGENTS.md`). **Apague a rota antes de commitar.**

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
4. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
