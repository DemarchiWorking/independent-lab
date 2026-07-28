import type { ProgressoEventoGlobal } from "./tipos";

/**
 * Verdadeiro quando a recompensa do evento já foi concedida a este tenant —
 * usada para nunca reaplicar XP/moeda/atributo numa releitura da mesma
 * contagem. Mesma classe de guarda anti-farm de `jaAceitouTrabalho` e
 * `jaDesbloqueouNo`; a garantia real fica na RPC (`completo_em` só é
 * setado uma vez), isto aqui é só a checagem amigável do lado da aplicação.
 */
export function jaRecompensado(progresso: ProgressoEventoGlobal | undefined): boolean {
  return progresso?.completoEm != null;
}
