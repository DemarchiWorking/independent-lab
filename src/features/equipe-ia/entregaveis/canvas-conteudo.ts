import type { Segmento } from "@/lib/db/types";
import type { ChaveBloco, RiscoCanvas } from "./tipos";

/**
 * Conhecimento de nicho do Canvas — o que um consultor sênior escreveria em
 * cada quadro para CADA segmento, em vez de um texto único com o nome trocado.
 *
 * Mesma disciplina de `vocabulario.ts` (fonte única, dado puro, sem lógica):
 * `vocabulario` guarda o que o segmento É (clientes, atividades, recursos,
 * parcerias, receitas); este arquivo guarda o que o segmento DEVE FAZER —
 * proposta de valor, canais ideais, relacionamento, custos, e para cada um
 * dos 9 quadros a melhor prática, o indicador e a hipótese a validar.
 *
 * Calibrado no ICP real (PMEs regionais do Vale do Café que vendem para o
 * poder público e para o mercado local — ver docs/CONTEXTO-NEGOCIO.md §4).
 * Referências de método: Business Model Canvas (Osterwalder & Pigneur, 2010);
 * Lei 14.133/2021 e PNCP para o que envolve compra pública.
 */

export interface PraticaBloco {
  /** a recomendação objetiva do segmento para este quadro */
  boaPratica: string;
  /** o número que prova que o quadro funciona */
  indicador: string;
  /** a suposição que ainda precisa ser confirmada com cliente real */
  hipotese: string;
}

export interface ConteudoCanvas {
  propostaValor: string[];
  /** canais que funcionam de fato neste nicho, em ordem de prioridade */
  canaisIdeais: string[];
  relacionamento: string[];
  custos: string[];
  /** riscos típicos do nicho — alimentam a matriz de riscos (nível 3) */
  riscos: RiscoCanvas[];
  blocos: Record<ChaveBloco, PraticaBloco>;
}

const CONTEUDO: Record<Segmento, ConteudoCanvas> = {
  engenharia: {
    propostaValor: [
      "Projeto e obra entregues no prazo do edital, com ART e documentação técnica completas",
      "Acervo técnico organizado que comprova capacidade em cada licitação",
      "Um responsável técnico que responde pelo resultado do início ao fim",
    ],
    canaisIdeais: [
      "PNCP e portais de compras (ComprasGov, BLL, Licitanet)",
      "Relacionamento com secretarias de obras e engenheiros fiscais",
      "LinkedIn e indicação de arquitetos e construtoras parceiras",
    ],
    relacionamento: [
      "Gestor de contrato nomeado, com relatório de medição mensal",
      "Pós-obra com garantia e visita técnica registradas",
    ],
    custos: [
      "Responsável técnico e equipe de campo",
      "Licenças de CAD/BIM e equipamentos de topografia",
      "Garantias contratuais, seguros e taxas de ART",
    ],
    riscos: [
      { risco: "Perder prazo de edital por certidão vencida", mitigacao: "Calendário único de vencimentos com alerta 30 dias antes" },
      { risco: "Concentração em um único contrato público", mitigacao: "Meta de pelo menos 3 clientes ativos, nenhum acima de 40% da receita" },
      { risco: "Atraso de pagamento da medição", mitigacao: "Reserva de capital de giro de 60 dias e cláusula de reajuste revisada" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Priorize 2 tipos de comprador (ex.: prefeituras da região e construtoras) e crie uma proposta-padrão para cada um.",
        indicador: "Propostas enviadas por mês e taxa de vitória por tipo de cliente",
        hipotese: "Prefeituras vizinhas compram o mesmo tipo de obra que já executamos, só falta aparecermos nos editais.",
      },
      proposta: {
        boaPratica: "Transforme o acervo técnico em prova comercial: um dossiê de 2 páginas com obras, valores e atestados.",
        indicador: "Atestados de capacidade técnica emitidos por obra concluída",
        hipotese: "Quem vê o dossiê antes da proposta aceita negociar com menos pressão de preço.",
      },
      canais: {
        boaPratica: "Cadastre-se nos alertas do PNCP por palavra-chave e município; revise as oportunidades toda segunda.",
        indicador: "Editais monitorados vs. editais com proposta enviada",
        hipotese: "Estamos perdendo oportunidades por não monitorar o PNCP toda semana.",
      },
      relacionamento: {
        boaPratica: "Padronize o relatório de medição mensal: foto, % executado e pendências — fiscal bem informado não trava pagamento.",
        indicador: "Dias entre a medição e o pagamento",
        hipotese: "Relatório padronizado reduz o tempo de aprovação da medição.",
      },
      receitas: {
        boaPratica: "Separe receita por tipo (obra, projeto, laudo) e acompanhe a margem de cada uma — laudo costuma ter a melhor margem.",
        indicador: "Margem bruta por tipo de serviço",
        hipotese: "Laudos e ART avulsos geram caixa recorrente com menos risco que obra.",
      },
      recursos: {
        boaPratica: "Mantenha CREA, certidões e acervo em uma pasta única, com responsável nomeado e checagem mensal.",
        indicador: "% de certidões válidas pelos próximos 60 dias",
        hipotese: "Documentação centralizada é o que nos permite entrar em mais editais no mesmo mês.",
      },
      atividades: {
        boaPratica: "Monte um fluxo fixo de proposta (checklist de habilitação, planilha de custos, revisão) para cortar retrabalho.",
        indicador: "Horas gastas por proposta e % de propostas desclassificadas por documentação",
        hipotese: "Um checklist de habilitação elimina as desclassificações evitáveis.",
      },
      parcerias: {
        boaPratica: "Formalize 2 parcerias de contraprestação: arquitetura (indicação mútua) e contabilidade (certidões).",
        indicador: "Oportunidades recebidas por parceiro por trimestre",
        hipotese: "Arquitetos da região indicam obras que não conseguem executar.",
      },
      custos: {
        boaPratica: "Calcule o custo-hora do responsável técnico e inclua garantias e BDI na proposta — preço sem isso vira prejuízo.",
        indicador: "Margem líquida por obra após garantias e impostos",
        hipotese: "Nossas propostas atuais não cobrem o custo real de garantia e fiscalização.",
      },
    },
  },

  contabilidade: {
    propostaValor: [
      "Obrigações fiscais em dia e certidões prontas antes do prazo, sem o cliente precisar cobrar",
      "Leitura mensal do resultado em linguagem de dono, não de contador",
      "Apoio de habilitação para quem quer vender ao poder público",
    ],
    canaisIdeais: [
      "Indicação de clientes atendidos e de advogados parceiros",
      "Associação comercial e eventos do Sebrae regional",
      "Página pública com serviços e conteúdo sobre certidões e enquadramento",
    ],
    relacionamento: [
      "Reunião trimestral de resultado com cada cliente (30 minutos, com pauta fixa)",
      "Canal único de atendimento com prazo de resposta combinado",
    ],
    custos: [
      "Equipe contábil e fiscal (maior custo fixo)",
      "Sistema contábil, certificado digital e obrigações acessórias",
      "Atualização profissional e CRC",
    ],
    riscos: [
      { risco: "Dependência de poucos clientes grandes", mitigacao: "Limite de 20% da receita por cliente e meta de novos honorários por trimestre" },
      { risco: "Multa por prazo perdido", mitigacao: "Calendário fiscal automatizado com responsável e revisão semanal" },
      { risco: "Cliente que só procura o contador no aperto", mitigacao: "Pacote de acompanhamento mensal com entregas visíveis" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Escolha um nicho de especialização (ex.: empresas que fornecem ao poder público) e fale só com ele.",
        indicador: "Clientes ativos e ticket médio por perfil",
        hipotese: "Especializar em habilitação de licitação atrai clientes que pagam mais e ficam mais tempo.",
      },
      proposta: {
        boaPratica: "Venda o resultado (empresa regular e apta a licitar), não a rotina (escrituração).",
        indicador: "Certidões entregues antes do vencimento",
        hipotese: "Clientes pagam mais por prevenção de prazo do que por escrituração.",
      },
      canais: {
        boaPratica: "Crie um ciclo de indicação: peça a cada cliente satisfeito o contato de 2 empresas do mesmo tipo.",
        indicador: "Novos clientes por indicação por trimestre",
        hipotese: "Nossos melhores clientes vieram por indicação, não por anúncio.",
      },
      relacionamento: {
        boaPratica: "Faça a reunião trimestral com o mesmo roteiro: resultado, impostos, risco do próximo trimestre.",
        indicador: "Churn mensal e NPS dos clientes",
        hipotese: "Quem participa da reunião trimestral cancela menos.",
      },
      receitas: {
        boaPratica: "Migre serviços avulsos para planos mensais com escopo claro; avulso vira upsell, não regra.",
        indicador: "% da receita recorrente sobre o total",
        hipotese: "Planos com certidões incluídas aumentam o ticket sem aumentar o churn.",
      },
      recursos: {
        boaPratica: "Documente cada rotina fiscal em passo a passo — o conhecimento não pode morar na cabeça de uma pessoa.",
        indicador: "% das rotinas com procedimento escrito",
        hipotese: "Rotinas documentadas permitem atender mais clientes por colaborador.",
      },
      atividades: {
        boaPratica: "Automatize o calendário fiscal e a cobrança de documentos do cliente; reserve o tempo humano para consultoria.",
        indicador: "Horas por cliente por mês",
        hipotese: "Cobrança automática de documentos reduz atrasos de fechamento.",
      },
      parcerias: {
        boaPratica: "Formalize parceria com advocacia tributária e licitatória: vocês se indicam sem competir.",
        indicador: "Clientes recebidos de parceiros",
        hipotese: "Advogados da região precisam de contador para habilitação e não têm indicação fixa.",
      },
      custos: {
        boaPratica: "Calcule a margem por cliente (horas × custo-hora) e reajuste ou descontinue os que dão prejuízo.",
        indicador: "Margem por cliente e custo por obrigação entregue",
        hipotese: "Uma parte da carteira consome mais horas do que o honorário paga.",
      },
    },
  },

  saude: {
    propostaValor: [
      "Atendimento e equipamento com documentação sanitária em dia e prazo de resposta previsível",
      "Agenda organizada, confirmação automática e menos faltas",
      "Fornecimento ao poder público com habilitação completa e entrega rastreável",
    ],
    canaisIdeais: [
      "Pregões de secretarias de saúde (PNCP e portais)",
      "Indicação de profissionais e clínicas parceiras",
      "Google Meu Negócio e WhatsApp com agendamento",
    ],
    relacionamento: [
      "Confirmação e lembrete automáticos de consulta ou entrega",
      "Retorno programado após o atendimento ou a manutenção",
    ],
    custos: [
      "Equipe técnica habilitada e responsável técnico",
      "Equipamento, calibração e manutenção preventiva",
      "Licenças sanitárias, insumos e descarte regulado",
    ],
    riscos: [
      { risco: "Alvará ou licença sanitária vencida", mitigacao: "Controle de vencimentos com alerta de 60 dias e responsável nomeado" },
      { risco: "Agenda ociosa por faltas", mitigacao: "Confirmação automática 24h antes e lista de espera" },
      { risco: "Equipamento parado sem manutenção", mitigacao: "Plano de manutenção preventiva com calendário e peça reserva crítica" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Separe atendimento particular, convênio e poder público — cada um tem margem, prazo e risco diferentes.",
        indicador: "Receita e margem por tipo de pagador",
        hipotese: "O atendimento particular tem a melhor margem e está subaproveitado.",
      },
      proposta: {
        boaPratica: "Comunique o que dá confiança: habilitação, tempo de resposta e protocolo de segurança.",
        indicador: "Tempo médio de resposta e satisfação pós-atendimento",
        hipotese: "Clientes escolhem pela rapidez de retorno, não só pelo preço.",
      },
      canais: {
        boaPratica: "Centralize o agendamento em um número de WhatsApp com resposta padronizada e horário combinado.",
        indicador: "Tempo até a primeira resposta e % de contatos que agendam",
        hipotese: "Estamos perdendo contatos por demorar a responder.",
      },
      relacionamento: {
        boaPratica: "Defina o retorno programado: quem faz, quando e com qual mensagem.",
        indicador: "Taxa de retorno e de faltas",
        hipotese: "Lembretes automáticos reduzem as faltas pela metade.",
      },
      receitas: {
        boaPratica: "Priorize contratos de manutenção recorrente — receita previsível sustenta o investimento em equipamento.",
        indicador: "Receita recorrente mensal",
        hipotese: "Contratos de manutenção cobrem os custos fixos do mês.",
      },
      recursos: {
        boaPratica: "Mantenha alvarás, calibrações e habilitações em painel único com data de vencimento.",
        indicador: "% de licenças e calibrações dentro da validade",
        hipotese: "Um painel de vencimentos elimina paradas por documentação.",
      },
      atividades: {
        boaPratica: "Padronize protocolo de atendimento e registre tudo — é o que sustenta qualidade, auditoria e habilitação.",
        indicador: "% de atendimentos com registro completo",
        hipotese: "Protocolo padronizado reduz retrabalho administrativo.",
      },
      parcerias: {
        boaPratica: "Fortaleça laboratório e clínica complementares: encaminhamento mútuo gera volume sem custo de captação.",
        indicador: "Pacientes ou demandas recebidas por parceiro",
        hipotese: "Parceiros complementares aceitam encaminhamento recíproco.",
      },
      custos: {
        boaPratica: "Calcule o custo por atendimento ou por equipamento mantido, incluindo calibração e insumo.",
        indicador: "Custo por atendimento e utilização da agenda",
        hipotese: "A ociosidade da agenda é o maior custo escondido.",
      },
    },
  },

  tecnologia: {
    propostaValor: [
      "Sistema e infraestrutura estáveis, com SLA claro e suporte que responde",
      "Entrega por etapas, com demonstração a cada ciclo e escopo controlado",
      "Receita previsível para o cliente: custo mensal em vez de projeto surpresa",
    ],
    canaisIdeais: [
      "Contratos de TI com órgãos públicos (PNCP) e subcontratação",
      "Indicação de consultorias e revendas de hardware",
      "Presença técnica: portfólio, estudo de caso e conteúdo no LinkedIn",
    ],
    relacionamento: [
      "Gerente de conta técnico com reunião mensal de indicadores do SLA",
      "Canal de suporte com prioridade por criticidade",
    ],
    custos: [
      "Equipe técnica (maior custo)",
      "Nuvem, ferramentas e licenças",
      "Suporte, monitoramento e segurança",
    ],
    riscos: [
      { risco: "Viver de projeto avulso, sem receita recorrente", mitigacao: "Meta de 50% da receita em contratos mensais de sustentação" },
      { risco: "Dependência de uma pessoa-chave", mitigacao: "Documentação de arquitetura e rodízio de plantão" },
      { risco: "Incidente de segurança em cliente", mitigacao: "Backup testado, controle de acesso e plano de resposta a incidente" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Foque em um vertical (ex.: órgãos públicos municipais) para reaproveitar solução e referência.",
        indicador: "Clientes ativos por vertical e receita por cliente",
        hipotese: "Reaproveitar a mesma solução em vários municípios derruba o custo de entrega.",
      },
      proposta: {
        boaPratica: "Venda resultado mensurável (disponibilidade, tempo de resposta) com SLA — não horas de desenvolvimento.",
        indicador: "Disponibilidade do serviço e cumprimento do SLA",
        hipotese: "Clientes preferem pagar mensalidade a contratar projeto fechado.",
      },
      canais: {
        boaPratica: "Transforme cada entrega em estudo de caso de uma página com números — é o seu melhor material de venda.",
        indicador: "Estudos de caso publicados e oportunidades originadas",
        hipotese: "Estudos de caso geram mais contato qualificado do que anúncio.",
      },
      relacionamento: {
        boaPratica: "Reunião mensal de 30 minutos com relatório de SLA, chamados e próximos passos.",
        indicador: "Churn e expansão de contrato",
        hipotese: "Relatório mensal aumenta renovação e abre venda adicional.",
      },
      receitas: {
        boaPratica: "Empacote suporte e sustentação em planos mensais; projeto vira porta de entrada, não o negócio.",
        indicador: "MRR (receita recorrente mensal) e % sobre o total",
        hipotese: "Converter 30% dos clientes de projeto em sustentação estabiliza o caixa.",
      },
      recursos: {
        boaPratica: "Padronize ambiente e documentação (repositório, runbook, inventário) para qualquer pessoa assumir.",
        indicador: "Tempo para um novo técnico assumir um cliente",
        hipotese: "Documentação reduz a dependência de pessoas-chave.",
      },
      atividades: {
        boaPratica: "Automatize monitoramento, backup e deploy; humanos ficam com o que exige julgamento.",
        indicador: "Chamados evitados por automação e tempo médio de resolução",
        hipotese: "Monitoramento proativo reduz chamados em 30%.",
      },
      parcerias: {
        boaPratica: "Formalize parceria com 1 provedor de nuvem e 1 revenda de hardware para condições melhores e indicação.",
        indicador: "Receita originada por parceiros",
        hipotese: "Consultorias maiores subcontratariam execução se houvesse processo claro.",
      },
      custos: {
        boaPratica: "Acompanhe custo de infraestrutura por cliente e reajuste contratos anualmente por índice.",
        indicador: "Margem por contrato e custo de nuvem por cliente",
        hipotese: "Alguns contratos antigos dão margem negativa depois da inflação.",
      },
    },
  },

  alimentacao: {
    propostaValor: [
      "Refeição segura e no horário, com rastreabilidade e controle sanitário documentado",
      "Preço por prato sob controle, sem surpresa de custo para o contratante",
      "Entrega em rota previsível para escola, refeitório e evento",
    ],
    canaisIdeais: [
      "Chamadas públicas e pregões de merenda escolar (PNCP, portais e prefeituras)",
      "Contato direto com RH e facilities de empresas com refeitório",
      "WhatsApp, cardápio digital e Instagram para o consumidor final",
    ],
    relacionamento: [
      "Nutricionista como ponto de contato técnico com o contratante",
      "Pesquisa de satisfação semanal curta com registro de ocorrências",
    ],
    custos: [
      "Insumos e perdas (maior custo variável)",
      "Equipe de produção e nutricionista",
      "Logística, combustível e manutenção de veículo",
    ],
    riscos: [
      { risco: "Alta do insumo comprime a margem do contrato", mitigacao: "Cotação semanal, cláusula de reajuste e cardápio com substituições aprovadas" },
      { risco: "Ocorrência sanitária ou lote rejeitado", mitigacao: "Controle de temperatura, rastreabilidade e amostra-testemunha" },
      { risco: "Atraso de pagamento de contrato público", mitigacao: "Reserva de capital de giro e mix com venda direta" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Equilibre contrato público (volume) com venda direta (margem) para não depender de um único pagador.",
        indicador: "% da receita por tipo de cliente",
        hipotese: "A venda direta ao consumidor tem margem maior e ocupa a capacidade ociosa.",
      },
      proposta: {
        boaPratica: "Monte a ficha técnica de cada prato — custo, gramatura e valor nutricional — e use como argumento de confiança.",
        indicador: "Custo por prato e % de pratos dentro da ficha técnica",
        hipotese: "Ficha técnica completa ajuda a vencer propostas por confiança, não só por preço.",
      },
      canais: {
        boaPratica: "Cadastre-se para receber alertas de chamadas públicas de merenda e calendarize os prazos de habilitação.",
        indicador: "Chamadas monitoradas vs. propostas enviadas",
        hipotese: "Há chamadas públicas da região que não estamos disputando.",
      },
      relacionamento: {
        boaPratica: "Registre ocorrências e a resposta em até 24h — contratante vê organização e renova.",
        indicador: "Ocorrências por mil refeições e tempo de resposta",
        hipotese: "Resposta rápida a ocorrência é o maior fator de renovação.",
      },
      receitas: {
        boaPratica: "Acompanhe a margem por contrato e por prato; recuse volume que só gera prejuízo.",
        indicador: "Margem por contrato",
        hipotese: "Um dos contratos atuais não cobre o custo real do prato.",
      },
      recursos: {
        boaPratica: "Mantenha alvará, boas práticas e responsabilidade técnica em dia — são condição para qualquer contrato.",
        indicador: "% de documentos sanitários válidos",
        hipotese: "Documentação sanitária completa abre contratos que hoje descartamos.",
      },
      atividades: {
        boaPratica: "Padronize receita, porcionamento e rota de entrega; planeje a produção pelo pedido, não pela sobra.",
        indicador: "Desperdício (%) e entregas no horário",
        hipotese: "Planejar a produção pelo pedido corta o desperdício em 20%.",
      },
      parcerias: {
        boaPratica: "Compre direto de produtores locais (inclusive da agricultura familiar) para custo e história de origem.",
        indicador: "% de insumo comprado de produtor local e variação de preço",
        hipotese: "Produtores locais entregam mais barato e dão argumento comercial.",
      },
      custos: {
        boaPratica: "Calcule custo por prato com perdas e frete; reveja cardápio sempre que o insumo-chave subir.",
        indicador: "Custo por prato e % de perda",
        hipotese: "O frete e a perda pesam mais do que o preço do insumo.",
      },
    },
  },

  comercio: {
    propostaValor: [
      "Produto certo disponível na hora, com preço claro e pós-venda que resolve",
      "Atendimento próximo e conhecimento do que o cliente da região precisa",
      "Fornecimento recorrente com prazo e nota correta para empresas e órgãos públicos",
    ],
    canaisIdeais: [
      "Balcão e WhatsApp com catálogo atualizado",
      "Portais de compra pública e cotação para fornecimento",
      "Google Meu Negócio, redes sociais e marketplaces regionais",
    ],
    relacionamento: [
      "Cadastro de clientes com histórico de compra e aviso de reposição",
      "Pós-venda ativo: pergunta se deu certo e oferece complemento",
    ],
    custos: [
      "Estoque (capital parado) e perdas",
      "Ponto comercial, equipe de vendas e comissão",
      "Frete, embalagem e taxas de plataforma",
    ],
    riscos: [
      { risco: "Estoque parado enquanto falta o item que mais gira", mitigacao: "Curva ABC mensal e reposição por giro, não por intuição" },
      { risco: "Margem corroída por concorrência de preço", mitigacao: "Diferenciar por serviço, kits e atendimento" },
      { risco: "Dependência de um fornecedor", mitigacao: "Pelo menos 2 fornecedores para os itens de maior giro" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Identifique os 20% de clientes que geram 80% da receita e trate-os com atenção diferenciada.",
        indicador: "Receita por segmento de cliente e taxa de recompra",
        hipotese: "Poucos clientes recorrentes sustentam a maior parte do faturamento.",
      },
      proposta: {
        boaPratica: "Defina 3 motivos objetivos para comprar de você (disponibilidade, prazo, atendimento) e use em toda comunicação.",
        indicador: "% de vendas perdidas por falta de item",
        hipotese: "Disponibilidade, mais do que preço, decide a compra do cliente recorrente.",
      },
      canais: {
        boaPratica: "Mantenha um catálogo de WhatsApp atualizado com preço e foto, e responda em até 10 minutos no horário comercial.",
        indicador: "Tempo de resposta e conversão por canal",
        hipotese: "O WhatsApp converte mais que o balcão para itens recorrentes.",
      },
      relacionamento: {
        boaPratica: "Aviso de reposição e pós-venda em 7 dias transformam venda isolada em compra recorrente.",
        indicador: "Taxa de recompra em 90 dias",
        hipotese: "Aviso de reposição aumenta a recompra de itens de consumo.",
      },
      receitas: {
        boaPratica: "Acompanhe margem por categoria; corte o que ocupa estoque e não dá margem.",
        indicador: "Margem por categoria e giro de estoque",
        hipotese: "Uma categoria inteira ocupa capital e dá pouca margem.",
      },
      recursos: {
        boaPratica: "Tenha sistema de gestão com estoque, vendas e financeiro integrados — sem isso, tudo é estimativa.",
        indicador: "Acurácia do estoque e tempo de fechamento do mês",
        hipotese: "Estoque informatizado revela perdas que hoje passam despercebidas.",
      },
      atividades: {
        boaPratica: "Defina rotina de compra: pedido semanal por curva ABC, com ponto de reposição por item.",
        indicador: "Ruptura (itens em falta) e giro de estoque",
        hipotese: "Reposição por curva ABC reduz ruptura sem aumentar estoque.",
      },
      parcerias: {
        boaPratica: "Negocie condições com 2–3 fornecedores principais e use parceiros de entrega para ampliar o raio.",
        indicador: "Prazo médio de pagamento a fornecedor e prazo de entrega",
        hipotese: "Concentrar compras melhora prazo e preço.",
      },
      custos: {
        boaPratica: "Calcule o custo de manter estoque (capital + perda + espaço) e inclua no preço dos itens de baixo giro.",
        indicador: "Custo de estoque sobre receita",
        hipotese: "O estoque parado custa mais do que a margem dos itens de baixo giro.",
      },
    },
  },

  servico: {
    propostaValor: [
      "Serviço entregue no prazo e no escopo combinados, sem surpresa no preço",
      "Profissional que se responsabiliza pelo resultado e acompanha depois",
      "Proposta clara em até 24 horas",
    ],
    canaisIdeais: [
      "Indicação de clientes satisfeitos (com pedido ativo de indicação)",
      "Google Meu Negócio e avaliações públicas",
      "Parcerias com quem vende produto complementar",
    ],
    relacionamento: [
      "Orçamento padronizado e acompanhamento por mensagem durante a execução",
      "Pós-serviço com pesquisa curta e oferta de manutenção",
    ],
    custos: [
      "Mão de obra e deslocamento",
      "Ferramentas, material e seguro",
      "Tempo de orçamento não convertido",
    ],
    riscos: [
      { risco: "Depender de indicação sem saber de onde vem o próximo cliente", mitigacao: "Criar rotina de captação semanal com meta e acompanhamento" },
      { risco: "Escopo que cresce sem cobrança", mitigacao: "Escopo escrito e aditivo para cada mudança" },
      { risco: "Agenda irregular: semana lotada e semana vazia", mitigacao: "Pacotes recorrentes e agenda planejada por 30 dias" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Identifique o perfil dos 5 melhores clientes e procure outros iguais — é a captação mais barata.",
        indicador: "Clientes novos vs. recorrentes e ticket médio por perfil",
        hipotese: "Os melhores clientes têm características em comum que podemos buscar.",
      },
      proposta: {
        boaPratica: "Descreva o serviço em pacotes com escopo, prazo e preço — pacote vende mais fácil que hora.",
        indicador: "Taxa de aceitação de proposta",
        hipotese: "Pacotes fechados convertem mais do que orçamento aberto.",
      },
      canais: {
        boaPratica: "Peça avaliação pública após cada serviço e responda a todas — é a vitrine do negócio local.",
        indicador: "Avaliações novas por mês e contatos originados do Google",
        hipotese: "Mais avaliações aumentam os contatos espontâneos.",
      },
      relacionamento: {
        boaPratica: "Mande mensagem de acompanhamento 7 dias depois do serviço — gera correção rápida e indicação.",
        indicador: "% de clientes que indicam ou recontratam",
        hipotese: "Contato pós-serviço aumenta indicações.",
      },
      receitas: {
        boaPratica: "Crie ao menos um serviço recorrente (manutenção, plano mensal) para nivelar a receita.",
        indicador: "Receita recorrente e variação mês a mês",
        hipotese: "Um plano de manutenção reduz a oscilação do faturamento.",
      },
      recursos: {
        boaPratica: "Registre portfólio com antes e depois — é a prova mais forte que um prestador tem.",
        indicador: "Casos documentados com foto e resultado",
        hipotese: "Portfólio visual reduz a objeção de preço.",
      },
      atividades: {
        boaPratica: "Padronize o roteiro de orçamento e execução em checklist para qualquer pessoa da equipe repetir.",
        indicador: "Tempo de orçamento e retrabalho por serviço",
        hipotese: "Checklist reduz retrabalho e melhora o prazo.",
      },
      parcerias: {
        boaPratica: "Combine indicação mútua com 2 negócios complementares, com regra simples de reciprocidade.",
        indicador: "Clientes recebidos de parceiros",
        hipotese: "Negócios complementares da região aceitam indicação recíproca.",
      },
      custos: {
        boaPratica: "Calcule o valor da sua hora com deslocamento e ociosidade, e precifique a partir dele.",
        indicador: "Margem por serviço e taxa de ocupação da agenda",
        hipotese: "Alguns serviços dão menos que o custo real da hora.",
      },
    },
  },

  outro: {
    propostaValor: [
      "Entrega do que foi prometido, no prazo, com comunicação clara",
      "Atendimento próximo, de quem conhece a região",
      "Preço transparente e sem surpresa",
    ],
    canaisIdeais: [
      "Indicação ativa de clientes satisfeitos",
      "Google Meu Negócio e redes sociais",
      "Parcerias com negócios complementares da região",
    ],
    relacionamento: [
      "Atendimento direto e acompanhamento depois da venda",
      "Registro de cada cliente com histórico e próxima ação",
    ],
    custos: [
      "Equipe e pró-labore",
      "Estrutura fixa e ferramentas",
      "Custo variável por entrega",
    ],
    riscos: [
      { risco: "Crescer sem processo definido", mitigacao: "Documentar as 3 rotinas principais antes de contratar" },
      { risco: "Dependência de poucos clientes", mitigacao: "Meta de novos clientes por mês e limite de concentração" },
      { risco: "Não saber qual serviço dá lucro", mitigacao: "Calcular margem por serviço todo mês" },
    ],
    blocos: {
      clientes: {
        boaPratica: "Descreva seu cliente ideal em 3 linhas — quem é, o que precisa, onde está — e busque mais iguais a ele.",
        indicador: "Clientes ativos e ticket médio",
        hipotese: "Existe um tipo de cliente que compra mais e reclama menos.",
      },
      proposta: {
        boaPratica: "Escreva em uma frase o problema que você resolve e para quem; teste a frase com 5 clientes.",
        indicador: "% de contatos que entendem a oferta na primeira conversa",
        hipotese: "Clientes compram por um motivo principal que ainda não está claro na comunicação.",
      },
      canais: {
        boaPratica: "Escolha 2 canais e domine-os antes de abrir um terceiro.",
        indicador: "Contatos e vendas por canal",
        hipotese: "Um dos canais atuais traz a maior parte da receita.",
      },
      relacionamento: {
        boaPratica: "Registre cada cliente e defina a próxima ação de contato.",
        indicador: "Taxa de recompra",
        hipotese: "Contato ativo aumenta a recompra.",
      },
      receitas: {
        boaPratica: "Acompanhe a receita por produto ou serviço e a margem de cada um.",
        indicador: "Receita e margem por oferta",
        hipotese: "Uma oferta responde pela maior parte do lucro.",
      },
      recursos: {
        boaPratica: "Liste o que, se faltasse amanhã, pararia o negócio, e crie um plano para cada item.",
        indicador: "Itens críticos sem plano de contingência",
        hipotese: "Há um recurso crítico sem reserva.",
      },
      atividades: {
        boaPratica: "Documente as 3 rotinas que mais se repetem em um passo a passo simples.",
        indicador: "Rotinas documentadas",
        hipotese: "Documentar libera tempo do dono.",
      },
      parcerias: {
        boaPratica: "Procure 2 negócios complementares e proponha indicação mútua com regra simples.",
        indicador: "Clientes vindos de parceiros",
        hipotese: "Parceiros complementares aceitam indicar.",
      },
      custos: {
        boaPratica: "Separe custo fixo e variável e calcule o ponto de equilíbrio mensal.",
        indicador: "Ponto de equilíbrio e margem de contribuição",
        hipotese: "O ponto de equilíbrio é maior do que imaginamos.",
      },
    },
  },
};

export function conteudoCanvas(segmento: Segmento): ConteudoCanvas {
  return CONTEUDO[segmento] ?? CONTEUDO.outro;
}

/** Pergunta-guia de cada quadro — igual em todos os segmentos. */
export const PERGUNTA_BLOCO: Record<ChaveBloco, string> = {
  clientes: "Para quem criamos valor? Quem são os clientes mais importantes?",
  proposta: "Que valor entregamos? Que problema resolvemos e por que nos escolher?",
  canais: "Por quais canais o cliente nos descobre, compra e recebe?",
  relacionamento: "Que tipo de relação cada tipo de cliente espera de nós?",
  receitas: "Pelo que o cliente paga hoje — e de que forma?",
  recursos: "Que ativos são indispensáveis para entregar a proposta?",
  atividades: "Que atividades precisamos executar muito bem?",
  parcerias: "Quem são os parceiros e fornecedores-chave, e o que cada um nos dá?",
  custos: "Quais são os custos mais relevantes do modelo?",
};

/** Título e posição de leitura (1 = clientes) — ordem recomendada pelo método:
 *  começa em quem compra e termina no que custa. */
export const ORDEM_BLOCOS: ReadonlyArray<{ chave: ChaveBloco; titulo: string }> = [
  { chave: "clientes", titulo: "Segmentos de Clientes" },
  { chave: "proposta", titulo: "Proposta de Valor" },
  { chave: "canais", titulo: "Canais" },
  { chave: "relacionamento", titulo: "Relacionamento com Clientes" },
  { chave: "receitas", titulo: "Fontes de Receita" },
  { chave: "recursos", titulo: "Recursos Principais" },
  { chave: "atividades", titulo: "Atividades-Chave" },
  { chave: "parcerias", titulo: "Parcerias Principais" },
  { chave: "custos", titulo: "Estrutura de Custos" },
];
