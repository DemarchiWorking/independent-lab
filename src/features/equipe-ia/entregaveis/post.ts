import type { PerfilNegocio, PostSocial } from "./tipos";
import { GARGALO_TEXTO, OBJETIVO_TEXTO, vocabulario } from "./vocabulario";

/**
 * Post para rede social a partir do perfil (entregável do Social Media de
 * IA). Puro — ver o cabeçalho de `canvas.ts` para o racional.
 *
 * O ângulo do post vem do OBJETIVO declarado no onboarding, não de um
 * template fixo: quem quer "aparecer mais na região" recebe um post de
 * autoridade local; quem quer "mais leads" recebe um post de oferta com
 * CTA direto. É o que separa isto de um gerador genérico.
 */
export function gerarPost(perfil: PerfilNegocio): PostSocial {
  const v = vocabulario(perfil.segmento);
  const { respostas, nivelAgente } = perfil;

  const angulo = ANGULO_POR_OBJETIVO[respostas.objetivo];
  const headline = angulo.headline(perfil.cidade);

  const corpo = [
    angulo.corpo(perfil.nomeNegocio, v.oQueVende),
    nivelAgente >= 2
      ? `Se o seu problema hoje é ${GARGALO_TEXTO[respostas.gargalo]}, é exatamente aí que a gente entra.`
      : "",
    nivelAgente >= 3 ? `${capitalizar(v.argumentoChave)}.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const hashtags = [
    v.hashtag,
    `#${slugHashtag(perfil.cidade)}`,
    "#valedocafe",
    ...(nivelAgente >= 2 ? ["#pmebrasil", "#negociolocal"] : []),
  ];

  return { headline, corpo, cta: angulo.cta, hashtags };
}

interface AnguloPost {
  headline: (cidade: string) => string;
  corpo: (nome: string, oQueVende: string) => string;
  cta: string;
}

const ANGULO_POR_OBJETIVO: Record<
  PerfilNegocio["respostas"]["objetivo"],
  AnguloPost
> = {
  "mais-leads": {
    headline: (cidade) => `Precisa resolver isso em ${cidade}?`,
    corpo: (nome, oQueVende) =>
      `A ${nome} trabalha com ${oQueVende} aqui na região. Orçamento sem compromisso, resposta no mesmo dia.`,
    cta: "Chama no WhatsApp e conta o que você precisa.",
  },
  organizar: {
    headline: () => "Processo organizado não é luxo. É o que evita retrabalho.",
    corpo: (nome, oQueVende) =>
      `Na ${nome}, cada entrega de ${oQueVende} segue um processo documentado — do orçamento à entrega final. Você sabe em que pé está, sempre.`,
    cta: "Quer entender como funciona? Fala com a gente.",
  },
  "vender-mais": {
    headline: () => "Você já é nosso cliente. Sabia que fazemos isso também?",
    corpo: (nome, oQueVende) =>
      `Muita gente conhece a ${nome} por um serviço só — mas a gente cobre ${oQueVende} de ponta a ponta.`,
    cta: "Pergunta pra gente o que mais dá pra resolver junto.",
  },
  aparecer: {
    headline: (cidade) => `Quem é a referência disso em ${cidade}?`,
    corpo: (nome, oQueVende) =>
      `A ${nome} atua com ${oQueVende} na região há tempo suficiente para saber o que funciona por aqui — e o que só funciona no papel.`,
    cta: "Segue a gente e acompanha os bastidores.",
  },
  automatizar: {
    headline: () => "O que dá pra automatizar, a gente automatiza.",
    corpo: (nome, oQueVende) =>
      `Na ${nome}, tempo gasto em tarefa repetitiva é tempo que não vai para ${oQueVende}. Por isso investimos em processo e tecnologia.`,
    cta: "Quer ver como? Manda mensagem.",
  },
};

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Cidade → hashtag sem acento/espaço. `slugify` de `lib/db/file-adapter`
 *  não serve: ele devolve com hífen, e hashtag com hífen quebra em quase
 *  toda rede social. */
function slugHashtag(cidade: string): string {
  return cidade
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
