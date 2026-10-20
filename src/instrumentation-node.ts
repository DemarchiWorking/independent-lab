/**
 * Parte da inicialização que só roda no Node (ver `instrumentation.ts`).
 */
export async function registrarNode(): Promise<void> {
  // Durante `next build` o servidor não roda: não exige as variáveis de produção.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { validarAmbiente } = await import("@/lib/ambiente");
  const { erros, avisos } = validarAmbiente();

  for (const aviso of avisos) console.warn(`[ambiente] aviso: ${aviso}`);
  if (erros.length > 0) {
    for (const erro of erros) console.error(`[ambiente] ERRO: ${erro}`);
    throw new Error(`Ambiente inválido (${erros.length}). O servidor não vai iniciar.`);
  }

  // Agendador da IA: recolhe resultados e faz a melhoria contínua de hora em hora.
  // GAMEHUB_IA_AGENDADOR=0 desliga (útil em testes e em instâncias de leitura).
  if (process.env.GAMEHUB_IA_AGENDADOR !== "0" && process.env.NODE_ENV !== "test") {
    try {
      const { getRepository } = await import("@/lib/db");
      const { iniciarAgendador } = await import("@/features/equipe-ia/ia/agendador");
      await iniciarAgendador(getRepository());
    } catch (e) {
      // A IA é auxiliar: se o agendador não subir, o app sobe do mesmo jeito.
      console.error(`[ia] agendador não iniciou: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
