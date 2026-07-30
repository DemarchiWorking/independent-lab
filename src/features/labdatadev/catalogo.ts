import type { StatusSolicitacao, TipoServico } from "./tipos";

/**
 * Catálogo estático da feature — rótulos, ícones e textos de apoio. Vive em
 * `features/`, nunca em `lib/` (AGENTS.md). Alterar aqui muda o que o cliente
 * vê no computador do escritório e o que o admin gere no painel.
 */

export interface TipoServicoInfo {
  id: TipoServico;
  nome: string;
  icone: string;
  /** Chamada curta na "loja de serviços" do escritório. */
  resumo: string;
  /** Placeholder do campo de descrição, guiando um bom pedido. */
  exemplo: string;
}

export const CATALOGO_SERVICOS: Record<TipoServico, TipoServicoInfo> = {
  site: {
    id: "site",
    nome: "Site profissional",
    icone: "🌐",
    resumo: "Presença digital: institucional, landing page ou catálogo.",
    exemplo: "Ex.: site de 1 página para minha oficina, com WhatsApp e mapa.",
  },
  app: {
    id: "app",
    nome: "Aplicativo",
    icone: "📱",
    resumo: "App web ou mobile para o seu negócio ou seus clientes.",
    exemplo: "Ex.: app de agendamento para meus clientes marcarem horário.",
  },
  automacao: {
    id: "automacao",
    nome: "Automação",
    icone: "⚙️",
    resumo: "Robôs e integrações que tiram tarefa repetitiva das suas mãos.",
    exemplo: "Ex.: responder orçamento no WhatsApp e lançar na planilha sozinho.",
  },
  funcionalidade: {
    id: "funcionalidade",
    nome: "Nova funcionalidade",
    icone: "✨",
    resumo: "Uma melhoria numa plataforma que já entregamos para você.",
    exemplo: "Ex.: adicionar pagamento por Pix no app que vocês já fizeram.",
  },
};

/** Tokens de cor da marca (tailwind.config.ts) — nunca hex avulso (AGENTS.md). */
export type CorToken = "muted" | "teal" | "orange" | "green" | "coral";

export interface StatusInfo {
  id: StatusSolicitacao;
  nome: string;
  cor: CorToken;
  /** O que este status significa para o cliente, em uma linha. */
  significado: string;
}

export const CATALOGO_STATUS: Record<StatusSolicitacao, StatusInfo> = {
  recebida: {
    id: "recebida",
    nome: "Recebida",
    cor: "muted",
    significado: "Seu pedido chegou. Em breve entramos em contato.",
  },
  em_analise: {
    id: "em_analise",
    nome: "Em análise",
    cor: "teal",
    significado: "Estamos entendendo o escopo e preparando a proposta.",
  },
  em_producao: {
    id: "em_producao",
    nome: "Em produção",
    cor: "orange",
    significado: "Mãos à obra — sua solução está sendo construída.",
  },
  entregue: {
    id: "entregue",
    nome: "Entregue",
    cor: "green",
    significado: "Pronto! Precisa de uma melhoria? É só pedir uma nova funcionalidade.",
  },
  recusada: {
    id: "recusada",
    nome: "Fora de escopo",
    cor: "coral",
    significado: "Este pedido não seguiu agora — falamos os porquês no contato.",
  },
};
