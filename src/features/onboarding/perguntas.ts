import type { Respostas } from "@/lib/db/types";
import { CIDADES_REGIAO } from "@/lib/regiao";

/** As 10 perguntas do cadastro. Data-driven: mudar aqui muda o wizard.
 *  Doc: docs/design/ONBOARDING-10-PERGUNTAS.md */

export type CampoResposta = keyof Respostas;

export interface Opcao {
  valor: string;
  rotulo: string;
  /** opção travada (ex.: "Produto Marca Própria (importação)") — visível
   *  como teaser, mas nunca selecionável nesta etapa; não precisa ser um
   *  `Segmento` válido porque nunca chega a ser submetida. */
  locked?: boolean;
}

export interface Pergunta {
  campo: CampoResposta;
  titulo: string;
  ajuda?: string;
  tipo: "texto" | "escolha" | "multipla";
  opcoes?: Opcao[];
  placeholder?: string;
}

export const perguntas: Pergunta[] = [
  {
    campo: "nomeNegocio",
    titulo: "Qual o nome do seu negócio?",
    ajuda: "É o nome que vai aparecer na sua sede no mapa.",
    tipo: "texto",
    placeholder: "Imobiliária Vale",
  },
  {
    campo: "segmento",
    titulo: "Qual o seu segmento?",
    // Nichos calibrados no ICP do labdatadev/Siga Pregão — empresas
    // regionais que fornecem para o poder público via licitação.
    tipo: "escolha",
    opcoes: [
      { valor: "engenharia", rotulo: "Engenharia & Construção" },
      { valor: "contabilidade", rotulo: "Contabilidade & Consultoria" },
      { valor: "saude", rotulo: "Saúde & Equipamentos" },
      { valor: "tecnologia", rotulo: "Tecnologia & TI" },
      { valor: "alimentacao", rotulo: "Alimentação & Merenda Escolar" },
      { valor: "outro", rotulo: "Outro" },
      { valor: "comercio", rotulo: "Loja Produto (estoque)" },
      { valor: "servico", rotulo: "Prestador de Serviço" },
      {
        valor: "marca-propria-importacao",
        rotulo: "Produto Marca Própria (importação)",
        locked: true,
      },
    ],
  },
  {
    campo: "cidade",
    titulo: "Em qual cidade você atua?",
    tipo: "escolha",
    // derivado da fonte única (lib/regiao.ts) — adicionar cidade lá reflete aqui
    opcoes: CIDADES_REGIAO.map((c) => ({ valor: c.nome, rotulo: c.nome })),
  },
  {
    campo: "bairro",
    titulo: "Qual bairro?",
    ajuda: "Seu bairro define seu quarteirão — e seus vizinhos de negócio.",
    tipo: "texto",
    placeholder: "Centro",
  },
  {
    campo: "equipe",
    titulo: "Quantas pessoas trabalham com você?",
    tipo: "escolha",
    opcoes: [
      { valor: "so-eu", rotulo: "Só eu" },
      { valor: "2-5", rotulo: "2 a 5" },
      { valor: "6-15", rotulo: "6 a 15" },
      { valor: "16-30", rotulo: "16 a 30" },
      { valor: "30+", rotulo: "Mais de 30" },
    ],
  },
  {
    campo: "presencaDigital",
    titulo: "Como está sua presença digital hoje?",
    tipo: "escolha",
    opcoes: [
      { valor: "nada", rotulo: "Não tenho nada" },
      { valor: "social", rotulo: "Só Instagram / WhatsApp" },
      { valor: "portais", rotulo: "Só portais (ZAP, OLX, Viva)" },
      { valor: "site-desatualizado", rotulo: "Site desatualizado" },
      { valor: "site-portais", rotulo: "Site + portais funcionando" },
    ],
  },
  {
    campo: "captacao",
    titulo: "Como você capta clientes hoje?",
    ajuda: "Pode marcar mais de um.",
    tipo: "multipla",
    opcoes: [
      { valor: "indicacao", rotulo: "Indicação" },
      { valor: "portais", rotulo: "Portais" },
      { valor: "ads", rotulo: "Anúncios pagos" },
      { valor: "social", rotulo: "Redes sociais" },
      { valor: "porta-a-porta", rotulo: "Porta a porta" },
      { valor: "sem-processo", rotulo: "Não tenho processo" },
    ],
  },
  {
    campo: "objetivo",
    titulo: "Qual seu objetivo principal nos próximos 90 dias?",
    ajuda: "Vira o objetivo do seu painel — e o seu ciclo de melhoria.",
    tipo: "escolha",
    opcoes: [
      { valor: "mais-leads", rotulo: "Mais leads" },
      { valor: "organizar", rotulo: "Organizar processos" },
      { valor: "vender-mais", rotulo: "Vender mais para quem já é cliente" },
      { valor: "aparecer", rotulo: "Aparecer mais na região" },
      { valor: "automatizar", rotulo: "Ganhar tempo (automatizar)" },
    ],
  },
  {
    campo: "gargalo",
    titulo: "Qual seu maior gargalo hoje?",
    tipo: "escolha",
    opcoes: [
      { valor: "perco-leads", rotulo: "Perco leads por demora" },
      { valor: "manual", rotulo: "Tudo é manual / planilha" },
      { valor: "sem-dados", rotulo: "Não sei de onde vem resultado" },
      { valor: "imagem-fraca", rotulo: "Site / imagem fraca" },
      { valor: "sem-processo", rotulo: "Equipe sem processo" },
    ],
  },
  {
    campo: "investimento",
    titulo: "Quanto você consegue investir por mês em tecnologia?",
    ajuda: "Serve para recomendar o próximo passo certo — sem empurrar nada.",
    tipo: "escolha",
    opcoes: [
      { valor: "nao-sei", rotulo: "Ainda não sei" },
      { valor: "ate-500", rotulo: "Até R$ 500" },
      { valor: "500-1500", rotulo: "R$ 500 a R$ 1.500" },
      { valor: "1500-3500", rotulo: "R$ 1.500 a R$ 3.500" },
      { valor: "3500+", rotulo: "Acima de R$ 3.500" },
    ],
  },
];
