import type { EventoGlobal, ProgressoEventoGlobal, StatusEvento } from "./tipos";

type Janela = Pick<EventoGlobal, "inicioEm" | "fimEm">;

/** Deriva o status a partir da janela — nunca um campo gravado (relógio
 *  lazy, mesmo padrão de `features/historia/relogio.ts`). */
export function statusDe(evento: Janela, agoraIso: string): StatusEvento {
  if (agoraIso < evento.inicioEm) return "agendado";
  if (agoraIso > evento.fimEm) return "encerrado";
  return "ativo";
}

export function estaAtivo(evento: Janela, agoraIso: string): boolean {
  return statusDe(evento, agoraIso) === "ativo";
}

/** Janela válida: início estritamente antes do fim. Checagem de UI do
 *  admin — a garantia real é o `check` na migration. */
export function janelaValida(inicioEm: string, fimEm: string): boolean {
  return inicioEm < fimEm;
}

/** 0–100, inteiro, nunca passa de 100 mesmo com contagem > meta. */
export function progressoPercentual(contagem: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(100, Math.round((contagem / meta) * 100));
}

export function atingiuMeta(contagem: number, meta: number): boolean {
  return contagem >= meta;
}

/** Progresso de um tenant num evento — tenant sem registro ainda conta 0,
 *  nunca lança (mesmo espírito de `alocacoesAtivasEm`/`disponibilidadeDe`). */
export function progressoDe(
  progressos: readonly ProgressoEventoGlobal[],
  eventoId: string,
): ProgressoEventoGlobal | undefined {
  return progressos.find((p) => p.eventoId === eventoId);
}

/** Eventos visíveis a um jogador agora: ativos primeiro, depois agendados
 *  (teaser do que vem por aí) — encerrados somem da lista principal. */
export function eventosVisiveis(
  eventos: readonly EventoGlobal[],
  agoraIso: string,
): EventoGlobal[] {
  const ordem: Record<StatusEvento, number> = { ativo: 0, agendado: 1, encerrado: 2 };
  return eventos
    .filter((e) => statusDe(e, agoraIso) !== "encerrado")
    .slice()
    .sort((a, b) => ordem[statusDe(a, agoraIso)] - ordem[statusDe(b, agoraIso)]);
}
