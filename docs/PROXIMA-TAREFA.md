# Próxima tarefa — leia isto primeiro (economiza contexto)

> **✅ Code review (bmad-code-review) rodado em 2026-08-18/19** sobre o
> diff inteiro das Tarefas A/B/C/D (`71ad0d3..335c96c`, 31 arquivos) — dois
> revisores em paralelo (Blind Hunter, só o diff; Edge Case Hunter, com
> acesso ao repo), sem spec/story formal (`no-spec`). 17 achados triados:
> **7 corrigidos**, 4 descartados como falso-positivo (verificados contra o
> código real), 6 registrados como pendência pré-existente/baixo risco.
>
> **Corrigido:**
> 1. `scan-and-generate.mjs` tratava falha de rede/RPC ao buscar
>    concorrentes IGUAL a "nenhum concorrente encontrado" — o 7º documento
>    podia afirmar falsamente "você é o primeiro do segmento" numa rodada
>    onde os dados só não puderam ser buscados. Agora os dois casos têm
>    texto diferente (`concorrentes === null` vs `[]`), e
>    `06-analise-concorrencia.md` instrui a IA a nunca declarar
>    exclusividade quando o dado está indisponível.
> 2. `CapituloCard.tsx` declarava `role="dialog" aria-modal="true"` sem
>    cumprir a semântica: sem foco inicial, sem trap de Tab (dava pra
>    tabular pra elementos do `/hub`/`/world` por trás do overlay) e sem
>    travar o scroll do `<body>` (rolava por teclado atrás do modal —
>    mesma superfície mobile que motivou o fix original). Corrigido com
>    `useEffect` (foco no painel, ciclo de Tab preso ao dialog,
>    `body.style.overflow='hidden'` com cleanup) — validado com Playwright
>    de verdade (foco inicial ✓, 8 Tabs seguidos nunca escapam ✓, overflow
>    volta ao normal ao fechar ✓). Escape continua sem handler DE
>    PROPÓSITO — é uma decisão de jogo obrigatória, não um modal comum.
> 3. `deploy/supabase-up.sh` relia `PORTA_KONG` de volta do `.env` na
>    mensagem final — desde a correção do incidente Kong (commit anterior)
>    é o `export` que decide a porta real publicada, não mais o arquivo;
>    reler do `.env` reportava a porta ERRADA (8000) quando o arquivo
>    tinha o valor antigo, mesmo com o Kong real no ar em 8010. Agora usa
>    `$KONG_HTTP_PORT` (a variável já exportada) direto.
> 4. `scoring.ts`: `PONTOS_LICITACAO[r.licitacaoPublico]` sem fallback —
>    um `FormData` forjado com valor fora do enum (bypass da UI normal)
>    faria a busca retornar `undefined`, propagando `NaN` por `score`/
>    `xpInicial` até um insert que rejeita `xp: null` sem mensagem
>    amigável. Adicionado `?? 0`.
> 5. As 4 perguntas de texto livre novas (`problemaPrincipal`,
>    `diferencial`, `provaSocial`, `concorrentesConhecidos`) não tinham
>    teto de tamanho antes de virar contexto pro prompt de IA do
>    document-engine. Adicionado `maxLength: 300` no tipo `Pergunta` +
>    Wizard (client) e truncamento espelhado em `actions.ts` (server —
>    cliente nunca é fonte de verdade sozinho, regra 4 do AGENTS.md).
> 6. `/privacidade` não mencionava que dados públicos de OUTROS tenants
>    (nome/segmento/bairro/nível/degrau) podem aparecer agregados no
>    documento "Análise de Concorrência" — adicionada uma frase
>    esclarecendo (o dado em si já era público antes, isso é só
>    transparência sobre o novo formato). Versão da política subiu pra
>    `2026-08-18b` (mesmo protocolo já usado nesta sessão).
>
> **Descartado (falso-positivo, verificado contra o código real):**
> changelog "3 call sites" vs diff "2 hunks" (na verdade `/hub` nunca
> passava `className`, não precisava de diff — typecheck/build confirmam);
> "falta migration pros 8 campos novos" (`onboardings.respostas` já é
> `jsonb`); "PONTOS_LICITACAO satura o score em 100" (clamp deliberado
> pré-existente, já documentado no teste); "contagem de testes
> inconsistente 326 vs 329" (não é inconsistente — `contexto.test.ts` foi
> adicionado ENTRE os blocos de Tarefa B e C serem escritos).
>
> **Deferido** (pré-existente ou baixo risco, não é regressão desta
> sessão): mesmo padrão de cast sem validação runtime em `equipe`/
> `investimento`/outros enums pré-existentes (só corrigi o campo NOVO,
> `licitacaoPublico`); `DROP CONSTRAINT` sem `IF EXISTS` na migration
> (mesmo padrão da 0038, já aplicada com sucesso); RPC `concorrentes_regiao`
> sem clamp em `p_limite` (zero risco real — só chamada internamente com
> valor fixo); risco de prompt injection via texto livre indo pro prompt
> de IA (arquitetural, pré-existente desde `bairro`/`nomeNegocio`,
> amplificado mas não introduzido — mitigado parcialmente pelo teto de 300
> chars, fix completo é tarefa maior de sandboxing do motor headless);
> falta de teste automatizado pro `CapituloCard` e auditoria formal
> multi-viewport do GameShell (já rastreados abaixo, sem mudança).
>
> Gates verdes depois de tudo: typecheck, 329/329 testes, build.

> **✅ Tarefas A, B, C e D — TODAS fechadas e NO AR em 2026-08-18**
> (continuação da mesma sessão, depois de retomar de um corte por limite de
> uso). Commit em produção (porta 3006): confira `git log --oneline -1` e
> compare com `c5d3976` — se bater ou for mais novo, está tudo aqui
> descrito no ar. Deploy feito via `./deploy/docker/update.sh`, healthcheck
> confirmado, e validado ao vivo contra a própria produção (`/cadastro`
> mostra "Passo 1 de 20", landing menciona "Análise de Concorrência" e "7
> documentos gerados por rodada"). Cada tarefa abaixo tem seu próprio bloco
> `✅` com o detalhe do que foi feito/validado — leia o bloco da tarefa que
> for mexer antes de assumir que precisa redescobrir algo.
>
> **O que NÃO ficou pronto** (real, não modéstia): (1) sem teste
> automatizado (Vitest/RTL) para `CapituloCard`/`CapituloGate` — só
> validação manual via Playwright; (2) `/world`/`/world/v2`/`/hub` com o
> GameShell autenticado nunca passou por auditoria formal multi-viewport
> (só os testes pontuais da Tarefa D); (3) o `.env` do stack Supabase desta
> VPS pode ainda não ter `KONG_HTTP_PORT=8010` persistido — o risco foi
> neutralizado no código (`deploy/supabase-up.sh` agora exporta o default
> sozinho), mas ninguém confirmou o valor real gravado no arquivo (bloqueado
> por permissão de acesso a segredo nesta sessão).
>
> **Contexto de sessões anteriores (o que já estava no ar antes desta
> rodada, verificado de verdade, não só "deveria funcionar"):**
> - **GH-DOC-01** (`document-engine/`): motor de documentação por IA
>   expandido de 2 → 6 tipos (Canvas, Modelo de Negócio, SWOT, Resumo
>   Executivo, Roadmap, Proposta Comercial), cron horário +
>   `gerar-agora.sh`/`.bat` (gatilho manual) + `run-evento.sh` (cron de
>   5min pro dia da apresentação). Achado e corrigido um `SyntaxError`
>   real em `prompt.mjs` (backticks aninhados quebrando o parse) que
>   travava TODA geração silenciosamente — só foi achado rodando uma
>   geração de verdade, não pelos gates.
> - **GH-MKT-01** (`src/features/landing/`): `/` deixou de ser o demo
>   direto e virou landing de marketing de verdade (seções modulares em
>   `sections/` + `content.ts` como fonte única de copy/dados), CTA
>   maior (`LandingLinkButton` ganhou prop `size`), escada de valor real
>   (`DEGRAUS`) como oferta — sem inventar checkout que não existe. Demo
>   antigo realocado pra `/demo`.
> - **`/apresentacao`**: tela de QR Code pra projetar no telão do Sebrae,
>   aponta pra `NEXT_PUBLIC_LANDING_URL` (default IP:porta desta VPS, sem
>   domínio ainda).
> - **Vídeo de backup**: `deploy/apresentacao/assets/demo-backup.mp4`
>   (gravado com Playwright, dados reais, não versionado no git).
> - **Validado 2x com cadastro real de ponta a ponta** (Playwright,
>   celular simulado): landing → 10 perguntas → conta real → `/painel` →
>   `gerar-agora.sh` → os documentos aparecendo de verdade → login de
>   novo com o mesmo e-mail. Dados de teste sempre apagados depois.
> - **Commit no ar em produção (porta 3006):** `144ba8d` (branch
>   `integracao-deploy-vps`) — confira `git log --oneline -10` pra ver se
>   mudou desde então.
> - **Achado, NÃO desta sessão** (só reportado pelo fundador testando num
>   iPhone real): `/world` e `/world/visitar/[tenantId]` não abrem no
>   celular — ver Tarefa D abaixo. Esta sessão nunca tocou nesses
>   arquivos.

## Tarefa A — Onboarding mais rico (perguntas + score de ICP + escada de valor)

> **✅ Código implementado em 2026-08-18 (continuação da sessão anterior).**
> As 19 perguntas revisadas (lista final da matriz de rastreabilidade abaixo,
> não a lista de 8 da 1ª passada) estão em
> `src/features/onboarding/perguntas.ts`; tipo `Respostas`
> (`src/lib/db/types.ts`), `scoring.ts`/`scoring.test.ts`,
> `features/auth/actions.ts` (`cadastrar`) e
> `features/documentos-gerados/contexto.ts` todos atualizados. Gates verdes:
> `npm run typecheck && npm test (326/326) && npm run build`.
> **✅ Validado de ponta a ponta em 2026-08-18** (mesma sessão): Playwright
> real (não emulação de DevTools) contra uma instância local apontada pro
> MESMO Supabase de produção (`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:8010`)
> — as 19 perguntas + tela de conta preenchidas clicando de verdade
> (`Passo 1 de 20` → `Passo 20 de 20`), conta criada, redirect pra
> `/painel` confirmado, fit comercial 100/100 e degrau-alvo 5 bateram
> exatamente com a fórmula esperada (licitação regular + engenharia +
> faturamento alto). Zero erro de console/página. Dados de teste apagados
> depois (negócio, onboarding, auth.users, documentos — nada ficou pra
> trás). Ver Tarefa B abaixo pro restante do fluxo (geração dos 7
> documentos).

**Revisão 2026-08-18 (2ª passada, pedido do fundador: "garanta que as
perguntas são as melhores pro objetivo de gerar documentação"):** auditei
a lista de 8 perguntas novas contra os 7 documentos reais que o motor
gera — achei 2 lacunas de verdade e 2 perguntas de baixo valor pra
documentação (mantidas só por "seria legal saber"). **Troca recomendada,
NÃO implementada ainda** (é só a lista de campos que muda, o resto do
plano de arquivos abaixo continua valendo):

**Matriz de rastreabilidade — pergunta → documento que ela alimenta**
(perguntas sem nenhum documento associado são candidatas a cortar; a
`01-corpus-oficial-gamehub.md` seção E.1 e os arquivos `02-05` da
knowledge-base já definem a estrutura exata de cada documento):

| Pergunta | Canvas | Modelo Negócio | SWOT | Resumo Exec. | Roadmap | Proposta Comercial | Concorrência |
|---|---|---|---|---|---|---|---|
| segmento, cidade, bairro (existentes) | ✓ (Segmentos) | ✓ | ✓ | ✓ | | | ✓ |
| **`problemaPrincipal`** (NOVA) | ✓ (Proposta de Valor) | ✓✓ (é a pergunta #1 do OFC, D.2 do corpus) | | | | ✓ | |
| equipe, presencaDigital (existentes) | ✓ (Recursos-Chave/Canais) | | ✓ (atributos) | | ✓ | | |
| `licitacaoPublico` (NOVA) | | ✓ (posicionamento) | | | | | |
| captacao (existente) | ✓ (Canais) | | ✓ | | ✓ | | |
| **`modeloReceita`** (NOVA) | ✓✓ (Fluxos de Receita — hoje SEM NENHUM dado) | ✓ (unit economics) | | | | | |
| `ticketMedio` (NOVA) | ✓ (Fluxos de Receita) | ✓✓ (unit economics) | | | | ✓ | |
| `clientesPagantes` (NOVA) | | | | ✓ (5 números) | | | |
| `faturamentoFaixa` (NOVA) | | ✓ (porte) | | | | | |
| `diferencial` (NOVA) | ✓ (Proposta de Valor) | ✓✓ (vantagem injusta, tese em 3 pilares) | ✓ (forças) | | | ✓ | |
| **`provaSocial`** (NOVA, opcional) | | | | | | ✓✓ (hoje a seção fica VAZIA sem isso — ver `05-proposta-comercial.md`) | |
| `concorrentesConhecidos` (NOVA) | ✓ (Parceiros/Concorrência) | | ✓ (ameaças) | | | | ✓✓ |
| objetivo, gargalo, investimento (existentes) | ✓ (Estrutura de Custos) | ✓ | ✓ (fraquezas) | ✓ | ✓✓ | | |

**Cortar** (mantidas na primeira passada, mas nenhum documento depende
delas de forma central — são "seria legal saber", não "a IA precisa
disso"):
- `anosDeOperacao` — nenhuma seção de nenhum documento pede maturidade em
  anos especificamente (a escada de valor já mede maturidade melhor, via
  atributos+degrau).
- `decisor` — só ajudaria um script comercial de VENDA (que este produto
  não gera hoje — ver `docs/ARQUITETURA.md` sobre escopo), não os 7
  documentos reais.

**Adicionar no lugar** (lacunas reais achadas nesta auditoria):
- `problemaPrincipal` (texto curto, ~1 frase) — "Qual problema você
  resolve pros SEUS clientes?" — é literalmente a primeira das 7
  perguntas OFC (`01-corpus-oficial-gamehub.md`, seção D.2) que TODO
  Modelo de Negócio precisa responder, e hoje **não existe pergunta
  nenhuma sobre isso** — as 10 perguntas atuais só perguntam sobre o
  GARGALO INTERNO do próprio negócio (ex. "perco leads"), nunca sobre o
  problema que ele resolve pro cliente dele. Lacuna mais grave achada.
- `modeloReceita` (escolha: `"projeto-unico" | "assinatura-recorrente" |
  "comissao-resultado" | "venda-produto" | "combinacao"`) — bloco "Fluxos
  de Receita" do Canvas (um dos 9 blocos obrigatórios, ordem D.1) hoje não
  tem NENHUM dado de onboarding pra se basear — a IA teria que
  `[HIPÓTESE]` o bloco inteiro.
- `provaSocial` (texto curto, opcional, aceitar "ainda não tenho") — hoje
  `05-proposta-comercial.md` (seção "Prova social") **omite a seção
  inteira** quando não há dado — ter essa pergunta faz a Proposta
  Comercial sair completa, não capada, na maioria dos cadastros.

**Lista final revisada (9 perguntas novas, era 8 — mesma ordem sugerida:
identidade → `problemaPrincipal` → operação → `licitacaoPublico` →
`modeloReceita`/`ticketMedio`/`clientesPagantes`/`faturamentoFaixa` →
`diferencial`/`provaSocial`/`concorrentesConhecidos` → objetivo/gargalo/
investimento):**

1. `problemaPrincipal` — texto curto.
2. `licitacaoPublico`: `"vende-regularmente" | "ja-vendeu" | "tem-interesse" | "nao-e-foco"` (ICP real, entra no score — ver fórmula abaixo, inalterada).
3. `modeloReceita`: `"projeto-unico" | "assinatura-recorrente" | "comissao-resultado" | "venda-produto" | "combinacao"`.
4. `ticketMedio`: `"ate-500" | "500-2000" | "2000-10000" | "10000-50000" | "acima-50000" | "nao-sei"`.
5. `clientesPagantes`: `"nenhum" | "1-5" | "6-20" | "21-50" | "mais-50"`.
6. `faturamentoFaixa`: `"ate-10k" | "10-30k" | "30-100k" | "100-300k" | "acima-300k" | "prefiro-nao-informar"` (entra no `degrauAlvo`, inalterado).
7. `diferencial` — texto curto.
8. `provaSocial` — texto curto, opcional ("ainda não tenho" é resposta válida).
9. `concorrentesConhecidos` — texto curto, opcional.

**Total: 19 perguntas + conta = 20 passos** (era 18+1=19 na 1ª versão —
só 1 a mais, e a composição é bem melhor: 5 dos 9 novos campos agora têm
um documento específico dependendo deles, contra 3 de 8 antes).

Fórmula de score/degrau (`scoring.ts`) e o ajuste do teste
(`scoring.test.ts`) **continuam exatamente como já estava planejado**
abaixo — só `licitacaoPublico` e `faturamentoFaixa` entram na conta, os
outros 7 campos novos são só ficha/documentação, sem tocar a fórmula.

### Plano de arquivos (original, ainda válido)

**Pedido do fundador:** melhores perguntas de cadastro pra alimentar a IA
geradora de documentos, entender se o negócio é cliente ideal (ICP/BANT) e
como subir a escada de valor (cobrar mais). Usar o V4MOS
(`/opt/v4mos/src/lib/questions/index.ts`, 38 perguntas em 8 blocos, cada
uma com `aiHint` explicando pra que serve) como inspiração de qualidade —
mas SEM copiar o volume: o cadastro do gamehub é feito ao vivo, no celular,
na frente de um jurado (ver Tarefa B) — 18 perguntas curtas (majoritariamente
`escolha`/chips, poucos `texto` curtos), não 38 parágrafos.

**Descoberta importante: nenhuma migration é necessária pras perguntas em
si** — `onboardings.respostas` já é `jsonb` (`0001_init.sql`), só estender
o TypeScript.

**Plano já fechado — 8 perguntas novas, adicionar em
`src/features/onboarding/perguntas.ts` nesta posição relativa às 10
atuais** (identidade/segmento/local → NOVAS → operação → NOVAS →
objetivo/gargalo/investimento):

1. `anosDeOperacao`: `"menos-1" | "1-3" | "3-10" | "mais-10"` — maturidade.
2. `licitacaoPublico`: `"vende-regularmente" | "ja-vendeu" | "tem-interesse" | "nao-e-foco"`
   — **a mais valiosa**: é o ICP real do Lab Demarchi/Siga Pregão (fornecer
   pro poder público via licitação) e HOJE não é perguntado.
3. `clientesPagantes`: `"nenhum" | "1-5" | "6-20" | "21-50" | "mais-50"`.
4. `faturamentoFaixa`: `"ate-10k" | "10-30k" | "30-100k" | "100-300k" | "acima-300k" | "prefiro-nao-informar"`.
5. `ticketMedio`: `"ate-500" | "500-2000" | "2000-10000" | "10000-50000" | "acima-50000" | "nao-sei"`.
6. `diferencial`: texto curto — "Em 1 frase, por que um cliente escolhe
   você e não o concorrente?"
7. `decisor`: `"dono" | "socio-financeiro" | "equipe-compras" | "depende-do-valor"`.
8. `concorrentesConhecidos`: texto curto, opcional na prática (aceitar
   "não sei") — "Você sabe quem são seus 2-3 concorrentes na região?"

**Arquivos a tocar, em ordem:**
1. `src/lib/db/types.ts` — `Respostas` ganha os 8 campos.
2. `src/features/onboarding/perguntas.ts` — 8 `Pergunta` novas (`tipo`
   `escolha`/`texto`, mesmo padrão das 10 atuais — **Wizard.tsx NÃO precisa
   mudar**, é 100% data-driven a partir deste array).
3. `src/features/onboarding/scoring.ts` (`calcular()`) — só 3 campos novos
   entram no score/degrau (os outros 5 só enriquecem a ficha pra IA, sem
   tocar a fórmula):
   - `licitacaoPublico`: `vende-regularmente` +25, `ja-vendeu` +12,
     `tem-interesse` +5, `nao-e-foco` +0 (score já é clampado em [0,100],
     não precisa reduzir outros pesos).
   - `faturamentoFaixa`: `100-300k`/`acima-300k` → `+1` no `degrauAlvo`
     (capado em 5); outras faixas neutras (sem alterar).
   - `clientesPagantes`: pontos pequenos de tração no score (opcional, só
     se sobrar tempo — não é essencial).
4. `src/features/onboarding/scoring.test.ts` — **CRÍTICO**: o helper
   `respostas()` no topo do arquivo constrói um `Respostas` só com os 10
   campos atuais — vai quebrar o typecheck assim que o tipo crescer. Setar
   o default pra `licitacaoPublico: "vende-regularmente"` (o fixture já
   representa "ICP ideal", e licitação regular É o ICP real — o teste
   `scoreFit >= 90` continua passando, só fica mais alto, clampado em 100).
   Pra faturamento, usar um valor NEUTRO (`"30-100k"`) no fixture padrão
   pra não alterar o `degrauAlvo: 4` já asserido no teste "ICP ideal mira
   degrau alto".
5. `src/features/auth/actions.ts` (`cadastrar()`) — ler os 8 campos novos
   do `FormData` pro objeto `Respostas` (mesmo padrão `texto(fd, "campo")
   || "default"` das linhas 151-165 atuais).
6. `src/features/documentos-gerados/contexto.ts`
   (`construirFichaMarkdown()`) — incluir as respostas novas na seção "4.
   Diagnóstico de onboarding" da ficha (mesmo padrão das linhas
   existentes).

## Tarefa B — 7º documento: Análise de Concorrência (dados REAIS, não inventados)

> **✅ Código implementado em 2026-08-18 (continuação da sessão anterior).**
> Migration `0039_analise_concorrencia.sql` (constraint de `tipo` + RPC
> `concorrentes_regiao`, sintaxe validada com `pg-query-emscripten` — sem
> Postgres local, ainda não aplicada em nenhum banco real);
> `document-engine/scripts/lib/supabase.mjs` (`fetchConcorrentes`),
> `scan-and-generate.mjs` (busca concorrentes, escreve
> `context-concorrentes.md`, 7ª entrada no `DOC_TYPE_MAP`, timeout 30min),
> `lib/prompt.mjs` (7 documentos) e
> `knowledge-base/06-analise-concorrencia.md` (metodologia) todos
> atualizados; `00-INDEX.md`/`01-corpus-oficial-gamehub.md` refletem 7
> documentos. Fiação de UI: `src/lib/db/types.ts`
> (`DocumentoGerado.tipo`), `DocumentosPainel.tsx` (`TITULO_TIPO` + texto),
> `features/landing/content.ts` (`DOCUMENTOS` + `STATS`). Gates verdes:
> `typecheck && test (326/326) && build`.
> **✅ Migration aplicada e RPC validada em 2026-08-18** (mesma sessão):
> `deploy/supabase-up.sh` rodou contra o Supabase self-hosted real da VPS —
> `0039_analise_concorrencia.sql` aplicada (rastreada em
> `_migrations.aplicadas`). `concorrentes_regiao` testada com 3 tenants
> reais (`tenant 1 "admin"` retornou os 2 concorrentes reais do mesmo
> segmento/cidade — `Lab Demarchi`, `Admin`; `tenant 9`/`tenant 6`, únicos
> no segmento, retornaram lista vazia corretamente) — via REST/Kong (mesmo
> caminho de `scan-and-generate.mjs`) e via `psql` direto. ACL do Postgres
> confirma `proacl = {postgres=X,service_role=X}` — nem `anon` nem
> `authenticated` têm `execute`, grant correto.
> ⚠️ **Incidente durante o processo (resolvido, ~1-2min de downtime):**
> `deploy/supabase-up.sh` recriou o container `gamehub-supabase-kong` e ele
> subiu na porta 8000 (host) em vez de 8010, colidindo com o Supabase do
> Company HQ (`supabase-kong`, também nesta VPS) — o `.env` do stack
> aparentemente não tinha `KONG_HTTP_PORT=8010` persistido (ou nunca foi
> escrito nele, apesar do comentário do script dizer que a 1ª execução
> grava isso). Corrigido passando `KONG_HTTP_PORT=8010` explícito na
> chamada do script — funcionou, mas o `.env` do stack pode continuar sem
> essa variável, o que reproduziria o mesmo incidente na PRÓXIMA vez que
> `supabase-up.sh` rodar sem o override explícito. **Próxima sessão:**
> confirmar (o agente não pôde ler `.env` — bloqueado por política de
> permissão de arquivo de segredo) e, se for o caso, adicionar
> `KONG_HTTP_PORT=8010` de forma persistente, ou sempre chamar o script com
> `KONG_HTTP_PORT=8010 ./deploy/supabase-up.sh` daqui em diante.
> **Ainda falta:** validar a geração do 7º documento de ponta a ponta com
> um cadastro real via UI (Playwright) — a RPC/dado foi validado, mas o
> `claude -p` headless gerando o `07-analise-concorrencia.md` de verdade
> ainda não rodou nesta sessão.

**Pedido do fundador:** documento comparando o negócio a outros perfis do
MESMO segmento na MESMA região, usando dados reais do próprio jogo (nunca
concorrente fictício).

**Descoberta importante:** a hierarquia `cidades → bairros →
quarteiroes → negocios` já existe (`0001_init.sql`) e RPCs parecidos já
existem (`vizinhos_do_tenant`, `benchmark_bairro`, `destaque_bairro` —
ver `src/lib/db/supabase-adapter.ts` linhas ~310-365 e ~717) — seguir o
MESMO padrão arquitetural (RPC `security definer`, só `service_role`), não
inventar um novo.

**Plano:**
1. **Nova migration** `supabase/migrations/0039_analise_concorrencia.sql`:
   - `alter table documentos_gerados drop constraint
     documentos_gerados_tipo_check` + recriar incluindo
     `'analise-concorrencia'` (mesmo padrão da migration `0038`, que já fez
     isso pros outros 4 tipos).
   - RPC nova `concorrentes_regiao(p_tenant_id bigint, p_limite int
     default 6)` — dado o tenant, resolve `segmento` + `cidade_id` dele
     (join `negocios → quarteiroes → bairros`), e retorna outros negócios
     **mesmo segmento, mesma cidade, `perfil_publico = true`**, campos
     `nome, segmento, nivel, degrau_atual, bairro_nome, criado_em` — só
     dado já público hoje (mesmas colunas de `negocios_publico`).
     Rascunho de SQL já resolvido — a sessão anterior chegou a escrever a
     função inteira (plpgsql, `security definer`, `set search_path = ''`,
     `revoke ... from public, anon, authenticated` + `grant ... to
     service_role`) — só falta colar num arquivo de migration e rodar.
2. `document-engine/scripts/lib/supabase.mjs` — método novo
   `fetchConcorrentes(tenantId)` chamando
   `POST /rest/v1/rpc/concorrentes_regiao`.
3. `document-engine/scripts/scan-and-generate.mjs`:
   - Depois de ler o item da fila (já tem `tenant_id`), chamar
     `fetchConcorrentes` e escrever o resultado em
     `context-concorrentes.md` na pasta do cliente (lista dos concorrentes
     reais, ou "nenhum concorrente do mesmo segmento cadastrado ainda
     nesta cidade" — tratar o caso vazio com honestidade, não inventar).
   - `DOC_TYPE_MAP` ganha uma 7ª entrada: `{ file:
     "07-analise-concorrencia.md", type: "analise-concorrencia", title:
     "Análise de Concorrência" }`.
   - `CLAUDE_TIMEOUT_MS` sobe um pouco (7 docs agora vs. 6) — considerar
     ~30 min.
4. `document-engine/scripts/lib/prompt.mjs` — instruir a ler
   `context-concorrentes.md` e escrever o 7º arquivo. Regra inegociável:
   **nunca inventar concorrente que não esteja na lista real** — se vazia,
   escrever sobre dinâmica regional/segmento em geral (usando também a
   resposta livre `concorrentesConhecidos` do onboarding, se preenchida),
   nunca fabricar um nome de empresa.
5. **Novo arquivo de metodologia**
   `document-engine/knowledge-base/06-analise-concorrencia.md` (mesmo
   estilo dos arquivos 02-05 já existentes — estrutura de saída, regras de
   rigor, checklist).
6. Atualizar `00-INDEX.md` e `01-corpus-oficial-gamehub.md` (seção "Escopo
   atual de geração") pra **7 documentos**.
7. **Fiação de UI/tipos** (mesmo padrão de quando foi de 2→6 documentos,
   já feito nesta mesma sessão anterior, replicar):
   - `src/lib/db/types.ts` (`DocumentoGerado.tipo`) — 7º valor no union.
   - `src/features/documentos-gerados/DocumentosPainel.tsx`
     (`TITULO_TIPO`) — entrada nova.
   - `src/features/landing/content.ts` (`DOCUMENTOS`) — 7º item (o
     `TICKER_ITEMS` deriva automaticamente do array, não precisa mexer).

## Tarefa D — BUG real relatado pelo fundador: mundo/escritórios não abrem no celular (prioridade ABAIXO de A/B/C acima)

> **✅ Causa raiz achada e corrigida em 2026-08-18** (mesma sessão que A/B).
> **NÃO era a suspeita nº 1 original** (desalinhamento de coordenada de
> toque do Pixi) — reproduzido de verdade com Playwright em viewport iPhone
> 13 (390×664, `hasTouch`/`isMobile`), logado numa conta real, e a causa é
> muito mais simples e mais grave: `CapituloGate`/`CapituloCard`
> (`src/features/historia/`) — a carta de história que aparece no topo de
> `/hub` e `/world` (evento do dia 0 "Primeiro dia" E também os eventos
> globais do admin, ex. a campanha ao vivo "SEBRAE · Semana do
> Empreendedor do Vale do Café", que estava ATIVA durante este teste) —
> renderizava como **bloco no fluxo normal da página**, não como modal.
> Numa tela de celular (viewport 664px de altura), o card sozinho já
> ocupava a viewport inteira — o canvas do World (`WorldCanvas.tsx`) ficava
> **inteiramente abaixo da dobra** (medido: topo do canvas a 527–576px
> numa viewport de 664px, ou pior — a mais de 700px quando havia 2 cards
> em sequência), sem NENHUMA pista visual de que dava pra rolar. Um jogador
> real abrindo `/world` no celular via só o card, achava que "não abria" —
> bate exatamente com o relato ("múltiplos bugs, caminhos de falha").
> Confirmado que NÃO era bug de coordenada Pixi: com o card resolvido via
> script, tocar no canvas (dentro da área visível) funcionou sem erro.
>
> **Fix** (`CapituloCard.tsx` + `CapituloGate.tsx`): o card virou overlay
> `fixed inset-0` com backdrop escurecido, painel `max-h-[85vh]
> overflow-y-auto` centralizado — cabe em qualquer viewport, nunca depende
> da altura da tela, nunca empurra o canvas. `CapituloGate` perdeu o prop
> `className` (não faz mais sentido — overlay fixo não depende de onde é
> montado no DOM); as 3 chamadas (`/hub`, `/world`, `/world/v2`)
> simplificadas. Nenhuma mudança de regra de negócio (`escolherNoCapitulo`
> intacta) — só posicionamento visual. Medido depois do fix: canvas sempre
> em `top:178px` numa viewport de 664px, INDEPENDENTE de haver card aberto
> ou não; card sempre cabe inteiro (medido 382px de altura numa viewport de
> 664px) com backdrop cobrindo 100% da tela (confirmado via
> `elementFromPoint` no canto superior). Gates verdes: typecheck, 326/326
> testes, build. `/world/visitar/[tenantId]` testado também (nunca teve
> `CapituloGate` — não estava exposto a este bug, mas confirmado saudável
> no mobile mesmo assim: canvas em `top:178px`, sem erros JS).
> **Ainda não validado**: não há teste automatizado (Vitest/RTL) cobrindo
> este componente — só validação manual via Playwright nesta sessão. Não
> deployado em produção ainda (só testado contra Supabase real via
> instância local apontada pro mesmo banco) — falta rodar
> `./deploy/docker/update.sh` pra ir ao ar de verdade.

**Relato direto, 2026-08-18, testando num iPhone real:** não é possível
entrar no Mundo (`/world`) nem visitar nenhum escritório do quarteirão ou
de outro lugar do mapa, no celular. "Múltiplos bugs, caminhos de falha,
sem boa usabilidade nem experiência". **Isto é sobre o jogo em si
(`/world`, `/world/visitar/[tenantId]`), NÃO sobre a landing/`/apresentacao`**
— a sessão anterior só mexeu na landing e no QR, nunca tocou em
`WorldCanvas.tsx`/Pixi/`/hub`/`/world`, então isto é achado novo, não
regressão desta sessão (mas pode já existir há mais tempo e só agora foi
testado num aparelho real).

**Investigação inicial (rápida, não aprofundada — próxima sessão precisa
ir mais fundo):**
- `src/features/world/render/WorldCanvas.tsx` renderiza o canvas Pixi.js
  com tamanho NATIVO fixo (`Cena.tamanhoCanvas(geo)`, linha ~132) e deixa
  o CSS (`width:100%` + `height:auto`, comentário na linha ~199-201)
  encolher visualmente pra caber na tela — **suspeita nº 1**: em telas
  pequenas isso pode desalinhar a tradução de coordenada de toque
  (`pointerdown`/tap) pro sistema de coordenadas interno do Pixi, fazendo
  o toque cair em outra célula/hitbox que o esperado (ou em lugar nenhum).
- `AGENTS.md` do próprio repo já documenta (seção "Validação sem infra")
  que hit-test do Pixi é frágil e exige sequência específica de eventos
  pra funcionar em automação — sinal de que a equipe já sabia que essa
  área é delicada, mesmo antes deste relato.
- `className="w-full touch-manipulation select-none"` (linha 208) já tenta
  evitar gestos padrão do navegador atrapalharem o toque — não resolveu
  segundo o relato, então o problema provavelmente é mais fundo
  (coordenada errada, não gesto do navegador brigando com o app).

**O que fazer na próxima sessão (nesta ordem):**
1. Reproduzir de verdade com Playwright em viewport mobile real (390×844,
   `hasTouch: true`, `isMobile: true`) — tentar clicar/tocar numa sede
   vizinha em `/world` e ver se o evento chega, com screenshot antes/depois.
   Não confiar só em relato — confirmar a causa raiz primeiro
   (`systematic-debugging`, não corrigir no escuro).
2. Se for mesmo desalinhamento de coordenada: comparar `event.global`/
   `event.data.global` do Pixi com a posição real do toque na tela;
   verificar se `resolution`/`autoDensity` (linhas 140-141) estão sendo
   considerados corretamente pela `EventSystem` do Pixi v8 quando o CSS
   encolhe o canvas abaixo do tamanho nativo.
3. Verificar também a ENTRADA pro mundo a partir do celular (não só o
   clique dentro do mundo): o item "world" do `LateralMenu`
   (`src/features/shell/GameShell.tsx`, `LateralKey`) navega por `href`,
   não por troca de view — conferir se esse link/botão está acessível e
   clicável no layout mobile do `GameShell` (menu lateral pode estar fora
   da área de toque/verticalmente cortado em telas estreitas — nunca
   auditado em celular real, só o `/` e `/apresentacao` foram).
4. Mesma coisa para `/world/visitar/[tenantId]` (visitar escritório de
   outro negócio) — testar o link de entrada E a interação dentro da cena
   visitada.

**Prioridade explícita do fundador:** abaixo das Tarefas A/B/C acima
(onboarding rico, 7º documento, responsividade de outras telas) — só
começar esta depois de fechar aquelas, salvo instrução em contrário.

---

**Depois das duas tarefas:** rodar gates
(`typecheck && test && build`), fazer um cadastro real de ponta a ponta de
novo com Playwright (mesmo script/roteiro já usado 2x nesta sessão —
landing → 18 perguntas → conta → `/painel` → `gerar-agora.sh` →
confirmar os 7 documentos, incluindo o de concorrência, aparecendo de
verdade) — **nunca marcar como pronto sem essa validação real**, apagar
os dados de teste depois — commit + push (`integracao-deploy-vps`) +
`./deploy/docker/update.sh`.

## Tarefa C — Responsividade/UX de ponta a ponta (além da landing)

> **✅ Auditoria feita em 2026-08-18** (mesma sessão de A/B/D) — Playwright
> real (não DevTools), overflow horizontal (`scrollWidth > clientWidth`,
> mesma técnica já validada na landing) em 320/375/390/412/768px:
> - `/entrar`, `/recuperar-senha`: limpos.
> - `/cadastro`: **todos os 20 passos** (as 19 perguntas + conta),
>   preenchendo de verdade em cada um, em 320px e 375px — zero overflow.
>   O padrão existente (`ActionButton fullWidth`, `grid sm:grid-cols-2`)
>   já aguentou as 9 perguntas novas sem ajuste.
> - `/hub`: limpo em todas as larguras testadas.
> - `/painel`: **bug real achado e corrigido** — `OfertasPainel.tsx`
>   (form de "Serviços na sua vitrine") tinha um input "Preço" com
>   `w-32` fixo ao lado de um input "Descrição" `flex-1` **sem
>   `min-w-0`** — o browser não deixava o `flex-1` encolher abaixo do seu
>   min-content em telas de 320-390px, forçando a seção inteira (e por
>   arrasto, a `grid` que a envolve) ~75px mais larga que a viewport
>   (395px medidos, constante, independente da largura da tela — sinal
>   claro de largura fixa por conteúdo, não de layout fluido). Corrigido:
>   `flex-col sm:flex-row` (empilha em telas estreitas) + `min-w-0` no
>   `flex-1` + `Preço` vira `w-full sm:w-32`. Confirmado limpo depois em
>   320/375/390/412/768px.
> - Um falso-positivo descartado: o passo "segmento" do cadastro mediu
>   1-2px de overflow logo após o clique em "Continuar" — sumiu esperando
>   a transição do `framer-motion`/`AnimatePresence` terminar (~450ms);
>   era artefato da animação em trânsito, não layout quebrado.
> Gates verdes: typecheck, 329/329 testes, build. **Ainda falta:**
> `/world`/`/world/v2`/GameShell (`/hub` autenticado com o mundo aberto —
> maior superfície, ver nota "auditar por último" abaixo) não recebeu
> auditoria multi-viewport formal, só os testes pontuais da Tarefa D.

A landing (`/`) e a página de QR (`/apresentacao`) já foram auditadas e
corrigidas nesta sessão anterior — testadas de verdade com Playwright em
13 larguras (320px–1920px) e nos 7 dispositivos-alvo (iPhone SE/14,
Android médio, iPad retrato/paisagem, 720p, 1080p), com um bug real de nav
achado e corrigido. **Isso está feito, não repetir.**

O que falta (pedido explícito: "todos os botões adaptados e do tamanho
ideal do aparelho... adaptado automaticamente seguindo as melhores
práticas"), nas telas que ainda NÃO passaram por essa auditoria:

1. `/cadastro` (Wizard, 19 passos agora com a Tarefa A) — nunca testado em
   celular real via Playwright. Foco: os botões `ActionButton`
   (`src/components/ui/ActionButton.tsx`, `fullWidth` já é o padrão) e o
   grid de opções (`sm:grid-cols-2` em `Wizard.tsx` linha ~229) em telas
   muito estreitas (320-375px) com rótulos longos (ex. "Contabilidade &
   Consultoria & Consultoria").
2. `/painel` — já foi visualmente conferido no teste E2E (screenshots
   full-page), mas não passou por auditoria formal multi-viewport como a
   landing.
3. `/entrar`, `/recuperar-senha` — nunca auditadas.
4. `/hub` (GameShell autenticado) — é a experiência central do jogo,
   maior superfície, maior risco; auditar por último, com mais tempo.

**Padrão a seguir** (já validado e funcionando na landing, replicar):
Playwright com viewport real (não emulação de DevTools) nas mesmas 7
resoluções-alvo + checagem automática de `document.documentElement.
scrollWidth > clientWidth` (overflow horizontal) em cada uma — é o que
achou o bug real do nav truncando. Corrigir achados de verdade antes de
declarar pronto, não só rodar o gate.

**"Tamanho ideal do aparelho, adaptado automaticamente"** — o padrão já
estabelecido (`LandingLinkButton` ganhou prop `size: "sm"|"md"|"lg"` nesta
sessão) é o caminho: aplicar o mesmo raciocínio ao `ActionButton` do jogo
(hoje só tem `fullWidth` boolean, sem variação de tamanho) se a auditoria
do `/cadastro`/`/hub` achar botão pequeno demais pra toque em celular
(mínimo recomendado ~44×44px de área de toque, WCAG 2.5.5).

---

> **🎯 PRIORIDADE #1 — 2026-08-02 (leia ESTA primeiro, antes de tudo
> abaixo, inclusive antes do bloco de bugs críticos logo abaixo):**
> "Mapa Vivo" — redesign completo de UX/visual do Mapa + Sede, nível
> "game enterprise", é a prioridade atual do projeto, por pedido explícito
> do usuário. Qualquer outra tarefa de produto deve ser sequenciada depois
> desta, salvo instrução em contrário. Onde continuar:
> [`CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md`](CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md)
> → aponta pro contexto completo
> ([`mapa-vivo/CONTEXTO-E-DECISOES.md`](mapa-vivo/CONTEXTO-E-DECISOES.md))
> e pro status técnico exato
> ([`mapa-vivo/STATUS-BMAD-UX.md`](mapa-vivo/STATUS-BMAD-UX.md), mantido
> atualizado a cada marco — sempre confira a última seção de lá antes de
> perguntar "onde eu parei"). Estado nesta atualização: as duas spines de
> UX (`DESIGN.md`/`EXPERIENCE.md`) estão escritas, passaram por uma
> Reviewer Gate (completude + acessibilidade) com achados críticos/altos
> já corrigidos, e há 3 mockups HTML prontos — falta o usuário revisar os
> mockups antes do handoff pra arquitetura.

> **🚨 Atualização 2026-08-02 (bugs críticos de produção — ainda
> relevante, leia depois do bloco acima):** dois bugs CRÍTICOS foram
> achados e corrigidos —
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
