import type { Bloco, Documento, PacoteCarrossel } from "../entregaveis/tipos";

/**
 * Apoio dos testes da camada de IA: transforma o material de regras no formato
 * que o modelo devolve (todos os campos presentes, sem opcionais), para os
 * testes poderem simular "o que um modelo bem comportado responderia" e depois
 * estragar a resposta de formas específicas.
 */

export type SaidaDocumento = {
  titulo: string;
  subtitulo: string;
  secoes: Array<{ id: string; titulo: string; intro: string; blocos: Array<Record<string, unknown>> }>;
};

export function blocoComoSaida(b: Bloco): Record<string, unknown> {
  switch (b.tipo) {
    case "destaque":
      return { tipo: "destaque", titulo: b.titulo ?? "", texto: b.texto, tom: b.tom };
    case "lista":
      return { tipo: "lista", itens: b.itens, ordenada: b.ordenada === true };
    case "passos":
      return { tipo: "passos", passos: b.passos.map((p) => ({ titulo: p.titulo, detalhe: p.detalhe ?? "" })) };
    case "mensagem":
      return { tipo: "mensagem", rotulo: b.rotulo, quando: b.quando ?? "", texto: b.texto };
    default:
      return { ...b };
  }
}

export function documentoComoSaida(doc: Documento): SaidaDocumento {
  return {
    titulo: doc.titulo,
    subtitulo: doc.subtitulo,
    secoes: doc.secoes.map((s) => ({ id: s.id, titulo: s.titulo, intro: s.intro ?? "", blocos: s.blocos.map(blocoComoSaida) })),
  };
}

export function pacoteComoSaida(p: PacoteCarrossel): Record<string, unknown> {
  return {
    pautas: p.pautas.map((pt) => ({
      id: pt.id,
      rotulo: pt.rotulo,
      objetivo: pt.objetivo,
      slides: pt.slides.map((s) => ({ papel: s.papel, titulo: s.titulo, texto: s.texto })),
      legenda: pt.legenda,
      hashtags: pt.hashtags,
      textoAlternativo: pt.textoAlternativo,
      orientacaoVisual: pt.orientacaoVisual,
    })),
    boasPraticas: p.boasPraticas,
    reaproveitamento: p.reaproveitamento,
    metricas: p.metricas,
  };
}

/** Uma seção extra bem comportada, como a IA pode acrescentar. */
export function secaoExtra(): SaidaDocumento["secoes"][number] {
  return {
    id: "ia-prioridades",
    titulo: "Suas três prioridades desta semana",
    intro: "",
    blocos: [{ tipo: "lista", itens: ["Atualizar o perfil do negócio no Google", "Responder todo contato no mesmo dia", "Anotar de onde veio cada cliente novo"], ordenada: true }],
  };
}
