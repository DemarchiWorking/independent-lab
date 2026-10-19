/**
 * Ajuste de tamanho de texto para caber numa caixa — o que impede o título de
 * um slide de estourar a imagem.
 *
 * O gerador de imagem (Satori) não tem "reduzir texto para caber": se o texto
 * for maior que a caixa, ele simplesmente transborda e o slide sai cortado. Em
 * vez de medir fonte de verdade (o que exigiria carregar a fonte no cálculo),
 * estimamos a largura por caractere com uma média conservadora para a
 * família usada (Nunito) e quebramos por palavra, como o navegador faz.
 *
 * É uma estimativa, de propósito um pouco pessimista: errar para menos deixa o
 * texto um pouco menor que o possível; errar para mais corta o slide.
 */

/** Largura média de um caractere, em fração do tamanho da fonte. Nunito em peso 700 a 800. */
export const LARGURA_MEDIA = 0.56;
export const ALTURA_DE_LINHA = 1.22;

export interface Caixa {
  largura: number;
  altura: number;
}

/** Quantas linhas o texto ocupa com esse tamanho, quebrando por palavra e respeitando `\n`. */
export function contarLinhas(texto: string, tamanho: number, larguraCaixa: number): number {
  const maxCaracteres = Math.max(1, Math.floor(larguraCaixa / (tamanho * LARGURA_MEDIA)));
  let linhas = 0;
  for (const paragrafo of texto.split("\n")) {
    const palavras = paragrafo.split(/\s+/).filter(Boolean);
    if (palavras.length === 0) {
      linhas += 1;
      continue;
    }
    let atual = 0;
    let linhasDoParagrafo = 1;
    for (const palavra of palavras) {
      // palavra maior que a linha é quebrada em pedaços
      const tamanhoPalavra = palavra.length;
      if (tamanhoPalavra > maxCaracteres) {
        if (atual > 0) linhasDoParagrafo += 1;
        linhasDoParagrafo += Math.ceil(tamanhoPalavra / maxCaracteres) - 1;
        atual = tamanhoPalavra % maxCaracteres;
        continue;
      }
      const precisa = atual === 0 ? tamanhoPalavra : atual + 1 + tamanhoPalavra;
      if (precisa > maxCaracteres) {
        linhasDoParagrafo += 1;
        atual = tamanhoPalavra;
      } else {
        atual = precisa;
      }
    }
    linhas += linhasDoParagrafo;
  }
  return linhas;
}

/**
 * O maior tamanho (entre `minimo` e `maximo`, em passos de 2 px) com que o
 * texto cabe na caixa. Se nem o mínimo couber, devolve o mínimo: o chamador
 * limita o tamanho do texto antes, e é melhor um texto pequeno que um sumido.
 */
export function tamanhoQueCabe(texto: string, caixa: Caixa, minimo: number, maximo: number): number {
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const altura = contarLinhas(texto, tamanho, caixa.largura) * tamanho * ALTURA_DE_LINHA;
    if (altura <= caixa.altura) return tamanho;
  }
  return minimo;
}
