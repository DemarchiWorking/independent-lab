import { DEGRAUS } from "@/features/onboarding/scoring";
import type { EventoKey } from "./engine";
import type { Negocio, Onboarding } from "@/lib/db/types";

/**
 * Missões = o "próximo passo certo" do cliente na escada de valor.
 * Boa prática de gamificação: mostrar UMA meta clara e atingível por vez, com
 * recompensa e propósito de negócio — nunca sobrecarregar.
 */

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  /** evento que a completa (concede XP/moeda e pode subir degrau) */
  evento: EventoKey;
  /** rótulo do CTA */
  acao: string;
  /** degrau que ela ajuda a alcançar (para exibir contexto) */
  degrauAlvo: number;
}

/**
 * Deriva a missão atual. Se o negócio ainda não chegou ao degrau-alvo do
 * onboarding, a missão é subir um degrau. Se já chegou, a missão passa a ser
 * de retenção/expansão (retro de 90 dias).
 */
export function missaoAtual(negocio: Negocio, onboarding: Onboarding | null): Missao {
  const alvo = onboarding?.degrauAlvo ?? negocio.degrauAlvo;

  if (negocio.degrauAtual < alvo) {
    const proximo = negocio.degrauAtual + 1;
    const degrau = DEGRAUS[proximo];
    return {
      id: `subir-${proximo}`,
      titulo: `Alcançar: ${degrau.nome}`,
      descricao: `Feche um serviço para subir para o degrau ${proximo} (${degrau.preco}) e destravar novas zonas.`,
      evento: "servico_contratado",
      acao: "Ver serviços",
      degrauAlvo: proximo,
    };
  }

  // primeira conversão quando ainda está no degrau 1
  if (negocio.degrauAtual === 1) {
    return {
      id: "diagnostico",
      titulo: "Agende seu diagnóstico técnico",
      descricao: "O primeiro passo real: entender onde a tecnologia está travando o seu crescimento.",
      evento: "diagnostico_agendado",
      acao: "Agendar diagnóstico",
      degrauAlvo: 2,
    };
  }

  return {
    id: "retro-90d",
    titulo: "Feche seu ciclo de 90 dias",
    descricao: "Você chegou ao seu alvo. Rode a retrospectiva e planeje o próximo salto.",
    evento: "retro_90d",
    acao: "Registrar retro",
    degrauAlvo: negocio.degrauAtual,
  };
}
