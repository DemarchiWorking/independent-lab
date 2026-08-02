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
| Adicionar um móvel novo | `src/features/sede/catalogo.ts` (preço/bônus) — a silhueta 3D vem da `categoria`, desenhada em `world/render/desenho.ts` |
| Criar/ver uma campanha com prazo p/ todos os jogadores | `/admin/eventos` (gated por `GAMEHUB_ADMIN_EMAILS`) — ver `src/features/eventos-globais/` |

Estrutura completa: [`README.md`](README.md#estrutura). Design system e
prints de referência: [`docs/design/`](docs/design/).

## Comandos

```bash
npm run dev         # localhost:8081, GAMEHUB_DB=file (sem infra)
npm run typecheck   # tsc --noEmit — gate obrigatório
npm test            # vitest — gate obrigatório
npm run build       # gate obrigatório antes de qualquer deploy
```

**Stack real (Docker, com Supabase — paridade com produção):**
duplo-clique em `start.bat` (Windows, abre o WSL sozinho) ou `./start.sh`
(Linux/Mac/VPS) — chamam `deploy/docker/setup.sh --with-supabase`. É o
caminho recomendado pra ver o produto de verdade (cadastro persiste,
login funciona, mapa/vizinhos reais).

**Modo dev leve (sem Docker, sem Postgres):** duplo-clique em
`iniciar.bat` (Windows) ou `./iniciar.sh` (Linux/Mac) — só `npm run dev`
com `GAMEHUB_DB=file`. Bom pra mexer em UI rápido; cadastro/login não
persistem de verdade entre reinícios (arquivo local) e multiplayer/
Supabase não existem nesse modo.

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

Arquitetura: **Nginx** (80/443, público) → **PM2** (`next start`, só em
`127.0.0.1:8081`) → app. Sem Docker — deliberado, para uma VPS pequena que
precisa estar no ar rápido. Guia humano completo:
[`deploy/README.md`](deploy/README.md).

### "Ativar para a internet inteira" (primeiro deploy)

```bash
ssh hostinger          # ou o alias/host configurado para a VPS
cd ~/labdatadev-gamehub
./deploy/vps-setup.sh                               # só HTTP
./deploy/vps-setup.sh app.seudominio.com.br voce@email.com   # com HTTPS
```

Isso instala Node/PM2/Nginx, configura firewall (só 22/80/443 públicos — o
app nunca fica exposto direto), gera `.env` com `GAMEHUB_SECRET`, builda e
sobe o processo. **Idempotente** — pode rodar de novo sem quebrar.

### Esteira de melhoria contínua (toda atualização depois da primeira)

```bash
ssh hostinger "cd ~/labdatadev-gamehub && ./deploy/deploy.sh"
```

Ou automático: push na `main` → `.github/workflows/deploy.yml` roda
typecheck+test, e só então SSHa na VPS e chama `deploy/deploy.sh` — que
**também** roda typecheck+test+build antes de tocar no processo em produção
(gate duplo, de propósito). Se qualquer verificação falhar, a versão antiga
continua no ar.

**Ciclo esperado de melhoria contínua:**
```
mudar código → npm run typecheck/test/build local → commit → push
   → CI valida de novo → deploy.sh valida de novo → PM2 reload → healthcheck
   → (se falhar em qualquer ponto, produção não muda)
```

### Operação do dia a dia

```bash
pm2 status                        # está no ar?
pm2 logs labdatadev-gamehub       # logs em tempo real
sudo nginx -t                     # valida config antes de recarregar
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
- Nunca expor a porta 8081 direto (o processo já sobe em `127.0.0.1` — não
  mude isso em `deploy/ecosystem.config.js` sem motivo forte).
- Nunca rodar `git push --force`, `git reset --hard` na VPS, ou apagar
  `data/` sem confirmar com o usuário antes — `data/` tem cadastros reais.
- Nunca pular o gate (`typecheck`/`test`/`build`) "para ir mais rápido" — é
  exatamente o que existe para nunca sujeitar a versão pública a mudança
  quebrada.

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
