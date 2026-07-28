import { afterEach, describe, expect, it } from "vitest";
import {
  nomeCanal,
  presentesDe,
  supabaseConfigurado,
  type EstadoPresenca,
  type VisitantePresente,
} from "./canalUtil";

function visitante(tenantId: string, entrouEm = "2026-01-01T00:00:00.000Z"): VisitantePresente {
  return { tenantId, nome: `Negócio ${tenantId}`, entrouEm };
}

const urlOriginal = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (urlOriginal === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = urlOriginal;
  }
});

describe("canalUtil — nome do canal (GH-MULTI-02)", () => {
  it("escopa o canal por sala, com prefixo", () => {
    expect(nomeCanal("abc123")).toBe("sede:abc123");
  });

  it("tenants diferentes nunca colidem no mesmo canal", () => {
    expect(nomeCanal("t1")).not.toBe(nomeCanal("t2"));
  });
});

describe("canalUtil — detecção de Supabase configurado (GH-MULTI-02)", () => {
  it("false sem NEXT_PUBLIC_SUPABASE_URL (modo GAMEHUB_DB=file)", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(supabaseConfigurado()).toBe(false);
  });

  it("true quando a env var existe", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    expect(supabaseConfigurado()).toBe(true);
  });
});

describe("canalUtil — presentesDe (GH-MULTI-02)", () => {
  it("estado vazio devolve lista vazia", () => {
    expect(presentesDe({})).toEqual([]);
  });

  it("achata múltiplas chaves de presença numa lista só", () => {
    const estado: EstadoPresenca = { k1: [visitante("t1")], k2: [visitante("t2")] };
    expect(presentesDe(estado).map((v) => v.tenantId)).toEqual(["t1", "t2"]);
  });

  it("deduplica o mesmo tenant presente em duas chaves (duas abas = uma pessoa)", () => {
    const estado: EstadoPresenca = { k1: [visitante("t1")], k2: [visitante("t1")] };
    expect(presentesDe(estado)).toHaveLength(1);
  });

  it("ordena por tenantId — renderização determinística, avatares não piscam", () => {
    const estado: EstadoPresenca = { k1: [visitante("t9")], k2: [visitante("t2")], k3: [visitante("t5")] };
    expect(presentesDe(estado).map((v) => v.tenantId)).toEqual(["t2", "t5", "t9"]);
  });

  it("preserva o payload inteiro do visitante, não só o id", () => {
    const estado: EstadoPresenca = { k1: [visitante("t1", "2026-03-04T05:06:07.000Z")] };
    expect(presentesDe(estado)[0]).toEqual({
      tenantId: "t1",
      nome: "Negócio t1",
      entrouEm: "2026-03-04T05:06:07.000Z",
    });
  });
});
