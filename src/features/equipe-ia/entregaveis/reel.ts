import type { CenaReel, PerfilNegocio, RoteiroReel } from "./tipos";
import { GARGALO_TEXTO, OBJETIVO_TEXTO, vocabulario } from "./vocabulario";

/**
 * Roteiro de Reels a partir do perfil (entregável do Editor de Vídeo de
 * IA). Puro — ver cabeçalho de `canvas.ts`.
 *
 * Por que ROTEIRO e não vídeo renderizado: o que trava o empresário de
 * PME não é a edição, é não saber *o que dizer nos primeiros 3 segundos*.
 * Um roteiro cena a cena, com o que falar e o que aparecer na tela, ele
 * grava no celular hoje. Um MP4 genérico gerado por máquina, não — sairia
 * com a cara de todo mundo e sem o rosto dele, que é justamente o ativo
 * de um negócio regional. Prometer "vídeo pronto" aqui seria vender o que
 * não se entrega (mesma disciplina de honestidade de
 * `docs/pitch/NARRATIVA-IMPACTO.md`).
 *
 * Estrutura de 3 atos em vídeo curto — gancho / desenvolvimento / CTA —
 * com o gancho carregando a dor do nicho, porque é o único trecho que a
 * plataforma usa para decidir se entrega o vídeo para mais gente.
 */

/** Segundos por cena — o roteiro nasce no ritmo certo de vídeo curto. */
const SEGUNDOS_POR_CENA = 6;

export function gerarReel(perfil: PerfilNegocio): RoteiroReel {
  const v = vocabulario(perfil.segmento);
  const { respostas, nivelAgente } = perfil;
  const nivel2 = nivelAgente >= 2;
  const nivel3 = nivelAgente >= 3;
  const gargalo = GARGALO_TEXTO[respostas.gargalo];

  // A janela de tempo é DERIVADA da posição, nunca escrita à mão: as cenas
  // de nível 2 e 3 entram no meio do roteiro, e um tempo fixo faria as
  // cenas seguintes mentirem o cronômetro assim que o agente evoluísse.
  const cenas: CenaReel[] = [];
  const cena = (papel: string, fala: string, imagem: string) => {
    const i = cenas.length;
    cenas.push({
      tempo: `${i * SEGUNDOS_POR_CENA}–${(i + 1) * SEGUNDOS_POR_CENA}s`,
      papel,
      fala,
      imagem,
    });
  };

  // Construção de CÓPULA ("isso: <dor>"), não de conjugação. As dores do
  // vocabulário são um misto de infinitivo ("perder prazo de edital") e de
  // sintagma nominal ("agenda cheia sem sobrar tempo"); qualquer tentativa
  // de flexionar a primeira palavra acerta metade dos segmentos e produz
  // frase quebrada na outra metade. Cópula aceita as duas formas.
  cena(
    "Gancho",
    `Se você tem ${v.oQueVende} aqui em ${perfil.cidade}, você já passou por isso: ${v.dorTipica}.`,
    "Você falando de frente para a câmera, sem introdução e sem logo — o corte já começa na frase.",
  );
  cena(
    "Dor",
    `O que mais trava negócio como o meu é ${v.dorTipica}. E quase sempre não é falta de trabalho: é falta de organização.`,
    "Plano do dia a dia real do negócio (mesa, obra, atendimento, bancada). Nada de banco de imagens.",
  );

  if (nivel2) {
    cena(
      "Prova",
      `${capitalizar(v.argumentoChave)}.`,
      "Mostre UMA evidência concreta: um documento, uma tela, um antes/depois. Uma só — duas confundem.",
    );
  }

  cena(
    "Virada",
    nivel2
      ? `Aqui na ${perfil.nomeNegocio} a gente resolveu isso atacando ${gargalo}.`
      : `Na ${perfil.nomeNegocio} a gente trabalha com ${v.oQueVende} — e o processo é o que faz a diferença.`,
    "Você de novo em quadro. Mudança de cenário ou de enquadramento marca a virada.",
  );

  if (nivel3) {
    cena(
      "Objeção",
      "E não, isso não é coisa de empresa grande. É exatamente o que dá pra fazer sendo pequeno e ganhar tempo.",
      "Texto na tela repetindo a frase — quem assiste sem som precisa pegar essa parte.",
    );
  }

  cena(
    "CTA",
    `Se você é de ${perfil.cidade} e quer ${OBJETIVO_TEXTO[respostas.objetivo]}, comenta “${palavraChave(respostas.objetivo)}” que eu te explico.`,
    "Close no seu rosto + texto grande com a palavra do comentário. CTA de comentário rende mais alcance que “link na bio”.",
  );

  const ganchosAlternativos = nivel2
    ? [
        `Ninguém te conta isso sobre ${v.oQueVende} em ${perfil.cidade}.`,
        `O que me custou dinheiro por anos: ${v.dorTipica}.`,
        `3 sinais de que o problema não é falta de cliente — é ${gargalo}.`,
      ]
    : [];

  const reaproveitamento = nivel3
    ? [
        "Corte só o gancho (0–6s) e suba como Story com enquete — mede o interesse antes de investir mais.",
        "Transforme as cenas de Dor e Prova num carrossel de 3 telas para LinkedIn/Instagram.",
        "O texto da cena de Objeção vira o primeiro parágrafo do próximo e-mail para a base.",
        "Se o vídeo passar da média de alcance, use exatamente ele como criativo de anúncio — não regrave.",
      ]
    : [];

  return {
    titulo: `Roteiro de Reels — ${perfil.nomeNegocio}`,
    subtitulo: `${v.oQueVende} · ${perfil.cidade}`,
    duracaoSegundos: cenas.length * SEGUNDOS_POR_CENA,
    cenas,
    legenda: montarLegenda(perfil, v.dorTipica, gargalo),
    hashtags: [v.hashtag, `#${slugTag(perfil.cidade)}`, "#pmebrasil", "#valedocafe"],
    ganchosAlternativos,
    reaproveitamento,
  };
}

function montarLegenda(perfil: PerfilNegocio, dor: string, gargalo: string): string {
  return (
    `${capitalizar(dor)} é o que mais aparece quando converso com quem tem negócio ` +
    `em ${perfil.cidade}.\n\n` +
    `Não é falta de competência. Quase sempre é ${gargalo}.\n\n` +
    `Comenta aqui embaixo se isso acontece com você também — respondo um por um.`
  );
}

/** Palavra que o espectador comenta — curta, sem acento, fácil de digitar
 *  no celular (uma palavra errada no CTA derruba a conversão do Reel). */
function palavraChave(objetivo: PerfilNegocio["respostas"]["objetivo"]): string {
  const mapa: Record<PerfilNegocio["respostas"]["objetivo"], string> = {
    "mais-leads": "LEADS",
    organizar: "ORDEM",
    "vender-mais": "VENDER",
    aparecer: "REGIAO",
    automatizar: "TEMPO",
  };
  return mapa[objetivo];
}

function slugTag(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
