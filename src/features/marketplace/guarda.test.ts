import { describe, expect, it } from "vitest";
import { jaAceitouTrabalho } from "./guarda";
import { jobs } from "./data";
import type { TrabalhoAceito } from "@/lib/db/types";
import { atributosFaltantes, TETO_ATRIBUTO, type Atributos } from "@/lib/atributos";

function trabalho(jobId: string): TrabalhoAceito {
  return { id: "x", tenantId: "t1", jobId, aceitoEm: "2026-01-01T00:00:00.000Z" };
}

describe("marketplace — guarda anti-farm (GH-FDN-01)", () => {
  it("negocio sem trabalhos aceitos: nada foi aceito ainda", () => {
    expect(jaAceitouTrabalho([], "excel-sql")).toBe(false);
  });

  it("job já na lista: detecta re-aceite", () => {
    expect(jaAceitouTrabalho([trabalho("excel-sql")], "excel-sql")).toBe(true);
  });

  it("aceitar um job diferente não é bloqueado pelo primeiro", () => {
    expect(jaAceitouTrabalho([trabalho("excel-sql")], "uxui")).toBe(false);
  });

  it("vários jobs aceitos: só o repetido é bloqueado", () => {
    const aceitos = [trabalho("excel-sql"), trabalho("aws")];
    expect(jaAceitouTrabalho(aceitos, "aws")).toBe(true);
    expect(jaAceitouTrabalho(aceitos, "n8n")).toBe(false);
  });
});

describe("marketplace — catálogo de requisitos (GH-ATR-03)", () => {
  it("todo job declara requisitos (objeto, mesmo que vazio)", () => {
    for (const job of jobs) {
      expect(job.requisitos).toBeTypeOf("object");
    }
  });

  it("nenhum mínimo excede TETO_ATRIBUTO", () => {
    for (const job of jobs) {
      for (const minimo of Object.values(job.requisitos)) {
        expect(minimo).toBeLessThanOrEqual(TETO_ATRIBUTO);
      }
    }
  });

  it("anti-softlock: com o pior perfil de atributos do onboarding, existe ao menos um job sem faltantes", () => {
    // espelha o piso mínimo de `calcular()` — ver scoring.test.ts (GH-ATR-03)
    const pior: Atributos = {
      tecnologia: { valor: 8, teto: 40 },
      processo: { valor: 6, teto: 40 },
      presenca: { valor: 2, teto: 40 },
      aquisicao: { valor: 6, teto: 40 },
      capacidade: { valor: 6, teto: 40 },
    };
    const algumSemFaltantes = jobs.some(
      (job) => atributosFaltantes(pior, job.requisitos).length === 0,
    );
    expect(algumSemFaltantes).toBe(true);
  });
});
