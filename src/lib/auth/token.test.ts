import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Sessao } from "@/lib/db/types";
import { assinarToken, verificarToken } from "./token";

const SEGREDO = "segredo-de-teste-com-mais-de-16-chars";
const SESSAO: Sessao = {
  usuarioId: "u1",
  tenantId: "t1",
  nome: "Maria",
  email: "maria@exemplo.test",
};
const AGORA = Date.parse("2026-07-29T12:00:00.000Z");
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

describe("token — assinatura e validade (GH-OPS M-6)", () => {
  it("um token recém-assinado é válido no mesmo instante", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    expect(verificarToken(token, SEGREDO, AGORA)).toEqual(SESSAO);
  });

  it("continua válido um instante antes de vencer", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    expect(verificarToken(token, SEGREDO, AGORA + SETE_DIAS_MS - 1)).toEqual(SESSAO);
  });

  it("expira exatamente no instante do prazo (limite é exclusivo)", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    expect(verificarToken(token, SEGREDO, AGORA + SETE_DIAS_MS)).toBeNull();
  });

  it("um token capturado e reenviado DEPOIS do prazo é rejeitado — o cerne do M-6", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    // simula alguém reproduzindo o cookie fora do navegador, dias depois:
    // antes do M-6 isto passava, porque nada no payload assinado carregava
    // prazo — só o `maxAge` do cookie, que o browser podia simplesmente não
    // respeitar num replay manual.
    const doisDiasDepoisDoPrazo = AGORA + SETE_DIAS_MS + 2 * 24 * 60 * 60 * 1000;
    expect(verificarToken(token, SEGREDO, doisDiasDepoisDoPrazo)).toBeNull();
  });

  it("assinatura errada é rejeitada", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    const [payload] = token.split(".");
    const adulterado = `${payload}.${"0".repeat(64)}`;
    expect(verificarToken(adulterado, SEGREDO, AGORA)).toBeNull();
  });

  it("segredo diferente do usado para assinar é rejeitado", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    expect(verificarToken(token, "outro-segredo-completamente-diferente", AGORA)).toBeNull();
  });

  it("payload adulterado (troca de tenantId) invalida a assinatura", () => {
    const token = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    const [payload, assinatura] = token.split(".");
    const decodificado = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decodificado.sessao.tenantId = "t2-invadido";
    const payloadAdulterado = Buffer.from(JSON.stringify(decodificado)).toString(
      "base64url",
    );
    expect(verificarToken(`${payloadAdulterado}.${assinatura}`, SEGREDO, AGORA)).toBeNull();
  });

  it("token vazio, sem ponto, ou só com payload é rejeitado sem lançar", () => {
    expect(verificarToken("", SEGREDO, AGORA)).toBeNull();
    expect(verificarToken("sem-ponto-nenhum", SEGREDO, AGORA)).toBeNull();
    expect(verificarToken("payload.", SEGREDO, AGORA)).toBeNull();
    expect(verificarToken(".assinatura", SEGREDO, AGORA)).toBeNull();
  });

  it("payload que não decodifica para JSON válido é rejeitado sem lançar", () => {
    const payload = Buffer.from("isto não é json").toString("base64url");
    const assinatura = createHmac("sha256", SEGREDO).update(payload).digest("hex");
    expect(verificarToken(`${payload}.${assinatura}`, SEGREDO, AGORA)).toBeNull();
  });

  it("é determinístico: mesma entrada, mesmo token", () => {
    const a = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    const b = assinarToken(SESSAO, SEGREDO, AGORA, SETE_DIAS_MS);
    expect(a).toBe(b);
  });
});
