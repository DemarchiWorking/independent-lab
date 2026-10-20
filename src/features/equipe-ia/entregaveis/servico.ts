import { LIMITE_LEGENDA } from "./carrossel";
import { nomeDeArquivo, textoLivre } from "./linguagem";
import { aplicarEdicoes, LIMITES_EDICAO, slidesPendentes, type EdicaoSlide } from "./edicao";
import { FORMATOS_SLIDE, TEMAS_SLIDE, type FormatoSlide, type TemaSlide } from "./render/formatos";
import { renderizarSlide } from "./render/slide";
import { criarZip } from "./render/zip";
import type { TipoEntregavel } from "../habilidades";
import type { ContextoNegocio, Documento, PacoteCarrossel, PautaCarrossel } from "./tipos";

/**
 * Orquestração dos entregáveis: lê os dados do usuário logado, escolhe o
 * gerador e prepara a saída. É a ÚNICA camada que fala com o repositório; a
 * rota só cuida de HTTP (sessão, limite de uso, cabeçalhos).
 */

export type SaidaEntregavel = "html" | "md" | "json" | "png" | "zip";

export const SAIDAS_POR_TIPO: Record<TipoEntregavel, readonly SaidaEntregavel[]> = {
  canvas: ["html", "md", "json"],
  pop: ["html", "md", "json"],
  comercial: ["html", "md", "json"],
  reel: ["html", "md", "json"],
  carrossel: ["html", "md", "json", "png", "zip"],
};

export { carregarContexto, documentoDoEntregavel } from "./base";

// --------------------------------------------------------------- carrossel

export interface PedidoImagem {
  pautaId: string;
  formato: FormatoSlide;
  tema: TemaSlide;
  /** 1 a N; `null` = todos os slides (ZIP) */
  slide: number | null;
  edicoes: EdicaoSlide[] | null;
  legenda: string | null;
}

export { aplicarEdicoes, LIMITES_EDICAO, slidesPendentes, type EdicaoSlide };

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string; status: number };

const FORMATOS = Object.keys(FORMATOS_SLIDE) as FormatoSlide[];
const TEMAS = Object.keys(TEMAS_SLIDE) as TemaSlide[];

function inteiroPositivo(valor: unknown, max: number): number | null {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= max ? n : null;
}

/**
 * Lê e VALIDA o pedido de imagem. Vem da query (GET) ou do corpo JSON (POST) e
 * é tratado igual: qualquer campo fora do esperado vira erro 400, nunca um
 * valor "arrumado" em silêncio.
 */
export function lerPedidoImagem(origem: Record<string, unknown>): Resultado<PedidoImagem> {
  const pautaId = typeof origem.pauta === "string" ? origem.pauta : "";
  if (!/^[a-z0-9-]{1,40}$/.test(pautaId)) return { ok: false, erro: "Pauta inválida.", status: 400 };

  const formato = (typeof origem.formato === "string" ? origem.formato : "quadrado") as FormatoSlide;
  if (!FORMATOS.includes(formato)) return { ok: false, erro: "Formato de imagem inválido.", status: 400 };

  const tema = (typeof origem.tema === "string" ? origem.tema : "escuro") as TemaSlide;
  if (!TEMAS.includes(tema)) return { ok: false, erro: "Tema inválido.", status: 400 };

  let slide: number | null = null;
  if (origem.slide !== undefined && origem.slide !== null && origem.slide !== "") {
    slide = inteiroPositivo(origem.slide, 20);
    if (slide === null) return { ok: false, erro: "Slide inválido.", status: 400 };
  }

  let edicoes: EdicaoSlide[] | null = null;
  if (origem.slides !== undefined && origem.slides !== null) {
    if (!Array.isArray(origem.slides) || origem.slides.length > 20) {
      return { ok: false, erro: "Edições inválidas.", status: 400 };
    }
    edicoes = [];
    for (const item of origem.slides as unknown[]) {
      if (typeof item !== "object" || item === null) return { ok: false, erro: "Edições inválidas.", status: 400 };
      const { titulo, texto } = item as Record<string, unknown>;
      if (typeof titulo !== "string" || typeof texto !== "string") {
        return { ok: false, erro: "Edições inválidas.", status: 400 };
      }
      edicoes.push({ titulo, texto });
    }
  }

  let legenda: string | null = null;
  if (origem.legenda !== undefined && origem.legenda !== null) {
    if (typeof origem.legenda !== "string") return { ok: false, erro: "Legenda inválida.", status: 400 };
    legenda = textoLivre(origem.legenda, LIMITE_LEGENDA);
  }

  return { ok: true, valor: { pautaId, formato, tema, slide, edicoes, legenda } };
}

export function prepararPauta(pacote: PacoteCarrossel, pedido: PedidoImagem): Resultado<PautaCarrossel> {
  const base = pacote.pautas.find((p) => p.id === pedido.pautaId);
  if (!base) return { ok: false, erro: "Pauta não encontrada para o seu nível de funcionário.", status: 404 };

  const pauta = aplicarEdicoes(base, pedido.edicoes);
  if (pedido.slide !== null && pedido.slide > pauta.slides.length) {
    return { ok: false, erro: "Esse slide não existe nesta pauta.", status: 404 };
  }
  const pendentes = slidesPendentes(pauta, pedido.slide);
  if (pendentes.length > 0) {
    return {
      ok: false,
      erro: `Preencha os campos entre colchetes antes de baixar (slide ${pendentes.join(", ")}).`,
      status: 422,
    };
  }
  return { ok: true, valor: pauta };
}

export async function imagemDoSlide(
  pacote: PacoteCarrossel,
  pauta: PautaCarrossel,
  pedido: PedidoImagem,
  numero: number,
): Promise<Uint8Array> {
  const slide = pauta.slides[numero - 1];
  return renderizarSlide({
    papel: slide.papel,
    titulo: slide.titulo,
    texto: slide.texto,
    posicao: numero,
    total: pauta.slides.length,
    assinatura: pacote.assinatura,
    formato: pedido.formato,
    tema: pedido.tema,
  });
}

export async function zipDoCarrossel(
  pacote: PacoteCarrossel,
  pauta: PautaCarrossel,
  pedido: PedidoImagem,
  agora: Date,
): Promise<Uint8Array> {
  const arquivos = [];
  for (let n = 1; n <= pauta.slides.length; n++) {
    arquivos.push({
      nome: `slide-${String(n).padStart(2, "0")}.png`,
      dados: await imagemDoSlide(pacote, pauta, pedido, n),
    });
  }
  const legenda = pedido.legenda ?? pauta.legenda;
  const texto = `${legenda}\n\n${pauta.hashtags.join(" ")}\n\nTexto alternativo:\n${pauta.textoAlternativo}\n\nDireção de imagem:\n${pauta.orientacaoVisual}\n`;
  arquivos.push({ nome: "legenda.txt", dados: new TextEncoder().encode(texto) });
  return criarZip(arquivos, agora);
}

export function nomeBase(ctx: ContextoNegocio): string {
  return nomeDeArquivo(ctx.nome);
}
