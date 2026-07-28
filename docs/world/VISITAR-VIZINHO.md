# Visitar o vizinho — arquitetura da visita somente-leitura

> Implementa o card `GH-WORLD-06` (Fase **W6** de `ARQUITETURA-WORLD.md`) e
> a milestone **M6** de `MAPA-MUNDI-VALE-DO-CAFE.md`, com uma decisão de
> produto nova que os supera (§1). Leia isto antes de mexer em
> `features/world/` ou `features/vendas/`.

## 1. Contexto e decisões (fatos, não recomendação)

Até 2026-07-28 a visita a vizinhos existia só como ideia: um card de
backlog nunca implementado e uma decisão de privacidade em aberto
(`sede.publicada`, opt-in, marcada como "⚠️ a confirmar" em
`MAPA-MUNDI-VALE-DO-CAFE.md` §2). O usuário resolveu essa decisão ao pedir
a feature:

1. **Visita aberta no MVP** — qualquer jogador logado visita qualquer
   sede, sem opt-in, sem flag `publicada`. Isso substitui a recomendação
   de opt-in dos docs antigos (`MAPA-MUNDI` §2, `GH-WORLD-06`, `RF-SED-07`
   — todos atualizados junto com este doc). Opt-in/privacidade fica como
   **evolução futura documentada**, não construída agora (ver §7).
2. **Somente leitura** — o visitante vê a mobília, o nível da sede e os
   avatares dos Funcionários de IA do anfitrião, mas não compra, move ou
   edita nada ali. Andar pela sala é cosmético (client-side, não
   persistido) — não precisa de sincronização com ninguém.
3. **Painel de proposta comercial é o entregável central** — ao visitar,
   o jogador vê um pitch real de "Funcionários de IA" (o produto
   comercial de verdade da labdatadev), personalizado pelo perfil do
   negócio visitado. Conteúdo em `docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md`.
4. **Rota dedicada**: `/world/visitar/[tenantId]`, mesmo padrão do `/world`
   atual (não modal/overlay).
5. **Multiplayer/tempo real**: preparado (contrato documentado, §6), não
   implementado — não existe projeto Supabase real hoje (`GAMEHUB_DB=file`
   local, `.env` sem `NEXT_PUBLIC_SUPABASE_URL`).
6. **Renderer**: pronto para evoluir para um visual mais "Habbo" (sprites
   em vez de desenho procedural) sem tocar nesta feature — ver §5.

## 2. Fluxo de dados (leitura)

Nenhuma tabela nova, nenhum método de repositório novo, nenhuma migration.
`GameRepository.lerSede(tenantId)` e `listarMobiliaColocada(tenantId)`
(`src/lib/db/repository.ts`) já aceitam qualquer `tenantId` — nenhum dos
dois adapters (`file-adapter.ts`, `supabase-adapter.ts`) acopla a leitura
à sessão. O único lugar que hoje passa `sessao.tenantId` é quem CHAMA
(`src/app/world/page.tsx`); a nova rota simplesmente chama com o
`tenantId` do vizinho.

Reconstrução do layout, mecânica e determinística (nenhum dado novo):

```
repo.lerSede(tenantId) + repo.listarMobiliaColocada(tenantId)
  → geometriaSala(sede.nivel)              (engine/sala.ts)
  → slotParaCelula(m.slot, geo) por item   (engine/sala.ts)
  → itemMobilia(m.itemId)                  (features/sede/catalogo.ts)
  → EstadoCena { geo, moveis, avatares }   (render/cena.ts)
  → <WorldCanvas estado={...} />           (render/WorldCanvas.tsx)
```

Nota de segurança (Supabase): `SupabaseRepository` sempre usa o cliente
`service_role` (`db` getter em `supabase-adapter.ts`) — a RLS de
`sedes`/`itens_mobilia_colocados` (que hoje só libera `select` do próprio
tenant, `supabase/migrations/0004_sede.sql`) é irrelevante aqui porque o
app nunca consulta o Supabase direto do browser. Nenhuma policy nova é
necessária para o MVP aberto.

## 3. O que a visita explicitamente NÃO inclui

- Nenhuma chamada a `moverMobilia`, `comprarMobilia` ou `evoluirSede`
  (`features/sede/actions.ts`) — essas Server Actions continuam validando
  `item.tenantId === sessao.tenantId` e falhariam mesmo se chamadas.
- Nenhum modo "mover móvel" (o clique-e-arraste que `WorldScreen.tsx` tem).
- Nenhuma loja, nenhum painel de upgrade de sede.
- Nenhuma persistência da posição do visitante — sair da tela esquece
  onde ele andou.
- Nenhum código novo em `lib/db/repository.ts` ou nos adapters.

## 4. Componentes (o que existe vs. o que é novo)

`WorldScreen.tsx` **não é reaproveitado como está** — ele mistura render
com toda a UI de mutação (loja, upgrade, modo mover). Em vez de um prop
`somenteLeitura` espalhando `if`s por um componente que já é grande, a
visita ganha um componente irmão dedicado:

- `src/features/world/VisitaScreen.tsx` (novo) — reaproveita literalmente
  `geometriaSala`/`slotParaCelula` (`engine/sala.ts`), `itemMobilia`
  (`sede/catalogo.ts`), `cargoPorId` (`equipe-ia/catalogo.ts`),
  `corDoAtributo`/`corDoItem` (`render/cores.ts`), o mesmo padrão de
  import dinâmico do `WorldCanvas` (`ssr:false`). O avatar do visitante é
  uma entrada cosmética a mais em `avatares` (id `"visitante"`), e
  `avatarDonoId="visitante"` é passado ao `WorldCanvas` — o clique-para-
  andar já funciona porque `WorldCanvas`/`CenaWorld` resolvem qualquer id
  presente em `andarilhos`, sem precisar de nenhuma mudança nesses dois
  arquivos.
- `src/app/world/visitar/[tenantId]/page.tsx` (novo) — Server Component,
  mesma forma de `src/app/world/page.tsx`, mas busca o `tenantId` da URL
  em vez de `sessao.tenantId`.

## 5. Prontidão para evolução do renderer

Esta feature nunca importa de `features/world/render/desenho.ts`
diretamente — só de `render/cena.ts` (o tipo `EstadoCena`) e
`render/WorldCanvas.tsx` (o componente). Quando o renderer evoluir do
Degrau A (desenho procedural, hoje) para o Degrau B/C (sprite atlas,
iluminação — `EVOLUCAO-MOTOR-2026.md` §6), a troca acontece inteira dentro
de `desenharMovel()`/`desenharAvatar()` em `desenho.ts`. **Nenhuma linha
desta feature muda** — ela só constrói `EstadoCena` e entrega para o
`WorldCanvas`, exatamente como `WorldScreen.tsx` já faz hoje. Esta é a
mesma garantia que já vale para a sede do próprio jogador; a visita não
adiciona nem remove nenhum acoplamento novo ao renderer.

## 6. Prontidão para tempo real (contrato, não infra)

`EVOLUCAO-MOTOR-2026.md` §3.5 já recomenda Supabase Realtime para
presença ("quem está online, quem visita sua sede") com "zero infra nova"
— mas isso pressupõe um projeto Supabase real, que não existe hoje
(`GAMEHUB_DB=file`, `.env` local sem `NEXT_PUBLIC_SUPABASE_URL`). Esta
sessão adiciona só a costura documentada, sem implementação:

- `src/features/world/presenca/canal.ts` (novo, stub inerte) — comentário
  explicando o papel futuro do módulo + assinaturas de tipo
  (`assinarPresenca`/`publicarPresenca`), sem `.channel()`, sem dependência
  nova, nunca importado por `VisitaScreen.tsx`. Existe só para documentar
  a costura no lugar certo — mesma convenção 🆕 já usada em
  `EVOLUCAO-MOTOR-2026.md` §5.1 (camada L4).

## 7. Desacoplamento do roadmap G4

`EVOLUCAO-MOTOR-2026.md` §10 tinha `G4 = "Presença via Supabase Realtime +
visitar vizinho"`, gateado atrás de `G1` (fundação ECS/tick, ainda não
construída). Isso acoplava incorretamente a visita estática à presença ao
vivo. **Este plano desacopla os dois**: a visita somente-leitura sobe
agora, sem depender de `G1`/ECS. `G4` passa a significar apenas "somar
presença ao vivo por cima da visita que já existe" — não "construir a
visita". Nota equivalente foi adicionada em `EVOLUCAO-MOTOR-2026.md`
perto de §5.1 e §10.

## 8. Evolução futura (não construída agora)

- **Opt-in/privacidade**: reintroduzir `sede.publicada` (ou um controle
  mais granular — "todos", "só parceiros", "ninguém") se algum dono real
  pedir para não ser visitado. A tabela `sedes` ganha uma coluna; a rota
  de visita ganha uma checagem antes de renderizar.
- **Presença ao vivo**: implementar `presenca/canal.ts` de verdade quando
  houver um projeto Supabase provisionado — mostrar avatares de outros
  visitantes reais, não só o do jogador atual.
- **Métricas comerciais**: `docs/CONTEXTO-NEGOCIO.md` já nomeia "taxa de
  conversão de visita→contratação" como métrica de suporte do North Star
  — vale um evento de gamificação (`EventoKey`) tipo `pitch_visto` quando
  isso for medido de verdade.

## 9. Mapa rápido desta feature

| Arquivo | Papel |
|---|---|
| `src/app/world/visitar/[tenantId]/page.tsx` | rota, busca dados do anfitrião |
| `src/features/world/VisitaScreen.tsx` | render somente-leitura |
| `src/features/vendas/pitchVisita.ts` | catálogo de pitch + `escolherPitch()` |
| `src/features/vendas/PitchPanel.tsx` | painel de proposta comercial |
| `src/features/world/presenca/canal.ts` | stub — contrato de presença futura |
| `docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md` | copy de vendas (conteúdo, não código) |

## 10. Para a próxima sessão

- Se for evoluir o renderer (Degrau B/C), o único lugar desta feature que
  merece uma olhada é `VisitaScreen.tsx` — e só para confirmar que ainda
  não importa nada de `render/desenho.ts` diretamente (não deveria).
- Se for implementar presença ao vivo (`G4`), comece por
  `src/features/world/presenca/canal.ts` — o contrato já está desenhado.
- Se for reintroduzir opt-in, comece por `docs/world/MAPA-MUNDI-VALE-DO-CAFE.md`
  §2 (já documentado como decisão revertível, não perdida).
