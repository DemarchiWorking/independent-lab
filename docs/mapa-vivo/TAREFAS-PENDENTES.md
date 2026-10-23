# Mapa Vivo — tarefas pendentes (lista única, 2026-08-02 fim de sessão)

> Leia [`../CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md`](../CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md)
> primeiro. Este arquivo é a lista canônica do que falta — atualizar
> (riscar o que fechar, nunca deletar linha, só marcar) a cada sessão.

## Balanço honesto desta sessão (pra não repetir o erro)

Rodei o processo `bmad-ux` completo (Discovery → spines → Reviewer Gate
com 2 subagentes → mockups) pra um resultado que, em produção, é pequeno:
um anel de cor num lote do Mapa e um badge na Sede. Os 2 subagentes de
revisão sozinhos custaram ~220 mil tokens. Pra próxima fase, **não repetir
esse formato** — ir direto pro código visual depois de confirmar a
direção com o usuário, sem rodar Reviewer Gate formal de novo (achados
de acessibilidade relevantes já estão documentados, não precisam ser
redescobertos).

## O que está DE VERDADE em produção hoje (`:3006`)

- [x] Anel de cor por tier nos lotes ocupados do Mapa real
      (`IsoLot.tsx`/`QuarteiraoIso.tsx`, commit `0c2c0f2`)
- [x] Badge de tier + cor de presença ao vivo corrigida, mas **só na
      tela de VISITAR outra sede** (`VisitaScreen.tsx`, commit `0e8a184`)
      — a sua própria sede (`WorldScreen.tsx`, `/world`) **não** tem essas
      mudanças ainda
- [x] Navegação por abas cidade/bairro no Mapa — **já existia antes**
      desta sessão, não é novidade (achado de verificação, não trabalho
      novo)

## O que é só spec/mockup, NÃO é código ainda

- [ ] Terreno do Mapa estilizado (o pedido visual central — "grama"
      pintada, ruas, densidade tipo Clash of Clans/Pokémon GO) — hoje o
      Mapa continua com o visual isométrico antigo, só ganhou o anel de
      tier em cima dele
- [ ] Zoom "cinematográfico" por clique com câmera animada entre 4 níveis
      (Região→Cidade→Bairro→Quarteirão) — hoje é troca de aba simples
      sem animação, sem nível de Região
- [ ] `MapaBreadcrumb`, `MapaLegenda`, `ChegadaSpotlight`, `PresencaCluster`,
      `VizinhoCard` no sheet, `SedeFachada` — nenhum destes componentes da
      spec foi implementado, só mockado em HTML
- [ ] Badge de tier + cor de presença replicados em `WorldScreen.tsx`
      (sua própria sede) — hoje só existe em `VisitaScreen.tsx`

## Bugs/gaps abertos (não bloqueiam, mas registrar)

- [ ] Verificação de daltonismo (deuteranopia) com ferramenta real —
      nunca rodada, só inferência manual
- [ ] Validação visual do anel de tier no Mapa real nunca foi confirmada
      por screenshot (a tentativa desta sessão caiu no `/hub`, não achou
      a aba certa) — **primeira coisa a fazer na próxima sessão**
- [ ] Spines (`DESIGN.md`/`EXPERIENCE.md`) ainda dizem que o Mapa usa
      Pixi.js — está ERRADO, é DOM/CSS puro (achado tardio desta sessão,
      documentado em `STATUS-BMAD-UX.md` §Fase 1.5, mas as spines em si
      não foram corrigidas — ainda em
      `/root/_bmad-output/planning-artifacts/ux-designs/ux-labdatadev-2026-08-02/`)
- [ ] `RESEND_API_KEY` não configurada — recuperação de senha gera código
      mas não envia e-mail de verdade (de sessão anterior, não é deste
      card)

## Ordem sugerida pra retomar amanhã

1. **Validar visualmente** o anel de tier no Mapa real (login, `/hub`,
   aba Mapa, screenshot) — confirma se o que já foi commitado funciona.
2. **Perguntar ao usuário, direto, sem processo formal**: qual das duas
   coisas ele quer ver primeiro — terreno estilizado, ou zoom animado?
   (Não rodar `bmad-ux`/Reviewer Gate de novo pra isso — já sabemos a
   direção: Clash of Clans/Pokémon GO, zoom por clique, Startup Panic
   melhorado, PC+mobile, multiplayer via navegador.)
3. Implementar direto em código a escolhida, com gates
   (typecheck+test+build) + deploy + screenshot real a cada passo — um
   passo de cada vez, nunca acumular.
4. Replicar badge/presença em `WorldScreen.tsx` (rápido, baixo risco,
   fecha a assimetria com `VisitaScreen.tsx`).
5. Só no final, se sobrar fôlego: corrigir a spine (Pixi.js → DOM) e
   rodar verificação de daltonismo real.
