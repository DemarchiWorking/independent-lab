import { color } from "@tokens";

/**
 * Formatos e temas dos slides — só dados, sem nenhuma dependência de servidor.
 *
 * Ficam num arquivo próprio porque são usados dos dois lados: o servidor
 * desenha o PNG (`slide.tsx`, que lê fontes do disco) e o editor no navegador
 * mostra a pré-visualização com as MESMAS cores e proporções. Se vivessem em
 * `slide.tsx`, o bundle do navegador tentaria carregar `node:fs`.
 */

export type FormatoSlide = "quadrado" | "retrato" | "story";
export type TemaSlide = "escuro" | "claro" | "destaque";

export const FORMATOS_SLIDE: Record<FormatoSlide, { largura: number; altura: number; rotulo: string }> = {
  quadrado: { largura: 1080, altura: 1080, rotulo: "Quadrado (1:1)" },
  retrato: { largura: 1080, altura: 1350, rotulo: "Retrato (4:5)" },
  story: { largura: 1080, altura: 1920, rotulo: "Story (9:16)" },
};

export interface TemaVisual {
  rotulo: string;
  fundo: string;
  texto: string;
  suave: string;
  acento: string;
  botao: string;
  textoBotao: string;
}

export const TEMAS_SLIDE: Record<TemaSlide, TemaVisual> = {
  escuro: {
    rotulo: "Escuro",
    fundo: color.bg.night,
    texto: color.bg.panel,
    suave: color.text.muted,
    acento: color.brand.teal,
    botao: color.brand.orange,
    textoBotao: color.text.ink,
  },
  claro: {
    rotulo: "Claro",
    fundo: color.bg.light,
    texto: color.text.ink,
    suave: color.text.mutedOnLight,
    acento: color.brand.orange,
    botao: color.brand.teal,
    textoBotao: color.text.ink,
  },
  destaque: {
    rotulo: "Destaque",
    fundo: color.brand.orange,
    texto: color.text.ink,
    suave: color.bg.night,
    acento: color.bg.night,
    botao: color.bg.night,
    textoBotao: color.bg.panel,
  },
};

/** Margens do slide em px (base 1080 de largura). O Story respeita a área segura da interface. */
export function margensDoFormato(formato: FormatoSlide) {
  return formato === "story" ? { lado: 90, topo: 250, base: 300 } : { lado: 84, topo: 84, base: 84 };
}
