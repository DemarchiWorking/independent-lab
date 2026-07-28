# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28 (logo após fechar `GH-ARV-02`). Sempre confira
> `git log -1` antes de confiar neste arquivo — sessões concorrentes já
> mexeram nesta pasta mais de uma vez sem atualizar este doc (ver nota em
> `ESTADO-DO-PROJETO.md` §3.1).

## Estado

MVP para pitch Sebrae. Commitado e com `npm run typecheck && npm test &&
npm run build` verdes (190 testes):

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
- `GH-ARV-02` — gating de 3 estados na árvore (disponível/comprável/
  inalcançável). Reaproveitou `atributosFaltantes` de `GH-ATR-03` — a
  checagem virou função pura `noInalcancavel()` em `parcerias/guarda.ts`
  (testada), consumida tanto no grid (`HexTile` ganhou badge dimmed + ícone
  "close", nunca só cor) quanto no painel de detalhe. "Bloqueado" continua
  estático no catálogo (só `infra`) — não existe dependência pai→filho
  entre nós hoje, então generalizar isso ficou fora de escopo (YAGNI).

## Próxima tarefa: `GH-EQP-02` — EM ANDAMENTO, retomar por aqui

> Sessão anterior parou na fase de pesquisa (nenhum arquivo de código editado
> ainda — `git status` limpo). Isto aqui é o estado exato de onde continuar,
> escrito para economizar uma rodada de exploração numa sessão nova.

**O card:** substituir "Aceitar trabalho" (1 clique) por um fluxo em 2
etapas — depois de aceitar, abre um modal `Selecionar funcionário` que soma
dinamicamente os atributos dos recursos marcados e só libera "Confirmar"
quando a soma atende `job.requisitos` (de `GH-ATR-03`). Réplica da tela do
Startup Panic documentada em `docs/analise-prints/telas/marketplace-servicos.md`
§3 (já lida — tem o mockup ASCII da tela de referência: linha `Total` que
soma dinâmico, `Funcionário selecionado = 0 / 1`, botão `Continue`).
Critérios de aceitação completos: `docs/BACKLOG-PRODUTO.md` linha ~333
(`GH-EQP-02`).

**⚠️ Decisão de design AINDA EM ABERTO, resolver antes de codar** — é o
maior risco deste card: no Startup Panic cada funcionário tem um **bloco de
atributos próprio** (Tec/Usa/Est/Mkt/Mot, todos os eixos, valores diferentes
por pessoa) que soma para bater o requisito do job. Já conferi o catálogo de
Funcionários de IA (`src/features/equipe-ia/catalogo.ts`, `interface
CargoIA`) e ele **não tem isso** — cada cargo só declara UM
`eixoFortalecido: AtributoChave` (o eixo que sobe ao contratar), não um
vetor de 5 valores. Isso significa que "somar atributos dos alocados" não
tem, hoje, um número real para somar. Duas saídas possíveis, escolher uma
antes de implementar:
1. **Cada `CargoIA` ganha um bloco `contribuicao: Partial<Record<AtributoChave, number>>`**
   (novo campo estático no catálogo, calibrado manualmente por cargo — mais
   fiel ao Startup Panic, mais trabalho de calibração, mesmo padrão dos
   `requisitos` que `GH-ATR-03` já adicionou aos catálogos de job/nó).
2. **Reaproveitar `eixoFortalecido` como contribuição de 1 eixo só** (cargo
   contribui um valor fixo — ex. `GANHO_ATRIBUTO_CONTRATACAO` ou uma nova
   constante — só no eixo que já fortalece). Mais simples, menos fiel à
   referência, mas evita inventar 4×5 números sem dado real por trás.
   **Provavelmente a escolha certa** dado o MVP/pitch e o precedente de
   `GH-ATR-03` (calibrar contra o que já existe, não inventar sistema
   novo) — mas vale confirmar com o usuário antes de assumir, é uma
   decisão de produto, não só técnica.

**O que já está pronto e pode ser reaproveitado sem mudança:**
- `src/lib/disponibilidade.ts` — `alocacoesAtivasEm()` / `disponibilidadeDe()`,
  puras, testadas (GH-EQP-01). Dizem se um `FuncionarioContratado` está
  `livre`/`alocado` agora. É a fonte de "recursos disponíveis" que o modal
  lista.
- RPC `alocar_funcionario` (migration `0010`) — falta achar/ler o arquivo
  exato e a Server Action que a chama (não lida ainda nesta sessão) para
  saber se ela já aceita `jobId`+prazo prontos para o novo fluxo, ou se
  precisa de ajuste.
- `atributosFaltantes()`/`mensagemRequisito()` (`src/lib/atributos.ts`,
  GH-ATR-03) — a soma dinâmica do modal e a revalidação server-side devem
  reusar exatamente essa função (dar a soma dos alocados como `atuais`).
- `RequisitoAtributos.tsx` (`src/components/ui/`, GH-ATR-03) — já mostra
  "atual × mínimo" por eixo; útil para o header do modal ("Atributos
  recomendados" da referência), mas foi feito para 1 fonte de atributos (o
  negócio); o modal precisa de uma soma de VÁRIAS fontes (negócio + cada
  funcionário marcado) — não dá para reusar o componente sem adaptar.

**Não lido ainda nesta sessão (próximo passo ao retomar):**
- `src/features/gamificacao/actions.ts` → branch `servico_contratado` de
  `recompensar()` (onde a nova etapa de alocação provavelmente se encaixa,
  ou vira uma action nova dedicada — decidir seguindo o mesmo raciocínio de
  `GH-ARV-01`: se a operação ficar atômica/complexa demais para o
  dispatcher genérico, ganha action própria em `features/marketplace/`,
  que hoje só tem `guarda.ts`/`guarda.test.ts`, sem `actions.ts`).
- A RPC/Server Action de `alocar_funcionario` (GH-EQP-01) — ler o arquivo
  real antes de desenhar a integração.
- Se existe algum componente de modal genérico já no design system
  (`src/components/ui/`) para reaproveitar, ou se este card introduz o
  primeiro modal do projeto.
- `FuncionarioContratado` em `src/lib/db/types.ts` — conferir o shape exato
  antes de decidir onde entra o novo campo `contribuicao` (se a opção 1
  acima for a escolhida).

**Ao retomar:** ler os 4 itens acima primeiro, resolver a decisão de design
(opção 1 vs. 2 — ou perguntar ao usuário), então seguir o mesmo ritmo já
usado nos cards anteriores desta sessão: implementar em passos pequenos com
`npm run typecheck && npm test` verde a cada um, terminar com
`npm run build`, e só então atualizar backlog/commit.

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
