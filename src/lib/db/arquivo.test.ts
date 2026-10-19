import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { atributosVazios } from "@/lib/atributos";
import { LocalAuthProvider } from "@/lib/auth/local-provider";
import { escreverJson, lerJson, pastaTenant, Trava } from "./arquivo";
import { FileRepository } from "./file-adapter";
import type { NovoNegocio } from "./repository";

let pasta = "";
const anterior = process.env.GAMEHUB_DATA_DIR;

beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
});

afterEach(async () => {
  process.env.GAMEHUB_DATA_DIR = anterior;
  await rm(pasta, { recursive: true, force: true });
});

function novoNegocio(i: number): NovoNegocio {
  return {
    nome: `Negócio ${i}`,
    segmento: "servico",
    cidadeSlug: "mendes",
    cidadeNome: "Mendes",
    bairroNome: "Centro",
    degrauAlvo: 2,
    xpInicial: 0,
    moedaVirtual: 500,
    atributosIniciais: atributosVazios(),
    perfilPublico: true,
    consentimentoVersao: "teste",
  };
}

describe("escrita e leitura de JSON", () => {
  it("arquivo inexistente devolve o padrão", async () => {
    expect(await lerJson(path.join(pasta, "nao-existe.json"), [1])).toEqual([1]);
  });

  it("arquivo corrompido lança e não é sobrescrito", async () => {
    const arquivo = path.join(pasta, "auth", "credenciais.json");
    await mkdir(path.dirname(arquivo), { recursive: true });
    await writeFile(arquivo, '[{"email": "a@b.c", "usu');
    await expect(new LocalAuthProvider().registrar("x", "novo@exemplo.com", "senha-forte-123")).rejects.toThrow(
      /corrompido/,
    );
    expect(await readFile(arquivo, "utf8")).toBe('[{"email": "a@b.c", "usu');
  });

  it("escrita atômica: guarda .bak e não deixa temporário", async () => {
    const arquivo = path.join(pasta, "x.json");
    await escreverJson(arquivo, { v: 1 });
    await escreverJson(arquivo, { v: 2 });
    expect(JSON.parse(await readFile(arquivo, "utf8"))).toEqual({ v: 2 });
    expect(JSON.parse(await readFile(`${arquivo}.bak`, "utf8"))).toEqual({ v: 1 });
    expect((await readdir(pasta)).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });
});

describe("trava reentrante", () => {
  it("serializa operações e permite chamada aninhada sem travar", async () => {
    const trava = new Trava();
    const ordem: string[] = [];
    const lenta = trava.exclusivo(async () => {
      ordem.push("a-inicio");
      await new Promise((r) => setTimeout(r, 20));
      await trava.exclusivo(async () => ordem.push("a-aninhada"));
      ordem.push("a-fim");
    });
    const rapida = trava.exclusivo(async () => ordem.push("b"));
    await Promise.all([lenta, rapida]);
    expect(ordem).toEqual(["a-inicio", "a-aninhada", "a-fim", "b"]);
  });
});

describe("modo arquivo sob concorrência", () => {
  it("50 cadastros simultâneos: todos persistem, com lotes únicos e índice completo", async () => {
    const repo = new FileRepository();
    const auth = new LocalAuthProvider();
    await Promise.all(
      Array.from({ length: 50 }, async (_, i) => {
        const { usuarioId } = await auth.registrar(`p${i}`, `p${i}@exemplo.com`, "senha-forte-123");
        const negocio = await repo.criarNegocio(novoNegocio(i));
        await repo.vincularMembro({
          id: usuarioId,
          tenantId: negocio.id,
          nome: `p${i}`,
          email: `p${i}@exemplo.com`,
          papel: "dono",
          criadoEm: new Date().toISOString(),
        });
      }),
    );

    const credenciais = JSON.parse(await readFile(path.join(pasta, "auth", "credenciais.json"), "utf8"));
    expect(credenciais).toHaveLength(50);

    const indice = JSON.parse(await readFile(path.join(pasta, "index", "membros.json"), "utf8"));
    expect(Object.keys(indice)).toHaveLength(50);

    const mapa = await repo.lerMapa();
    const lotes = mapa.cidades
      .flatMap((c) => c.bairros)
      .flatMap((b) => b.quarteiroes)
      .flatMap((q) => q.lotes.filter((l) => l.tenantId).map((l) => `${q.id}:${l.numero}`));
    expect(lotes).toHaveLength(50);
    expect(new Set(lotes).size).toBe(50);
  }, 60_000);

  it("registrarMarco simultâneo devolve true uma vez só", async () => {
    const repo = new FileRepository();
    const negocio = await repo.criarNegocio(novoNegocio(1));
    const resultados = await Promise.all(
      Array.from({ length: 20 }, () => repo.registrarMarco(negocio.id, "diagnostico_agendado")),
    );
    expect(resultados.filter(Boolean)).toHaveLength(1);
  });

  it("compras simultâneas não gastam o mesmo saldo duas vezes", async () => {
    const repo = new FileRepository();
    const negocio = await repo.criarNegocio(novoNegocio(1));
    await repo.lerSede(negocio.id);
    // saldo 500, cada compra custa 300: só uma pode passar
    const tentativas = await Promise.allSettled(
      [0, 1, 2].map((slot) => repo.comprarMobilia(negocio.id, "mesa-trabalho", slot, 300)),
    );
    expect(tentativas.filter((t) => t.status === "fulfilled")).toHaveLength(1);
    expect((await repo.lerNegocio(negocio.id))?.moedaVirtual).toBe(200);
  });
});

describe("ids de tenant em caminhos", () => {
  it("recusa id que sairia da pasta de dados", () => {
    expect(() => pastaTenant("../../etc")).toThrow();
    expect(() => pastaTenant("a1b2c3d4e5f6a1b2c3d4e5f6/..")).toThrow();
  });

  it("leitura com id inválido é 'não encontrado', sem criar pasta", async () => {
    const repo = new FileRepository();
    expect(await repo.lerNegocio("../../x")).toBeNull();
    await repo.lerSede("a1b2c3d4e5f6a1b2c3d4e5f6");
    expect(await readdir(pasta)).not.toContain("tenants");
  });
});
