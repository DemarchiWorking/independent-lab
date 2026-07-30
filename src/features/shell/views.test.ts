import { describe, expect, it } from "vitest";
import { parametrosDeViewValidos, viewDeParam } from "./views";
import { opcoesPara } from "@/features/world/interacao/catalogo";
import { CARGOS_IA } from "@/features/equipe-ia/catalogo";
import { senioridadeDe } from "@/features/equipe-ia/senioridade";

describe("shell — deep-link `?ver=`", () => {
  it("aceita todas as abas da whitelist", () => {
    for (const p of parametrosDeViewValidos()) {
      expect(viewDeParam(p)).toBe(p);
    }
  });

  it("cai no hub quando o parâmetro está ausente", () => {
    expect(viewDeParam(undefined)).toBe("hub");
  });

  it("cai no hub para valor desconhecido — a URL é do usuário, não confiável", () => {
    expect(viewDeParam("nao-existe")).toBe("hub");
    expect(viewDeParam("")).toBe("hub");
    expect(viewDeParam("__proto__")).toBe("hub");
    expect(viewDeParam("constructor")).toBe("hub");
  });

  it("cai no hub quando o parâmetro vem repetido (`?ver=a&ver=b`)", () => {
    expect(viewDeParam(["marketplace", "sede"])).toBe("hub");
  });
});

describe("shell — os atalhos das conversas apontam para abas que existem", () => {
  it("todo href de conversa com `?ver=` resolve para a aba pretendida", () => {
    const interlocutores = CARGOS_IA.flatMap((cargo) => [
      {
        tipo: "ia-propria" as const,
        avatarId: `ia:${cargo.id}`,
        cargo,
        senioridade: senioridadeDe("2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"),
        disponibilidade: { estado: "livre" as const },
      },
      {
        tipo: "ia-visitada" as const,
        avatarId: `ia:${cargo.id}`,
        cargo,
        nomeAnfitriao: "Marcenaria do Vale",
      },
    ]);

    const hrefs = interlocutores
      .flatMap(opcoesPara)
      .map((o) => o.efeito)
      .filter((e) => e.tipo === "ir-para")
      .map((e) => e.href);

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const url = new URL(href, "https://exemplo.test");
      expect(url.pathname).toBe("/hub");

      const ver = url.searchParams.get("ver");
      expect(ver).not.toBeNull();
      // o teste que importa: o link não pode cair silenciosamente no hub
      expect(viewDeParam(ver ?? undefined)).toBe(ver);
    }
  });
});
