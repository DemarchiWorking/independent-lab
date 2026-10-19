import { color, font } from "@tokens";
import { dataPt } from "../linguagem";
import type { Bloco, CelulaCanvas, Documento, Secao } from "../tipos";

/**
 * Renderização do `Documento` para HTML autocontido e imprimível.
 *
 * Autocontido de propósito: o arquivo baixado abre no computador do
 * empresário sem internet, sem CDN e sem fonte externa — todo o CSS e o único
 * script (botão "Copiar") vão inline, e a tipografia cai nas fontes do
 * sistema (`font.ui` já declara os fallbacks).
 *
 * Segurança: todo texto vindo do usuário passa por `escaparHtml` no ponto de
 * saída (nome do negócio, ofertas e parceiros são digitados por pessoas), e o
 * arquivo traz uma Content-Security-Policy própria que proíbe qualquer acesso
 * à rede. Mesmo que um escape falhasse, o conteúdo injetado não conseguiria
 * enviar nada para fora.
 *
 * Acessibilidade: `lang`, marcos de página, uma hierarquia de títulos, tabelas
 * com cabeçalho, contraste AA (só tokens de texto escuro sobre fundo claro; as
 * cores de marca entram como fundo e borda, não como cor de texto).
 */

/**
 * Escapa texto antes de entrar no HTML. NÃO é paranoia: `nomeNegocio` é
 * digitado no cadastro. Sem escapar, um negócio chamado `<script>…` viraria
 * script executável quando o dono abrisse o arquivo.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CAMPO = /(\{[a-z_]+\}|\[[^\]\n]+\])/g;

/** O trecho é um campo `{assim}` ou `[assim]` que o dono precisa trocar? */
function ehCampo(parte: string): boolean {
  return /^(\{[a-z_]+\}|\[[^\]\n]+\])$/.test(parte);
}

/** Escapa o texto e destaca com `<mark>` os campos a trocar. */
function textoComCampos(texto: string): string {
  return texto
    .split(CAMPO)
    .map((parte) => (ehCampo(parte) ? `<mark class="campo">${escaparHtml(parte)}</mark>` : escaparHtml(parte)))
    .join("");
}

const ORDEM_CANVAS: Array<{ chave: CelulaCanvas; titulo: string }> = [
  { chave: "parcerias", titulo: "Parcerias principais" },
  { chave: "atividades", titulo: "Atividades-chave" },
  { chave: "recursos", titulo: "Recursos principais" },
  { chave: "proposta", titulo: "Proposta de valor" },
  { chave: "relacionamento", titulo: "Relacionamento com clientes" },
  { chave: "canais", titulo: "Canais" },
  { chave: "segmentos", titulo: "Segmentos de clientes" },
  { chave: "custos", titulo: "Estrutura de custos" },
  { chave: "receitas", titulo: "Fontes de receita" },
];

const TINTA = {
  info: color.brand.teal,
  atencao: color.brand.orange,
  sucesso: color.brand.green,
} as const;

function estilos(doc: Documento): string {
  const paisagem = doc.tipo === "canvas";
  return `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${font.ui}; background: ${color.bg.light}; color: ${color.text.ink}; line-height: 1.55; }
  .folha { max-width: 1080px; margin: 0 auto; padding: 28px 20px 48px; }
  header.capa { border-bottom: 4px solid ${color.brand.teal}; padding-bottom: 16px; margin-bottom: 18px; }
  .marca { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; background: ${color.brand.teal}; color: ${color.text.ink}; padding: 2px 10px; border-radius: 6px; }
  h1 { font-size: 28px; line-height: 1.2; margin: 12px 0 2px; }
  .sub { margin: 0; color: ${color.text.mutedOnLight}; }
  .ficha { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 12px; font-size: 13px; color: ${color.text.mutedOnLight}; }
  .ficha b { color: ${color.text.ink}; }
  .selo { padding: 2px 10px; border-radius: 999px; font-weight: 800; font-size: 12px; color: ${color.text.ink}; }
  .selo.interno { background: ${color.brand.orange}; }
  .selo.publico { background: ${color.brand.green}; }
  nav.indice { background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; }
  nav.indice h2 { font-size: 13px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .08em; border: 0; padding: 0; }
  nav.indice ol { margin: 0; padding-left: 20px; columns: 2; column-gap: 28px; font-size: 14px; }
  nav.indice a { color: ${color.text.ink}; }
  section { margin: 30px 0; }
  h2 { font-size: 20px; margin: 0 0 6px; padding-left: 10px; border-left: 6px solid ${color.brand.orange}; }
  .intro { margin: 0 0 12px; color: ${color.text.mutedOnLight}; }
  p { margin: 0 0 10px; }
  ul, ol { margin: 0 0 12px; padding-left: 22px; }
  li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; background: ${color.bg.panel}; font-size: 14px; margin: 0 0 14px; }
  th, td { border: 1px solid ${color.bg.lineLight}; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: ${color.bg.light}; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
  .destaque { border-left: 6px solid; background: ${color.bg.panel}; padding: 10px 14px; border-radius: 8px; margin: 0 0 14px; }
  .destaque strong { display: block; margin-bottom: 2px; }
  .checklist { list-style: none; padding-left: 0; }
  .checklist li { position: relative; padding-left: 30px; }
  .checklist li::before { content: ""; position: absolute; left: 4px; top: 4px; width: 16px; height: 16px; border: 2px solid ${color.text.ink}; border-radius: 4px; background: ${color.bg.panel}; }
  .passos { list-style: none; counter-reset: passo; padding-left: 0; }
  .passos li { counter-increment: passo; position: relative; padding: 8px 12px 8px 46px; background: ${color.bg.panel}; border: 1px solid ${color.bg.lineLight}; border-radius: 10px; }
  .passos li::before { content: counter(passo); position: absolute; left: 10px; top: 8px; width: 26px; height: 26px; border-radius: 50%; background: ${color.brand.teal}; color: ${color.text.ink}; font-weight: 800; display: grid; place-items: center; }
  .passos small { display: block; color: ${color.text.mutedOnLight}; }
  .mensagem { margin: 0 0 14px; background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 12px; padding: 12px 14px; }
  .mensagem figcaption { font-weight: 800; margin-bottom: 4px; }
  .mensagem figcaption small { display: block; font-weight: 400; color: ${color.text.mutedOnLight}; }
  .mensagem pre { white-space: pre-wrap; word-break: break-word; font: inherit; margin: 6px 0 10px; padding: 10px 12px; background: ${color.bg.light}; border-left: 4px solid ${color.brand.teal}; border-radius: 6px; }
  .copiar { font: inherit; font-weight: 800; font-size: 13px; background: ${color.brand.orange}; color: ${color.text.ink}; border: 0; border-radius: 8px; padding: 6px 14px; cursor: pointer; }
  .copiar:focus-visible, nav.indice a:focus-visible { outline: 3px solid ${color.text.ink}; outline-offset: 2px; }
  mark.campo { background: ${color.brand.orange}55; color: ${color.text.ink}; border-radius: 4px; padding: 0 3px; }
  .bmc { display: grid; gap: 8px; grid-template-columns: repeat(10, 1fr); grid-template-areas:
    "parcerias parcerias atividades atividades proposta proposta relacionamento relacionamento segmentos segmentos"
    "parcerias parcerias recursos recursos proposta proposta canais canais segmentos segmentos"
    "custos custos custos custos custos receitas receitas receitas receitas receitas"; }
  .bmc .celula { background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 10px; padding: 10px 12px; }
  .bmc .celula h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 6px; padding-bottom: 4px; border-bottom: 3px solid ${color.brand.teal}; }
  .bmc .celula ul { margin: 0; padding-left: 16px; font-size: 13px; }
  ${ORDEM_CANVAS.map((c) => `.bmc .${c.chave} { grid-area: ${c.chave}; }`).join("\n  ")}
  .cartoes { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin: 0 0 14px; }
  .cartao { background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 12px; padding: 12px 14px; }
  .cartao h3 { font-size: 13px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .05em; }
  .cartao ul { margin: 0; padding-left: 18px; font-size: 14px; }
  .cena { display: grid; grid-template-columns: 110px 1fr; gap: 14px; background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
  .cena .tempo { font-weight: 800; }
  .cena .papel { display: inline-block; margin-top: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; background: ${color.brand.orange}; border-radius: 999px; padding: 2px 10px; font-weight: 800; }
  .cena .fala { background: ${color.bg.light}; border-left: 4px solid ${color.brand.teal}; padding: 8px 12px; border-radius: 6px; margin: 0 0 8px; }
  .cena .detalhe { margin: 0; font-size: 13px; color: ${color.text.mutedOnLight}; }
  .cena .detalhe b { color: ${color.text.ink}; }
  details.origem { margin-top: 28px; background: ${color.bg.panel}; border: 2px solid ${color.bg.lineLight}; border-radius: 12px; padding: 10px 14px; font-size: 14px; }
  details.origem summary { font-weight: 800; cursor: pointer; }
  footer { margin-top: 24px; text-align: center; font-size: 12px; color: ${color.text.mutedOnLight}; }
  @media (max-width: 860px) {
    .bmc { grid-template-columns: 1fr; grid-template-areas: "segmentos" "proposta" "canais" "relacionamento" "receitas" "recursos" "atividades" "parcerias" "custos"; }
    nav.indice ol { columns: 1; }
    .cena { grid-template-columns: 1fr; }
  }
  @page { size: ${paisagem ? "A4 landscape" : "A4"}; margin: 12mm; }
  @media print {
    body { background: ${color.bg.panel}; font-size: 12px; }
    .folha { padding: 0; max-width: none; }
    .copiar, nav.indice { display: none; }
    section, .cena, .mensagem, .cartao, .bmc .celula, table { break-inside: avoid; }
    details.origem { display: block; }
  }`;
}

const SCRIPT = `
document.addEventListener("click", function (e) {
  var botao = e.target.closest("[data-copiar]");
  if (!botao) return;
  var alvo = document.getElementById(botao.getAttribute("data-copiar"));
  if (!alvo) return;
  function avisar() { botao.textContent = "Copiado"; setTimeout(function () { botao.textContent = "Copiar"; }, 1800); }
  function reserva() {
    var faixa = document.createRange(); faixa.selectNodeContents(alvo);
    var selecao = window.getSelection(); selecao.removeAllRanges(); selecao.addRange(faixa);
    try { document.execCommand("copy"); avisar(); } catch (erro) {}
  }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(alvo.innerText).then(avisar, reserva); } else { reserva(); }
});`;

class Contador {
  private n = 0;
  proximo(prefixo: string): string {
    this.n += 1;
    return `${prefixo}-${this.n}`;
  }
}

function lista(itens: readonly string[], ordenada = false, classe = ""): string {
  const tag = ordenada ? "ol" : "ul";
  const attr = classe ? ` class="${classe}"` : "";
  return `<${tag}${attr}>${itens.map((i) => `<li>${escaparHtml(i)}</li>`).join("")}</${tag}>`;
}

function bloco(b: Bloco, ids: Contador): string {
  switch (b.tipo) {
    case "paragrafo":
      return `<p>${escaparHtml(b.texto)}</p>`;
    case "destaque":
      return `<aside class="destaque" style="border-left-color:${TINTA[b.tom]}">${b.titulo ? `<strong>${escaparHtml(b.titulo)}</strong>` : ""}${escaparHtml(b.texto)}</aside>`;
    case "lista":
      return lista(b.itens, b.ordenada);
    case "checklist":
      return lista(b.itens, false, "checklist");
    case "passos":
      return `<ol class="passos">${b.passos
        .map((p) => `<li><strong>${escaparHtml(p.titulo)}</strong>${p.detalhe ? `<small>${escaparHtml(p.detalhe)}</small>` : ""}</li>`)
        .join("")}</ol>`;
    case "mensagem": {
      const id = ids.proximo("msg");
      return `<figure class="mensagem"><figcaption>${escaparHtml(b.rotulo)}${b.quando ? `<small>${escaparHtml(b.quando)}</small>` : ""}</figcaption><pre id="${id}">${textoComCampos(b.texto)}</pre><button type="button" class="copiar" data-copiar="${id}">Copiar</button></figure>`;
    }
    case "tabela":
      return `<table><thead><tr>${b.colunas.map((c) => `<th scope="col">${escaparHtml(c)}</th>`).join("")}</tr></thead><tbody>${b.linhas
        .map((l) => `<tr>${l.map((c) => `<td>${textoComCampos(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "canvas":
      return `<div class="bmc" role="group" aria-label="Modelo de Negócio (Canvas)">${ORDEM_CANVAS.map(
        (c) => `<div class="celula ${c.chave}"><h3>${escaparHtml(c.titulo)}</h3>${lista(b.celulas[c.chave])}</div>`,
      ).join("")}</div>`;
    case "cartoes":
      return `<div class="cartoes">${b.cartoes
        .map((c) => `<div class="cartao"><h3>${escaparHtml(c.titulo)}</h3>${lista(c.itens)}</div>`)
        .join("")}</div>`;
    case "cena":
      return `<div class="cena"><div><div class="tempo">${escaparHtml(b.tempo)}</div><span class="papel">${escaparHtml(b.papel)}</span></div><div><p class="fala">${escaparHtml(b.fala)}</p><p class="detalhe"><b>Mostrar:</b> ${escaparHtml(b.imagem)}</p><p class="detalhe"><b>Texto na tela:</b> ${escaparHtml(b.legenda)}</p></div></div>`;
  }
}

function secao(s: Secao, ids: Contador): string {
  return `<section id="${escaparHtml(s.id)}" aria-labelledby="t-${escaparHtml(s.id)}"><h2 id="t-${escaparHtml(s.id)}">${escaparHtml(s.titulo)}</h2>${s.intro ? `<p class="intro">${escaparHtml(s.intro)}</p>` : ""}${s.blocos.map((b) => bloco(b, ids)).join("")}</section>`;
}

export function documentoParaHtml(doc: Documento): string {
  const ids = new Contador();
  const interno = doc.meta.circulacao === "interno";
  const indice =
    doc.secoes.length >= 5
      ? `<nav class="indice" aria-label="Neste documento"><h2>Neste documento</h2><ol>${doc.secoes
          .map((s) => `<li><a href="#${escaparHtml(s.id)}">${escaparHtml(s.titulo)}</a></li>`)
          .join("")}</ol></nav>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escaparHtml(doc.titulo)}</title>
<style>${estilos(doc)}</style>
</head>
<body>
<div class="folha">
<header class="capa">
  <span class="marca">labdatadev · gamehub</span>
  <h1>${escaparHtml(doc.titulo)}</h1>
  <p class="sub">${escaparHtml(doc.subtitulo)}</p>
  <div class="ficha">
    <span class="selo ${interno ? "interno" : "publico"}">${interno ? "Uso interno, não publique" : "Material para publicar"}</span>
    <span><b>Versão</b> ${escaparHtml(doc.meta.versao)}</span>
    <span><b>Gerado em</b> ${escaparHtml(dataPt(doc.meta.geradoEm))}</span>
    <span><b>Próxima revisão</b> ${escaparHtml(dataPt(doc.meta.proximaRevisao))}</span>
    <span><b>Autor</b> ${escaparHtml(doc.meta.autor)} (nível ${doc.meta.nivelAgente})</span>
  </div>
</header>
<main>
${indice}
${doc.secoes.map((s) => secao(s, ids)).join("\n")}
<details class="origem"><summary>De onde saíram os dados deste documento</summary>${lista(doc.meta.baseadoEm)}<p>Revise tudo antes de usar. Quem decide é você: este material é uma base de trabalho.</p></details>
</main>
<footer>Gerado pelos Funcionários de IA · labdatadev gamehub</footer>
</div>
<script>${SCRIPT}</script>
</body>
</html>`;
}
