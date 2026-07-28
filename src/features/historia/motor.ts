import { dentroDaJanela, diaDoNegocio } from "./relogio";
import type {
  Capitulo,
  EfeitoEscolha,
  Escolha,
  EstadoNarrativo,
  Gatilho,
} from "./tipos";

/**
 * Motor de história — decide QUAIS capítulos o jogador pode receber agora.
 *
 * Puro e determinístico: mesma entrada (estado + agora), mesma saída. Nenhum
 * `Date.now()`, nenhum acesso a banco, nenhum `Math.random()`. É o que permite
 * simular o dia 90 num teste de 1ms.
 */

/** Um gatilho está satisfeito para este estado, neste instante? */
export function gatilhoAtendido(
  gatilho: Gatilho,
  estado: EstadoNarrativo,
  agoraIso: string,
): boolean {
  switch (gatilho.tipo) {
    case "diasAposCadastro":
      return diaDoNegocio(estado.criadoEm, agoraIso) >= gatilho.dias;

    case "dataFixa":
      return dentroDaJanela(gatilho.iso, agoraIso, gatilho.janelaDias);

    case "xpMinimo":
      return estado.xp >= gatilho.xp;

    case "degrauMinimo":
      return estado.degrauAtual >= gatilho.degrau;

    case "atributoMinimo":
      return (estado.atributos[gatilho.chave]?.valor ?? 0) >= gatilho.valor;

    case "atributoAbaixo":
      return (estado.atributos[gatilho.chave]?.valor ?? 0) < gatilho.valor;

    case "equipeMinima":
      return estado.tamanhoEquipe >= gatilho.quantidade;

    case "aposCapitulo":
      return estado.capitulosResolvidos.has(gatilho.capituloId);

    case "todos":
      return gatilho.de.every((g) => gatilhoAtendido(g, estado, agoraIso));
  }
}

/** O capítulo vale para o segmento deste negócio? */
function segmentoCompativel(capitulo: Capitulo, estado: EstadoNarrativo): boolean {
  return !capitulo.segmentos || capitulo.segmentos.includes(estado.segmento);
}

/**
 * Capítulos que o jogador deveria ter recebido até agora e ainda não recebeu.
 *
 * Ordenado por `peso` — quando o jogador volta depois de sumir uma semana e
 * três capítulos vencem de uma vez, ele os lê na ordem que faz sentido
 * narrativo, não na ordem do array.
 */
export function capitulosPendentes(
  catalogo: readonly Capitulo[],
  estado: EstadoNarrativo,
  agoraIso: string,
): Capitulo[] {
  return catalogo
    .filter((c) => !estado.capitulosEntregues.has(c.id))
    .filter((c) => segmentoCompativel(c, estado))
    .filter((c) => gatilhoAtendido(c.gatilho, estado, agoraIso))
    .sort((a, b) => a.peso - b.peso || a.id.localeCompare(b.id));
}

/**
 * O próximo capítulo a mostrar — um de cada vez.
 *
 * Decisão de UX: entregar em fila, não em lote. Cair sete cartas de uma vez
 * depois de um mês offline vira burocracia; uma de cada vez mantém o ritmo de
 * história.
 */
export function proximoCapitulo(
  catalogo: readonly Capitulo[],
  estado: EstadoNarrativo,
  agoraIso: string,
): Capitulo | null {
  return capitulosPendentes(catalogo, estado, agoraIso)[0] ?? null;
}

/** Localiza um capítulo pelo id. */
export function capituloPorId(
  catalogo: readonly Capitulo[],
  id: string,
): Capitulo | undefined {
  return catalogo.find((c) => c.id === id);
}

/** Localiza uma escolha dentro de um capítulo. */
export function escolhaPorId(capitulo: Capitulo, id: string): Escolha | undefined {
  return capitulo.escolhas.find((e) => e.id === id);
}

/**
 * Converte o efeito de uma escolha no delta que `aplicarProgresso` entende.
 *
 * O motor de história **não** aplica nada: ele só descreve. Quem escreve é a
 * Server Action, pela mesma RPC atômica de sempre. Manter essa fronteira é o
 * que impede a narrativa de virar uma segunda porta de entrada para a economia.
 */
export function deltaDaEscolha(efeito: EfeitoEscolha): {
  xp: number;
  moeda: number;
  degraus: number;
  atributos?: EfeitoEscolha["atributos"];
} {
  return {
    xp: efeito.xp ?? 0,
    moeda: efeito.moeda ?? 0,
    // história nunca mexe em degrau: quem sobe degrau é ação real de negócio
    degraus: 0,
    atributos: efeito.atributos,
  };
}
