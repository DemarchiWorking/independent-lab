import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ConfigIA, EstadoFila, EstadoWorker, PedidoIA, ResultadoIA } from "../src/features/equipe-ia/ia/contrato";
import {
  ambienteDoCli,
  type Ambiente,
  chamarApi,
  ciclo,
  classificarCli,
  classificarHttp,
  criarEstado,
  custoEstimado,
  diaUtc,
  escolherProximo,
  escreverJson,
  extrairJson,
  idValido,
  modosDisponiveis,
  proximaMeiaNoiteUtc,
  recuperarOrfaos,
  rodar,
} from "./worker.mjs";

const CLI_FALSO = path.join(path.dirname(fileURLToPath(import.meta.url)), "teste", "claude-falso.mjs");

const CONFIG: ConfigIA = {
  contrato: 1,
  ativa: true,
  modo: "api",
  melhoriaContinua: true,
  modeloUsuario: "claude-sonnet-5-5",
  modeloLote: "claude-haiku-5-5",
  maxTokensSaida: 12000,
  intervaloVarreduraMin: 60,
  limites: { pedidosPorNegocioDia: 6, melhoriasPorVarredura: 10, jobsPorDia: 300, gastoMaxUsdDia: 5, refinosPorDocumento: 2 },
  cobrarPorRequisicao: false,
  modelos: {
    "claude-haiku-5-5": { entradaUsdPorMTok: 0.1, saidaUsdPorMTok: 0.5, thinking: { type: "disabled" } },
    "claude-sonnet-5-5": { entradaUsdPorMTok: 2, saidaUsdPorMTok: 10, thinking: { type: "between_tools" } },
  },
  atualizadoEm: "",
  atualizadoPor: "",
  historico: [],
};

function pedido(id: string, extra: Partial<PedidoIA> = {}): PedidoIA {
  return {
    contrato: 1,
    id,
    criadoEm: "2026-10-20T11:00:00.000Z",
    expiraEm: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    prioridade: "lote",
    modelo: "claude-haiku-5-5",
    maxTokens: 2000,
    sistema: "Você escreve documentos.",
    entrada: JSON.stringify({ modo: "ok" }),
    schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
    tentativas: 0,
    naoAntesDe: null,
    meta: {
      tenantId: "a".repeat(24),
      tipo: "canvas",
      contextoHash: "h1",
      nivel: 1,
      rodada: 1,
      geradorVersao: 1,
      feedback: null,
      reenvios: 0,
      prioridade: "lote",
    },
    ...extra,
  };
}

function relogio() {
  let t = Date.now();
  return { agora: () => new Date(t), avancar: (ms: number) => void (t += ms) };
}

let pasta: string;
beforeEach(async () => {
  pasta = await fs.mkdtemp(path.join(os.tmpdir(), "ia-spool-test-"));
});
afterEach(async () => {
  await fs.rm(pasta, { recursive: true, force: true });
});

const colocar = (estado: EstadoFila, obj: PedidoIA | ResultadoIA) => escreverJson(path.join(pasta, estado, `${obj.id}.json`), obj);
const gravarConfig = (c: Partial<ConfigIA> = {}) => escreverJson(path.join(pasta, "config.json"), { ...CONFIG, ...c });
async function ler<T>(estado: EstadoFila | "worker" | "config", id?: string): Promise<T> {
  const arquivo = estado === "worker" || estado === "config" ? path.join(pasta, `${estado}.json`) : path.join(pasta, estado, `${id}.json`);
  return JSON.parse(await fs.readFile(arquivo, "utf8")) as T;
}
async function existe(estado: EstadoFila, id: string): Promise<boolean> {
  return fs.access(path.join(pasta, estado, `${id}.json`)).then(() => true, () => false);
}

interface Recebida {
  cabecalhos: IncomingMessage["headers"];
  corpo: Record<string, unknown>;
}
interface RespostaFalsa {
  status: number;
  corpo: unknown;
  cabecalhos?: Record<string, string>;
}

async function servidor(responder: (req: Recebida, n: number) => RespostaFalsa) {
  const recebidas: Recebida[] = [];
  const srv = createServer((req, res) => {
    let texto = "";
    req.on("data", (d: Buffer) => (texto += d.toString()));
    req.on("end", () => {
      const rec: Recebida = { cabecalhos: req.headers, corpo: JSON.parse(texto) as Record<string, unknown> };
      recebidas.push(rec);
      const r = responder(rec, recebidas.length);
      res.writeHead(r.status, { "content-type": "application/json", ...r.cabecalhos });
      res.end(JSON.stringify(r.corpo));
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", ok));
  const porta = (srv.address() as AddressInfo).port;
  return { url: `http://127.0.0.1:${porta}`, recebidas, fechar: () => new Promise<void>((ok) => srv.close(() => ok())) };
}

const resposta200 = (texto: string, uso = { input_tokens: 1000, output_tokens: 500 }, parada = "end_turn"): RespostaFalsa => ({
  status: 200,
  corpo: { content: [{ type: "text", text: texto }], stop_reason: parada, usage: uso },
});
const erroApi = (status: number, tipo: string, mensagem: string, cabecalhos?: Record<string, string>): RespostaFalsa => ({
  status,
  corpo: { type: "error", error: { type: tipo, message: mensagem } },
  cabecalhos,
});

// ============================================================ classificação

describe("classificação de erros", () => {
  const cab = (valor: string | null) => ({ get: () => valor });

  it("401 e 403 são problema de credencial", () => {
    expect(classificarHttp(401, { error: { type: "authentication_error", message: "x" } }, cab(null)).codigo).toBe("auth");
    expect(classificarHttp(403, null, cab(null)).codigo).toBe("auth");
  });

  it("429 com retry-after espera o que o servidor mandou; sem ele, assume o teto de gasto", () => {
    const com = classificarHttp(429, { error: { type: "rate_limit_error", message: "x" } }, cab("45"));
    expect(com).toMatchObject({ codigo: "limite", esperaMs: 45_000 });
    const sem = classificarHttp(429, { error: { type: "rate_limit_error", message: "x" } }, cab(null));
    expect(sem.esperaMs).toBe(30 * 60_000);
  });

  it("5xx e 529 são sobrecarga; 504 é timeout; 402 é cobrança", () => {
    expect(classificarHttp(529, null, cab(null)).codigo).toBe("sobrecarga");
    expect(classificarHttp(500, null, cab(null)).codigo).toBe("sobrecarga");
    expect(classificarHttp(402, { error: { type: "billing_error", message: "x" } }, cab(null)).codigo).toBe("gasto");
  });

  it("400 de limite de gasto da organização vira 'gasto'; outro 400 é pedido inválido", () => {
    expect(classificarHttp(400, { error: { type: "invalid_request_error", message: "You have reached your workspace spend limit" } }, cab(null)).codigo).toBe("gasto");
    expect(classificarHttp(400, { error: { type: "invalid_request_error", message: "campo faltando" } }, cab(null)).codigo).toBe("invalido");
  });

  it("claude -p: limite com horário de volta, login e sobrecarga", () => {
    const epoch = Math.floor(Date.now() / 1000) + 1800;
    const limite = classificarCli(`Claude AI usage limit reached|${epoch}`);
    expect(limite.codigo).toBe("limite");
    expect(limite.esperaMs).toBeGreaterThan(25 * 60_000);
    expect(limite.esperaMs).toBeLessThanOrEqual(30 * 60_000);
    expect(classificarCli("Invalid API key · Please run /login").codigo).toBe("auth");
    expect(classificarCli("API Error: 529 overloaded").codigo).toBe("sobrecarga");
    expect(classificarCli("qualquer outra coisa").codigo).toBe("interno");
  });
});

describe("utilidades", () => {
  it("extrai JSON mesmo com cerca de código ou texto em volta", () => {
    expect(extrairJson('{"a":1}')).toEqual({ a: 1 });
    expect(extrairJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extrairJson('Segue o resultado: {"a":1} pronto.')).toEqual({ a: 1 });
    expect(() => extrairJson("sem json")).toThrow();
  });

  it("custo = tokens × preço por milhão; modelo desconhecido custa 0", () => {
    expect(custoEstimado(CONFIG, "claude-haiku-5-5", { entrada: 1000, saida: 500 })).toBeCloseTo(0.00035, 8);
    expect(custoEstimado(CONFIG, "claude-sonnet-5-5", { entrada: 8000, saida: 6000 })).toBeCloseTo(0.076, 6);
    expect(custoEstimado(CONFIG, "desconhecido", { entrada: 9, saida: 9 })).toBe(0);
  });

  it("só aceita ids no formato do app (nada de caminho)", () => {
    expect(idValido("a1b2-canvas-0f0f0f0f")).toBe(true);
    for (const ruim of ["../x", "a/b", "A", "", "a".repeat(101), "a.json", 5, null]) expect(idValido(ruim)).toBe(false);
  });

  it("o dia fecha à meia-noite UTC", () => {
    const d = new Date("2026-10-20T23:30:00.000Z");
    expect(diaUtc(d)).toBe("2026-10-20");
    expect(proximaMeiaNoiteUtc(d).toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });

  it("modos disponíveis dependem do que o ambiente tem; assinatura exige a confirmação do operador", () => {
    expect(modosDisponiveis({}, true)).toEqual([]);
    expect(modosDisponiveis({ ANTHROPIC_API_KEY: "k" }, false)).toEqual(["api"]);
    expect(modosDisponiveis({ CLAUDE_CODE_OAUTH_TOKEN: "t" }, true)).toEqual([]);
    expect(modosDisponiveis({ CLAUDE_CODE_OAUTH_TOKEN: "t", IA_PERMITIR_ASSINATURA: "1" }, false)).toEqual([]);
    expect(modosDisponiveis({ CLAUDE_CODE_OAUTH_TOKEN: "t", IA_PERMITIR_ASSINATURA: "1" }, true)).toEqual(["assinatura"]);
    expect(modosDisponiveis({ ANTHROPIC_API_KEY: "k", CLAUDE_CODE_OAUTH_TOKEN: "t", IA_PERMITIR_ASSINATURA: "1" }, true)).toEqual(["api", "assinatura"]);
  });
});

// ================================================================ modo API

describe("modo API", () => {
  it("manda a chamada certa: chave, versão, esquema, thinking do modelo, e guarda o resultado", async () => {
    const srv = await servidor(() => resposta200('{"ok":true}'));
    try {
      const r = relogio();
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "sk-ant-teste", ANTHROPIC_BASE_URL: srv.url }, relogio: r.agora });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));

      const feito = await ciclo(est);
      expect(feito).toMatchObject({ acao: "processou", id: "p1" });

      const req = srv.recebidas[0];
      expect(req.cabecalhos["x-api-key"]).toBe("sk-ant-teste");
      expect(req.cabecalhos["anthropic-version"]).toBe("2023-06-01");
      expect(req.corpo.model).toBe("claude-haiku-5-5");
      expect(req.corpo.max_tokens).toBe(2000);
      expect(req.corpo.system).toBe("Você escreve documentos.");
      expect(req.corpo.thinking).toEqual({ type: "disabled" });
      expect((req.corpo.output_config as { format: { type: string } }).format.type).toBe("json_schema");
      expect(req.corpo.tool_choice).toBeUndefined();

      const res = await ler<ResultadoIA>("concluido", "p1");
      expect(res).toMatchObject({ estado: "concluido", modo: "api", saida: { ok: true }, uso: { entrada: 1000, saida: 500 }, motivo: null });
      expect(res.custoUsd).toBeCloseTo(0.00035, 8);
      expect(res.meta.tenantId).toBe("a".repeat(24));
      expect(await existe("pendente", "p1")).toBe(false);
      expect(await existe("processando", "p1")).toBe(false);

      const hb = await ler<EstadoWorker>("worker");
      expect(hb.hoje).toMatchObject({ jobs: 1, entradaTokens: 1000, saidaTokens: 500 });
      expect(hb.modosDisponiveis).toEqual(["api"]);
      expect(hb.modoConfigurado).toBe("api");
    } finally {
      await srv.fechar();
    }
  });

  it("usuario passa na frente de lote; entre iguais, o mais antigo primeiro", async () => {
    const srv = await servidor(() => resposta200('{"ok":true}'));
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("lote-velho", { prioridade: "lote", criadoEm: "2026-10-20T08:00:00.000Z" }));
      await colocar("pendente", pedido("lote-novo", { prioridade: "lote", criadoEm: "2026-10-20T10:00:00.000Z" }));
      await colocar("pendente", pedido("usuario-novo", { prioridade: "usuario", criadoEm: "2026-10-20T11:00:00.000Z" }));

      const ordem: string[] = [];
      for (let i = 0; i < 3; i++) {
        const f = await ciclo(est);
        if (f.id) ordem.push(f.id);
      }
      expect(ordem).toEqual(["usuario-novo", "lote-velho", "lote-novo"]);
    } finally {
      await srv.fechar();
    }
  });

  it("429 com retry-after: o pedido volta para a fila e o worker espera, sem perder nada", async () => {
    let n = 0;
    const srv = await servidor(() => (++n === 1 ? erroApi(429, "rate_limit_error", "limite", { "retry-after": "45" }) : resposta200('{"ok":true}')));
    try {
      const r = relogio();
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url }, relogio: r.agora });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));

      expect((await ciclo(est)).acao).toBe("processou");
      expect(await existe("pendente", "p1")).toBe(true);
      expect((await ler<PedidoIA>("pendente", "p1")).tentativas).toBe(0);

      expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "limite" });
      const hb = await ler<EstadoWorker>("worker");
      expect(hb.motivoPausa).toBe("limite");
      expect(new Date(hb.pausadoAte ?? 0).getTime()).toBe(r.agora().getTime() + 45_000);

      r.avancar(46_000);
      expect(await ciclo(est)).toMatchObject({ acao: "processou", id: "p1" });
      expect(await existe("concluido", "p1")).toBe(true);
    } finally {
      await srv.fechar();
    }
  });

  it("401: pausa por credencial e mantém o pedido na fila", async () => {
    const srv = await servidor(() => erroApi(401, "authentication_error", "invalid x-api-key"));
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "ruim", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));
      await ciclo(est);
      expect(await existe("pendente", "p1")).toBe(true);
      expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "auth" });
    } finally {
      await srv.fechar();
    }
  });

  it("529: tenta três vezes, com espera crescente, e então falha com o motivo", async () => {
    const srv = await servidor(() => erroApi(529, "overloaded_error", "Overloaded"));
    try {
      const r = relogio();
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url }, relogio: r.agora });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));

      await ciclo(est);
      const apos1 = await ler<PedidoIA>("pendente", "p1");
      expect(apos1.tentativas).toBe(1);
      expect(new Date(apos1.naoAntesDe ?? 0).getTime()).toBe(r.agora().getTime() + 60_000);
      expect((await ciclo(est)).acao).toBe("ocioso"); // ainda não é a hora

      r.avancar(61_000);
      await ciclo(est);
      expect((await ler<PedidoIA>("pendente", "p1")).tentativas).toBe(2);

      r.avancar(121_000);
      await ciclo(est);
      expect(await existe("pendente", "p1")).toBe(false);
      expect(await ler<ResultadoIA>("falhou", "p1")).toMatchObject({ estado: "falhou", motivo: "sobrecarga", saida: null });
      expect(srv.recebidas).toHaveLength(3);
    } finally {
      await srv.fechar();
    }
  });

  it("modelo que recusa o parâmetro thinking: repete sem ele e conclui", async () => {
    const srv = await servidor((req) =>
      "thinking" in req.corpo ? erroApi(400, "invalid_request_error", '"thinking.type.disabled" is not supported for this model.') : resposta200('{"ok":true}'),
    );
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));
      await ciclo(est);
      expect(srv.recebidas).toHaveLength(2);
      expect("thinking" in srv.recebidas[1].corpo).toBe(false);
      expect(await existe("concluido", "p1")).toBe(true);
    } finally {
      await srv.fechar();
    }
  });

  it("esquema complexo demais para a API: repete sem output_config e extrai o JSON do texto", async () => {
    const srv = await servidor((req) =>
      "output_config" in req.corpo ? erroApi(400, "invalid_request_error", "Schema is too complex for compilation.") : resposta200('```json\n{"ok":true}\n```'),
    );
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));
      await ciclo(est);
      expect(srv.recebidas).toHaveLength(2);
      expect((await ler<ResultadoIA>("concluido", "p1")).saida).toEqual({ ok: true });
    } finally {
      await srv.fechar();
    }
  });

  it("resposta cortada, recusa e texto que não é JSON viram falha definitiva, com o uso registrado", async () => {
    const casos: Array<[string, RespostaFalsa, string]> = [
      ["cortada", resposta200('{"ok":', { input_tokens: 10, output_tokens: 2000 }, "max_tokens"), "truncado"],
      ["recusa", resposta200("", { input_tokens: 10, output_tokens: 1 }, "refusal"), "recusa"],
      ["lixo", resposta200("não sei fazer isso"), "invalido"],
    ];
    for (const [id, resp, motivo] of casos) {
      const srv = await servidor(() => resp);
      try {
        const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
        await gravarConfig();
        await colocar("pendente", pedido(id));
        await ciclo(est);
        const res = await ler<ResultadoIA>("falhou", id);
        expect(res.motivo).toBe(motivo);
        expect(res.uso.entrada).toBeGreaterThan(0);
      } finally {
        await srv.fechar();
      }
    }
  });

  it("sem esquema (texto livre) devolve o texto", async () => {
    const srv = await servidor(() => resposta200("Olá, mundo"));
    try {
      const r = await chamarApi({
        pedido: pedido("t", { schema: null }),
        config: CONFIG,
        env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url },
      });
      expect(r.saida).toBe("Olá, mundo");
      expect("output_config" in srv.recebidas[0].corpo).toBe(false);
    } finally {
      await srv.fechar();
    }
  });

  it("não manda a chave por http fora do loopback", async () => {
    await expect(
      chamarApi({ pedido: pedido("t"), config: CONFIG, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: "http://api.exemplo.com" } }),
    ).rejects.toThrow(/https/);
  });

  it("sem a chave, falha com 'config' e não faz chamada", async () => {
    const r = await chamarApi({ pedido: pedido("t"), config: CONFIG, env: {} });
    expect(r.falha?.codigo).toBe("config");
  });
});

// ============================================================ fila e limites

describe("fila e limites", () => {
  const apiOk = () => servidor(() => resposta200('{"ok":true}'));

  it("não processa sem configuração, desligado, ou com modo sem credencial, e diz o porquê no batimento", async () => {
    const srv = await apiOk();
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await colocar("pendente", pedido("p1"));

      expect((await ciclo(est)).acao).toBe("sem-config");
      await gravarConfig({ ativa: false });
      expect((await ciclo(est)).acao).toBe("desligada");
      await gravarConfig({ modo: "assinatura" });
      expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "modo-indisponivel" });
      expect(srv.recebidas).toHaveLength(0);
      expect(await existe("pendente", "p1")).toBe(true);
    } finally {
      await srv.fechar();
    }
  });

  it("para ao atingir o teto de gasto do dia e só volta à meia-noite UTC", async () => {
    const srv = await apiOk();
    try {
      const r = relogio();
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url }, relogio: r.agora });
      await gravarConfig({ limites: { ...CONFIG.limites, gastoMaxUsdDia: 0.0003 } });
      await colocar("pendente", pedido("p1"));
      await colocar("pendente", pedido("p2", { criadoEm: "2026-10-20T12:00:00.000Z" }));

      expect((await ciclo(est)).acao).toBe("processou"); // custa 0,00035, passa do teto
      expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "gasto-diario" });
      const hb = await ler<EstadoWorker>("worker");
      expect(hb.pausadoAte).toBe(proximaMeiaNoiteUtc(r.agora()).toISOString());
      expect(await existe("pendente", "p2")).toBe(true);
    } finally {
      await srv.fechar();
    }
  });

  it("respeita o teto de pedidos por dia", async () => {
    const srv = await apiOk();
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig({ limites: { ...CONFIG.limites, jobsPorDia: 1 } });
      await colocar("pendente", pedido("p1"));
      await colocar("pendente", pedido("p2"));
      await ciclo(est);
      expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "limite-diario" });
    } finally {
      await srv.fechar();
    }
  });

  it("pedido vencido vai para 'falhou' com o motivo, sem chamar a IA", async () => {
    const srv = await apiOk();
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("velho", { expiraEm: "2020-01-01T00:00:00.000Z" }));
      expect((await ciclo(est)).acao).toBe("expirado");
      expect((await ler<ResultadoIA>("falhou", "velho")).motivo).toBe("expirado");
      expect(srv.recebidas).toHaveLength(0);
    } finally {
      await srv.fechar();
    }
  });

  it("arquivo que não é um pedido válido sai da fila e não trava os outros", async () => {
    const srv = await apiOk();
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await fs.mkdir(path.join(pasta, "pendente"), { recursive: true });
      await fs.writeFile(path.join(pasta, "pendente", "lixo.json"), "{isto não é json");
      await fs.writeFile(path.join(pasta, "pendente", "outro.json"), JSON.stringify({ contrato: 99, id: "outro" }));
      await colocar("pendente", pedido("bom"));
      expect(await ciclo(est)).toMatchObject({ acao: "processou", id: "bom" });
      expect(await existe("pendente", "lixo" as string)).toBe(false);
    } finally {
      await srv.fechar();
    }
  });

  it("pedido que ficou em 'processando' depois de uma queda volta para a fila, uma vez só", async () => {
    await colocar("processando", pedido("orfao"));
    const agora = new Date(Date.now() + 20 * 60_000);
    expect(await recuperarOrfaos(pasta, agora)).toBe(1);
    expect((await ler<PedidoIA>("pendente", "orfao")).tentativas).toBe(1);
    expect(await existe("processando", "orfao")).toBe(false);

    // Se o resultado já existe, só limpa: nunca roda duas vezes.
    await colocar("processando", pedido("feito"));
    await colocar("concluido", { ...(pedido("feito") as unknown as ResultadoIA), estado: "concluido" });
    expect(await recuperarOrfaos(pasta, agora)).toBe(0);
    expect(await existe("pendente", "feito")).toBe(false);
    expect(await existe("processando", "feito")).toBe(false);
  });

  it("pedido recente em 'processando' não é tomado de quem está rodando", async () => {
    await colocar("processando", pedido("rodando"));
    expect(await recuperarOrfaos(pasta, new Date())).toBe(0);
    expect(await existe("processando", "rodando")).toBe(true);
  });

  it("escolherProximo respeita naoAntesDe", async () => {
    await colocar("pendente", pedido("depois", { naoAntesDe: new Date(Date.now() + 3_600_000).toISOString() }));
    expect(await escolherProximo(pasta, new Date())).toBeNull();
  });

  it("desligar no meio: o pedido em andamento volta intacto para a fila", async () => {
    const controle = new AbortController();
    const srv = await servidor(() => {
      controle.abort();
      return resposta200('{"ok":true}');
    });
    try {
      const est = criarEstado({ pasta, env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: srv.url } });
      await gravarConfig();
      await colocar("pendente", pedido("p1"));
      await rodar(est, { sinal: controle.signal, maxCiclos: 3 });
      // Ou concluiu antes do sinal, ou voltou: nunca some.
      const em = (await existe("pendente", "p1")) || (await existe("concluido", "p1"));
      expect(em).toBe(true);
      expect(await existe("processando", "p1")).toBe(false);
    } finally {
      await srv.fechar();
    }
  });
});

// ============================================================ modo assinatura

describe("modo assinatura (claude -p)", () => {
  const envCli = (extra: Ambiente = {}): Ambiente => ({
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    ANTHROPIC_API_KEY: "sk-ant-NAO-PODE-VAZAR",
    ANTHROPIC_AUTH_TOKEN: "tok-NAO-PODE-VAZAR",
    GAMEHUB_SECRET: "segredo-do-app-NAO-PODE-VAZAR",
    CLAUDE_CODE_OAUTH_TOKEN: "oauth-teste",
    IA_PERMITIR_ASSINATURA: "1",
    ...extra,
  });
  const estado = (extra: Ambiente = {}) =>
    criarEstado({ pasta, env: envCli(extra), bin: process.execPath, argsIniciais: [CLI_FALSO] });

  it("o ambiente do claude nunca herda chave de API nem segredo do app", () => {
    const e = ambienteDoCli(envCli(), "/tmp/casa");
    expect(Object.keys(e)).not.toContain("ANTHROPIC_API_KEY");
    expect(Object.keys(e)).not.toContain("ANTHROPIC_AUTH_TOKEN");
    expect(Object.keys(e)).not.toContain("GAMEHUB_SECRET");
    expect(e.CLAUDE_CODE_OAUTH_TOKEN).toBe("oauth-teste");
    expect(e.HOME).toBe("/tmp/casa");
  });

  it("roda sem ferramentas, sem sessão salva e sem --bare, e devolve a saída estruturada", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("c1", { entrada: JSON.stringify({ modo: "ok" }) }));
    expect(await ciclo(est)).toMatchObject({ acao: "processou", id: "c1" });

    const res = await ler<ResultadoIA>("concluido", "c1");
    const s = res.saida as { temChaveApi: boolean; temAuthToken: boolean; temSegredoDoApp: boolean; temToken: boolean; homeEstaNoTemp: boolean; args: string[]; temSistema: boolean };
    expect(s.temChaveApi).toBe(false);
    expect(s.temAuthToken).toBe(false);
    expect(s.temSegredoDoApp).toBe(false);
    expect(s.temToken).toBe(true);
    expect(s.homeEstaNoTemp).toBe(true);
    expect(s.temSistema).toBe(true);
    expect(s.args).toContain("--no-session-persistence");
    expect(s.args).toContain("--disable-slash-commands");
    expect(s.args).toContain("--strict-mcp-config");
    expect(s.args).toContain("--safe-mode");
    expect(s.args[s.args.indexOf("--max-turns") + 1]).toBe("5");
    expect(s.args).not.toContain("--bare");
    expect(s.args[s.args.indexOf("--tools") + 1]).toBe("");
    expect(s.args).toContain("--json-schema");
    expect(res).toMatchObject({ modo: "assinatura", uso: { entrada: 700, saida: 300 } });
    expect(res.custoUsd).toBeCloseTo(0.0123, 6);
  });

  it("sem esquema aceita o JSON dentro de cerca de código", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("c2", { entrada: JSON.stringify({ modo: "texto" }) }));
    await ciclo(est);
    expect((await ler<ResultadoIA>("concluido", "c2")).saida).toEqual({ veio: "do texto" });
  });

  it("limite da assinatura pausa o worker até a hora informada e devolve o pedido", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("c3", { entrada: JSON.stringify({ modo: "limite" }) }));
    await ciclo(est);
    expect(await existe("pendente", "c3")).toBe(true);
    const hb = await ler<EstadoWorker>("worker");
    expect(hb.motivoPausa).toBe("limite");
    const espera = new Date(hb.pausadoAte ?? 0).getTime() - Date.now();
    expect(espera).toBeGreaterThan(50 * 60_000);
    expect(espera).toBeLessThanOrEqual(60 * 60_000);
  });

  it("login inválido pausa por credencial; max-turns e saída que não é JSON não derrubam o worker", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("c4", { entrada: JSON.stringify({ modo: "auth" }) }));
    await ciclo(est);
    expect((await ler<EstadoWorker>("worker")).motivoPausa).toBe("auth");

    const est2 = estado();
    await colocar("pendente", pedido("c5", { entrada: JSON.stringify({ modo: "max-turns" }) }));
    await fs.rm(path.join(pasta, "pendente", "c4.json"), { force: true });
    await ciclo(est2);
    expect((await ler<ResultadoIA>("falhou", "c5")).motivo).toBe("truncado");

    const est3 = estado();
    await colocar("pendente", pedido("c6", { entrada: JSON.stringify({ modo: "lixo" }) }));
    expect((await ciclo(est3)).acao).toBe("processou");
    expect(await existe("pendente", "c6")).toBe(true); // falha transitória: volta com tentativa
  });

  it("sem o token ou sem a confirmação do operador, o modo assinatura não está disponível", async () => {
    const est = estado({ IA_PERMITIR_ASSINATURA: "0" });
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("c7"));
    expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "modo-indisponivel" });
  });
});

// ============================================================ assinatura como modo principal

describe("assinatura Pro: formatos reais de erro e operação", () => {
  const cabecalho = { get: () => null };
  void cabecalho;

  it("classifica os formatos reais que a CLI devolve (is_error com subtype 'success')", () => {
    // vistos na CLI 2.1.226 com login vencido
    expect(classificarCli("Failed to authenticate. API Error: 401 OAuth access token has expired. Re-authenticate to continue.", 401).codigo).toBe("auth");
    expect(classificarCli("Failed to authenticate: OAuth session expired and could not be refreshed").codigo).toBe("auth");
    // janela de 5 horas e limite semanal: sem época, espera 60 min (tentar de novo não gasta nada)
    const janela = classificarCli("5-hour limit reached ∙ resets 3pm", 429);
    expect(janela).toMatchObject({ codigo: "limite", esperaMs: 60 * 60_000 });
    expect(classificarCli("Weekly limit reached ∙ resets Mon 9am").codigo).toBe("limite");
    expect(classificarCli("Claude usage limit reached. Your limit will reset at 3pm").codigo).toBe("limite");
    // modelo que a conta não tem: vale para todo pedido, então pausa em vez de gastar tentativas
    expect(classificarCli("There's an issue with the selected model (claude-haiku-5-5). It may not exist or you may not have access to it.", 404).codigo).toBe("config");
    expect(classificarCli("API Error: 529 overloaded_error", 529).codigo).toBe("sobrecarga");
    expect(classificarCli("algo estranho").codigo).toBe("interno");
  });

  const envCli = (extra: Ambiente = {}): Ambiente => ({
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    CLAUDE_CODE_OAUTH_TOKEN: "oauth-teste",
    IA_PERMITIR_ASSINATURA: "1",
    ...extra,
  });
  const estado = (extra: Ambiente = {}) => criarEstado({ pasta, env: envCli(extra), bin: process.execPath, argsIniciais: [CLI_FALSO] });

  it("a credencial pode ser a pasta de login em vez do token (claude auth login feito pelo operador)", () => {
    const e = ambienteDoCli({ IA_CLAUDE_CONFIG_DIR: "/login", PATH: "/bin" }, "/tmp/casa");
    expect(e.CLAUDE_CONFIG_DIR).toBe("/login");
    expect(e.HOME).toBe("/tmp/casa"); // o resto continua isolado
    expect(ambienteDoCli({ PATH: "/bin" }, "/tmp/casa").CLAUDE_CONFIG_DIR).toContain("casa");
    expect(modosDisponiveis({ IA_PERMITIR_ASSINATURA: "1", IA_CLAUDE_CONFIG_DIR: "/login" }, true)).toEqual(["assinatura"]);
    expect(modosDisponiveis({ IA_PERMITIR_ASSINATURA: "1" }, true)).toEqual([]);
  });

  it("IA_CLAUDE_ARGS põe argumentos antes dos do worker (wrapper do claude); lixo é ignorado", () => {
    expect(criarEstado({ pasta, env: { IA_CLAUDE_ARGS: '["--a","b"]' } }).argsIniciais).toEqual(["--a", "b"]);
    for (const ruim of ["{", "[1,2]", '"texto"', "", undefined]) expect(criarEstado({ pasta, env: { IA_CLAUDE_ARGS: ruim } }).argsIniciais).toEqual([]);
  });

  it("se a CLI recusa o esquema, repete sem ele e aceita o JSON do texto", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("e1", { entrada: JSON.stringify({ modo: "esquema-recusado" }) }));
    expect((await ciclo(est)).acao).toBe("processou");
    expect((await ler<ResultadoIA>("concluido", "e1")).saida).toEqual({ sem: "esquema" });
  });

  it("limite da janela de 5 horas: pausa 60 minutos, devolve o pedido à fila e não conta como falha do pedido", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("l1", { entrada: JSON.stringify({ modo: "limite-novo" }) }));
    await ciclo(est);
    expect(await existe("pendente", "l1")).toBe(true);
    expect((await ler<PedidoIA>("pendente", "l1")).tentativas).toBe(0);
    const hb = await ler<EstadoWorker>("worker");
    expect(hb.motivoPausa).toBe("limite");
    const espera = new Date(hb.pausadoAte ?? 0).getTime() - Date.now();
    expect(espera).toBeGreaterThan(55 * 60_000);
    expect(espera).toBeLessThanOrEqual(60 * 60_000);
  });

  it("modelo que a assinatura não tem: pausa por configuração e o pedido espera na fila", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura" });
    await colocar("pendente", pedido("m1", { entrada: JSON.stringify({ modo: "modelo-indisponivel" }) }));
    await ciclo(est);
    expect(await existe("pendente", "m1")).toBe(true);
    expect((await ler<EstadoWorker>("worker")).motivoPausa).toBe("config");
  });

  it("o teto de gasto em dólar vale só no modo API: na assinatura o custo é equivalência, nunca cobrada", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura", limites: { ...CONFIG.limites, gastoMaxUsdDia: 0.001 } });
    await colocar("pendente", pedido("a1", { entrada: JSON.stringify({ modo: "ok" }), criadoEm: "2026-10-20T08:00:00.000Z" }));
    await colocar("pendente", pedido("a2", { entrada: JSON.stringify({ modo: "ok" }), criadoEm: "2026-10-20T09:00:00.000Z" }));
    expect((await ciclo(est)).acao).toBe("processou");
    expect((await ciclo(est)).acao).toBe("processou"); // passou do "teto" em dólar e segue: não é cobrado
    expect(await existe("concluido", "a2")).toBe(true);
    expect((await ler<EstadoWorker>("worker")).motivoPausa).toBeNull();
  });

  it("o teto de pedidos por dia vale nos dois modos", async () => {
    const est = estado();
    await gravarConfig({ modo: "assinatura", limites: { ...CONFIG.limites, jobsPorDia: 1 } });
    await colocar("pendente", pedido("j1", { entrada: JSON.stringify({ modo: "ok" }) }));
    await colocar("pendente", pedido("j2", { entrada: JSON.stringify({ modo: "ok" }) }));
    await ciclo(est);
    expect(await ciclo(est)).toMatchObject({ acao: "pausado", motivo: "limite-diario" });
  });
});
