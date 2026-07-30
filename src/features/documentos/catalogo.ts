import { CATALOGO_HISTORIA } from "@/features/historia/catalogo";
import type { DocumentoCatalogo, DocumentoId } from "./tipos";

export const DOCUMENTOS_CATALOGO: readonly DocumentoCatalogo[] = [
  {
    id: "diagnostico-maturidade",
    titulo: "Diagnóstico de Maturidade Digital",
    descricaoCurta:
      "Onde seu negócio está nos 5 eixos, na escada de valor, e os 3 próximos movimentos.",
    icon: "chart",
  },
  {
    id: "acordo-parceria-simples",
    titulo: "Acordo de Parceria Simples",
    descricaoCurta: "O combinado por escrito com um parceiro do quarteirão.",
    icon: "file",
  },
  {
    id: "kit-primeira-resposta",
    titulo: "Kit de Primeira Resposta",
    descricaoCurta: "Respostas prontas para não perder lead por demora.",
    icon: "bolt",
  },
  {
    id: "rotina-revisao-ia",
    titulo: "Rotina de Revisão com IA",
    descricaoCurta: "Como revisar o trabalho de um Funcionário de IA antes de publicar.",
    icon: "check",
  },
  {
    id: "retro-90-dias",
    titulo: "Retrospectiva de 90 Dias",
    descricaoCurta: "O roteiro para revisar o trimestre e ajustar o rumo.",
    icon: "calendar",
  },
  {
    id: "playbook-autoridade-local",
    titulo: "Playbook de Autoridade Local",
    descricaoCurta: "Como virar referência no seu quarteirão, não só mais um nome.",
    icon: "star",
  },
] as const;

export function documentoDoCatalogo(id: DocumentoId): DocumentoCatalogo {
  const doc = DOCUMENTOS_CATALOGO.find((d) => d.id === id);
  if (!doc) throw new Error(`Documento desconhecido no catálogo: ${id}`);
  return doc;
}

/** Os 5 documentos narrativos — todo `DocumentoId` exceto o Diagnóstico. */
export const DOCUMENTOS_NARRATIVOS: readonly DocumentoCatalogo[] = DOCUMENTOS_CATALOGO.filter(
  (d) => d.id !== "diagnostico-maturidade",
);

/**
 * A escolha (dentro de qual capítulo) que libera cada documento narrativo —
 * derivado do próprio catálogo de história, nunca duplicado à mão. Se um dia
 * `EfeitoEscolha.documento` apontar pra um id que não existe aqui, o app
 * ainda funciona (o documento simplesmente nunca aparece como disponível);
 * o inverso — um `DocumentoId` narrativo sem escolha dona — é bug de catálogo
 * e o teste de `catalogo.test.ts` trava isso.
 */
export interface OrigemNarrativa {
  capituloId: string;
  escolhaId: string;
}

const ORIGEM_POR_DOCUMENTO: Partial<Record<DocumentoId, OrigemNarrativa>> = (() => {
  const mapa: Partial<Record<DocumentoId, OrigemNarrativa>> = {};
  for (const capitulo of CATALOGO_HISTORIA) {
    for (const escolha of capitulo.escolhas) {
      const docId = escolha.efeito.documento as DocumentoId | undefined;
      if (docId) mapa[docId] = { capituloId: capitulo.id, escolhaId: escolha.id };
    }
  }
  return mapa;
})();

/** `undefined` para o Diagnóstico (não é narrativo) ou um id sem dono no catálogo. */
export function origemDoDocumento(id: DocumentoId): OrigemNarrativa | undefined {
  return ORIGEM_POR_DOCUMENTO[id];
}
