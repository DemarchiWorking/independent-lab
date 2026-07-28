import type { IconName } from "@/components/ui/Icon";
import type { AtributoChave } from "@tokens";

/** XP/moeda de contratação já existem em `engine.ts` (evento
 *  `funcionario_ia_contratado`); o ganho de atributo é fixo por contratação,
 *  igual para os 4 cargos — só o EIXO muda (ver `eixoFortalecido` abaixo). */
export const GANHO_ATRIBUTO_CONTRATACAO = 3;

/**
 * Catálogo dos 4 Funcionários de IA — o produto central do gamehub.
 * Espelha docs/PRODUTO-IA-FUNCIONARIOS.md §4/§5 e os playbooks operacionais em
 * melhoria-continua/servicos-ti/*-ia.md. Preços são rascunho — validar com
 * labdatadev-context/04-portfolio/pricing_methodology.md antes de cobrar de
 * um cliente real.
 */

export interface CargoIA {
  id: string;
  nome: string;
  icon: IconName;
  entrega: string;
  frequencia: string;
  precoMensal: number;
  /** degrau da escada de valor a partir do qual o cargo fica disponível */
  degrauMinimo: number;
  /** eixo da economia de atributos que este cargo eleva ao ser contratado —
   *  ver docs/analise-prints/telas/economia-de-atributos.md §5 */
  eixoFortalecido: AtributoChave;
  descricao: string;
  playbook: string;
}

export const CARGOS_IA: CargoIA[] = [
  {
    id: "documentador",
    nome: "Documentador(a) IA",
    icon: "file",
    entrega: "Documentação técnica, processos, SOPs",
    frequencia: "sob demanda + revisão mensal",
    precoMensal: 297,
    degrauMinimo: 2,
    eixoFortalecido: "processo",
    descricao:
      "Documenta processos e conhecimento do seu negócio antes que se percam quando alguém sai.",
    playbook: "melhoria-continua/servicos-ti/documentador-ia.md",
  },
  {
    id: "social-media",
    nome: "Social Media IA",
    icon: "grid",
    entrega: "Carrosséis para Instagram/LinkedIn",
    frequencia: "pacote mensal de carrosséis",
    precoMensal: 397,
    degrauMinimo: 2,
    eixoFortalecido: "presenca",
    descricao:
      "Roteiro, copy e arte dos seus carrosséis — presença digital sem você precisar parar tudo pra postar.",
    playbook: "melhoria-continua/servicos-ti/social-media-ia.md",
  },
  {
    id: "editor-video",
    nome: "Editor(a) de Vídeo IA",
    icon: "video",
    entrega: "Reels e vídeos para mídia paga",
    frequencia: "pacote mensal de vídeos",
    precoMensal: 597,
    degrauMinimo: 3,
    eixoFortalecido: "presenca",
    descricao:
      "Roteiro, cortes, legendas e CTA prontos pra publicar — o formato que mais converte, sem contratar editor.",
    playbook: "melhoria-continua/servicos-ti/editor-video-ia.md",
  },
  {
    id: "comercial",
    nome: "Comercial/Automação IA",
    icon: "network",
    entrega: "Qualificação de leads e follow-up (SDR virtual)",
    frequencia: "contínuo (always-on)",
    precoMensal: 897,
    degrauMinimo: 3,
    eixoFortalecido: "aquisicao",
    descricao:
      "Qualifica e faz follow-up dos seus leads no WhatsApp automaticamente — resolve o gargalo #1: perder lead por demora.",
    playbook: "melhoria-continua/servicos-ti/comercial-automacao-ia.md",
  },
];

export function cargoPorId(id: string): CargoIA | undefined {
  return CARGOS_IA.find((c) => c.id === id);
}
