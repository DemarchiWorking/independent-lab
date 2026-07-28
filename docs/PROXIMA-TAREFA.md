# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28 (logo após fechar o lote `GH-EQP-02` + `GH-FDN-03`
> + correção de `GH-WORLD-01/02` + formalização de `GH-SIM-01`/3 stubs).
> Sempre confira `git log -1` antes de confiar neste arquivo — sessões
> concorrentes já mexeram nesta pasta mais de uma vez sem atualizar este doc
> (ver nota em `ESTADO-DO-PROJETO.md` §3.1).

## Estado

MVP para pitch Sebrae. Este lote fechou com `npm run typecheck && npm test
&& npm run build` verdes:

- **`GH-EQP-02` — feito.** "Aceitar trabalho" virou fluxo em 2 etapas: modal
  `Selecionar funcionário` (`features/marketplace/SelecionarFuncionarioModal.tsx`,
  reusa `RibbonPanel`) soma a contribuição dos Funcionários de IA
  selecionados (`CONTRIBUICAO_ATRIBUTO_ALOCACAO`, só no eixo que cada cargo
  já fortalece — decisão confirmada com o usuário: reusar `eixoFortalecido`
  em vez de inventar um vetor de 5 valores por cargo) e compara com
  `job.requisitos` **antes** de liberar "Confirmar". Nova action dedicada
  `features/marketplace/actions.ts` → `aceitarTrabalhoComEquipe()` (fora do
  dispatcher genérico `recompensar()`, mesmo motivo de `desbloquearNo`):
  aloca cada funcionário via `alocarFuncionario` (RPC já existente de
  GH-EQP-01, primeira vez que é chamada de verdade) e SÓ ENTÃO chama
  `aceitarTrabalho` **sem** `requisitos` (de propósito — o requisito já foi
  checado com a soma da equipe incluída; repassar `job.requisitos` faria o
  RPC recusar de novo contra só a baseline do negócio). `MarketplaceScreen`/
  `HubScreen`/`GameShell`/`hub/page.tsx` agora threadam
  `FuncionarioContratado[]` completo (não só `cargoId[]`) até o modal.
- **`GH-FDN-03` — feito.** `parceria_formada` tinha um farm hole real (rodava
  pelo `recompensar()` genérico sem NENHUMA guarda — só o `useState` local do
  `MapaScreen` impedia o re-clique, perdido a cada reload). Migration
  `0014_parcerias_mapa.sql` (tabela `parcerias_formadas` + RPC
  `formar_parceria`, que valida que o vizinho é real via join de
  `quarteirao_id` — nunca confia em ID arbitrário do client) + action
  dedicada `features/mapa/actions.ts` → `formarParceria()` + guarda pura
  `features/mapa/guarda.ts` (`jaFormouParceria`, testada). `MapaScreen`
  recebe `parceriasFormadas: string[]` do servidor.
- **`GH-WORLD-01`/`GH-WORLD-02` — checkboxes corrigidos no backlog.** Os dois
  estavam **de fato prontos** (schema simplificado e documentado: catálogo
  de mobília é estático, não tabela; avatar é projeção, não persistido) —
  só faltava (a) validar `0004_sede.sql` pelo parser real
  (`pg-query-emscripten`, feito nesta sessão) e (b) `evoluirSede()` não
  disparava XP. Fechado: `XP_EVOLUCAO_SEDE` (150, `features/sede/niveis.ts`)
  aplicado atomicamente na RPC `evoluir_sede`
  (`0015_sede_evoluir_xp.sql`, exigiu `drop function` da assinatura antiga —
  parâmetro novo cria sobrecarga, mesmo caso já visto em `desbloquear_no`).
  A escolha alugar-vs-comprar da Sede continua **deliberadamente em aberto**
  no backlog — é decisão de produto, não bug.
- **`GH-SIM-01` e 3 stubs sem card formalizados no backlog** (só
  documentados, não implementados — decisão confirmada com o usuário):
  motor de simulação ECS/tick (Épico 5, maior card do backlog) e os 3
  módulos do app-drawer sem levantamento (`GH-EQP-03` equipe humana,
  `GH-FIN-01` finanças, `GH-RH-01` rh-motivação — novo Épico 12).

Estado anterior (sessões passadas, ainda válido): motor de história
(`features/historia/`), guardas anti-farm de marketplace/parcerias
(GH-FDN-01/02), disponibilidade de funcionário-IA sem cron (GH-EQP-01),
custo variável na árvore de parcerias (GH-ARV-01), `GH-ATR-03` (requisito
mínimo de atributo), Épico 11 completo (eventos globais), `GH-ARV-02`
(gating de 3 estados na árvore), `GH-WORLD-06` (visitar vizinho).

## Próxima tarefa recomendada

Nenhum card em andamento — escolher o próximo pela ordem do "Resumo
executivo" de `docs/BACKLOG-PRODUTO.md`, pulando o Épico 9 (deploy: precisa
de acesso real à VPS, fora do que uma sessão autônoma decide sozinha).
Sequência natural a partir daqui:

1. **`GH-MAPA-01`** — consulta agregada por cidade/bairro (performance).
   Sem dependência pendente, esforço P–M.
2. **`GH-OPS-04`** — política de privacidade/consentimento (LGPD). É
   conteúdo + uma página, não precisa de infraestrutura — pode ser feito
   numa sessão autônoma antes do deploy real acontecer.
3. **`GH-GROW-01`** — perfil público do negócio (vitrine indexável). Maior
   esforço (M), mas sem dependência pendente.

Ao puxar o próximo card, seguir o mesmo ritmo desta sessão: ler os arquivos
reais antes de assumir o que existe (o backlog já teve drift da realidade
duas vezes — `GH-WORLD-01`/`02` neste lote — vale conferir código antes de
crer 100% num checkbox `[ ]`), implementar em passos pequenos com
`npm run typecheck` a cada um, e só then rodar
`npm test && npm run build` completo antes de commitar.

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

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
4. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
