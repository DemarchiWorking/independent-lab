import { ATRIBUTO_CHAVES, ATRIBUTO_LABEL, type Atributos } from "@/lib/atributos";
import type { AtributoChave } from "@tokens";
import type { BenchmarkBairro } from "@/lib/db/types";

/**
 * Comparação "você × média do bairro" (GH-MAPA-04) — pura, para ser
 * testável sem depender do repositório. Deliberadamente NÃO é um ranking:
 * o produto original (Startup Panic) mostra "rival 96% × você 3%", o que é
 * desmotivador para um empresário real. Esta função só devolve os números;
 * quem decide o enquadramento é `mensagemFoco()` abaixo, sempre orientado a
 * ação, nunca a derrota.
 */
export interface EixoComparado {
  chave: AtributoChave;
  label: string;
  seuValor: number;
  media: number;
}

export function compararComBenchmark(
  atributos: Atributos,
  benchmark: BenchmarkBairro,
): EixoComparado[] {
  return ATRIBUTO_CHAVES.map((chave) => ({
    chave,
    label: ATRIBUTO_LABEL[chave],
    seuValor: atributos[chave].valor,
    media: benchmark.medias[chave],
  }));
}

/** O eixo onde a distância para a média é maior (candidato à mensagem de
 *  foco) — `null` se o negócio está na média ou acima em todos os eixos
 *  (nada de "achar" um ponto fraco que não existe). */
export function eixoParaFocar(comparados: readonly EixoComparado[]): EixoComparado | null {
  const abaixoDaMedia = comparados.filter((e) => e.seuValor < e.media);
  if (abaixoDaMedia.length === 0) return null;
  return abaixoDaMedia.reduce((pior, atual) =>
    atual.media - atual.seuValor > pior.media - pior.seuValor ? atual : pior,
  );
}

/** Ação real do jogo por eixo — nunca teoria solta, sempre um botão que existe. */
const SUGESTAO_POR_EIXO: Record<AtributoChave, string> = {
  tecnologia: "desbloquear um nó da Árvore de Parcerias",
  processo: "contratar o Documentador de IA",
  presenca: "contratar o Social Media ou o Editor de Vídeo de IA",
  aquisicao: "contratar o Comercial/SDR de IA",
  capacidade: "evoluir sua Sede",
};

/** Mensagem sempre orientada a ação — nunca compara com outro negócio por
 *  nome, nunca usa linguagem de derrota/ranking. */
export function mensagemFoco(eixo: EixoComparado): string {
  const diferenca = Math.max(1, Math.round(eixo.media - eixo.seuValor));
  const plural = diferenca === 1 ? "ponto" : "pontos";
  return (
    `Você está ${diferenca} ${plural} abaixo da média do seu bairro em ` +
    `${eixo.label} — ${SUGESTAO_POR_EIXO[eixo.chave]} ajuda a fechar essa distância.`
  );
}
