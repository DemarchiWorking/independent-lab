/**
 * Roda uma vez quando o servidor Next.js sobe. Valida o ambiente e recusa
 * iniciar configurado errado (ver `lib/ambiente.ts`).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Durante `next build` o servidor não roda: não exige as variáveis de produção.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { validarAmbiente } = await import("@/lib/ambiente");
  const { erros, avisos } = validarAmbiente();

  for (const aviso of avisos) console.warn(`[ambiente] aviso: ${aviso}`);
  if (erros.length > 0) {
    for (const erro of erros) console.error(`[ambiente] ERRO: ${erro}`);
    throw new Error(`Ambiente inválido (${erros.length}). O servidor não vai iniciar.`);
  }
}

/** Erros não tratados de qualquer requisição vão para o log, com o caminho. */
export function onRequestError(
  erro: unknown,
  requisicao: { path: string; method: string },
): void {
  const mensagem = erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro);
  console.error(`[erro] ${requisicao.method} ${requisicao.path} ${mensagem}`);
}
