import { describe, expect, it } from "vitest";
import type { SolicitacaoServico } from "@/lib/db/types";
import {
  estaAberta,
  normalizar,
  ordenarPorRecentes,
  proximoStatus,
  resumoAdmin,
} from "./motor";

function sol(over: Partial<SolicitacaoServico> = {}): SolicitacaoServico {
  return {
    id: "1",
    tenantId: "t1",
    tipo: "site",
    titulo: "Site",
    descricao: "…",
    status: "recebida",
    criadoEm: "2026-07-01T00:00:00.000Z",
    atualizadoEm: "2026-07-01T00:00:00.000Z",
    ...over,
  };
}

describe("normalizar", () => {
  it("mantém tipo/status válidos", () => {
    const v = normalizar(sol({ tipo: "automacao", status: "em_producao" }));
    expect(v.tipo).toBe("automacao");
    expect(v.status).toBe("em_producao");
  });

  it("cai em fallback seguro quando o dado é inválido (nunca quebra a tela)", () => {
    const v = normalizar(sol({ tipo: "xpto", status: "zzz" }));
    expect(v.tipo).toBe("funcionalidade");
    expect(v.status).toBe("recebida");
  });
});

describe("ordenarPorRecentes", () => {
  it("mais recente primeiro", () => {
    const a = normalizar(sol({ id: "a", criadoEm: "2026-07-01T00:00:00.000Z" }));
    const b = normalizar(sol({ id: "b", criadoEm: "2026-07-10T00:00:00.000Z" }));
    expect(ordenarPorRecentes([a, b]).map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("estaAberta", () => {
  it("aberta enquanto não é entregue nem recusada", () => {
    expect(estaAberta(normalizar(sol({ status: "recebida" })))).toBe(true);
    expect(estaAberta(normalizar(sol({ status: "em_producao" })))).toBe(true);
    expect(estaAberta(normalizar(sol({ status: "entregue" })))).toBe(false);
    expect(estaAberta(normalizar(sol({ status: "recusada" })))).toBe(false);
  });
});

describe("proximoStatus", () => {
  it("anda no funil e para em entregue", () => {
    expect(proximoStatus("recebida")).toBe("em_analise");
    expect(proximoStatus("em_analise")).toBe("em_producao");
    expect(proximoStatus("em_producao")).toBe("entregue");
    expect(proximoStatus("entregue")).toBeNull();
  });

  it("recusada é terminal", () => {
    expect(proximoStatus("recusada")).toBeNull();
  });
});

describe("resumoAdmin", () => {
  it("conta total, abertas, entregues e distribui por status/tipo", () => {
    const r = resumoAdmin([
      normalizar(sol({ tipo: "site", status: "recebida" })),
      normalizar(sol({ tipo: "app", status: "em_producao" })),
      normalizar(sol({ tipo: "automacao", status: "entregue" })),
      normalizar(sol({ tipo: "site", status: "recusada" })),
    ]);
    expect(r.total).toBe(4);
    expect(r.abertas).toBe(2);
    expect(r.entregues).toBe(1);
    expect(r.porStatus.recebida).toBe(1);
    expect(r.porStatus.entregue).toBe(1);
    expect(r.porTipo.site).toBe(2);
    expect(r.porTipo.app).toBe(1);
  });

  it("zera tudo numa lista vazia", () => {
    const r = resumoAdmin([]);
    expect(r).toMatchObject({ total: 0, abertas: 0, entregues: 0 });
    expect(r.porTipo.funcionalidade).toBe(0);
  });
});
