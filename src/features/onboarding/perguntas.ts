import type { Respostas } from "@/lib/db/types";
import { CIDADES_REGIAO } from "@/lib/regiao";

/** As 19 perguntas do cadastro (+ conta = 20 passos). Data-driven: mudar
 *  aqui muda o wizard. Doc: docs/design/ONBOARDING-10-PERGUNTAS.md e a
 *  matriz de rastreabilidade pergunta→documento em docs/PROXIMA-TAREFA.md. */

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
  /** Só perguntas `tipo: "texto"` — teto de caracteres no input do Wizard.
   *  Achado real de code review (2026-08-18): as 4 perguntas de texto livre
   *  novas (problemaPrincipal/diferencial/provaSocial/concorrentesConhecidos)
   *  não tinham teto nenhum antes de virar contexto pro prompt de IA do
   *  document-engine — texto extremamente longo infla custo/latência sem
   *  limite. `actions.ts` (`cadastrar`) trunca de novo no servidor — o
   *  cliente nunca é fonte de verdade sozinho (regra 4 do AGENTS.md). */
  maxLength?: number;
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
    campo: "problemaPrincipal",
    titulo: "Qual problema você resolve pros SEUS clientes?",
    ajuda: "Em 1 frase — é a base do seu Modelo de Negócio.",
    tipo: "texto",
    placeholder: "Ex.: empresas perdem prazo de entrega por falta de gestão",
    maxLength: 300,
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
    campo: "licitacaoPublico",
    titulo: "Você já vendeu para o poder público (licitação)?",
    tipo: "escolha",
    opcoes: [
      { valor: "vende-regularmente", rotulo: "Vendo regularmente" },
      { valor: "ja-vendeu", rotulo: "Já vendi algumas vezes" },
      { valor: "tem-interesse", rotulo: "Nunca vendi, mas tenho interesse" },
      { valor: "nao-e-foco", rotulo: "Não é meu foco" },
    ],
  },
  {
    campo: "modeloReceita",
    titulo: "Como seu negócio ganha dinheiro hoje?",
    tipo: "escolha",
    opcoes: [
      { valor: "projeto-unico", rotulo: "Projeto único (venda pontual)" },
      { valor: "assinatura-recorrente", rotulo: "Assinatura / mensalidade" },
      { valor: "comissao-resultado", rotulo: "Comissão sobre resultado" },
      { valor: "venda-produto", rotulo: "Venda de produto" },
      { valor: "combinacao", rotulo: "Combinação dos anteriores" },
    ],
  },
  {
    campo: "ticketMedio",
    titulo: "Qual seu ticket médio por venda/contrato?",
    tipo: "escolha",
    opcoes: [
      { valor: "ate-500", rotulo: "Até R$ 500" },
      { valor: "500-2000", rotulo: "R$ 500 a R$ 2.000" },
      { valor: "2000-10000", rotulo: "R$ 2.000 a R$ 10.000" },
      { valor: "10000-50000", rotulo: "R$ 10.000 a R$ 50.000" },
      { valor: "acima-50000", rotulo: "Acima de R$ 50.000" },
      { valor: "nao-sei", rotulo: "Não sei" },
    ],
  },
  {
    campo: "clientesPagantes",
    titulo: "Quantos clientes pagantes você tem hoje?",
    tipo: "escolha",
    opcoes: [
      { valor: "nenhum", rotulo: "Nenhum ainda" },
      { valor: "1-5", rotulo: "1 a 5" },
      { valor: "6-20", rotulo: "6 a 20" },
      { valor: "21-50", rotulo: "21 a 50" },
      { valor: "mais-50", rotulo: "Mais de 50" },
    ],
  },
  {
    campo: "faturamentoFaixa",
    titulo: "Qual sua faixa de faturamento mensal?",
    tipo: "escolha",
    opcoes: [
      { valor: "ate-10k", rotulo: "Até R$ 10 mil" },
      { valor: "10-30k", rotulo: "R$ 10 a 30 mil" },
      { valor: "30-100k", rotulo: "R$ 30 a 100 mil" },
      { valor: "100-300k", rotulo: "R$ 100 a 300 mil" },
      { valor: "acima-300k", rotulo: "Acima de R$ 300 mil" },
      { valor: "prefiro-nao-informar", rotulo: "Prefiro não informar" },
    ],
  },
  {
    campo: "diferencial",
    titulo: "Em 1 frase, por que um cliente escolhe você e não o concorrente?",
    tipo: "texto",
    placeholder: "Ex.: entrego em metade do prazo do mercado",
    maxLength: 300,
  },
  {
    campo: "provaSocial",
    titulo: "Tem algum resultado ou depoimento de cliente pra citar?",
    ajuda: "Opcional — pode responder 'ainda não tenho'.",
    tipo: "texto",
    placeholder: "Ex.: aumentei em 30% as vendas do Mercado Silva",
    maxLength: 300,
  },
  {
    campo: "concorrentesConhecidos",
    titulo: "Você sabe quem são seus 2-3 concorrentes na região?",
    ajuda: "Opcional — pode responder 'não sei'.",
    tipo: "texto",
    placeholder: "Ex.: Construtora ABC, Engenharia XYZ",
    maxLength: 300,
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
