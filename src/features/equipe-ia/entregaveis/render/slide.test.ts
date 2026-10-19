import { describe, expect, it } from "vitest";
import { carregarFontes, FORMATOS_SLIDE, renderizarSlide, TEMAS_SLIDE, type FormatoSlide, type TemaSlide } from "./slide";

/** Lê largura e altura do cabeçalho IHDR de um PNG. */
function dimensoes(png: Uint8Array) {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { largura: v.getUint32(16), altura: v.getUint32(20) };
}

const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("slide (PNG)", () => {
  it("as fontes Nunito estão no projeto e são carregadas", async () => {
    const fontes = await carregarFontes();
    expect(fontes.map((f) => f.weight).sort()).toEqual([400, 700, 800]);
    for (const f of fontes) {
      expect(f.name).toBe("Nunito");
      // TTF começa com 0x00010000
      expect(Array.from(new Uint8Array(f.data.slice(0, 4)))).toEqual([0, 1, 0, 0]);
    }
  });

  it("gera um PNG com o tamanho exato de cada formato", async () => {
    for (const formato of Object.keys(FORMATOS_SLIDE) as FormatoSlide[]) {
      const png = await renderizarSlide({
        papel: "capa",
        titulo: "Como manter o cabelo bonito entre uma visita e outra",
        texto: "Salve este post para consultar depois",
        posicao: 1,
        total: 6,
        assinatura: "Studio Bela Cabelos · Mendes",
        formato,
        tema: "escuro",
      });
      expect(Array.from(png.slice(0, 8))).toEqual(ASSINATURA_PNG);
      const { largura, altura } = dimensoes(png);
      expect(largura).toBe(FORMATOS_SLIDE[formato].largura);
      expect(altura).toBe(FORMATOS_SLIDE[formato].altura);
      expect(png.length).toBeGreaterThan(5_000);
    }
  }, 60_000);

  it("renderiza os três papéis em todos os temas sem erro, inclusive com texto no limite e acentos", async () => {
    const textoLongo = "Atendimento de ação rápida, sem burocracia, para quem precisa de orçamento claro e prazo combinado. ".repeat(2).slice(0, 180);
    for (const tema of Object.keys(TEMAS_SLIDE) as TemaSlide[]) {
      for (const papel of ["capa", "conteudo", "cta"] as const) {
        const png = await renderizarSlide({
          papel,
          titulo: "Título com acentuação: ç ã é ô — e bastante texto para testar",
          texto: textoLongo,
          posicao: 2,
          total: 5,
          assinatura: "Café & Cia · São João",
          formato: "retrato",
          tema,
        });
        expect(Array.from(png.slice(0, 8)), `${tema}/${papel}`).toEqual(ASSINATURA_PNG);
      }
    }
  }, 120_000);

  it("o texto de usuário com HTML ou símbolos é desenhado como texto, sem quebrar a imagem", async () => {
    const png = await renderizarSlide({
      papel: "conteudo",
      titulo: "<script>alert(1)</script> & \"aspas\"",
      texto: "<img src=x onerror=alert(1)> {{chaves}} ${cifrão} `crase`",
      posicao: 1,
      total: 3,
      assinatura: "<b>Nome</b>",
      formato: "quadrado",
      tema: "claro",
    });
    expect(Array.from(png.slice(0, 8))).toEqual(ASSINATURA_PNG);
  }, 60_000);
});
