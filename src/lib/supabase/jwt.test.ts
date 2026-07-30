import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assinarJwtRealtime, realtimeConfigurado } from "./jwt";

function base64urlDecode(parte: string): unknown {
  return JSON.parse(Buffer.from(parte, "base64url").toString("utf8"));
}

/** Recomputa a assinatura do jeito que GoTrue/PostgREST/Realtime fariam,
 *  pra provar que `assinarJwtRealtime` produz um HS256 de verdade — não só
 *  uma string com cara de JWT. */
function assinaturaEsperada(header: string, corpo: string, segredo: string): string {
  return createHmac("sha256", segredo)
    .update(`${header}.${corpo}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

describe("assinarJwtRealtime", () => {
  const original = process.env.SUPABASE_JWT_SECRET;
  const SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres";
  const AGORA_MS = Date.parse("2026-08-01T12:00:00.000Z");

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SEGREDO;
  });

  afterEach(() => {
    process.env.SUPABASE_JWT_SECRET = original;
  });

  it("produz um JWT de 3 partes em base64url", () => {
    const token = assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS);
    expect(token.split(".")).toHaveLength(3);
  });

  it("o header é sempre HS256/JWT — o que GoTrue/PostgREST/Realtime esperam", () => {
    const [header] = assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS).split(".");
    expect(base64urlDecode(header)).toEqual({ alg: "HS256", typ: "JWT" });
  });

  it("o payload carrega sub/tenant_id/role/aud corretos", () => {
    const [, corpo] = assinarJwtRealtime({ sub: "u1", tenant_id: "t42" }, AGORA_MS).split(".");
    const payload = base64urlDecode(corpo) as Record<string, unknown>;
    expect(payload.sub).toBe("u1");
    expect(payload.tenant_id).toBe("t42");
    expect(payload.role).toBe("authenticated");
    expect(payload.aud).toBe("authenticated");
  });

  it("expira 600s (10 min) depois de `agoraMs` — token de visita, não de sessão", () => {
    const [, corpo] = assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS).split(".");
    const payload = base64urlDecode(corpo) as { iat: number; exp: number };
    expect(payload.iat).toBe(Math.floor(AGORA_MS / 1000));
    expect(payload.exp - payload.iat).toBe(600);
  });

  it("a assinatura bate com HMAC-SHA256 do próprio segredo — verificável por fora", () => {
    const [header, corpo, assinatura] = assinarJwtRealtime(
      { sub: "u1", tenant_id: "t1" },
      AGORA_MS,
    ).split(".");
    expect(assinatura).toBe(assinaturaEsperada(header, corpo, SEGREDO));
  });

  it("é determinística: mesma entrada e mesmo relógio, mesmo token", () => {
    const a = assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS);
    const b = assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS);
    expect(a).toBe(b);
  });

  it("segredos diferentes produzem assinaturas diferentes (não cola sem o segredo certo)", () => {
    process.env.SUPABASE_JWT_SECRET = "outro-segredo-completamente-diferente-32ch";
    const [, , assinaturaComOutroSegredo] = assinarJwtRealtime(
      { sub: "u1", tenant_id: "t1" },
      AGORA_MS,
    ).split(".");

    process.env.SUPABASE_JWT_SECRET = SEGREDO;
    const [, , assinaturaOriginal] = assinarJwtRealtime(
      { sub: "u1", tenant_id: "t1" },
      AGORA_MS,
    ).split(".");

    expect(assinaturaComOutroSegredo).not.toBe(assinaturaOriginal);
  });

  it("sem SUPABASE_JWT_SECRET, lança (nunca assina com segredo vazio)", () => {
    delete process.env.SUPABASE_JWT_SECRET;
    expect(() => assinarJwtRealtime({ sub: "u1", tenant_id: "t1" }, AGORA_MS)).toThrow();
  });
});

describe("realtimeConfigurado", () => {
  const original = process.env.SUPABASE_JWT_SECRET;
  afterEach(() => {
    process.env.SUPABASE_JWT_SECRET = original;
  });

  it("true quando SUPABASE_JWT_SECRET existe", () => {
    process.env.SUPABASE_JWT_SECRET = "qualquer-coisa";
    expect(realtimeConfigurado()).toBe(true);
  });

  it("false quando ausente — é o sinal que /api/realtime-token usa pra devolver 501", () => {
    delete process.env.SUPABASE_JWT_SECRET;
    expect(realtimeConfigurado()).toBe(false);
  });
});
