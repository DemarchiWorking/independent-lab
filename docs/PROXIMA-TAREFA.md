# Próxima tarefa — leia isto primeiro (economiza contexto)

> **🚨 Atualização 2026-08-02 (mais recente — leia ESTA primeiro, antes de
> tudo abaixo):** dois bugs CRÍTICOS foram achados e corrigidos —
> (1) login sempre falhava depois do cadastro (`d1ae454`); (2) bypass de
> RLS exposto à internet que permitia qualquer pessoa com a anon key
> escrever/apagar qualquer negócio, sem estar logada (`45effc7`,
> migration `0036`). Deploy Docker real está de pé em `:3006`, publicado
> no GitHub (`integracao-deploy-vps`), com launcher único
> (`start.sh`/`start.bat`) e pacote portátil pronto. Relato completo,
> pendências reais (sem fluxo de "esqueci senha", `start.bat` não testado
> em Windows real, runbook de VPS não testado numa VPS real) e runbooks
> em
> [`CHECKPOINT-2026-08-02-seguranca-e-deploy-portatil.md`](CHECKPOINT-2026-08-02-seguranca-e-deploy-portatil.md)
> — leia esse arquivo INTEIRO antes de considerar qualquer coisa abaixo
> "estado atual".

> **Atualização 2026-08-02 (Épico 15 — Auditoria de Prontidão, leia
> primeiro):** duas validações independentes rodaram em 2026-08-01 sobre o
> que o Épico 14 entregou e chegaram, por caminhos diferentes, ao mesmo
> achado bloqueante: a presença ao vivo (o recurso-manchete "metaverso, ver
> gente ao vivo na mesma sala") **quebrava com tela de erro** no caminho de
> deploy Docker, porque `NEXT_PUBLIC_SUPABASE_URL` é inlinado pelo Next.js
> em BUILD TIME, não runtime. Relatórios completos:
> [`architecture/VALIDACAO-BMAD-NFR-PITCH-2026-08-01.md`](architecture/VALIDACAO-BMAD-NFR-PITCH-2026-08-01.md)
> e o segundo em
> [`architecture/VALIDACAO-INDEPENDENTE-PITCH-2026-08-01.md`](architecture/VALIDACAO-INDEPENDENTE-PITCH-2026-08-01.md).
> Cards completos:
> `docs/BACKLOG-PRODUTO.md` Épico 15.
>
> **Estado real, verificado nesta sessão (2026-08-02), não só lido:**
> - ✅ **Corrigido e commitado:** o *throw* da tela de visita (config de
>   presença agora vem por prop de Server Component, nunca lida de
>   `process.env` em código `"use client"` — ver `GH-MULTI-04` no backlog);
>   o buraco de segurança B2 (`grant update` sem escopo de coluna em
>   `negocios`/`onboardings`, migration `0035`); o gate `npm run build`
>   (estava RED na VPS com o `.env` real, `GH-OPS-07`, agora GREEN —
>   verificado de novo agora: `typecheck` 0 erros, `test` 311/311,
>   `build` verde); os dois bugs do cloud-init "1-click" (`GH-ESC-05`).
> - 🔴 **AINDA aberto — não demonstrável em produção hoje:** a presença ao
>   vivo não quebra mais, mas também **não conecta de verdade** no deploy
>   `labd-cloud`, porque o Kong não está publicado por nenhum router
>   Traefik (`GH-OPS-08`, decisão de infra compartilhada, não tomada de
>   propósito por um agente sozinho — ver o card). Não anunciar "metaverso
>   ao vivo" no pitch até isso fechar (`GH-MULTI-04`).
> - ⚠️ **Monetização não é "só conectar o meio de pagamento":** o schema
>   (`0028`/`0029`/`0030`) é bom, mas **zero linha de código de aplicação**
>   chama essas migrations hoje — falta a superfície inteira
>   (`GH-COM-01b`, `GH-COM-03`). Tratar como semanas de trabalho, não
>   horas, ao comunicar prazo de monetização.
> - ✅ **Confirmado, sem ressalva:** cadastro, `/painel`, `/hub`, mapa,
>   marketplace, parcerias, equipe de IA, sede/World, início local
>   (`iniciar.bat`/`iniciar.sh`) e `docker compose` (comando único, com
>   duas arestas de documentação corrigidas) continuam funcionando — é um
>   MVP demonstrável **sem** o passo de multiplayer ao vivo.

> **Atualização 2026-08-01 (Épico 14 — Escala e Replicação, sessão mais
> recente):** CEP auto-aloca cidade/bairro real no cadastro (`GH-CEP-01`),
> stack dimensionado e MEDIDO DE VERDADE para 100–1000 conexões simultâneas
> de presença (`GH-ESC-01/02` — harness `deploy/loadtest/presenca-k6.js`,
> resultado completo em
> [`architecture/CARGA-1000-SIMULTANEOS.md`](architecture/CARGA-1000-SIMULTANEOS.md)),
> caminho de deploy consolidado em Docker (`GH-ESC-03` — `vps-setup.sh` PM2
> agora é legado, ver aviso no cabeçalho do próprio script) e Terraform de
> referência pra replicar em VPS/cloud nova (`GH-ESC-04`,
> `deploy/terraform/`). **Achado mais importante da sessão:** a presença ao
> vivo nunca teria funcionado em nenhum deploy real — bug de
> `hide_credentials` no `kong.yml` bloqueava o Realtime silenciosamente,
> corrigido e validado (handshake real, HTTP 101). Cards completos:
> `docs/BACKLOG-PRODUTO.md` Épico 14. **Nada foi para produção nesta
> sessão** (decisão explícita: preparar e validar, sem go-live) — todo o
> stack de teste subiu, foi medido, e caiu de volta. Próximo passo real:
> primeiro deploy hospedado de verdade continua sendo `GH-MULTI-01`/
> `GH-OPS-01` (ver banner abaixo), agora com o caminho Docker + os ajustes
> de capacidade já prontos para quando for a hora.
>
> **Atualização 2026-08-01 (revisão DBA/arquitetura):** a Fase 0 abaixo
> (linha `⛔ precisa do usuário — Docker/Supabase local`) **foi executada e
> fechada** — as 32 migrations rodam limpo contra Postgres real, RLS
> comprovadamente isola tenant, `SEED_DEMO` passa via `GAMEHUB_DB=supabase`.
> Dois bugs P0 achados e corrigidos (`0032`, `0033` — este último é o mais
> importante: nenhuma tabela tinha `GRANT` de base para `anon`/
> `authenticated`/`service_role`, o que teria quebrado até o próprio app em
> produção, não só multiplayer). Ver
> [`architecture/DBA-ARQUITETURA-ESCALA-2026.md`](architecture/DBA-ARQUITETURA-ESCALA-2026.md)
> §1.1 para o relato completo e
> [`PRODUTIZACAO-PUNCH-LIST.md`](PRODUTIZACAO-PUNCH-LIST.md) para o próximo
> passo real (primeiro deploy contra Postgres hospedado). O restante deste
> arquivo (abaixo) é o estado de 2026-07-29 e não reflete isso — mantido por
> histórico.

## 🚨 ANTES DE QUALQUER COISA: confira em que branch o servidor roda

Tudo o que foi entregue em 2026-07-28/29 vive no branch
`claude/module-refactor-framework-497918` (worktree em
`.claude/worktrees/`), **não na `main`**. Se você (ou o usuário) rodar
`npm run dev` no checkout principal, verá o app SEM Mercado, SEM Finanças,
SEM celular/inventário e SEM interação com NPC — e vai parecer que "nada
funciona". Não é bug: é branch errado.

```bash
git log --oneline -1 && git rev-list --count main..HEAD
```

O merge é **fast-forward** (`git merge-base --is-ancestor main <branch>`
passa), então integrar é seguro — mas **só com o usuário confirmando**.

> Atualizado: 2026-07-29. Sessão fechou Épico 10 (Pitch Readiness), Épico
> 7 inteiro (Growth Engine, exceto `GH-GROW-05`), e um plano estratégico
> BMAD completo para multiplayer (**Épico 13, novo**) — ver seção
> "🎯 Próxima prioridade" abaixo, é o que o usuário pediu para seguir no
> próximo prompt. Sempre confira `git log -1` antes de confiar neste
> arquivo. Leia também [`GAPS-DE-INTEGRACAO.md`](GAPS-DE-INTEGRACAO.md).

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

`npm run typecheck && npm test && npm run build` verdes (229 testes).
Completos: Épicos 1–4, Épico 5 (exceto `GH-SIM-01`), **Épico 7 inteiro
exceto `GH-GROW-05`** (deliberadamente adiado — ver o próprio card), Épico
8 parcial (`GH-EDU-01`), Épico 10 (Pitch Readiness), Épico 11 (exceto
`GH-EVT-05`). `GH-MAPA-04` (benchmark) e `GH-GROW-04` (destaque do bairro)
verificados contra o dado semeado de `GH-PITCH-01` — números bateram
exatos em ambos (média de tecnologia 61/6; Radiz venceu o destaque com
5 eventos = 3 contratações + 1 parceria + 1 lição). Bug real corrigido:
constraint `segmento` do Supabase desalinhada do tipo TS.

**⚠️ Não é "backlog inteiro terminado"** — lista completa do que falta,
mantida em sincronia com os checkboxes reais de `BACKLOG-PRODUTO.md`:

| Card | Situação |
|---|---|
| `GH-SIM-01` — motor de simulação (ECS/tick) | Maior card do backlog, adiado de propósito |
| `GH-MAPA-02` — zoom do mapa em 3 camadas | Não feito |
| `GH-MAPA-03` — identidade visual do pin | Não feito — depende de `GH-MAPA-02` (`Depende de` no próprio card), respeitado, não pulado |
| `GH-GROW-05` — painel de oportunidades (admin) | Adiado de propósito — dado sensível cross-tenant |
| `GH-EDU-02` — diagnóstico guiado em PDF | Não feito — precisa decidir lib de PDF, nenhuma existe hoje |
| `GH-OPS-01/02/03` — deploy real, CI/CD, RLS em runtime | **Precisa do usuário** — VPS/GitHub/Supabase reais |
| `GH-EVT-05` — roles reais via Supabase Auth | Dívida técnica documentada, P3, não puxada |
| Épico 12 (equipe humana/finanças/rh-motivação) | Só placeholder no backlog — zero levantamento, zero código |
| 🔴 de `GAPS-DE-INTEGRACAO.md` (RLS de `negocios`) | Adiado — precisa de Postgres real pra validar runtime |
| `GH-PITCH-01` | Parcial — validado nos dados, **nunca num navegador real** |

## ✅ Entregue fora do Épico 13 (a pedido do usuário, 2026-07-28)

**`GH-EQP-04` — Entregáveis dos Funcionários de IA.** Os agentes agora
PRODUZEM material baixável personalizado pelo onboarding:
Documentador → Business Model Canvas (HTML imprimível); Social Media →
post pronto (PNG 1080×1080 com cor/fonte da marca); Comercial → script
comercial + cadência (HTML). Níveis 1–3 controlam a profundidade do
material (migration `0024`). Habilidades destravadas por nível na UI.

**`GH-WORLD-07` — Upgrade de equipamento.** Móveis evoluem até o nível 3;
cada nível reaplica o bônus de atributo (total = base × nível), com custo
que garante por construção que evoluir nunca seja mais barato que comprar
novo (migration `0025`).

**Telas Mercado e Finanças + HUD navegável + celular e inventário.** Os
três indicadores do topo (moeda/rede/ciclo), os botões inferiores e os do
canto superior direito passaram a navegar de verdade. Mercado e Finanças
são **projeções puras** do estado já persistido — nenhuma tabela nova.
Regra crítica preservada em `features/financas/calculo.ts`: `saldoVirtual`
(🪙) e `compromissoMensalReal` (R$) são campos separados que **nunca são
somados** — a tela não pode sugerir que uma moeda vira a outra.

**`GH-WORLD-08` — Interação por proximidade com NPCs.** Chegar perto de um
Funcionário de IA (raio 1, distância de Chebyshev — diagonal conta como
adjacente) abre o painel com cargo, nível, habilidades destravadas, a
próxima bloqueada e o botão de baixar o entregável. Na sede de outro
negócio o mesmo painel vira pitch ("este negócio usa um X — contrate o
seu"). Regra pura em `world/engine/proximidade.ts` (16 testes), disparo
via `cena.aoParar` no `render/` — nenhuma regra entrou no Pixi.

⚠️ **Como isso foi validado (e o que o navegador não conseguiu provar):**
o painel disparado por caminhada foi verificado ao vivo com a técnica do
`AGENTS.md` (`cena.andarPara` + `cena['avancar']` na mão). Já o
**encontro na entrada** (nascer ao lado de um agente) não pôde ser visto:
com o painel do navegador não exibido, a aba fica `visibilityState:
"hidden"`, o React **nunca hidrata** (nenhum `__reactProps$` nos
elementos) e nenhum `useEffect` roda — sintoma que se confunde com bug de
código. A cobertura foi feita por teste em vez de por pixel:
`proximidade.test.ts` trava, para os 4 níveis de sede, que o primeiro
agente nasce dentro do raio de quem entra.

**`GH-EQP-05` — Entregável do Editor de Vídeo (roteiro de Reels).** Fecha
o último cargo órfão: `editor-video` era contratável e não produzia
arquivo nenhum. Agora entrega roteiro cena a cena (o que falar + o que
aparece na tela), com legenda, hashtags e — nos níveis 2 e 3 — ganchos
alternativos e plano de reaproveitamento. **Roteiro, não MP4, de
propósito:** ver o card no backlog.

**`GH-MULTI-03` — Presença ao vivo no World.** Quem mais está visitando a
mesma sede aparece como avatar; chegar perto abre o atalho para a sede
dele. O caminho de código do multiplayer está FECHADO — falta só a
verificação viva, que depende da Fase 0 (Supabase real, precisa de você).

🔒 **Duas decisões de privacidade que não podem ser desfeitas sem pensar:**
o canal de presença transmite o nome do **NEGÓCIO**, nunca `sessao.nome`
(nome da pessoa), porque o canal Realtime é público por padrão; e

🔒 **Detalhe de segurança que vale lembrar ao mexer aqui:**
`/api/entregavel/[tipo]` deriva o tenant **da sessão, nunca de query
param** — o canvas carrega dado de onboarding (faixa de investimento,
gargalo), o mais sensível do sistema. É o oposto de `/api/og/conquista`,
que é público de propósito porque só mostra fachada.

## 🎯 Próxima prioridade — Épico 13: Multiplayer Real

**A próxima ação é a Fase 0, e ela precisa do usuário** (Supabase local,
`supabase start` — exige Docker, que não existe neste ambiente).

### Ordem, com o motivo de cada posição

| # | O que | Estado |
|---|---|---|
| **0** | **Fase 0** — provar que `GAMEHUB_DB=supabase` funciona ponta a ponta (= `GH-OPS-03`) | ⛔ **precisa do usuário** (Docker/Supabase local) |
| 1 | `GH-MULTI-00` — endurecer RLS de `negocios` | SQL especificado e com sintaxe validada; aplicar/verificar exige a Fase 0 |
| 2 | `GH-MULTI-01` — VPS + Supabase hospedado (= Épico 9) | ⛔ **precisa do usuário** (SSH, GitHub secrets, projeto Supabase) |
| 3 | `GH-MULTI-02` — canal de presença | 🟡 **código FEITO e testado** (15 testes, canal simulado); falta só a verificação viva |
| 4 | `GH-MULTI-03` — integrar no `VisitaScreen` | Não iniciado; pré-requisito já mapeado (ver abaixo) |

**Por que a Fase 0 existe (achado que reordenou o plano):** as 23
migrations nunca foram aplicadas em sequência e o `SupabaseRepository`
nunca executou — o app inteiro só rodou em modo arquivo. Construir
multiplayer antes disso é depurar 23 migrations e um recurso novo ao
mesmo tempo. Detalhe em `architecture/BMAD-MULTIPLAYER-VPS.md` §4.0.

### Se quiser avançar SEM infraestrutura nova

`GH-MULTI-03` é o próximo passo autônomo possível — mas só faz sentido
depois da verificação viva do `GH-MULTI-02` (senão integra-se contra algo
que nunca rodou de verdade). O pré-requisito concreto já está mapeado:
`src/app/world/visitar/[tenantId]/page.tsx` chama `lerSessao()` mas não
passa a identidade do **visitante** para `VisitaScreen` — precisa
threadar `{ tenantId, nome }` como prop.

Alternativa totalmente independente de multiplayer:
`GH-MAPA-02` (zoom do mapa) → `GH-MAPA-03` (visual do pin, depende do
anterior) → `GH-EDU-02` (diagnóstico em PDF).

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
3. `docs/architecture/BMAD-MULTIPLAYER-VPS.md` +
   `docs/world/PLANO-PRESENCA-REALTIME.md` — o plano de multiplayer, se
   for por aí no próximo prompt.
4. `docs/pitch/ROTEIRO-DEMO.md` + `docs/pitch/NARRATIVA-IMPACTO.md` — o
   material do pitch em si.
5. `docs/GAPS-DE-INTEGRACAO.md` — o que existe mas não está costurado.
6. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
7. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
