import type { Segmento } from "@/lib/db/types";
import type { PerfilMercado } from "../tipos";

/**
 * Conhecimento base dos 8 segmentos do cadastro, escrito do ponto de vista
 * certo: `dores`, `desejos` e `gatilhos` são do COMPRADOR; `custos`,
 * `recursos` e `riscos` são do DONO. Ver o comentário de `PerfilMercado`.
 *
 * Regras de escrita deste arquivo:
 * - nada de promessa de resultado ("o dobro de clientes") nem de fato sobre o
 *   negócio que a IA não tem como saber ("há 10 anos no mercado");
 * - `provas` são instruções do que o dono pode mostrar, não afirmações;
 * - o que depende de lei ou de conselho profissional é lista a CONFIRMAR com
 *   o contador ou o órgão competente, nunca uma garantia.
 */

export const SEGMENTOS: Record<Segmento, PerfilMercado> = {
  engenharia: {
    id: "engenharia",
    rotulo: "Engenharia e construção",
    oQueVende: "projetos, obras, laudos e acompanhamento técnico",
    entrega: "o projeto",
    tipoDeCliente: "quem precisa de projeto, obra, laudo ou regularização",
    clientes: [
      "Famílias e proprietários que vão construir, reformar ou regularizar um imóvel",
      "Construtoras e incorporadoras da região que subcontratam projeto e acompanhamento",
      "Indústrias e comércios que precisam de laudo e adequação (segurança, bombeiros, acessibilidade)",
      "Prefeituras e órgãos públicos, por licitação ou pregão (se o negócio participa)",
    ],
    dores: [
      "obra que atrasa e estoura o orçamento",
      "projeto sem aprovação e documentação irregular",
      "não saber se o preço do orçamento está justo",
      "profissional que some no meio da obra",
    ],
    desejos: [
      "prazo e valor combinados por escrito",
      "projeto aprovado e documentação em dia",
      "um responsável técnico acompanhando tudo",
    ],
    gatilhos: [
      "decidiu construir ou reformar",
      "recebeu notificação da prefeitura ou dos bombeiros",
      "vai vender, financiar ou alugar um imóvel e precisa regularizar",
      "abriu uma empresa e precisa de laudo ou alvará",
    ],
    provas: [
      "fotos de antes e depois de obras entregues, com autorização do cliente",
      "projetos aprovados e laudos emitidos, sem dados pessoais do cliente",
      "depoimento curto de um cliente satisfeito",
      "registro profissional ativo (CREA ou CAU) à vista",
    ],
    dicas: [
      {
        titulo: "Antes de contratar uma obra",
        pontos: [
          "Peça orçamento detalhado por etapa, não um valor fechado sem itens",
          "Confira o registro profissional de quem será o responsável técnico",
          "Combine o pagamento por etapa concluída, não tudo adiantado",
          "Guarde projeto, ART ou RRT e notas fiscais em uma pasta só",
        ],
      },
      {
        titulo: "Documentos de um imóvel regular",
        pontos: [
          "Matrícula atualizada",
          "Projeto aprovado na prefeitura",
          "Habite-se",
          "IPTU e certidões em dia",
        ],
      },
      {
        titulo: "Sinais de que vale chamar um engenheiro",
        pontos: [
          "Fissuras que crescem ou mudam de direção",
          "Infiltração que volta depois de reparada",
          "Vontade de abrir ou retirar uma parede",
          "Ampliação feita sem projeto",
        ],
      },
    ],
    mitos: [
      {
        mito: "Reforma pequena não precisa de responsável técnico",
        verdade:
          "Mexer em estrutura, parede ou instalação pode exigir projeto e responsável técnico. Vale perguntar antes de quebrar.",
      },
      {
        mito: "O orçamento mais barato é o melhor",
        verdade:
          "Compare o que está incluso: material, mão de obra, prazo e garantia. Preço baixo sem itens costuma virar aditivo depois.",
      },
    ],
    perguntas: [
      "O que você quer construir, reformar ou regularizar?",
      "O imóvel já tem projeto e documentação?",
      "Existe prazo (financiamento, venda, mudança)?",
      "Você já tem um valor em mente para o investimento?",
      "Quem mais participa da decisão?",
    ],
    objecoes: [
      {
        objecao: "Outro profissional cobrou mais barato.",
        resposta:
          "Vale comparar item por item: o que está incluso, prazo, responsabilidade técnica e garantia. Se quiser, olho o outro orçamento com você e mostro a diferença.",
      },
      {
        objecao: "Só quero o projeto, a obra eu vejo depois.",
        resposta:
          "Sem problema. Posso entregar o projeto completo e, se você quiser, acompanhar a obra em etapas combinadas.",
      },
    ],
    canais: [
      "Indicação de arquitetos, corretores e lojas de material de construção",
      "Perfil da Empresa no Google e busca por cidade",
      "Instagram com fotos de obra e antes e depois",
      "Contato direto com construtoras e acompanhamento de licitações",
    ],
    atividadesChave: [
      "Visita técnica e levantamento",
      "Elaboração de projeto e memorial",
      "Emissão de ART ou RRT e documentação técnica",
      "Acompanhamento e medição de obra",
      "Proposta e documentação para licitação",
    ],
    recursos: [
      "Responsável técnico com registro ativo no conselho",
      "Software de projeto (CAD ou BIM) e computador",
      "Acervo técnico: obras e projetos já entregues",
    ],
    parcerias: [
      "Escritórios de arquitetura e topografia",
      "Laboratórios de ensaio e fornecedores de material",
      "Contador para certidões e habilitação",
      "Corretores e imobiliárias que indicam clientes",
    ],
    receitas: [
      "Projeto por valor fechado",
      "Obra por contrato ou por medição",
      "Laudos, vistorias e ART avulsos",
      "Acompanhamento mensal de obra",
    ],
    custos: [
      "Pró-labore ou salários da equipe técnica",
      "Anuidade do conselho profissional e taxas de ART ou RRT",
      "Licenças de software e equipamentos",
      "Deslocamento e material de campo",
    ],
    documentos: [
      "Registro do responsável técnico no conselho (CREA ou CAU) em dia",
      "ART ou RRT de cada serviço contratado",
      "Contrato padrão por etapa, com escopo, prazo e forma de pagamento",
      "Acervo técnico organizado por obra",
      "Alvará de funcionamento da empresa",
      "Certidões da empresa (federal, estadual, municipal, FGTS e trabalhista), se vender para o governo",
    ],
    execucao: {
      objetivo: "Entregar projeto ou obra no prazo combinado, com registro de cada etapa.",
      passos: [
        "Visita técnica e levantamento das medidas e das condições do local",
        "Reunião de escopo: o que será feito, o que não será e o que o cliente fornece",
        "Proposta por escrito com etapas, prazo e valor",
        "Assinatura do contrato e emissão da ART ou RRT",
        "Execução por etapas, com fotos e um relatório curto de cada uma",
        "Medição e aprovação de cada etapa pelo cliente antes de cobrar",
        "Entrega final com a pasta de documentos e o termo de aceite",
      ],
      qualidade: [
        "Cada etapa tem foto e data registradas",
        "O cliente aprovou por escrito antes da cobrança",
        "Todos os documentos foram entregues em uma pasta única",
      ],
      erros: [
        "Começar sem escopo escrito",
        "Aceitar mudança no meio da obra sem registrar e reprecificar",
        "Deixar para cobrar tudo no fim",
      ],
    },
    indicadores: [
      "Orçamentos enviados por semana",
      "Orçamentos que viram contrato (%)",
      "Atraso médio por obra (dias)",
      "Margem por projeto",
    ],
    riscos: [
      "Depender de poucos contratos grandes",
      "Prazos de aprovação que não dependem de você (prefeitura, concessionárias)",
      "Documentação dispersa que trava a habilitação em licitação",
    ],
    hashtags: ["#engenharia", "#projetos", "#obras"],
    vendeParaGoverno: true,
    agendamento: false,
  },

  contabilidade: {
    id: "contabilidade",
    rotulo: "Contabilidade e consultoria",
    oQueVende: "contabilidade, abertura de empresa, impostos e certidões",
    entrega: "o serviço contábil",
    tipoDeCliente: "quem tem ou vai abrir um negócio e precisa ficar em dia com os impostos",
    clientes: [
      "MEIs e microempresas que precisam de contabilidade em dia",
      "Quem vai abrir uma empresa e não sabe por onde começar",
      "Empresas que precisam de certidões para licitar ou pedir crédito",
      "Profissionais liberais e autônomos",
    ],
    dores: [
      "imposto atrasado e multa que ninguém avisou",
      "não saber quanto sobra de verdade no fim do mês",
      "empresa irregular, sem certidões para vender ou pedir crédito",
      "contador que só responde depois do prazo",
    ],
    desejos: [
      "tudo em dia sem precisar entender de imposto",
      "saber o que pagar e quando",
      "resposta rápida quando surge uma dúvida",
    ],
    gatilhos: [
      "vai abrir uma empresa",
      "recebeu cobrança ou notificação da Receita ou da prefeitura",
      "quer financiamento e pediram balanço ou certidões",
      "o negócio cresceu e o enquadramento atual não serve mais",
    ],
    provas: [
      "calendário de obrigações mostrado em tela, sem dados de clientes",
      "exemplo de relatório mensal simples que o cliente recebe",
      "número de empresas atendidas, se o dono quiser divulgar",
      "registro profissional ativo no CRC à vista",
    ],
    dicas: [
      {
        titulo: "O básico para o pequeno negócio",
        pontos: [
          "Separe o dinheiro da empresa do dinheiro pessoal",
          "Anote todas as entradas e saídas, mesmo as pequenas",
          "Pague os impostos em uma data fixa do mês",
          "Guarde notas e comprovantes em pasta organizada, por vários anos",
        ],
      },
      {
        titulo: "Antes de abrir uma empresa",
        pontos: [
          "Defina o que vai vender e para quem",
          "Confirme se a atividade pode ser MEI ou precisa de outro enquadramento",
          "Veja com a prefeitura se o endereço permite o funcionamento",
          "Converse com um contador antes de escolher o regime",
        ],
      },
      {
        titulo: "Certidões para vender ao governo ou pedir crédito",
        pontos: [
          "As mais pedidas são federal, estadual, municipal, FGTS e trabalhista",
          "Cada uma tem validade: marque a data de vencimento",
          "Uma pendência pequena pode travar todas, então resolva cedo",
        ],
      },
    ],
    mitos: [
      {
        mito: "MEI não precisa declarar nada",
        verdade:
          "O MEI paga a guia mensal e também precisa enviar a declaração anual de faturamento. Deixar de fazer gera multa e pode travar o CNPJ.",
      },
      {
        mito: "Contador só serve para pagar imposto",
        verdade:
          "O contador também ajuda a escolher o enquadramento, planejar o caixa e organizar a documentação para crédito e licitação.",
      },
    ],
    perguntas: [
      "Você já tem CNPJ? Em qual enquadramento?",
      "Quem cuida da contabilidade hoje e como é o contato com essa pessoa?",
      "O que mais preocupa: imposto, documentação ou saber quanto sobra?",
      "Você pretende crescer, contratar ou pedir crédito neste ano?",
    ],
    objecoes: [
      {
        objecao: "Já tenho contador.",
        resposta:
          "Ótimo, é bom ter. Se quiser, faço uma revisão rápida dos seus impostos e certidões, sem compromisso, só para você ter uma segunda opinião.",
      },
      {
        objecao: "Contabilidade é cara para o meu tamanho.",
        resposta:
          "Faz sentido olhar o custo. Compare com o que uma multa ou uma certidão travada custa. Posso montar um plano que caiba no tamanho da sua empresa.",
      },
    ],
    canais: [
      "Indicação de clientes, bancos, cooperativas e sindicatos locais",
      "Perfil da Empresa no Google",
      "Associação comercial e eventos de empreendedores",
      "Instagram e LinkedIn com dicas curtas de impostos",
    ],
    atividadesChave: [
      "Escrituração e apuração de impostos",
      "Abertura, alteração e baixa de empresas",
      "Emissão de certidões e controle de vencimentos",
      "Folha de pagamento e obrigações acessórias",
      "Consultoria de enquadramento tributário",
    ],
    recursos: [
      "Contador responsável com registro ativo no CRC",
      "Sistema contábil e certificado digital",
      "Carteira de clientes recorrentes",
      "Calendário de obrigações por cliente",
    ],
    parcerias: [
      "Escritórios de advocacia (tributário e trabalhista)",
      "Bancos e cooperativas de crédito locais",
      "Associação comercial e sindicatos",
      "Empresas de sistemas de gestão",
    ],
    receitas: [
      "Honorário mensal recorrente",
      "Abertura e alteração de empresa (avulso)",
      "Consultoria de enquadramento e planejamento",
      "Regularização de pendências",
    ],
    custos: [
      "Salários e pró-labore",
      "Sistema contábil e certificado digital",
      "Anuidade do conselho de classe",
      "Atualização profissional a cada mudança de legislação",
    ],
    documentos: [
      "Registro do contador no CRC em dia",
      "Contrato de prestação de serviços com escopo e honorário",
      "Procuração e certificado digital dos clientes, com a validade controlada",
      "Calendário de obrigações por cliente",
      "Termo de consentimento e política de privacidade (LGPD)",
    ],
    execucao: {
      objetivo: "Fechar o mês de cada cliente sem atraso e sem surpresa.",
      passos: [
        "Receber extratos, notas e comprovantes até o dia combinado",
        "Conferir os lançamentos e listar as pendências",
        "Apurar os impostos de acordo com o regime do cliente",
        "Enviar a guia junto com um resumo simples do mês: o que pagar e quando",
        "Confirmar o pagamento",
        "Registrar as dúvidas e atualizar o calendário do mês seguinte",
      ],
      qualidade: [
        "O cliente recebe o resumo antes do vencimento",
        "Nenhuma guia sai sem conferência",
        "Toda pendência tem responsável e data",
      ],
      erros: [
        "Esperar o cliente cobrar",
        "Misturar contas pessoais e da empresa",
        "Não avisar quando uma regra muda",
      ],
    },
    indicadores: [
      "Clientes ativos e cancelamentos por mês",
      "Obrigações entregues no prazo (%)",
      "Tempo médio de resposta ao cliente",
      "Receita recorrente mensal",
    ],
    riscos: [
      "Depender de poucos clientes grandes",
      "Erro de prazo ou de apuração gera multa e quebra a confiança",
      "Mudança de legislação sem atualização da equipe",
    ],
    hashtags: ["#contabilidade", "#mei", "#empreendedorismo"],
    vendeParaGoverno: false,
    agendamento: false,
  },

  saude: {
    id: "saude",
    rotulo: "Saúde e equipamentos",
    oQueVende: "atendimento em saúde, equipamentos e insumos",
    entrega: "o atendimento",
    tipoDeCliente: "quem precisa de atendimento, acompanhamento ou equipamento de saúde",
    clientes: [
      "Pacientes da região, particulares e de convênio",
      "Clínicas e consultórios que compram equipamento, insumo e manutenção",
      "Empresas que contratam saúde ocupacional",
      "Secretarias de saúde e hospitais, por pregão (se o negócio participa)",
    ],
    dores: [
      "demora para conseguir horário",
      "não entender o que está incluso no valor",
      "equipamento parado esperando manutenção",
      "falta de retorno depois do atendimento",
    ],
    desejos: [
      "horário que cabe na rotina",
      "explicação clara do tratamento e do valor",
      "retorno rápido quando surge uma dúvida",
    ],
    gatilhos: [
      "uma necessidade que não dá para adiar",
      "indicação de outro profissional ou de alguém conhecido",
      "exame ou acompanhamento de rotina",
      "equipamento que quebrou e precisa voltar a operar",
    ],
    provas: [
      "formação e registro no conselho profissional à vista",
      "fotos do espaço limpo e organizado, sem pacientes",
      "depoimento autorizado, sem expor dados de saúde",
      "certificados de cursos e de atualização",
    ],
    dicas: [
      {
        titulo: "Como se preparar para uma consulta",
        pontos: [
          "Leve exames anteriores e a lista de remédios que usa",
          "Anote os sintomas e quando começaram",
          "Escreva suas dúvidas antes de chegar",
          "Pergunte o que fazer se algo mudar depois",
        ],
      },
      {
        titulo: "Como escolher uma clínica",
        pontos: [
          "Confira o registro do profissional no conselho",
          "Peça explicação do valor e do que está incluso",
          "Veja se existe um canal para dúvidas depois do atendimento",
          "Observe a higiene e a organização do espaço",
        ],
      },
      {
        titulo: "Equipamento de saúde: o que cobrar do fornecedor",
        pontos: [
          "Manual e treinamento de uso",
          "Prazo e condições de manutenção",
          "Garantia por escrito",
          "Registro do produto e nota fiscal",
        ],
      },
    ],
    mitos: [
      {
        mito: "Se não dói, não precisa de consulta",
        verdade:
          "Muita coisa se resolve melhor quando é percebida cedo, e o acompanhamento regular ajuda a prevenir. Quem define a frequência é o profissional.",
      },
      {
        mito: "Pesquisar na internet substitui a consulta",
        verdade:
          "A internet ajuda a entender o assunto, mas o diagnóstico depende de uma avaliação individual com um profissional.",
      },
    ],
    perguntas: [
      "O que trouxe você até aqui?",
      "Há quanto tempo isso vem acontecendo?",
      "Você prefere atendimento particular ou por convênio?",
      "Qual o melhor dia e horário para você?",
    ],
    objecoes: [
      {
        objecao: "Está caro.",
        resposta:
          "Posso explicar o que está incluso e, se fizer sentido, ver uma opção de acompanhamento que caiba melhor. Qual valor você tinha em mente?",
      },
      {
        objecao: "Vou ver primeiro com o meu convênio.",
        resposta:
          "Claro. Te passo as informações do atendimento para você comparar e, se quiser, já deixamos um horário pré-agendado.",
      },
    ],
    canais: [
      "Indicação de pacientes e de outros profissionais",
      "Perfil da Empresa no Google e avaliações",
      "Instagram com conteúdo educativo",
      "WhatsApp para agenda e retorno",
    ],
    atividadesChave: [
      "Atendimento e procedimentos",
      "Gestão de agenda e prontuário",
      "Limpeza, esterilização e controle sanitário",
      "Manutenção de equipamentos",
      "Documentação sanitária e habilitação em pregão",
    ],
    recursos: [
      "Profissionais habilitados, com registro ativo",
      "Alvará e licença sanitária",
      "Equipamento calibrado e com manutenção em dia",
      "Sistema de agenda e prontuário",
    ],
    parcerias: [
      "Laboratórios e clínicas de apoio",
      "Fornecedores de insumo e de manutenção",
      "Outros profissionais de saúde, para encaminhamento",
      "Contabilidade para habilitação em pregão",
    ],
    receitas: [
      "Consultas e procedimentos particulares",
      "Convênios e planos",
      "Contratos com o poder público (pregão)",
      "Manutenção e venda de equipamento",
    ],
    custos: [
      "Equipe e profissionais",
      "Insumos e descartáveis",
      "Aluguel e adequação do espaço",
      "Manutenção e calibração de equipamentos",
    ],
    documentos: [
      "Registro dos profissionais no conselho em dia",
      "Alvará de funcionamento e licença sanitária (vigilância sanitária)",
      "Plano de gerenciamento de resíduos de saúde",
      "Termos de consentimento e política de privacidade (LGPD: dado de saúde é dado sensível)",
      "Manutenção e calibração de equipamentos, com registro",
      "Certidões da empresa, se vender para o governo",
    ],
    execucao: {
      objetivo: "Atender com segurança, no horário combinado, e acompanhar depois.",
      passos: [
        "Confirmar o horário um dia antes e orientar o preparo",
        "Receber o paciente e conferir dados e consentimentos",
        "Realizar o atendimento seguindo o protocolo do serviço",
        "Explicar o resultado e os próximos passos em linguagem simples",
        "Registrar o atendimento no prontuário",
        "Higienizar o ambiente e os instrumentos conforme o protocolo",
        "Enviar as orientações e perguntar como a pessoa está depois",
      ],
      qualidade: [
        "A confirmação foi feita antes de todo horário",
        "Consentimento e prontuário estão preenchidos",
        "O retorno foi enviado no prazo combinado",
      ],
      erros: [
        "Atender sem conferir dados e consentimento",
        "Deixar a dúvida do paciente sem resposta",
        "Pular o registro por pressa",
      ],
    },
    indicadores: [
      "Faltas e cancelamentos (%)",
      "Ocupação da agenda",
      "Pacientes que voltam em 90 dias",
      "Nota nas avaliações",
    ],
    riscos: [
      "Publicidade fora das regras do conselho profissional (sem promessa de resultado e sem expor paciente)",
      "Vazamento de dado de saúde (LGPD)",
      "Agenda com horários vagos e faltas",
    ],
    hashtags: ["#saude", "#bemestar", "#clinica"],
    vendeParaGoverno: true,
    agendamento: true,
  },

  tecnologia: {
    id: "tecnologia",
    rotulo: "Tecnologia e TI",
    oQueVende: "software, infraestrutura e suporte de TI",
    entrega: "o sistema ou o suporte",
    tipoDeCliente: "quem depende de computador, sistema ou internet para trabalhar",
    clientes: [
      "Pequenas e médias empresas que precisam digitalizar processos",
      "Escritórios e comércios que precisam de suporte e de segurança dos dados",
      "Empresas com sistema antigo que precisam integrar ferramentas",
      "Órgãos públicos com contrato de TI (se o negócio participa)",
    ],
    dores: [
      "sistema que cai no pior momento",
      "dados que ficam só em um computador, sem cópia de segurança",
      "equipe perdendo tempo com planilha e retrabalho",
      "fornecedor que demora dias para responder",
    ],
    desejos: [
      "tecnologia que funciona sem ele precisar entender",
      "suporte rápido e com prazo combinado",
      "dados protegidos e com cópia de segurança",
    ],
    gatilhos: [
      "um problema que parou a operação",
      "a empresa cresceu e a planilha não dá mais conta",
      "um susto com vírus, perda de dados ou golpe",
      "a necessidade de vender online ou de emitir nota por sistema",
    ],
    provas: [
      "antes e depois de um processo automatizado, sem dados do cliente",
      "captura de tela de um painel ou relatório de exemplo",
      "lista de ferramentas e certificações que o dono domina",
      "tempo médio de resposta do suporte, se for medido",
    ],
    dicas: [
      {
        titulo: "Cópia de segurança em quatro passos",
        pontos: [
          "Escolha o que não pode ser perdido (financeiro, clientes, arquivos)",
          "Faça a cópia em outro lugar, não no mesmo computador",
          "Programe para rodar sozinha, toda semana ou todo dia",
          "Teste restaurar uma vez por mês",
        ],
      },
      {
        titulo: "Senhas e acessos da empresa",
        pontos: [
          "Use uma senha diferente para cada serviço",
          "Ative a verificação em duas etapas nas contas importantes",
          "Remova o acesso de quem saiu da empresa no mesmo dia",
          "Guarde as senhas em um gerenciador, não em papel solto",
        ],
      },
      {
        titulo: "Quando vale automatizar uma tarefa",
        pontos: [
          "Ela se repete toda semana ou todo dia",
          "Sempre segue as mesmas regras",
          "Erra quando é feita na correria",
          "Consome mais de uma hora por semana",
        ],
      },
    ],
    mitos: [
      {
        mito: "Minha empresa é pequena demais para ser alvo de golpe",
        verdade:
          "Golpes costumam ser automáticos e atingem quem tem proteção fraca, independentemente do tamanho. Medidas básicas já reduzem muito o risco.",
      },
      {
        mito: "Sistema bom é sistema caro",
        verdade:
          "O certo é o que cabe no processo e no bolso do negócio. Muitas empresas começam com ferramentas simples e crescem para outras.",
      },
    ],
    perguntas: [
      "Qual tarefa ou sistema mais atrapalha a sua rotina hoje?",
      "O que acontece quando esse problema aparece?",
      "Hoje quem cuida da tecnologia da empresa?",
      "Existe uma cópia de segurança dos seus dados?",
    ],
    objecoes: [
      {
        objecao: "Meu sobrinho já resolve isso para mim.",
        resposta:
          "Que bom ter alguém de confiança. Posso complementar: documentar o que existe, fazer a cópia de segurança e ficar de plantão quando ele não puder.",
      },
      {
        objecao: "Prefiro pagar só quando der problema.",
        resposta:
          "Entendo. O ponto é que um problema costuma parar a operação por horas ou dias. Um plano de suporte básico custa menos que um dia parado.",
      },
    ],
    canais: [
      "Indicação de contadores, comércios e clientes atuais",
      "Perfil da Empresa no Google",
      "LinkedIn e Instagram com casos e dicas curtas",
      "Grupos de empresários e associação comercial",
    ],
    atividadesChave: [
      "Desenvolvimento e sustentação de sistemas",
      "Infraestrutura, redes e cópias de segurança",
      "Suporte técnico com prazo de atendimento",
      "Integração entre ferramentas",
      "Documentação e treinamento do cliente",
    ],
    recursos: [
      "Equipe técnica e ambiente de desenvolvimento",
      "Infraestrutura de servidor ou nuvem",
      "Portfólio de casos entregues",
      "Ferramenta de chamados ou de suporte",
    ],
    parcerias: [
      "Revendas de hardware e de licenças",
      "Provedores de nuvem e de internet",
      "Contadores e consultorias que indicam clientes",
      "Outros desenvolvedores, para picos de demanda",
    ],
    receitas: [
      "Contrato mensal de suporte ou sustentação",
      "Projeto fechado por escopo",
      "Licenças e revenda de software",
      "Treinamento e consultoria pontual",
    ],
    custos: [
      "Salários e pró-labore",
      "Servidores, nuvem e licenças",
      "Ferramentas de suporte e monitoramento",
      "Atualização e certificações da equipe",
    ],
    documentos: [
      "Contrato de suporte com escopo, prazo de atendimento e valor",
      "Termo de confidencialidade e acesso aos sistemas do cliente",
      "Política de privacidade e tratamento de dados (LGPD)",
      "Inventário de licenças e de acessos por cliente",
      "Plano de cópia de segurança e de recuperação, por cliente",
    ],
    execucao: {
      objetivo: "Resolver o chamado dentro do prazo e deixar tudo documentado.",
      passos: [
        "Registrar o chamado com quem pediu, o que aconteceu e o quanto afeta a operação",
        "Classificar a urgência e informar o prazo de atendimento",
        "Reproduzir o problema e identificar a causa",
        "Aplicar a correção e testar com o cliente",
        "Documentar o que foi feito e como evitar de novo",
        "Encerrar o chamado e confirmar que o cliente está atendido",
      ],
      qualidade: [
        "O prazo informado foi cumprido",
        "O cliente confirmou que voltou a funcionar",
        "A solução ficou registrada para a próxima vez",
      ],
      erros: [
        "Mexer em produção sem cópia de segurança",
        "Resolver sem registrar",
        "Prometer prazo sem avaliar o problema",
      ],
    },
    indicadores: [
      "Tempo médio de primeira resposta",
      "Chamados resolvidos no prazo (%)",
      "Receita recorrente mensal",
      "Clientes que renovam o contrato (%)",
    ],
    riscos: [
      "Viver de projeto avulso, sem receita recorrente",
      "Dependência de uma pessoa que concentra todo o conhecimento",
      "Vazamento ou perda de dados de clientes (LGPD)",
    ],
    hashtags: ["#tecnologia", "#ti", "#automacao"],
    vendeParaGoverno: true,
    agendamento: false,
  },

  alimentacao: {
    id: "alimentacao",
    rotulo: "Alimentação",
    oQueVende: "refeições, lanches e fornecimento de alimentos",
    entrega: "o pedido",
    tipoDeCliente: "quem quer comer bem sem perder tempo",
    clientes: [
      "Moradores e trabalhadores da região",
      "Empresas com refeitório ou que pedem refeição para a equipe",
      "Escolas e instituições, por contrato de fornecimento (se o negócio participa)",
      "Quem encomenda para eventos e datas especiais",
    ],
    dores: [
      "comida que chega fria ou atrasada",
      "cardápio e preço difíceis de descobrir",
      "pedido errado e ninguém para resolver",
      "falta de opção para quem tem restrição alimentar",
    ],
    desejos: [
      "comida boa, no horário e no preço combinado",
      "pedir de forma simples, pelo celular",
      "confiança de que o local é limpo e cuidadoso",
    ],
    gatilhos: [
      "a hora do almoço ou do jantar",
      "um evento ou comemoração para organizar",
      "uma dieta ou restrição que exige opção específica",
      "a empresa que precisa alimentar a equipe",
    ],
    provas: [
      "fotos reais dos pratos, com boa luz",
      "vídeo curto do preparo ou da cozinha organizada",
      "avaliações de clientes (com autorização)",
      "alvará e boas práticas à vista",
    ],
    dicas: [
      {
        titulo: "Como pedir uma encomenda sem estresse",
        pontos: [
          "Combine data, horário e local com antecedência",
          "Informe o número de pessoas e as restrições alimentares",
          "Peça o valor e as condições por escrito",
          "Confirme o pedido um dia antes",
        ],
      },
      {
        titulo: "Como conservar a comida em casa",
        pontos: [
          "Guarde na geladeira em até duas horas depois de pronto",
          "Separe em porções pequenas",
          "Reaqueça só a quantidade que vai comer",
          "Identifique com a data de preparo",
        ],
      },
      {
        titulo: "Como escolher onde pedir",
        pontos: [
          "Veja fotos reais e avaliações recentes",
          "Confira o horário e a taxa de entrega",
          "Pergunte sobre ingredientes se tiver alergia",
          "Prefira quem confirma o pedido antes de preparar",
        ],
      },
    ],
    mitos: [
      {
        mito: "Comida de marmita é sempre a mesma coisa",
        verdade:
          "Um cardápio que muda durante a semana, com opções leves e completas, mantém a variedade sem aumentar muito o custo.",
      },
      {
        mito: "Caseiro quer dizer sem regras sanitárias",
        verdade:
          "Quem vende alimento precisa seguir regras de higiene e ter as licenças do município. Pergunte pelo cuidado com o preparo.",
      },
    ],
    perguntas: [
      "Para quantas pessoas e para qual dia?",
      "Alguém tem alergia ou restrição alimentar?",
      "Prefere retirar ou receber em casa?",
      "Existe um valor por pessoa que você gostaria de respeitar?",
    ],
    objecoes: [
      {
        objecao: "Está mais caro que o restaurante da esquina.",
        resposta:
          "Posso mostrar o que está incluso, como porção, ingredientes e entrega. Se preferir, monto uma opção mais enxuta que caiba no seu valor.",
      },
      {
        objecao: "Vou ver com o pessoal e te falo.",
        resposta:
          "Combinado. Para não perder a data, me avise até um dia antes, que é o que eu preciso para garantir o preparo.",
      },
    ],
    canais: [
      "WhatsApp com o cardápio do dia",
      "Instagram com fotos reais e vídeos curtos",
      "Perfil da Empresa no Google",
      "Indicação de empresas e de quem organiza eventos",
    ],
    atividadesChave: [
      "Compra e armazenamento de ingredientes",
      "Produção e preparo",
      "Embalagem e entrega",
      "Controle sanitário e rastreabilidade",
      "Atendimento e gestão de pedidos",
    ],
    recursos: [
      "Cozinha adequada e licenciada",
      "Equipe de produção",
      "Equipamento de frio e de cocção",
      "Embalagens e meio de entrega",
    ],
    parcerias: [
      "Produtores e fornecedores locais",
      "Empresas e escolas que contratam o fornecimento",
      "Entregadores e plataformas de pedido",
      "Contabilidade para licitação, se participar",
    ],
    receitas: [
      "Venda direta ao consumidor",
      "Contrato de fornecimento para empresas ou escolas",
      "Eventos e encomendas",
      "Assinaturas semanais de marmita",
    ],
    custos: [
      "Ingredientes e embalagens",
      "Equipe de cozinha e entrega",
      "Gás, energia e água",
      "Taxas de plataformas e de cartão",
    ],
    documentos: [
      "Alvará de funcionamento do município",
      "Licença sanitária (vigilância sanitária)",
      "Manual de boas práticas e registros de limpeza e temperatura",
      "Curso de manipulação de alimentos da equipe, quando exigido",
      "Ficha técnica das receitas, com custo por porção",
      "Certidões da empresa, se vender para escolas ou governo",
    ],
    execucao: {
      objetivo: "Entregar o pedido certo, no horário, com segurança alimentar.",
      passos: [
        "Receber o pedido e confirmar itens, horário, endereço e restrições",
        "Separar e conferir os ingredientes na ficha técnica",
        "Preparar seguindo o padrão de higiene e de temperatura",
        "Embalar identificando o pedido e a data",
        "Conferir o pedido antes de entregar ou de liberar para retirada",
        "Entregar ou deixar pronto para retirada no horário combinado",
        "Perguntar como foi e registrar reclamação ou elogio",
      ],
      qualidade: [
        "O pedido saiu conferido item por item",
        "A temperatura e a higiene foram registradas",
        "O cliente recebeu no horário combinado",
      ],
      erros: [
        "Aceitar pedido sem confirmar os itens",
        "Preparar sem ficha técnica, sem saber o custo da porção",
        "Não registrar reclamações",
      ],
    },
    indicadores: [
      "Pedidos por dia",
      "Ticket médio",
      "Pedidos entregues no horário (%)",
      "Custo por prato em relação ao preço",
    ],
    riscos: [
      "Margem apertada com a variação do preço dos ingredientes",
      "Problema sanitário que afeta a reputação",
      "Dependência de uma plataforma que cobra comissão",
    ],
    hashtags: ["#alimentacao", "#comidaboa", "#delivery"],
    vendeParaGoverno: true,
    agendamento: false,
  },

  comercio: {
    id: "comercio",
    rotulo: "Comércio",
    oQueVende: "produtos com estoque próprio",
    entrega: "o produto",
    tipoDeCliente: "quem quer encontrar o que precisa perto de casa",
    clientes: [
      "Moradores do bairro e da cidade",
      "Empresas e instituições que compram em volume",
      "Revendedores e parceiros",
      "Órgãos públicos, por fornecimento (se o negócio participa)",
    ],
    dores: [
      "produto em falta justamente quando precisa",
      "preço difícil de comparar",
      "demora no atendimento ou na troca",
      "não saber se a loja tem o item antes de ir até lá",
    ],
    desejos: [
      "encontrar o produto certo, no preço justo",
      "atendimento rápido e troca sem burocracia",
      "saber o que tem em estoque sem sair de casa",
    ],
    gatilhos: [
      "uma necessidade do dia a dia",
      "uma data comemorativa",
      "um item que acabou ou quebrou",
      "a reposição periódica da empresa",
    ],
    provas: [
      "fotos reais dos produtos e da vitrine",
      "vídeo curto mostrando uma novidade",
      "avaliações de clientes, com autorização",
      "política de troca à vista e por escrito",
    ],
    dicas: [
      {
        titulo: "Como comparar preços sem cair em armadilha",
        pontos: [
          "Compare o mesmo produto, marca e quantidade",
          "Some frete, taxas e garantia",
          "Veja a política de troca antes de comprar",
          "Guarde a nota fiscal",
        ],
      },
      {
        titulo: "Como economizar na reposição",
        pontos: [
          "Anote o que acaba todo mês",
          "Compre em maior quantidade o que tem giro",
          "Pergunte por condição para compra recorrente",
          "Evite estocar o que vence ou sai de linha",
        ],
      },
      {
        titulo: "Como cuidar bem do que você comprou",
        pontos: [
          "Leia as instruções de uso e de conservação",
          "Guarde embalagem e nota nos primeiros dias",
          "Em caso de problema, procure a loja logo",
          "Peça orientação de manutenção na compra",
        ],
      },
    ],
    mitos: [
      {
        mito: "Comprar de loja pequena é sempre mais caro",
        verdade:
          "Loja local costuma ter condição para quem compra recorrente e atendimento próximo. Vale pedir orçamento antes de decidir.",
      },
      {
        mito: "Não precisa guardar a nota fiscal",
        verdade:
          "A nota é a base da troca e da garantia. Sem ela, resolver um problema fica bem mais difícil.",
      },
    ],
    perguntas: [
      "O que você está procurando e para qual uso?",
      "Tem preferência de marca ou de faixa de preço?",
      "Precisa para quando?",
      "Prefere retirar na loja ou receber em casa?",
    ],
    objecoes: [
      {
        objecao: "Achei mais barato na internet.",
        resposta:
          "Compare o frete, o prazo e a troca. Se quiser, me mostre o anúncio e eu vejo o que consigo fazer, além da garantia de ter a loja perto.",
      },
      {
        objecao: "Vou pensar e volto depois.",
        resposta:
          "Claro. Posso anotar o que você viu e te avisar se houver condição especial ou reposição do item.",
      },
    ],
    canais: [
      "Vitrine física e indicação de clientes",
      "WhatsApp Business com catálogo",
      "Instagram com novidades e preços",
      "Perfil da Empresa no Google com horário, fotos e avaliações",
    ],
    atividadesChave: [
      "Compra e gestão de estoque",
      "Atendimento e venda",
      "Exposição e organização da loja",
      "Pós-venda e troca",
      "Cotação e proposta para fornecimento em volume",
    ],
    recursos: [
      "Estoque e ponto comercial",
      "Sistema de caixa e de estoque",
      "Equipe de atendimento",
      "Relacionamento com fornecedores",
    ],
    parcerias: [
      "Distribuidores e representantes",
      "Transportadoras e entregadores locais",
      "Marcas parceiras, para materiais e treinamento",
      "Outros comércios da região, para ações em conjunto",
    ],
    receitas: [
      "Margem sobre a venda no balcão",
      "Venda por WhatsApp e redes sociais",
      "Fornecimento recorrente para empresas",
      "Serviços associados (instalação, entrega)",
    ],
    custos: [
      "Compra de mercadoria",
      "Aluguel e contas fixas",
      "Salários e comissões",
      "Taxas de cartão e de plataformas",
    ],
    documentos: [
      "Alvará de funcionamento do município",
      "Emissão de nota fiscal em dia",
      "Política de troca e de garantia por escrito",
      "Controle de estoque e inventário periódico",
      "Termo de consentimento para cadastro de clientes (LGPD)",
    ],
    execucao: {
      objetivo: "Atender bem, vender e deixar a pós-venda resolvida.",
      passos: [
        "Receber o cliente e entender o que ele precisa antes de oferecer",
        "Apresentar até três opções, com preço e diferença entre elas",
        "Confirmar disponibilidade em estoque e prazo de entrega",
        "Fechar a venda, emitir a nota e explicar a política de troca",
        "Embalar e entregar ou deixar separado para retirada",
        "Anotar o contato e perguntar se pode avisar de novidades",
        "Dar retorno em até alguns dias para saber se está tudo certo",
      ],
      qualidade: [
        "O cliente saiu sabendo a política de troca",
        "A nota foi emitida",
        "O contato foi registrado com autorização",
      ],
      erros: [
        "Oferecer sem perguntar a necessidade",
        "Prometer prazo sem checar o estoque",
        "Não registrar quem comprou",
      ],
    },
    indicadores: [
      "Vendas por dia e ticket médio",
      "Giro dos itens principais",
      "Clientes que voltam (%)",
      "Produtos parados há mais de 90 dias",
    ],
    riscos: [
      "Estoque parado enquanto falta o que mais vende",
      "Concorrência de preço de grandes lojas e da internet",
      "Dependência de poucos fornecedores",
    ],
    hashtags: ["#comerciolocal", "#loja", "#compreperto"],
    vendeParaGoverno: true,
    agendamento: false,
  },

  servico: {
    id: "servico",
    rotulo: "Prestação de serviços",
    oQueVende: "serviços especializados sob demanda",
    entrega: "o serviço",
    tipoDeCliente: "quem precisa de um serviço bem feito e de confiança",
    clientes: [
      "Moradores e famílias da região",
      "Pequenas empresas e comércios locais",
      "Condomínios e instituições",
      "Órgãos públicos, por contrato de serviço (se o negócio participa)",
    ],
    dores: [
      "profissional que não aparece ou não avisa",
      "serviço sem preço combinado antes",
      "trabalho que precisa ser refeito",
      "dificuldade para encontrar alguém de confiança",
    ],
    desejos: [
      "preço e prazo combinados antes de começar",
      "serviço bem feito na primeira vez",
      "alguém que responda e cumpra o combinado",
    ],
    gatilhos: [
      "um problema que precisa ser resolvido logo",
      "uma mudança, reforma ou data importante",
      "uma indicação de alguém de confiança",
      "a necessidade de manutenção periódica",
    ],
    provas: [
      "fotos de trabalhos entregues, com autorização",
      "depoimento curto de um cliente",
      "valores e prazos de exemplo, se o dono quiser divulgar",
      "documentos e registros profissionais à vista, quando houver",
    ],
    dicas: [
      {
        titulo: "Como contratar um serviço com segurança",
        pontos: [
          "Peça o valor e o prazo por escrito antes de começar",
          "Pergunte o que está incluso e o que é cobrado à parte",
          "Veja trabalhos anteriores ou peça referências",
          "Combine como será o pagamento",
        ],
      },
      {
        titulo: "O que combinar antes do serviço",
        pontos: [
          "Dia, horário e quem vai atender",
          "O que o cliente precisa deixar preparado",
          "Como será o aviso em caso de imprevisto",
          "O que acontece se algo sair diferente do combinado",
        ],
      },
      {
        titulo: "Como pedir orçamento certo",
        pontos: [
          "Descreva o problema com detalhes e fotos",
          "Informe o prazo que você precisa",
          "Diga o valor que cabe no seu orçamento",
          "Compare itens, não só o preço final",
        ],
      },
    ],
    mitos: [
      {
        mito: "Serviço informal é sempre mais barato e igual",
        verdade:
          "Quem trabalha de forma organizada oferece nota, garantia e um combinado por escrito. Isso protege você se algo sair errado.",
      },
      {
        mito: "O orçamento só pode ser dado depois de ver o local",
        verdade:
          "Com fotos e boa descrição, muitos serviços têm uma estimativa inicial. A visita confirma o valor final.",
      },
    ],
    perguntas: [
      "O que precisa ser feito e onde?",
      "Para quando você precisa?",
      "Já tem uma ideia de valor?",
      "É a primeira vez que contrata esse tipo de serviço?",
    ],
    objecoes: [
      {
        objecao: "Está mais caro que o outro profissional.",
        resposta:
          "Vale comparar o que está incluso: material, prazo, garantia e nota. Posso detalhar o orçamento item por item, para você decidir com clareza.",
      },
      {
        objecao: "Vou pensar e te aviso.",
        resposta:
          "Claro, sem pressa. Para eu não te deixar sem resposta, me diz o que falta para você decidir: valor, prazo ou outra dúvida?",
      },
    ],
    canais: [
      "Indicação de clientes satisfeitos",
      "Perfil da Empresa no Google com avaliações",
      "WhatsApp Business com respostas rápidas",
      "Instagram com fotos de trabalhos entregues",
    ],
    atividadesChave: [
      "Atendimento e orçamento",
      "Agendamento e execução do serviço",
      "Controle de material e de ferramentas",
      "Pós-serviço e pedido de avaliação",
    ],
    recursos: [
      "Equipe técnica ou o próprio dono",
      "Ferramentas e equipamentos de trabalho",
      "Veículo ou meio de deslocamento",
      "Portfólio de trabalhos entregues",
    ],
    parcerias: [
      "Fornecedores de material e de peças",
      "Outros profissionais complementares",
      "Lojas e profissionais que indicam clientes",
      "Contador para organizar a formalização",
    ],
    receitas: [
      "Serviço por hora ou por escopo",
      "Contrato de manutenção recorrente",
      "Pacotes fechados",
      "Venda de material junto com o serviço",
    ],
    custos: [
      "Material e peças",
      "Combustível e deslocamento",
      "Ferramentas e manutenção",
      "Impostos e taxas do negócio",
    ],
    documentos: [
      "CNPJ ativo e enquadramento correto (confirmar com o contador)",
      "Alvará de funcionamento, quando exigido pelo município",
      "Modelo de orçamento e de contrato simples por escrito",
      "Registro profissional ou habilitação, quando a atividade exige",
      "Termo de consentimento para guardar contato dos clientes (LGPD)",
    ],
    execucao: {
      objetivo: "Entregar o serviço combinado, no prazo, e deixar o cliente satisfeito.",
      passos: [
        "Confirmar data, horário e endereço um dia antes",
        "Chegar com ferramentas e material conferidos",
        "Repassar com o cliente o que será feito e o valor combinado",
        "Executar o serviço seguindo o padrão de qualidade",
        "Testar e mostrar o resultado ao cliente",
        "Limpar o local e recolher o material",
        "Combinar o pagamento, emitir o comprovante e pedir a avaliação",
      ],
      qualidade: [
        "O resultado foi mostrado e aprovado pelo cliente",
        "O local ficou limpo",
        "Valor e prazo seguiram o combinado",
      ],
      erros: [
        "Começar sem alinhar valor e escopo",
        "Mudar o combinado no meio sem avisar",
        "Esquecer de pedir a avaliação",
      ],
    },
    indicadores: [
      "Orçamentos pedidos por semana",
      "Orçamentos que viram serviço (%)",
      "Serviços refeitos ou com reclamação",
      "Clientes que contratam de novo ou indicam",
    ],
    riscos: [
      "Depender só de indicação e não saber de onde vem o próximo cliente",
      "Agenda irregular, com semanas cheias e semanas vazias",
      "Serviço refeito por falha de alinhamento",
    ],
    hashtags: ["#servicos", "#profissionallocal", "#orcamento"],
    vendeParaGoverno: true,
    agendamento: true,
  },

  outro: {
    id: "outro",
    rotulo: "Negócio local",
    oQueVende: "produtos e serviços para a região",
    entrega: "o atendimento",
    tipoDeCliente: "quem procura uma solução de confiança perto de casa",
    clientes: [
      "Moradores e clientes da região",
      "Empresas e parceiros locais",
      "Clientes que chegam por indicação",
    ],
    dores: [
      "dificuldade de saber se o negócio é confiável",
      "falta de informação clara sobre preço e prazo",
      "demora para conseguir resposta",
      "pouca opção de contato fora do horário comercial",
    ],
    desejos: [
      "informação clara e atendimento rápido",
      "preço e prazo combinados",
      "alguém de confiança perto de casa",
    ],
    gatilhos: [
      "uma necessidade que surgiu",
      "indicação de alguém conhecido",
      "uma busca na internet pela cidade",
    ],
    provas: [
      "fotos reais do negócio e do trabalho",
      "depoimentos de clientes, com autorização",
      "tempo de atuação e especialidades, se o dono quiser divulgar",
    ],
    dicas: [
      {
        titulo: "Como escolher um fornecedor local",
        pontos: [
          "Peça indicações e confira avaliações",
          "Combine preço e prazo por escrito",
          "Confira como funciona a garantia ou a troca",
          "Observe se respondem rápido e com clareza",
        ],
      },
      {
        titulo: "Como pedir um orçamento",
        pontos: [
          "Explique o que precisa com detalhes",
          "Informe o prazo desejado",
          "Compare o que está incluso, não só o valor",
        ],
      },
      {
        titulo: "Como valorizar o comércio da sua cidade",
        pontos: [
          "Avalie os negócios que atenderam bem",
          "Indique para quem precisa",
          "Compartilhe o que gostou nas redes",
        ],
      },
    ],
    mitos: [
      {
        mito: "Negócio pequeno não tem o mesmo cuidado",
        verdade:
          "Quem atende de perto costuma cuidar de cada cliente, porque a reputação na cidade depende disso.",
      },
      {
        mito: "Só vale a pena pedir orçamento em vários lugares",
        verdade:
          "Comparar ajuda, mas o melhor é comparar com os mesmos itens e conversar sobre o que muda em cada proposta.",
      },
    ],
    perguntas: [
      "O que você precisa e para quando?",
      "Já conhece ou já contratou esse tipo de serviço antes?",
      "Existe um valor que você gostaria de respeitar?",
      "Como prefere ser atendido: WhatsApp, ligação ou presencial?",
    ],
    objecoes: [
      {
        objecao: "Está caro.",
        resposta:
          "Posso mostrar o que está incluso e, se precisar, montar uma opção que caiba melhor no seu valor.",
      },
      {
        objecao: "Vou pensar.",
        resposta:
          "Claro. Me diga o que falta para você decidir e eu já te mando as informações certas.",
      },
    ],
    canais: [
      "Indicação de clientes",
      "Perfil da Empresa no Google",
      "WhatsApp Business",
      "Instagram com fotos e novidades",
    ],
    atividadesChave: [
      "Atendimento e relacionamento",
      "Entrega do que foi vendido",
      "Divulgação e presença digital",
      "Gestão financeira e administrativa",
    ],
    recursos: [
      "Equipe e conhecimento do dono",
      "Ferramentas de trabalho",
      "Base de clientes",
      "Presença no Google e nas redes",
    ],
    parcerias: [
      "Fornecedores confiáveis",
      "Outros negócios locais, para indicação mútua",
      "Contador",
    ],
    receitas: [
      "Venda direta",
      "Contratos recorrentes",
      "Serviços avulsos",
    ],
    custos: [
      "Equipe e pró-labore",
      "Insumos ou mercadoria",
      "Aluguel e contas fixas",
      "Impostos e taxas",
    ],
    documentos: [
      "CNPJ ativo e enquadramento correto (confirmar com o contador)",
      "Alvará de funcionamento, quando exigido pelo município",
      "Modelo de orçamento por escrito",
      "Termo de consentimento para guardar contato dos clientes (LGPD)",
    ],
    execucao: {
      objetivo: "Atender de forma padronizada, do primeiro contato ao pós-venda.",
      passos: [
        "Responder o contato e entender o que o cliente precisa",
        "Informar valor, prazo e forma de pagamento",
        "Confirmar o combinado por escrito",
        "Entregar o que foi vendido",
        "Conferir se o cliente ficou satisfeito",
        "Registrar o contato, com autorização, para o relacionamento futuro",
      ],
      qualidade: [
        "O cliente recebeu valor e prazo por escrito",
        "A entrega seguiu o combinado",
        "O contato foi registrado",
      ],
      erros: [
        "Deixar o cliente sem resposta",
        "Combinar só de boca",
        "Esquecer o pós-venda",
      ],
    },
    indicadores: [
      "Contatos recebidos por semana",
      "Contatos que viram venda (%)",
      "Clientes que voltam ou indicam",
    ],
    riscos: [
      "Crescer sem processo definido",
      "Depender de poucas pessoas ou de poucos clientes",
      "Presença digital fraca perto da qualidade do que entrega",
    ],
    hashtags: ["#negociolocal", "#empreendedorismo", "#apoielocal"],
    vendeParaGoverno: false,
    agendamento: false,
  },
};
