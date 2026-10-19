import { contextoPublico, type ContextoPublico } from "./contexto";
import { baseadoEm, metaDoDocumento, secao } from "./documento";
import { capitalizar, hashtag, minusculaInicial, truncar } from "./linguagem";
import { perfilDeMercado } from "./mercado";
import type {
  CenaReel,
  ContextoNegocio,
  Documento,
  PerfilMercado,
  RoteiroReel,
} from "./tipos";

/**
 * Roteiro de vídeo curto (Reels, TikTok, Shorts) — entregável do Editor de
 * Vídeo IA.
 *
 * Por que ROTEIRO e não vídeo renderizado: o que trava o empresário não é a
 * edição, é não saber o que dizer nos três primeiros segundos. Um roteiro cena
 * a cena, com o que falar, o que mostrar e o texto que aparece na tela, ele
 * grava no celular hoje — com o rosto dele, que é o maior ativo de um negócio
 * local. A geração de vídeo por IA é um caminho opcional, descrito em
 * `docs/integracoes/GOOGLE-VIDEO-API.md`.
 *
 * Estrutura de vídeo curto: gancho, conteúdo útil, apresentação e convite. O
 * gancho carrega a dor DO CLIENTE (não a do dono), porque é o único trecho que
 * a plataforma usa para decidir se entrega o vídeo a mais gente.
 *
 * Material público: só lê o contexto público (ver `contexto.ts`).
 */

/** Segundos por cena — o roteiro nasce no ritmo de vídeo curto. */
export const SEGUNDOS_POR_CENA = 6;

/** Texto de tela: curto o bastante para ler em um relance. */
const LIMITE_LEGENDA_TELA = 42;

export function gerarReel(ctx: ContextoNegocio): RoteiroReel {
  const pub = contextoPublico(ctx);
  const p = perfilDeMercado(pub.nicho);
  const nivel = ctx.nivel;

  const cenas: CenaReel[] = [];
  // A janela de tempo é DERIVADA da posição: cenas de nível 2 e 3 entram no
  // meio do roteiro, e um tempo escrito à mão faria as seguintes mentirem.
  const cena = (papel: string, fala: string, imagem: string, legenda: string) => {
    const i = cenas.length;
    cenas.push({
      tempo: `${i * SEGUNDOS_POR_CENA}–${(i + 1) * SEGUNDOS_POR_CENA}s`,
      papel,
      fala,
      imagem,
      legenda: truncar(legenda, LIMITE_LEGENDA_TELA),
    });
  };

  const dor = p.dores[0];
  const dica = p.dicas[0];

  cena(
    "Gancho",
    `${capitalizar(dor)}? Se você é de ${pub.cidade}, este vídeo é para você.`,
    "Você de frente para a câmera, sem introdução e sem logo. O corte já começa na frase.",
    `${capitalizar(dor)}?`,
  );
  cena(
    "Dica",
    `Uma dica rápida: ${minusculaInicial(dica.pontos[0])}.`,
    "Mostre o que está falando: o objeto, o documento, o local. Se não tiver o que mostrar, fique em quadro e use o gesto.",
    "Dica rápida",
  );

  if (nivel >= 2) {
    cena(
      "Segunda dica",
      `E mais uma: ${minusculaInicial(dica.pontos[1] ?? dica.pontos[0])}.`,
      "Mude o enquadramento ou o cenário para manter o ritmo. Corte de um ângulo para outro a cada cena.",
      "Mais uma dica",
    );
  }

  cena(
    "Apresentação",
    `Aqui é ${pub.nome}, em ${pub.cidade}. A gente trabalha com ${p.oQueVende}.`,
    "Você de novo em quadro, em um lugar que mostre o negócio: balcão, bancada, obra, consultório, cozinha.",
    `${pub.nome} · ${pub.cidade}`,
  );

  if (nivel >= 3) {
    cena(
      "Prova",
      "Olha um exemplo real do que a gente faz.",
      `Mostre uma evidência concreta, uma só: ${minusculaInicial(p.provas[0])}.`,
      "Exemplo real",
    );
  }

  cena(
    "Convite",
    `Quer conversar? Chama no WhatsApp ou comenta QUERO que eu te respondo.`,
    "Close no seu rosto, com texto grande na tela. Convite para comentar costuma gerar mais alcance que \"link na bio\".",
    "Chama no WhatsApp",
  );

  const ganchosAlternativos =
    nivel >= 2
      ? [
          `Ninguém te conta isso sobre ${p.oQueVende} em ${pub.cidade}.`,
          `${capitalizar(p.dores[1] ?? dor)}? Veja como evitar.`,
          "Antes de fechar com alguém, confira isto.",
        ]
      : [];

  const reaproveitamento =
    nivel >= 3
      ? [
          "Corte só o gancho (primeira cena) e publique como Story com enquete, para medir o interesse",
          "Transforme as dicas em um carrossel de três telas, com o pacote do Social Media IA",
          "Use o texto das cenas como legenda e como mensagem para clientes que autorizaram receber novidades",
          "Se o vídeo passar da média de alcance da sua conta, use esse mesmo vídeo como criativo de anúncio",
        ]
      : [];

  return {
    titulo: `Roteiro de vídeo curto: ${pub.nome}`,
    subtitulo: `${p.rotulo} · ${pub.cidade}`,
    meta: {
      ...metaDoDocumento(ctx, { cargo: "Editor(a) de Vídeo IA", circulacao: "publico" }),
      baseadoEm: baseadoEm(ctx, false),
    },
    duracaoSegundos: cenas.length * SEGUNDOS_POR_CENA,
    cenas,
    legenda: legendaDoVideo(pub, p, dor),
    hashtags: etiquetas(pub, p),
    ganchosAlternativos,
    reaproveitamento,
    capturaChecklist: [
      "Grave na vertical (9:16), com o celular firme ou apoiado",
      "Limpe a lente da câmera antes de começar",
      "Prefira luz natural, de frente para a janela, nunca com a janela atrás de você",
      "Grave em lugar silencioso: o áudio pesa mais que a imagem",
      "Fale devagar e olhe para a câmera, não para a tela",
      "Faça duas tentativas de cada cena e escolha a melhor",
      "Peça autorização a quem aparecer no vídeo",
      "Use só música livre de direitos autorais, do banco da própria plataforma",
    ],
    formatos: [
      "9:16 (Reels, TikTok e Shorts): formato principal, grave neste",
      "1:1 (feed do Instagram e do LinkedIn): corte a partir do 9:16, deixando o rosto no centro",
      "16:9 (YouTube e anúncios): só se você gravar na horizontal",
    ],
  };
}

function legendaDoVideo(pub: ContextoPublico, p: PerfilMercado, dor: string): string {
  return [
    `${capitalizar(dor)}? Foi por isso que eu gravei este vídeo.`,
    `Se você é de ${pub.cidade} e precisa de ${p.oQueVende}, chama ${pub.nome} no WhatsApp.`,
    "Comenta QUERO que eu te respondo.",
  ].join("\n\n");
}

function etiquetas(pub: ContextoPublico, p: PerfilMercado): string[] {
  const todas = [...p.hashtags, hashtag(pub.cidade), "#apoielocal"].filter(Boolean);
  return [...new Set(todas)].slice(0, 6);
}

/** O roteiro como documento, para os renderers de HTML e Markdown. */
export function reelParaDocumento(roteiro: RoteiroReel): Documento {
  const secoes = [
    secao(
      "roteiro",
      `Roteiro: ${roteiro.duracaoSegundos} segundos, ${roteiro.cenas.length} cenas`,
      roteiro.cenas.map((c) => ({
        tipo: "cena" as const,
        tempo: c.tempo,
        papel: c.papel,
        fala: c.fala,
        imagem: c.imagem,
        legenda: c.legenda,
      })),
      "O vídeo deve funcionar sem som: o texto de tela de cada cena precisa fazer sentido sozinho.",
    ),
    secao("legenda", "Legenda da publicação", [
      { tipo: "mensagem", rotulo: "Legenda", texto: roteiro.legenda },
      { tipo: "mensagem", rotulo: "Hashtags", texto: roteiro.hashtags.join(" ") },
    ]),
    secao("captura", "Checklist antes de gravar", [{ tipo: "checklist", itens: roteiro.capturaChecklist }]),
    secao("formatos", "Formatos de entrega", [{ tipo: "lista", itens: roteiro.formatos }]),
  ];
  if (roteiro.ganchosAlternativos.length > 0) {
    secoes.push(
      secao("ganchos", "Ganchos alternativos (teste um por vídeo)", [
        { tipo: "lista", itens: roteiro.ganchosAlternativos },
      ]),
    );
  }
  if (roteiro.reaproveitamento.length > 0) {
    secoes.push(
      secao("reaproveitamento", "Reaproveitamento sem regravar", [
        { tipo: "lista", itens: roteiro.reaproveitamento },
      ]),
    );
  }
  return {
    tipo: "reel",
    titulo: roteiro.titulo,
    subtitulo: roteiro.subtitulo,
    meta: roteiro.meta,
    secoes,
    dados: { roteiro },
  };
}

