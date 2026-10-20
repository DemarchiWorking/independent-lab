import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ciclo } from "../../../../ia-worker/worker.mjs";
import { executarTick, iniciarAgendador, pararAgendador } from "./agendador";
import { garantirConfig, gravarConfig } from "./config";
import { listarIds, pastaIA } from "./fila";
import { bemComportado, criarTenant, esvaziarFila, servidorApi, worker } from "./teste-ambiente-ia";
import { solicitarRefino } from "./servico-ia";
import { lerRegistro } from "./versoes";

const HORA = 60 * 60_000;

let pasta = "";
const anterior = process.env.GAMEHUB_DATA_DIR;

beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-agend-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(async () => {
  pararAgendador();
  vi.restoreAllMocks();
  process.env.GAMEHUB_DATA_DIR = anterior;
  await rm(pasta, { recursive: true, force: true });
});

describe("agendador", () => {
  it("coleta a cada passo e varre de hora em hora, melhorando quando a fila está vazia", async () => {
    const { repo, tenantId } = await criarTenant("Studio Agenda", { cargos: ["documentador"] });
    const srv = await servidorApi(bemComportado);
    try {
      await garantirConfig();
      const t0 = new Date();
      let agora = t0;
      const est = worker(srv.url, () => agora);
      await ciclo(est);

      // primeiro passo: nunca varreu, então varre e enfileira canvas e pop
      const p1 = await executarTick(repo, t0);
      expect(p1.varredura).toMatchObject({ pulou: null, enfileirados: 2 });

      // o worker termina; 10 minutos depois o passo coleta, mas ainda não é hora de varrer
      await esvaziarFila(est);
      agora = new Date(t0.getTime() + 10 * 60_000);
      await ciclo(est);
      const p2 = await executarTick(repo, agora);
      expect(p2.coleta).toMatchObject({ aceitos: 2 });
      expect(p2.varredura).toBeNull();
      expect((await lerRegistro(tenantId, "canvas")).versoes).toHaveLength(1);

      // uma hora depois: nova varredura, agora de refino (rodada 2)
      agora = new Date(t0.getTime() + HORA + 1_000);
      await ciclo(est);
      const p3 = await executarTick(repo, agora);
      expect(p3.varredura).toMatchObject({ pulou: null, enfileirados: 2 });
      const pedido = JSON.parse(await readFile(path.join(pastaIA(), "pendente", `${(await listarIds("pendente"))[0]}.json`), "utf8")) as { meta: { rodada: number }; prioridade: string };
      expect(pedido.meta.rodada).toBe(2);
      expect(pedido.prioridade).toBe("lote");
    } finally {
      await srv.fechar();
    }
  });

  it("fila ocupada não gasta o intervalo: assim que esvazia, a varredura acontece", async () => {
    const { repo } = await criarTenant("Studio Fila", { cargos: ["documentador"] });
    const srv = await servidorApi(bemComportado);
    try {
      await garantirConfig();
      const est = worker(srv.url);
      await ciclo(est);
      const t0 = new Date();

      await solicitarRefino(repo, (await repo.listarNegociosPublicos())[0].id, "canvas", "usuario", t0); // fila com um pedido de usuário
      const ocupado = await executarTick(repo, t0);
      expect(ocupado.varredura).toMatchObject({ pulou: "fila-ocupada" });

      await esvaziarFila(est);
      const livre = await executarTick(repo, new Date(t0.getTime() + 30_000));
      expect(livre.varredura).toMatchObject({ pulou: null });
      expect(livre.varredura?.enfileirados).toBeGreaterThan(0);
    } finally {
      await srv.fechar();
    }
  });

  it("sem worker vivo, não enfileira e tenta de novo no passo seguinte", async () => {
    const { repo } = await criarTenant("Studio Sem Worker", { cargos: ["documentador"] });
    await garantirConfig();
    const t0 = new Date();
    expect((await executarTick(repo, t0)).varredura).toMatchObject({ pulou: "worker-parado" });
    expect(await listarIds("pendente")).toEqual([]);
    expect((await executarTick(repo, new Date(t0.getTime() + 30_000))).varredura).toMatchObject({ pulou: "worker-parado" });
  });

  it("melhoria contínua desligada pelo admin: coleta, mas não varre para enfileirar", async () => {
    const { repo } = await criarTenant("Studio Desligado", { cargos: ["documentador"] });
    const c = await garantirConfig();
    await gravarConfig({ ...c, melhoriaContinua: false });
    const srv = await servidorApi(bemComportado);
    try {
      await ciclo(worker(srv.url));
      const p = await executarTick(repo, new Date());
      expect(p.varredura).toMatchObject({ pulou: "melhoria-desligada", enfileirados: 0 });
      expect(await listarIds("pendente")).toEqual([]);
    } finally {
      await srv.fechar();
    }
  });

  it("o intervalo vem da configuração do admin", async () => {
    const { repo } = await criarTenant("Studio Intervalo", { cargos: ["documentador"] });
    const c = await garantirConfig();
    await gravarConfig({ ...c, intervaloVarreduraMin: 15 });
    const srv = await servidorApi(bemComportado);
    try {
      const t0 = new Date();
      let agora = t0;
      const est = worker(srv.url, () => agora);
      await ciclo(est);
      await executarTick(repo, t0);
      await esvaziarFila(est);
      agora = new Date(t0.getTime() + 14 * 60_000);
      await ciclo(est);
      expect((await executarTick(repo, agora)).varredura).toBeNull();
      agora = new Date(t0.getTime() + 16 * 60_000);
      await ciclo(est);
      expect((await executarTick(repo, agora)).varredura).toMatchObject({ pulou: null });
    } finally {
      await srv.fechar();
    }
  });

  it("um erro no repositório não derruba o laço: o passo termina e o próximo roda", async () => {
    const { repo } = await criarTenant("Studio Erro", { cargos: ["documentador"] });
    await garantirConfig();
    const quebrado = { ...repo, lerMapa: () => Promise.reject(new Error("banco fora")), listarFuncionarios: repo.listarFuncionarios.bind(repo) } as unknown as typeof repo;
    const srv = await servidorApi(bemComportado);
    try {
      await ciclo(worker(srv.url));
      await expect(executarTick(quebrado, new Date())).resolves.toBeDefined();
    } finally {
      await srv.fechar();
    }
  });

  it("iniciar duas vezes liga um único laço (o recarregamento a quente não duplica)", async () => {
    const { repo } = await criarTenant("Studio Laço", { cargos: ["documentador"] });
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    await iniciarAgendador(repo);
    await iniciarAgendador(repo);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(globalThis.__iaAgendador).toBeDefined();
    pararAgendador();
    expect(globalThis.__iaAgendador).toBeUndefined();
  });
});
