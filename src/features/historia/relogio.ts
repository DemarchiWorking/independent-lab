/**
 * Relógio da narrativa — puro, sem `Date.now()` escondido.
 *
 * Toda função recebe o "agora" explicitamente. Isso não é preciosismo: é o que
 * torna a história **testável** (posso simular o dia 47 sem esperar 47 dias) e
 * o que impede o cliente de forjar o tempo — quem chama sempre passa o relógio
 * do SERVIDOR (ver EVOLUCAO-MOTOR-2026.md §7.4, vetor "forjar tempo decorrido").
 *
 * Não há cron nem loop: o estado narrativo é calculado na leitura, a partir de
 * (criadoEm, agora). É o relógio *lazy* da §5.2 — custo de infra zero e
 * progressão que acontece mesmo com o jogador offline.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * O relógio global do jogo — um único "agora", compartilhado por todos os
 * tenants (não há relógio por usuário nem por fuso).
 *
 * Pode ser lido mentalmente como "horário de Brasília": todo gatilho da
 * história compara ou uma DURAÇÃO (`diasAposCadastro`, dias corridos) ou um
 * INSTANTE absoluto (`dataFixa`, ISO com `Z`) — nenhum dos dois depende de
 * fuso horário, então uma "Semana do MEI" cai no mesmo instante para um
 * negócio em Mendes ou em Manaus. Se um dia a história precisar de fronteira
 * de dia civil ("todo primeiro dia do mês"), é aqui que se fixaria o fuso
 * `America/Sao_Paulo` — hoje seria complexidade sem uso real.
 *
 * Único ponto de chamada: nunca ler `new Date()` direto em Server Action —
 * é o que garante uma fonte de tempo e não N, e o que torna a narrativa
 * mockável em teste sem tocar em relógio de sistema.
 */
export function agoraGlobal(): string {
  return new Date().toISOString();
}

/** Dias corridos completos entre duas datas ISO. Nunca negativo. */
export function diasEntre(deIso: string, ateIso: string): number {
  const de = Date.parse(deIso);
  const ate = Date.parse(ateIso);
  if (Number.isNaN(de) || Number.isNaN(ate)) return 0;
  return Math.max(0, Math.floor((ate - de) / MS_POR_DIA));
}

/** Quantos dias o negócio tem de vida. É o "dia da campanha" do jogador. */
export function diaDoNegocio(criadoEm: string, agoraIso: string): number {
  return diasEntre(criadoEm, agoraIso);
}

/**
 * A data-alvo já chegou, e ainda está dentro da janela do evento?
 *
 * `janelaDias` existe para evento global não ficar preso para sempre: uma
 * "Semana do Empreendedor" que passou há três meses não deve pipocar para quem
 * se cadastrou depois. `undefined` = vale para sempre a partir da data.
 */
export function dentroDaJanela(
  alvoIso: string,
  agoraIso: string,
  janelaDias?: number,
): boolean {
  const alvo = Date.parse(alvoIso);
  const agora = Date.parse(agoraIso);
  if (Number.isNaN(alvo) || Number.isNaN(agora)) return false;
  if (agora < alvo) return false;
  if (janelaDias === undefined) return true;
  return agora - alvo <= janelaDias * MS_POR_DIA;
}

/** Rótulo humano do tempo de casa — usado no cabeçalho da linha do tempo. */
export function rotuloDeTempo(dias: number): string {
  if (dias <= 0) return "Primeiro dia";
  if (dias === 1) return "1 dia de estrada";
  if (dias < 30) return `${dias} dias de estrada`;
  const meses = Math.floor(dias / 30);
  if (meses === 1) return "1 mês de estrada";
  if (meses < 12) return `${meses} meses de estrada`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? "1 ano de estrada" : `${anos} anos de estrada`;
}
