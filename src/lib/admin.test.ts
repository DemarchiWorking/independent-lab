import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { souAdmin } from "./admin";

describe("souAdmin", () => {
  const original = process.env.GAMEHUB_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.GAMEHUB_ADMIN_EMAILS = "founder@labdatadev.com, socio@labdatadev.com";
  });

  afterEach(() => {
    process.env.GAMEHUB_ADMIN_EMAILS = original;
  });

  it("aceita e-mail exato da lista", () => {
    expect(souAdmin("founder@labdatadev.com")).toBe(true);
  });

  it("ignora maiúsculas/minúsculas e espaços", () => {
    expect(souAdmin("  Founder@LabDataDev.com  ")).toBe(true);
  });

  it("rejeita e-mail fora da lista", () => {
    expect(souAdmin("jogador@qualquer.com")).toBe(false);
  });

  it("sem variável de ambiente configurada, ninguém é admin", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(souAdmin("founder@labdatadev.com")).toBe(false);
  });

  it("e-mail contendo 'demarchi' fora da allowlist NÃO é admin", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(souAdmin("antonio.demarchi@gmail.com")).toBe(false);
    expect(souAdmin("x@demarchi.io")).toBe(false);
  });

  it("parte de um e-mail da lista não basta: a comparação é exata", () => {
    expect(souAdmin("founder@labdatadev.com.br")).toBe(false);
    expect(souAdmin("founder@labdatadev")).toBe(false);
  });

  it("string vazia nunca é admin, mesmo com allowlist vazia por acaso combinar", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(souAdmin("")).toBe(false);
    expect(souAdmin("   ")).toBe(false);
  });
});
