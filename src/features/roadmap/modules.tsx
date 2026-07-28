"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import type { IconName } from "@/components/ui/Icon";

/** Registro dos contextos mapeados dos prints (Startup Panic) ainda em stub.
 *  Cada entrada é a "tela" de um contexto — dados prontos p/ virar implementação.
 *  Ver docs/design/MAPA-DE-TELAS.md. */
export type ModuleKey =
  | "eventos"
  | "contratar"
  | "concorrentes"
  | "emprestimo"
  | "motivacao";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: IconName;
  intro: string;
  referencia: string[];
  melhorias: string[];
}

export const modules: Record<ModuleKey, ModuleDef> = {
  eventos: {
    key: "eventos",
    label: "Eventos",
    icon: "star",
    intro: "Acontecimentos de negócio com escolha e consequência.",
    referencia: [
      "Título: “Avaliação de blog” / “A avaliação ruim de João”",
      "“Um blogueiro escreveu uma avaliação tão ruim… Você vai responder?”",
      "Botões: “Não fazer nada” / “Responder”",
      "Variante: “Pagar alguém para escrever um artigo ($1000)” / “Nada”",
    ],
    melhorias: [
      "Motor de eventos data-driven (JSON)",
      "Efeitos em reputação/moeda ao decidir",
      "Eventos disparados por dados reais (CRM/analytics)",
      "Histórico de decisões do player",
    ],
  },
  contratar: {
    key: "contratar",
    label: "Contratar",
    icon: "users",
    intro: "Montar o squad de entrega (devs, designers, parceiros).",
    referencia: [
      "Título: “Contratar”",
      "“Caçador de talentos — Número de candidatos: 15” (card CRT: TARGET LOCKED / PROFILE / HIRE / IGNORE)",
      "“Recomendação de amigos — Número de candidatos: 6” — botão “Grátis”",
      "“Pedir a recomendação de um amigo é a maneira mais barata…”",
    ],
    melhorias: [
      "Atributos por skill (front/back/infra/design)",
      "Custo/tempo de contratação por fonte",
      "Alocação de funcionário em jobs do marketplace",
      "Disponibilidade e carga de trabalho",
    ],
  },
  concorrentes: {
    key: "concorrentes",
    label: "Mercado",
    icon: "chart",
    intro: "Benchmark regional: você vs concorrentes, por atributo.",
    referencia: [
      "Título: “Participação de mercado” — “Lista de empresas”",
      "Demarchi Labs 3% vs Allberg Industries 96%",
      "“Demarchi Labs — Pontuação geral: 7.1” (4 barras 1.5/150)",
      "Tabela Recurso — T/U/A/Pontuação: Página inicial 5.9 · Registro 6.8 · Anúncios em texto 8",
    ],
    melhorias: [
      "Radar chart por atributo (Tec/Usa/Est)",
      "Dados reais de mercado regional",
      "Metas por atributo e alertas de avanço do rival",
      "Marca do player = “Demarchi Labs”",
    ],
  },
  emprestimo: {
    key: "emprestimo",
    label: "Finanças",
    icon: "coin",
    intro: "Gestão financeira (simulação educativa — sem operação real).",
    referencia: [
      "Título: “Empréstimo bancário”",
      "FdP — “Financeira do Povo. Um dos bancos mais ricos da cidade.”",
      "Empréstimo $20K · Juros mensais $200 · Pagamento $21K",
      "Botão: “Pagar empréstimo” · carrossel de bancos (‹ ›)",
    ],
    melhorias: [
      "Simulador de fluxo de caixa e runway",
      "Painel de recebíveis dos deals reais (somente leitura)",
      "Alertas de saldo",
      "Claude nunca executa transação financeira real",
    ],
  },
  motivacao: {
    key: "motivacao",
    label: "Motivação",
    icon: "star",
    intro: "Saúde do time/parceiros — motivação eleva a entrega.",
    referencia: [
      "Título: “Férias coletivas”",
      "Parapente (Motivação +10, 7 dias, $150) · Snorkel (Motivação +20, 7 dias, $500)",
      "Detalhe: Desconto $0 · Bônus de motivação 0",
      "“Selecionar funcionário (0/5)”: Molly 21 · Jaxon 36 · Jackson 37 · botão “Me recomende”",
    ],
    melhorias: [
      "Efeito da motivação na velocidade/qualidade dos jobs",
      "Cooldown e pacotes",
      "Impacto no NPS do parceiro",
      "Ligação com a pasta melhoria-continua",
    ],
  },
};

/** Renderiza a tela (stub) de um módulo mapeado. */
export function ModuleScreen({ moduleKey }: { moduleKey: ModuleKey }) {
  const m = modules[moduleKey];
  return (
    <ComingSoon
      icon={m.icon}
      title={m.label}
      intro={m.intro}
      referencia={m.referencia}
      melhorias={m.melhorias}
    />
  );
}
