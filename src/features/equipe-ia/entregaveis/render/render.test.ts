import { describe, expect, it } from "vitest";
import { gerarCanvas } from "../canvas";
import { carrosselParaDocumento, gerarCarrosseis } from "../carrossel";
import { gerarKitComercial } from "../comercial";
import { gerarReel, reelParaDocumento } from "../reel";
import { ctx } from "../teste-util";
import { contarLinhas, tamanhoQueCabe } from "./ajuste";
import { documentoParaHtml, escaparHtml } from "./html";
import { blocoDeCodigo, documentoParaMarkdown, escaparMd } from "./markdown";
import { criarZip, crc32 } from "./zip";
import type { Documento } from "../tipos";

const ATAQUES = [
  `<script>alert(1)</script>`,
  `<img src=x onerror=alert(1)>`,
  `" onmouseover="alert(1)`,
  `'><svg/onload=alert(1)>`,
  `</style><script>x</script>`,
];

function documentoSimples(nome: string): Documento {
  return {
    tipo: "canvas",
    titulo: `Modelo: ${nome}`,
    subtitulo: nome,
    meta: {
      versao: "1.0",
      geradoEm: "2026-10-19T15:00:00.000Z",
      proximaRevisao: "2027-01-17T15:00:00.000Z",
      autor: nome,
      nivelAgente: 1,
      baseadoEm: [nome],
      circulacao: "interno",
    },
    secoes: [
      {
        id: "s",
        titulo: nome,
        intro: nome,
        blocos: [
          { tipo: "paragrafo", texto: nome },
          { tipo: "destaque", titulo: nome, texto: nome, tom: "info" },
          { tipo: "lista", itens: [nome] },
          { tipo: "checklist", itens: [nome] },
          { tipo: "passos", passos: [{ titulo: nome, detalhe: nome }] },
          { tipo: "mensagem", rotulo: nome, quando: nome, texto: nome },
          { tipo: "tabela", colunas: [nome], linhas: [[nome]] },
          { tipo: "cartoes", cartoes: [{ titulo: nome, itens: [nome] }] },
          { tipo: "cena", tempo: nome, papel: nome, fala: nome, imagem: nome, legenda: nome },
        ],
      },
    ],
  };
}

describe("HTML: segurança", () => {
  it("escapa os cinco caracteres perigosos", () => {
    expect(escaparHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  });

  it("nenhum ataque no nome do negócio cria uma tag fora das que o próprio gerador escreve", () => {
    const permitidas = new Set([
      "!doctype", "html", "head", "meta", "title", "style", "body", "div", "header", "span", "h1", "h2", "h3", "p",
      "main", "nav", "ol", "ul", "li", "a", "section", "aside", "strong", "small", "figure", "figcaption", "pre",
      "button", "table", "thead", "tbody", "tr", "th", "td", "details", "summary", "footer", "b", "mark", "script",
    ]);
    for (const ataque of ATAQUES) {
      const html = documentoParaHtml(documentoSimples(ataque));
      const tags = [...html.matchAll(/<\/?([a-zA-Z!][a-zA-Z0-9]*)/g)].map((m) => m[1].toLowerCase());
      const intrusas = tags.filter((t) => !permitidas.has(t));
      expect(intrusas, ataque).toEqual([]);
      // só existe UM <script>: o do próprio arquivo (botão de copiar)
      expect([...html.matchAll(/<script/g)]).toHaveLength(1);
    }
  });

  it("um nome com HTML aparece como TEXTO escapado", () => {
    const html = documentoParaHtml(documentoSimples(`<b>Café</b> & Cia`));
    expect(html).toContain("&lt;b&gt;Café&lt;/b&gt; &amp; Cia");
  });

  it("o arquivo traz uma CSP que proíbe qualquer acesso à rede", () => {
    const html = documentoParaHtml(documentoSimples("x"));
    expect(html).toContain(`http-equiv="Content-Security-Policy"`);
    expect(html).toContain("default-src 'none'");
    expect(html).not.toMatch(/connect-src|img-src https?:/);
  });

  it("é autocontido: nenhuma referência a recurso externo", () => {
    for (const doc of [gerarCanvas(ctx({ nivel: 3 })), gerarKitComercial(ctx({ nivel: 3 })), carrosselParaDocumento(gerarCarrosseis(ctx({ nivel: 3 })))]) {
      const html = documentoParaHtml(doc);
      expect(html).not.toMatch(/(src|href)="https?:\/\//);
      expect(html).not.toMatch(/@import|url\(https?:/);
      expect(html).not.toMatch(/<link\s|<iframe|<object|<embed/);
    }
  });
});

describe("HTML: estrutura e acessibilidade", () => {
  const html = documentoParaHtml(gerarCanvas(ctx({ nivel: 3 })));

  it("tem idioma, título, marcos e cabeçalhos de tabela", () => {
    expect(html).toContain(`<html lang="pt-BR">`);
    expect(html).toMatch(/<title>Modelo de Negócio: Radiz Engenharia<\/title>/);
    expect(html).toContain("<main>");
    expect(html).toContain(`<th scope="col">`);
    expect(html).toContain(`<nav class="indice" aria-label="Neste documento">`);
  });

  it("desenha o Canvas com as 9 células na ordem padrão de 5 colunas", () => {
    for (const area of ["parcerias", "atividades", "recursos", "proposta", "relacionamento", "canais", "segmentos", "custos", "receitas"]) {
      expect(html).toContain(`class="celula ${area}"`);
      expect(html).toContain(`.bmc .${area} { grid-area: ${area}; }`);
    }
    expect(html).toContain("@page { size: A4 landscape;");
  });

  it("só o Canvas imprime em paisagem", () => {
    expect(documentoParaHtml(gerarKitComercial(ctx()))).toContain("@page { size: A4;");
  });

  it("o selo diz se o documento é interno ou pode ser publicado", () => {
    expect(html).toContain("Uso interno, não publique");
    expect(documentoParaHtml(carrosselParaDocumento(gerarCarrosseis(ctx())))).toContain("Material para publicar");
  });

  it("o texto de cor usa só tons escuros sobre fundo claro (sem teal/orange como cor de texto)", () => {
    const regrasDeTexto = html.match(/[^{}]*\{[^}]*\bcolor:\s*#[0-9A-Fa-f]{6}[^}]*\}/g) ?? [];
    for (const regra of regrasDeTexto) {
      // `color:` de texto só em ink ou no muted de alto contraste (ou sobre fundo colorido do selo)
      const corTexto = regra.match(/[^-]\bcolor:\s*(#[0-9A-Fa-f]{6})/)?.[1]?.toUpperCase();
      if (corTexto) expect(["#0A1628", "#475569"], regra.slice(0, 60)).toContain(corTexto);
    }
  });
});

describe("HTML: mensagens copiáveis", () => {
  const html = documentoParaHtml(gerarKitComercial(ctx({ nivel: 3 })));

  it("cada mensagem tem um botão ligado ao texto certo", () => {
    const botoes = [...html.matchAll(/data-copiar="(msg-\d+)"/g)].map((m) => m[1]);
    expect(botoes.length).toBeGreaterThanOrEqual(10);
    expect(new Set(botoes).size).toBe(botoes.length);
    for (const id of botoes) expect(html).toContain(`<pre id="${id}">`);
  });

  it("destaca os campos a trocar", () => {
    expect(html).toContain(`<mark class="campo">{nome_do_cliente}</mark>`);
  });

  it("o script de copiar tem alternativa quando a área de transferência moderna não existe", () => {
    expect(html).toContain("navigator.clipboard");
    expect(html).toContain("execCommand");
  });
});

describe("Markdown", () => {
  it("escapa formatação, HTML e links dentro de texto de usuário", () => {
    expect(escaparMd("*ênfase* _x_ [link](http://x) <b>")).toBe("\\*ênfase\\* \\_x\\_ \\[link\\](http://x) \\<b\\>");
    expect(escaparMd("# título")).toBe("\\# título");
    expect(escaparMd("- item")).toBe("\\- item");
    expect(escaparMd("1. item")).toBe("\\1. item");
  });

  it("mantém {campos} legíveis (sem barras antes dos underlines)", () => {
    expect(escaparMd("Oi {nome_do_cliente}, tudo_bem")).toBe("Oi {nome_do_cliente}, tudo\\_bem");
  });

  it("o bloco de código nunca pode ser fechado por dentro", () => {
    const hostil = "```\n# ola\n``` e ````";
    const bloco = blocoDeCodigo(hostil);
    const cerca = bloco.split("\n")[0].replace("text", "");
    expect(cerca.length).toBeGreaterThan(4);
    expect(bloco.endsWith(cerca)).toBe(true);
    // a cerca de fechamento não aparece no miolo
    const miolo = bloco.slice(cerca.length + 5, bloco.length - cerca.length - 1);
    expect(miolo.includes(cerca)).toBe(false);
  });

  it("não vaza HTML para fora de um bloco de código cercado", () => {
    for (const ataque of ATAQUES) {
      const md = documentoParaMarkdown(documentoSimples(ataque));
      const semCodigo = md.replace(/```+text\n[\s\S]*?\n```+/g, "");
      expect(semCodigo, ataque).not.toMatch(/(^|[^\\])<[a-zA-Z/]/m);
    }
  });

  it("tabela: o pipe do texto não cria coluna nova", () => {
    const doc = documentoSimples("a | b");
    const md = documentoParaMarkdown(doc);
    expect(md).toContain("a \\| b");
  });

  it("traz o controle de versão e a origem dos dados", () => {
    const md = documentoParaMarkdown(gerarCanvas(ctx()));
    expect(md).toContain("Versão 1.0, gerada em 19/10/2026");
    expect(md).toContain("## De onde saíram os dados");
    expect(md).toContain("Uso interno");
  });

  it("os cinco entregáveis viram Markdown válido, sem 'undefined'", () => {
    const docs = [
      gerarCanvas(ctx({ nivel: 3 })),
      gerarKitComercial(ctx({ nivel: 3 })),
      carrosselParaDocumento(gerarCarrosseis(ctx({ nivel: 3 }))),
      reelParaDocumento(gerarReel(ctx({ nivel: 3 }))),
    ];
    for (const doc of docs) {
      const md = documentoParaMarkdown(doc);
      expect(md).not.toMatch(/undefined|\[object/);
      expect(md.startsWith("# ")).toBe(true);
    }
  });
});

describe("ZIP", () => {
  /** Lê o ZIP de volta (diretório central) para provar que é um ZIP de verdade. */
  function ler(zip: Uint8Array) {
    const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const fim = zip.length - 22;
    expect(v.getUint32(fim, true)).toBe(0x06054b50);
    const total = v.getUint16(fim + 10, true);
    let pos = v.getUint32(fim + 16, true);
    const itens: Array<{ nome: string; crc: number; dados: Uint8Array }> = [];
    for (let i = 0; i < total; i++) {
      expect(v.getUint32(pos, true)).toBe(0x02014b50);
      const crc = v.getUint32(pos + 16, true);
      const tamanho = v.getUint32(pos + 24, true);
      const tNome = v.getUint16(pos + 28, true);
      const deslocamento = v.getUint32(pos + 42, true);
      const nome = new TextDecoder().decode(zip.slice(pos + 46, pos + 46 + tNome));
      expect(v.getUint32(deslocamento, true)).toBe(0x04034b50);
      const tNomeLocal = v.getUint16(deslocamento + 26, true);
      const ini = deslocamento + 30 + tNomeLocal;
      itens.push({ nome, crc, dados: zip.slice(ini, ini + tamanho) });
      pos += 46 + tNome;
    }
    return itens;
  }

  it("empacota arquivos com nome, conteúdo e CRC corretos", () => {
    const a = new TextEncoder().encode("legenda do post\n");
    const b = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3, 255]);
    const zip = criarZip(
      [
        { nome: "legenda.txt", dados: a },
        { nome: "slides/slide-01.png", dados: b },
      ],
      new Date("2026-10-19T15:00:00Z"),
    );
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const itens = ler(zip);
    expect(itens.map((i) => i.nome)).toEqual(["legenda.txt", "slides/slide-01.png"]);
    expect(Array.from(itens[0].dados)).toEqual(Array.from(a));
    expect(Array.from(itens[1].dados)).toEqual(Array.from(b));
    expect(itens[0].crc).toBe(crc32(a));
    expect(itens[1].crc).toBe(crc32(b));
  });

  it("calcula o CRC-32 padrão (valor de referência conhecido)", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("recusa nomes que escapam da pasta (zip slip) ou com caracteres estranhos", () => {
    const dados = new Uint8Array([1]);
    for (const nome of ["../fora.txt", "/abs.txt", "a/../b.txt", "a b.txt", "ação.txt", "a\\b.txt", "", "a//b"]) {
      expect(() => criarZip([{ nome, dados }], new Date()), nome).toThrow(/inválido/);
    }
  });
});

describe("Ajuste de texto à caixa", () => {
  it("texto maior ocupa mais linhas", () => {
    expect(contarLinhas("palavra ".repeat(40), 60, 900)).toBeGreaterThan(contarLinhas("palavra ".repeat(5), 60, 900));
  });

  it("respeita quebras de linha explícitas", () => {
    expect(contarLinhas("a\nb\nc", 40, 900)).toBe(3);
  });

  it("palavra gigante é quebrada em vez de estourar a linha", () => {
    expect(contarLinhas("x".repeat(200), 50, 500)).toBeGreaterThan(1);
  });

  it("o tamanho encolhe quando o texto cresce e nunca passa dos limites", () => {
    const caixa = { largura: 900, altura: 400 };
    const curto = tamanhoQueCabe("Olá", caixa, 40, 120);
    const longo = tamanhoQueCabe("palavra ".repeat(60), caixa, 40, 120);
    expect(curto).toBe(120);
    expect(longo).toBeLessThan(curto);
    expect(longo).toBeGreaterThanOrEqual(40);
    expect(tamanhoQueCabe("palavra ".repeat(900), caixa, 40, 120)).toBe(40);
  });

  it("o texto escolhido realmente cabe na caixa", () => {
    const caixa = { largura: 900, altura: 360 };
    const texto = "Como manter o cabelo bonito entre uma visita e outra";
    const tamanho = tamanhoQueCabe(texto, caixa, 40, 120);
    expect(contarLinhas(texto, tamanho, caixa.largura) * tamanho * 1.22).toBeLessThanOrEqual(caixa.altura);
  });
});
