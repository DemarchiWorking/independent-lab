import type { EventoGlobal } from "./db/types";

/**
 * Evento ativo agora: dentro da janela [inicioEm, fimEm] — relógio lazy,
 * nunca um status gravado. Vive em `lib/` (não em `features/`) porque tanto
 * `lib/db/file-adapter.ts`/`supabase-adapter.ts` (decidem quais eventos
 * incrementar) quanto `features/eventos-globais/motor.ts` (UI) precisam da
 * MESMA regra — mesmo motivo de `lib/disponibilidade.ts` existir.
 */
export function eventoAtivoEm(
  evento: Pick<EventoGlobal, "inicioEm" | "fimEm">,
  agoraIso: string,
): boolean {
  return agoraIso >= evento.inicioEm && agoraIso <= evento.fimEm;
}
