import { describe, expect, it } from "vitest";
import { LIMITES_EVENTO, validarNovoEvento } from "./validacao";
import type { NovoEventoGlobal } from "./tipos";

const base: NovoEventoGlobal = {
  titulo: "Semana da Presença",
  descricao: "Publique uma oferta nesta semana.",
  objetivo: "oferta_publicada",
  meta: 3,
  inicioEm: "2026-11-01T00:00:00.000Z",
  fimEm: "2026-11-08T00:00:00.000Z",
  recompensa: { xp: 100, moeda: 50 },
};

describe("validarNovoEvento", () => {
  it("aceita um evento dentro dos limites", () => {
    expect(validarNovoEvento(base)).toBeNull();
  });

  it("recusa recompensa acima do teto (economia)", () => {
    expect(validarNovoEvento({ ...base, recompensa: { xp: 1_000_000, moeda: 0 } })).toMatch(/XP/);
    expect(validarNovoEvento({ ...base, recompensa: { xp: 0, moeda: LIMITES_EVENTO.moedaMax + 1 } })).toMatch(/Moeda/);
  });

  it("recusa valores não inteiros, negativos ou NaN", () => {
    expect(validarNovoEvento({ ...base, meta: 2.5 })).toMatch(/Meta/);
    expect(validarNovoEvento({ ...base, meta: Number.NaN })).toMatch(/Meta/);
    expect(validarNovoEvento({ ...base, recompensa: { xp: -1, moeda: 0 } })).toMatch(/XP/);
  });

  it("recusa texto longo demais (aparece no hub de todos)", () => {
    expect(validarNovoEvento({ ...base, titulo: "x".repeat(LIMITES_EVENTO.titulo + 1) })).toMatch(/Título/);
    expect(validarNovoEvento({ ...base, descricao: "x".repeat(LIMITES_EVENTO.descricao + 1) })).toMatch(/Descrição/);
  });

  it("recusa atributo fora do catálogo e objetivo desconhecido", () => {
    const atributoFalso = { chave: "dinheiro", ganho: 5 } as unknown as NonNullable<NovoEventoGlobal["recompensa"]["atributo"]>;
    expect(validarNovoEvento({ ...base, recompensa: { xp: 0, moeda: 0, atributo: atributoFalso } })).toMatch(/Atributo/);
    expect(validarNovoEvento({ ...base, objetivo: "qualquer" as NovoEventoGlobal["objetivo"] })).toMatch(/Objetivo/);
  });

  it("recusa janela invertida ou data inválida", () => {
    expect(validarNovoEvento({ ...base, inicioEm: base.fimEm, fimEm: base.inicioEm })).toMatch(/data/);
    expect(validarNovoEvento({ ...base, inicioEm: "ontem" })).toMatch(/data/);
  });
});
