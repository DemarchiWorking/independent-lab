import type { Segmento } from "@/lib/db/types";
import { semAcento } from "../linguagem";
import type { PerfilMercado } from "../tipos";
import { NICHOS } from "./nichos";
import { SEGMENTOS } from "./segmentos";

/**
 * Descobre o nicho do negócio pelas palavras do NOME e das OFERTAS que o dono
 * publicou (informação pública, digitada por ele). O nome pesa mais que as
 * ofertas. Sem nenhuma palavra reconhecida, o nicho é o próprio segmento.
 *
 * Por que inferir e não perguntar: o cadastro tem 8 segmentos e uma pergunta a
 * mais custaria uma migração de banco e um passo a mais no wizard. Com a
 * inferência, quem cadastrou "Studio Bela Cabelos" como prestador de serviço
 * já recebe material de salão. Quem discordar edita o texto no estúdio.
 */

const PESO_NOME = 3;
const PESO_OFERTA = 1;

function ocorrencias(texto: string, regex: RegExp): number {
  return texto.match(new RegExp(regex.source, "g"))?.length ?? 0;
}

export function inferirNicho(
  segmento: Segmento,
  nome: string,
  ofertas: ReadonlyArray<{ titulo: string; descricao: string }>,
): string {
  const doNome = semAcento(nome).toLowerCase();
  const dasOfertas = semAcento(ofertas.map((o) => `${o.titulo} ${o.descricao}`).join(" ")).toLowerCase();

  let melhor: { id: string; pontos: number } | null = null;
  for (const nicho of NICHOS) {
    if (!nicho.segmentos.includes(segmento)) continue;
    const pontos =
      ocorrencias(doNome, nicho.palavras) * PESO_NOME +
      ocorrencias(dasOfertas, nicho.palavras) * PESO_OFERTA;
    // empate fica com o que vem primeiro na lista (ordem = prioridade)
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) {
      melhor = { id: nicho.perfil.id, pontos };
    }
  }
  return melhor?.id ?? segmento;
}

/** Perfil de mercado por id de nicho ou de segmento. Id desconhecido cai em "outro". */
export function perfilDeMercado(id: string): PerfilMercado {
  const nicho = NICHOS.find((n) => n.perfil.id === id);
  if (nicho) return nicho.perfil;
  return (SEGMENTOS as Record<string, PerfilMercado>)[id] ?? SEGMENTOS.outro;
}

/** Todos os perfis, para testes e para a documentação. */
export function todosOsPerfis(): PerfilMercado[] {
  return [...Object.values(SEGMENTOS), ...NICHOS.map((n) => n.perfil)];
}
