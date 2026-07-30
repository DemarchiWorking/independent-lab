import { ATRIBUTO_LABEL } from "@/lib/atributos";
import { SEGMENTOS } from "@/features/mapa/segmentos";
import { habilidadesLiberadas } from "@/features/equipe-ia/senioridade";
import type { CargoIA } from "@/features/equipe-ia/catalogo";
import type { Disponibilidade } from "@/lib/db/types";
import type { Interlocutor, OpcaoInteracao } from "./tipos";

/**
 * O que dá para conversar com cada NPC/jogador na sala (GH-WORLD-07).
 *
 * Duas regras que valem para TODA opção escrita aqui:
 *
 * 1. **Toda resposta cita dado real.** Nada de "sim, estou trabalhando duro!".
 *    O que o cargo entrega vem do catálogo, se ele está livre vem de
 *    `disponibilidade` (GH-EQP-01), as habilidades vêm da senioridade derivada.
 *    Se um desfecho não tem de onde tirar o dado, ele não entra.
 * 2. **Nada muta estado.** Nenhuma Server Action, nenhum XP, nenhuma moeda —
 *    ver `EfeitoInteracao` em `tipos.ts`. Conversa informa e leva a uma tela;
 *    quem cobra e quem recompensa continua sendo a tela de destino.
 *
 * A copy por cargo mora num `Record<cargoId, …>`, mesmo idioma de `PITCHES` em
 * `features/vendas/pitchVisita.ts`. Ao editar copy de produto, mantenha em
 * sincronia com `docs/PRODUTO-IA-FUNCIONARIOS.md`.
 */

/** Sempre 4 opções por interlocutor — travado por teste. */
export const OPCOES_POR_CONVERSA = 4;

/** Falas específicas de cada cargo — o que muda de agente para agente. */
interface FalasCargo {
  /** como o NPC abre a conversa na minha sede */
  abertura: string;
  /** o pedido de trabalho, na língua do cargo */
  rotuloTarefa: string;
  desfechoTarefa: string;
  /** o que o NPC diz quando um visitante pergunta o preço */
  ganchoVisita: string;
}

const FALAS: Record<string, FalasCargo> = {
  documentador: {
    abertura:
      "Anotei o que a gente combinou da última vez. Quer que eu registre mais alguma coisa?",
    rotuloTarefa: "Tenho um processo pra registrar",
    desfechoTarefa:
      "Me manda pelo marketplace: escolha o serviço, me aloque nele e eu devolvo o passo a passo escrito.",
    ganchoVisita:
      "Aqui ninguém mais perde processo quando alguém sai. Está tudo escrito.",
  },
  "social-media": {
    abertura: "Os próximos posts já estão em rascunho. Quer ver o que vem aí?",
    rotuloTarefa: "Preciso de conteúdo essa semana",
    desfechoTarefa:
      "Abre o marketplace e me aloca no serviço: eu volto com roteiro, copy e arte prontos pra você aprovar.",
    ganchoVisita:
      "A presença digital daqui não depende de ninguém lembrar de postar. Isso é comigo.",
  },
  "editor-video": {
    abertura: "Tem gravação bruta parada aí? Eu transformo em Reel publicável.",
    rotuloTarefa: "Quero um vídeo pronto pra publicar",
    desfechoTarefa:
      "Me aloque num serviço do marketplace: você manda o material bruto, eu devolvo cortado, legendado e com CTA.",
    ganchoVisita:
      "Vídeo é o que mais converte e o que mais dá trabalho terceirizar. Aqui já está resolvido.",
  },
  comercial: {
    abertura:
      "Estou de olho no WhatsApp. Lead que chega aqui não fica esperando resposta.",
    rotuloTarefa: "Quero mais leads respondidos",
    desfechoTarefa:
      "Me aloque num serviço do marketplace e eu assumo a fila: respondo na hora, qualifico e te passo só quem está pronto.",
    ganchoVisita:
      "O gargalo de quem vende no WhatsApp é demora no follow-up. Aqui isso não acontece.",
  },
};

/** Fallback explícito para um cargo sem copy própria — nunca `undefined`. */
function falasDe(cargo: CargoIA): FalasCargo {
  return (
    FALAS[cargo.id] ?? {
      abertura: `Sou o ${cargo.nome} deste negócio. Como posso ajudar?`,
      rotuloTarefa: "Quero te passar uma tarefa",
      desfechoTarefa:
        "Abre o marketplace de serviços e me aloque num trabalho — é por lá que a tarefa chega até mim.",
      ganchoVisita: cargo.descricao,
    }
  );
}

/**
 * Prazo legível de uma alocação. Formato curto (dd/mm às HH:MM) no fuso de quem
 * lê — é um prazo operacional, faz sentido no relógio do jogador.
 */
function formatarPrazo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "o fim do prazo";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} às ${hh}:${mi}`;
}

/** O que o NPC responde quando perguntam se está livre — GH-EQP-01 de verdade. */
function respostaDisponibilidade(d: Disponibilidade): string {
  if (d.estado === "livre") {
    return "Estou livre agora. Pode me alocar num serviço do marketplace quando quiser.";
  }
  return `Estou ocupado no serviço "${d.jobId}" até ${formatarPrazo(d.expiraEm)}. Depois disso eu volto para a fila.`;
}

/** A fala de abertura, antes de o jogador escolher qualquer coisa. */
export function aberturaDe(i: Interlocutor): string {
  switch (i.tipo) {
    case "ia-propria":
      return falasDe(i.cargo).abertura;
    case "ia-visitada":
      return `Oi! Trabalho para ${i.nomeAnfitriao}. ${falasDe(i.cargo).ganchoVisita}`;
    case "jogador-visitado":
      return `Seja bem-vindo à sede da ${i.negocio.nome}. Fique à vontade para olhar.`;
  }
}

/** As 4 opções de um Funcionário de IA meu — a ficha completa dele. */
function opcoesIaPropria(
  i: Extract<Interlocutor, { tipo: "ia-propria" }>,
): OpcaoInteracao[] {
  const { cargo, senioridade, disponibilidade } = i;
  const falas = falasDe(cargo);
  const eixo = ATRIBUTO_LABEL[cargo.eixoFortalecido];

  const habilidades = habilidadesLiberadas(cargo, senioridade);
  const liberadas = habilidades.filter((h) => h.liberada);
  const proxima = habilidades.find((h) => !h.liberada);

  const resumoHabilidades =
    `Hoje eu faço ${liberadas.length} de ${habilidades.length} coisas: ` +
    liberadas.map((h) => h.nome.toLowerCase()).join(", ") +
    "." +
    (proxima && senioridade.diasParaProximo !== null
      ? ` Em ${senioridade.diasParaProximo} ${senioridade.diasParaProximo === 1 ? "dia" : "dias"} eu chego a ${senioridade.proximoTitulo} e destravo "${proxima.nome}".`
      : " Já destravei tudo o que sei fazer.");

  return [
    {
      id: "entrega",
      rotulo: "O que exatamente você entrega?",
      icon: "file",
      tom: "neutro",
      desfecho: `${cargo.entrega} — ${cargo.frequencia}. Cada entrega minha fortalece o eixo ${eixo} do seu negócio.`,
      efeito: { tipo: "fala" },
    },
    {
      id: "disponibilidade",
      rotulo: "Você está livre agora?",
      icon: "calendar",
      tom: "neutro",
      desfecho: respostaDisponibilidade(disponibilidade),
      efeito: { tipo: "fala" },
    },
    {
      id: "habilidades",
      rotulo: "Me mostra o que você já sabe fazer",
      icon: "star",
      tom: "neutro",
      desfecho: `Estou aqui há ${senioridade.diasDeCasa} ${senioridade.diasDeCasa === 1 ? "dia" : "dias"}, como ${senioridade.titulo}. ${resumoHabilidades}`,
      efeito: { tipo: "fala" },
    },
    {
      id: "tarefa",
      rotulo: falas.rotuloTarefa,
      icon: "briefcase",
      tom: "beneficio",
      desfecho: falas.desfechoTarefa,
      efeito: {
        tipo: "ir-para",
        href: "/hub?ver=marketplace",
        cta: "Ver serviços disponíveis",
      },
    },
  ];
}

/** As 4 opções de um Funcionário de IA do vizinho — tom de vitrine. */
function opcoesIaVisitada(
  i: Extract<Interlocutor, { tipo: "ia-visitada" }>,
): OpcaoInteracao[] {
  const { cargo, nomeAnfitriao } = i;

  return [
    {
      id: "preco",
      // 🔒 AGENTS.md regra 6: aqui é R$ real (assinatura do serviço), e este
      // painel nunca mostra moeda virtual 🪙 ao lado — as duas nunca se
      // encostam em lugar nenhum da UI.
      rotulo: "Quanto custa um como você?",
      icon: "coin",
      tom: "neutro",
      desfecho: `A assinatura é de R$ ${cargo.precoMensal.toLocaleString("pt-BR")} por mês, e inclui ${cargo.entrega.toLowerCase()} — ${cargo.frequencia}.`,
      efeito: { tipo: "fala" },
    },
    {
      id: "o-que-faz",
      rotulo: `O que você faz por ${nomeAnfitriao}?`,
      icon: "briefcase",
      tom: "neutro",
      desfecho: cargo.descricao,
      efeito: { tipo: "fala" },
    },
    {
      id: "contratar",
      rotulo: "Quero um desses na minha sede",
      icon: "users",
      tom: "beneficio",
      desfecho: `Então fala com a sua Equipe de IA. Sou liberado a partir do degrau ${cargo.degrauMinimo} da escada de valor.`,
      efeito: {
        tipo: "ir-para",
        href: "/hub?ver=equipe-ia",
        cta: `Ver o ${cargo.nome}`,
      },
    },
    {
      id: "tchau",
      rotulo: "Valeu, só dei uma olhada",
      icon: "close",
      tom: "neutro",
      desfecho: "Tranquilo. Volte quando quiser ver como a sede daqui evoluiu.",
      efeito: { tipo: "encerrar" },
    },
  ];
}

/** As 4 opções do dono vizinho — o único "outro jogador" que existe hoje. */
function opcoesJogadorVisitado(
  i: Extract<Interlocutor, { tipo: "jogador-visitado" }>,
): OpcaoInteracao[] {
  const { negocio, nivelSedeNome, pitch } = i;
  const segmento = SEGMENTOS[negocio.segmento].label;

  return [
    {
      id: "quem-e",
      rotulo: "Quem é você?",
      icon: "home",
      tom: "neutro",
      desfecho: `${negocio.nome}, do ramo de ${segmento}. Estou no degrau ${negocio.degrauAtual} da escada de valor e minha sede já é ${nivelSedeNome}.`,
      efeito: { tipo: "fala" },
    },
    {
      id: "operacao",
      rotulo: "Como está a operação por aqui?",
      icon: "chart",
      tom: "neutro",
      desfecho: `Andamos bem, mas tem um ponto que ainda incomoda: ${pitch.headline}`,
      efeito: { tipo: "fala" },
    },
    {
      id: "proposta",
      rotulo: "Tenho uma proposta pra você",
      icon: "bolt",
      tom: "beneficio",
      desfecho: "Sou todo ouvidos — me mostra o que você tem em mente.",
      efeito: { tipo: "focar-pitch" },
    },
    {
      id: "tchau",
      rotulo: "Só dei uma passada. Até!",
      icon: "close",
      tom: "neutro",
      desfecho: "Apareça sempre. A porta fica aberta.",
      efeito: { tipo: "encerrar" },
    },
  ];
}

/** As opções de conversa deste interlocutor. Sempre `OPCOES_POR_CONVERSA`. */
export function opcoesPara(i: Interlocutor): OpcaoInteracao[] {
  switch (i.tipo) {
    case "ia-propria":
      return opcoesIaPropria(i);
    case "ia-visitada":
      return opcoesIaVisitada(i);
    case "jogador-visitado":
      return opcoesJogadorVisitado(i);
  }
}
