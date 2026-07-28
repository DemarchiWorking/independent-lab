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
});
