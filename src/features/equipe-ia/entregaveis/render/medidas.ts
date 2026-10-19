import type { PapelSlide } from "../tipos";
import { tamanhoQueCabe } from "./ajuste";
import { FORMATOS_SLIDE, margensDoFormato, type FormatoSlide } from "./formatos";

/**
 * Tamanho de fonte do título e do texto de um slide, em px na base de 1080 de
 * largura. Uma função só para os dois lados: o servidor a usa para desenhar o
 * PNG e o editor a usa para a pré-visualização, então a tela mostra o que a
 * imagem vai ter. Pura e sem dependência de servidor.
 */

export interface MedidasDoSlide {
  tamanhoTitulo: number;
  tamanhoTexto: number;
}

export function medidasDoSlide(entrada: {
  papel: PapelSlide;
  titulo: string;
  texto: string;
  formato: FormatoSlide;
}): MedidasDoSlide {
  const { largura, altura } = FORMATOS_SLIDE[entrada.formato];
  const m = margensDoFormato(entrada.formato);
  const caixaLargura = largura - m.lado * 2;
  // altura útil do miolo: descontando topo, rodapé e o contador
  const miolo = altura - m.topo - m.base - 150;

  const capa = entrada.papel === "capa";
  const convite = entrada.papel === "cta";

  const alturaTitulo = Math.round(miolo * (capa ? 0.62 : convite ? 0.42 : 0.3));
  const tamanhoTitulo = tamanhoQueCabe(
    entrada.titulo,
    { largura: caixaLargura, altura: alturaTitulo },
    capa ? 56 : 44,
    capa ? 118 : convite ? 92 : 76,
  );
  const alturaTexto = Math.max(160, miolo - alturaTitulo - 60);
  const tamanhoTexto = tamanhoQueCabe(entrada.texto, { largura: caixaLargura, altura: alturaTexto }, 32, capa ? 48 : 64);
  return { tamanhoTitulo, tamanhoTexto };
}
