import { describe, expect, it } from "vitest";
import { contribuicaoDaEquipe } from "./contribuicao";
import { CONTRIBUICAO_ATRIBUTO_ALOCACAO } from "@/features/equipe-ia/catalogo";
import type { FuncionarioContratado } from "@/lib/db/types";

function funcionario(cargoId: string, id = cargoId): FuncionarioContratado {
  return {
    id,
    tenantId: "t1",
    cargoId,
    contratadoEm: "2026-01-01T00:00:00.000Z",
    disponibilidade: { estado: "livre" },
  };
}

describe("marketplace — contribuição de atributo da equipe (GH-EQP-02)", () => {
  it("lista vazia: nenhuma contribuição", () => {
    expect(contribuicaoDaEquipe([])).toEqual({});
  });

  it("um funcionário contribui só no eixo do próprio cargo", () => {
    // documentador fortalece "processo"
    expect(contribuicaoDaEquipe([funcionario("documentador")])).toEqual({
      processo: CONTRIBUICAO_ATRIBUTO_ALOCACAO,
    });
  });

  it("dois funcionários no MESMO eixo somam", () => {
    // social-media e editor-video fortalecem "presenca"
    const soma = contribuicaoDaEquipe([
      funcionario("social-media"),
      funcionario("editor-video", "f2"),
    ]);
    expect(soma).toEqual({ presenca: CONTRIBUICAO_ATRIBUTO_ALOCACAO * 2 });
  });

  it("funcionários em eixos diferentes não se misturam", () => {
    const soma = contribuicaoDaEquipe([
      funcionario("documentador"),
      funcionario("comercial", "f2"),
    ]);
    expect(soma).toEqual({
      processo: CONTRIBUICAO_ATRIBUTO_ALOCACAO,
      aquisicao: CONTRIBUICAO_ATRIBUTO_ALOCACAO,
    });
  });

  it("cargoId desconhecido é ignorado (nunca lança)", () => {
    expect(contribuicaoDaEquipe([funcionario("cargo-inexistente")])).toEqual({});
  });
});
