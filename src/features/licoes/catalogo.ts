import type { AtributoChave } from "@tokens";

/** XP concedido ao concluir uma lição (GH-EDU-01) — bem abaixo de ações
 *  pagas/contratadas (`servico_contratado` dá 200): ler conteúdo é mais leve
 *  que fechar um serviço real, o valor tem que refletir isso. */
export const XP_LICAO = 40;

export interface Licao {
  id: string;
  /** degrau da escada de valor a que esta lição se ancora (1–5) */
  degrau: number;
  titulo: string;
  /** "3 minutos" etc — só texto, não cronometra de verdade */
  duracao: string;
  /** Markdown curto, versionado aqui mesmo (GH-EDU-01: "não CMS externo") */
  conteudo: string;
  /** eixo que a lição reforça — mesmo princípio de `CargoIA.eixoFortalecido` */
  atributo: AtributoChave;
  /** ação concreta no jogo a que esta lição se liga (nunca teoria solta) */
  acao: string;
}

/**
 * Uma lição por degrau — o "porquê" por trás da recomendação daquele
 * degrau. Linguagem direta, ICP é dono de PME regional que fornece para o
 * poder público (engenharia, contabilidade, saúde, tecnologia, alimentação),
 * não estudante de administração.
 */
export const CATALOGO_LICOES: readonly Licao[] = [
  {
    id: "por-que-diagnostico",
    degrau: 1,
    titulo: "Por que um diagnóstico gratuito importa",
    duracao: "3 minutos",
    atributo: "processo",
    acao: "Aceite um job do Marketplace para começar a construir histórico real",
    conteudo:
      "Antes de comprar automação ou contratar gente, você precisa saber " +
      "exatamente onde está perdendo tempo e dinheiro hoje. É por isso que " +
      "a primeira etapa da escada é uma auditoria — não é enrolação, é o " +
      "que evita investir R$ 5 mil numa ferramenta que resolve o problema " +
      "errado. Empresas que pulam essa etapa costumam comprar solução antes " +
      "de entender o problema, e acabam pagando duas vezes.",
  },
  {
    id: "por-que-medir-antes-de-investir",
    degrau: 2,
    titulo: "Por que medir antes de investir",
    duracao: "3 minutos",
    atributo: "tecnologia",
    acao: "Desbloqueie um nó na Árvore de Parcerias",
    conteudo:
      "'Preciso de mais tecnologia' é vago demais para guiar um investimento. " +
      "Um diagnóstico técnico transforma isso em números: quantas horas por " +
      "semana sua equipe gasta em tarefa manual, quantos leads você perde " +
      "por demora de resposta, qual sistema não conversa com qual. Com " +
      "número na mão, você prioriza o que realmente move o ponteiro — não o " +
      "que parece mais moderno.",
  },
  {
    id: "por-que-automatizar-destrava-crescimento",
    degrau: 3,
    titulo: "Por que automatizar destrava crescimento",
    duracao: "4 minutos",
    atributo: "processo",
    acao: "Contrate um Funcionário de IA para assumir uma tarefa repetitiva",
    conteudo:
      "Todo negócio que cresce bate no mesmo teto: o dono (ou a equipe " +
      "pequena) vira o gargalo, porque tudo passa pela mesma pessoa. " +
      "Automação essencial não é sobre substituir gente — é sobre tirar do " +
      "caminho o trabalho repetitivo (responder o mesmo tipo de mensagem, " +
      "montar a mesma planilha, revisar o mesmo documento) para sobrar tempo " +
      "para o que só um humano decide: relacionamento, negociação, estratégia.",
  },
  {
    id: "por-que-integrar-evita-retrabalho",
    degrau: 4,
    titulo: "Por que integrar sistemas evita retrabalho",
    duracao: "4 minutos",
    atributo: "capacidade",
    acao: "Evolua sua Sede para aumentar a capacidade da equipe",
    conteudo:
      "Quando cada área usa uma ferramenta diferente que não conversa com " +
      "as outras, alguém vira 'ponte manual' — copiando dado de um sistema " +
      "para o outro, todo dia. Isso não aparece na planilha de custos, mas " +
      "consome horas e cria erro. Um ecossistema integrado significa que o " +
      "dado entra uma vez e circula sozinho — venda, financeiro e operação " +
      "enxergando a mesma informação, sem retrabalho.",
  },
  {
    id: "por-que-ter-cto-em-tempo-integral",
    degrau: 5,
    titulo: "Por que ter alguém pensando tecnologia em tempo integral",
    duracao: "3 minutos",
    atributo: "capacidade",
    acao: "Continue evoluindo sua equipe de Funcionários de IA",
    conteudo:
      "Depois que a automação básica está rodando, a pergunta muda de " +
      "'o que automatizar' para 'o que vem depois' — e essa pergunta " +
      "precisa de alguém acompanhando de forma contínua, não uma consultoria " +
      "pontual que aparece uma vez por ano. É o papel de um CTO — só que a " +
      "maioria das PMEs não tem escala para contratar um em tempo integral. " +
      "É exatamente essa lacuna que o modelo de assinatura resolve.",
  },
];

export function licaoPorId(id: string): Licao | undefined {
  return CATALOGO_LICOES.find((l) => l.id === id);
}

/** A lição do degrau atual do negócio — sempre existe uma (1 lição por
 *  degrau, 1..5), nunca `undefined` para um `degrauAtual` válido. */
export function licaoDoDegrau(degrau: number): Licao | undefined {
  return CATALOGO_LICOES.find((l) => l.degrau === degrau);
}
