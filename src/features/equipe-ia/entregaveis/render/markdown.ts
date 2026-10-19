import { dataPt } from "../linguagem";
import type { Bloco, CelulaCanvas, Documento } from "../tipos";

/**
 * Renderização do `Documento` para Markdown.
 *
 * Serve a quem quer editar o material num editor de texto, colar numa
 * ferramenta de anotações ou alimentar outra automação. É o mesmo documento do
 * HTML, em outro formato — nunca um segundo gerador.
 *
 * Segurança: texto digitado por usuário (nome do negócio, ofertas) é escapado
 * para não virar formatação, link ou HTML dentro de quem abrir o arquivo. Os
 * trechos de "copiar e colar" vão em bloco de código, cuja cerca é sempre
 * maior que qualquer sequência de crases do próprio texto — assim ninguém
 * "fecha" o bloco por dentro.
 */

const PLACEHOLDER = /(\{[a-z_]+\})/;

/** Escapa um trecho de texto corrido. Campos `{assim}` ficam como estão (legíveis no arquivo cru). */
export function escaparMd(texto: string): string {
  return texto
    .split(PLACEHOLDER)
    .map((parte) => (PLACEHOLDER.test(parte) ? parte : parte.replace(/[\\`*_[\]<>]/g, (c) => `\\${c}`)))
    .join("")
    .replace(/^(\s*)([#>+-]|\d+[.)])(\s)/gm, "$1\\$2$3");
}

function celulaDeTabela(texto: string): string {
  return escaparMd(texto).replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

/** Bloco de código com cerca à prova de crases no texto. */
export function blocoDeCodigo(texto: string): string {
  const maior = (texto.match(/`+/g) ?? []).reduce((m, s) => Math.max(m, s.length), 0);
  const cerca = "`".repeat(Math.max(3, maior + 1));
  return `${cerca}text\n${texto}\n${cerca}`;
}

const ORDEM_CANVAS: Array<{ chave: CelulaCanvas; titulo: string }> = [
  { chave: "segmentos", titulo: "Segmentos de clientes" },
  { chave: "proposta", titulo: "Proposta de valor" },
  { chave: "canais", titulo: "Canais" },
  { chave: "relacionamento", titulo: "Relacionamento com clientes" },
  { chave: "receitas", titulo: "Fontes de receita" },
  { chave: "recursos", titulo: "Recursos principais" },
  { chave: "atividades", titulo: "Atividades-chave" },
  { chave: "parcerias", titulo: "Parcerias principais" },
  { chave: "custos", titulo: "Estrutura de custos" },
];

function lista(itens: readonly string[], ordenada = false): string {
  return itens.map((i, n) => `${ordenada ? `${n + 1}.` : "-"} ${escaparMd(i)}`).join("\n");
}

function bloco(b: Bloco): string {
  switch (b.tipo) {
    case "paragrafo":
      return escaparMd(b.texto);
    case "destaque": {
      const titulo = b.titulo ? `**${escaparMd(b.titulo)}.** ` : "";
      return `${titulo}${escaparMd(b.texto)}`
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    }
    case "lista":
      return lista(b.itens, b.ordenada);
    case "checklist":
      return b.itens.map((i) => `- [ ] ${escaparMd(i)}`).join("\n");
    case "passos":
      return b.passos
        .map((p, n) => `${n + 1}. **${escaparMd(p.titulo)}**${p.detalhe ? `  \n   ${escaparMd(p.detalhe)}` : ""}`)
        .join("\n");
    case "mensagem":
      return [`#### ${escaparMd(b.rotulo)}`, b.quando ? `_${escaparMd(b.quando)}_` : "", blocoDeCodigo(b.texto)]
        .filter(Boolean)
        .join("\n\n");
    case "tabela":
      return [
        `| ${b.colunas.map(celulaDeTabela).join(" | ")} |`,
        `| ${b.colunas.map(() => "---").join(" | ")} |`,
        ...b.linhas.map((l) => `| ${l.map(celulaDeTabela).join(" | ")} |`),
      ].join("\n");
    case "canvas":
      return ORDEM_CANVAS.map((c) => `#### ${c.titulo}\n\n${lista(b.celulas[c.chave])}`).join("\n\n");
    case "cartoes":
      return b.cartoes.map((c) => `#### ${escaparMd(c.titulo)}\n\n${lista(c.itens)}`).join("\n\n");
    case "cena":
      return [
        `**${escaparMd(b.tempo)} · ${escaparMd(b.papel)}**`,
        `- Fala: ${escaparMd(b.fala)}`,
        `- Mostrar: ${escaparMd(b.imagem)}`,
        `- Texto na tela: ${escaparMd(b.legenda)}`,
      ].join("\n");
  }
}

export function documentoParaMarkdown(doc: Documento): string {
  const interno = doc.meta.circulacao === "interno";
  const partes: string[] = [
    `# ${escaparMd(doc.titulo)}`,
    `_${escaparMd(doc.subtitulo)}_`,
    lista([
      `Versão ${doc.meta.versao}, gerada em ${dataPt(doc.meta.geradoEm)}. Próxima revisão: ${dataPt(doc.meta.proximaRevisao)}`,
      `Autor: ${doc.meta.autor} (nível ${doc.meta.nivelAgente})`,
      interno ? "Uso interno: contém respostas do cadastro, não publique" : "Material para publicar: usa só informações públicas do negócio",
    ]),
  ];
  for (const s of doc.secoes) {
    partes.push(`## ${escaparMd(s.titulo)}`);
    if (s.intro) partes.push(escaparMd(s.intro));
    for (const b of s.blocos) partes.push(bloco(b));
  }
  partes.push("## De onde saíram os dados", lista(doc.meta.baseadoEm));
  return `${partes.join("\n\n")}\n`;
}
