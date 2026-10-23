import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emailAdminBootstrapLocal } from "./admin";

describe("emailAdminBootstrapLocal", () => {
  const original = process.env.GAMEHUB_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.GAMEHUB_ADMIN_EMAILS = "founder@labdatadev.com, socio@labdatadev.com";
  });

  afterEach(() => {
    process.env.GAMEHUB_ADMIN_EMAILS = original;
  });

  it("aceita e-mail exato da lista", () => {
    expect(emailAdminBootstrapLocal("founder@labdatadev.com")).toBe(true);
  });

  it("ignora maiúsculas/minúsculas e espaços", () => {
    expect(emailAdminBootstrapLocal("  Founder@LabDataDev.com  ")).toBe(true);
  });

  it("rejeita e-mail fora da lista", () => {
    expect(emailAdminBootstrapLocal("jogador@qualquer.com")).toBe(false);
  });

  it("sem variável de ambiente configurada, ninguém é admin", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(emailAdminBootstrapLocal("founder@labdatadev.com")).toBe(false);
  });

  it("atalho pessoal: e-mail contendo 'demarchi' é admin mesmo fora da allowlist", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(emailAdminBootstrapLocal("antonio.demarchi@gmail.com")).toBe(true);
    expect(emailAdminBootstrapLocal("Demarchi@LabDataDev.com")).toBe(true);
  });

  it("atalho pessoal é comparação por substring, não só e-mail exato", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(emailAdminBootstrapLocal("qualquercoisa.demarchi.qualquercoisa@dominio.com")).toBe(
      true,
    );
  });

  it("string vazia nunca é admin, mesmo com allowlist vazia por acaso combinar", () => {
    process.env.GAMEHUB_ADMIN_EMAILS = "";
    expect(emailAdminBootstrapLocal("")).toBe(false);
    expect(emailAdminBootstrapLocal("   ")).toBe(false);
  });
});
