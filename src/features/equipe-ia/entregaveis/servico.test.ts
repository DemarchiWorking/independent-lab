import { describe, expect, it } from "vitest";
import { gerarCarrosseis } from "./carrossel";
import { ctx } from "./teste-util";
import {
  aplicarEdicoes,
  lerPedidoImagem,
  LIMITES_EDICAO,
  prepararPauta,
  slidesPendentes,
  type PedidoImagem,
} from "./servico";

const pacote = gerarCarrosseis(ctx({ nivel: 3 }));
const dicas = pacote.pautas.find((p) => p.id === "dicas")!;
const bastidores = pacote.pautas.find((p) => p.id === "bastidores")!;

function pedido(over: Partial<PedidoImagem> = {}): PedidoImagem {
  return { pautaId: "dicas", formato: "quadrado", tema: "escuro", slide: 1, edicoes: null, legenda: null, ...over };
}

describe("lerPedidoImagem", () => {
  it("aceita um pedido completo e aplica os padrões", () => {
    const r = lerPedidoImagem({ pauta: "dicas", slide: "2" });
    expect(r).toEqual({ ok: true, valor: { pautaId: "dicas", formato: "quadrado", tema: "escuro", slide: 2, edicoes: null, legenda: null } });
  });

  it("recusa pauta, formato, tema e slide fora da lista, sem 'arrumar' em silêncio", () => {
    expect(lerPedidoImagem({ pauta: "../x" }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "" }).ok).toBe(false);
    expect(lerPedidoImagem({}).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", formato: "gigante" }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", tema: "neon" }).ok).toBe(false);
    for (const slide of ["0", "-1", "21", "1.5", "abc", "1e2"]) {
      expect(lerPedidoImagem({ pauta: "dicas", slide }).ok, slide).toBe(false);
    }
    const erro = lerPedidoImagem({ pauta: "dicas", formato: "gigante" });
    expect(erro.ok === false && erro.status).toBe(400);
  });

  it("valida as edições: lista de objetos com título e texto em string", () => {
    expect(lerPedidoImagem({ pauta: "dicas", slides: "x" }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", slides: [1] }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", slides: [{ titulo: 1, texto: "a" }] }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", slides: Array.from({ length: 21 }, () => ({ titulo: "a", texto: "b" })) }).ok).toBe(false);
    expect(lerPedidoImagem({ pauta: "dicas", slides: [{ titulo: "a", texto: "b" }] }).ok).toBe(true);
  });

  it("limpa e limita a legenda", () => {
    const r = lerPedidoImagem({ pauta: "dicas", legenda: `oi\u0000${"x".repeat(5000)}` });
    expect(r.ok && Array.from(r.valor.legenda ?? "").length).toBeLessThanOrEqual(2200);
    expect(lerPedidoImagem({ pauta: "dicas", legenda: 5 }).ok).toBe(false);
  });
});

describe("aplicarEdicoes", () => {
  it("troca título e texto, com teto de tamanho e sem quebra de linha no título", () => {
    const editada = aplicarEdicoes(dicas, [{ titulo: `Novo\ntítulo ${"x".repeat(300)}`, texto: "y".repeat(900) }]);
    expect(editada.slides[0].titulo).not.toContain("\n");
    expect(Array.from(editada.slides[0].titulo).length).toBeLessThanOrEqual(LIMITES_EDICAO.titulo);
    expect(Array.from(editada.slides[0].texto).length).toBeLessThanOrEqual(LIMITES_EDICAO.texto);
    // o que não foi editado fica como estava
    expect(editada.slides[1]).toEqual(dicas.slides[1]);
  });

  it("edição vazia mantém o texto gerado (nunca deixa um slide sem título)", () => {
    const editada = aplicarEdicoes(dicas, [{ titulo: "   ", texto: "" }]);
    expect(editada.slides[0].titulo).toBe(dicas.slides[0].titulo);
    expect(editada.slides[0].texto).toBe(dicas.slides[0].texto);
  });

  it("não aumenta o número de slides, mesmo com edições demais", () => {
    const muitas = Array.from({ length: 15 }, () => ({ titulo: "a", texto: "b" }));
    expect(aplicarEdicoes(dicas, muitas).slides).toHaveLength(dicas.slides.length);
  });

  it("sem edições, devolve a própria pauta", () => {
    expect(aplicarEdicoes(dicas, null)).toBe(dicas);
  });
});

describe("rascunho: campos entre colchetes bloqueiam o download", () => {
  it("lista os slides pendentes", () => {
    expect(slidesPendentes(bastidores, null)).toEqual([2, 3, 4]);
    expect(slidesPendentes(bastidores, 1)).toEqual([]);
    expect(slidesPendentes(bastidores, 2)).toEqual([2]);
    expect(slidesPendentes(dicas, null)).toEqual([]);
  });

  it("recusa baixar o slide pendente (422) e libera depois de preenchido", () => {
    const bloqueado = prepararPauta(pacote, pedido({ pautaId: "bastidores", slide: 2 }));
    expect(bloqueado.ok === false && bloqueado.status).toBe(422);
    expect(bloqueado.ok === false && bloqueado.erro).toMatch(/colchetes/);

    const edicoes = bastidores.slides.map((s) => ({ titulo: s.titulo.replace(/\[|\]/g, ""), texto: s.texto.replace(/\[|\]/g, "") }));
    const liberado = prepararPauta(pacote, pedido({ pautaId: "bastidores", slide: null, edicoes }));
    expect(liberado.ok).toBe(true);
  });

  it("o ZIP (todos os slides) também é bloqueado enquanto houver pendência", () => {
    const r = prepararPauta(pacote, pedido({ pautaId: "bastidores", slide: null }));
    expect(r.ok).toBe(false);
  });

  it("colchete digitado pelo usuário no meio de uma frase também conta como pendência", () => {
    const r = prepararPauta(pacote, pedido({ edicoes: [{ titulo: "Meu [título]", texto: "ok" }] }));
    expect(r.ok === false && r.status).toBe(422);
  });
});

describe("prepararPauta", () => {
  it("404 para pauta que não existe no nível do funcionário", () => {
    const n1 = gerarCarrosseis(ctx({ nivel: 1 }));
    const r = prepararPauta(n1, pedido({ pautaId: "bastidores" }));
    expect(r.ok === false && r.status).toBe(404);
  });

  it("404 para slide além do último", () => {
    const r = prepararPauta(pacote, pedido({ slide: dicas.slides.length + 1 }));
    expect(r.ok === false && r.status).toBe(404);
  });
});
