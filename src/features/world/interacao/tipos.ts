import type { IconName } from "@/components/ui/Icon";
import type { CargoIA } from "@/features/equipe-ia/catalogo";
import type { Senioridade } from "@/features/equipe-ia/senioridade";
import type { PitchIA } from "@/features/vendas/pitchVisita";
import type { Disponibilidade, Negocio } from "@/lib/db/types";

/**
 * Vocabulário da conversa com um NPC/jogador no World (GH-WORLD-07).
 *
 * Os nomes (`rotulo`, `tom`, `desfecho`) são os MESMOS de
 * `features/historia/tipos.ts` de propósito — o repo já tem um sistema de
 * escolhas com desfecho, e falar duas línguas para a mesma ideia seria dívida
 * gratuita. A diferença é o que vem depois: capítulo de história muta estado
 * via Server Action; conversa com NPC **nunca muta nada**.
 */

/**
 * O que acontece ao escolher uma opção.
 *
 * Note o que NÃO existe aqui: nenhum efeito que dê XP, moeda ou atributo.
 * Conversar é leitura e navegação — decisão de produto registrada no card
 * `GH-WORLD-07`. Sem isso seria farm de XP clicando no mesmo boneco, e exigiria
 * cooldown persistido + guarda anti-farm no padrão `GH-FDN-01`.
 */
export type EfeitoInteracao =
  /** só mostra o `desfecho` e oferece "Voltar" */
  | { tipo: "fala" }
  /** mostra o `desfecho` e um CTA que leva a uma tela real do jogo */
  | { tipo: "ir-para"; href: string; cta: string }
  /** fecha o painel e destaca o painel de proposta comercial (só na visita) */
  | { tipo: "focar-pitch" }
  /** encerra a conversa e fecha o painel */
  | { tipo: "encerrar" };

/** Cor/ícone da opção — mesmo par de `TomEscolha` em `features/historia`. */
export type TomInteracao = "beneficio" | "neutro";

export interface OpcaoInteracao {
  id: string;
  /** texto do botão — o que o JOGADOR diz */
  rotulo: string;
  icon: IconName;
  tom: TomInteracao;
  /** o que o NPC responde — já resolvido com dado real do jogo */
  desfecho: string;
  efeito: EfeitoInteracao;
}

/**
 * Com quem se está falando. O `tipo` decide o conjunto de 4 opções, e o resto
 * do payload é o dado real que os desfechos citam — nada é inventado na hora de
 * renderizar.
 */
export type Interlocutor =
  /** Funcionário de IA contratado por MIM, na minha sede */
  | {
      tipo: "ia-propria";
      avatarId: string;
      cargo: CargoIA;
      senioridade: Senioridade;
      disponibilidade: Disponibilidade;
    }
  /** Funcionário de IA de outro negócio, visto durante uma visita */
  | {
      tipo: "ia-visitada";
      avatarId: string;
      cargo: CargoIA;
      nomeAnfitriao: string;
    }
  /** O dono do negócio visitado — o único "outro jogador" que existe hoje */
  | {
      tipo: "jogador-visitado";
      avatarId: string;
      negocio: Negocio;
      nivelSedeNome: string;
      pitch: PitchIA;
    };

/**
 * Convenção de id dos avatares da cena — fonte ÚNICA.
 *
 * `WorldScreen` e `VisitaScreen` montam esses ids e o `PainelInteracao` os
 * desmonta de volta; com a string `"ia:"` solta em três arquivos, mudar a
 * convenção quebraria a conversa em silêncio (o avatar deixaria de resolver e
 * o painel simplesmente não abriria, sem erro nenhum).
 *
 * O dono e o visitante têm ids fixos porque são únicos por cena.
 */
export const AVATAR_DONO = "dono";
export const AVATAR_VISITANTE = "visitante";
const PREFIXO_IA = "ia:";

/** Id de cena de um Funcionário de IA, a partir da chave dele. */
export function avatarIdDeIa(chave: string): string {
  return `${PREFIXO_IA}${chave}`;
}

/** Chave de volta a partir do id de cena, ou `null` se não é um avatar de IA. */
export function iaDeAvatarId(avatarId: string): string | null {
  return avatarId.startsWith(PREFIXO_IA)
    ? avatarId.slice(PREFIXO_IA.length) || null
    : null;
}

/** Nome exibido na ribbon do painel. */
export function nomeDoInterlocutor(i: Interlocutor): string {
  switch (i.tipo) {
    case "ia-propria":
    case "ia-visitada":
      return i.cargo.nome;
    case "jogador-visitado":
      return i.negocio.nome;
  }
}
