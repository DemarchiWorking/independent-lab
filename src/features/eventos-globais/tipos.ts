import type { EventoKey } from "@/features/gamificacao/engine";
import type { EventoGlobal, ProgressoEventoGlobal } from "@/lib/db/types";

export type { EventoGlobal, ProgressoEventoGlobal } from "@/lib/db/types";

/**
 * Entrada de criação de um evento (usada só pela action de admin). Aqui,
 * ao contrário de `EventoGlobal.objetivo` (que é `string` em `lib/db/types.ts`
 * — o repositório não conhece `features/`), `objetivo` é o `EventoKey` real
 * do catálogo de `features/gamificacao/engine.ts`: a action valida contra
 * ele antes de persistir, então o formulário de admin só pode escolher um
 * objetivo que o dispatcher `recompensar()` realmente sabe contar.
 */
export type NovoEventoGlobal = Omit<EventoGlobal, "id" | "criadoEm" | "objetivo"> & {
  objetivo: EventoKey;
};

export type StatusEvento = "agendado" | "ativo" | "encerrado";
