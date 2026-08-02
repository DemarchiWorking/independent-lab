import { beforeEach, describe, expect, it, vi } from "vitest";
import { entrarNaSala } from "./canal";
import type { VisitantePresente } from "./canalUtil";

/**
 * Canal falso injetado no lugar do cliente Supabase — prova a LÓGICA de
 * `entrarNaSala` (ordem de subscribe/track, no-op sem config, cleanup)
 * sem precisar de um projeto Supabase rodando. A verificação viva (duas
 * abas, dois tenants) é outra coisa e depende de `GH-MULTI-01`.
 *
 * `vi.hoisted` é necessário porque `vi.mock` é içado para o topo do
 * módulo: sem isso, o estado abaixo ainda não existiria quando a factory
 * do mock roda.
 */
const h = vi.hoisted(() => {
  const estado = {
    presence: {} as Record<string, unknown[]>,
    aoSincronizar: null as null | (() => void),
    statusCallback: null as null | ((status: string) => void),
    rastreados: [] as unknown[],
    canaisCriados: [] as string[],
    desinscrito: false,
  };

  const canal = {
    on(_tipo: string, _filtro: unknown, callback: () => void) {
      estado.aoSincronizar = callback;
      return canal;
    },
    subscribe(callback: (status: string) => void) {
      estado.statusCallback = callback;
      return canal;
    },
    async unsubscribe() {
      estado.desinscrito = true;
      return "ok";
    },
    async track(payload: unknown) {
      estado.rastreados.push(payload);
      return "ok";
    },
    presenceState() {
      return estado.presence;
    },
  };

  return { estado, canal };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    channel: (nome: string) => {
      h.estado.canaisCriados.push(nome);
      return h.canal;
    },
  }),
}));

const eu: VisitantePresente = {
  tenantId: "eu",
  nome: "Meu Negócio",
  entrouEm: "2026-01-01T00:00:00.000Z",
};

function visitante(tenantId: string): VisitantePresente {
  return { tenantId, nome: `Negócio ${tenantId}`, entrouEm: "2026-01-01T00:00:00.000Z" };
}

const configOk = { url: "https://exemplo.supabase.co", anonKey: "chave-anon-exemplo" };

beforeEach(() => {
  h.estado.presence = {};
  h.estado.aoSincronizar = null;
  h.estado.statusCallback = null;
  h.estado.rastreados.length = 0;
  h.estado.canaisCriados.length = 0;
  h.estado.desinscrito = false;
});

describe("entrarNaSala — presença ao vivo (GH-MULTI-02)", () => {
  it("abre o canal da sala certa, escopado por tenant", () => {
    entrarNaSala("sala-x", eu, () => {}, configOk);
    expect(h.estado.canaisCriados).toEqual(["sede:sala-x"]);
  });

  it("anuncia a própria presença SÓ depois do canal estar inscrito", () => {
    entrarNaSala("sala-x", eu, () => {}, configOk);
    // ainda não inscrito: nada rastreado
    expect(h.estado.rastreados).toEqual([]);

    h.estado.statusCallback?.("SUBSCRIBED");
    expect(h.estado.rastreados).toEqual([eu]);
  });

  it("não anuncia presença em status que não seja SUBSCRIBED", () => {
    entrarNaSala("sala-x", eu, () => {}, configOk);
    h.estado.statusCallback?.("CHANNEL_ERROR");
    h.estado.statusCallback?.("TIMED_OUT");
    expect(h.estado.rastreados).toEqual([]);
  });

  it("repassa a lista de presentes no sync, já achatada e ordenada", () => {
    const recebidos: string[][] = [];
    entrarNaSala(
      "sala-x",
      eu,
      (presentes) => recebidos.push(presentes.map((p) => p.tenantId)),
      configOk,
    );

    h.estado.presence = { k1: [visitante("t9")], k2: [visitante("t2")] };
    h.estado.aoSincronizar?.();

    expect(recebidos).toEqual([["t2", "t9"]]);
  });

  it("a função devolvida sai do canal (cleanup do useEffect)", () => {
    const sair = entrarNaSala("sala-x", eu, () => {}, configOk);
    expect(h.estado.desinscrito).toBe(false);

    sair();
    expect(h.estado.desinscrito).toBe(true);
  });

  it("sem config (GAMEHUB_DB=file) vira no-op: não abre canal e não lança", () => {
    const sair = entrarNaSala("sala-x", eu, () => {}, null);

    expect(h.estado.canaisCriados).toEqual([]);
    expect(() => sair()).not.toThrow();
  });

  it("config com anonKey vazia também vira no-op", () => {
    const sair = entrarNaSala("sala-x", eu, () => {}, { url: "https://exemplo.supabase.co", anonKey: "" });

    expect(h.estado.canaisCriados).toEqual([]);
    expect(() => sair()).not.toThrow();
  });
});
