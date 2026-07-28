import { describe, expect, it } from "vitest";
import { gerarTokenConvite, lerTokenConvite } from "./convite";

describe("convite — token assinado (GH-GROW-02)", () => {
  it("round-trip: gera e lê de volta os mesmos dados", () => {
    const token = gerarTokenConvite({
      tenantId: "t1",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: new Date().toISOString(),
    });
    const lido = lerTokenConvite(token);
    expect(lido).toEqual({
      tenantId: "t1",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: expect.any(String),
    });
  });

  it("token adulterado (payload alterado) é rejeitado", () => {
    const token = gerarTokenConvite({
      tenantId: "t1",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: new Date().toISOString(),
    });
    const [, assinatura] = token.split(".");
    const payloadFalso = Buffer.from(
      JSON.stringify({ tenantId: "t2", cidadeNome: "Mendes", bairroNome: "Centro", criadoEm: new Date().toISOString() }),
    ).toString("base64url");
    expect(lerTokenConvite(`${payloadFalso}.${assinatura}`)).toBeNull();
  });

  it("token expirado (mais de 30 dias) é rejeitado", () => {
    const antigo = new Date(Date.now() - 31 * 24 * 60 * 60_000).toISOString();
    const token = gerarTokenConvite({
      tenantId: "t1",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: antigo,
    });
    expect(lerTokenConvite(token)).toBeNull();
  });

  it("token dentro da validade (29 dias) ainda é aceito", () => {
    const recente = new Date(Date.now() - 29 * 24 * 60 * 60_000).toISOString();
    const token = gerarTokenConvite({
      tenantId: "t1",
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: recente,
    });
    expect(lerTokenConvite(token)).not.toBeNull();
  });

  it("string malformada (sem separador) é rejeitada, nunca lança", () => {
    expect(lerTokenConvite("nao-e-um-token-valido")).toBeNull();
  });
});
