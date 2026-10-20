import { textoLivre, umaLinha } from "./linguagem";
import type { PautaCarrossel } from "./tipos";

/**
 * Edição de uma pauta de carrossel — regras puras, sem dependência de
 * servidor, usadas dos DOIS lados: o editor no navegador (contadores, bloqueio
 * de download) e a rota (que repete tudo, porque o servidor nunca confia no
 * que o navegador diz ter validado).
 */

/** Teto do que o editor aceita por slide — acima do que o gerador produz, para dar liberdade. */
export const LIMITES_EDICAO = { titulo: 90, texto: 280 } as const;

/** Teto da legenda de uma publicação (o limite do Instagram). */
export const LIMITE_LEGENDA = 2200;

export interface EdicaoSlide {
  titulo: string;
  texto: string;
}

/** `[campo]` entre colchetes: algo que só o dono sabe e ainda não foi preenchido. */
export const CAMPO_PENDENTE = /\[[^\]\n]+\]/;

/** Aplica as edições do usuário sobre a pauta gerada, com limpeza e teto de tamanho. */
export function aplicarEdicoes(pauta: PautaCarrossel, edicoes: readonly EdicaoSlide[] | null): PautaCarrossel {
  if (!edicoes) return pauta;
  return {
    ...pauta,
    slides: pauta.slides.map((s, i) => {
      const e = edicoes[i];
      if (!e) return s;
      return {
        ...s,
        titulo: umaLinha(textoLivre(e.titulo, LIMITES_EDICAO.titulo)) || s.titulo,
        texto: textoLivre(e.texto, LIMITES_EDICAO.texto) || s.texto,
      };
    }),
  };
}

/** Slides (1 a N) que ainda têm campo `[entre colchetes]` por preencher. */
export function slidesPendentes(pauta: PautaCarrossel, alvo: number | null): number[] {
  return pauta.slides
    .map((s, i) => ({ s, n: i + 1 }))
    .filter(({ s, n }) => (alvo === null || alvo === n) && (CAMPO_PENDENTE.test(s.titulo) || CAMPO_PENDENTE.test(s.texto)))
    .map(({ n }) => n);
}
