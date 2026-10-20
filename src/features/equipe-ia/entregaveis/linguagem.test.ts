import { describe, expect, it } from "vitest";
import {
  capitalizar,
  contar,
  dataPt,
  fecharFrase,
  hashtag,
  listaPt,
  minusculaInicial,
  nomeDeArquivo,
  nomeParaTexto,
  semAcento,
  semPontoFinal,
  somarDias,
  textoLivre,
  truncar,
  umaLinha,
} from "./linguagem";

describe("linguagem", () => {
  it("capitaliza e descapitaliza só a primeira letra", () => {
    expect(capitalizar("agenda cheia")).toBe("Agenda cheia");
    expect(capitalizar("ÁGUA")).toBe("ÁGUA");
    expect(minusculaInicial("Responder em 5 minutos")).toBe("responder em 5 minutos");
    expect(capitalizar("")).toBe("");
  });

  it("hashtag sem acento, espaço, hífen ou símbolo", () => {
    expect(hashtag("Barra do Piraí")).toBe("#barradopirai");
    expect(hashtag("São João del-Rei")).toBe("#saojoaodelrei");
    expect(hashtag("  ")).toBe("");
    expect(hashtag("???")).toBe("");
  });

  it("junta em português", () => {
    expect(listaPt([])).toBe("");
    expect(listaPt(["a"])).toBe("a");
    expect(listaPt(["a", "b"])).toBe("a e b");
    expect(listaPt(["a", "b", "c"])).toBe("a, b e c");
    expect(listaPt(["a", "", "c"])).toBe("a e c");
  });

  it("contar usa singular e plural", () => {
    expect(contar(1, "cena", "cenas")).toBe("1 cena");
    expect(contar(3, "cena", "cenas")).toBe("3 cenas");
  });

  it("trunca sem quebrar palavra e com reticências", () => {
    expect(truncar("curto", 20)).toBe("curto");
    const t = truncar("uma frase bem comprida para cortar no limite", 20);
    expect(Array.from(t).length).toBeLessThanOrEqual(20);
    expect(t.endsWith("…")).toBe(true);
    expect(t).not.toMatch(/\s…$/);
    expect(t).toBe("uma frase bem…");
  });

  it("trunca por pontos de código, não por unidades UTF-16", () => {
    const t = truncar("😀".repeat(10), 5);
    expect(Array.from(t)).toHaveLength(5);
  });

  it("limpa texto livre: controle, espaços, linhas em excesso e tamanho", () => {
    expect(textoLivre("  oi\u0000\u0007  tudo   bem \n\n\n\n fim ", 100)).toBe("oi tudo bem\n\nfim");
    expect(Array.from(textoLivre("a".repeat(500), 50))).toHaveLength(50);
    expect(umaLinha("a\n b\t c")).toBe("a b c");
  });

  it("fecha frase sem duplicar pontuação", () => {
    expect(fecharFrase("Olá")).toBe("Olá.");
    expect(fecharFrase("Olá!")).toBe("Olá!");
    expect(fecharFrase("Olá?")).toBe("Olá?");
    expect(fecharFrase("")).toBe("");
  });

  it("tira só o ponto final", () => {
    expect(semPontoFinal("Frase.")).toBe("Frase");
    expect(semPontoFinal("Frase?")).toBe("Frase?");
    expect(semPontoFinal("a.b")).toBe("a.b");
  });

  it("nome do negócio entra em uma linha e com teto", () => {
    expect(nomeParaTexto("Café\nCia")).toBe("Café Cia");
    expect(Array.from(nomeParaTexto("A".repeat(200)))).toHaveLength(80);
  });

  it("datas em pt-BR, no fuso de São Paulo, e soma de dias", () => {
    expect(dataPt("2026-10-19T15:00:00.000Z")).toBe("19/10/2026");
    expect(dataPt("2026-10-19T01:00:00.000Z")).toBe("18/10/2026");
    expect(dataPt("lixo")).toBe("");
    expect(somarDias("2026-10-19T15:00:00.000Z", 90)).toBe("2027-01-17T15:00:00.000Z");
  });

  it("nome de arquivo é ASCII seguro", () => {
    expect(nomeDeArquivo("Açaí do Léo — Delivery!")).toBe("acai-do-leo-delivery");
    expect(nomeDeArquivo("../../etc/passwd")).toBe("etc-passwd");
    expect(nomeDeArquivo("???")).toBe("negocio");
    expect(nomeDeArquivo("A".repeat(300)).length).toBeLessThanOrEqual(60);
    expect(nomeDeArquivo("Zé \"da\" Esquina")).toMatch(/^[a-z0-9-]+$/);
  });

  it("remove acentos", () => {
    expect(semAcento("Piraí ç ã")).toBe("Pirai c a");
  });
});

describe("minusculaInicial: o que não pode perder a maiúscula", () => {
  it("valor em reais e sigla ficam como estão; frase comum perde só a primeira letra", () => {
    expect(minusculaInicial("R$ 500 a R$ 1.500 por mês")).toBe("R$ 500 a R$ 1.500 por mês");
    expect(minusculaInicial("CNPJ ou MEI ativo")).toBe("CNPJ ou MEI ativo");
    expect(minusculaInicial("Responder em até 5 minutos")).toBe("responder em até 5 minutos");
  });
});
