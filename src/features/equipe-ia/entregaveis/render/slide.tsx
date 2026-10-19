import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { PapelSlide } from "../tipos";
import {
  FORMATOS_SLIDE,
  margensDoFormato,
  TEMAS_SLIDE,
  type FormatoSlide,
  type TemaSlide,
} from "./formatos";
import { medidasDoSlide } from "./medidas";

/**
 * Imagem de um slide de carrossel (PNG) — SÓ NO SERVIDOR (lê fontes do disco).
 *
 * Três formatos, os que as redes realmente usam, e três temas montados só com
 * tokens do design system (ver `formatos.ts`). A hierarquia visual (capa,
 * conteúdo, convite) e o ajuste do tamanho do texto à caixa (`medidas.ts`, o
 * mesmo cálculo que o editor usa na pré-visualização) acontecem aqui; o texto
 * chega pronto — já validado e limitado por quem chama (`servico.ts`).
 *
 * Fonte: Nunito (licença OFL) lida de `src/assets/fonts`. Se os arquivos não
 * estiverem no disco, o Satori usa a fonte embutida do Next (Noto Sans, só
 * peso normal): o slide sai menos bonito, mas sai.
 */

export { FORMATOS_SLIDE, TEMAS_SLIDE };
export type { FormatoSlide, TemaSlide };

export interface EntradaSlide {
  papel: PapelSlide;
  titulo: string;
  texto: string;
  /** posição do slide (1 a N) e total, para o contador */
  posicao: number;
  total: number;
  assinatura: string;
  formato: FormatoSlide;
  tema: TemaSlide;
}

interface FonteSatori {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

const ARQUIVOS_DE_FONTE: Array<{ arquivo: string; weight: FonteSatori["weight"] }> = [
  { arquivo: "Nunito-400.ttf", weight: 400 },
  { arquivo: "Nunito-700.ttf", weight: 700 },
  { arquivo: "Nunito-800.ttf", weight: 800 },
];

let fontesEmCache: Promise<FonteSatori[]> | null = null;

/** Lê as fontes uma vez por processo. Arquivo ausente não derruba a imagem. */
export function carregarFontes(): Promise<FonteSatori[]> {
  fontesEmCache ??= Promise.all(
    ARQUIVOS_DE_FONTE.map(async ({ arquivo, weight }): Promise<FonteSatori | null> => {
      try {
        const buffer = await readFile(path.join(process.cwd(), "src", "assets", "fonts", arquivo));
        const dados = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
        return { name: "Nunito", data: dados, weight, style: "normal" };
      } catch {
        return null;
      }
    }),
  ).then((lista) => lista.filter((f): f is FonteSatori => f !== null));
  return fontesEmCache;
}

function SlideJsx({ entrada }: { entrada: EntradaSlide }) {
  const t = TEMAS_SLIDE[entrada.tema];
  const m = margensDoFormato(entrada.formato);
  const { tamanhoTitulo, tamanhoTexto } = medidasDoSlide(entrada);
  const capa = entrada.papel === "capa";
  const convite = entrada.papel === "cta";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: t.fundo,
        color: t.texto,
        fontFamily: "Nunito",
        paddingTop: m.topo,
        paddingBottom: m.base,
        paddingLeft: m.lado,
        paddingRight: m.lado,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 140, height: 14, borderRadius: 7, backgroundColor: t.acento }} />
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: t.suave }}>
          {`${entrada.posicao}/${entrada.total}`}
        </div>
      </div>

      {/* miolo centralizado entre o topo e o rodapé: sem o vazio embaixo */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            fontSize: tamanhoTitulo,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -1,
            whiteSpace: "pre-wrap",
          }}
        >
          {entrada.titulo}
        </div>

        {convite ? (
          <div
            style={{
              display: "flex",
              marginTop: 48,
              padding: "28px 36px",
              borderRadius: 24,
              backgroundColor: t.botao,
              color: t.textoBotao,
              fontSize: tamanhoTexto,
              fontWeight: 700,
              lineHeight: 1.25,
              whiteSpace: "pre-wrap",
            }}
          >
            {entrada.texto}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: tamanhoTexto,
              fontWeight: 400,
              lineHeight: 1.3,
              color: capa ? t.suave : t.texto,
              whiteSpace: "pre-wrap",
            }}
          >
            {entrada.texto}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: t.suave }}>{entrada.assinatura}</div>
        {entrada.posicao < entrada.total ? (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: t.acento }}>{"Deslize"}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Renderiza um slide e devolve os bytes do PNG. */
export async function renderizarSlide(entrada: EntradaSlide): Promise<Uint8Array> {
  const { largura, altura } = FORMATOS_SLIDE[entrada.formato];
  const fonts = await carregarFontes();
  const resposta = new ImageResponse(<SlideJsx entrada={entrada} />, {
    width: largura,
    height: altura,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
  return new Uint8Array(await resposta.arrayBuffer());
}
