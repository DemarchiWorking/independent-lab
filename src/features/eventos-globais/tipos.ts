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
 *
 * Sem `criadoPor`: quem criou vem SEMPRE do `sessao.email` no servidor,
 * nunca de um campo enviado pelo client (mesmo motivo de `tenantId` nunca
 * vir do client em nenhuma outra action deste projeto).
 */
export type NovoEventoGlobal = Omit<
  EventoGlobal,
  "id" | "criadoEm" | "objetivo" | "criadoPor"
> & {
  objetivo: EventoKey;
};

export type StatusEvento = "agendado" | "ativo" | "encerrado";
