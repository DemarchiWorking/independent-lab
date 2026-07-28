# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-27, commit `55a47aa` + trabalho não commitado depois
> dele (ver abaixo). Se `git log -1` mostrar outro `HEAD`, confira também
> `git status` antes de confiar neste arquivo — pode haver sessão
> concorrente em andamento (ver nota no fim).

## Estado

MVP para pitch Sebrae. Cinco cards fechados e commitados numa sessão
anterior: motor de história (`features/historia/`), guardas anti-farm de
marketplace e parcerias (GH-FDN-01/02), disponibilidade de funcionário-IA
sem cron (GH-EQP-01), custo variável na árvore de parcerias (GH-ARV-01).

**Duas frentes em andamento ao mesmo tempo em 2026-07-27** (checar
`git status` para ver o que já commitou):

1. **`GH-ATR-03`** (requisito mínimo de atributo em entregas/nós) — estava
   sendo implementado por outra sessão em paralelo. Toca
   `repository.ts`/`file-adapter.ts`/`supabase-adapter.ts`/
   `gamificacao/actions.ts`/`parcerias/actions.ts`. **Se ainda não
   commitou, termine essa primeiro** — ela desbloqueia `GH-ARV-02` e
   `GH-EQP-02` (os dois únicos P0 restantes da Trilha A).
2. **`GH-EVT-01`** (Épico 11 — Eventos Globais) — feito e testado nesta
   sessão, arquivos isolados só: `features/eventos-globais/`, `lib/admin.ts`,
   migration `0013_eventos_globais.sql`. Não integrado ainda de propósito
   (colisão de arquivo com a frente acima). Próximo passo: `GH-EVT-02`.

## Próxima tarefa: `GH-EVT-02` (depois que `GH-ATR-03` estiver commitado)

Ligar `features/eventos-globais/` à persistência real: `GameRepository` +
os dois adapters + chamar `incrementarProgressoEventos` a partir de
`recompensar()` e `desbloquearNo()`. Card completo com critérios de
aceitação em `docs/BACKLOG-PRODUTO.md` → Épico 11.

**Por que esperar em vez de editar em paralelo:** os arquivos que `GH-EVT-02`
precisa tocar são exatamente os que `GH-ATR-03` está editando ao vivo —
editar os dois ao mesmo tempo arrisca sobrescrever trabalho um do outro.
Regra geral do projeto (reforçada de novo aqui): ao achar arquivos
modificados/`??` que você não escreveu nesta conversa, **pare e confirme
com o usuário antes de editar** — não presuma que está livre para mexer.

## Onde mexer (GH-ATR-03, se ainda pendente)

- Atributos e economia: `src/lib/atributos.ts` (padrão "relógio lazy" —
  nunca cron, sempre deriva no read comparando timestamp com `agoraGlobal()`
  de `features/historia/relogio.ts`).
- Guarda de trabalho: `src/features/marketplace/guarda.ts` (adicionar
  checagem de atributo mínimo ao lado de `jaAceitouTrabalho`).
- Guarda de nó: `src/features/parcerias/guarda.ts` (mesma ideia).
- Action que hoje rejeita por saldo: `src/features/parcerias/actions.ts` →
  `desbloquearNo()` — é o padrão de RPC atômica a seguir para a nova
  checagem (rejeita com erro amigável, não clampa).

## Onde mexer (GH-EVT-02, depois de livre)

- Tipos prontos: `src/features/eventos-globais/tipos.ts`.
- Regras puras prontas e testadas: `src/features/eventos-globais/motor.ts`
  (`statusDe`, `progressoPercentual`, `eventosVisiveis`) e `guarda.ts`
  (`jaRecompensado`).
- Migration pronta e validada: `supabase/migrations/0013_eventos_globais.sql`
  — RPCs `criar_evento_global` e `incrementar_progresso_eventos`.
- Admin gate pronto: `src/lib/admin.ts` → `souAdmin(email)` (allowlist via
  `GAMEHUB_ADMIN_EMAILS`).
- Falta: `GameRepository` (métodos novos), `file-adapter.ts`,
  `supabase-adapter.ts`, e a chamada de `incrementarProgressoEventos` em
  `recompensar()`/`desbloquearNo()` (ver `GH-EVT-02` no backlog).

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
