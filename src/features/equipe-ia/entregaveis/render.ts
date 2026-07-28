import { color, font } from "@tokens";
import type { CanvasNegocio, ScriptComercial } from "./tipos";

/**
 * Renderização dos entregáveis para HTML autocontido e imprimível.
 *
 * Autocontido de propósito: o arquivo baixado precisa abrir certo no
 * computador do empresário sem internet, sem CDN, sem fonte externa. Por
 * isso todo o CSS vai inline e a tipografia cai em fontes do sistema —
 * `font.ui` já declara os fallbacks (`ui-sans-serif, system-ui`).
 *
 * Cor e tipografia saem de `design-system/tokens.ts`, nunca hex avulso
 * (regra não-negociável do AGENTS.md) — é o mesmo visual do app.
 */

/**
 * Escapa conteúdo vindo do usuário antes de entrar no HTML.
 *
 * NÃO é paranoia: `nomeNegocio` é digitado no cadastro e vai para dentro
 * do documento. Sem escapar, um negócio chamado `<script>…` viraria script
 * executável no momento em que o dono abrisse o arquivo baixado.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moldura(titulo: string, subtitulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escaparHtml(titulo)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px;
    font-family: ${font.ui};
    background: ${color.bg.light};
    color: ${color.text.ink};
    line-height: 1.5;
  }
  .folha { max-width: 1100px; margin: 0 auto; }
  header { border-bottom: 3px solid ${color.brand.teal}; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .sub { color: #5b6b86; font-size: 14px; margin: 0; }
  .marca { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: ${color.brand.teal}; margin: 0 0 8px; font-weight: 700; }
  .grade { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .bloco { background: #fff; border: 2px solid #e6ebf3; border-radius: 12px; padding: 14px; }
  .bloco h2 { font-size: 13px; margin: 0 0 8px; color: ${color.brand.orange}; text-transform: uppercase; letter-spacing: .5px; }
  .bloco ul { margin: 0; padding-left: 18px; }
  .bloco li { font-size: 13px; margin-bottom: 5px; }
  .secao { background: #fff; border: 2px solid #e6ebf3; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .secao h2 { font-size: 14px; margin: 0 0 10px; color: ${color.brand.orange}; text-transform: uppercase; letter-spacing: .5px; }
  .fala { background: ${color.bg.light}; border-left: 4px solid ${color.brand.teal}; padding: 10px 12px; border-radius: 6px; font-size: 14px; }
  .objecao { margin-bottom: 10px; }
  .objecao b { display: block; color: ${color.brand.coral}; font-size: 13px; }
  .destaque { background: ${color.brand.teal}1a; border: 2px solid ${color.brand.teal}; border-radius: 12px; padding: 14px; margin-top: 16px; }
  .destaque h2 { color: ${color.text.ink}; }
  footer { margin-top: 28px; text-align: center; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 0; background: #fff; } .bloco, .secao { break-inside: avoid; } }
  @media (max-width: 860px) { .grade { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <div class="folha">
    <header>
      <p class="marca">labdatadev · gamehub</p>
      <h1>${escaparHtml(titulo)}</h1>
      <p class="sub">${escaparHtml(subtitulo)}</p>
    </header>
    ${corpo}
    <footer>Gerado pelos Funcionários de IA · labdatadev</footer>
  </div>
</body>
</html>`;
}

export function canvasParaHtml(canvas: CanvasNegocio): string {
  const blocos = canvas.blocos
    .map(
      (b) => `<div class="bloco">
      <h2>${escaparHtml(b.titulo)}</h2>
      <ul>${b.itens.map((i) => `<li>${escaparHtml(i)}</li>`).join("")}</ul>
    </div>`,
    )
    .join("");

  const passos =
    canvas.proximosPassos.length > 0
      ? `<div class="destaque">
      <h2>Próximos passos</h2>
      <ul>${canvas.proximosPassos.map((p) => `<li>${escaparHtml(p)}</li>`).join("")}</ul>
    </div>`
      : "";

  return moldura(canvas.titulo, canvas.subtitulo, `<div class="grade">${blocos}</div>${passos}`);
}

export function scriptParaHtml(script: ScriptComercial, subtitulo: string): string {
  const lista = (itens: string[]) =>
    `<ul>${itens.map((i) => `<li>${escaparHtml(i)}</li>`).join("")}</ul>`;

  const objecoes = script.objecoes
    .map(
      (o) => `<div class="objecao">
      <b>“${escaparHtml(o.objecao)}”</b>
      <span>${escaparHtml(o.resposta)}</span>
    </div>`,
    )
    .join("");

  const cadencia =
    script.cadencia.length > 0
      ? `<div class="destaque"><h2>Estratégia de cadência</h2>${lista(script.cadencia)}</div>`
      : "";

  const corpo = `
    <div class="secao"><h2>Abertura</h2><p class="fala">${escaparHtml(script.abertura)}</p></div>
    <div class="secao"><h2>Perguntas de descoberta</h2>${lista(script.descoberta)}</div>
    <div class="secao"><h2>Argumentos</h2>${lista(script.argumentos)}</div>
    <div class="secao"><h2>Objeções e respostas</h2>${objecoes}</div>
    <div class="secao"><h2>Fechamento</h2><p class="fala">${escaparHtml(script.fechamento)}</p></div>
    ${cadencia}`;

  return moldura(script.titulo, subtitulo, corpo);
}
