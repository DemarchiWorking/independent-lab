import { describe, expect, it } from "vitest";
import { alocacoesAtivasEm, disponibilidadeDe } from "./disponibilidade";
import type { Alocacao } from "./db/types";

const AGORA = "2026-06-15T12:00:00.000Z";

function alocacao(over: Partial<Alocacao> = {}): Alocacao {
  return {
    funcionarioId: "f1",
    tenantId: "t1",
    jobId: "excel-sql",
    alocadoEm: "2026-06-10T12:00:00.000Z",
    expiraEm: "2026-06-20T12:00:00.000Z",
    ...over,
  };
}

describe("disponibilidade — alocacoesAtivasEm (relógio lazy)", () => {
  it("alocação com prazo no futuro está ativa", () => {
    expect(alocacoesAtivasEm([alocacao({ expiraEm: "2026-06-20T12:00:00.000Z" })], AGORA)).toHaveLength(1);
  });

  it("alocação com prazo no passado não está mais ativa (liberou sozinha)", () => {
    expect(alocacoesAtivasEm([alocacao({ expiraEm: "2026-06-01T12:00:00.000Z" })], AGORA)).toHaveLength(0);
  });

  // Regressão de borda: expirar EXATAMENTE agora conta como livre, não como
  // "último segundo ocupado" — janela fechada, `>` e não `>=`.
  it("expira exatamente agora conta como livre", () => {
    expect(alocacoesAtivasEm([alocacao({ expiraEm: AGORA })], AGORA)).toHaveLength(0);
  });

  it("filtra corretamente entre várias alocações", () => {
    const todas = [
      alocacao({ funcionarioId: "f1", expiraEm: "2026-07-01T00:00:00.000Z" }), // ativa
      alocacao({ funcionarioId: "f2", expiraEm: "2026-01-01T00:00:00.000Z" }), // expirada
      alocacao({ funcionarioId: "f3", expiraEm: "2026-06-16T00:00:00.000Z" }), // ativa
    ];
    expect(alocacoesAtivasEm(todas, AGORA).map((a) => a.funcionarioId)).toEqual(["f1", "f3"]);
  });
});

describe("disponibilidade — disponibilidadeDe", () => {
  it("funcionário sem alocação ativa está livre", () => {
    expect(disponibilidadeDe([], "f1")).toEqual({ estado: "livre" });
  });

  it("funcionário com alocação ativa está alocado, com jobId e expiraEm", () => {
    const a = alocacao({ funcionarioId: "f1", jobId: "aws", expiraEm: "2026-07-01T00:00:00.000Z" });
    expect(disponibilidadeDe([a], "f1")).toEqual({
      estado: "alocado",
      jobId: "aws",
      expiraEm: "2026-07-01T00:00:00.000Z",
    });
  });

  it("alocação de OUTRO funcionário não afeta este", () => {
    expect(disponibilidadeDe([alocacao({ funcionarioId: "f2" })], "f1")).toEqual({
      estado: "livre",
    });
  });
});
