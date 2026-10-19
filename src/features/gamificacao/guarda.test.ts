import { describe, expect, it } from "vitest";
import { eventoDoCliente, marcoDaMissao } from "./guarda";

describe("guarda do dispatcher recompensar()", () => {
  it("aceita só os eventos com guarda", () => {
    expect(eventoDoCliente("funcionario_ia_contratado")).toBe(true);
    expect(eventoDoCliente("retro_90d")).toBe(true);
  });

  it("recusa eventos que pagavam em laço", () => {
    for (const evento of ["parceria_formada", "oferta_publicada", "servico_desbloqueado", "cadastro_completo"]) {
      expect(eventoDoCliente(evento)).toBe(false);
    }
    expect(eventoDoCliente("__proto__")).toBe(false);
    expect(eventoDoCliente(42)).toBe(false);
  });

  it("diagnóstico tem um marco só; retro tem um por trimestre", () => {
    expect(marcoDaMissao("diagnostico_agendado", "2026-01-10T00:00:00Z")).toBe("diagnostico_agendado");
    expect(marcoDaMissao("diagnostico_agendado", "2027-08-10T00:00:00Z")).toBe("diagnostico_agendado");
    expect(marcoDaMissao("retro_90d", "2026-02-10T00:00:00Z")).toBe("retro_90d:2026-T1");
    expect(marcoDaMissao("retro_90d", "2026-03-31T23:00:00Z")).toBe("retro_90d:2026-T1");
    expect(marcoDaMissao("retro_90d", "2026-10-19T12:00:00Z")).toBe("retro_90d:2026-T4");
  });
});
