import type { Negocio } from "@/lib/db/types";

/**
 * Catálogo de pitch de vendas mostrado durante a visita à sede de um
 * vizinho — espelho em código de `docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md`
 * (mesmo padrão de `features/equipe-ia/catalogo.ts`: o doc é a narrativa, o
 * catálogo TS é o que renderiza; ao editar copy, mantenha os dois em
 * sincronia manualmente). `cargoId` referencia `CargoIA.id`
 * (`features/equipe-ia/catalogo.ts`).
 */
export interface PitchIA {
  cargoId: string;
  headline: string;
  corpo: string;
  ctaLabel: string;
}

const PITCHES: Record<string, PitchIA> = {
  documentador: {
    cargoId: "documentador",
    headline: "Quem aqui sabe fazer isso, se essa pessoa sair amanhã?",
    corpo:
      "Todo negócio que cresce rápido perde conhecimento junto com quem sai — processo que só uma pessoa sabia, decisão que nunca virou documento. O Documentador IA registra os processos do seu negócio enquanto você trabalha, não depois que já perdeu alguém. Sob demanda + revisão mensal, sem ninguém parar o que está fazendo para escrever manual.",
    ctaLabel: "Ver o Documentador IA",
  },
  "social-media": {
    cargoId: "social-media",
    headline: "Presença digital não devia depender de você lembrar de postar.",
    corpo:
      "Roteiro, copy e arte dos seus carrosséis prontos todo mês — você aprova, não produz. É a dor #1 do seu tipo de negócio: presença online fraca não é falta de vontade, é falta de tempo. O Social Media IA resolve isso com um pacote mensal de carrosséis para Instagram/LinkedIn, sem precisar contratar agência.",
    ctaLabel: "Ver o Social Media IA",
  },
  "editor-video": {
    cargoId: "editor-video",
    headline: "Vídeo converte mais — e é o que mais dá trabalho terceirizar.",
    corpo:
      "Reels e vídeos para mídia paga, com roteiro, cortes, legendas e CTA prontos pra publicar. É historicamente o item mais caro de terceirizar — e o de maior retorno quando funciona. O Editor de Vídeo IA entrega um pacote mensal sem a curva de contratar e treinar um editor de verdade.",
    ctaLabel: "Ver o Editor de Vídeo IA",
  },
  comercial: {
    cargoId: "comercial",
    headline: "Quantos leads você perdeu essa semana só por demorar a responder?",
    corpo:
      "O gargalo #1 de quem vende no WhatsApp não é falta de lead, é demora no follow-up. O Comercial/Automação IA qualifica e faz follow-up dos seus leads automaticamente, always-on — funciona enquanto você atende quem já está na loja. É o SDR virtual que nunca esquece de responder.",
    ctaLabel: "Ver o Comercial/Automação IA",
  },
};

/**
 * Escolhe qual Funcionário de IA pitchar, a partir do eixo mais fraco do
 * negócio VISITADO (não do visitante — é o contexto que ele está vendo, a
 * prova social do pitch). `tecnologia`/`capacidade` não têm `CargoIA` com
 * `eixoFortalecido` correspondente hoje — cai para `comercial` (fallback
 * documentado, não escolha arbitrária; ver
 * docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md §4). `editor-video` cobre o
 * mesmo eixo de `social-media` (`presenca`) mas tem `degrauMinimo` maior —
 * por isso não é escolhido automaticamente aqui, mesmo tendo pitch pronto.
 */
export function escolherPitch(negocio: Negocio): PitchIA {
  const a = negocio.atributos;

  // eixo mais fraco entre TODOS os 5 — decide primeiro se cai no fallback
  const todos: ReadonlyArray<{ chave: string; valor: number }> = [
    { chave: "tecnologia", valor: a.tecnologia.valor },
    { chave: "processo", valor: a.processo.valor },
    { chave: "presenca", valor: a.presenca.valor },
    { chave: "aquisicao", valor: a.aquisicao.valor },
    { chave: "capacidade", valor: a.capacidade.valor },
  ];
  const eixoMaisFraco = todos.reduce((min, c) => (c.valor < min.valor ? c : min));

  const cargoPorEixo: Record<string, string> = {
    processo: "documentador",
    presenca: "social-media",
    aquisicao: "comercial",
  };

  const cargoId = cargoPorEixo[eixoMaisFraco.chave] ?? "comercial";
  return PITCHES[cargoId] ?? PITCHES.comercial;
}
