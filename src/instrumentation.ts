/**
 * Roda uma vez quando o servidor Next.js sobe. Valida o ambiente, recusa
 * iniciar configurado errado (ver `lib/ambiente.ts`) e liga o agendador da IA.
 *
 * Tudo que usa módulo do Node mora em `instrumentation-node.ts`. O Next
 * compila este arquivo também para o runtime Edge; o `import()` dentro de um
 * `if (process.env.NEXT_RUNTIME === "nodejs")` é o padrão documentado para o
 * bundler cortar esse ramo do Edge. Um `import` direto de `node:fs` ou
 * `node:crypto` aqui derrubava o servidor de desenvolvimento com erro 500.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registrarNode } = await import("./instrumentation-node");
    await registrarNode();
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
