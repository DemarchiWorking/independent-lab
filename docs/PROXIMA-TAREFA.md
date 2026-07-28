# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28, após o lote 2 (`GH-MAPA-01`, `GH-OPS-04`,
> `GH-GROW-01`, `GH-EDU-01`, correção de constraint de `segmento`, e
> deferimento documentado de `GH-GROW-05`). Sempre confira `git log -1`
> antes de confiar neste arquivo. **Leia também
> [`GAPS-DE-INTEGRACAO.md`](GAPS-DE-INTEGRACAO.md)** — registro vivo de
> coisas que existem mas não estão costuradas a nada, ou que duas partes do
> sistema não combinam; várias entradas lá afetam decisões de onde mexer.

## Estado

MVP para pitch Sebrae. Lote 2 fechou com `npm run typecheck && npm test &&
npm run build` verdes.

**Achado e corrigido nesta sessão (bug real, não feature):** a constraint
`segmento` do Supabase ainda aceitava só os valores antigos
(`imobiliaria`/`construtora`/`loteadora`) — o tipo `Segmento` em TypeScript
já tinha migrado para o ICP real (`engenharia`/`contabilidade`/`saude`/
`tecnologia`/`alimentacao`/...) num commit anterior, mas nenhuma migration
acompanhou. Cadastro real em modo `GAMEHUB_DB=supabase` quebraria para 5 dos
8 segmentos. Corrigido em `0016_segmento_icp.sql`.

- **`GH-MAPA-01` — parcial (documentado).** `lerMapaResumo()`/
  `lerBairroResumo()` (contagem por cidade/bairro, RPCs `mapa_resumo`/
  `bairro_resumo`) e `lerMapaView(escopo?)` opcional — mas `escopo` está
  **inerte** hoje (nenhum chamador usa; ver `GAPS-DE-INTEGRACAO.md`). Falta
  o benchmark com dados semeados (sem script de seed ainda).
- **`GH-OPS-04` + `GH-GROW-01` — feitos juntos** (o backlog já pedia isso
  acoplado). Consentimento explícito + opt-out de perfil público no
  `Wizard` de cadastro (`Negocio.perfilPublico`/`consentimentoEm`/
  `consentimentoVersao`, migration `0018_consentimento_lgpd.sql`),
  `/privacidade` (primeira página de conteúdo estático do app), perfil
  público `/n/[slug]` (primeiro uso de `sitemap.ts`/`robots.ts`), slug
  derivado (não persistido — `features/growth/slug.ts`), formulário de
  contato intermediado com rate-limit em memória
  (`features/growth/actions.ts`).
- **`GH-GROW-05` — deliberadamente NÃO implementado.** É o card de maior
  sensibilidade do backlog (cruza dados privados de onboarding entre
  tenants pela primeira vez no sistema). Pesquisa completa já feita e
  registrada no próprio card do `BACKLOG-PRODUTO.md` — abrir aquele card
  antes de implementar, não começar do zero.
- **`GH-EDU-01` — feito.** 5 lições (1 por degrau,
  `features/licoes/catalogo.ts`), `LicaoCard` no Hub, XP ao concluir
  (RPC `concluir_licao`, migration `0020_licoes.sql`), mesma família
  idempotente de `desbloquearNo`/`formarParceria`.

Estado do lote anterior (ainda válido): `GH-EQP-02` (fluxo em 2 etapas no
marketplace), `GH-FDN-03` (parceria do mapa persistida + farm hole
fechado), correção de checkboxes de `GH-WORLD-01`/`02`, formalização de
`GH-SIM-01` e 3 stubs (Épico 12) no backlog.

## Próxima tarefa recomendada

Nenhum card em andamento. Antes de escolher o próximo, **leia
`GAPS-DE-INTEGRACAO.md`** — pode valer mais fechar um gap pequeno lá
(inbox de contato, tela de criar Oferta) do que abrir um card novo do
backlog formal. Se for pelo backlog, ordem sugerida (pulando Épico 9 —
deploy, precisa de VPS real):

1. **`GH-GROW-02`** (convite de vizinho com recompensa mútua) — depende de
   `GH-FDN-03`, já pronto.
2. **Fechar um gap pequeno de `GAPS-DE-INTEGRACAO.md`** — ex.: tela em
   `/painel` para o dono criar uma `Oferta` (destrava o "serviços
   oferecidos" da página pública, que hoje sempre mostra vazio) ou uma
   aba de "mensagens recebidas" (lê `listarSolicitacoesContato`, já
   implementado, só falta UI).
3. **`GH-GROW-03`** (conquistas compartilháveis) — depende de `GH-ATR-01`,
   já pronto.

Ao puxar o próximo card: ler os arquivos reais antes de assumir o que
existe (o backlog já teve drift da realidade nesta sessão — `GH-WORLD-01`/
`02` e a constraint de `segmento`), implementar em passos pequenos com
`npm run typecheck` a cada um, e só então rodar `npm test && npm run build`
completo antes de commitar.

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

Migrations novas: validar com `pg-query-emscripten` (instalar num
scratchpad — não há Docker/Postgres local, ver `AGENTS.md`).

**Novo env var (`GH-GROW-01`):** `NEXT_PUBLIC_SITE_URL` — usado por
`sitemap.ts`/`robots.ts`. Sem ele, cai em `localhost:8081` (sitemap inválido
em produção). Precisa ser setado no `.env` da VPS antes do primeiro deploy
real.

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/GAPS-DE-INTEGRACAO.md` — o que existe mas não está costurado.
4. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
5. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
