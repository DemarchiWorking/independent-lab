# labdatadev-gamehub — guia para agentes de IA (local e na VPS)

> Este arquivo é lido automaticamente pelo Claude Code (`@AGENTS.md` a partir
> de `CLAUDE.md`) sempre que uma sessão roda dentro desta pasta — **no seu PC
> ou na VPS de produção**. Se você é um agente operando aqui, este é o seu
> ponto de partida.

**O que é:** hub gamificado da MEI **Laboratório Demarchi** — metaverso
isométrico (estilo Habbo + Startup Panic) onde empresários regionais se
cadastram, jogam, e **contratam Funcionários de IA** (agentes Claude por
assinatura) e serviços de TI reais. Ver
[`docs/PRODUTO-IA-FUNCIONARIOS.md`](docs/PRODUTO-IA-FUNCIONARIOS.md) (o
produto) e [`docs/ESTADO-DO-PROJETO.md`](docs/ESTADO-DO-PROJETO.md) (o que
está pronto). **Sempre leia esses dois antes de mudar algo.**

> 🎯 **Sessão nova começando aqui?** Leia
> [`docs/PROXIMA-TAREFA.md`](docs/PROXIMA-TAREFA.md) primeiro — estado
> atual + próximo card do backlog + onde mexer, em uma página só.

Objetivo atual: **MVP v1 para pitch** (projeto Sebrae — gamificação e
inovação aplicada a empreendedorismo/PMEs regionais).

---

## Regras não-negociáveis

1. **TypeScript strict — zero `any`.** `npm run typecheck` antes de qualquer
   entrega.
2. **Cor só por token** (`design-system/tokens.ts` → `tailwind.config.ts`).
   Nunca hex avulso em componente.
3. **`lib/` nunca importa de `features/`** (a direção da dependência é
   `features/` → `lib/`). Catálogos estáticos (jobs, cargos, hexNodes) vivem
   em `features/<domínio>/`, nunca em `lib/db/types.ts`.
4. **Toda regra de negócio server-side é a fonte de verdade.** Se a UI
   desabilita um botão por uma condição (degrau, já contratado, etc.), a
   Server Action correspondente **repete a mesma checagem** — nunca confie só
   no client. Ver `features/gamificacao/actions.ts` como referência.
5. **Progressão (XP/moeda/degrau) só muda via `repo.aplicarProgresso`**,
   nunca por escrita direta — é a operação atômica que evita corrida e
   mantém nível/XP sincronizados (fórmula espelhada em
   `lib/gamificacao.ts` e SQL `nivel_por_xp`).
6. **Moeda virtual (🪙) e R$ real nunca se misturam.** Nenhuma tela pode
   sugerir que uma converte na outra.
7. **`npm run build` antes de considerar qualquer feature "pronta".**

## Mapa rápido (onde mexer em quê)

| Quero... | Vou em... |
|---|---|
| Mudar cor/tipografia/espaçamento | `design-system/tokens.ts` |
| Adicionar um componente de UI reutilizável | `src/components/ui/` |
| Adicionar/editar um evento de gamificação | `src/features/gamificacao/engine.ts` |
| Adicionar um novo Funcionário de IA ao catálogo | `src/features/equipe-ia/catalogo.ts` |
| Trocar persistência (file ↔ Supabase) | `GAMEHUB_DB` no `.env` — ver `src/lib/db/index.ts` |
| Adicionar coluna/tabela no banco real | nova migration em `supabase/migrations/000N_*.sql`, seguindo o padrão de RLS forçada + `(select private.tenant_atual())` das anteriores |
| Adicionar uma tela ao jogo | pasta nova em `src/features/<nome>/`, registrar em `src/features/shell/GameShell.tsx` |
| Mexer na sala isométrica / no boneco que anda | `src/features/world/` — regra em `engine/` (puro, testado), desenho em `render/` (Pixi). **Nunca ponha regra dentro do `render/`.** |
| Planejar a próxima evolução do jogo | [`docs/world/EVOLUCAO-MOTOR-2026.md`](docs/world/EVOLUCAO-MOTOR-2026.md) — pesquisa 2026, decisão de engine e roadmap G0–G6 |
| Adicionar um móvel novo | `src/features/sede/catalogo.ts` (preço/bônus e `forma`) — a silhueta vem da `forma` (não da `categoria`) e é desenhada em `world/render/desenho.ts`; forma nova = um `case` lá + um teste em `world/render/cores.test.ts` |
| Mudar a cor do piso/parede/pele da sala | `color.world` em `design-system/tokens.ts` (o canvas só converte, em `world/render/cores.ts`) |
| Criar/ver uma campanha com prazo p/ todos os jogadores | `/admin/eventos` (gated por `GAMEHUB_ADMIN_EMAILS`) — ver `src/features/eventos-globais/` |
| Mudar o que um Funcionário de IA entrega (Canvas, POPs, carrossel, kit comercial, roteiro de vídeo) | `src/features/equipe-ia/entregaveis/` — gerador puro por tipo + base de mercado em `mercado/`; guia completo em [`docs/equipe-ia/ENTREGAVEIS.md`](docs/equipe-ia/ENTREGAVEIS.md) |
| Mudar o refino por IA (prompt, validação, modelos, limites) ou operar a fila | `src/features/equipe-ia/ia/` e `ia-worker/` — guia em [`docs/equipe-ia/IA-OPERACAO.md`](docs/equipe-ia/IA-OPERACAO.md); tela em `/admin/ia` (só `admin@admin.com`) |
| Ligar o Editor(a) de Vídeo ao gerador de vídeo do Google | projeto em [`docs/integracoes/GOOGLE-VIDEO-API.md`](docs/integracoes/GOOGLE-VIDEO-API.md) — **só documentação**, nada implementado |

Estrutura completa: [`README.md`](README.md#estrutura). Design system e
prints de referência: [`docs/design/`](docs/design/).

## Comandos

```bash
npm run dev         # 127.0.0.1:8081, GAMEHUB_DB=file; gera o GAMEHUB_SECRET local sozinho
npm run typecheck   # tsc --noEmit — gate obrigatório
npm test            # vitest — gate obrigatório
npm run build       # gate obrigatório antes de qualquer deploy
```

Início rápido: duplo-clique em `iniciar.bat` (Windows) ou `./iniciar.sh`
(Linux/Mac) — instalam dependências se faltar e sobem o app sozinhos.

## Validação sem infra (truques úteis neste projeto)

**SQL sem banco.** Não há Docker/Postgres local por padrão. Instale
`pg-query-emscripten` (parser WASM do Postgres real) num scratchpad e rode
`pg.parse(sql)` / `pg.parsePlpgsql(sql)` — pega erro de sintaxe e de corpo de
função sem precisar de infraestrutura.

**Canvas Pixi em navegador headless.** Quando a aba não está visível,
`document.visibilityState` é `"hidden"` e o navegador **congela o
`requestAnimationFrame`**. Como o Ticker do Pixi roda em rAF, o canvas monta,
inicializa o WebGL e mesmo assim **não desenha um único frame** — dá para
confundir com bug de código, mas não é. Para inspecionar de verdade:

1. em dev, `window.__world` expõe `{ app, cena, desenharUmFrame }`
   (ver `features/world/render/WorldCanvas.tsx` — nunca vai para produção);
2. `desenharUmFrame()` força um render fora do ticker;
3. `app.renderer.extract.base64({ target: app.stage })` devolve o PNG, que
   pode ser gravado em disco e aberto como imagem;
4. para animação, chame o loop na mão: `cena['avancar']({ deltaMS: 33 })`
   em laço, simulando o tempo passar.
5. **para testar CLIQUE no canvas, renderize antes.** O hit-test do Pixi usa os
   transforms calculados no render; com o rAF congelado eles nunca atualizam e
   o `pointertap` **não dispara, sem erro nenhum**. A sequência que funciona é
   `app.renderer.render(app.stage)` → `pointermove` → `pointerdown` →
   `pointerup` no canvas, com as coordenadas convertidas por
   `raiz.toGlobal({x,y})` e pela razão `rect.width / (canvas.width/resolution)`.
   Num navegador real isso não aparece, porque o rAF renderiza o tempo todo.

Foi assim que se pegou (a) paredes desenhadas como serrote e (b) o avatar do
dono e o primeiro Funcionário de IA nascendo na mesma célula — dois bugs que
typecheck, teste e build não pegariam.

---

## Operando na VPS (produção)

Arquitetura: **Caddy** da Vitrine (dono da porta 443, faz o HTTPS) →
**container `independent-lab-app`** (Next.js standalone, usuário não-root,
sem porta publicada no host). A VPS é **compartilhada** com ~40 containers
de outros projetos: este projeto não instala Nginx, certbot, ufw nem mexe em
Docker ou portas dos outros. Guia completo: [`deploy/README.md`](deploy/README.md).
Relatório da auditoria: [`docs/seguranca/RELATORIO-2026-10.md`](docs/seguranca/RELATORIO-2026-10.md).

### Publicar (primeira vez e atualizações)

Roda na SUA máquina, via `ssh hostinger`. Pede confirmação digitada.

```bash
./deploy/publicar.sh           # constrói na VPS, troca a versão, rollback sozinho se falhar
./deploy/borda-caddy.sh        # só na 1ª vez (e depois de reinstalar a Vitrine): liga o HTTPS
```

`publicar.sh` confere árvore limpa, roda typecheck e testes, constrói a
imagem na VPS com `nice`, faz snapshot dos dados, sobe o container e só
considera pronto quando `/api/health` responde com o sha NOVO. Não há deploy
automático por CI: uma chave de deploy no GitHub daria root em todos os
projetos da VPS. O CI (`.github/workflows/ci.yml`) só verifica.

### Operação do dia a dia (na VPS)

```bash
docker ps --filter name=independent-lab             # está no ar? (healthy)
docker logs -f independent-lab-app                  # logs em tempo real
curl -s https://lab.2-25-146-39.sslip.io/api/health # versão e uptime
ls /opt/independent-lab/backups                     # backup diário + um antes de cada deploy
```

### Modular e personalizável — como estender sem quebrar nada

- **Novo Funcionário de IA:** adicione uma entrada em
  `features/equipe-ia/catalogo.ts` (id, nome, ícone, preço, degrau mínimo) —
  a tela e a lógica de contratação já são genéricas, não precisam mudar.
- **Novo evento de gamificação:** adicione ao `EVENTOS` em
  `features/gamificacao/engine.ts` — `RecompensaProvider` já propaga
  automaticamente (toast + refresh) para qualquer tela que chame `disparar`.
- **Nova cidade/região:** basta cadastrar um negócio com essa cidade — o mapa
  aloca bairro/quarteirão/lote sozinho (ver `docs/ARQUITETURA-MULTITENANT.md`).
- **Trocar de `file` para Supabase em produção:** mude `GAMEHUB_DB=supabase`
  no `.env` da VPS e preencha as três variáveis `SUPABASE_*` — nenhuma linha
  de `features/` muda (contrato `GameRepository`/`AuthProvider`).

### Segurança — o que NÃO fazer num agente operando aqui

- Nunca commitar `.env` (já no `.gitignore` — confira antes de `git add -A`).
- Nunca publicar uma porta do container no host (`ports:` no compose): o
  único caminho público é o Caddy. E nunca mexer em Nginx, Docker, firewall
  ou portas de outro projeto da VPS para "facilitar".
- Nunca apagar `/opt/independent-lab/data` ou `.env` sem confirmar com o
  usuário: `data/` tem cadastros reais e trocar `GAMEHUB_SECRET` desconecta
  todo mundo e invalida todos os convites.
- Nunca rodar `vps-hardening.sh --aplicar` nem `borda-caddy.sh` sem o
  usuário pedir: mexem em SSH e na borda HTTPS de toda a VPS.
- Nunca pular o gate (`typecheck`/`test`/`build`/`npm audit`) "para ir mais
  rápido".
- Nunca reintroduzir segredo padrão, senha escrita no código ou
  `process.env[nome]` dinâmico em código de browser.

### Regras de segurança do código (auditoria 2026-10)

- **Sessão e convite** usam chaves diferentes (`lib/auth/assinatura.ts`): um
  token de um propósito nunca vale no outro. Todo token novo ganha propósito
  próprio e `exp`.
- **Server actions recebem dado de qualquer cliente.** Todo texto tem teto de
  tamanho (`lib/validacao.ts`), toda opção é conferida contra a lista, e todo
  id vindo do cliente é validado (`pastaTenant` exige 24 hex).
- **Recompensa só no servidor e só uma vez:** `recompensar()` aceita só
  `EVENTOS_DO_CLIENTE` (`features/gamificacao/guarda.ts`); missão paga uma
  vez por marco (`repo.registrarMarco`). Evento novo com valor entra com
  guarda própria, nunca solto no dispatcher.
- **Modo arquivo:** toda escrita passa por `lib/db/arquivo.ts` (atômica,
  com trava, falha alto se o JSON estiver corrompido). Método novo que grava
  entra em `OPERACOES_DE_ESCRITA` no fim de `file-adapter.ts`. Exige UMA
  instância do app.
- **Browser só recebe fachada pública** (`VizinhoPublico`, `PitchIA`): XP,
  moeda, atributos e consentimento ficam no servidor.
- **Entregáveis dos Funcionários de IA** (`/api/entregavel/[tipo]`): o
  negócio vem **só da sessão**; o cargo precisa estar contratado e o nível
  vem do banco. Material voltado ao cliente (carrossel, reel) recebe
  `ContextoPublico`, tipo que **não tem** as respostas privadas do cadastro.
  Gerador novo: puro, sem ler o repositório, sem inventar meta, prazo ou
  depoimento, e coberto por `documentos.test.ts` (linter de `qualidade.ts`).
- **IA (Claude) dos Funcionários:** a credencial da Anthropic fica **só** no
  `ia-worker` (o app recusa subir em produção com ela). A resposta do modelo é
  dado não confiável: nada vai para a tela sem `ia/validar.ts`, e texto do
  usuário entra no prompt como dado (JSON em tag, `<` escapado). Só envia
  dados de quem deu consentimento **específico** (`ia/consentimento`).
  Mudou o prompt? Suba `GERADOR_IA_VERSAO`. O modo principal é a
  **assinatura Claude Pro** (`claude -p` no worker); o toggle de créditos de API
  só libera com `ANTHROPIC_API_KEY` no worker. Pro contraria os termos da
  Anthropic (risco assumido pelo dono, aviso visível em `/admin/ia`).
  Configuração só por `souAdminIA` (`lib/admin.ts`), validada no servidor.

## Armadilhas conhecidas

- **Reanimated/RN:** não se aplica ainda (app é web-only por ora — ver
  `docs/ARQUITETURA.md` para o plano de portar a React Native).
- **`AnimatePresence mode="wait"`** em telas do jogo: espera a animação de
  saída terminar; em ambientes headless sem `requestAnimationFrame` real
  (alguns browsers automatizados) isso trava — valide fluxos via HTTP/rota
  temporária quando o preview visual não for confiável, não via clique.
- **PostgREST + função retornando linha composta:** prefira `returns setof
  <tabela>` a `returns <tabela>` — mais previsível com `.single()` no
  supabase-js (ver comentário em `supabase/migrations/0001_init.sql`).
