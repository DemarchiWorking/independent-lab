import { describe, expect, it } from "vitest";
import { gerarTokenConvite, lerTokenConvite } from "@/features/growth/convite";
import { abrir, selar } from "./assinatura";
import { abrirSessao, selarSessao } from "./sessao";

const sessao = {
  usuarioId: "u1",
  tenantId: "a1b2c3d4e5f6a1b2c3d4e5f6",
  nome: "Maria",
  email: "maria@exemplo.com",
};

describe("sessão assinada", () => {
  it("round-trip devolve os mesmos campos", () => {
    expect(abrirSessao(selarSessao(sessao))).toEqual(sessao);
  });

  it("link de convite usado como cookie de sessão é recusado", () => {
    const convite = gerarTokenConvite({
      tenantId: sessao.tenantId,
      cidadeNome: "Mendes",
      bairroNome: "Centro",
      criadoEm: new Date().toISOString(),
    });
    expect(abrirSessao(convite)).toBeNull();
  });

  it("cookie de sessão usado como convite é recusado", () => {
    expect(lerTokenConvite(selarSessao(sessao))).toBeNull();
  });

  it("sessão expirada é recusada", () => {
    const oitoDiasAtras = Date.now() - 8 * 24 * 60 * 60_000;
    expect(abrirSessao(selarSessao(sessao, oitoDiasAtras))).toBeNull();
  });

  it("payload trocado com a assinatura antiga é recusado", () => {
    const [, mac] = selarSessao(sessao).split(".");
    const outro = Buffer.from(JSON.stringify({ typ: "sessao", ...sessao, tenantId: "outro" })).toString("base64url");
    expect(abrirSessao(`${outro}.${mac}`)).toBeNull();
  });

  it("payload assinado sem os campos obrigatórios é recusado", () => {
    const semTenant = selar("sessao", { typ: "sessao", usuarioId: "u1", email: "x@y.z", nome: "", exp: Date.now() + 60_000 });
    expect(abrirSessao(semTenant)).toBeNull();
  });

  it("token gigante ou malformado é recusado sem quebrar", () => {
    expect(abrirSessao("a".repeat(10_000))).toBeNull();
    expect(abrirSessao("a.b.c")).toBeNull();
    expect(abrir("sessao", "")).toBeNull();
  });

  it("sem segredo configurado, assinar falha alto", () => {
    const anterior = process.env.GAMEHUB_SECRET;
    process.env.GAMEHUB_SECRET = "curto";
    try {
      expect(() => selarSessao(sessao)).toThrow(/GAMEHUB_SECRET/);
    } finally {
      process.env.GAMEHUB_SECRET = anterior;
    }
  });
});
