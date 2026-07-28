# Canal de Presença Real (GH-MULTI-02) — estado e o que falta

> **Status: código feito, verificação viva pendente.** A lógica está
> implementada e coberta por 15 testes com canal simulado; o que falta é
> rodar contra um Supabase de verdade (depende da Fase 0 + `GH-MULTI-00`
> + `GH-MULTI-01` — ver `../architecture/BMAD-MULTIPLAYER-VPS.md` §4).
>
> Este documento era um plano bite-sized *antes* da implementação. Agora
> registra **o que foi construído, por quê, e o que ainda falta** — quem
> chegar aqui não precisa reimplementar nada.

---

## O que já existe (feito e testado)

| Arquivo | Papel |
|---|---|
| `src/features/world/presenca/canalUtil.ts` | Primitivas puras: `nomeCanal`, `supabaseConfigurado`, `presentesDe`, tipo `VisitantePresente` |
| `src/features/world/presenca/canalUtil.test.ts` | 9 testes, zero mock (tudo puro) |
| `src/features/world/presenca/canal.ts` | `entrarNaSala()` — a integração real com Supabase Realtime Presence |
| `src/features/world/presenca/canal.test.ts` | 6 testes com canal simulado (`vi.hoisted` + `vi.mock`) |

### A API

```ts
entrarNaSala(
  salaTenantId: string,
  eu: VisitantePresente,
  aoMudar: (presentes: VisitantePresente[]) => void,
): () => void   // devolve a função de saída (cleanup do useEffect)
```

### Decisão de design: uma função, não duas

O rascunho original deste documento propunha duas funções independentes
(`assinarPresenca` + `publicarPresenca`), cada uma criando o próprio
canal. **Isso estava quebrado** e foi corrigido antes de virar código:

- `supabase.channel(nome)` devolve uma instância **nova** a cada chamada.
- `track()` só surte efeito no canal que está de fato inscrito.
- Logo, um `publicarPresenca` que cria o próprio canal e chama `track()`
  nele anunciaria presença para um canal que ninguém observa — falha
  silenciosa, do tipo que só aparece em teste manual com duas abas.

O padrão correto (e o que está implementado) é subscribe + track no
**mesmo** canal, com o `track` dentro do callback de status:

```ts
canal.subscribe((status) => {
  if (status === "SUBSCRIBED") void canal.track(eu);
});
```

### Decisão de design: lista completa, não eventos de entrada/saída

O rascunho também previa um módulo `diffPresenca` para emitir
`aoEntrar`/`aoSair`. **Foi descartado (YAGNI):** a UI só precisa saber
"quem está aqui agora" para desenhar avatares — ela não usa os eventos.
O `declare function` original era especulativo e não tinha nenhum
chamador, então dava para redesenhar livremente. Se um dia aparecer um
requisito de toast ("Fulano entrou"), o diff volta — sobre uma API que já
entrega a lista completa, é trivial.

### Garantias cobertas por teste

- Canal escopado por sala (`sede:<tenantId>`), nunca global.
- `track` só depois de `SUBSCRIBED` (e nunca em `CHANNEL_ERROR`/`TIMED_OUT`).
- Lista de presentes achatada, deduplicada por tenant (duas abas = uma
  pessoa) e ordenada — evita avatar piscando/trocando de lugar a cada sync.
- Sem `NEXT_PUBLIC_SUPABASE_URL`: no-op total, não abre canal, não lança
  (`GAMEHUB_DB=file` continua funcionando).
- A função de saída desinscreve o canal.

---

## O que falta

### 1. Verificação viva (bloqueada por Fase 0 + `GH-MULTI-00` + `GH-MULTI-01`)

Os testes provam a lógica com um canal simulado — **não** provam que a
integração real funciona. Antes de considerar `GH-MULTI-02` fechado:

1. Fase 0 concluída (modo `GAMEHUB_DB=supabase` provado de ponta a ponta).
2. `GH-MULTI-00` aplicado e verificado — **bloqueante de segurança**:
   `entrarNaSala` é o primeiro código deste projeto a rodar
   `supabaseAnon()` no browser, e a partir daí a anon key é pública.
3. `.env` com `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
   reais.
4. Duas abas, dois tenants logados, mesma `salaTenantId` — cada uma vê a
   outra entrar; fechar uma faz o avatar sumir na outra.

### 2. `GH-MULTI-03` — integração na UI

Nenhuma tela chama `entrarNaSala` hoje: por construção, o módulo é inerte
até alguém ligá-lo. A integração tem um pré-requisito concreto já
mapeado:

**`VisitaScreen` não sabe quem é o visitante.**
`src/app/world/visitar/[tenantId]/page.tsx` chama `lerSessao()` mas passa
adiante só os dados do **visitado** (`negocioVisitado`, `sede`,
`mobilia`, `funcionarios`). A presença precisa de `{ tenantId, nome }` do
**próprio visitante** — hoje esse dado morre na página. Threadar como
prop, mesmo padrão já usado várias vezes neste projeto
(`funcionarios`, `parceriasFormadas`, `licoesConcluidas`).

Depois disso: `useEffect` chamando `entrarNaSala` no mount, guardando os
presentes em estado, e somando-os ao `estadoCena.avatares` que já existe.
`render/` e `engine/` **não mudam** — `EstadoCena` já aceita N avatares
por construção, e `distribuirAvatares` (`engine/sala.ts`) já sabe
posicionar sem sobrepor.
