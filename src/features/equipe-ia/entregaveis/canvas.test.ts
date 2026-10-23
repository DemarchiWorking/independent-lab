import { describe, expect, it } from "vitest";
import { gerarCanvas, maturidadeDosBlocos } from "./canvas";
import { conteudoCanvas, ORDEM_BLOCOS } from "./canvas-conteudo";
import { canvasParaHtml } from "./render-canvas";
import type { PerfilNegocio } from "./tipos";
import type { Respostas, Segmento } from "@/lib/db/types";

const SEGMENTOS: Segmento[] = [
  "engenharia", "contabilidade", "saude", "tecnologia",
  "alimentacao", "comercio", "servico", "outro",
];

function perfil(over: Partial<PerfilNegocio> = {}, resp: Partial<Respostas> = {}): PerfilNegocio {
  const respostas: Respostas = {
    nomeNegocio: "Radiz Engenharia",
    segmento: "engenharia",
    cidade: "Mendes",
    bairro: "Centro",
    equipe: "2-5",
    presencaDigital: "social",
    captacao: ["indicacao"],
    objetivo: "mais-leads",
    gargalo: "perco-leads",
    investimento: "1500-3500",
    ...resp,
  };
  return {
    nomeNegocio: respostas.nomeNegocio,
    segmento: respostas.segmento,
    cidade: respostas.cidade,
    bairro: respostas.bairro,
    degrauAtual: 2,
    nivelAgente: 1,
    ...over,
    respostas,
  };
}

describe("Canvas enterprise — estrutura", () => {
  it("entrega os 9 quadros na ordem de leitura do método, numerados", () => {
    const c = gerarCanvas(perfil());
    expect(c.blocos.map((b) => b.chave)).toEqual(ORDEM_BLOCOS.map((o) => o.chave));
    expect(c.blocos.map((b) => b.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("TODO quadro, em TODO nível e segmento, traz pergunta, resposta, boa prática, indicador e evidência", () => {
    for (const segmento of SEGMENTOS) {
      for (const nivelAgente of [1, 2, 3]) {
        const c = gerarCanvas(perfil({ segmento, nivelAgente }, { segmento }));
        for (const b of c.blocos) {
          const id = `${segmento}/n${nivelAgente}/${b.chave}`;
          expect(b.pergunta.length, id).toBeGreaterThan(15);
          expect(b.itens.length, id).toBeGreaterThanOrEqual(2);
          expect(b.boaPratica.length, id).toBeGreaterThan(30);
          expect(b.indicador.length, id).toBeGreaterThan(8);
          expect(b.evidencia.length, id).toBeGreaterThan(15);
          for (const i of b.itens) expect(i.trim().length, id).toBeGreaterThan(5);
        }
      }
    }
  });

  it("o texto muda de verdade com o nicho — nada de modelo único com o nome trocado", () => {
    for (const { chave } of ORDEM_BLOCOS) {
      const praticas = SEGMENTOS.filter((s) => s !== "outro").map(
        (s) => conteudoCanvas(s).blocos[chave].boaPratica,
      );
      expect(new Set(praticas).size, `boa prática do quadro ${chave}`).toBe(praticas.length);
    }
    const eng = JSON.stringify(gerarCanvas(perfil()));
    const ali = JSON.stringify(
      gerarCanvas(perfil({ segmento: "alimentacao" }, { segmento: "alimentacao" })),
    );
    expect(eng).toContain("PNCP");
    expect(ali).toContain("merenda");
    expect(ali).not.toContain("ART");
  });

  it("é puro e determinístico", () => {
    expect(gerarCanvas(perfil())).toEqual(gerarCanvas(perfil()));
  });
});

describe("Canvas enterprise — maturidade vem das respostas do cadastro", () => {
  const m = (resp: Partial<Respostas>) => maturidadeDosBlocos(perfil({}, resp).respostas);

  it("sem canal de captação o quadro Canais fica 'a definir'; com dois, 'definido'", () => {
    expect(m({ captacao: [] }).canais.nivel).toBe("a-definir");
    expect(m({ captacao: ["sem-processo"] }).canais.nivel).toBe("a-definir");
    expect(m({ captacao: ["indicacao"] }).canais.nivel).toBe("parcial");
    expect(m({ captacao: ["indicacao", "social"] }).canais.nivel).toBe("definido");
  });

  it("cada gargalo declarado rebaixa o quadro que ele de fato afeta", () => {
    expect(m({ gargalo: "perco-leads" }).relacionamento.nivel).toBe("a-definir");
    expect(m({ gargalo: "sem-dados" }).receitas.nivel).toBe("a-definir");
    expect(m({ gargalo: "sem-processo" }).atividades.nivel).toBe("a-definir");
    expect(m({ gargalo: "manual" }).atividades.nivel).toBe("parcial");
  });

  it("não saber o teto de investimento deixa Custos 'a definir'", () => {
    expect(m({ investimento: "nao-sei" }).custos.nivel).toBe("a-definir");
    expect(m({ investimento: "1500-3500" }).custos.nivel).toBe("definido");
  });

  it("toda avaliação cita a evidência — nunca é opinião sem lastro", () => {
    for (const a of Object.values(m({}))) expect(a.evidencia.length).toBeGreaterThan(15);
  });

  it("o índice de clareza é a média 100/50/0 e fica entre 0 e 100", () => {
    const pior = gerarCanvas(
      perfil({}, {
        captacao: [], gargalo: "perco-leads", investimento: "nao-sei",
        presencaDigital: "nada", equipe: "so-eu",
      }),
    );
    const melhor = gerarCanvas(
      perfil({}, {
        captacao: ["indicacao", "portais", "ads"], gargalo: "manual",
        investimento: "3500+", presencaDigital: "site-portais", equipe: "16-30",
      }),
    );
    expect(pior.indiceClareza).toBeGreaterThanOrEqual(0);
    expect(melhor.indiceClareza).toBeLessThanOrEqual(100);
    expect(melhor.indiceClareza).toBeGreaterThan(pior.indiceClareza);
    const c = gerarCanvas(perfil());
    const pontos = { definido: 100, parcial: 50, "a-definir": 0 } as const;
    expect(c.indiceClareza).toBe(
      Math.round(c.blocos.reduce((s, b) => s + pontos[b.maturidade], 0) / 9),
    );
  });

  it("as prioridades são os quadros MENOS definidos, no máximo 3, com a ação do nicho", () => {
    const c = gerarCanvas(
      perfil({}, { captacao: [], gargalo: "perco-leads", investimento: "nao-sei" }),
    );
    expect(c.prioridades.length).toBeGreaterThan(0);
    expect(c.prioridades.length).toBeLessThanOrEqual(3);
    for (const p of c.prioridades) {
      const bloco = c.blocos.find((b) => b.titulo === p.bloco)!;
      expect(bloco.maturidade).not.toBe("definido");
      expect(p.acao).toBe(bloco.boaPratica);
    }
    // o primeiro nunca é mais definido que o último
    const pesos = { "a-definir": 0, parcial: 1, definido: 2 } as const;
    const ms = c.prioridades.map(
      (p) => pesos[c.blocos.find((b) => b.titulo === p.bloco)!.maturidade],
    );
    expect([...ms].sort((a, b) => a - b)).toEqual(ms);
  });
});

describe("Canvas enterprise — profundidade por nível do agente", () => {
  const nivel = (n: number) => gerarCanvas(perfil({ nivelAgente: n }));

  it("nível 1 já é um canvas completo; hipóteses, plano e riscos só crescem depois", () => {
    const n1 = nivel(1);
    expect(n1.resumoExecutivo).toHaveLength(5);
    expect(n1.prioridades.length).toBeGreaterThan(0);
    expect(n1.blocos.every((b) => b.hipotese === undefined)).toBe(true);
    expect(n1.plano90Dias).toEqual([]);
    expect(n1.proximosPassos).toEqual([]);
    expect(n1.riscos).toEqual([]);
    expect(n1.checklistValidacao).toEqual([]);
  });

  it("nível 2 acrescenta hipótese por quadro, plano em 3 fases e próximos passos", () => {
    const n2 = nivel(2);
    expect(n2.blocos.every((b) => (b.hipotese ?? "").length > 20)).toBe(true);
    expect(n2.plano90Dias).toHaveLength(3);
    expect(n2.proximosPassos.length).toBeGreaterThan(0);
    expect(n2.riscos).toEqual([]);
  });

  it("nível 3 acrescenta matriz de riscos do nicho e checklist de validação", () => {
    const n3 = nivel(3);
    expect(n3.riscos.length).toBeGreaterThanOrEqual(4);
    for (const r of n3.riscos) {
      expect(r.risco.length).toBeGreaterThan(10);
      expect(r.mitigacao.length).toBeGreaterThan(10);
    }
    expect(n3.checklistValidacao.length).toBeGreaterThanOrEqual(5);
  });

  it("evoluir nunca tira informação: tudo do nível anterior continua lá", () => {
    const total = (n: number) => nivel(n).blocos.reduce((s, b) => s + b.itens.length, 0);
    expect(total(2)).toBeGreaterThan(total(1));
    expect(total(3)).toBeGreaterThanOrEqual(total(2));
    const n1 = nivel(1);
    const n2 = nivel(2);
    for (const [i, b] of n1.blocos.entries()) {
      for (const item of b.itens) expect(n2.blocos[i].itens).toContain(item);
    }
  });

  it("o controle do documento identifica versão, autor e revisão", () => {
    const c = nivel(2).controle;
    expect(c.versao).toBe("1.1");
    expect(c.elaboradoPor).toContain("nível 2");
    expect(c.metodologia).toContain("Osterwalder");
    expect(c.revisao).toMatch(/90 dias/);
  });
});

describe("Canvas enterprise — documento HTML", () => {
  const html = (n = 3, over: Partial<PerfilNegocio> = {}) =>
    canvasParaHtml(gerarCanvas(perfil({ nivelAgente: n, ...over })), { emitidoEm: "23/10/2026" });

  it("o modelo de negócio desenhado vem ANTES de tudo, logo após o cabeçalho", () => {
    const h = html();
    const iCanvas = h.indexOf('id="h-canvas"');
    expect(iCanvas).toBeGreaterThan(0);
    for (const depois of ["h-resumo", "h-prio", "h-det", "h-plano", "h-riscos", "h-check"]) {
      expect(h.indexOf(`id="${depois}"`), depois).toBeGreaterThan(iCanvas);
    }
  });

  it("desenha os 9 quadros na grade clássica e os 9 no detalhamento", () => {
    const h = html();
    expect(h.match(/class="q q-/g)).toHaveLength(9);
    expect(h.match(/class="det m-/g)).toHaveLength(9);
    // posição clássica: parceiros à esquerda, clientes à direita, custos/receitas embaixo
    expect(h).toContain(".q-parcerias{grid-column:1/3;grid-row:1/3}");
    expect(h).toContain(".q-clientes{grid-column:9/11;grid-row:1/3}");
    expect(h).toContain(".q-custos{grid-column:1/6;grid-row:3}");
    expect(h).toContain(".q-receitas{grid-column:6/11;grid-row:3}");
  });

  it("é responsivo (3 degraus) e imprimível em A4 paisagem", () => {
    const h = html();
    expect(h).toContain('name="viewport"');
    expect(h).toContain("@media (min-width: 1100px), print");
    expect(h).toContain("@media (max-width: 639px)");
    expect(h).toContain("@page { size: A4 landscape");
    expect(h).toContain("break-after: page");
  });

  it("maturidade nunca depende só de cor: todo quadro traz o rótulo em texto", () => {
    const h = html();
    const chips = h.match(/class="chip c-(definido|parcial|a-definir)">(Definido|Parcial|A definir)</g);
    expect(chips!.length).toBeGreaterThanOrEqual(18);
    expect(h).toContain('role="img" aria-label=');
  });

  it("mostra a data de emissão e o índice de clareza", () => {
    const h = html();
    expect(h).toContain("23/10/2026");
    expect(h).toContain("Índice de clareza do modelo");
  });

  it("usa só cores do design system (nenhum hex fora dos tokens e dos neutros nomeados)", () => {
    const h = html();
    const hex = new Set(h.match(/#[0-9A-Fa-f]{6}\b/g));
    const permitidos = new Set(
      [
        "#F8FAFC", "#0A1628", "#00D4C8", "#F59E0B", "#22C55E", "#EF5350", "#FFFFFF",
        "#E2E8F0", "#F1F5F9", "#475569",
      ].map((x) => x.toUpperCase()),
    );
    for (const c of hex) expect(permitidos.has(c.toUpperCase()), c).toBe(true);
  });

  it("escapa conteúdo do usuário em TODOS os pontos (nome, cidade, bairro)", () => {
    const malicioso = "<script>alert(1)</script>\"&'";
    const h = canvasParaHtml(
      gerarCanvas(perfil({ nomeNegocio: malicioso, cidade: malicioso, bairro: malicioso })),
    );
    expect(h).not.toContain("<script>alert");
    expect(h).toContain("&lt;script&gt;");
  });

  it("não indexável e sem recursos externos (abre offline)", () => {
    const h = html();
    expect(h).toContain('name="robots" content="noindex, nofollow"');
    expect(h).not.toMatch(/https?:\/\//);
    expect(h).not.toMatch(/<(link|script|img)\b/);
  });

  it("limita o quadro desenhado a 3 itens e avisa quando há mais no detalhamento", () => {
    expect(html(3)).toMatch(/\+\d+ no detalhamento/);
  });
});
