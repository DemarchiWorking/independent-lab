import { color, font } from "@tokens";
import { escaparHtml } from "./html";
import type { BlocoCanvas, CanvasNegocio, Maturidade } from "./tipos";

/**
 * Renderização do Business Model Canvas para HTML autocontido.
 *
 * Decisões de desenho (e por quê):
 *
 * - **O canvas desenhado vem primeiro.** Quem abre o arquivo vê o modelo de
 *   negócio inteiro numa tela, na disposição clássica do método (parceiros à
 *   esquerda, clientes à direita, custos e receitas embaixo). O detalhamento
 *   — pergunta, resposta, boa prática, indicador — vem depois, para quem quer
 *   aprofundar.
 * - **Autocontido**: CSS inline e fontes do sistema. O arquivo abre certo no
 *   computador do empresário, sem internet e sem CDN.
 * - **Responsivo em 3 degraus** (≥1100px grade clássica de 10 colunas;
 *   ≥640px duas colunas; abaixo, uma) — a mesma leitura no Full HD, no
 *   tablet e no celular.
 * - **Imprimível**: A4 paisagem, o canvas desenhado cabe em uma página e cada
 *   quadro do detalhamento nunca é cortado ao meio.
 * - **Acessível**: a maturidade nunca depende só de cor (todo quadro traz o
 *   rótulo em texto); texto sempre em tinta escura sobre fundo claro (os
 *   tons da marca ficam em bordas e fundos, não no texto — laranja e teal
 *   não têm contraste AA sobre branco).
 * - Cores e tipografia saem de `design-system/tokens.ts`.
 */

const NEUTRO = {
  borda: "#E2E8F0",
  fundo: "#FFFFFF",
  suave: "#F1F5F9",
  texto2: "#475569",
} as const;

const ROTULO_MATURIDADE: Record<Maturidade, string> = {
  definido: "Definido",
  parcial: "Parcial",
  "a-definir": "A definir",
};

/** Quantos itens aparecem no quadro DESENHADO; o resto fica no detalhamento. */
const ITENS_NO_QUADRO = 3;

/**
 * Posição de cada quadro na grade clássica de 10 colunas. Vira CSS por classe
 * (`.q-<chave>`) e só vale em tela larga ou na impressão: abaixo disso o
 * desenho deixa de ser grade fixa e os quadros fluem pela `order` (ordem de
 * leitura do método). Por classe, e não por `style` inline, para a impressão
 * poder restaurar a grade clássica mesmo numa folha mais estreita que 1100px.
 */
const AREAS: Record<BlocoCanvas["chave"], string> = {
  parcerias: "grid-column:1/3;grid-row:1/3",
  atividades: "grid-column:3/5;grid-row:1",
  recursos: "grid-column:3/5;grid-row:2",
  proposta: "grid-column:5/7;grid-row:1/3",
  relacionamento: "grid-column:7/9;grid-row:1",
  canais: "grid-column:7/9;grid-row:2",
  clientes: "grid-column:9/11;grid-row:1/3",
  custos: "grid-column:1/6;grid-row:3",
  receitas: "grid-column:6/11;grid-row:3",
};

const CSS_AREAS = Object.entries(AREAS)
  .map(([chave, css]) => `.q-${chave}{${css}}`)
  .join(" ");

export interface OpcoesRenderCanvas {
  /** data de emissão já formatada (ex.: "23/10/2026") — entra no controle do
   *  documento. Fica FORA de `gerarCanvas` para ele continuar puro. */
  emitidoEm?: string;
}

function lista(itens: readonly string[]): string {
  return `<ul>${itens.map((i) => `<li>${escaparHtml(i)}</li>`).join("")}</ul>`;
}

function quadroDesenhado(b: BlocoCanvas): string {
  const visiveis = b.itens.slice(0, ITENS_NO_QUADRO);
  const resto = b.itens.length - visiveis.length;
  return `<section class="q q-${b.chave} m-${b.maturidade}" style="order:${b.numero}" aria-labelledby="qt-${b.chave}">
      <header>
        <span class="n" aria-hidden="true">${b.numero}</span>
        <h3 id="qt-${b.chave}">${escaparHtml(b.titulo)}</h3>
      </header>
      ${lista(visiveis)}
      <footer>
        <span class="chip c-${b.maturidade}">${ROTULO_MATURIDADE[b.maturidade]}</span>
        ${resto > 0 ? `<span class="mais">+${resto} no detalhamento</span>` : ""}
      </footer>
    </section>`;
}

function quadroDetalhado(b: BlocoCanvas): string {
  const hipotese = b.hipotese
    ? `<h4>Hipótese a validar</h4><p>${escaparHtml(b.hipotese)}</p>`
    : "";
  return `<article class="det m-${b.maturidade}" id="det-${b.chave}">
      <header>
        <span class="n" aria-hidden="true">${b.numero}</span>
        <h3>${escaparHtml(b.titulo)}</h3>
        <span class="chip c-${b.maturidade}">${ROTULO_MATURIDADE[b.maturidade]}</span>
      </header>
      <p class="pergunta">${escaparHtml(b.pergunta)}</p>
      <div class="cols">
        <div>
          <h4>Resposta</h4>
          ${lista(b.itens)}
        </div>
        <aside>
          <h4>Boa prática do segmento</h4>
          <p>${escaparHtml(b.boaPratica)}</p>
          <h4>Indicador</h4>
          <p class="kpi">${escaparHtml(b.indicador)}</p>
          ${hipotese}
        </aside>
      </div>
      <p class="evidencia"><b>Por que ${escaparHtml(ROTULO_MATURIDADE[b.maturidade].toLowerCase())}:</b> ${escaparHtml(b.evidencia)}</p>
    </article>`;
}

const CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; padding: clamp(12px, 3vw, 32px);
    font-family: ${font.ui};
    background: ${color.bg.light};
    color: ${color.text.ink};
    line-height: 1.5;
  }
  .folha { max-width: 1280px; margin: 0 auto; }
  h1, h2, h3, h4, p, ul, dl { margin: 0; }
  ul { padding-left: 18px; }
  li { margin-bottom: 4px; }

  /* ---- cabeçalho e controle do documento ---- */
  .topo { display: grid; grid-template-columns: 1fr; gap: 16px; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 3px solid ${color.brand.teal}; }
  .marca { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; }
  h1 { font-size: clamp(22px, 3.2vw, 30px); line-height: 1.2; }
  .sub { color: ${NEUTRO.texto2}; font-size: 14px; margin-top: 4px; }
  .controle { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-radius: 10px; padding: 12px 14px; font-size: 12px; }
  .controle dt { color: ${NEUTRO.texto2}; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; }
  .controle dd { margin: 0 0 4px; font-weight: 700; overflow-wrap: anywhere; }

  /* ---- seções ---- */
  .sec { margin-top: 28px; }
  .sec > h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px; }
  .sec > .intro { color: ${NEUTRO.texto2}; font-size: 13px; margin-bottom: 12px; max-width: 80ch; }

  /* ---- chips de maturidade (texto + cor, nunca só cor) ---- */
  .chip { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 2px 8px; border-radius: 999px; border: 1px solid transparent; white-space: nowrap; }
  .c-definido { background: ${color.brand.green}26; border-color: ${color.brand.green}; }
  .c-parcial { background: ${color.brand.orange}26; border-color: ${color.brand.orange}; }
  .c-a-definir { background: ${color.brand.coral}22; border-color: ${color.brand.coral}; }
  .n { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: ${color.text.ink}; color: #fff; font-size: 11px; font-weight: 800; flex: none; }

  /* ---- o canvas desenhado ---- */
  .bmc { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .q { background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-top-width: 5px; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; min-width: 0; }
  .q header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .q h3 { font-size: 12px; line-height: 1.25; text-transform: uppercase; letter-spacing: .4px; }
  .q ul { font-size: 12px; flex: 1; }
  .q footer { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .q .mais { font-size: 10px; color: ${NEUTRO.texto2}; }
  .m-definido { border-top-color: ${color.brand.green}; }
  .m-parcial { border-top-color: ${color.brand.orange}; }
  .m-a-definir { border-top-color: ${color.brand.coral}; }
  .legenda { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; font-size: 11px; color: ${NEUTRO.texto2}; align-items: center; }

  /* ---- resumo executivo ---- */
  .resumo { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .cartao { background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-radius: 10px; padding: 14px 16px; }
  .cartao h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: ${NEUTRO.texto2}; margin-bottom: 2px; }
  .linha-resumo { padding: 8px 0; border-bottom: 1px solid ${NEUTRO.borda}; font-size: 14px; }
  .linha-resumo:last-child { border-bottom: 0; }
  .linha-resumo b { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: ${NEUTRO.texto2}; }
  .indice { text-align: center; }
  .indice .valor { font-size: 44px; font-weight: 800; line-height: 1.1; }
  .indice .rotulo { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .gauge { height: 10px; border-radius: 999px; background: ${NEUTRO.suave}; border: 1px solid ${NEUTRO.borda}; overflow: hidden; }
  .gauge i { display: block; height: 100%; background: ${color.brand.green}; }
  .indice small { display: block; margin-top: 8px; font-size: 11px; color: ${NEUTRO.texto2}; }

  /* ---- prioridades, plano, riscos ---- */
  .prioridades { display: grid; grid-template-columns: 1fr; gap: 10px; counter-reset: p; }
  .prio { background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-left: 5px solid ${color.brand.orange}; border-radius: 10px; padding: 12px 14px; font-size: 13px; }
  .prio h4 { font-size: 13px; margin-bottom: 4px; }
  .prio h4::before { counter-increment: p; content: counter(p) ". "; }
  .prio p + p { margin-top: 4px; color: ${NEUTRO.texto2}; }
  .fases { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .fase { background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-top: 5px solid ${color.brand.teal}; border-radius: 10px; padding: 12px 14px; font-size: 13px; }
  .fase h4 { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-radius: 10px; overflow: hidden; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; background: ${NEUTRO.suave}; padding: 8px 12px; }
  td { padding: 10px 12px; border-top: 1px solid ${NEUTRO.borda}; vertical-align: top; }
  .check { list-style: none; padding: 0; }
  .check li { display: flex; gap: 10px; align-items: flex-start; background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-radius: 8px; padding: 8px 12px; font-size: 13px; }
  .check li::before { content: ""; flex: none; width: 14px; height: 14px; margin-top: 3px; border: 2px solid ${color.text.ink}; border-radius: 3px; }

  /* ---- detalhamento por quadro ---- */
  .detalhes { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .det { background: ${NEUTRO.fundo}; border: 1px solid ${NEUTRO.borda}; border-left-width: 6px; border-radius: 10px; padding: 14px 16px; }
  .m-definido.det { border-left-color: ${color.brand.green}; }
  .m-parcial.det { border-left-color: ${color.brand.orange}; }
  .m-a-definir.det { border-left-color: ${color.brand.coral}; }
  .det header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .det h3 { font-size: 15px; flex: 1; min-width: 160px; }
  .pergunta { font-style: italic; color: ${NEUTRO.texto2}; font-size: 13px; margin: 6px 0 10px; }
  .cols { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .det h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: ${NEUTRO.texto2}; margin: 0 0 4px; }
  .det ul, .det aside p { font-size: 13px; }
  .det aside { background: ${NEUTRO.suave}; border-radius: 8px; padding: 10px 12px; }
  .det aside h4 + p { margin-bottom: 10px; }
  .det aside h4:last-of-type + p { margin-bottom: 0; }
  .kpi { font-weight: 700; }
  .evidencia { margin-top: 10px; font-size: 12px; color: ${NEUTRO.texto2}; }

  .metodo { font-size: 12px; color: ${NEUTRO.texto2}; max-width: 90ch; }
  .metodo p + p { margin-top: 6px; }
  footer.rodape { margin-top: 32px; padding-top: 12px; border-top: 1px solid ${NEUTRO.borda}; text-align: center; font-size: 11px; color: ${NEUTRO.texto2}; }

  /* ---- tablet (≥640px): duas colunas ---- */
  @media (min-width: 640px) {
    .controle { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .prioridades, .fases { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 760px) {
    .cols { grid-template-columns: 1.2fr 1fr; }
    .resumo { grid-template-columns: 2fr 1fr; align-items: start; }
  }
  @media (min-width: 900px) {
    .topo { grid-template-columns: 1.1fr 1fr; align-items: end; }
    .detalhes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  /* ---- o desenho: grade clássica de 10 colunas em tela larga e no papel;
     abaixo de 1100px os quadros fluem na ordem de leitura do método
     (clientes → custos), em 2 colunas e, no celular, em 1 ---- */
  @media (min-width: 1100px), print {
    .bmc { grid-template-columns: repeat(10, minmax(0, 1fr)); grid-template-rows: auto auto auto; }
    ${CSS_AREAS}
  }
  @media (max-width: 639px) {
    .bmc { grid-template-columns: 1fr; }
  }

  /* ---- impressão: A4 paisagem, canvas desenhado em uma página ---- */
  @page { size: A4 landscape; margin: 9mm; }
  @media print {
    body { padding: 0; background: #fff; font-size: 11px; }
    .bmc { gap: 5px; }
    .q { padding: 6px 8px; }
    .q h3 { font-size: 9px; }
    .q ul { font-size: 8.5px; }
    .q li { margin-bottom: 2px; }
    .n { width: 16px; height: 16px; font-size: 9px; }
    .chip { font-size: 7px; padding: 1px 5px; }
    .q .mais { font-size: 7px; }
    .sec-canvas { break-after: page; }
    .det, .cartao, .prio, .fase, tr, .check li { break-inside: avoid; }
    .sec { margin-top: 16px; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function canvasParaHtml(canvas: CanvasNegocio, opcoes: OpcoesRenderCanvas = {}): string {
  const c = canvas.controle;
  const controle = [
    ["Documento", c.documento],
    ["Versão", c.versao],
    ["Emitido em", opcoes.emitidoEm ?? "—"],
    ["Elaborado por", c.elaboradoPor],
    ["Classificação", c.classificacao],
    ["Revisão", c.revisao],
  ]
    .map(([k, v]) => `<div><dt>${escaparHtml(k)}</dt><dd>${escaparHtml(v)}</dd></div>`)
    .join("");

  const resumo = canvas.resumoExecutivo
    .map((r) => `<div class="linha-resumo"><b>${escaparHtml(r.rotulo)}</b>${escaparHtml(r.texto)}</div>`)
    .join("");

  const prioridades =
    canvas.prioridades.length > 0
      ? `<section class="sec" aria-labelledby="h-prio">
      <h2 id="h-prio">Prioridades imediatas</h2>
      <p class="intro">Os quadros menos definidos hoje, segundo o seu cadastro, e a melhor prática do seu segmento para cada um.</p>
      <div class="prioridades">${canvas.prioridades
        .map(
          (p) => `<div class="prio"><h4>${escaparHtml(p.bloco)}</h4><p>${escaparHtml(p.acao)}</p><p>${escaparHtml(p.porque)}</p></div>`,
        )
        .join("")}</div>
    </section>`
      : "";

  const detalhes = `<section class="sec" aria-labelledby="h-det">
      <h2 id="h-det">Detalhamento por quadro</h2>
      <p class="intro">Para cada quadro: a pergunta que ele precisa responder, a resposta para o seu negócio, a boa prática do segmento e o número que prova que funciona.</p>
      <div class="detalhes">${canvas.blocos.map(quadroDetalhado).join("")}</div>
    </section>`;

  const plano =
    canvas.plano90Dias.length > 0
      ? `<section class="sec" aria-labelledby="h-plano">
      <h2 id="h-plano">Plano de 90 dias</h2>
      <p class="intro">Do canvas à ação: o que fazer em cada terço do ciclo.</p>
      <div class="fases">${canvas.plano90Dias
        .map((f) => `<div class="fase"><h4>${escaparHtml(f.fase)}</h4>${lista(f.acoes)}</div>`)
        .join("")}</div>
    </section>`
      : "";

  const passos =
    canvas.proximosPassos.length > 0
      ? `<section class="sec" aria-labelledby="h-passos">
      <h2 id="h-passos">Próximos passos</h2>
      <div class="cartao">${lista(canvas.proximosPassos)}</div>
    </section>`
      : "";

  const riscos =
    canvas.riscos.length > 0
      ? `<section class="sec" aria-labelledby="h-riscos">
      <h2 id="h-riscos">Matriz de riscos</h2>
      <p class="intro">Os riscos que mais derrubam negócios do seu segmento e como se proteger de cada um.</p>
      <table>
        <thead><tr><th scope="col">Risco</th><th scope="col">Mitigação</th></tr></thead>
        <tbody>${canvas.riscos
          .map((r) => `<tr><td>${escaparHtml(r.risco)}</td><td>${escaparHtml(r.mitigacao)}</td></tr>`)
          .join("")}</tbody>
      </table>
    </section>`
      : "";

  const checklist =
    canvas.checklistValidacao.length > 0
      ? `<section class="sec" aria-labelledby="h-check">
      <h2 id="h-check">Checklist de validação</h2>
      <p class="intro">Um canvas só vale depois de confrontado com clientes reais. Marque cada item ao cumprir.</p>
      <ul class="check">${canvas.checklistValidacao.map((i) => `<li>${escaparHtml(i)}</li>`).join("")}</ul>
    </section>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escaparHtml(canvas.titulo)}</title>
<style>${CSS}</style>
</head>
<body>
  <main class="folha">
    <header class="topo">
      <div>
        <p class="marca">labdatadev · gamehub</p>
        <h1>${escaparHtml(canvas.titulo)}</h1>
        <p class="sub">${escaparHtml(canvas.subtitulo)}</p>
      </div>
      <dl class="controle" aria-label="Controle do documento">${controle}</dl>
    </header>

    <section class="sec sec-canvas" aria-labelledby="h-canvas" style="margin-top:0">
      <h2 id="h-canvas">Modelo de negócio</h2>
      <p class="intro">Os nove quadros do seu negócio numa só visão. A cor da borda mostra o quanto cada quadro está definido hoje.</p>
      <div class="bmc">${canvas.blocos.map(quadroDesenhado).join("")}</div>
      <div class="legenda" aria-label="Legenda de maturidade">
        <span><span class="chip c-definido">Definido</span> claro e sustentado pelas suas respostas</span>
        <span><span class="chip c-parcial">Parcial</span> existe, mas falta validar ou formalizar</span>
        <span><span class="chip c-a-definir">A definir</span> lacuna que merece atenção primeiro</span>
      </div>
    </section>

    <section class="sec" aria-labelledby="h-resumo">
      <h2 id="h-resumo">Resumo executivo</h2>
      <div class="resumo">
        <div class="cartao">${resumo}</div>
        <div class="cartao indice">
          <h4>Índice de clareza do modelo</h4>
          <div class="valor">${canvas.indiceClareza}<small style="display:inline;font-size:16px"> / 100</small></div>
          <div class="rotulo">${escaparHtml(canvas.rotuloClareza)}</div>
          <div class="gauge" role="img" aria-label="${canvas.indiceClareza} de 100"><i style="width:${canvas.indiceClareza}%"></i></div>
          <small>Calculado a partir das respostas do seu cadastro: definido = 100, parcial = 50, a definir = 0, média dos 9 quadros.</small>
        </div>
      </div>
    </section>

    ${prioridades}
    ${detalhes}
    ${plano}
    ${passos}
    ${riscos}
    ${checklist}

    <section class="sec" aria-labelledby="h-metodo">
      <h2 id="h-metodo">Método e limites deste documento</h2>
      <div class="metodo">
        <p>${escaparHtml(c.metodologia)}. A maturidade de cada quadro é calculada a partir das respostas do cadastro — não é uma avaliação externa do negócio.</p>
        <p>As boas práticas e hipóteses são recomendações do segmento, não garantia de resultado: precisam ser validadas com clientes reais e revisadas ${escaparHtml(c.revisao.toLowerCase())}.</p>
      </div>
    </section>

    <footer class="rodape">
      ${escaparHtml(c.documento)} · v${escaparHtml(c.versao)} · ${escaparHtml(c.classificacao)} · Gerado pelos Funcionários de IA · labdatadev
    </footer>
  </main>
</body>
</html>`;
}
