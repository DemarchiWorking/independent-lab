import { describe, expect, it } from "vitest";
import { jaAceitouTrabalho } from "./guarda";
import type { TrabalhoAceito } from "@/lib/db/types";

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
