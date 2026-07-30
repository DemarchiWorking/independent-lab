# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-30 (sessão GH-OPS em andamento, parada no meio do
> Bloco 5). Sempre confira `git log -1` antes de confiar neste arquivo —
> sessões concorrentes já mexeram nesta pasta mais de uma vez sem atualizar
> este doc (ver nota em `ESTADO-DO-PROJETO.md` §3.1).

## 🔴 LEIA PRIMEIRO — GH-OPS em andamento, retomar por aqui

**O card:** tirar o jogo do "só roda no meu PC" e colocar no ar de verdade —
VPS Hostinger + Docker + Supabase self-hosted + presença ao vivo + o
Diagnóstico de Maturidade Digital (o documento real que vira produto pro
pitch). Plano completo e checkpoint detalhado em
`C:\Users\demarchi\.claude\plans\como-engenheiro-de-sistemas-witty-duckling.md`
(fora do repo — leia a seção **"🔖 CHECKPOINT"** no topo, é o resumo mais
denso). Este parágrafo aqui é a versão curta.

**Confira antes de qualquer coisa:**
```bash
npm run typecheck && npm test && npm run build   # tem que estar tudo verde (305 testes)
```

**Feito e verificado (Blocos 1–5 de 8):** os 6 defeitos P0 que quebrariam em
produção (segmento do cadastro, paginação de e-mail, cadastro não-transacional,
`GAMEHUB_DB=file` em produção, healthcheck falso, cookie sem HTTPS) — todos
corrigidos com endereço exato no checkpoint do plano. Stack Supabase
self-hosted em Docker (5 containers, `deploy/supabase/`), PM2 em cluster,
cache do mapa regional, recompensa duplicada corrigida. O **Diagnóstico de
Maturidade Digital** (`src/features/documentos/`) — gerado 100% de dado real,
com HTML pra imprimir e `.docx` de verdade, validado ao vivo no navegador.
LGPD mínimo (`/privacidade` + consentimento no cadastro). Presença ao vivo
(`src/features/world/presenca/`) com os dois lados da degradação graciosa
testados ao vivo (sem Supabase configurado → zero chamada de rede, tela
normal; com Supabase mas sem `SUPABASE_JWT_SECRET` → 501 limpo).

**Pendente — é exatamente onde continuar (dentro do Bloco 5):**
1. **Presença simétrica em `WorldScreen.tsx`** (hoje só `VisitaScreen.tsx`
   tem `usePresenca` — o dono não vê o visitante chegar ao vivo na própria
   sede). É o incremento de maior valor disponível: mesmo hook, mesmo
   `canal.ts`, sem mudança de contrato — só fiação repetida.
2. **Token de presença não renova** (`jwt.ts` expira em 10 min,
   `canal.ts`/`usePresenca.ts` não re-chamam `/api/realtime-token`). Decidir
   se corrige agora (provável: `setInterval` ~8min) ou só documenta o limite.
3. Depois disso, Blocos 6 (um-clique + `engines`), 7 (os 6 markdowns que
   faltam de `docs/deploy/` — o `docs/deploy/README.md` mestre **já existe**),
   8 (verificação end-to-end + PR).

Nada commitado ainda — está tudo no working tree da branch
`claude/npc-agent-interaction-6a2dd3`.

---

## Estado (histórico — GH-WORLD-07 e anteriores, MVP para pitch Sebrae)

Com `npm run typecheck && npm test && npm run build`
verdes (257 testes, antes do GH-OPS acima):

- **`GH-WORLD-07` completo** — conversa com NPC no World. Chegar perto de um
  Funcionário de IA (ou do dono da sede visitada) acende um balão "…" pulsante;
  clicar abre a ficha + 4 escolhas com copy própria por cargo. Arquivos novos:
  `world/engine/proximidade.ts`, `equipe-ia/senioridade.ts`,
  `world/interacao/{tipos,catalogo}.ts` + `PainelInteracao.tsx`/`ListaNaSala.tsx`,
  `shell/views.ts` (deep-link `?ver=`). Sem Server Action nova, sem migration,
  sem XP (decisão registrada no card — conversa não pode virar farm de clique).
  `CargoIA` ganhou `habilidades` (campo aditivo, **não colide** com a decisão em
  aberto de `contribuicao` do `GH-EQP-02` abaixo). Validado no navegador com o
  truque do `window.__world` — inclusive o `stopPropagation` (painel abre e o
  boneco NÃO anda) e o pulso oscilando entre 0.9× e 1.1×.
  - ⚠️ Achados da revisão, que valem para o próximo que mexer aqui:
    1. `desenharAvatares` tinha um `continue` que **ignorava toda mudança em
       avatar já existente** — virou ramo de mutação, senão contratar um
       funcionário não acendia o balão dele.
    2. `AnimatePresence mode="wait"` trava de vez com `requestAnimationFrame`
       congelado — o painel usa um nó re-chaveado no lugar. O `CapituloCard.tsx`
       ainda usa `mode="wait"` e tem o mesmo risco latente.
    3. **`useEffect` dependendo do objeto do `useMemo`** apagava a conversa no
       meio da leitura a cada `router.refresh()` (o `agoraIso` muda a cada
       render do servidor). A dependência tem que ser o `avatarId`, que é
       estável. Vale para qualquer painel que derive props assim.
    4. `{...pressable}` num `<button>` comum vaza `whileHover`/`whileTap` como
       atributo DOM e enche o console de aviso do React — tem que ser
       `motion.button`. Corrigido aqui **e** no `CapituloCard.tsx`, que tinha o
       mesmo bug e renderiza na mesma tela.
    5. `npm run typecheck` pode falhar por `.next/types` **obsoleto** quando uma
       rota é apagada (ex.: a rota temporária de selftest). Não é erro de
       código: rode `npm run build` (regenera) ou apague `.next/types/app/api`.
    6. Medir altura com `getBoundingClientRect()` dentro de um `RibbonPanel`
       **mente em navegador headless**: a animação de entrada fica congelada
       numa escala ~0.94 e encolhe tudo. Meça `getComputedStyle`, ou divida
       pela escala do modal.

  O `RibbonPanel` ganhou comportamento de diálogo de verdade (`Esc`,
  `aria-modal`, foco entra ao abrir e volta ao fechar) — vale para a loja e o
  upgrade de sede também, não só para a conversa.

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
- **`GH-WORLD-06` completo** — visitar a sede de um vizinho, somente
  leitura, aberta por padrão no MVP (sem opt-in — decisão documentada em
  `docs/world/VISITAR-VIZINHO.md`, que supera a recomendação antiga de
  `sede.publicada`). Rota `/world/visitar/[tenantId]` reusa o renderer Pixi
  existente sem tocar nele; painel de pitch comercial real (Funcionários de
  IA) personalizado pelo atributo mais fraco do visitado — copy em
  `docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md`. Validado end-to-end em
  navegador logado. Não colide com o trabalho de `GH-EQP-02` abaixo (arquivos
  disjuntos, exceto `MapaScreen.tsx`/`painel/page.tsx` — só um `Link`
  adicionado em cada, sem tocar no resto).

## Depois do GH-OPS: `GH-EQP-02` — pausado, retomar quando o GH-OPS fechar

> ⚠️ Isto NÃO é a tarefa atual — o GH-OPS (seção no topo deste arquivo) é.
> Preservado aqui porque a análise abaixo continua válida e não foi tocada
> pela sessão de GH-OPS (arquivos disjuntos). Sessão que parou aqui tinha
> concluído só a fase de pesquisa (nenhum arquivo de código editado ainda).
> Estado exato de onde continuar, escrito para economizar uma rodada de
> exploração numa sessão nova.

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
3. **GH-OPS (tarefa atual):**
   `C:\Users\demarchi\.claude\plans\como-engenheiro-de-sistemas-witty-duckling.md`
   — plano completo, veredito de arquitetura, checklist de verificação e o
   checkpoint com o mapeamento exato do que falta.
4. `docs/deploy/README.md` — o guia de instalação/deploy já escrito (Docker,
   Supabase self-hosted, prompt pronto pro Claude Code operar na VPS).
5. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
6. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
