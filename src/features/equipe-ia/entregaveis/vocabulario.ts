import type { Segmento } from "@/lib/db/types";
import type { Respostas } from "@/lib/db/types";

/**
 * Vocabulário de domínio por segmento — fonte ÚNICA do que os geradores
 * de entregável sabem sobre cada nicho. Canvas, post e script comercial
 * puxam daqui em vez de cada um inventar o próprio conhecimento (DRY):
 * melhorar o texto de "engenharia" num lugar melhora os três entregáveis.
 *
 * Calibrado no ICP real do labdatadev (ver docs/CONTEXTO-NEGOCIO.md §4):
 * PMEs regionais do Vale do Café que fornecem para o poder público via
 * licitação — não e-commerce, não startup de tecnologia genérica.
 */

export interface VocabuloSegmento {
  /** como o dono descreveria o que vende, em 1 linha */
  oQueVende: string;
  clientes: string[];
  atividades: string[];
  recursos: string[];
  parcerias: string[];
  receitas: string[];
  /** dor específica do nicho, usada como gancho no post e no script */
  dorTipica: string;
  /** prova/argumento que costuma destravar a conversa nesse nicho */
  argumentoChave: string;
  hashtag: string;
}

const VOCABULARIO: Record<Segmento, VocabuloSegmento> = {
  engenharia: {
    oQueVende: "projetos, obras e laudos técnicos",
    clientes: [
      "Prefeituras e órgãos públicos (via licitação/pregão)",
      "Construtoras e incorporadoras regionais",
      "Indústrias que precisam de laudo e adequação (NR/ART)",
    ],
    atividades: [
      "Elaboração de projeto e memorial de cálculo",
      "Acompanhamento e medição de obra",
      "Emissão de ART e documentação técnica",
      "Montagem de proposta para edital",
    ],
    recursos: [
      "Engenheiro responsável técnico (CREA ativo)",
      "Licenças de software de projeto (CAD/BIM)",
      "Acervo técnico para comprovação em licitação",
    ],
    parcerias: [
      "Escritórios de arquitetura complementares",
      "Laboratórios de ensaio e topografia",
      "Contabilidade especializada em certidões para licitação",
    ],
    receitas: [
      "Contrato por obra/projeto (valor fechado)",
      "Medição mensal em contratos públicos",
      "Laudos e ART avulsos (ticket menor, recorrente)",
    ],
    dorTipica: "perder prazo de edital por documentação dispersa",
    argumentoChave:
      "quem tem acervo e certidão organizados entra em mais editais no mesmo mês",
    hashtag: "#engenharia",
  },
  contabilidade: {
    oQueVende: "contabilidade, certidões e consultoria fiscal",
    clientes: [
      "PMEs da região que fornecem para o poder público",
      "MEIs e profissionais liberais em crescimento",
      "Empresas que precisam regularizar certidões para licitar",
    ],
    atividades: [
      "Escrituração e apuração de impostos",
      "Emissão e renovação de certidões negativas",
      "Consultoria de enquadramento tributário",
      "Assessoria de habilitação em licitação",
    ],
    recursos: [
      "Contador responsável (CRC ativo)",
      "Sistema contábil e certificado digital",
      "Base de clientes recorrentes",
    ],
    parcerias: [
      "Escritórios de advocacia (tributário/licitatório)",
      "Engenharias e construtoras que precisam de habilitação",
      "Associação comercial local",
    ],
    receitas: [
      "Honorário mensal recorrente por cliente",
      "Serviços avulsos (abertura, alteração, certidão)",
      "Consultoria pontual de enquadramento",
    ],
    dorTipica: "cliente que só lembra do contador quando o prazo já venceu",
    argumentoChave:
      "processo documentado transforma correria de prazo em rotina previsível",
    hashtag: "#contabilidade",
  },
  saude: {
    oQueVende: "serviços e equipamentos de saúde",
    clientes: [
      "Secretarias municipais de saúde (via pregão)",
      "Clínicas e consultórios da região",
      "Planos e convênios locais",
    ],
    atividades: [
      "Atendimento e procedimentos",
      "Gestão de agenda e prontuário",
      "Fornecimento/manutenção de equipamento",
      "Habilitação sanitária e documentação",
    ],
    recursos: [
      "Equipe técnica habilitada",
      "Alvará sanitário e licenças",
      "Equipamento calibrado e com manutenção em dia",
    ],
    parcerias: [
      "Laboratórios e clínicas complementares",
      "Fornecedores de insumo e manutenção",
      "Contabilidade para habilitação em pregão",
    ],
    receitas: [
      "Contrato com o poder público (pregão)",
      "Atendimento particular e convênio",
      "Manutenção recorrente de equipamento",
    ],
    dorTipica: "agenda cheia sem sobrar tempo para cuidar da parte administrativa",
    argumentoChave:
      "automatizar confirmação e triagem devolve horas clínicas por semana",
    hashtag: "#saude",
  },
  tecnologia: {
    oQueVende: "software, infraestrutura e suporte de TI",
    clientes: [
      "Órgãos públicos com contrato de TI",
      "PMEs regionais que precisam digitalizar",
      "Empresas com sistema legado precisando integrar",
    ],
    atividades: [
      "Desenvolvimento e sustentação de sistema",
      "Infraestrutura, backup e segurança",
      "Suporte técnico e SLA",
      "Integração entre sistemas",
    ],
    recursos: [
      "Equipe técnica e ambiente de desenvolvimento",
      "Infraestrutura de nuvem/servidor",
      "Portfólio e acervo de casos entregues",
    ],
    parcerias: [
      "Revendas de hardware e licença",
      "Provedores de nuvem",
      "Consultorias que subcontratam execução",
    ],
    receitas: [
      "Contrato mensal de sustentação/SLA",
      "Projeto fechado por escopo",
      "Licença e revenda de software",
    ],
    dorTipica: "viver de projeto avulso, sem receita recorrente previsível",
    argumentoChave:
      "transformar suporte pontual em contrato mensal estabiliza o caixa",
    hashtag: "#tecnologia",
  },
  alimentacao: {
    oQueVende: "alimentação e fornecimento de refeições",
    clientes: [
      "Merenda escolar (licitação municipal)",
      "Empresas com refeitório e convênio",
      "Consumidor final da região",
    ],
    atividades: [
      "Produção e preparo",
      "Logística e entrega em rota",
      "Controle sanitário e rastreabilidade",
      "Montagem de proposta para edital",
    ],
    recursos: [
      "Cozinha licenciada e alvará sanitário",
      "Equipe de produção e nutricionista",
      "Veículo/logística de entrega",
    ],
    parcerias: [
      "Produtores e distribuidores locais",
      "Nutricionista responsável técnica",
      "Contabilidade para habilitação em pregão",
    ],
    receitas: [
      "Contrato de fornecimento (merenda/refeitório)",
      "Venda direta ao consumidor",
      "Eventos e encomendas pontuais",
    ],
    dorTipica: "margem apertada e custo de insumo variando toda semana",
    argumentoChave:
      "controlar custo por prato é o que separa contrato lucrativo de prejuízo",
    hashtag: "#alimentacao",
  },
  comercio: {
    oQueVende: "produtos com estoque próprio",
    clientes: [
      "Consumidor final da região",
      "Empresas e órgãos públicos (fornecimento)",
      "Revendedores e parceiros",
    ],
    atividades: [
      "Compra e gestão de estoque",
      "Venda no balcão e online",
      "Pós-venda e troca",
      "Cotação e proposta para fornecimento",
    ],
    recursos: [
      "Estoque e ponto comercial",
      "Sistema de gestão (ERP/PDV)",
      "Equipe de vendas",
    ],
    parcerias: [
      "Distribuidores e representantes",
      "Transportadoras locais",
      "Marketplaces e portais de compra pública",
    ],
    receitas: [
      "Margem sobre venda no balcão",
      "Contrato de fornecimento recorrente",
      "Venda online",
    ],
    dorTipica: "estoque parado enquanto falta justamente o que o cliente pede",
    argumentoChave:
      "saber o giro real por item muda o que se compra na próxima reposição",
    hashtag: "#comercio",
  },
  servico: {
    oQueVende: "serviços especializados",
    clientes: [
      "Empresas da região",
      "Órgãos públicos (contrato de serviço)",
      "Consumidor final",
    ],
    atividades: [
      "Execução do serviço contratado",
      "Orçamento e proposta",
      "Acompanhamento e pós-venda",
    ],
    recursos: [
      "Equipe técnica",
      "Ferramentas e equipamento",
      "Portfólio de trabalhos entregues",
    ],
    parcerias: [
      "Prestadores complementares",
      "Fornecedores de material",
      "Indicação de clientes satisfeitos",
    ],
    receitas: [
      "Serviço por hora ou por escopo",
      "Contrato de manutenção recorrente",
      "Pacotes fechados",
    ],
    dorTipica: "depender de indicação e não saber de onde vem o próximo cliente",
    argumentoChave:
      "previsibilidade vem de processo de captação, não de sorte",
    hashtag: "#servicos",
  },
  outro: {
    oQueVende: "seus produtos e serviços",
    clientes: [
      "Clientes da sua região",
      "Empresas parceiras",
      "Poder público (se houver enquadramento)",
    ],
    atividades: [
      "Entrega do que foi vendido",
      "Captação e relacionamento",
      "Gestão administrativa",
    ],
    recursos: ["Equipe", "Ferramentas de trabalho", "Base de clientes"],
    parcerias: ["Fornecedores", "Parceiros de indicação", "Contabilidade"],
    receitas: ["Venda direta", "Contrato recorrente", "Serviços avulsos"],
    dorTipica: "crescer sem processo definido",
    argumentoChave: "processo claro é o que permite crescer sem quebrar",
    hashtag: "#negociolocal",
  },
};

export function vocabulario(segmento: Segmento): VocabuloSegmento {
  return VOCABULARIO[segmento] ?? VOCABULARIO.outro;
}

/** Frase que nomeia o gargalo declarado no onboarding, em linguagem de dono. */
export const GARGALO_TEXTO: Record<Respostas["gargalo"], string> = {
  "perco-leads": "leads que se perdem por demora na resposta",
  manual: "trabalho manual e planilha em tudo",
  "sem-dados": "não saber de onde vem o resultado",
  "imagem-fraca": "presença digital fraca perto do que o negócio entrega",
  "sem-processo": "equipe sem processo definido",
};

/** O que o dono declarou querer nos próximos 90 dias. */
export const OBJETIVO_TEXTO: Record<Respostas["objetivo"], string> = {
  "mais-leads": "gerar mais oportunidades",
  organizar: "organizar os processos",
  "vender-mais": "vender mais para quem já é cliente",
  aparecer: "ser mais conhecido na região",
  automatizar: "ganhar tempo automatizando",
};

/** Canais atuais, a partir de como o negócio capta hoje. */
export const CAPTACAO_TEXTO: Record<string, string> = {
  indicacao: "Indicação boca a boca",
  portais: "Portais e plataformas",
  ads: "Anúncios pagos",
  social: "Redes sociais",
  "porta-a-porta": "Prospecção porta a porta",
  "sem-processo": "Sem canal definido (oportunidade)",
};
