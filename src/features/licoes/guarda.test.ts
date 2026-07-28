import { describe, expect, it } from "vitest";
import { jaConcluiuLicao } from "./guarda";
import { CATALOGO_LICOES, licaoDoDegrau, licaoPorId } from "./catalogo";
import type { LicaoConcluida } from "@/lib/db/types";

function licaoConcluida(licaoId: string): LicaoConcluida {
  return { id: "x", tenantId: "t1", licaoId, concluidaEm: "2026-01-01T00:00:00.000Z" };
}

describe("licoes — guarda anti-farm (GH-EDU-01)", () => {
  it("nenhuma lição concluída ainda: nada foi concluído", () => {
    expect(jaConcluiuLicao([], "por-que-diagnostico")).toBe(false);
  });

  it("lição já na lista: detecta re-conclusão", () => {
    expect(jaConcluiuLicao([licaoConcluida("por-que-diagnostico")], "por-que-diagnostico")).toBe(true);
  });

  it("concluir uma lição diferente não é bloqueado pela primeira", () => {
    expect(jaConcluiuLicao([licaoConcluida("por-que-diagnostico")], "por-que-medir-antes-de-investir")).toBe(false);
  });
});

describe("licoes — catálogo (GH-EDU-01)", () => {
  it("existe exatamente 1 lição por degrau, 1 a 5", () => {
    for (let degrau = 1; degrau <= 5; degrau++) {
      const licoes = CATALOGO_LICOES.filter((l) => l.degrau === degrau);
      expect(licoes).toHaveLength(1);
    }
  });

  it("licaoDoDegrau encontra a lição certa", () => {
    const licao = licaoDoDegrau(1);
    expect(licao?.id).toBe("por-que-diagnostico");
  });

  it("licaoPorId encontra por id e retorna undefined para id inválido", () => {
    expect(licaoPorId("por-que-diagnostico")).toBeDefined();
    expect(licaoPorId("id-que-nao-existe")).toBeUndefined();
  });

  it("todo conteúdo é uma string não-vazia (sem lição fantasma)", () => {
    for (const licao of CATALOGO_LICOES) {
      expect(licao.conteudo.length).toBeGreaterThan(50);
    }
  });
});
