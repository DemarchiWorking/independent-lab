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

Ver a última seção de `mapa-vivo/STATUS-BMAD-UX.md` — mantida atualizada a
cada marco. **Atualizado 2026-08-02, fim de sessão:** Reviewer Gate feita,
mockups validados por screenshot real (2 bugs corrigidos), Fase 1 REAL
implementada e deployada em produção (commit `0e8a184`, cor de tier +
presença na Sede), validada com login real via Playwright contra `:3006`.
Próximo: usuário confirmar o Artifact, depois `bmad-create-architecture`
(Winston) pra decidir como renderizar o Mapa/terreno de verdade (a parte
mais visível do pedido original ainda não foi implementada — só a Sede).

## Regra não-negociável desta iniciativa

**Prioridade #1 do projeto agora.** Qualquer outra tarefa de produto deve
ser sequenciada depois desta, salvo pedido explícito do usuário em
contrário — decisão dele, registrada em `PROXIMA-TAREFA.md`.
