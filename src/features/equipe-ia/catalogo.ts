import type { IconName } from "@/components/ui/Icon";
import type { AtributoChave } from "@tokens";
import type { NivelSenioridade } from "./senioridade";

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

/**
 * Uma entrega concreta do cargo, revelada por faixa de senioridade na ficha do
 * NPC no World (GH-WORLD-07). É vitrine do serviço real — cada habilidade tem
 * que corresponder a algo que o playbook do cargo de fato entrega, nunca a uma
 * capacidade inventada para encher a tela.
 *
 * Campo estático e ADITIVO em `CargoIA`, independente da decisão em aberto de
 * `GH-EQP-02` sobre `contribuicao` (ver docs/PROXIMA-TAREFA.md) — os dois não
 * se bloqueiam.
 */
export interface HabilidadeIA {
  nome: string;
  descricao: string;
  nivelMinimo: NivelSenioridade;
}

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
  /** uma por faixa de senioridade, na ordem júnior → especialista */
  habilidades: readonly HabilidadeIA[];
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
    habilidades: [
      {
        nome: "Registro de processo",
        descricao:
          "Transforma uma conversa sua em passo a passo escrito, pronto para outra pessoa executar sem te perguntar nada.",
        nivelMinimo: "junior",
      },
      {
        nome: "SOP com histórico",
        descricao:
          "Mantém o procedimento atualizado a cada mudança, registrando o que mudou e quando.",
        nivelMinimo: "pleno",
      },
      {
        nome: "Base de conhecimento",
        descricao:
          "Junta os processos num só lugar pesquisável — ninguém mais depende da memória de uma pessoa.",
        nivelMinimo: "senior",
      },
      {
        nome: "Material de entrada",
        descricao:
          "Monta o onboarding de quem chega a partir do que já está documentado, sem você repetir tudo de novo.",
        nivelMinimo: "especialista",
      },
    ],
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
    habilidades: [
      {
        nome: "Carrossel do zero",
        descricao:
          "Roteiro, copy e arte de um carrossel para Instagram/LinkedIn a partir de um tema seu.",
        nivelMinimo: "junior",
      },
      {
        nome: "Calendário do mês",
        descricao:
          "Distribui os temas do mês — sua presença para de depender de você lembrar de postar.",
        nivelMinimo: "pleno",
      },
      {
        nome: "Linha editorial",
        descricao:
          "Ajusta tom, formato e recorte a partir do que já rendeu mais alcance no seu perfil.",
        nivelMinimo: "senior",
      },
      {
        nome: "Fechamento do mês",
        descricao:
          "Diz qual formato funcionou, o que repetir e o que aposentar — em vez de postar no escuro.",
        nivelMinimo: "especialista",
      },
    ],
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
    habilidades: [
      {
        nome: "Corte e legenda",
        descricao:
          "Transforma uma gravação bruta em Reel legendado, pronto para publicar.",
        nivelMinimo: "junior",
      },
      {
        nome: "Roteiro com CTA",
        descricao:
          "Escreve o vídeo já com gancho na abertura e chamada para ação no fim — não só corte bonito.",
        nivelMinimo: "pleno",
      },
      {
        nome: "Variações para mídia paga",
        descricao:
          "Entrega o mesmo vídeo em várias versões para testar criativo sem regravar nada.",
        nivelMinimo: "senior",
      },
      {
        nome: "Biblioteca de trechos",
        descricao:
          "Reaproveita o que você já gravou em vídeos novos — cada gravação rende mais de uma peça.",
        nivelMinimo: "especialista",
      },
    ],
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
    habilidades: [
      {
        nome: "Resposta imediata",
        descricao:
          "Responde o lead no WhatsApp na hora, em vez de deixá-lo esperando você terminar o que está fazendo.",
        nivelMinimo: "junior",
      },
      {
        nome: "Qualificação",
        descricao:
          "Faz as perguntas certas e separa quem está pronto para comprar de quem só está olhando.",
        nivelMinimo: "pleno",
      },
      {
        nome: "Follow-up always-on",
        descricao:
          "Retoma sozinho quem sumiu, na cadência combinada — sem você precisar lembrar de cada um.",
        nivelMinimo: "senior",
      },
      {
        nome: "Passagem de bastão",
        descricao:
          "Entrega o lead quente com o resumo da conversa, para você entrar só na hora de fechar.",
        nivelMinimo: "especialista",
      },
    ],
  },
];

export function cargoPorId(id: string): CargoIA | undefined {
  return CARGOS_IA.find((c) => c.id === id);
}
