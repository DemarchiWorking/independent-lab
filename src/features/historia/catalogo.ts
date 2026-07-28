import type { Capitulo } from "./tipos";

/**
 * Arco narrativo do Vale do Café — o enredo da startup regional.
 *
 * Mesmo padrão dos outros catálogos do projeto (`CARGOS_IA`, `CATALOGO_MOBILIA`,
 * `NIVEIS_SEDE`): array estático, `id` estável, nada persistido além do id.
 *
 * Três regras de escrita que valem para qualquer capítulo novo:
 *
 * 1. **Situação real de PME**, não fantasia corporativa. O empresário de Mendes
 *    precisa se reconhecer na cena — é isso que faz a gamificação ensinar.
 * 2. **Toda escolha custa alguma coisa.** Se uma opção é obviamente melhor, não
 *    é escolha, é enfeite. Trade-off real ou nada.
 * 3. **Risco é custo de oportunidade, nunca destruição.** O pior desfecho tira
 *    moeda virtual ou deixa de dar ganho — jamais rebaixa degrau ou zera eixo.
 *    Há teste travando isso (`catalogo.test.ts`).
 *
 * `peso` ordena quando vários capítulos vencem juntos (jogador que sumiu uma
 * semana). Menor = mais cedo na leitura.
 */
export const CATALOGO_HISTORIA: readonly Capitulo[] = [
  // ---------------------------------------------------------------- dia 0
  {
    id: "chegada",
    peso: 0,
    titulo: "Seu negócio entrou no mapa",
    remetente: "Prefeitura de Mendes · Sala do Empreendedor",
    narrativa:
      "Seu endereço acabou de aparecer no mapa do Vale do Café. Os vizinhos de " +
      "quarteirão já conseguem ver sua fachada. O que ninguém vê ainda é o que " +
      "acontece lá dentro — e é isso que vai definir se você vira referência ou " +
      "só mais um ponto no mapa.",
    gatilho: { tipo: "diasAposCadastro", dias: 0 },
    escolhas: [
      {
        id: "arrumar-casa",
        rotulo: "Arrumar a casa primeiro",
        descricao: "Organizar o interno antes de aparecer para fora.",
        tom: "neutro",
        efeito: { xp: 30, atributos: { processo: 1 } },
        desfecho:
          "Você começou pelo alicerce. Menos glamour, menos retrabalho depois.",
      },
      {
        id: "abrir-portas",
        rotulo: "Abrir as portas já",
        descricao: "Priorizar visibilidade, mesmo com a operação crua.",
        tom: "risco",
        efeito: { xp: 30, atributos: { presenca: 2, processo: -1 } },
        desfecho:
          "Apareceu rápido. Agora tem gente olhando enquanto você ainda arruma " +
          "as gavetas — funciona, mas cansa.",
      },
    ],
  },

  // ---------------------------------------------------------------- dia 2
  {
    id: "primeiro-cliente-pergunta",
    peso: 10,
    titulo: "\"Vocês têm site?\"",
    remetente: "Dona Marlene · cliente do bairro",
    narrativa:
      "Uma cliente perguntou seu site para indicar você a uma amiga. Você " +
      "percebeu que não tem o que mandar além do WhatsApp. Ela indicou assim " +
      "mesmo — mas a pergunta ficou.",
    gatilho: { tipo: "diasAposCadastro", dias: 2 },
    escolhas: [
      {
        id: "pagina-simples",
        rotulo: "Montar uma página simples",
        descricao: "Custa 🪙 120 e algumas horas, mas te dá o que mandar.",
        tom: "beneficio",
        efeito: { xp: 60, moeda: -120, atributos: { presenca: 3 } },
        desfecho:
          "Agora tem link para mandar. Parece pouco — é o que separa \"me " +
          "indica\" de \"me indica e a pessoa acha\".",
      },
      {
        id: "so-whatsapp",
        rotulo: "Seguir só no WhatsApp",
        descricao: "Zero custo agora. A pergunta vai voltar.",
        tom: "risco",
        efeito: { xp: 20 },
        desfecho:
          "Economizou hoje. A próxima indicação vai esbarrar no mesmo lugar.",
      },
    ],
  },

  // ---------------------------------------------------------------- dia 5
  {
    id: "concorrente-anuncia",
    peso: 20,
    titulo: "O vizinho começou a anunciar",
    remetente: "Observatório do quarteirão",
    narrativa:
      "Um negócio do mesmo quarteirão começou a aparecer patrocinado. Não é " +
      "necessariamente melhor que o seu — só está mais visível. No comércio " +
      "regional, ser lembrado na hora certa vale mais que ser o melhor.",
    gatilho: { tipo: "diasAposCadastro", dias: 5 },
    escolhas: [
      {
        id: "responder-anuncio",
        rotulo: "Responder na mesma moeda",
        descricao: "Investir 🪙 300 em presença agora.",
        tom: "risco",
        efeito: { xp: 50, moeda: -300, atributos: { presenca: 4, aquisicao: 1 } },
        desfecho:
          "Você entrou no jogo dele. Funciona — mas agora é um custo recorrente " +
          "que precisa se pagar.",
      },
      {
        id: "diferenciar",
        rotulo: "Apostar na diferença, não no volume",
        descricao: "Focar em quem já te conhece, sem gastar em mídia.",
        tom: "beneficio",
        efeito: { xp: 70, atributos: { processo: 2, aquisicao: 2 } },
        desfecho:
          "Você foi atrás da base que já confia em você. Mais lento, mais barato, " +
          "e não some quando o anúncio para.",
      },
    ],
  },

  // ---------------------------------------------------------------- dia 9
  {
    id: "proposta-parceria",
    peso: 30,
    titulo: "Proposta de parceria no quarteirão",
    remetente: "Rogério · negócio vizinho",
    narrativa:
      "O vizinho de lote propôs indicar clientes um para o outro. Sem contrato, " +
      "sem comissão — palavra. Parcerias assim são o que faz o comércio regional " +
      "girar, e também o que gera aquela treta silenciosa quando um lado indica " +
      "muito mais que o outro.",
    gatilho: { tipo: "diasAposCadastro", dias: 9 },
    escolhas: [
      {
        id: "topar-informal",
        rotulo: "Topar no aperto de mão",
        descricao: "Rápido, sem burocracia, sem garantia.",
        tom: "risco",
        efeito: { xp: 80, atributos: { aquisicao: 3 } },
        desfecho:
          "Começou a render logo. Se desandar, não há o que cobrar — e você vai " +
          "descobrir isso do jeito difícil.",
      },
      {
        id: "combinar-regras",
        rotulo: "Topar, mas combinar as regras antes",
        descricao: "Meia hora de conversa chata que evita meses de mal-estar.",
        tom: "beneficio",
        efeito: {
          xp: 100,
          atributos: { aquisicao: 3, processo: 2 },
          documento: "acordo-parceria-simples",
        },
        desfecho:
          "Vocês escreveram o combinado numa página. Parece exagero entre " +
          "vizinhos — é o que faz a parceria durar depois do primeiro atrito.",
      },
    ],
  },

  // ------------------------------------------------- gatilho de dor (estado)
  {
    id: "lead-perdido",
    peso: 40,
    titulo: "O lead que esfriou",
    remetente: "Seu WhatsApp, 3 dias atrás",
    narrativa:
      "Alguém perguntou preço e você respondeu no dia seguinte. Quando " +
      "respondeu, já tinha fechado com outro. Não foi preço: foi tempo. É o " +
      "gargalo nº 1 de quem atende sozinho.",
    // dispara quando Aquisição está baixa E já houve tempo de casa
    gatilho: {
      tipo: "todos",
      de: [
        { tipo: "diasAposCadastro", dias: 12 },
        { tipo: "atributoAbaixo", chave: "aquisicao", valor: 12 },
      ],
    },
    escolhas: [
      {
        id: "resposta-rapida",
        rotulo: "Criar respostas prontas",
        descricao: "Não automatiza tudo, mas corta o tempo de primeira resposta.",
        tom: "beneficio",
        efeito: {
          xp: 90,
          atributos: { aquisicao: 3, processo: 1 },
          documento: "kit-primeira-resposta",
        },
        desfecho:
          "Primeira resposta em minutos em vez de horas. É a mudança mais barata " +
          "com maior efeito no funil de uma PME.",
      },
      {
        id: "seguir-manual",
        rotulo: "Seguir respondendo quando der",
        descricao: "Sem custo. O gargalo continua.",
        tom: "risco",
        efeito: { xp: 20 },
        desfecho: "Vai acontecer de novo. E de novo.",
      },
    ],
  },

  // --------------------------------------------- gatilho por equipe (estado)
  {
    id: "equipe-cresceu",
    peso: 50,
    titulo: "Alguém trabalhando por você",
    remetente: "Laboratório Demarchi",
    narrativa:
      "Você contratou seu primeiro Funcionário de IA. Pela primeira vez existe " +
      "produção acontecendo quando você não está olhando. Isso muda o que você " +
      "precisa fazer: menos executar, mais revisar e direcionar.",
    gatilho: { tipo: "equipeMinima", quantidade: 1 },
    escolhas: [
      {
        id: "definir-rotina",
        rotulo: "Definir a rotina de revisão",
        descricao: "Combinar o que é entregue, quando, e quem confere.",
        tom: "beneficio",
        efeito: {
          xp: 120,
          atributos: { processo: 3, capacidade: 2 },
          documento: "rotina-revisao-ia",
        },
        desfecho:
          "Você virou gestor de uma entrega, não executor dela. É a passagem " +
          "que trava a maioria dos donos de PME.",
      },
      {
        id: "deixar-rodar",
        rotulo: "Deixar rodar e ver no que dá",
        descricao: "Menos trabalho agora, mais retrabalho depois.",
        tom: "risco",
        efeito: { xp: 40, atributos: { capacidade: 1 } },
        desfecho:
          "Rodou. Uma parte veio ótima, outra fora do tom — e você só descobriu " +
          "quando o cliente comentou.",
      },
    ],
  },

  // ------------------------------------------------- dia 30 · retrospectiva
  {
    id: "retro-30",
    peso: 60,
    titulo: "Um mês de estrada",
    remetente: "Você mesmo, daqui a um ano",
    narrativa:
      "Faz um mês que seu negócio está no mapa. Dá para seguir no automático " +
      "ou parar meia hora e olhar o que funcionou. Quem olha, ajusta. Quem não " +
      "olha, repete.",
    gatilho: { tipo: "diasAposCadastro", dias: 30 },
    escolhas: [
      {
        id: "fazer-retro",
        rotulo: "Parar e revisar o mês",
        descricao: "Meia hora olhando o que deu certo e o que travou.",
        tom: "beneficio",
        efeito: {
          xp: 150,
          moeda: 200,
          atributos: { processo: 2, capacidade: 2 },
          documento: "retro-90-dias",
        },
        desfecho:
          "Você tem clareza do que repetir e do que cortar. É o hábito que " +
          "separa negócio que cresce de negócio que só se mexe.",
      },
      {
        id: "seguir-tocando",
        rotulo: "Seguir tocando",
        descricao: "O mês que vem resolve.",
        tom: "neutro",
        efeito: { xp: 50 },
        desfecho: "Seguiu. O mês que vem chega igual — e a pergunta também.",
      },
    ],
  },

  // ----------------------------------------------------- evento global (data)
  {
    id: "semana-empreendedor-2026",
    peso: 5,
    titulo: "Semana do Empreendedor do Vale do Café",
    remetente: "Sebrae · edição regional",
    narrativa:
      "A Semana do Empreendedor começou na região. Durante alguns dias há " +
      "rodada de negócios, oficinas e — o que costuma valer mais — gente do " +
      "mesmo tamanho que o seu no mesmo lugar.",
    // evento de calendário: todos recebem, e some depois de 10 dias
    gatilho: { tipo: "dataFixa", iso: "2026-08-10T00:00:00.000Z", janelaDias: 10 },
    escolhas: [
      {
        id: "ir-na-rodada",
        rotulo: "Ir na rodada de negócios",
        descricao: "Um dia fora da operação, apostando em conexão.",
        tom: "beneficio",
        efeito: { xp: 130, atributos: { aquisicao: 3, presenca: 2 } },
        desfecho:
          "Voltou com contatos e com a sensação incômoda e útil de ver o que os " +
          "outros já estão fazendo.",
      },
      {
        id: "ficar-na-operacao",
        rotulo: "Ficar na operação",
        descricao: "O trabalho não para sozinho.",
        tom: "neutro",
        efeito: { xp: 40, atributos: { capacidade: 1 } },
        desfecho:
          "Entregou o dia sem sobressalto. A rodada acontece de novo — a " +
          "próxima em alguns meses.",
      },
    ],
  },

  // ----------------------------------------- encadeado + condicionado por XP
  {
    id: "referencia-do-bairro",
    peso: 70,
    titulo: "Te chamaram de referência",
    remetente: "Grupo de WhatsApp do comércio local",
    narrativa:
      "Alguém indicou seu negócio no grupo do comércio como \"o que faz " +
      "direito\". Reputação regional é lenta de construir e rápida de perder — " +
      "e agora tem gente olhando com expectativa.",
    gatilho: {
      tipo: "todos",
      de: [
        { tipo: "aposCapitulo", capituloId: "retro-30" },
        { tipo: "xpMinimo", xp: 800 },
      ],
    },
    escolhas: [
      {
        id: "assumir-papel",
        rotulo: "Assumir o papel e ajudar os vizinhos",
        descricao: "Custa tempo. Devolve rede e autoridade.",
        tom: "beneficio",
        efeito: {
          xp: 200,
          atributos: { presenca: 4, aquisicao: 2 },
          documento: "playbook-autoridade-local",
        },
        desfecho:
          "Você virou o ponto de referência do quarteirão. Rede regional é o " +
          "ativo que concorrente de fora não compra.",
      },
      {
        id: "seguir-discreto",
        rotulo: "Agradecer e seguir discreto",
        descricao: "Sem holofote, sem carga extra.",
        tom: "neutro",
        efeito: { xp: 80, atributos: { capacidade: 2 } },
        desfecho:
          "Preservou seu tempo. A indicação continua vindo, num ritmo menor.",
      },
    ],
  },
] as const;

export function capitulosDoCatalogo(): readonly Capitulo[] {
  return CATALOGO_HISTORIA;
}
