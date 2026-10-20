import type { Segmento } from "@/lib/db/types";
import type { PerfilMercado } from "../tipos";

/**
 * Nichos do comércio e dos serviços de bairro — o que o cadastro de 8
 * segmentos não separa. Quem escolhe "Prestador de Serviço" pode ser
 * cabeleireira, eletricista ou professora de reforço, e o material tem de
 * falar com o cliente de cada um. O nicho é detectado por palavras no nome
 * do negócio e nas ofertas que o dono publicou (ver `mercado/index.ts`).
 *
 * Mesmas regras de escrita de `segmentos.ts`: comprador × dono, nada de
 * promessa de resultado, `provas` são instruções e a parte regulatória é
 * sempre "confirmar com o contador ou o órgão competente".
 */

export interface Nicho {
  perfil: PerfilMercado;
  /** segmentos do cadastro em que o nicho pode aparecer */
  segmentos: readonly Segmento[];
  /** palavras (sem acento, minúsculas) que denunciam o nicho no nome e nas ofertas */
  palavras: RegExp;
}

export const NICHOS: readonly Nicho[] = [
  {
    segmentos: ["servico", "saude", "comercio", "outro"],
    palavras:
      /salao|barbearia|barbeiro|cabelei|cabelo|estetica|manicure|\bnail|sobrancelha|maquiagem|depila|beleza|\bhair\b|corte (feminino|masculino|infantil|de cabelo)|escova|\bunhas?\b|coloracao|mechas|progressiva|penteado/,
    perfil: {
      id: "beleza",
      rotulo: "Beleza e estética",
      oQueVende: "cortes, tratamentos e serviços de beleza",
      entrega: "o atendimento",
      tipoDeCliente: "quem quer se cuidar sem perder tempo",
      clientes: [
        "Moradores do bairro que frequentam o salão toda semana ou todo mês",
        "Noivas, formandas e quem tem uma ocasião especial",
        "Quem procura um profissional de confiança depois de uma experiência ruim",
        "Empresas e equipes que contratam serviços em pacote",
      ],
      dores: [
        "agenda que não encaixa na rotina",
        "resultado diferente do que foi combinado",
        "espera longa mesmo com horário marcado",
        "preço que muda sem aviso",
      ],
      desejos: [
        "sair do jeito que combinou",
        "horário respeitado",
        "saber o preço antes de começar",
        "higiene e produtos de confiança",
      ],
      gatilhos: [
        "uma ocasião especial chegando",
        "vontade de mudar o visual",
        "indicação de uma amiga",
        "cabelo ou unha que precisa de manutenção",
      ],
      provas: [
        "fotos de antes e depois, com autorização da cliente",
        "vídeo curto de uma transformação",
        "avaliações no Perfil da Empresa no Google",
        "certificados de cursos e das marcas de produtos usadas",
      ],
      dicas: [
        {
          titulo: "Como manter o cabelo bonito entre uma visita e outra",
          pontos: [
            "Use xampu e condicionador indicados para o seu tipo de fio",
            "Evite água muito quente",
            "Proteja do sol e do calor da chapinha",
            "Faça a hidratação no intervalo indicado pelo profissional",
          ],
        },
        {
          titulo: "Como se preparar para o dia da noiva",
          pontos: [
            "Faça um teste de cabelo e maquiagem antes",
            "Leve fotos de referência",
            "Combine o horário com folga",
            "Avise sobre alergias a produtos",
          ],
        },
        {
          titulo: "Como pedir o corte que você imagina",
          pontos: [
            "Leve duas ou três fotos",
            "Explique o que você não quer mudar",
            "Pergunte se combina com o seu tipo de cabelo",
            "Combine o valor antes de começar",
          ],
        },
      ],
      mitos: [
        {
          mito: "Cortar o cabelo faz crescer mais rápido",
          verdade:
            "O ritmo de crescimento não muda. O corte tira as pontas danificadas e deixa o fio com melhor aparência.",
        },
        {
          mito: "Química sempre estraga o cabelo",
          verdade:
            "Quando bem indicada e feita por profissional, com os cuidados certos, o resultado pode ser saudável. O essencial é avaliar o fio antes.",
        },
      ],
      perguntas: [
        "Qual serviço você quer fazer?",
        "Você já tem uma referência de como quer ficar?",
        "Tem alguma alergia ou sensibilidade a produtos?",
        "Qual o melhor dia e horário para você?",
      ],
      objecoes: [
        {
          objecao: "Vou fazer em outro lugar, mais barato.",
          resposta:
            "Entendo. Se quiser, explico o que está incluído no valor: produtos, tempo e acompanhamento. Podemos ver também um serviço que caiba no que você tem.",
        },
        {
          objecao: "Tenho medo de não ficar como eu quero.",
          resposta:
            "Por isso a gente conversa antes e olha as suas referências. Se ainda tiver dúvida, podemos fazer uma avaliação rápida antes de você decidir.",
        },
      ],
      canais: [
        "Instagram com antes e depois e vídeos curtos",
        "WhatsApp com agenda e lembrete",
        "Perfil da Empresa no Google com fotos e avaliações",
        "Parcerias com lojas de noivas, fotógrafos e organizadores de eventos",
      ],
      atividadesChave: [
        "Atendimento e execução dos serviços",
        "Agenda e confirmação de horários",
        "Controle de produtos e de validade",
        "Divulgação dos trabalhos e relacionamento com as clientes",
        "Capacitação e atualização de técnicas",
      ],
      recursos: [
        "Profissionais com técnica e portfólio",
        "Espaço, cadeiras e equipamentos",
        "Produtos de boa qualidade",
        "Agenda organizada",
      ],
      parcerias: [
        "Fornecedores de produtos profissionais",
        "Fotógrafos, lojas de noivas e organizadores de eventos",
        "Outros profissionais da beleza, para indicação mútua",
        "Escolas e cursos de capacitação",
      ],
      receitas: [
        "Serviços avulsos",
        "Pacotes e assinaturas mensais",
        "Venda de produtos",
        "Atendimento para eventos",
      ],
      custos: [
        "Produtos e descartáveis",
        "Aluguel do espaço ou cota de cadeira",
        "Comissões sobre os serviços, quando há profissionais parceiros",
        "Água, luz e manutenção de equipamentos",
      ],
      documentos: [
        "CNPJ ou MEI ativo e enquadramento correto (confirmar com o contador)",
        "Alvará de funcionamento e licença sanitária do município, quando exigidos",
        "Registro de esterilização dos instrumentos",
        "Ficha de anamnese e termo de consentimento por cliente (LGPD)",
        "Contrato com os profissionais que atendem no espaço (confirmar o modelo com o contador)",
      ],
      execucao: {
        objetivo: "Entregar o serviço combinado, no horário, com higiene e segurança.",
        passos: [
          "Confirmar o horário um dia antes",
          "Receber a cliente e confirmar o que será feito, o valor e o tempo",
          "Conferir alergias e fazer o teste quando necessário",
          "Executar o serviço seguindo o padrão de higiene",
          "Mostrar o resultado e ajustar o que foi combinado",
          "Orientar os cuidados em casa e sugerir o retorno",
          "Registrar a ficha e pedir a avaliação",
        ],
        qualidade: [
          "Instrumentos higienizados e registrados",
          "Resultado aprovado pela cliente antes de finalizar",
          "Retorno agendado ou oferecido",
        ],
        erros: [
          "Começar sem alinhar o resultado esperado",
          "Atrasar o horário sem avisar",
          "Não registrar a ficha da cliente",
        ],
      },
      indicadores: [
        "Atendimentos por semana",
        "Ocupação da agenda (%)",
        "Faltas e cancelamentos",
        "Clientes que voltam em até 45 dias",
      ],
      riscos: [
        "Agenda com buracos e faltas",
        "Clientes concentrados em uma única profissional",
        "Reação alérgica sem registro de ficha",
      ],
      hashtags: ["#beleza", "#salao", "#autoestima"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "saude", "comercio", "outro"],
    palavras: /\bpet\b|petshop|pet shop|veterin|tosa|racao|canil|gatil|animais/,
    perfil: {
      id: "pet",
      rotulo: "Pet shop e cuidado animal",
      oQueVende: "banho, tosa, produtos e cuidados para animais de estimação",
      entrega: "o atendimento",
      tipoDeCliente: "quem trata o animal como parte da família",
      clientes: [
        "Tutores que moram perto e precisam de banho, tosa e ração com frequência",
        "Quem acabou de adotar e precisa de orientação",
        "Tutores que trabalham o dia todo e precisam de busca e entrega",
        "Condomínios e criadores da região",
      ],
      dores: [
        "medo de deixar o animal com quem não conhece",
        "demora para buscar ou para avisar que ficou pronto",
        "falta de um produto específico na hora",
        "dúvida sobre o que o animal pode comer ou usar",
      ],
      desejos: [
        "ver o animal bem cuidado e feliz",
        "receber foto e aviso quando termina",
        "orientação de quem entende",
      ],
      gatilhos: [
        "o animal está sujo, com pelo grande ou com cheiro",
        "acabou a ração",
        "viagem ou rotina que exige alguém para cuidar",
        "um filhote novo em casa",
      ],
      provas: [
        "fotos do animal antes e depois, com autorização do tutor",
        "vídeo curto do espaço limpo e organizado",
        "avaliações de tutores no Google",
        "cursos e formação da equipe à vista",
      ],
      dicas: [
        {
          titulo: "Com que frequência dar banho no seu animal",
          pontos: [
            "Depende do porte, do pelo e do estilo de vida",
            "Use produtos próprios para animais",
            "Seque bem, principalmente orelhas e dobrinhas",
            "Pergunte ao veterinário se houver pele sensível",
          ],
        },
        {
          titulo: "Chegada de um filhote em casa",
          pontos: [
            "Prepare cama, comedouro e brinquedos antes",
            "Marque a consulta com o veterinário nos primeiros dias",
            "Mantenha a rotina de alimentação",
            "Apresente o ambiente aos poucos",
          ],
        },
        {
          titulo: "Como trocar a ração com segurança",
          pontos: [
            "Troque aos poucos, misturando a nova com a antiga",
            "Observe fezes e apetite",
            "Leve a dúvida ao veterinário se o animal rejeitar",
          ],
        },
      ],
      mitos: [
        {
          mito: "Tosa na máquina estraga o pelo de qualquer animal",
          verdade:
            "Depende da raça e do tipo de pelo. Vale conversar com o profissional sobre o corte mais adequado ao seu animal.",
        },
        {
          mito: "Animal de apartamento não precisa passear",
          verdade:
            "Passeio e brincadeira ajudam no gasto de energia e no bem-estar, mesmo em espaço pequeno.",
        },
      ],
      perguntas: [
        "Qual o nome, a raça e a idade dele?",
        "Ele tem alguma alergia ou tratamento em andamento?",
        "Prefere levar ou que a gente busque?",
        "Qual o melhor dia e horário para você?",
      ],
      objecoes: [
        {
          objecao: "Meu animal é bravo, tenho medo de deixar.",
          resposta:
            "Conte um pouco como ele reage e o que o acalma. A gente combina como agir para ele ficar tranquilo, e você pode acompanhar de perto.",
        },
        {
          objecao: "Prefiro dar banho em casa.",
          resposta:
            "Tudo bem. Se quiser, posso orientar sobre produtos e técnica, e você nos chama só para a tosa ou para as épocas mais difíceis.",
        },
      ],
      canais: [
        "WhatsApp com agenda e envio de foto ao terminar",
        "Instagram com fotos dos animais atendidos",
        "Perfil da Empresa no Google",
        "Parcerias com veterinários e criadores",
      ],
      atividadesChave: [
        "Banho, tosa e cuidados",
        "Venda de ração e acessórios",
        "Agenda e leva e traz",
        "Controle de estoque",
        "Relacionamento com os tutores",
      ],
      recursos: [
        "Equipe treinada para lidar com animais",
        "Espaço e equipamentos de banho e tosa",
        "Estoque de produtos",
        "Veículo para leva e traz, se houver",
      ],
      parcerias: [
        "Veterinários e clínicas",
        "Fornecedores de ração e acessórios",
        "Criadores e abrigos da região",
        "Hotéis e creches para animais",
      ],
      receitas: [
        "Banho e tosa",
        "Venda de ração e acessórios",
        "Pacotes mensais de banho",
        "Serviço de leva e traz",
      ],
      custos: [
        "Produtos de banho e descartáveis",
        "Estoque de ração e acessórios",
        "Salários e comissões",
        "Água, luz e manutenção de equipamentos",
      ],
      documentos: [
        "CNPJ ou MEI ativo e enquadramento correto (confirmar com o contador)",
        "Alvará de funcionamento e licenças do município, quando exigidos",
        "Ficha do animal com vacinas, alergias e contato do tutor",
        "Termo de autorização para fotos e divulgação",
        "Registro do responsável técnico, quando houver atendimento veterinário",
      ],
      execucao: {
        objetivo: "Cuidar do animal com segurança e devolver no horário combinado.",
        passos: [
          "Confirmar o horário e o serviço escolhido um dia antes",
          "Receber o animal e conferir a ficha, as vacinas e como ele está",
          "Alinhar com o tutor o tipo de corte e os cuidados especiais",
          "Realizar o banho e a tosa com os produtos adequados",
          "Secar bem e conferir pele, orelhas e unhas",
          "Avisar o tutor que está pronto, com uma foto",
          "Orientar cuidados em casa e agendar a próxima visita",
        ],
        qualidade: [
          "Ficha atualizada antes de começar",
          "Tutor avisado com foto quando terminou",
          "Alterações na pele ou no comportamento foram comunicadas",
        ],
        erros: [
          "Atender sem conferir vacinas e saúde",
          "Cortar sem alinhar o estilo com o tutor",
          "Deixar o tutor sem aviso quando atrasa",
        ],
      },
      indicadores: [
        "Atendimentos por semana",
        "Tutores que voltam em até 45 dias",
        "Ticket médio por atendimento",
        "Venda de produtos por cliente",
      ],
      riscos: [
        "Acidente ou reclamação sem registro",
        "Agenda concentrada em poucos dias da semana",
        "Estoque parado de produto de baixo giro",
      ],
      hashtags: ["#petshop", "#banhoetosa", "#amoanimais"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "comercio", "outro"],
    palavras:
      /oficina|mecanic|autopecas|auto pecas|auto eletric|funilaria|borracharia|lava ?jato|lavagem automotiva|estetica automotiva|moto ?pecas|motocicleta/,
    perfil: {
      id: "automotivo",
      rotulo: "Oficina e serviços automotivos",
      oQueVende: "manutenção, reparo e peças para carros e motos",
      entrega: "o serviço",
      tipoDeCliente: "quem depende do veículo para trabalhar e viver",
      clientes: [
        "Motoristas e motociclistas da região",
        "Quem usa o veículo para trabalhar (aplicativo, entrega, vendas)",
        "Pequenas empresas com frota",
        "Quem vai viajar ou revisar antes de vender",
      ],
      dores: [
        "orçamento que aumenta no meio do conserto",
        "o carro parado sem previsão de volta",
        "peça trocada sem explicação",
        "o mesmo defeito voltando",
      ],
      desejos: [
        "diagnóstico explicado com clareza",
        "valor e prazo combinados antes",
        "peças e serviço com garantia",
      ],
      gatilhos: [
        "barulho, luz acesa no painel ou falha no veículo",
        "revisão por quilometragem ou prazo",
        "viagem marcada",
        "o veículo parou",
      ],
      provas: [
        "fotos das peças trocadas e do antes e depois, com autorização",
        "orçamento detalhado de exemplo, sem dados do cliente",
        "avaliações no Perfil da Empresa no Google",
        "garantia do serviço por escrito",
      ],
      dicas: [
        {
          titulo: "Revisão básica antes da viagem",
          pontos: [
            "Verifique o nível de óleo e a água do radiador",
            "Calibre os pneus e confira o estepe",
            "Teste luzes, freios e limpador de para-brisa",
            "Leve o carro para uma avaliação se notar qualquer barulho",
          ],
        },
        {
          titulo: "Como entender o orçamento da oficina",
          pontos: [
            "Peça o que está incluso: peça, mão de obra e prazo",
            "Pergunte se a peça é nova, recondicionada ou usada",
            "Peça a garantia por escrito",
            "Autorize qualquer serviço extra antes de ele ser feito",
          ],
        },
        {
          titulo: "Sinais de que não dá para esperar",
          pontos: [
            "Luz de alerta acesa no painel",
            "Pedal de freio mais baixo ou com barulho",
            "Vazamento embaixo do veículo",
            "Cheiro forte de queimado",
          ],
        },
      ],
      mitos: [
        {
          mito: "Trocar o óleo só quando o carro pedir",
          verdade:
            "O intervalo de troca segue o manual do fabricante, por quilometragem ou por tempo, o que vencer primeiro.",
        },
        {
          mito: "Peça mais barata dá no mesmo",
          verdade:
            "A diferença de qualidade e de garantia pode custar mais depois. Pergunte a origem e a garantia da peça.",
        },
      ],
      perguntas: [
        "Qual é o veículo (modelo e ano)?",
        "O que está acontecendo, e desde quando?",
        "Precisa para quando?",
        "Já passou por outra oficina com esse problema?",
      ],
      objecoes: [
        {
          objecao: "Orçamento caro, vou levar em outra oficina.",
          resposta:
            "Sem problema. Posso detalhar peça por peça e a mão de obra, para você comparar do mesmo jeito. Se o outro orçamento for menor, me mostra que eu explico a diferença.",
        },
        {
          objecao: "Não confio em oficina, já me enganaram.",
          resposta:
            "Entendo. Aqui o orçamento é por escrito, você aprova antes de qualquer serviço e pode acompanhar. Se quiser, mostro a peça trocada.",
        },
      ],
      canais: [
        "Indicação de clientes e de lojas de peças",
        "Perfil da Empresa no Google, com endereço e horário",
        "WhatsApp com fotos e orçamento",
        "Instagram com serviços feitos e dicas rápidas",
      ],
      atividadesChave: [
        "Diagnóstico e orçamento",
        "Manutenção e reparo",
        "Compra e controle de peças",
        "Agenda de entradas e entrega",
        "Pós-serviço e lembrete de revisão",
      ],
      recursos: [
        "Mecânicos e equipe técnica",
        "Elevador, ferramentas e equipamentos de diagnóstico",
        "Estoque de peças básicas",
        "Sistema de ordem de serviço",
      ],
      parcerias: [
        "Lojas de peças e distribuidoras",
        "Auto elétrica, funilaria e retífica de confiança",
        "Guinchos e seguradoras",
        "Empresas com frota",
      ],
      receitas: [
        "Mão de obra de reparo e manutenção",
        "Venda de peças e óleo",
        "Revisões programadas",
        "Contrato com empresas de frota",
      ],
      custos: [
        "Peças e insumos",
        "Equipe técnica e salários",
        "Aluguel, energia e água",
        "Manutenção de equipamentos e ferramentas",
      ],
      documentos: [
        "CNPJ ativo e enquadramento correto (confirmar com o contador)",
        "Alvará de funcionamento e licença ambiental para descarte de óleo e resíduos, quando exigida",
        "Ordem de serviço com aprovação do cliente por escrito",
        "Termo de garantia dos serviços e das peças",
        "Registro dos veículos atendidos e do histórico de revisão",
      ],
      execucao: {
        objetivo: "Consertar o veículo certo, no prazo, com aprovação do cliente em cada passo.",
        passos: [
          "Receber o veículo e abrir a ordem de serviço com o relato do cliente",
          "Fazer a inspeção e o diagnóstico, com fotos do que foi encontrado",
          "Enviar o orçamento por escrito, com peças, mão de obra e prazo",
          "Executar somente depois da aprovação do cliente",
          "Se aparecer algo novo, parar e pedir nova aprovação",
          "Testar o veículo e conferir se o problema foi resolvido",
          "Entregar explicando o que foi feito e registrar a garantia e a próxima revisão",
        ],
        qualidade: [
          "Ordem de serviço aberta e aprovada antes de qualquer serviço",
          "Fotos do problema e da solução registradas",
          "Cliente recebeu garantia e data da próxima revisão",
        ],
        erros: [
          "Trocar peça sem aprovação",
          "Prometer prazo sem checar a peça",
          "Entregar sem testar",
        ],
      },
      indicadores: [
        "Veículos atendidos por semana",
        "Retornos por mesmo defeito (%)",
        "Orçamentos aprovados (%)",
        "Clientes que voltam na revisão",
      ],
      riscos: [
        "Retrabalho que gera custo e queda de confiança",
        "Descarte de óleo e resíduos fora das regras",
        "Dependência de um mecânico que concentra o conhecimento",
      ],
      hashtags: ["#oficina", "#mecanica", "#carro"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "engenharia", "comercio", "outro"],
    palavras:
      /eletricista|encanador|pedreiro|pintor|marceneiro|marcenaria|chaveiro|dedetiz|jardin|diarista|limpeza|reforma|gesseiro|serralheria|vidracaria|ar condicionado|climatiza|manutencao residencial|instalacao (eletrica|hidraulica)|conserto de/,
    perfil: {
      id: "servicos_casa",
      rotulo: "Serviços para casa e reformas",
      oQueVende: "reformas, reparos e manutenção para casas e comércios",
      entrega: "o serviço",
      tipoDeCliente: "quem precisa consertar, reformar ou cuidar da casa ou do comércio",
      clientes: [
        "Moradores que precisam de um reparo ou de uma reforma",
        "Quem comprou ou alugou um imóvel e precisa de ajustes",
        "Comércios e escritórios pequenos",
        "Condomínios e imobiliárias que precisam de manutenção",
      ],
      dores: [
        "profissional que combina o dia e não aparece",
        "preço que sobe depois que a obra começa",
        "serviço que fica bonito mas dá problema depois",
        "sujeira e bagunça na casa",
      ],
      desejos: [
        "ter o valor e o prazo por escrito",
        "serviço limpo e bem acabado",
        "alguém que apareça e dê garantia",
      ],
      gatilhos: [
        "um vazamento, curto ou quebra",
        "uma mudança de casa ou aluguel",
        "o desejo de reformar um cômodo",
        "uma vistoria ou entrega de chaves",
      ],
      provas: [
        "fotos de antes e depois, com autorização do cliente",
        "vídeo curto mostrando o acabamento",
        "avaliações no Perfil da Empresa no Google",
        "certificados e cursos de segurança (NR) à vista, quando houver",
      ],
      dicas: [
        {
          titulo: "Antes de começar uma reforma",
          pontos: [
            "Defina o que vai mudar e o que não vai",
            "Peça orçamento detalhado: material, mão de obra e prazo",
            "Combine o pagamento por etapa concluída",
            "Veja as regras do condomínio e da prefeitura, se houver",
          ],
        },
        {
          titulo: "Sinais de que é hora de chamar um profissional",
          pontos: [
            "Disjuntor que desarma sempre",
            "Cheiro de queimado em tomada ou aparelho",
            "Mancha de umidade que volta",
            "Torneira ou descarga que pinga o tempo todo",
          ],
        },
        {
          titulo: "Como pedir orçamento certo",
          pontos: [
            "Mande fotos e medidas do que precisa",
            "Informe o prazo e o seu limite de valor",
            "Peça material e mão de obra separados",
            "Combine quem compra o material",
          ],
        },
      ],
      mitos: [
        {
          mito: "Para pequeno reparo não precisa de orçamento",
          verdade:
            "Mesmo para reparos pequenos, valor e prazo combinados antes evitam desencontro depois.",
        },
        {
          mito: "Quem cobra mais barato resolve do mesmo jeito",
          verdade:
            "Compare o que está incluso: material, garantia, limpeza e prazo. O valor final pode ser parecido ou até maior.",
        },
      ],
      perguntas: [
        "O que precisa ser feito e em qual cômodo?",
        "Pode mandar uma foto ou um vídeo do local?",
        "Para quando você precisa?",
        "O material fica por sua conta ou por conta do profissional?",
      ],
      objecoes: [
        {
          objecao: "O fulano cobrou menos.",
          resposta:
            "Vale comparar item por item: material, prazo, garantia e limpeza. Posso detalhar o orçamento para você ver o que está incluso.",
        },
        {
          objecao: "Vou esperar um pouco para fazer.",
          resposta:
            "Sem problema. Só vale avisar que alguns problemas, como infiltração ou fiação, pioram com o tempo. Se quiser, passo para ver e te dou uma orientação sem compromisso.",
        },
      ],
      canais: [
        "Indicação de clientes e de lojas de material de construção",
        "Perfil da Empresa no Google",
        "WhatsApp com fotos e orçamento",
        "Instagram com antes e depois",
      ],
      atividadesChave: [
        "Visita e orçamento",
        "Compra de material",
        "Execução do serviço",
        "Limpeza e entrega",
        "Pós-serviço e garantia",
      ],
      recursos: [
        "Profissional ou equipe com experiência",
        "Ferramentas e equipamentos",
        "Meio de transporte",
        "Portfólio de serviços entregues",
      ],
      parcerias: [
        "Lojas de material de construção",
        "Arquitetos e engenheiros que indicam clientes",
        "Imobiliárias e administradoras de condomínio",
        "Outros profissionais da obra, para serviços complementares",
      ],
      receitas: [
        "Mão de obra por serviço ou por obra",
        "Manutenção recorrente para condomínios e comércios",
        "Venda de material junto com o serviço",
        "Visita técnica paga",
      ],
      custos: [
        "Material e ferramentas",
        "Combustível e transporte",
        "Ajudantes e terceiros",
        "Impostos e taxas do negócio",
      ],
      documentos: [
        "CNPJ ou MEI ativo, com a atividade correta (confirmar com o contador)",
        "Orçamento e contrato simples por escrito",
        "Certificados de segurança (NR) para eletricidade e trabalho em altura, quando aplicável",
        "Termo de garantia do serviço",
        "Termo de consentimento para guardar contato dos clientes (LGPD)",
      ],
      execucao: {
        objetivo: "Fazer o serviço combinado, com limpeza e garantia, no dia marcado.",
        passos: [
          "Fazer a visita ou receber fotos e medidas",
          "Enviar o orçamento por escrito, com material, mão de obra e prazo",
          "Confirmar o início e o que o cliente precisa deixar liberado",
          "Proteger o local e executar o serviço",
          "Testar o resultado junto com o cliente",
          "Limpar o local e recolher o entulho",
          "Entregar o termo de garantia e pedir a avaliação",
        ],
        qualidade: [
          "O valor e o prazo foram aprovados por escrito",
          "O local ficou limpo",
          "O cliente testou e aprovou",
        ],
        erros: [
          "Começar sem orçamento aprovado",
          "Esquecer de proteger móveis e piso",
          "Não deixar a garantia por escrito",
        ],
      },
      indicadores: [
        "Orçamentos enviados por semana",
        "Orçamentos que viram serviço (%)",
        "Retornos por problema no mesmo serviço",
        "Clientes que indicam",
      ],
      riscos: [
        "Agenda irregular, com semanas cheias e vazias",
        "Acidente de trabalho sem proteção",
        "Retrabalho por falta de alinhamento do escopo",
      ],
      hashtags: ["#reformas", "#manutencao", "#servicoscasa"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["alimentacao", "comercio", "servico", "outro"],
    palavras: /confeitaria|padaria|bolo|doceria|doces|salgados|brigadeiro|cupcake|panificadora|torta|cafeteria|\bpao\b|paes/,
    perfil: {
      id: "confeitaria",
      rotulo: "Padaria e confeitaria",
      oQueVende: "pães, bolos, doces e salgados",
      entrega: "o pedido",
      tipoDeCliente: "quem quer comida feita com cuidado para o dia a dia ou para uma data especial",
      clientes: [
        "Moradores do bairro que compram pão e café da manhã",
        "Quem encomenda bolos e doces para aniversários e eventos",
        "Empresas que pedem café e salgados para reuniões",
        "Cafés, mercadinhos e restaurantes que revendem",
      ],
      dores: [
        "encomenda que sai diferente do pedido",
        "atraso na entrega no dia da festa",
        "não saber o valor antes de decidir",
        "dificuldade de encontrar opção sem lactose, sem glúten ou vegana",
      ],
      desejos: [
        "sabor caseiro e bonito na mesa",
        "pedido no dia e no horário combinados",
        "valor claro e sem surpresa",
      ],
      gatilhos: [
        "um aniversário ou comemoração",
        "o café da manhã e a hora do lanche",
        "uma reunião de empresa",
        "uma data como Páscoa, Natal ou Dia das Mães",
      ],
      provas: [
        "fotos reais dos produtos, com boa luz",
        "vídeo curto do preparo",
        "avaliações e fotos enviadas por clientes, com autorização",
        "licença sanitária e boas práticas à vista",
      ],
      dicas: [
        {
          titulo: "Como encomendar um bolo sem perder a data",
          pontos: [
            "Faça o pedido com antecedência combinada",
            "Informe número de pessoas, sabor e tema",
            "Avise sobre alergias e restrições",
            "Confirme o horário de retirada ou de entrega",
          ],
        },
        {
          titulo: "Como conservar bolos e doces",
          pontos: [
            "Siga a orientação de conservação do produto",
            "Mantenha longe do sol e do calor",
            "Retire da geladeira um tempo antes de servir, se for o caso",
            "Pergunte sobre o prazo de consumo",
          ],
        },
        {
          titulo: "Como calcular a quantidade para a festa",
          pontos: [
            "Considere o horário e se haverá refeição",
            "Veja quantos convidados são crianças",
            "Peça sugestão de variedade",
            "Reserve uma pequena sobra",
          ],
        },
      ],
      mitos: [
        {
          mito: "Bolo caseiro não pode ser vendido",
          verdade:
            "A venda de alimentos precisa seguir regras do município e da vigilância sanitária. Pergunte como o negócio se regulariza.",
        },
        {
          mito: "Encomenda de última hora sempre dá certo",
          verdade:
            "Quanto antes o pedido, mais chance de ter data, sabor e decoração como você quer.",
        },
      ],
      perguntas: [
        "Para qual data e quantas pessoas?",
        "Existe algum tema, cor ou sabor preferido?",
        "Alguém tem alergia ou restrição alimentar?",
        "Prefere retirar ou receber em casa?",
      ],
      objecoes: [
        {
          objecao: "Achei mais barato em outro lugar.",
          resposta:
            "Vale comparar ingredientes, tamanho e decoração. Se quiser, adapto o pedido para caber no seu valor, mantendo a qualidade.",
        },
        {
          objecao: "Ainda não tenho certeza da data.",
          resposta:
            "Sem problema. Me avise assim que souber. Quanto antes eu souber, mais chance de garantir a sua data.",
        },
      ],
      canais: [
        "Instagram com fotos e vídeos dos produtos",
        "WhatsApp com cardápio e pedidos",
        "Perfil da Empresa no Google",
        "Parcerias com organizadores de eventos e buffets",
      ],
      atividadesChave: [
        "Produção e preparo",
        "Compra de ingredientes e controle de estoque",
        "Atendimento de encomendas",
        "Embalagem e entrega",
        "Divulgação com fotos e vídeos",
      ],
      recursos: [
        "Cozinha adequada e licenciada",
        "Equipamentos de forno, batedeira e refrigeração",
        "Receitas padronizadas e fichas técnicas",
        "Embalagens e meio de entrega",
      ],
      parcerias: [
        "Fornecedores de ingredientes",
        "Organizadores de eventos, buffets e decoradores",
        "Cafés e mercadinhos que revendem",
        "Entregadores e plataformas de pedido",
      ],
      receitas: [
        "Venda no balcão",
        "Encomendas de bolos e doces",
        "Fornecimento para empresas e revenda",
        "Datas especiais (Páscoa, Natal, Dia das Mães)",
      ],
      custos: [
        "Ingredientes e embalagens",
        "Gás, energia e água",
        "Equipe e pró-labore",
        "Taxas de cartão e de plataformas",
      ],
      documentos: [
        "Alvará de funcionamento e licença sanitária do município",
        "Manual de boas práticas e registros de limpeza e temperatura",
        "Ficha técnica das receitas com custo por unidade",
        "Curso de manipulação de alimentos, quando exigido",
        "Termo de pedido com data, valor e sinal combinados",
      ],
      execucao: {
        objetivo: "Entregar a encomenda certa, no dia e no horário, com segurança alimentar.",
        passos: [
          "Anotar o pedido completo: data, quantidade, sabor, tema, restrições e contato",
          "Enviar o valor e as condições, e confirmar com sinal quando combinado",
          "Comprar os ingredientes e conferir a ficha técnica",
          "Produzir seguindo a higiene e a temperatura corretas",
          "Embalar e identificar com o nome do cliente e a data",
          "Conferir o pedido com a lista antes de entregar",
          "Perguntar como foi e pedir uma foto ou avaliação",
        ],
        qualidade: [
          "O pedido foi conferido com a lista",
          "A higiene e as temperaturas foram registradas",
          "O cliente recebeu no dia e no horário",
        ],
        erros: [
          "Aceitar encomenda sem registrar os detalhes por escrito",
          "Esquecer a restrição alimentar",
          "Não calcular o custo por unidade",
        ],
      },
      indicadores: [
        "Encomendas por semana",
        "Ticket médio por encomenda",
        "Custo dos ingredientes em relação ao preço",
        "Clientes que voltam a encomendar",
      ],
      riscos: [
        "Margem apertada com o preço dos ingredientes",
        "Encomendas concentradas em datas especiais",
        "Problema sanitário que afeta a reputação",
      ],
      hashtags: ["#confeitaria", "#bolos", "#docesfeitoscomamor"],
      vendeParaGoverno: false,
      agendamento: false,
    },
  },

  {
    segmentos: ["alimentacao", "comercio", "servico", "outro"],
    palavras:
      /restaurante|lanchonete|pizzaria|hamburgueria|marmita|marmitaria|churrasc|boteco|sorveteria|acaiteria|pastelaria|espetinho|\bbar\b|\bpizzas?\b|hamburguer|almoco|prato feito|\blanches?\b/,
    perfil: {
      id: "restaurante",
      rotulo: "Restaurante, lanchonete e delivery",
      oQueVende: "refeições, lanches e entrega em domicílio",
      entrega: "o pedido",
      tipoDeCliente: "quem quer comer bem sem perder tempo",
      clientes: [
        "Moradores e trabalhadores da região na hora do almoço",
        "Famílias que pedem por entrega no fim de semana",
        "Empresas que pedem refeição para a equipe",
        "Quem reserva para comemorações",
      ],
      dores: [
        "comida que chega fria ou atrasada",
        "cardápio e preço difíceis de descobrir",
        "pedido errado e ninguém para resolver",
        "pouca opção para quem tem restrição alimentar",
      ],
      desejos: [
        "comida boa, no horário e no preço combinado",
        "pedir de forma simples, pelo celular",
        "um lugar limpo e de confiança",
      ],
      gatilhos: [
        "a hora do almoço ou do jantar",
        "o fim de semana em casa",
        "uma comemoração em grupo",
        "a empresa que precisa alimentar a equipe",
      ],
      provas: [
        "fotos reais dos pratos, com boa luz",
        "vídeo curto da cozinha organizada",
        "avaliações de clientes, com autorização",
        "alvará e boas práticas à vista",
      ],
      dicas: [
        {
          titulo: "Como pedir delivery sem dor de cabeça",
          pontos: [
            "Confira o horário de funcionamento e a taxa de entrega",
            "Informe o endereço completo com ponto de referência",
            "Avise sobre alergias e restrições",
            "Confirme o pedido quando chegar",
          ],
        },
        {
          titulo: "Como escolher onde comer",
          pontos: [
            "Veja fotos reais e avaliações recentes",
            "Observe a limpeza do espaço",
            "Pergunte sobre ingredientes se houver alergia",
            "Prefira quem confirma o pedido antes de preparar",
          ],
        },
        {
          titulo: "Marmita saudável para a semana",
          pontos: [
            "Combine proteína, legumes e carboidrato",
            "Peça variedade durante a semana",
            "Armazene na geladeira logo que chegar",
            "Reaqueça só a porção do dia",
          ],
        },
      ],
      mitos: [
        {
          mito: "Delivery sempre chega frio",
          verdade:
            "Embalagem adequada e rota bem organizada mantêm a temperatura e a qualidade. Vale conferir como o local embala.",
        },
        {
          mito: "Comida de marmita é sempre a mesma coisa",
          verdade:
            "Um cardápio que muda ao longo da semana mantém a variedade sem aumentar muito o custo.",
        },
      ],
      perguntas: [
        "Para quantas pessoas?",
        "Alguém tem alergia ou restrição alimentar?",
        "Prefere retirar ou receber em casa?",
        "Qual o endereço, com ponto de referência?",
      ],
      objecoes: [
        {
          objecao: "Está mais caro que o restaurante da esquina.",
          resposta:
            "Posso mostrar o que está incluso: porção, ingredientes e entrega. Se preferir, monto uma opção mais enxuta que caiba no seu valor.",
        },
        {
          objecao: "Vou ver com o pessoal e te falo.",
          resposta:
            "Combinado. Para garantir o preparo, me avise até o horário que eu preciso para o dia: assim nada fica faltando.",
        },
      ],
      canais: [
        "WhatsApp com cardápio do dia",
        "Instagram com fotos e vídeos curtos",
        "Perfil da Empresa no Google",
        "Plataformas de entrega, com cuidado com as comissões",
      ],
      atividadesChave: [
        "Compra e armazenamento de ingredientes",
        "Produção e preparo",
        "Atendimento e gestão de pedidos",
        "Embalagem e entrega",
        "Controle sanitário e rastreabilidade",
      ],
      recursos: [
        "Cozinha adequada e licenciada",
        "Equipe de cozinha, salão e entrega",
        "Equipamentos de frio e de cocção",
        "Embalagens e meio de entrega",
      ],
      parcerias: [
        "Produtores e fornecedores locais",
        "Empresas que contratam refeição",
        "Entregadores e plataformas de pedido",
        "Organizadores de eventos",
      ],
      receitas: [
        "Salão e retirada",
        "Delivery",
        "Marmitas e contratos com empresas",
        "Eventos e encomendas",
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
        "Ficha técnica das receitas com o custo por prato",
        "Curso de manipulação de alimentos da equipe, quando exigido",
      ],
      execucao: {
        objetivo: "Entregar o pedido certo, no horário, com segurança alimentar.",
        passos: [
          "Receber o pedido e confirmar itens, horário, endereço e restrições",
          "Separar e conferir os ingredientes pela ficha técnica",
          "Preparar com o padrão de higiene e de temperatura",
          "Embalar identificando o pedido",
          "Conferir o pedido antes de liberar para a entrega ou a retirada",
          "Entregar ou deixar pronto no horário combinado",
          "Registrar reclamação ou elogio",
        ],
        qualidade: [
          "O pedido saiu conferido item por item",
          "As temperaturas foram registradas",
          "O cliente recebeu no horário combinado",
        ],
        erros: [
          "Aceitar pedido sem confirmar os itens",
          "Preparar sem ficha técnica e sem saber o custo do prato",
          "Não registrar as reclamações",
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
      hashtags: ["#restaurante", "#delivery", "#almoco"],
      vendeParaGoverno: false,
      agendamento: false,
    },
  },

  {
    segmentos: ["comercio", "servico", "outro"],
    palavras: /roupa|\bmoda\b|boutique|calcado|sapato|bijuteria|semijoia|acessorio|lingerie|brecho|confeccao|uniforme|vestido|camiseta|\bblusas?\b|\bcalcas?\b/,
    perfil: {
      id: "moda",
      rotulo: "Moda e acessórios",
      oQueVende: "roupas, calçados e acessórios",
      entrega: "o pedido",
      tipoDeCliente: "quem quer se vestir bem sem sair da cidade",
      clientes: [
        "Mulheres, homens e famílias do bairro e da cidade",
        "Quem procura uma peça para uma ocasião especial",
        "Quem compra por WhatsApp e Instagram",
        "Empresas que compram uniformes e brindes",
      ],
      dores: [
        "peça que não serve e dificuldade para trocar",
        "demora para saber se tem o tamanho",
        "foto bonita e produto diferente",
        "falta de orientação do que combina",
      ],
      desejos: [
        "encontrar o tamanho e o estilo certos",
        "troca simples",
        "ser atendida com atenção e sem pressão",
      ],
      gatilhos: [
        "uma festa, formatura ou casamento",
        "troca de estação",
        "uma data como Dia das Mães ou Natal",
        "uma novidade vista nas redes",
      ],
      provas: [
        "fotos reais das peças no corpo e em cabide",
        "vídeo curto mostrando o caimento",
        "avaliações e fotos de clientes, com autorização",
        "política de troca à vista e por escrito",
      ],
      dicas: [
        {
          titulo: "Como achar o tamanho certo comprando pelo celular",
          pontos: [
            "Peça a tabela de medidas da peça",
            "Meça uma peça sua que serve bem e compare",
            "Pergunte sobre o caimento e o tecido",
            "Confirme a política de troca antes de fechar",
          ],
        },
        {
          titulo: "Peças que combinam com tudo",
          pontos: [
            "Escolha base em cores neutras",
            "Invista em uma peça de destaque por look",
            "Misture texturas e comprimentos",
            "Prefira conforto para o dia a dia",
          ],
        },
        {
          titulo: "Como cuidar bem das roupas",
          pontos: [
            "Leia a etiqueta de lavagem",
            "Lave peças escuras do avesso",
            "Evite secar ao sol o que desbota",
            "Guarde bem dobradas ou em cabide",
          ],
        },
      ],
      mitos: [
        {
          mito: "Tamanho é igual em qualquer marca",
          verdade:
            "As medidas variam entre marcas e modelos. Vale comparar com a tabela de medidas de cada peça.",
        },
        {
          mito: "Comprar em loja pequena é sempre mais caro",
          verdade:
            "Loja local costuma ter condições para quem volta, atendimento próximo e troca mais fácil. Vale pedir o preço antes.",
        },
      ],
      perguntas: [
        "Qual a ocasião ou o estilo que você procura?",
        "Qual o seu tamanho ou a sua medida?",
        "Tem uma faixa de preço em mente?",
        "Precisa para quando?",
      ],
      objecoes: [
        {
          objecao: "Prefiro experimentar antes.",
          resposta:
            "Claro. Você pode vir à loja provar ou, se preferir, enviamos mais de um tamanho para você ver em casa, conforme a nossa política de troca.",
        },
        {
          objecao: "Achei mais barato na internet.",
          resposta:
            "Compare frete, prazo e troca. Aqui você vê a peça de perto e resolve fácil se não servir. Se quiser, me mostra o anúncio e eu vejo o que consigo fazer.",
        },
      ],
      canais: [
        "Instagram com fotos reais e vídeos curtos",
        "WhatsApp Business com catálogo",
        "Perfil da Empresa no Google",
        "Vitrine e lista de contatos de clientes que autorizaram receber novidades",
      ],
      atividadesChave: [
        "Curadoria e compra de coleção",
        "Atendimento e venda",
        "Vitrine e fotos das peças",
        "Troca e pós-venda",
        "Controle de estoque",
      ],
      recursos: [
        "Estoque e ponto comercial",
        "Provador e vitrine",
        "Equipe de atendimento",
        "Fotos de qualidade e catálogo",
      ],
      parcerias: [
        "Fornecedores e confecções",
        "Costureiras para ajustes",
        "Influenciadoras e clientes que divulgam",
        "Outros comércios da rua para ações em conjunto",
      ],
      receitas: [
        "Venda na loja",
        "Venda por WhatsApp e redes sociais",
        "Ajustes e serviços associados",
        "Uniformes e compras corporativas",
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
        "Política de troca e devolução por escrito",
        "Controle de estoque e inventário periódico",
        "Termo de consentimento para cadastro de clientes (LGPD)",
      ],
      execucao: {
        objetivo: "Atender a cliente com atenção, fechar a venda e deixar a troca simples.",
        passos: [
          "Receber a cliente e perguntar a ocasião e o estilo antes de mostrar",
          "Apresentar até três opções, com tamanho e valor",
          "Oferecer o provador ou o envio em mais de um tamanho",
          "Fechar a venda, emitir a nota e explicar a política de troca",
          "Embalar com cuidado",
          "Anotar o contato, com autorização, para avisar de novidades",
          "Dar retorno depois para saber se ficou bom",
        ],
        qualidade: [
          "A cliente saiu sabendo como trocar",
          "A nota foi emitida",
          "O contato foi registrado com autorização",
        ],
        erros: [
          "Oferecer sem perguntar a ocasião",
          "Trocar sem registrar",
          "Não atualizar a foto e o tamanho em estoque",
        ],
      },
      indicadores: [
        "Vendas por dia e ticket médio",
        "Peças vendidas por coleção",
        "Trocas e devoluções (%)",
        "Clientes que voltam em até 60 dias",
      ],
      riscos: [
        "Estoque parado de coleção anterior",
        "Concorrência de preço da internet",
        "Dependência de poucas datas de venda forte",
      ],
      hashtags: ["#moda", "#lojadebairro", "#looks"],
      vendeParaGoverno: false,
      agendamento: false,
    },
  },

  {
    segmentos: ["comercio", "alimentacao", "outro"],
    palavras: /\bmercado\b|mercadinho|mercearia|hortifruti|acougue|emporio|supermercado|quitanda|adega|distribuidora de bebidas/,
    perfil: {
      id: "mercadinho",
      rotulo: "Mercado, hortifrúti e açougue",
      oQueVende: "alimentos e itens do dia a dia, com entrega e atendimento de bairro",
      entrega: "a compra",
      tipoDeCliente: "quem quer resolver as compras do dia a dia perto de casa",
      clientes: [
        "Moradores do bairro que compram toda semana",
        "Famílias que pedem por WhatsApp e recebem em casa",
        "Restaurantes, lanchonetes e eventos pequenos",
        "Idosos e quem tem dificuldade de se locomover",
      ],
      dores: [
        "produto em falta na hora da compra",
        "fruta e verdura fora do ponto",
        "fila e demora no caixa",
        "preço diferente do que estava anunciado",
      ],
      desejos: [
        "produto fresco e de qualidade",
        "preço claro",
        "comodidade de receber em casa",
      ],
      gatilhos: [
        "a compra semanal ou a reposição do que acabou",
        "um almoço ou churrasco no fim de semana",
        "datas como Natal e Páscoa",
        "uma promoção divulgada",
      ],
      provas: [
        "fotos reais da banca e das ofertas do dia",
        "vídeo curto mostrando o que chegou",
        "avaliações de clientes no Google",
        "informação de origem dos produtos, quando houver",
      ],
      dicas: [
        {
          titulo: "Como escolher frutas e verduras",
          pontos: [
            "Observe cor, firmeza e cheiro",
            "Prefira o que está na estação",
            "Evite o que está amassado ou murcho",
            "Guarde cada tipo da forma indicada",
          ],
        },
        {
          titulo: "Como fazer a lista de compras da semana",
          pontos: [
            "Planeje as refeições antes de ir",
            "Veja o que já tem em casa",
            "Separe por seção: hortifrúti, açougue, mercearia",
            "Compre mais do que tem giro e menos do que vence logo",
          ],
        },
        {
          titulo: "Como guardar carnes com segurança",
          pontos: [
            "Leve para casa e refrigere logo",
            "Separe em porções",
            "Identifique com a data",
            "Descongele na geladeira, não na bancada",
          ],
        },
      ],
      mitos: [
        {
          mito: "Mercadinho de bairro sempre é mais caro que o supermercado grande",
          verdade:
            "Em itens frescos e de reposição, o preço pode ser competitivo, e o atendimento próximo evita desperdício. Compare os itens que você mais compra.",
        },
        {
          mito: "Fruta bonita é sempre a melhor",
          verdade:
            "Textura, cheiro e estação contam mais que a aparência. Pergunte o que chegou mais fresco.",
        },
      ],
      perguntas: [
        "O que você precisa e para quando?",
        "Prefere retirar ou receber em casa?",
        "Tem alguma preferência de marca ou de corte?",
        "Qual o seu endereço, com ponto de referência?",
      ],
      objecoes: [
        {
          objecao: "O supermercado grande tem preço melhor.",
          resposta:
            "Em alguns itens sim. Posso te passar os preços dos que você mais usa, e você compara. Aqui você ganha tempo, atendimento e produto escolhido.",
        },
        {
          objecao: "Não sei se vale pagar a entrega.",
          resposta:
            "Posso combinar um valor mínimo para entrega grátis ou um dia fixo da semana, para o custo ficar menor para você.",
        },
      ],
      canais: [
        "WhatsApp com lista de ofertas do dia",
        "Cartaz e vitrine com preços",
        "Perfil da Empresa no Google com horário",
        "Grupos de bairro e de condomínio, com autorização",
      ],
      atividadesChave: [
        "Compra e controle de estoque",
        "Exposição e reposição",
        "Atendimento e caixa",
        "Entregas",
        "Controle de validade e perdas",
      ],
      recursos: [
        "Ponto comercial e câmara fria",
        "Equipe de atendimento",
        "Balança, caixa e sistema",
        "Relação com fornecedores e produtores",
      ],
      parcerias: [
        "Produtores locais e distribuidoras",
        "Entregadores",
        "Restaurantes e lanchonetes da região",
        "Associações de moradores",
      ],
      receitas: [
        "Venda no balcão",
        "Venda por WhatsApp com entrega",
        "Fornecimento para restaurantes e eventos",
        "Cestas e kits de datas especiais",
      ],
      custos: [
        "Compra de mercadoria",
        "Perdas por validade",
        "Aluguel, energia e refrigeração",
        "Equipe e taxas de cartão",
      ],
      documentos: [
        "Alvará de funcionamento do município",
        "Licença sanitária, principalmente para açougue e produtos perecíveis",
        "Emissão de nota fiscal em dia",
        "Controle de validade e de temperatura",
        "Termo de consentimento para cadastro de clientes (LGPD)",
      ],
      execucao: {
        objetivo: "Manter o estoque fresco e entregar a compra certa.",
        passos: [
          "Conferir a validade e a qualidade ao receber a mercadoria",
          "Expor os itens mais antigos na frente",
          "Anotar o pedido do cliente com itens, quantidades e endereço",
          "Separar e conferir o pedido com a lista",
          "Embalar de forma adequada, separando perecíveis",
          "Entregar no horário combinado e receber o pagamento",
          "Registrar perdas e itens em falta",
        ],
        qualidade: [
          "O pedido foi conferido com a lista",
          "Os perecíveis estão identificados e na temperatura certa",
          "As perdas do dia foram registradas",
        ],
        erros: [
          "Colocar mercadoria nova na frente da antiga",
          "Prometer o que não tem em estoque",
          "Não registrar perdas",
        ],
      },
      indicadores: [
        "Vendas por dia e ticket médio",
        "Perdas por validade (%)",
        "Pedidos por WhatsApp",
        "Clientes que compram toda semana",
      ],
      riscos: [
        "Perdas por vencimento de produtos perecíveis",
        "Concorrência de grandes redes",
        "Falta de produto que gira rápido",
      ],
      hashtags: ["#mercadinho", "#hortifruti", "#comprelocal"],
      vendeParaGoverno: false,
      agendamento: false,
    },
  },

  {
    segmentos: ["servico", "outro", "tecnologia"],
    palavras: /escola|\bcursos?\b|\baulas?\b|reforco|idioma|ingles|musica|colegio|creche|treinamento|professor|educacao|cursinho/,
    perfil: {
      id: "educacao",
      rotulo: "Escola, cursos e aulas",
      oQueVende: "aulas, cursos e acompanhamento de aprendizagem",
      entrega: "a aula",
      tipoDeCliente: "quem quer aprender ou ver o filho aprender com acompanhamento",
      clientes: [
        "Pais e responsáveis que buscam reforço e acompanhamento",
        "Adolescentes e adultos que querem aprender uma habilidade",
        "Quem se prepara para prova, vestibular ou concurso",
        "Empresas que contratam treinamento para a equipe",
      ],
      dores: [
        "dificuldade de aprender no ritmo da escola",
        "falta de tempo para estudar sozinho",
        "turma grande e pouca atenção individual",
        "não saber se o curso vai ajudar de verdade",
      ],
      desejos: [
        "atenção individual e acompanhamento",
        "horário flexível",
        "ver evolução com clareza",
      ],
      gatilhos: [
        "nota baixa ou dificuldade em uma matéria",
        "uma prova, viagem ou oportunidade de trabalho",
        "início do ano letivo",
        "uma recomendação de outra família",
      ],
      provas: [
        "depoimentos de alunos ou responsáveis, com autorização",
        "exemplo de material ou de aula, sem expor alunos",
        "formação e experiência do professor à vista",
        "método de avaliação e de acompanhamento descrito",
      ],
      dicas: [
        {
          titulo: "Como criar uma rotina de estudo em casa",
          pontos: [
            "Defina um horário fixo, mesmo que curto",
            "Escolha um lugar silencioso e sem celular",
            "Divida o conteúdo em blocos de 25 a 30 minutos",
            "Faça pausas e revise no dia seguinte",
          ],
        },
        {
          titulo: "Como ajudar seu filho a estudar",
          pontos: [
            "Pergunte o que ele aprendeu, sem cobrar nota",
            "Combine a rotina junto, não imponha",
            "Valorize o esforço, não só o resultado",
            "Converse com o professor quando perceber dificuldade",
          ],
        },
        {
          titulo: "Como escolher um curso",
          pontos: [
            "Veja o conteúdo e a carga horária",
            "Pergunte como o aluno é acompanhado",
            "Peça uma aula experimental",
            "Confirme valores, prazos e regras de cancelamento",
          ],
        },
      ],
      mitos: [
        {
          mito: "Quem não aprende rápido não tem jeito",
          verdade:
            "Cada pessoa aprende em um ritmo. Método adequado e acompanhamento costumam fazer diferença.",
        },
        {
          mito: "Aula particular é só para quem está em recuperação",
          verdade:
            "Também ajuda quem quer avançar, se preparar para prova ou reforçar uma base.",
        },
      ],
      perguntas: [
        "Qual matéria ou habilidade você quer trabalhar?",
        "Qual o nível atual e o objetivo?",
        "Quais dias e horários funcionam para você?",
        "Prefere aula presencial ou online?",
      ],
      objecoes: [
        {
          objecao: "Vou esperar o próximo semestre.",
          resposta:
            "Posso te oferecer uma aula experimental agora, sem compromisso, para você ver como funciona. Assim você decide com mais informação.",
        },
        {
          objecao: "Está caro para o meu orçamento.",
          resposta:
            "Podemos ver um formato que caiba melhor: menos aulas por semana, turma pequena ou pacote. O que funcionaria para você?",
        },
      ],
      canais: [
        "Indicação de famílias e escolas",
        "Instagram com dicas curtas de estudo",
        "Perfil da Empresa no Google",
        "WhatsApp para matrícula e dúvidas",
      ],
      atividadesChave: [
        "Planejamento das aulas e do material",
        "Aulas e acompanhamento",
        "Avaliação e retorno às famílias",
        "Matrícula e cobrança",
        "Divulgação e relacionamento",
      ],
      recursos: [
        "Professores com formação e experiência",
        "Espaço de aula ou plataforma online",
        "Material didático",
        "Sistema de agenda e de presença",
      ],
      parcerias: [
        "Escolas e coordenadores",
        "Outros professores, para indicação",
        "Editoras e plataformas de conteúdo",
        "Empresas que contratam treinamento",
      ],
      receitas: [
        "Mensalidades de turmas e aulas particulares",
        "Matrícula e material",
        "Cursos e oficinas pontuais",
        "Treinamento para empresas",
      ],
      custos: [
        "Professores e equipe",
        "Aluguel ou plataforma online",
        "Material didático",
        "Divulgação",
      ],
      documentos: [
        "CNPJ e enquadramento correto (confirmar com o contador)",
        "Alvará de funcionamento e regras do município para cursos e escolas",
        "Contrato de prestação de serviços educacionais com valor e regras de cancelamento",
        "Autorização de uso de imagem de alunos, quando houver divulgação",
        "Termo de consentimento dos responsáveis (LGPD: dados de menores exigem cuidado)",
      ],
      execucao: {
        objetivo: "Ensinar com plano e dar retorno claro à família ou ao aluno.",
        passos: [
          "Fazer a avaliação inicial e definir o objetivo com o aluno ou o responsável",
          "Montar o plano de aulas por mês",
          "Dar a aula com material e atividade prática",
          "Registrar o que foi visto e o que precisa reforçar",
          "Enviar um retorno curto ao responsável ou ao aluno",
          "Reavaliar a cada mês e ajustar o plano",
        ],
        qualidade: [
          "O objetivo do aluno está registrado",
          "Cada aula tem registro do conteúdo",
          "O retorno foi enviado no prazo combinado",
        ],
        erros: [
          "Dar aula sem plano",
          "Não registrar o progresso",
          "Deixar o responsável sem retorno",
        ],
      },
      indicadores: [
        "Alunos ativos e novos por mês",
        "Frequência às aulas (%)",
        "Cancelamentos por mês",
        "Alunos que indicam outros",
      ],
      riscos: [
        "Evasão de alunos em períodos de férias",
        "Concentração de alunos em um único professor",
        "Tratamento inadequado de dados de menores (LGPD)",
      ],
      hashtags: ["#educacao", "#aulasparticulares", "#reforcoescolar"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "saude", "outro"],
    palavras: /academia|\bpersonal\b|pilates|yoga|crossfit|treino|fitness|massagem|\bspa\b|funcional|quiropraxia|musculacao|zumba|natacao/,
    perfil: {
      id: "bem_estar",
      rotulo: "Academia e bem-estar",
      oQueVende: "treino, acompanhamento e atividades de bem-estar",
      entrega: "o acompanhamento",
      tipoDeCliente: "quem quer cuidar do corpo e da rotina com orientação",
      clientes: [
        "Moradores que querem começar ou voltar a se exercitar",
        "Quem precisa de acompanhamento individual",
        "Pessoas em busca de qualidade de vida e de combate ao estresse",
        "Empresas que contratam atividades para a equipe",
      ],
      dores: [
        "começar e desistir por falta de rotina",
        "medo de fazer o exercício errado",
        "horário que não encaixa",
        "não ver resultado e perder a motivação",
      ],
      desejos: [
        "ter orientação segura",
        "uma rotina possível, que caiba no dia",
        "um ambiente acolhedor",
      ],
      gatilhos: [
        "começo do ano ou de um novo ciclo",
        "recomendação médica ou de um conhecido",
        "um evento ou data importante",
        "dor ou cansaço que atrapalha o dia a dia",
      ],
      provas: [
        "formação e registro no conselho profissional à vista",
        "fotos do espaço, sem alunos expostos",
        "depoimento de aluno, com autorização e sem promessa de resultado",
        "descrição do método de avaliação inicial",
      ],
      dicas: [
        {
          titulo: "Como começar a se exercitar sem se machucar",
          pontos: [
            "Procure avaliação antes de iniciar",
            "Comece com intensidade baixa e aumente aos poucos",
            "Respeite o descanso entre os treinos",
            "Informe ao profissional qualquer dor ou limitação",
          ],
        },
        {
          titulo: "Como manter a rotina de treino",
          pontos: [
            "Escolha dias e horários fixos",
            "Comece com metas pequenas",
            "Treine com alguém ou em grupo",
            "Anote o que mudou, além do peso",
          ],
        },
        {
          titulo: "Como escolher uma academia ou estúdio",
          pontos: [
            "Peça uma aula experimental",
            "Veja se há profissional por perto durante o treino",
            "Confirme horários, regras e cancelamento",
            "Observe a limpeza e a organização",
          ],
        },
      ],
      mitos: [
        {
          mito: "Só vale a pena treinar pesado",
          verdade:
            "A frequência e a constância contam mais do que a intensidade máxima, principalmente para quem está começando.",
        },
        {
          mito: "Quem tem dor deve parar de se mexer",
          verdade:
            "Em muitos casos, o movimento orientado ajuda. Cada situação deve ser avaliada por um profissional de saúde.",
        },
      ],
      perguntas: [
        "Qual o seu objetivo com o treino?",
        "Você tem alguma dor, lesão ou restrição médica?",
        "Quantas vezes por semana consegue treinar?",
        "Qual o melhor horário para você?",
      ],
      objecoes: [
        {
          objecao: "Já tentei e desisti.",
          resposta:
            "É comum. Podemos começar com algo bem possível, duas vezes por semana, e ajustar conforme sua rotina. Quer fazer uma aula experimental?",
        },
        {
          objecao: "Não tenho tempo.",
          resposta:
            "Podemos montar um treino curto, de 30 a 40 minutos, nos horários que sobram na sua semana.",
        },
      ],
      canais: [
        "Indicação de alunos e de profissionais de saúde",
        "Instagram com rotina e dicas curtas",
        "Perfil da Empresa no Google",
        "WhatsApp para agenda e aula experimental",
      ],
      atividadesChave: [
        "Avaliação inicial e plano de treino",
        "Aulas e acompanhamento",
        "Agenda e controle de presença",
        "Retenção e relacionamento com alunos",
        "Manutenção de equipamentos",
      ],
      recursos: [
        "Profissionais habilitados, com registro ativo",
        "Espaço e equipamentos",
        "Sistema de agenda e de cobrança",
        "Plano de treino por aluno",
      ],
      parcerias: [
        "Médicos, fisioterapeutas e nutricionistas",
        "Lojas de suplementos e roupas esportivas",
        "Empresas que contratam atividades",
        "Eventos esportivos da cidade",
      ],
      receitas: [
        "Mensalidades",
        "Planos de acompanhamento individual",
        "Aulas avulsas e experimentais",
        "Atividades para empresas",
      ],
      custos: [
        "Equipe e instrutores",
        "Aluguel, energia e água",
        "Manutenção e reposição de equipamentos",
        "Sistema e divulgação",
      ],
      documentos: [
        "Registro dos profissionais no conselho em dia",
        "Alvará de funcionamento e licenças do município",
        "Ficha de avaliação e termo de responsabilidade por aluno",
        "Contrato com valor, regras de cancelamento e horários",
        "Termo de consentimento (LGPD: dados de saúde são sensíveis)",
      ],
      execucao: {
        objetivo: "Orientar com segurança e manter o aluno motivado.",
        passos: [
          "Fazer a avaliação inicial e o termo de responsabilidade",
          "Definir o objetivo e o plano de treino",
          "Orientar a execução dos exercícios com cuidado e atenção",
          "Registrar a presença e a evolução",
          "Conversar sobre a rotina e ajustar o plano",
          "Entrar em contato quando o aluno faltar por mais de uma semana",
        ],
        qualidade: [
          "Todo aluno tem avaliação e termo preenchidos",
          "A presença e a evolução estão registradas",
          "Faltas recebem contato em até uma semana",
        ],
        erros: [
          "Iniciar o treino sem avaliação",
          "Deixar o aluno sem retorno quando falta",
          "Não registrar a evolução",
        ],
      },
      indicadores: [
        "Alunos ativos e novos por mês",
        "Frequência por aluno",
        "Cancelamentos mensais (%)",
        "Alunos que indicam outros",
      ],
      riscos: [
        "Evasão nos primeiros três meses",
        "Lesão sem registro da avaliação inicial",
        "Publicidade que promete resultado, fora das regras do conselho",
      ],
      hashtags: ["#bemestar", "#treino", "#qualidadedevida"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["saude", "servico", "outro"],
    palavras: /clinica|consultorio|dentista|odonto|psicolog|nutri|fisioterap|fonoaudio|terapia|terapeuta/,
    perfil: {
      id: "clinica",
      rotulo: "Clínica e consultório",
      oQueVende: "consultas e acompanhamento em saúde",
      entrega: "o atendimento",
      tipoDeCliente: "quem precisa cuidar da saúde com um profissional de confiança",
      clientes: [
        "Pacientes da região, particulares e de convênio",
        "Famílias que querem acompanhamento contínuo",
        "Empresas que contratam saúde ocupacional",
        "Pacientes encaminhados por outros profissionais",
      ],
      dores: [
        "demora para conseguir uma consulta",
        "pouco tempo de atenção no atendimento",
        "não entender o tratamento e o custo",
        "falta de retorno depois da consulta",
      ],
      desejos: [
        "ser ouvido e entender o que está acontecendo",
        "horário que cabe na rotina",
        "valor e tratamento explicados com clareza",
      ],
      gatilhos: [
        "um sintoma ou desconforto que persiste",
        "indicação de outro profissional",
        "check-up ou acompanhamento periódico",
        "o desejo de cuidar da saúde antes de um problema",
      ],
      provas: [
        "formação, especialização e registro no conselho à vista",
        "fotos do consultório limpo e organizado, sem pacientes",
        "depoimento de paciente, com autorização e sem expor dados de saúde",
        "certificados de atualização",
      ],
      dicas: [
        {
          titulo: "Como aproveitar melhor a consulta",
          pontos: [
            "Anote os sintomas e quando começaram",
            "Leve exames anteriores e a lista de remédios",
            "Escreva suas dúvidas",
            "Pergunte o que fazer se algo mudar",
          ],
        },
        {
          titulo: "Como escolher um profissional de saúde",
          pontos: [
            "Confira o registro no conselho",
            "Pergunte como é o acompanhamento depois da consulta",
            "Veja se o valor e as regras estão claros",
            "Observe se você se sente ouvido",
          ],
        },
        {
          titulo: "Por que fazer acompanhamento regular",
          pontos: [
            "Permite perceber mudanças cedo",
            "Ajuda a ajustar o tratamento",
            "Cria histórico para decisões futuras",
            "A frequência ideal é definida pelo profissional",
          ],
        },
      ],
      mitos: [
        {
          mito: "Só devo ir ao profissional quando algo dói",
          verdade:
            "O acompanhamento regular ajuda a perceber mudanças cedo e a prevenir. A frequência certa depende de cada caso.",
        },
        {
          mito: "Pesquisar na internet substitui a consulta",
          verdade:
            "A internet ajuda a entender o assunto, mas o diagnóstico depende de avaliação individual com um profissional.",
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
            "Posso explicar o que está incluso e, se fizer sentido, ver um formato de acompanhamento que caiba melhor. Qual valor você tinha em mente?",
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
        "Instagram com conteúdo educativo, sem promessa de resultado",
        "WhatsApp para agenda e retorno",
      ],
      atividadesChave: [
        "Consultas e procedimentos",
        "Agenda, confirmação e lembrete",
        "Prontuário e registro",
        "Limpeza, esterilização e controle sanitário",
        "Relacionamento e retorno com pacientes",
      ],
      recursos: [
        "Profissional habilitado, com registro ativo",
        "Consultório e equipamentos",
        "Sistema de agenda e de prontuário",
        "Licenças e alvarás em dia",
      ],
      parcerias: [
        "Laboratórios e clínicas de apoio",
        "Outros profissionais de saúde, para encaminhamento",
        "Convênios e planos",
        "Fornecedores de insumo e de manutenção",
      ],
      receitas: [
        "Consultas particulares",
        "Convênios",
        "Planos de acompanhamento",
        "Procedimentos e retornos",
      ],
      custos: [
        "Aluguel e contas do consultório",
        "Insumos e descartáveis",
        "Equipe de apoio",
        "Manutenção de equipamentos e sistema",
      ],
      documentos: [
        "Registro do profissional no conselho em dia",
        "Alvará de funcionamento e licença sanitária",
        "Plano de gerenciamento de resíduos de saúde",
        "Prontuário e termo de consentimento (LGPD: dado de saúde é dado sensível)",
        "Regras de publicidade do conselho profissional (sem promessa de resultado e sem expor paciente)",
      ],
      execucao: {
        objetivo: "Atender com segurança, no horário, e acompanhar depois.",
        passos: [
          "Confirmar o horário um dia antes e orientar o preparo",
          "Receber o paciente e conferir dados e consentimentos",
          "Realizar o atendimento seguindo o protocolo",
          "Explicar o resultado e os próximos passos em linguagem simples",
          "Registrar o atendimento no prontuário",
          "Higienizar o ambiente e os instrumentos",
          "Enviar as orientações e perguntar como o paciente está depois",
        ],
        qualidade: [
          "A confirmação foi feita antes do horário",
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
        "Publicidade fora das regras do conselho profissional",
        "Vazamento de dado de saúde (LGPD)",
        "Agenda com horários vagos e faltas",
      ],
      hashtags: ["#saude", "#consultorio", "#cuidado"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "alimentacao", "comercio", "outro"],
    palavras: /buffet|festa|evento|decoracao|fotograf|filmagem|cerimonial|som e luz|\bdj\b|salao de festas|aluguel de/,
    perfil: {
      id: "eventos",
      rotulo: "Festas e eventos",
      oQueVende: "organização, decoração, buffet e serviços para festas e eventos",
      entrega: "o evento",
      tipoDeCliente: "quem está organizando uma comemoração e não quer ter surpresa",
      clientes: [
        "Famílias que organizam aniversários, casamentos e formaturas",
        "Empresas que fazem confraternizações e eventos",
        "Quem precisa de uma parte do evento (decoração, doces, som)",
        "Outros fornecedores de festa que fazem indicação",
      ],
      dores: [
        "fornecedor que atrasa ou some no dia",
        "orçamento que cresce com itens não combinados",
        "não ter certeza de que tudo vai sair como imaginou",
        "falta de tempo para organizar tudo",
      ],
      desejos: [
        "um evento bonito e sem correria",
        "valor e itens combinados por escrito",
        "um fornecedor que cumpra data e horário",
      ],
      gatilhos: [
        "uma data marcada para comemorar",
        "um casamento, formatura ou aniversário de 15 anos",
        "a confraternização da empresa",
        "a falta de um fornecedor de última hora",
      ],
      provas: [
        "fotos e vídeos de eventos anteriores, com autorização",
        "depoimentos de clientes",
        "lista de itens e valores de exemplo",
        "contratos claros e modelo de proposta",
      ],
      dicas: [
        {
          titulo: "Como organizar uma festa sem estresse",
          pontos: [
            "Defina data, local e número de convidados",
            "Estabeleça o valor total antes de contratar",
            "Priorize o que mais importa para você",
            "Combine tudo por escrito com cada fornecedor",
          ],
        },
        {
          titulo: "Checklist da semana do evento",
          pontos: [
            "Confirme horário e local com todos os fornecedores",
            "Revise a lista de convidados",
            "Prepare um contato de emergência de cada fornecedor",
            "Reserve tempo para conferir a montagem",
          ],
        },
        {
          titulo: "Como pedir orçamento de evento",
          pontos: [
            "Informe data, local e número de pessoas",
            "Conte o estilo e as referências",
            "Peça os itens detalhados e o prazo de pagamento",
            "Pergunte o que acontece em caso de imprevisto",
          ],
        },
      ],
      mitos: [
        {
          mito: "Evento pequeno não precisa de planejamento",
          verdade:
            "Quanto menor o evento, mais fácil ele sair do trilho com um pequeno atraso. Lista e horários ajudam em qualquer tamanho.",
        },
        {
          mito: "Fechar tudo de última hora sai mais barato",
          verdade:
            "Datas concorridas esgotam rápido, e o improviso costuma encarecer. Avisar com antecedência dá mais opções.",
        },
      ],
      perguntas: [
        "Qual a data, o local e o número de convidados?",
        "Que tipo de evento e de estilo você imagina?",
        "Existe um valor total que você pretende respeitar?",
        "O que já está contratado e o que falta?",
      ],
      objecoes: [
        {
          objecao: "Está acima do que eu planejava.",
          resposta:
            "Posso adaptar a proposta: tirar um item, reduzir a quantidade ou simplificar a decoração, mantendo o que mais importa para você.",
        },
        {
          objecao: "Ainda estou pesquisando outras opções.",
          resposta:
            "Faz sentido. Posso te passar uma proposta detalhada para comparar e te aviso se a data continuar livre.",
        },
      ],
      canais: [
        "Instagram com fotos e vídeos de eventos",
        "Indicação de outros fornecedores e de clientes",
        "Perfil da Empresa no Google",
        "WhatsApp com portfólio e proposta",
      ],
      atividadesChave: [
        "Atendimento e proposta",
        "Planejamento e cronograma do evento",
        "Produção e montagem",
        "Coordenação no dia do evento",
        "Pós-evento e pedido de avaliação",
      ],
      recursos: [
        "Equipe de produção e montagem",
        "Material e equipamentos de decoração, som ou buffet",
        "Portfólio de eventos",
        "Veículo para transporte",
      ],
      parcerias: [
        "Espaços e salões de festa",
        "Fotógrafos, DJs, doceiras e decoradores",
        "Buffets e empresas de aluguel",
        "Cerimonialistas",
      ],
      receitas: [
        "Pacotes de evento",
        "Aluguel de itens",
        "Serviços avulsos",
        "Eventos corporativos",
      ],
      custos: [
        "Equipe e freelancers",
        "Material, aluguel e transporte",
        "Divulgação",
        "Manutenção de equipamentos",
      ],
      documentos: [
        "CNPJ e enquadramento correto (confirmar com o contador)",
        "Contrato de prestação de serviços com data, valor, sinal e política de cancelamento",
        "Alvarás e licenças para eventos, quando exigidos pelo município",
        "Termo de autorização de uso de imagem",
        "Cronograma e lista de contatos do evento",
      ],
      execucao: {
        objetivo: "Entregar o evento como foi combinado, com horário e sem surpresa.",
        passos: [
          "Reunião de alinhamento: data, local, convidados, estilo e valor",
          "Proposta e contrato com sinal e política de cancelamento",
          "Cronograma com responsáveis e horários",
          "Confirmação de todos os fornecedores uma semana antes",
          "Montagem com checklist de itens",
          "Coordenação no dia do evento",
          "Desmontagem, conferência e pedido de avaliação",
        ],
        qualidade: [
          "Contrato assinado antes de qualquer serviço",
          "Checklist de itens conferido na montagem",
          "Cliente avaliou o resultado",
        ],
        erros: [
          "Fechar por mensagem sem contrato",
          "Não confirmar os fornecedores",
          "Não ter plano para imprevistos",
        ],
      },
      indicadores: [
        "Propostas enviadas por semana",
        "Propostas que viram evento (%)",
        "Eventos por mês",
        "Clientes que indicam",
      ],
      riscos: [
        "Receita concentrada em poucas datas do ano",
        "Cancelamento em cima da hora sem política clara",
        "Dependência de fornecedores terceirizados",
      ],
      hashtags: ["#eventos", "#festas", "#comemoracao"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },

  {
    segmentos: ["servico", "comercio", "outro"],
    palavras: /imobiliaria|imovel|imoveis|corretor|corretagem|incorporadora|loteamento/,
    perfil: {
      id: "imobiliario",
      rotulo: "Imobiliária e corretagem",
      oQueVende: "compra, venda e aluguel de imóveis",
      entrega: "a negociação",
      tipoDeCliente: "quem vai comprar, vender ou alugar um imóvel",
      clientes: [
        "Famílias que buscam um imóvel para morar",
        "Proprietários que querem vender ou alugar",
        "Investidores locais",
        "Empresas que procuram ponto comercial",
      ],
      dores: [
        "medo de fechar negócio com problema de documentação",
        "imóvel anunciado que não é como nas fotos",
        "burocracia e prazo longos",
        "insegurança sobre o valor justo",
      ],
      desejos: [
        "segurança jurídica e documentação clara",
        "imóveis reais, com informação honesta",
        "acompanhamento até a entrega das chaves",
      ],
      gatilhos: [
        "mudança de emprego, família ou cidade",
        "fim de contrato de aluguel",
        "herança ou venda de imóvel",
        "financiamento aprovado",
      ],
      provas: [
        "fotos e vídeos reais dos imóveis, com autorização do proprietário",
        "registro do corretor no conselho (CRECI) à vista",
        "depoimentos de clientes, com autorização",
        "lista de documentos que a imobiliária confere",
      ],
      dicas: [
        {
          titulo: "Documentos para comprar um imóvel com segurança",
          pontos: [
            "Matrícula atualizada do imóvel",
            "Certidões do vendedor e do imóvel",
            "IPTU e condomínio em dia",
            "Contrato revisado antes de assinar",
          ],
        },
        {
          titulo: "Como se preparar para alugar",
          pontos: [
            "Entenda a garantia exigida",
            "Peça vistoria na entrada e na saída",
            "Confira o valor total: aluguel, condomínio e IPTU",
            "Guarde o contrato e os comprovantes",
          ],
        },
        {
          titulo: "Como preparar o imóvel para vender",
          pontos: [
            "Organize a documentação antes de anunciar",
            "Faça pequenos reparos e deixe o imóvel limpo",
            "Tire fotos com boa luz",
            "Defina o preço com base em imóveis parecidos na região",
          ],
        },
      ],
      mitos: [
        {
          mito: "Imóvel anunciado barato é sempre uma oportunidade",
          verdade:
            "Valor muito abaixo do mercado merece atenção redobrada com a documentação e com a situação do imóvel.",
        },
        {
          mito: "Vender sem corretor sempre economiza",
          verdade:
            "Corretor e imobiliária ajudam com avaliação, divulgação, negociação e documentação. Vale comparar custo e benefício.",
        },
      ],
      perguntas: [
        "Você quer comprar, vender ou alugar?",
        "Qual a região e o perfil do imóvel que procura?",
        "Qual valor você pretende investir ou receber?",
        "Existe prazo, como contrato de aluguel vencendo ou financiamento?",
      ],
      objecoes: [
        {
          objecao: "Vou vender por conta própria primeiro.",
          resposta:
            "Tudo bem. Se quiser, faço uma avaliação gratuita do imóvel para você ter um valor de referência e, se precisar de ajuda depois, estamos por aqui.",
        },
        {
          objecao: "A comissão é alta.",
          resposta:
            "Posso detalhar o que está incluído: divulgação, visitas, negociação e documentação. Assim você compara o custo com o trabalho que fica por nossa conta.",
        },
      ],
      canais: [
        "Indicação de clientes, bancos e advogados",
        "Portais de imóveis e Perfil da Empresa no Google",
        "Instagram com vídeos dos imóveis",
        "WhatsApp com ficha do imóvel",
      ],
      atividadesChave: [
        "Captação de imóveis",
        "Divulgação com fotos e vídeo",
        "Atendimento e visitas",
        "Negociação e documentação",
        "Pós-venda e administração de aluguel",
      ],
      recursos: [
        "Corretor com registro ativo (CRECI)",
        "Carteira de imóveis",
        "Fotos e vídeos de qualidade",
        "Sistema de gestão de imóveis e de clientes",
      ],
      parcerias: [
        "Advogados e despachantes",
        "Bancos e correspondentes de financiamento",
        "Fotógrafos de imóveis",
        "Construtoras e incorporadoras",
      ],
      receitas: [
        "Comissão de venda",
        "Taxa de administração de aluguel",
        "Comissão de locação",
        "Serviços de avaliação",
      ],
      custos: [
        "Divulgação e portais",
        "Comissões de corretores",
        "Aluguel do escritório",
        "Sistema e despesas de visita",
      ],
      documentos: [
        "Registro do corretor no conselho (CRECI) em dia",
        "Contrato de intermediação e autorização de venda com o proprietário",
        "Documentação do imóvel e do proprietário, conferida e arquivada",
        "Contrato de locação e laudo de vistoria",
        "Termo de consentimento para guardar dados de clientes (LGPD)",
      ],
      execucao: {
        objetivo: "Levar a negociação até a entrega das chaves com a documentação em ordem.",
        passos: [
          "Atender o cliente e entender o perfil e o orçamento",
          "Captar ou selecionar os imóveis e conferir a documentação básica",
          "Agendar e acompanhar as visitas",
          "Intermediar a proposta e a contraproposta, com registro por escrito",
          "Reunir e conferir a documentação das partes",
          "Acompanhar a assinatura do contrato e a entrega das chaves",
          "Fazer o pós-venda e pedir indicação",
        ],
        qualidade: [
          "A documentação foi conferida antes da proposta",
          "Toda negociação ficou registrada por escrito",
          "O cliente recebeu um resumo do que falta em cada etapa",
        ],
        erros: [
          "Divulgar imóvel sem conferir a documentação",
          "Combinar condições só de boca",
          "Deixar o cliente sem retorno depois da visita",
        ],
      },
      indicadores: [
        "Imóveis captados por mês",
        "Visitas por imóvel",
        "Negociações fechadas (%)",
        "Tempo médio entre captação e fechamento",
      ],
      riscos: [
        "Imóvel com documentação irregular",
        "Receita concentrada em poucos fechamentos por mês",
        "Anúncios com informação que não corresponde ao imóvel",
      ],
      hashtags: ["#imoveis", "#imobiliaria", "#casapropria"],
      vendeParaGoverno: false,
      agendamento: true,
    },
  },
];
