import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { atributosVazios } from "@/lib/atributos";
import type { FuncionarioContratado, Negocio, Sessao } from "@/lib/db/types";

/**
 * Teste da rota `/api/entregavel/[tipo]` com sessão e repositório simulados.
 * O que importa aqui é a FRONTEIRA: quem pode pedir o quê, e que um negócio
 * nunca recebe dado de outro.
 */

const mocks = vi.hoisted(() => ({
  sessao: null as Sessao | null,
  leituras: [] as string[],
}));

vi.mock("@/lib/auth/sessao", () => ({ lerSessao: async () => mocks.sessao }));

function negocio(id: string, nome: string, segmento: Negocio["segmento"]): Negocio {
  return {
    id,
    nome,
    segmento,
    endereco: { cidadeSlug: "mendes", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-01-01T00:00:00.000Z",
    degrauAtual: 2,
    degrauAlvo: 3,
    nivel: 1,
    xp: 0,
    moedaVirtual: 0,
    atributos: atributosVazios(),
    perfilPublico: true,
    consentimentoEm: "2026-01-01T00:00:00.000Z",
    consentimentoVersao: "v1",
  };
}

function funcionario(tenantId: string, cargoId: string, nivel: number): FuncionarioContratado {
  return { id: `${tenantId}-${cargoId}`, tenantId, cargoId, contratadoEm: "2026-02-01T00:00:00.000Z", disponibilidade: { estado: "livre" }, nivel };
}

const NEGOCIOS: Record<string, Negocio> = {
  t1: negocio("t1", "Studio Bela Cabelos", "servico"),
  t2: negocio("t2", "Radiz Engenharia", "engenharia"),
  t3: negocio("t3", "Mercado Fiel", "comercio"),
  t4: negocio("t4", "Pet Shop Amigo", "servico"),
  t5: negocio("t5", "Café & Cia <script>", "alimentacao"),
};

const FUNCIONARIOS: Record<string, FuncionarioContratado[]> = {
  t1: [funcionario("t1", "documentador", 3), funcionario("t1", "social-media", 3), funcionario("t1", "comercial", 1), funcionario("t1", "editor-video", 2)],
  t2: [funcionario("t2", "documentador", 1)],
  t3: [funcionario("t3", "documentador", 1)],
  t4: [funcionario("t4", "social-media", 1)],
  t5: [funcionario("t5", "documentador", 1)],
};

vi.mock("@/lib/db", () => ({
  getRepository: () => ({
    lerNegocio: async (id: string) => {
      mocks.leituras.push(id);
      return NEGOCIOS[id] ?? null;
    },
    lerOnboarding: async () => null,
    listarOfertas: async () => [],
    listarVizinhos: async () => [],
    listarParceriasFormadas: async () => [],
    listarFuncionarios: async (id: string) => FUNCIONARIOS[id] ?? [],
  }),
}));

// A camada de IA lê e grava em pastas: o teste usa uma pasta só dele, nunca a `data/` real.
process.env.GAMEHUB_DATA_DIR = mkdtempSync(path.join(tmpdir(), "independent-lab-rota-"));

const { GET, POST } = await import("./[tipo]/route");

function logar(tenantId: string | null) {
  mocks.sessao = tenantId ? { usuarioId: `u-${tenantId}`, tenantId, nome: "Dono", email: "dono@teste.com" } : null;
}

async function pedir(tipo: string, query = "") {
  return GET(new Request(`http://localhost/api/entregavel/${tipo}${query}`), { params: Promise.resolve({ tipo }) });
}

async function postar(tipo: string, corpo: unknown, cabecalhos: Record<string, string> = {}) {
  return POST(
    new Request(`http://localhost/api/entregavel/${tipo}`, {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", ...cabecalhos },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
    { params: Promise.resolve({ tipo }) },
  );
}

beforeEach(() => {
  mocks.leituras.length = 0;
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("rota de entregáveis: acesso", () => {
  it("tipo desconhecido é 404", async () => {
    logar("t1");
    expect((await pedir("segredos")).status).toBe(404);
    expect((await pedir("..%2F..%2Fetc")).status).toBe(404);
  });

  it("sem login é 401 e nem consulta o banco", async () => {
    logar(null);
    const r = await pedir("canvas");
    expect(r.status).toBe(401);
    expect(mocks.leituras).toEqual([]);
  });

  it("sem o funcionário contratado é 403 e o negócio nem é lido", async () => {
    logar("t2");
    const r = await pedir("carrossel");
    expect(r.status).toBe(403);
    expect((await r.json()).erro).toMatch(/Contrate/);
    expect(mocks.leituras).toEqual([]);
  });

  it("cada tipo exige o seu cargo: o documentador não gera o kit comercial", async () => {
    logar("t2");
    expect((await pedir("canvas")).status).toBe(200);
    expect((await pedir("comercial")).status).toBe(403);
    expect((await pedir("reel")).status).toBe(403);
  });
});

describe("rota de entregáveis: isolamento entre negócios", () => {
  it("o negócio vem da SESSÃO, e parâmetros tenantId na URL são ignorados", async () => {
    logar("t1");
    const r = await pedir("canvas", "?tenantId=t2&tenant=t2&negocio=t2&saida=json");
    expect(r.status).toBe(200);
    expect((await r.json()).titulo).toContain("Studio Bela Cabelos");
    expect(mocks.leituras).toEqual(["t1"]);
    expect(mocks.leituras).not.toContain("t2");
  });

  it("o corpo do POST também não escolhe o negócio", async () => {
    logar("t1");
    const r = await postar("carrossel", { saida: "zip", pauta: "dicas", tenantId: "t2", tenant: "t2" });
    expect(r.status).toBe(200);
    expect(mocks.leituras).toEqual(["t1"]);
  }, 60_000);

  it("dois negócios recebem documentos diferentes, cada um com os seus dados", async () => {
    logar("t1");
    const a = await (await pedir("canvas", "?saida=json")).json();
    logar("t2");
    const b = await (await pedir("canvas", "?saida=json")).json();
    expect(JSON.stringify(a)).not.toContain("Radiz");
    expect(JSON.stringify(b)).not.toContain("Studio Bela");
  });
});

describe("rota de entregáveis: nível vem do banco", () => {
  it("nível 3 do funcionário traz riscos; nível 1 não", async () => {
    logar("t1");
    expect(JSON.stringify(await (await pedir("canvas", "?saida=json")).json())).toContain("Riscos e como se proteger");
    logar("t2");
    expect(JSON.stringify(await (await pedir("canvas", "?saida=json")).json())).not.toContain("Riscos e como se proteger");
  });

  it("o cliente não consegue pedir um nível maior pela URL", async () => {
    logar("t2");
    const r = await pedir("canvas", "?saida=json&nivel=3&nivelAgente=3");
    expect(JSON.stringify(await r.json())).not.toContain("Riscos e como se proteger");
  });
});

describe("rota de entregáveis: formatos e cabeçalhos", () => {
  it("HTML por padrão, baixado, sem cache e com nome de arquivo ASCII", async () => {
    logar("t5");
    const r = await pedir("canvas");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    const disposicao = r.headers.get("content-disposition") ?? "";
    expect(disposicao).toMatch(/^attachment; filename="canvas-[a-z0-9-]+\.html"$/);
    const html = await r.text();
    // só o <script> do próprio arquivo (botão de copiar); o do nome do negócio virou texto
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).toContain("Café &amp; Cia &lt;script&gt;");
  });

  it("ver=1 abre no navegador em vez de baixar", async () => {
    logar("t1");
    const r = await pedir("comercial", "?ver=1");
    expect(r.headers.get("content-disposition")).toMatch(/^inline;/);
  });

  it("Markdown e JSON têm o tipo certo", async () => {
    logar("t1");
    const md = await pedir("pop", "?saida=md");
    expect(md.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect((await md.text()).startsWith("# Manual de Processos")).toBe(true);
    const json = await pedir("comercial", "?saida=json");
    expect(json.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect((await json.json()).dados.fluxoQualificacao).toBeTruthy();
  });

  it("o JSON do carrossel traz o pacote para o editor", async () => {
    logar("t1");
    const corpo = await (await pedir("carrossel", "?saida=json")).json();
    expect(corpo.pacote.pautas.length).toBe(6);
    expect(corpo.documento.tipo).toBe("carrossel");
  });

  it("saída não permitida para o tipo é 400 (PNG de canvas, por exemplo)", async () => {
    logar("t1");
    expect((await pedir("canvas", "?saida=png&pauta=x&slide=1")).status).toBe(400);
    expect((await pedir("canvas", "?saida=exe")).status).toBe(400);
  });
});

describe("rota de entregáveis: imagens do carrossel", () => {
  it("PNG de um slide, com edições do usuário", async () => {
    logar("t1");
    const r = await postar("carrossel", {
      saida: "png",
      pauta: "dicas",
      slide: 1,
      formato: "story",
      tema: "destaque",
      slides: [{ titulo: "Meu título novo", texto: "Meu texto novo" }],
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect(Array.from(bytes.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
    const v = new DataView(bytes.buffer);
    expect([v.getUint32(16), v.getUint32(20)]).toEqual([1080, 1920]);
  }, 60_000);

  it("ZIP com todos os slides e a legenda", async () => {
    logar("t1");
    const r = await postar("carrossel", { saida: "zip", pauta: "oferta", legenda: "Minha legenda editada" });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/zip");
    expect(r.headers.get("content-disposition")).toMatch(/^attachment; filename="[a-z0-9-]+-oferta\.zip"$/);
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder("latin1").decode(bytes)).toContain("Minha legenda editada");
  }, 60_000);

  it("pauta de rascunho com campos pendentes é recusada (422)", async () => {
    logar("t1");
    const r = await postar("carrossel", { saida: "zip", pauta: "bastidores" });
    expect(r.status).toBe(422);
    expect((await r.json()).erro).toMatch(/colchetes/);
  });

  it("pauta inexistente para o nível é 404; entrada inválida é 400", async () => {
    logar("t4"); // carrossel nível 1: só 2 pautas
    expect((await postar("carrossel", { saida: "png", pauta: "bastidores", slide: 1 })).status).toBe(404);
    expect((await postar("carrossel", { saida: "png", pauta: "dicas", slide: 99 })).status).toBe(400);
    expect((await postar("carrossel", { saida: "png", pauta: "dicas" })).status).toBe(400);
    expect((await postar("carrossel", { saida: "png", pauta: "dicas", slide: 1, formato: "x" })).status).toBe(400);
  });
});

describe("rota de entregáveis: POST seguro", () => {
  it("recusa pedido vindo de outro site (Sec-Fetch-Site e Origin)", async () => {
    logar("t1");
    expect((await postar("carrossel", { saida: "png", pauta: "dicas", slide: 1 }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await postar("carrossel", { saida: "png", pauta: "dicas", slide: 1 }, { origin: "https://site-malicioso.com" })).status).toBe(403);
    expect((await postar("carrossel", { saida: "png", pauta: "dicas", slide: 1 }, { origin: "http://localhost" })).status).toBe(200);
  }, 60_000);

  it("corpo inválido é 400; grande demais é 413; não-objeto é 400", async () => {
    logar("t1");
    expect((await postar("carrossel", "{ não é json")).status).toBe(400);
    expect((await postar("carrossel", "[1,2,3]")).status).toBe(400);
    expect((await postar("carrossel", "null")).status).toBe(400);
    const enorme = JSON.stringify({ pauta: "dicas", lixo: "x".repeat(30_000) });
    expect((await postar("carrossel", enorme)).status).toBe(413);
  });
});

describe("rota de entregáveis: limite de uso", () => {
  it("o 41º pedido do mesmo negócio no mesmo minuto é 429 com Retry-After", async () => {
    logar("t3");
    const respostas: number[] = [];
    for (let i = 0; i < 41; i++) respostas.push((await pedir("canvas", "?saida=json")).status);
    expect(respostas.slice(0, 40).every((s) => s === 200)).toBe(true);
    const ultima = await pedir("canvas", "?saida=json");
    expect(ultima.status).toBe(429);
    expect(ultima.headers.get("retry-after")).toBe("60");
  });

  it("o limite é por negócio: quem esgotou não afeta os outros", async () => {
    logar("t2");
    expect((await pedir("canvas", "?saida=json")).status).toBe(200);
  });

  it("imagens têm um limite próprio, mais baixo", async () => {
    logar("t4");
    const status: number[] = [];
    for (let i = 0; i < 5; i++) status.push((await postar("carrossel", { saida: "zip", pauta: "dicas" })).status);
    // pauta de 6 slides: 4 ZIPs consomem 24 imagens; o 5º passa do limite
    expect(status.slice(0, 4)).toEqual([200, 200, 200, 200]);
    expect(status[4]).toBe(429);
  }, 120_000);
});
