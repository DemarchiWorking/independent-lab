import { contextoPublico, type ContextoPublico } from "./contexto";
import { baseadoEm, metaDoDocumento, secao } from "./documento";
import { LIMITE_LEGENDA } from "./edicao";
import { hashtag, listaPt, minusculaInicial, truncar } from "./linguagem";
import { perfilDeMercado } from "./mercado";
import { EQUIPE } from "./mercado/planos";
import { SEGMENTOS } from "./mercado/segmentos";
import type {
  AnguloPauta,
  Bloco,
  ContextoNegocio,
  DiaCalendario,
  Documento,
  PacoteCarrossel,
  PautaCarrossel,
  PerfilMercado,
  SlideCarrossel,
} from "./tipos";

/**
 * Pacote de carrosséis — entregável do Social Media IA.
 *
 * Segundo o playbook, a entrega é: roteiro, copy e direção de arte de
 * carrosséis para Instagram e LinkedIn, mais calendário de postagem sugerido.
 *
 * Duas regras de projeto:
 *
 * 1. MATERIAL PÚBLICO só lê o contexto público. Este arquivo recebe o contexto
 *    completo, mas converte com `contextoPublico` e passa só ele para os
 *    construtores de pauta — o tipo não tem `privado`, então o compilador
 *    impede o gargalo ou o orçamento do dono de vazarem para um post. A única
 *    leitura de dado privado é o TAMANHO DA EQUIPE, para dimensionar quantas
 *    publicações por semana cabem no calendário.
 *
 * 2. A IA NÃO INVENTA FATO SOBRE O NEGÓCIO. As pautas usam o que o dono
 *    publicou (ofertas, parcerias) e conhecimento geral útil ao cliente
 *    (dicas, mitos). Onde só o dono sabe (um bastidor real), a pauta vem como
 *    RASCUNHO com campos `[entre colchetes]`, que o editor obriga a preencher.
 */

export const LIMITE_TITULO_SLIDE = 60;
export const LIMITE_TEXTO_SLIDE = 180;
export { LIMITE_LEGENDA };

function slide(papel: SlideCarrossel["papel"], titulo: string, texto: string): SlideCarrossel {
  return {
    papel,
    titulo: truncar(titulo, LIMITE_TITULO_SLIDE),
    texto: truncar(texto, LIMITE_TEXTO_SLIDE),
  };
}

function slideFinal(pub: ContextoPublico): SlideCarrossel {
  return slide(
    "cta",
    "Vamos conversar?",
    `Chame ${pub.nome} no WhatsApp e conte o que você precisa. Atendimento em ${pub.cidade}.`,
  );
}

function etiquetas(pub: ContextoPublico, p: PerfilMercado): string[] {
  const todas = [...p.hashtags, hashtag(pub.cidade), "#apoielocal"].filter(Boolean);
  return [...new Set(todas)].slice(0, 8);
}

function legenda(pub: ContextoPublico, gancho: string, corpo: string): string {
  const texto = [
    gancho,
    corpo,
    `Salve este post e compartilhe com quem precisa. Para conversar, chame ${pub.nome} no WhatsApp.`,
  ].join("\n\n");
  return truncar(texto, LIMITE_LEGENDA);
}

/**
 * Descrição para leitor de tela: diz o que cada slide FALA, não só o título.
 * "Dica 1; Dica 2; Dica 3" não ajuda ninguém; "Dica 1: use xampu indicado..."
 * sim. Limitada a 300 caracteres, que cabe nos campos de texto alternativo.
 */
function textoAlternativo(slides: readonly SlideCarrossel[]): string {
  const capa = slides[0];
  const resto = slides
    .slice(1)
    .filter((s) => s.papel !== "cta")
    .map((s) => (s.texto ? `${s.titulo}: ${s.texto}` : s.titulo).replace(/[.!?]+$/, ""));
  return truncar(`Carrossel de ${slides.length} slides sobre ${capa.titulo.replace(/[.!?]+$/, "")}. ${resto.join(". ")}.`, 300);
}

function pauta(
  id: string,
  angulo: AnguloPauta,
  rotulo: string,
  objetivo: string,
  slides: SlideCarrossel[],
  textos: { gancho: string; corpo: string },
  pub: ContextoPublico,
  p: PerfilMercado,
  orientacaoVisual: string,
  rascunho = false,
): PautaCarrossel {
  return {
    id,
    angulo,
    rotulo,
    objetivo,
    slides,
    legenda: legenda(pub, textos.gancho, textos.corpo),
    hashtags: etiquetas(pub, p),
    textoAlternativo: textoAlternativo(slides),
    orientacaoVisual,
    rascunho,
  };
}

function pautaDicas(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const dica = p.dicas[0];
  const slides = [
    slide("capa", dica.titulo, "Salve este post para consultar depois"),
    ...dica.pontos.slice(0, 4).map((ponto, i) => slide("conteudo", `Dica ${i + 1}`, ponto)),
    slideFinal(pub),
  ];
  return pauta(
    "dicas",
    "dicas",
    "Dicas de quem entende",
    "Ser lembrado como referência e receber salvamentos e compartilhamentos",
    slides,
    { gancho: dica.titulo, corpo: `São ${Math.min(4, dica.pontos.length)} pontos rápidos, um por slide. Qual deles você já faz? Conte nos comentários.` },
    pub,
    p,
    "Use uma foto real do seu espaço ou do seu trabalho na capa, com boa luz. Nos slides internos, mantenha fundo liso e texto grande.",
  );
}

function pautaOferta(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const temOfertas = pub.ofertas.length > 0;
  const slides: SlideCarrossel[] = [
    slide("capa", temOfertas ? "Conheça o que oferecemos" : `Conheça ${pub.nome}`, `${pub.nome} · ${pub.cidade}`),
  ];
  if (temOfertas) {
    for (const o of pub.ofertas.slice(0, 3)) {
      slides.push(slide("conteudo", o.titulo, [o.descricao, o.preco].filter(Boolean).join(" · ")));
    }
  } else {
    slides.push(
      slide("conteudo", "O que fazemos", `${pub.nome} trabalha com ${p.oQueVende}.`),
      slide("conteudo", "Para quem", `Para ${p.tipoDeCliente}.`),
      slide("conteudo", "O que costuma pesar na escolha", listaPt(p.desejos.slice(0, 3)).replace(/^./, (c) => c.toUpperCase()) + "."),
    );
  }
  if (temOfertas) slides.push(slide("conteudo", "Para quem", `Para ${p.tipoDeCliente}.`));
  slides.push(slideFinal(pub));
  return pauta(
    "oferta",
    "oferta",
    "O que oferecemos",
    "Gerar pedidos de orçamento",
    slides,
    {
      gancho: temOfertas ? `Conheça o que ${pub.nome} oferece em ${pub.cidade}.` : `${pub.nome} em ${pub.cidade}: ${p.oQueVende}.`,
      corpo: temOfertas
        ? `Veja nos slides: ${listaPt(pub.ofertas.slice(0, 3).map((o) => o.titulo))}.`
        : `Atendemos ${p.tipoDeCliente}.`,
    },
    pub,
    p,
    "Mostre o produto ou o serviço de verdade, em uma foto por slide. Evite imagem de banco: o cliente local quer ver o que vai receber.",
  );
}

function pautaMitos(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const slides: SlideCarrossel[] = [slide("capa", "Mito ou verdade?", `Sobre ${p.oQueVende}`)];
  for (const m of p.mitos.slice(0, 2)) {
    slides.push(slide("conteudo", "Mito", m.mito), slide("conteudo", "Verdade", m.verdade));
  }
  slides.push(slideFinal(pub));
  return pauta(
    "mitos",
    "mitos",
    "Mito ou verdade",
    "Gerar conversa e comentários",
    slides,
    { gancho: "Mito ou verdade?", corpo: `Você já ouviu isto sobre ${p.oQueVende}? Conte nos comentários qual você achava que era verdade.` },
    pub,
    p,
    "Alterne fundos de cor para o mito e para a verdade, assim quem passa rápido percebe a diferença.",
  );
}

function pautaComoPedir(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const slides = [
    slide("capa", "Como pedir um orçamento sem erro", "4 passos para comparar de forma justa"),
    slide("conteudo", "1. Conte o que você precisa", `Quanto mais detalhe, mais certo o orçamento. Pense em: ${p.perguntas[0]}`),
    slide("conteudo", "2. Diga o prazo", "Informe para quando você precisa. Prazo curto pode mudar o valor."),
    slide("conteudo", "3. Diga o valor que cabe", "Falar o seu limite ajuda a montar uma opção que caiba, sem perder tempo dos dois lados."),
    slide("conteudo", "4. Compare itens, não só o preço", "Veja o que está incluso, o prazo e a garantia em cada proposta."),
    slideFinal(pub),
  ];
  return pauta(
    "como-pedir",
    "passo-a-passo",
    "Como pedir um orçamento",
    "Educar o cliente e facilitar o primeiro contato",
    slides,
    { gancho: "Como pedir um orçamento sem erro", corpo: "Quatro passos simples para você comparar propostas de forma justa e escolher com segurança." },
    pub,
    p,
    "Use ícones simples ou uma foto de uma conversa de orçamento (sem dados de clientes) para cada passo.",
  );
}

function pautaBastidores(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const slides = [
    slide("capa", "Um dia de trabalho por aqui", `${pub.nome} · ${pub.cidade}`),
    slide("conteudo", "[Etapa 1 do seu trabalho]", "[Uma frase real sobre esta etapa]"),
    slide("conteudo", "[Etapa 2 do seu trabalho]", "[Uma frase real sobre esta etapa]"),
    slide("conteudo", "[Etapa 3 do seu trabalho]", "[Uma frase real sobre esta etapa]"),
    slideFinal(pub),
  ];
  return pauta(
    "bastidores",
    "bastidores",
    "Bastidores do trabalho",
    "Criar proximidade e confiança",
    slides,
    { gancho: "Um dia de trabalho por aqui.", corpo: "Você sempre vê o resultado. Hoje vou mostrar como ele nasce." },
    pub,
    p,
    `Complete os campos entre colchetes com o que realmente acontece no seu dia e use uma foto real em cada etapa. Ideias de imagem: ${listaPt(p.provas.slice(0, 3).map(minusculaInicial))}.`,
    true,
  );
}

function pautaLocal(pub: ContextoPublico, p: PerfilMercado): PautaCarrossel {
  const apoie = SEGMENTOS.outro.dicas[2];
  const slides: SlideCarrossel[] = [
    slide("capa", `Negócio local em ${pub.cidade}`, `${pub.nome} · ${pub.bairro}`),
    ...apoie.pontos.slice(0, 3).map((ponto, i) => slide("conteudo", `Jeito ${i + 1} de apoiar o comércio local`, ponto)),
  ];
  if (pub.parceiros.length > 0) {
    slides.push(
      slide("conteudo", "Quem trabalha junto", `${pub.nome} faz parceria com ${listaPt(pub.parceiros.slice(0, 3).map((x) => x.nome))}.`),
    );
  }
  slides.push(slideFinal(pub));
  return pauta(
    "local",
    "local",
    `Orgulho de ${pub.cidade}`,
    "Reforçar a ligação com a comunidade",
    slides,
    { gancho: `Quem faz a cidade acontecer é quem trabalha nela.`, corpo: `${pub.nome} é de ${pub.cidade} e acredita no comércio local. Veja três jeitos simples de apoiar os negócios do bairro.` },
    pub,
    p,
    "Fotografe a fachada, a rua ou um detalhe do bairro. Se mencionar parceiros, combine com eles antes de publicar.",
  );
}

const DIAS_POR_FREQUENCIA: Record<number, string[]> = {
  3: ["terça", "quinta", "sábado"],
  4: ["segunda", "quarta", "sexta", "sábado"],
  5: ["segunda", "terça", "quarta", "quinta", "sexta"],
};

const TAREFAS_LEVES: Array<{ formato: string; tarefa: string }> = [
  { formato: "Story", tarefa: "Mostrar um momento do dia de trabalho, com enquete ou caixinha de perguntas" },
  { formato: "Foto do dia (feed)", tarefa: "Uma foto real com legenda curta e uma pergunta para o público" },
  { formato: "Relacionamento", tarefa: "Responder comentários e mensagens e pedir uma avaliação no Google a um cliente satisfeito" },
  { formato: "Story", tarefa: "Compartilhar um depoimento ou um resultado, somente com autorização do cliente" },
];

export function montarCalendario(
  pautas: readonly PautaCarrossel[],
  publicacoesPorSemana: number,
  semanas: number,
): DiaCalendario[] {
  const dias = DIAS_POR_FREQUENCIA[Math.min(5, Math.max(3, publicacoesPorSemana))];
  const calendario: DiaCalendario[] = [];
  let leve = 0;

  for (let semana = 0; semana < semanas; semana++) {
    dias.forEach((dia, posicao) => {
      const quando = `Semana ${semana + 1} · ${dia}`;
      // as duas primeiras publicações da semana são os carrosséis
      if (posicao < 2 && pautas.length > 0) {
        const alvo = pautas[(semana * 2 + posicao) % pautas.length];
        calendario.push({
          quando,
          pautaId: alvo.id,
          formato: "Carrossel (feed)",
          tarefa: `Publicar a pauta "${alvo.rotulo}"`,
        });
        return;
      }
      const t = TAREFAS_LEVES[leve % TAREFAS_LEVES.length];
      leve += 1;
      calendario.push({ quando, pautaId: null, formato: t.formato, tarefa: t.tarefa });
    });
  }
  return calendario;
}

export function gerarCarrosseis(ctx: ContextoNegocio): PacoteCarrossel {
  // A partir daqui, o código de conteúdo só enxerga o contexto público.
  const pub = contextoPublico(ctx);
  const p = perfilDeMercado(pub.nicho);

  const pautas: PautaCarrossel[] = [pautaDicas(pub, p), pautaOferta(pub, p)];
  if (ctx.nivel >= 2) pautas.push(pautaMitos(pub, p), pautaComoPedir(pub, p));
  if (ctx.nivel >= 3) pautas.push(pautaBastidores(pub, p), pautaLocal(pub, p));

  const semanas = ctx.nivel >= 2 ? 4 : 2;
  const porSemana = EQUIPE[ctx.privado.equipe].publicacoesPorSemana;

  const meta = metaDoDocumento(ctx, { cargo: "Social Media IA", circulacao: "publico" });
  // o calendário usa o tamanho da equipe; a lista de origem precisa dizer isso
  meta.baseadoEm = [...baseadoEm(ctx, false), "Tamanho da equipe (apenas para dimensionar o calendário)"];

  return {
    titulo: `Carrosséis e calendário: ${pub.nome}`,
    subtitulo: `${p.rotulo} · ${pub.bairro}, ${pub.cidade}`,
    meta,
    assinatura: `${pub.nome} · ${pub.cidade}`,
    pautas,
    calendario: montarCalendario(pautas, porSemana, semanas),
    boasPraticas: [
      "O primeiro slide é a capa: uma frase curta e grande, que faça a pessoa querer deslizar",
      "Uma ideia por slide, com poucas palavras: leia no celular antes de publicar",
      "Use fotos reais do seu negócio e boa luz; quem mora perto quer ver quem vai atender",
      "Cuide do contraste do texto com o fundo e do tamanho da letra",
      "Cole o texto alternativo na publicação: ele descreve o carrossel para quem usa leitor de tela",
      "Poste nos horários em que o seu público está online (as estatísticas da conta mostram)",
      "Responda cada comentário e mensagem no mesmo dia",
    ],
    reaproveitamento:
      ctx.nivel >= 3
        ? [
            "Salve o carrossel em PDF e publique também no LinkedIn, que aceita documentos",
            "Use o primeiro slide como Story com enquete para medir o interesse",
            "Transforme a legenda em mensagem para clientes que autorizaram receber novidades",
            "Use o texto dos slides como roteiro de um vídeo curto, com o roteiro do Editor de Vídeo IA",
          ]
        : [],
    metricas: [
      "Salvamentos e compartilhamentos: mostram o que foi útil",
      "Mensagens recebidas depois da publicação: é o que mais se aproxima de venda",
      "Visitas ao perfil e cliques no link",
      "Alcance entre pessoas da sua cidade",
    ],
  };
}

function blocosDaPauta(pauta: PautaCarrossel): Bloco[] {
  const blocos: Bloco[] = [
    { tipo: "paragrafo", texto: `Objetivo: ${pauta.objetivo}.` },
  ];
  if (pauta.rascunho) {
    blocos.push({
      tipo: "destaque",
      tom: "atencao",
      titulo: "Complete antes de publicar",
      texto: "Esta pauta tem campos entre colchetes que só você sabe. Troque pelo que realmente acontece no seu negócio.",
    });
  }
  blocos.push(
    {
      tipo: "cartoes",
      cartoes: pauta.slides.map((s, i) => ({
        titulo: `Slide ${i + 1} · ${s.papel === "capa" ? "capa" : s.papel === "cta" ? "convite" : "conteúdo"}`,
        itens: [s.titulo, s.texto],
      })),
    },
    { tipo: "mensagem", rotulo: "Legenda", quando: "Cole na publicação.", texto: pauta.legenda },
    { tipo: "mensagem", rotulo: "Hashtags", texto: pauta.hashtags.join(" ") },
    { tipo: "mensagem", rotulo: "Texto alternativo (acessibilidade)", texto: pauta.textoAlternativo },
    { tipo: "destaque", tom: "info", titulo: "Direção de imagem", texto: pauta.orientacaoVisual },
  );
  return blocos;
}

/** O pacote como documento, para os renderers de HTML e Markdown. */
export function carrosselParaDocumento(pacote: PacoteCarrossel): Documento {
  const secoes = [
    secao("como-usar", "Como usar este pacote", [
      {
        tipo: "paragrafo",
        texto:
          "Cada pauta é um carrossel pronto: textos dos slides, legenda, hashtags, texto alternativo e orientação de imagem. No estúdio você edita o texto, escolhe o formato e baixa as imagens.",
      },
      {
        tipo: "destaque",
        tom: "info",
        titulo: "Material para publicar",
        texto:
          "Este material usa só informações públicas do seu negócio e conhecimento geral útil ao cliente. Confira os dados antes de publicar e use sempre fotos reais.",
      },
      { tipo: "lista", itens: pacote.boasPraticas },
    ]),
    ...pacote.pautas.map((pt, i) => secao(`pauta-${pt.id}`, `Pauta ${i + 1}: ${pt.rotulo}`, blocosDaPauta(pt))),
    secao("calendario", "Calendário de publicação", [
      {
        tipo: "tabela",
        colunas: ["Quando", "Formato", "O que fazer"],
        linhas: pacote.calendario.map((d): string[] => [d.quando, d.formato, d.tarefa]),
      },
    ]),
  ];
  if (pacote.reaproveitamento.length > 0) {
    secoes.push(secao("reaproveitamento", "Reaproveitamento sem regravar", [{ tipo: "lista", itens: pacote.reaproveitamento }]));
  }
  secoes.push(secao("metricas", "O que acompanhar", [{ tipo: "lista", itens: pacote.metricas }]));

  return {
    tipo: "carrossel",
    titulo: pacote.titulo,
    subtitulo: pacote.subtitulo,
    meta: pacote.meta,
    secoes,
    dados: { pacote },
  };
}
