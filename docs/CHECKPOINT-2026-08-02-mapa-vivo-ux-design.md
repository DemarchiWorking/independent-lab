# Checkpoint — 2026-08-02 — Mapa Vivo (redesign UX/visual, Mapa + Sede)

> Leia isto se uma sessão nova estiver retomando este trabalho (créditos
> acabaram, sessão caiu, troca de conta, ou é outro agente). Este arquivo é
> o "onde eu parei". `AGENTS.md` e `docs/PROXIMA-TAREFA.md` continuam
> sendo o guia geral do projeto — `PROXIMA-TAREFA.md` já aponta pra cá no
> topo, como **prioridade #1** atual.

## Uma frase

Redesign completo de UX/visual do Mapa + Sede ("Mapa Vivo") — nível
"game enterprise", mapa geográfico estilizado ligado ao CEP real, tiers
visuais reaproveitando tokens já existentes, multiplayer integrado
visualmente entre as duas telas — está em andamento via processo
`bmad-ux`, com as duas spines (`DESIGN.md`/`EXPERIENCE.md`) já escritas e
uma Reviewer Gate (completude + acessibilidade) em andamento.

## Onde estão os arquivos

- **Contexto completo (o "porquê", decisões, próximos passos):**
  [`mapa-vivo/CONTEXTO-E-DECISOES.md`](mapa-vivo/CONTEXTO-E-DECISOES.md)
- **Status técnico exato (o "onde", o que falta):**
  [`mapa-vivo/STATUS-BMAD-UX.md`](mapa-vivo/STATUS-BMAD-UX.md)
- **As spines de verdade** (fora deste repo, path completo e explicação
  do porquê em `STATUS-BMAD-UX.md`):
  `/root/_bmad-output/planning-artifacts/ux-designs/ux-labdatadev-2026-08-02/`

## Próxima ação concreta

**Leia [`mapa-vivo/TAREFAS-PENDENTES.md`](mapa-vivo/TAREFAS-PENDENTES.md)
primeiro — lista única e atual de tudo que falta, em ordem sugerida.**

Resumo do fim desta sessão (2026-08-02): em produção de verdade hoje há
só duas coisas pequenas — anel de cor por tier nos lotes do Mapa
(`0c2c0f2`) e badge de tier + presença corrigida na tela de visitar sede
(`0e8a184`, só em `VisitaScreen.tsx`, não em `WorldScreen.tsx`). O
terreno estilizado e o zoom animado — a parte mais visível do pedido
original — continuam só como spec/mockup, não implementados. Balanço
honesto do custo/benefício desta sessão também está em
`TAREFAS-PENDENTES.md` — vale ler antes de repetir o mesmo processo.

## Regra não-negociável desta iniciativa

**Prioridade #1 do projeto agora.** Qualquer outra tarefa de produto deve
ser sequenciada depois desta, salvo pedido explícito do usuário em
contrário — decisão dele, registrada em `PROXIMA-TAREFA.md`.
