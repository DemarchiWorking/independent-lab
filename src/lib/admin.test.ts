import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cadastroBloqueado, emailAdminIA, emailReservado, souAdmin, souAdminIA } from "./admin";

describe("admin da IA", () => {
  it("o padrão é admin@admin.com, sem diferenciar maiúsculas e espaços", () => {
    expect(emailAdminIA({})).toBe("admin@admin.com");
    expect(souAdminIA("  Admin@Admin.com ", {})).toBe(true);
  });

  it("só esse e-mail: a allowlist geral de admins NÃO muda a configuração da IA", () => {
    const env = { GAMEHUB_ADMIN_EMAILS: "founder@labdatadev.com" };
    expect(souAdminIA("founder@labdatadev.com", env)).toBe(false);
    expect(souAdminIA("admin@gmail.com", env)).toBe(false);
    expect(souAdminIA("admin@admin.com.br", env)).toBe(false);
    expect(souAdminIA("", env)).toBe(false);
  });

  it("o operador pode trocar o e-mail por variável de ambiente", () => {
    expect(souAdminIA("dono@exemplo.com", { GAMEHUB_IA_ADMIN_EMAIL: "Dono@Exemplo.com" })).toBe(true);
    expect(souAdminIA("admin@admin.com", { GAMEHUB_IA_ADMIN_EMAIL: "dono@exemplo.com" })).toBe(false);
  });
});

describe("cadastro de e-mail reservado", () => {
  const prod = { NODE_ENV: "production" };

  it("em produção, ninguém cria admin@admin.com nem um e-mail da allowlist pelo formulário", () => {
    expect(cadastroBloqueado("admin@admin.com", prod)).toBe(true);
    expect(cadastroBloqueado("ADMIN@admin.com", prod)).toBe(true);
    const comLista = { ...prod, GAMEHUB_ADMIN_EMAILS: "founder@labdatadev.com" };
    expect(cadastroBloqueado("founder@labdatadev.com", comLista)).toBe(true);
    expect(emailReservado("founder@labdatadev.com", comLista)).toBe(true);
  });

  it("e-mail comum cadastra normalmente", () => {
    expect(cadastroBloqueado("dona.maria@padaria.com.br", prod)).toBe(false);
    expect(cadastroBloqueado("admin2@admin.com", prod)).toBe(false);
  });

  it("o operador libera por um instante para criar a própria conta", () => {
    expect(cadastroBloqueado("admin@admin.com", { ...prod, GAMEHUB_LIBERAR_CADASTRO_ADMIN: "1" })).toBe(false);
  });

  it("em desenvolvimento nada é bloqueado", () => {
    expect(cadastroBloqueado("admin@admin.com", { NODE_ENV: "development" })).toBe(false);
    expect(cadastroBloqueado("admin@admin.com", {})).toBe(false);
  });
});

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
