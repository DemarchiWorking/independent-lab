import { carrosselParaDocumento } from "../entregaveis/carrossel";
import { dataPt } from "../entregaveis/linguagem";
import type { Documento, MetaDocumento, PacoteCarrossel } from "../entregaveis/tipos";
import type { VersaoIA } from "./versoes";

/**
 * Junta o conteúdo de IA, já validado, com o material de regras. O material de
 * regras continua sendo a base: `meta` (autor, nível, circulação, de onde saíram
 * os dados) e `dados` (o fluxo de automação em JSON, por exemplo) vêm dele e a
 * IA nunca os altera. Da IA só entram textos e estrutura de seções.
 */

const NOMES_DE_MODELO: Record<string, string> = {
  "claude-haiku-5-5": "Claude Haiku 5.5",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
};

export function nomeDoModelo(id: string): string {
  return NOMES_DE_MODELO[id] ?? "modelo de IA";
}

function metaComIA(base: MetaDocumento, versao: VersaoIA): MetaDocumento {
  const modelo = nomeDoModelo(versao.modelo);
  return {
    ...base,
    versao: `${versao.n + 1}.0`,
    geradoEm: versao.geradoEm,
    autor: `${base.autor} (refinado por IA)`,
    baseadoEm: [...base.baseadoEm, `Refinado por IA (${modelo}) em ${dataPt(versao.geradoEm)}. Revise antes de usar: quem decide é você`],
    geradoPor: "ia",
    versaoIA: versao.n,
    modeloIA: modelo,
  };
}

export interface Efetivo {
  documento: Documento;
  pacote: PacoteCarrossel | null;
}

export function aplicarVersaoIA(baseline: Documento, pacoteBase: PacoteCarrossel | null, versao: VersaoIA): Efetivo {
  const c = versao.conteudo;
  if (c.tipo === "pacote" && pacoteBase) {
    const pacote: PacoteCarrossel = {
      ...pacoteBase,
      meta: metaComIA(pacoteBase.meta, versao),
      pautas: c.pautas,
      boasPraticas: c.boasPraticas,
      // o nível 1 não tem reaproveitamento: a IA não cria seção que o nível não inclui
      reaproveitamento: pacoteBase.reaproveitamento.length > 0 ? c.reaproveitamento : [],
      metricas: c.metricas,
    };
    return { documento: carrosselParaDocumento(pacote), pacote };
  }
  if (c.tipo === "documento") {
    return {
      documento: { ...baseline, titulo: c.titulo, subtitulo: c.subtitulo, secoes: c.secoes, meta: metaComIA(baseline.meta, versao) },
      pacote: null,
    };
  }
  return { documento: baseline, pacote: pacoteBase };
}
