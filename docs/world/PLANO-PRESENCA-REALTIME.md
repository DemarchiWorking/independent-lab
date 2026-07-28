# Canal de Presença Real (GH-MULTI-02) — Plano de Implementação

> **Para quem for executar:** este plano assume ZERO contexto prévio do
> codebase. Pré-requisitos que precisam estar satisfeitos antes de
> começar: `GH-MULTI-00` (hardening de RLS de `negocios`, verificado
> contra Postgres real) e `GH-MULTI-01` (projeto Supabase real
> provisionado, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
> preenchidos no `.env`). Sem os dois, os Passos 1–8 abaixo (puros,
> testáveis com mock) ainda podem ser feitos — só o Passo 9 (verificação
> manual contra Supabase real) fica bloqueado.
>
> Ver a decisão estratégica completa em
> [`architecture/BMAD-MULTIPLAYER-VPS.md`](../architecture/BMAD-MULTIPLAYER-VPS.md)
> antes de começar, se precisar entender o "porquê".

**Goal:** Substituir os stubs de tipo em `src/features/world/presenca/canal.ts`
por uma implementação real de Supabase Realtime Presence — quem está
"presente" numa sala (`sede:<tenantId>`) agora, com entrada/saída
detectadas e nunca persistidas.

**Architecture:** Um canal Realtime por sala visitada (`sede:<tenantId>`).
`assinarPresenca` assina o evento `sync` do canal e faz o diff entre quem
já era conhecido e quem está presente agora, disparando `aoEntrar`/`aoSair`.
`publicarPresenca` usa `track()`/`untrack()` para anunciar a própria
presença. Tudo client-side, nada persistido, degrada para no-op silencioso
se `NEXT_PUBLIC_SUPABASE_URL` não estiver configurado (`GAMEHUB_DB=file`).

**Tech Stack:** `@supabase/supabase-js` (já é dependência do projeto,
`supabaseAnon()` já existe em `src/lib/supabase/client.ts`, nunca chamado
do browser até este card — é o primeiro). Vitest para os testes (mock do
canal, sem precisar de Supabase real rodando).

---

## Estado atual do arquivo (para referência, não copiar)

`src/features/world/presenca/canal.ts` hoje:

```ts
export interface VisitantePresente {
  tenantId: string;
  nome: string;
  entrouEm: string;
}

export declare function assinarPresenca(
  salaTenantId: string,
  aoEntrar: (visitante: VisitantePresente) => void,
  aoSair: (visitanteTenantId: string) => void,
): () => void;

export declare function publicarPresenca(
  salaTenantId: string,
  presente: boolean,
): Promise<void>;
```

**Mudança de assinatura deliberada neste plano:** `publicarPresenca`
ganha um parâmetro a mais (`eu: VisitantePresente`) — o stub original não
especificava de onde viria a identidade de quem está se anunciando; a
implementação real precisa saber `tenantId`/`nome` de quem está
anunciando presença, e isso tem que vir de quem chama (não pode ser lido
de sessão dentro de `canal.ts`, que é código client-side puro). Ver
Task 3.

---

### Task 1: Helpers puros (nome do canal + detecção de config)

**Files:**
- Create: `src/features/world/presenca/canalUtil.ts`
- Test: `src/features/world/presenca/canalUtil.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/features/world/presenca/canalUtil.test.ts
import { describe, expect, it } from "vitest";
import { nomeCanal, supabaseConfigurado } from "./canalUtil";

describe("canalUtil — helpers puros do canal de presença (GH-MULTI-02)", () => {
  it("nomeCanal prefixa o tenantId com 'sede:' — um canal por sala, nunca global", () => {
    expect(nomeCanal("abc123")).toBe("sede:abc123");
  });

  it("nomeCanal nunca deixa dois tenants diferentes colidirem no mesmo nome", () => {
    expect(nomeCanal("t1")).not.toBe(nomeCanal("t2"));
  });

  it("supabaseConfigurado é false quando NEXT_PUBLIC_SUPABASE_URL não existe", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(supabaseConfigurado()).toBe(false);
    if (original) process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("supabaseConfigurado é true quando a env var existe", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    expect(supabaseConfigurado()).toBe(true);
    if (original) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = original;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/features/world/presenca/canalUtil.test.ts`
Expected: FAIL com "Failed to resolve import './canalUtil'" (o arquivo
ainda não existe).

- [ ] **Step 3: Escrever a implementação mínima**

```ts
// src/features/world/presenca/canalUtil.ts

/**
 * Helpers puros do canal de presença (GH-MULTI-02) — separados de
 * `canal.ts` porque não tocam em rede, então são testáveis sem mock de
 * Supabase nenhum.
 */

/** Um canal por SALA (sede de um tenant), nunca um canal global "todo
 *  mundo online" — evita vazar padrão de uso cruzando quem visita quem
 *  (ver `architecture/BMAD-MULTIPLAYER-VPS.md` §2). */
export function nomeCanal(salaTenantId: string): string {
  return `sede:${salaTenantId}`;
}

/** `NEXT_PUBLIC_*` é inlined pelo Next.js em build time, disponível tanto
 *  no servidor quanto no browser — checar aqui antes de chamar
 *  `supabaseAnon()` é o que permite `GAMEHUB_DB=file` (dev local, sem
 *  Supabase) continuar funcionando sem lançar exceção. */
export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/features/world/presenca/canalUtil.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/features/world/presenca/canalUtil.ts src/features/world/presenca/canalUtil.test.ts
git commit -m "feat(GH-MULTI-02): helpers puros do canal de presenca"
```

---

### Task 2: Diff de entrada/saída de presença (a lógica central, testável com mock)

**Files:**
- Create: `src/features/world/presenca/diffPresenca.ts`
- Test: `src/features/world/presenca/diffPresenca.test.ts`

Esta é a peça mais importante para testar SEM Supabase real: dado um
`RealtimePresenceState` (o formato que `channel.presenceState()` devolve
— um objeto `{ [chaveDePresenca]: VisitantePresente[] }`), calcular quem
entrou e quem saiu desde a última vez, mantendo o "quem eu já vi" como
estado interno.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/features/world/presenca/diffPresenca.test.ts
import { describe, expect, it } from "vitest";
import { criarDiffPresenca } from "./diffPresenca";
import type { VisitantePresente } from "./canal";

function presente(tenantId: string): VisitantePresente {
  return { tenantId, nome: `Negócio ${tenantId}`, entrouEm: "2026-01-01T00:00:00.000Z" };
}

describe("diffPresenca — entrada/saída de visitantes (GH-MULTI-02)", () => {
  it("primeira sincronização: todos os presentes disparam aoEntrar, ninguém dispara aoSair", () => {
    const entrados: string[] = [];
    const saidos: string[] = [];
    const diff = criarDiffPresenca(
      (v) => entrados.push(v.tenantId),
      (id) => saidos.push(id),
    );

    diff.sincronizar({ chave1: [presente("t1")], chave2: [presente("t2")] });

    expect(entrados).toEqual(["t1", "t2"]);
    expect(saidos).toEqual([]);
  });

  it("visitante que já estava presente não dispara aoEntrar de novo na sincronização seguinte", () => {
    const entrados: string[] = [];
    const diff = criarDiffPresenca((v) => entrados.push(v.tenantId), () => {});

    diff.sincronizar({ chave1: [presente("t1")] });
    diff.sincronizar({ chave1: [presente("t1")] }); // mesma presença, sync de novo

    expect(entrados).toEqual(["t1"]); // só uma vez
  });

  it("visitante que sai (não aparece mais na sincronização) dispara aoSair", () => {
    const saidos: string[] = [];
    const diff = criarDiffPresenca(() => {}, (id) => saidos.push(id));

    diff.sincronizar({ chave1: [presente("t1"), presente("t2")] });
    diff.sincronizar({ chave1: [presente("t1")] }); // t2 sumiu

    expect(saidos).toEqual(["t2"]);
  });

  it("visitante que sai e volta dispara aoEntrar de novo (não fica preso como 'já visto')", () => {
    const entrados: string[] = [];
    const diff = criarDiffPresenca((v) => entrados.push(v.tenantId), () => {});

    diff.sincronizar({ chave1: [presente("t1")] });
    diff.sincronizar({}); // t1 sai
    diff.sincronizar({ chave1: [presente("t1")] }); // t1 volta

    expect(entrados).toEqual(["t1", "t1"]);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/features/world/presenca/diffPresenca.test.ts`
Expected: FAIL com "Failed to resolve import './diffPresenca'"

- [ ] **Step 3: Escrever a implementação mínima**

```ts
// src/features/world/presenca/diffPresenca.ts
import type { VisitantePresente } from "./canal";

/** Formato que `RealtimeChannel.presenceState<T>()` devolve — um mapa de
 *  chave de presença (gerenciada pelo Supabase) para lista de payloads. */
export type EstadoPresenca = Record<string, VisitantePresente[]>;

/**
 * Diff de entrada/saída de presença (GH-MULTI-02) — puro na lógica,
 * mantém só o `Set` de quem já foi visto como estado interno. Separado de
 * `canal.ts` para ser testável sem nenhum mock de Supabase: quem chama só
 * precisa fornecer o `EstadoPresenca` (já vem pronto de
 * `channel.presenceState()` na integração real).
 */
export function criarDiffPresenca(
  aoEntrar: (visitante: VisitantePresente) => void,
  aoSair: (visitanteTenantId: string) => void,
) {
  const vistos = new Map<string, VisitantePresente>();

  function sincronizar(estado: EstadoPresenca): void {
    const presentesAgora = new Map<string, VisitantePresente>();
    for (const presencas of Object.values(estado)) {
      for (const p of presencas) {
        presentesAgora.set(p.tenantId, p);
      }
    }

    for (const [tenantId, visitante] of presentesAgora) {
      if (!vistos.has(tenantId)) {
        vistos.set(tenantId, visitante);
        aoEntrar(visitante);
      }
    }
    for (const tenantId of [...vistos.keys()]) {
      if (!presentesAgora.has(tenantId)) {
        vistos.delete(tenantId);
        aoSair(tenantId);
      }
    }
  }

  return { sincronizar };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/features/world/presenca/diffPresenca.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/features/world/presenca/diffPresenca.ts src/features/world/presenca/diffPresenca.test.ts
git commit -m "feat(GH-MULTI-02): diff puro de entrada/saida de presenca"
```

---

### Task 3: `canal.ts` real (integra os dois pedaços puros com o Supabase Realtime)

**Files:**
- Modify: `src/features/world/presenca/canal.ts` (substitui os stubs inteiros)
- Test: `src/features/world/presenca/canal.test.ts`

Esta camada é a única que efetivamente fala com Supabase — testada com um
**fake channel** (objeto que implementa só os 5 métodos que `canal.ts`
usa: `on`, `subscribe`, `unsubscribe`, `track`, `untrack`,
`presenceState`), injetado via mock de `supabaseAnon`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/features/world/presenca/canal.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assinarPresenca, publicarPresenca } from "./canal";

const handlers: Record<string, (payload?: unknown) => void> = {};
let presenceStateAtual: Record<string, unknown[]> = {};
const trackChamadas: unknown[] = [];
let untrackChamado = false;
let unsubscribeChamado = false;

const canalFake = {
  on: vi.fn((_tipo: string, filtro: { event: string }, callback: () => void) => {
    handlers[filtro.event] = callback;
    return canalFake;
  }),
  subscribe: vi.fn(() => canalFake),
  unsubscribe: vi.fn(() => {
    unsubscribeChamado = true;
  }),
  track: vi.fn(async (payload: unknown) => {
    trackChamadas.push(payload);
    return { status: "ok" };
  }),
  untrack: vi.fn(async () => {
    untrackChamado = true;
    return { status: "ok" };
  }),
  presenceState: vi.fn(() => presenceStateAtual),
};

vi.mock("@/lib/supabase/client", () => ({
  supabaseAnon: () => ({
    channel: vi.fn(() => canalFake),
  }),
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
  presenceStateAtual = {};
  trackChamadas.length = 0;
  untrackChamado = false;
  unsubscribeChamado = false;
  for (const k of Object.keys(handlers)) delete handlers[k];
});

describe("canal — presença real integrada ao Supabase Realtime (GH-MULTI-02)", () => {
  it("assinarPresenca conecta ao canal e dispara aoEntrar quando o sync traz um visitante", () => {
    const entrados: string[] = [];
    assinarPresenca("t-sala", (v) => entrados.push(v.tenantId), () => {});

    presenceStateAtual = { c1: [{ tenantId: "t1", nome: "Negócio 1", entrouEm: "x" }] };
    handlers.sync();

    expect(entrados).toEqual(["t1"]);
  });

  it("a função de cancelamento devolvida chama unsubscribe no canal", () => {
    const cancelar = assinarPresenca("t-sala", () => {}, () => {});
    cancelar();
    expect(unsubscribeChamado).toBe(true);
  });

  it("publicarPresenca(true) chama track com o payload de quem está se anunciando", async () => {
    await publicarPresenca("t-sala", { tenantId: "eu", nome: "Meu Negócio", entrouEm: "x" }, true);
    expect(trackChamadas).toEqual([{ tenantId: "eu", nome: "Meu Negócio", entrouEm: "x" }]);
  });

  it("publicarPresenca(false) chama untrack, não track", async () => {
    await publicarPresenca("t-sala", { tenantId: "eu", nome: "Meu Negócio", entrouEm: "x" }, false);
    expect(untrackChamado).toBe(true);
    expect(trackChamadas).toEqual([]);
  });

  it("sem NEXT_PUBLIC_SUPABASE_URL configurado, assinarPresenca vira no-op (nunca lança)", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const cancelar = assinarPresenca("t-sala", () => {}, () => {});
    expect(() => cancelar()).not.toThrow();
  });

  it("sem NEXT_PUBLIC_SUPABASE_URL configurado, publicarPresenca vira no-op (nunca lança)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(
      publicarPresenca("t-sala", { tenantId: "eu", nome: "x", entrouEm: "x" }, true),
    ).resolves.toBeUndefined();
    expect(trackChamadas).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/features/world/presenca/canal.test.ts`
Expected: FAIL (as funções ainda são `declare function`, sem corpo — erro
de import/execução)

- [ ] **Step 3: Escrever a implementação mínima**

```ts
// src/features/world/presenca/canal.ts
import { supabaseAnon } from "@/lib/supabase/client";
import { nomeCanal, supabaseConfigurado } from "./canalUtil";
import { criarDiffPresenca, type EstadoPresenca } from "./diffPresenca";

/**
 * Canal de presença ao vivo (GH-MULTI-02) — Supabase Realtime Presence,
 * decisão já tomada em `world/EVOLUCAO-MOTOR-2026.md` §3.5 e reafirmada
 * em `architecture/BMAD-MULTIPLAYER-VPS.md` §3.1: Presence, não Broadcast
 * nem Postgres Changes, porque "quem está aqui agora" é exatamente o caso
 * de uso que essa API resolve — sem precisar modelar isso como linha de
 * tabela (nunca é persistido).
 *
 * PRÉ-REQUISITO DE SEGURANÇA: este é o PRIMEIRO código deste projeto que
 * chama `supabaseAnon()` do lado do cliente — a partir daqui a anon key
 * fica pública no bundle do browser. `GH-MULTI-00` (hardening de RLS de
 * `negocios`) precisa estar feito e VERIFICADO contra Postgres real antes
 * de este arquivo rodar em produção. Ver `GAPS-DE-INTEGRACAO.md` (🔴).
 */

export interface VisitantePresente {
  tenantId: string;
  nome: string;
  entrouEm: string;
}

/**
 * Assina o canal de presença de UMA sala (a sede de `salaTenantId`) e
 * mantém `aoEntrar`/`aoSair` chamados conforme visitantes entram/saem.
 * Retorna a função de cancelamento da assinatura. No-op silencioso (nunca
 * lança) se `NEXT_PUBLIC_SUPABASE_URL` não estiver configurado —
 * `GAMEHUB_DB=file` continua funcionando sem Supabase.
 */
export function assinarPresenca(
  salaTenantId: string,
  aoEntrar: (visitante: VisitantePresente) => void,
  aoSair: (visitanteTenantId: string) => void,
): () => void {
  if (!supabaseConfigurado()) return () => {};

  const canal = supabaseAnon().channel(nomeCanal(salaTenantId));
  const diff = criarDiffPresenca(aoEntrar, aoSair);

  canal.on("presence", { event: "sync" }, () => {
    diff.sincronizar(canal.presenceState<VisitantePresente>() as EstadoPresenca);
  });
  canal.subscribe();

  return () => canal.unsubscribe();
}

/**
 * Anuncia que `eu` entrou ou saiu da sala de `salaTenantId`. Chamado pela
 * tela de visita quando ela montar (`presente: true`) e desmontar
 * (`presente: false`). No-op silencioso se Supabase não configurado.
 */
export async function publicarPresenca(
  salaTenantId: string,
  eu: VisitantePresente,
  presente: boolean,
): Promise<void> {
  if (!supabaseConfigurado()) return;

  const canal = supabaseAnon().channel(nomeCanal(salaTenantId));
  if (presente) {
    await canal.track(eu);
  } else {
    await canal.untrack();
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/features/world/presenca/canal.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Rodar a suíte inteira (garantir que nada mais quebrou)**

Run: `npm run typecheck && npm test`
Expected: typecheck limpo, todos os testes (incluindo os ~235 já
existentes) passando.

- [ ] **Step 6: Commit**

```bash
git add src/features/world/presenca/canal.ts src/features/world/presenca/canal.test.ts
git commit -m "feat(GH-MULTI-02): canal de presenca real via Supabase Realtime"
```

---

## Verificação final (só possível com `GH-MULTI-00`/`GH-MULTI-01` prontos)

Os testes acima usam um canal FALSO — provam a lógica, não a integração
real com Supabase. Antes de considerar este card pronto de verdade:

1. Confirmar `GH-MULTI-00` aplicado e verificado (RLS de `negocios`
   restrita, view `negocios_publico` no lugar).
2. Confirmar `.env` com `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
   reais (projeto de `GH-MULTI-01`).
3. Rota temporária de teste (padrão já usado no projeto, apagar depois):
   abrir duas abas autenticadas como tenants diferentes, ambas chamando
   `assinarPresenca`/`publicarPresenca` para a MESMA `salaTenantId`, e
   confirmar visualmente (console.log) que uma vê a outra entrar/sair.
4. Só depois disso, prosseguir para `GH-MULTI-03` (integração visual em
   `VisitaScreen.tsx`).

## Self-review deste plano

- **Cobertura do spec:** `assinarPresenca`/`publicarPresenca` (Task 3),
  no-op sem Supabase configurado (Task 1 + testes de Task 3), payload
  restrito a `{tenantId, nome, entrouEm}` (assinatura de `VisitantePresente`
  mantida em todas as tasks), nunca persistido (nenhuma migration em
  nenhuma task). Escopo do canal por sala, não global (Task 1,
  `nomeCanal`). Todos os critérios de aceitação de `GH-MULTI-02` no
  backlog têm uma task correspondente.
- **Placeholders:** nenhum "TODO"/"implementar depois" — todo código é
  completo em cada step.
- **Consistência de tipos:** `VisitantePresente` definido uma vez em
  `canal.ts` (Task 3) e importado por `diffPresenca.ts` (Task 2) — mesmo
  shape em todo o plano, sem duplicação de definição.
