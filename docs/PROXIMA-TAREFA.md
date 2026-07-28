# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-27, commit `3d11505`. Se este commit já não for o
> `HEAD`, os dados abaixo podem estar defasados — confira `git log -1` e,
> se precisar do relato completo, `docs/ESTADO-DO-PROJETO.md` §3.1.

## Estado

MVP para pitch Sebrae. Cinco cards fechados na última sessão: motor de
história (`features/historia/`), guardas anti-farm de marketplace e
parcerias (GH-FDN-01/02), disponibilidade de funcionário-IA sem cron
(GH-EQP-01), custo variável na árvore de parcerias (GH-ARV-01). Todos
commitados, `npm run typecheck && npm test && npm run build` verdes.

## Próxima tarefa: `GH-ATR-03`

Requisito mínimo de atributo em entregas de trabalho e em nós da árvore de
parcerias. Ver card completo em `docs/BACKLOG-PRODUTO.md`.

**Por que essa e não outra P0 solta:** os dois únicos P0 restantes da
Trilha A (`GH-ARV-02`, `GH-EQP-02`) dependem dela. Regra geral do projeto:
"primeiro P0 da lista" não é sempre a escolha certa — confira a coluna
"Depende de" antes de puxar um card.

## Onde mexer

- Atributos e economia: `src/lib/atributos.ts` (padrão "relógio lazy" —
  nunca cron, sempre deriva no read comparando timestamp com `agoraGlobal()`
  de `features/historia/relogio.ts`).
- Guarda de trabalho: `src/features/marketplace/guarda.ts` (adicionar
  checagem de atributo mínimo ao lado de `jaAceitouTrabalho`).
- Guarda de nó: `src/features/parcerias/guarda.ts` (mesma ideia).
- Action que hoje rejeita por saldo: `src/features/parcerias/actions.ts` →
  `desbloquearNo()` — é o padrão de RPC atômica a seguir para a nova
  checagem (rejeita com erro amigável, não clampa).

## Antes de considerar pronto

```bash
npm run typecheck
npm test
npm run build
```

E, para regra dependente de tempo/estado, um teste manual via rota
temporária em `src/app/api/selftest-*/route.ts` chamando a Server Action
direto (bypassa fetch do browser, que tem instabilidade conhecida neste
ambiente headless — ver "Armadilhas conhecidas" no `AGENTS.md`). **Apague a
rota antes de commitar.**

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
4. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado da última sessão
   (só abrir se precisar entender uma decisão específica).
