import type { Respostas } from "@/lib/db/types";
import { ehCidadePrioritaria } from "@/lib/regiao";
import { atributosVazios, type Atributos } from "@/lib/atributos";

/**
 * Converte as 10 respostas em posição comercial e de jogo.
 * Regras documentadas em docs/design/ONBOARDING-10-PERGUNTAS.md
 */

export interface Resultado {
  scoreFit: number;
  /** Todo negócio NASCE no degrau 1 (Auditoria Gratuita) — nunca pular degraus. */
  degrauAtual: number;
  /** Para onde o jogo vai conduzi-lo. */
  degrauAlvo: number;
  /**
   * XP de boas-vindas proporcional ao fit. É o que define o nível inicial —
   * mantendo XP como fonte única de verdade (o nível é sempre derivado).
   */
  xpInicial: number;
  servicosRecomendados: string[];
  /** os 5 eixos de atributo, já calculados a partir das 10 respostas */
  atributosIniciais: Atributos;
}


const DEGRAU_POR_INVESTIMENTO: Record<Respostas["investimento"], number> = {
  "nao-sei": 2,
  "ate-500": 2,
  "500-1500": 2,
  "1500-3500": 3,
  "3500+": 4,
};

const PONTOS_INVESTIMENTO: Record<Respostas["investimento"], number> = {
  "nao-sei": 5,
  "ate-500": 10,
  "500-1500": 15,
  "1500-3500": 20,
  "3500+": 25,
};

const PONTOS_EQUIPE: Record<Respostas["equipe"], number> = {
  "so-eu": 5,
  "2-5": 12,
  "6-15": 20,
  "16-30": 20,
  "30+": 12,
};

/** Gargalos que indicam urgência real (BANT). */
const GARGALOS_URGENTES: Array<Respostas["gargalo"]> = [
  "perco-leads",
  "manual",
];

function servicosPara(r: Respostas): string[] {
  const s = new Set<string>();

  if (r.presencaDigital === "nada" || r.presencaDigital === "site-desatualizado")
    s.add("Site & Landing");
  if (r.presencaDigital === "social" || r.presencaDigital === "portais")
    s.add("Site & Landing");

  if (r.gargalo === "manual") {
    s.add("Automação");
    s.add("BI / Dados");
  }
  if (r.gargalo === "perco-leads") s.add("Integração CRM");
  if (r.gargalo === "sem-dados") s.add("BI / Dados");
  if (r.gargalo === "imagem-fraca") s.add("Site & Landing");
  if (r.gargalo === "sem-processo") s.add("Automação");

  if (r.objetivo === "aparecer") s.add("Tráfego pago");
  if (r.objetivo === "automatizar") s.add("Automação");
  if (r.objetivo === "mais-leads") s.add("Integração CRM");

  return [...s];
}

/**
 * Valor inicial de cada eixo, a partir das 10 respostas — ver
 * docs/analise-prints/telas/economia-de-atributos.md §5 pela justificativa
 * de cada mapeamento. Nenhum eixo nasce de zero absoluto: todo negócio real
 * já tem alguma base, mesmo que pequena.
 */
const PRESENCA_POR_RESPOSTA: Record<Respostas["presencaDigital"], number> = {
  nada: 2,
  social: 8,
  portais: 10,
  "site-desatualizado": 14,
  "site-portais": 22,
};

const CAPACIDADE_POR_EQUIPE: Record<Respostas["equipe"], number> = {
  "so-eu": 6,
  "2-5": 12,
  "6-15": 20,
  "16-30": 28,
  "30+": 34,
};

function atributosIniciais(r: Respostas): Atributos {
  const base = atributosVazios();
  const teto = base.tecnologia.teto;

  // Processo: gargalo "manual"/"sem-processo" = operação pouco organizada
  const processo = r.gargalo === "manual" || r.gargalo === "sem-processo" ? 6 : 14;

  // Aquisição: perder lead por demora ou não ter processo de captação =
  // fraco em gerar/converter demanda
  const semProcessoCaptacao = r.captacao.includes("sem-processo");
  const aquisicao = r.gargalo === "perco-leads" || semProcessoCaptacao ? 6 : 14;

  // Tecnologia: baseline modesto para todos — é literalmente a dor que o
  // labdatadev resolve; pequeno bônus se já sustenta site + portais
  const tecnologia = r.presencaDigital === "site-portais" ? 14 : 8;

  return {
    tecnologia: { valor: tecnologia, teto },
    processo: { valor: processo, teto },
    presenca: { valor: PRESENCA_POR_RESPOSTA[r.presencaDigital], teto },
    aquisicao: { valor: aquisicao, teto },
    capacidade: { valor: CAPACIDADE_POR_EQUIPE[r.equipe], teto },
  };
}

export function calcular(r: Respostas): Resultado {
  let score = 0;

  // fit de segmento — ICP primário do labdatadev/Siga Pregão é engenharia e
  // construção (maiores contratos públicos via licitação); alimentação e
  // saúde são o segundo grupo mais comum em editais municipais/estaduais
  if (r.segmento === "engenharia") score += 25;
  else if (r.segmento === "alimentacao" || r.segmento === "saude")
    score += 18;
  else score += 8;

  // geografia prioritária
  if (ehCidadePrioritaria(r.cidade)) score += 15;

  score += PONTOS_EQUIPE[r.equipe];
  score += PONTOS_INVESTIMENTO[r.investimento];
  if (GARGALOS_URGENTES.includes(r.gargalo)) score += 15;

  score = Math.max(0, Math.min(100, score));

  // degrau-alvo com ajustes de fit
  let alvo = DEGRAU_POR_INVESTIMENTO[r.investimento];
  const porteBom = r.equipe === "6-15" || r.equipe === "16-30";
  if (r.segmento === "engenharia" && porteBom) alvo += 1;
  if (r.presencaDigital === "nada") alvo -= 1; // precisa de base antes
  alvo = Math.max(1, Math.min(5, alvo));

  return {
    scoreFit: score,
    degrauAtual: 1,
    degrauAlvo: alvo,
    // fit alto entra com mais XP → nível inicial mais alto, de forma consistente
    xpInicial: score * 8,
    servicosRecomendados: servicosPara(r),
    atributosIniciais: atributosIniciais(r),
  };
}

/** Nome comercial de cada degrau (value staircase v2.0). */
export const DEGRAUS: Record<number, { nome: string; preco: string }> = {
  1: { nome: "Auditoria Digital Gratuita", preco: "R$ 0" },
  2: { nome: "Diagnóstico Técnico", preco: "R$ 497" },
  3: { nome: "Automação Essencial", preco: "R$ 1.500–2.500/mês" },
  4: { nome: "Ecossistema Completo", preco: "R$ 3.500–5.000/mês" },
  5: { nome: "CTO-as-a-Service", preco: "R$ 5.000–8.000/mês" },
};
