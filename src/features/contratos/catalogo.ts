import { EVENTOS } from "@/features/gamificacao/engine";
import type { Contrato } from "./tipos";

/**
 * Catálogo de contratos.
 *
 * Regras para escrever um contrato novo:
 *
 * 1. **Ligado a vender.** Se o dono do negócio não consegue explicar em uma
 *    frase como aquilo o aproxima de uma venda, não entra.
 * 2. **Recompensa fixa.** Nos contratos `real`, o que vale é fazer — nunca o
 *    número informado. Pagar mais por "vendi 50" só ensinaria a digitar 50.
 * 3. **Teto semanal conhecido.** Somar os `semanal` dá o que um jogador
 *    consegue ganhar por semana (ver `RENDA_SEMANAL_MAXIMA` e o teste que a
 *    trava). A economia (custo de contratar, evoluir, mobiliar) é calibrada
 *    contra esse número — mexer aqui é mexer no ritmo do jogo inteiro.
 *
 * Os dois contratos que vêm do motor de eventos (`diagnostico`, `retro-90d`)
 * leem o valor de `EVENTOS`: uma fonte só para a recompensa.
 */
export const CATALOGO_CONTRATOS: readonly Contrato[] = [
  // ------------------------------------------------------------- semanais
  {
    id: "vendas-semana",
    titulo: "Fechamento da semana",
    descricao:
      "Conte quantas vendas você fechou nos últimos 7 dias. Não existe número " +
      "certo: o jogo usa isso para te mostrar, semana a semana, se você está " +
      "vendendo mais.",
    cadencia: "semanal",
    entrega: "real",
    verificacao: { tipo: "declaradoComValor", rotuloValor: "Vendas fechadas", maximo: 9999 },
    recompensa: { xp: 40, moeda: 120, atributos: { aquisicao: 1 } },
    rotuloAcao: "Registrar vendas",
  },
  {
    id: "oferta-semana",
    titulo: "Vitrine fresca",
    descricao:
      "Publique uma oferta nova na sua vitrine. Cliente que chega pela sua " +
      "página precisa ver algo para comprar hoje, não só o que você já vendia.",
    cadencia: "semanal",
    entrega: "gamificada",
    verificacao: { tipo: "oferta" },
    recompensa: { xp: 40, moeda: 100, atributos: { presenca: 1 } },
    destino: { tipo: "rota", href: "/painel" },
    rotuloAcao: "Receber recompensa",
  },
  {
    id: "clientes-semana",
    titulo: "Reativar clientes antigos",
    descricao:
      "Chame pelo WhatsApp quem já comprou de você e sumiu. É a venda mais " +
      "barata que existe: o cliente já te conhece. Informe quantos você chamou.",
    cadencia: "semanal",
    entrega: "real",
    verificacao: { tipo: "declaradoComValor", rotuloValor: "Contatos feitos", maximo: 999 },
    recompensa: { xp: 30, moeda: 80, atributos: { aquisicao: 1 } },
    rotuloAcao: "Registrar contatos",
  },
  {
    id: "entregavel-semana",
    titulo: "Colocar a IA para vender",
    descricao:
      "Use o material que seu Funcionário de IA gerou: publique o post, rode " +
      "o roteiro de Reels ou aplique o script comercial. Material guardado " +
      "não vende.",
    cadencia: "semanal",
    entrega: "real",
    verificacao: { tipo: "declarado" },
    requisito: {
      tipo: "equipe",
      minimo: 1,
      dica: "Contrate um Funcionário de IA para ter material para usar.",
    },
    recompensa: { xp: 50, moeda: 140, atributos: { presenca: 1 } },
    destino: { tipo: "view", view: "equipe-ia" },
    rotuloAcao: "Já usei",
  },

  // --------------------------------------------------------- jornada / ciclo
  {
    id: "diagnostico",
    titulo: "Diagnóstico técnico",
    descricao:
      "Agende o diagnóstico: é o primeiro passo real para descobrir onde a " +
      "tecnologia está travando suas vendas.",
    cadencia: "unico",
    entrega: "real",
    verificacao: { tipo: "declarado" },
    recompensa: {
      xp: EVENTOS.diagnostico_agendado.xp,
      moeda: EVENTOS.diagnostico_agendado.moeda,
      atributos: { processo: 1 },
    },
    rotuloAcao: "Agendar diagnóstico",
  },
  {
    id: "retro-90d",
    titulo: "Retrospectiva de 90 dias",
    descricao:
      "Feche o ciclo: o que vendeu mais, o que não funcionou e qual é o " +
      "próximo salto. Quem revisa a cada trimestre não repete o mesmo erro.",
    cadencia: "ciclo90",
    entrega: "real",
    verificacao: { tipo: "declarado" },
    requisito: {
      tipo: "alvoAlcancado",
      dica: "Chegue ao degrau-alvo do seu cadastro para fechar o ciclo.",
    },
    recompensa: {
      xp: EVENTOS.retro_90d.xp,
      moeda: EVENTOS.retro_90d.moeda,
      atributos: { capacidade: 2 },
    },
    rotuloAcao: "Registrar retro",
  },
];

export function contratoPorId(id: string): Contrato | undefined {
  return CATALOGO_CONTRATOS.find((c) => c.id === id);
}

/** O que um jogador consegue ganhar por semana cumprindo todos os semanais. */
export const RENDA_SEMANAL_MAXIMA = CATALOGO_CONTRATOS.filter(
  (c) => c.cadencia === "semanal",
).reduce((soma, c) => soma + c.recompensa.moeda, 0);
