# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28, após fechar **Épico 10 — Pitch Readiness**
> (`GH-PITCH-01`/`GH-PITCH-02`) e corrigir 3 casos de drift no backlog
> (`GH-EQP-02`, `GH-FDN-03`, `GH-OPS-04` — implementados em lotes
> anteriores, mas com o checkbox esquecido). Sempre confira `git log -1`
> antes de confiar neste arquivo. Leia também
> [`GAPS-DE-INTEGRACAO.md`](GAPS-DE-INTEGRACAO.md).

## ⚠️ Lição de processo (repetida, vale reforçar)

Três cards foram implementados por completo em lotes anteriores desta
sessão, mas os checkboxes deles em `BACKLOG-PRODUTO.md` só foram
atualizados numa releitura posterior. **Ao fechar qualquer card, marcar o
checkbox NO MESMO TURNO em que o código é verificado.**

## 🎯 Estado do objetivo real: pitch Sebrae

O usuário confirmou que a prioridade é o **pitch Sebrae funcionando
corretamente** — Épico 10 (Pitch Readiness) estava vazio até agora e foi
tratado como prioridade máxima assim que isso ficou claro. **Está feito:**

- **`GH-PITCH-01` (parcial, o suficiente para demo):**
  `src/scripts/seed-demo.test.ts` — script de seed reusando `vitest` (sem
  instalar `tsx`/`ts-node`; roda direto contra `GameRepository`, não contra
  as Server Actions, que dependem de contexto HTTP do Next.js). Cria 6
  negócios (mesmos nomes já usados em `HubScreen.tsx`) no bairro
  Centro/Mendes, com equipe de IA, parceria, sede evoluída, nó da árvore,
  lição concluída e oferta publicada. Um deles (Radiz Engenharia) ganha
  login de demo (`radiz@demo.labdatadev.local` / `SebraeDemo2026!`) para o
  apresentador logar direto nela. **Toda a aritmética de XP/moeda/atributo
  foi conferida manualmente contra o JSON persistido e bateu exata** — é a
  validação de integração mais forte feita nesta sessão inteira, cobrindo
  contratação de equipe, parceria, evolução de sede, desbloqueio de nó e
  conclusão de lição juntos. Rodar com:
  ```bash
  SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts
  ```
  Roteiro cronometrado em `docs/pitch/ROTEIRO-DEMO.md` (~6 min, com Plano B
  offline). Falta só testar num ambiente de produção real (depende de
  `GH-OPS-01`, que ainda não existe) e um passe de clique real em browser
  (a validação feita foi via dado persistido, não via UI).
- **`GH-PITCH-02` (feito):** `docs/pitch/NARRATIVA-IMPACTO.md` — frase-resumo,
  o que já funciona vs. visão (honesto, nada de vaporware), conexão com o
  Vale do Café/PMEs de licitação, modelo de sustentabilidade (assinatura
  dos Funcionários de IA, preço já calibrado).

## Estado cumulativo (todos os lotes desta sessão)

`npm run typecheck && npm test && npm run build` verdes (224 testes).
Completos: Épicos 1–4, Épico 5 (exceto `GH-SIM-01`, adiado), Épico 7
(exceto `GH-GROW-04`/`GH-GROW-05`, adiados/bloqueados), Épico 8 parcial
(`GH-EDU-01` feito), Épico 10 (Pitch Readiness, ver acima), Épico 11
(exceto `GH-EVT-05`, dívida técnica documentada). Bug real corrigido:
constraint `segmento` do Supabase desalinhada do tipo TS.

## Próxima prioridade

### 1. Épico 9 (deploy real) — precisa do usuário, não é autônomo

`GH-OPS-01` exige VPS real (SSH), `GH-OPS-02` exige repositório remoto no
GitHub + secrets, `GH-OPS-03` exige projeto Supabase real. **Perguntar ao
usuário antes de tentar qualquer coisa aqui** — nenhuma sessão autônoma
tem essas credenciais. O ferramental (`deploy/`) já está pronto.

### 2. Se o usuário quiser continuar por funcionalidade (não deploy)

`GH-MAPA-02` (zoom do mapa) → `GH-MAPA-04` (benchmark regional, destrava
`GH-GROW-04`) → revisar o item 🔴 de `GAPS-DE-INTEGRACAO.md` (RLS de
`negocios`, só com Postgres real disponível para validar em runtime).

### 3. Antes do dia do pitch de verdade (mesmo sem código novo)

- Rodar `docs/pitch/ROTEIRO-DEMO.md` de ponta a ponta, ao vivo, num
  navegador real (a validação desta sessão foi por dado persistido, não
  por clique) — inclusive testar o Plano B (`iniciar.bat`) uma vez.
- Se houver tempo: um passe de clique real cobrindo os passos do roteiro,
  já que `AGENTS.md` documenta que navegador headless não é confiável para
  fluxos com `AnimatePresence` — só um navegador real garante isso.

## Antes de considerar pronto

```bash
npm run typecheck
npm test
npm run build
```

Para fluxo dependente de tempo/estado, teste manual via rota temporária em
`src/app/api/selftest-*/route.ts` chamando a Server Action direto —
bypassa o clique na UI, não confiável em navegador headless não composto
(ver "Armadilhas conhecidas" no `AGENTS.md`). **Apague a rota antes de
commitar.**

Migrations novas: validar com `pg-query-emscripten` (scratchpad — não há
Docker/Postgres local, ver `AGENTS.md`).

**Env vars novas desta sessão:** `NEXT_PUBLIC_SITE_URL` (`GH-GROW-01`,
usado por `sitemap.ts`/`robots.ts`).

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/pitch/ROTEIRO-DEMO.md` + `docs/pitch/NARRATIVA-IMPACTO.md` — o
   material do pitch em si.
4. `docs/GAPS-DE-INTEGRACAO.md` — o que existe mas não está costurado.
5. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
6. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
