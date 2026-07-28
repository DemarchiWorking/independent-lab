# Próxima tarefa — leia isto primeiro (economiza contexto)

> Atualizado: 2026-07-28, após o lote 3 (`GH-GROW-02`, `GH-GROW-03`, e
> fechamento de 2 gaps do lote 2 — Oferta sem produtor, contato sem inbox).
> Sempre confira `git log -1` antes de confiar neste arquivo. **Leia também
> [`GAPS-DE-INTEGRACAO.md`](GAPS-DE-INTEGRACAO.md)** — registro vivo,
> atualizado a cada lote.

## Estado

MVP para pitch Sebrae. Lote 3 fechou com `npm run typecheck && npm test &&
npm run build` verdes (223 testes).

- **Fechados 2 gaps do lote anterior:** `features/ofertas/` (dono publica
  ofertas na própria vitrine — primeiro produtor de `Oferta`, que já tinha
  persistência pronta sem UI) e seção "Mensagens recebidas" em `/painel`
  (lê `listarSolicitacoesContato`, que também já existia sem tela).
- **`GH-GROW-02` — feito.** Convite de vizinho com recompensa mútua: token
  HMAC assinado (`features/growth/convite.ts`), resgatado dentro de
  `cadastrar()` (nunca ao clicar/gerar o link), teto de 5 convites
  recompensados por convidante a cada 30 dias (acima disso só o convidante
  para de ganhar — o convidado sempre ganha), RPC atômica
  `resgatar_convite` (migration `0021_convites.sql`). Link gerado e
  copiado manualmente pelo dono em `/painel` (`ConvitePainel.tsx`) — app
  nunca envia e-mail sozinho.
- **`GH-GROW-03` — feito.** 6 conquistas (`features/conquistas/catalogo.ts`)
  — **sem tabela própria**, tudo derivado do estado já existente (degrau,
  equipe, parcerias, nós da árvore, nível de sede). Imagem OG dinâmica ao
  compartilhar (`src/app/api/og/conquista/route.tsx`, `next/og`), pública
  de propósito (é assim que redes sociais buscam o preview), mesma
  whitelist de campos da vitrine pública.

Estado dos lotes anteriores (ainda válido): `GH-EQP-02`, `GH-FDN-03`,
`GH-MAPA-01` (parcial), `GH-OPS-04`+`GH-GROW-01` (LGPD + vitrine pública),
`GH-EDU-01` (lições), correção de checkboxes `GH-WORLD-01`/`02`,
formalização de `GH-SIM-01`+3 stubs (Épico 12), correção da constraint de
`segmento` no Supabase. `GH-GROW-05` segue **deliberadamente não
implementado** (ver o próprio card no backlog).

## Próxima tarefa recomendada

Nenhum card em andamento. Ordem sugerida (pulando Épico 9 — deploy, precisa
de VPS real):

1. **`GH-MAPA-02`** (navegação por zoom em 3 camadas) — depende de
   `GH-MAPA-01` (parcial, mas o suficiente: as consultas agregadas já
   existem). É o consumidor natural do `escopo` inerte em `lerMapaView()`.
2. **`GH-GROW-04`** (ranking/destaque do bairro) — depende de `GH-MAPA-04`,
   que por sua vez depende de `GH-ATR-01` (pronto) — mas `GH-MAPA-04`
   (benchmark regional) ainda não foi feito; abrir esse primeiro se for
   por aqui.
3. **Revisar `docs/GAPS-DE-INTEGRACAO.md`** — o item 🔴 (RLS de `negocios`
   expõe a linha inteira a `anon`) é o mais importante do documento, mas
   **exige teste em Postgres real antes de mexer** (não dá pra validar só
   com `pg-query-emscripten` — é semântica de RLS em runtime, não sintaxe).
   Não tentar corrigir numa sessão sem acesso a um Postgres real para
   verificar o resultado.

Ao puxar o próximo card: ler os arquivos reais antes de assumir o que
existe, implementar em passos pequenos com `npm run typecheck` a cada um,
e só então rodar `npm test && npm run build` completo antes de commitar.

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

**Env vars novas desta sessão:**
- `NEXT_PUBLIC_SITE_URL` (`GH-GROW-01`) — usado por `sitemap.ts`/`robots.ts`.
- Nenhuma nova no lote 3 (convite/conquistas reusam `GAMEHUB_SECRET` já
  existente).

## Docs de referência (nessa ordem, só se precisar de mais contexto)

1. `AGENTS.md` — regras não-negociáveis e mapa rápido do repo.
2. Este arquivo.
3. `docs/GAPS-DE-INTEGRACAO.md` — o que existe mas não está costurado.
4. `docs/BACKLOG-PRODUTO.md` — todos os cards, prioridade e dependências.
5. `docs/ESTADO-DO-PROJETO.md` §3.1 — relato detalhado de sessões
   anteriores (só abrir se precisar entender uma decisão específica).
