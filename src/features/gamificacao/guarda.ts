import type { EventoKey } from "./engine";

/**
 * Eventos que o cliente pode pedir pelo dispatcher genérico `recompensar()`.
 *
 * Os demais (`cadastro_completo`, `oferta_publicada`, `parceria_formada`,
 * `servico_desbloqueado`) têm action própria com checagem de elegibilidade,
 * ou são aplicados no servidor como efeito colateral de outra ação. Antes,
 * qualquer jogador podia chamar `recompensar("parceria_formada")` em laço e
 * receber XP e moeda a cada chamada.
 */
export const EVENTOS_DO_CLIENTE = [
  "funcionario_ia_contratado",
  "servico_contratado",
  "diagnostico_agendado",
  "retro_90d",
] as const satisfies readonly EventoKey[];

export type EventoDoCliente = (typeof EVENTOS_DO_CLIENTE)[number];

export function eventoDoCliente(evento: unknown): evento is EventoDoCliente {
  return typeof evento === "string" && (EVENTOS_DO_CLIENTE as readonly string[]).includes(evento);
}

/**
 * Marco único que impede pagar a mesma missão duas vezes.
 * - diagnóstico: uma vez por negócio;
 * - retrospectiva de 90 dias: uma vez por trimestre do calendário.
 * `agoraIso` vem sempre do relógio do servidor.
 */
export function marcoDaMissao(evento: "diagnostico_agendado" | "retro_90d", agoraIso: string): string {
  if (evento === "diagnostico_agendado") return "diagnostico_agendado";
  const data = new Date(agoraIso);
  const trimestre = Math.floor(data.getUTCMonth() / 3) + 1;
  return `retro_90d:${data.getUTCFullYear()}-T${trimestre}`;
}
