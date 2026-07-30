import type { IconName } from "@/components/ui/Icon";
import type { DocumentoEmitido as DocumentoEmitidoDb } from "@/lib/db/types";

/**
 * O acervo de documentos do jogador (GH-OPS Bloco 4).
 *
 * `CapituloCard.tsx` promete "Documento liberado no seu acervo" desde que a
 * história existe — e até este bloco, isso era mentira: nenhum documento
 * era gerado, persistido ou sequer nomeado além de uma string solta em
 * `EfeitoEscolha.documento`. Este módulo fecha essa promessa.
 *
 * Dois tipos de documento, duas fontes de verdade:
 * - `diagnostico-maturidade`: o CARRO-CHEFE. Não é recompensa de história —
 *   é gerado a qualquer momento a partir do dado VIVO do negócio (atributos,
 *   degrau, onboarding). É o que sai impresso/editável para uma empresa real.
 * - os outros 5: recompensa de uma escolha específica de
 *   `features/historia/catalogo.ts` (`EfeitoEscolha.documento`). Só existem
 *   depois que o capítulo dono foi RESOLVIDO com aquela escolha — a fonte de
 *   verdade de "o jogador tem direito a este documento" é
 *   `CapituloEntregue.escolhaId`, nunca uma tabela nova (mesmo princípio de
 *   "sem tabela `avatares`" em GH-WORLD-05: não duplicar estado que já existe).
 */
export type DocumentoId =
  | "diagnostico-maturidade"
  | "acordo-parceria-simples"
  | "kit-primeira-resposta"
  | "rotina-revisao-ia"
  | "retro-90-dias"
  | "playbook-autoridade-local";

export const DOCUMENTO_DIAGNOSTICO: DocumentoId = "diagnostico-maturidade";

/** Metadado estático de um documento — não é o conteúdo, só a vitrine dele. */
export interface DocumentoCatalogo {
  id: DocumentoId;
  titulo: string;
  descricaoCurta: string;
  icon: IconName;
}

/**
 * Registro de que o Diagnóstico foi gerado — narrowing de
 * `DocumentoEmitido` (`lib/db/types.ts`, `docId: string` solto lá porque
 * `lib/` não importa `features/`) para o `DocumentoId` fechado desta feature.
 *
 * Só existe para `diagnostico-maturidade` — os 5 narrativos não precisam de
 * uma linha própria porque `capitulos_entregues` já é a prova de que existem.
 * Guarda META-dado (quando, qual versão da metodologia), NUNCA o conteúdo:
 * o documento é sempre regenerado do dado vivo, o que também é a razão de
 * ele nunca desatualizar e de não precisar de Storage nenhum.
 */
export interface DocumentoEmitido extends Omit<DocumentoEmitidoDb, "docId"> {
  docId: DocumentoId;
}
