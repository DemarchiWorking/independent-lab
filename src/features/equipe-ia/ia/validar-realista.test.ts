import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { atributosVazios } from "@/lib/atributos";
import { FileRepository } from "@/lib/db/file-adapter";
import type { TipoEntregavel } from "../habilidades";
import { montarPedido } from "./prompt";
import { baselineDe, contextoDoTenant } from "./servico-ia";
import { validarSaidaIA } from "./validar";

/**
 * Regressão com respostas de modelo REALISTAS.
 *
 * Os testes de `validar.test.ts` estragam uma resposta de um jeito por vez. Este faz o
 * contrário: pega respostas escritas como um modelo as escreveria, para um negócio de
 * verdade, e exige que passem. Foi assim que se descobriu que (a) um plano de ação em
 * passos dentro do Canvas era recusado e (b) "O Studio Bela Cabelos atende..." era
 * recusado pelo linter de artigo, que só faz sentido para o gerador de regras.
 *
 * ATENÇÃO: estas respostas foram escritas por Claude (o autor da mudança), seguindo o
 * prompt que o app monta e SEM consultar o validador. Não são saída da API real: servem
 * para pegar regressões e atritos do validador. A prova com a API de verdade é o
 * comando \`verificar.mjs --chamada\` (ver docs/equipe-ia/IA-OPERACAO.md).
 */

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "respostas-do-modelo");
const TIPOS: TipoEntregavel[] = ["canvas", "comercial", "reel", "carrossel"];

let pasta = "";
let tenantId = "";
let repo: FileRepository;
const anterior = process.env.GAMEHUB_DATA_DIR;

beforeAll(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-realista-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
  repo = new FileRepository();
  const negocio = await repo.criarNegocio({
    nome: "Studio Bela Cabelos",
    segmento: "servico",
    cidadeSlug: "mendes",
    cidadeNome: "Mendes",
    bairroNome: "Centro",
    degrauAlvo: 2,
    xpInicial: 0,
    moedaVirtual: 500,
    atributosIniciais: atributosVazios(),
    perfilPublico: true,
    consentimentoVersao: "2026-10-20",
  });
  tenantId = negocio.id;
  await repo.salvarOnboarding({
    tenantId,
    respostas: {
      nomeNegocio: "Studio Bela Cabelos",
      segmento: "servico",
      cidade: "Mendes",
      bairro: "Centro",
      equipe: "2-5",
      presencaDigital: "social",
      captacao: ["indicacao", "instagram"],
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "500-1500",
    } as never,
    scoreFit: 70,
    degrauAlvo: 2,
    servicosRecomendados: [],
    respondidoEm: new Date().toISOString(),
  });
  for (const [titulo, descricao, preco] of [
    ["Corte feminino", "Corte com lavagem e finalização, para todos os tipos de cabelo.", "R$ 80"],
    ["Coloração e mechas", "Coloração completa ou mechas, com avaliação do cabelo antes de começar.", "a partir de R$ 180"],
    ["Hidratação profunda", "Tratamento para cabelos ressecados, com produtos profissionais.", "R$ 120"],
  ] as const) {
    await repo.criarOferta({ tenantId, titulo, descricao, preco, criadaEm: new Date().toISOString() });
  }
  for (const cargo of ["documentador", "social-media", "editor-video", "comercial"]) await repo.contratarFuncionario(tenantId, cargo);
});

afterAll(async () => {
  process.env.GAMEHUB_DATA_DIR = anterior;
  await rm(pasta, { recursive: true, force: true });
});

async function validarFixture(tipo: TipoEntregavel) {
  const info = await contextoDoTenant(repo, tenantId, tipo, new Date());
  if (!info) throw new Error("sem contexto");
  const base = baselineDe(tipo, info.ctx);
  const m = montarPedido({ tipo, ctx: info.ctx, baseline: base.documento, pacoteBase: base.pacote, anterior: null, rodada: 1, feedback: null });
  const saida = JSON.parse(await readFile(path.join(FIXTURES, `${tipo}.json`), "utf8")) as unknown;
  return validarSaidaIA(saida, { tipo, nomeNegocio: info.ctx.nome, textoVisto: m.textoVisto, baseline: base.documento, pacoteBase: base.pacote });
}

describe("respostas realistas de modelo", () => {
  it.each(TIPOS)("%s: uma resposta natural, feita para este negócio, é aceita", async (tipo) => {
    const r = await validarFixture(tipo);
    expect(r.ok ? [] : r.problemas.map((p) => `${p.codigo}@${p.onde}`)).toEqual([]);
  });

  it("a versão de IA do Canvas é mais específica que a de regras (menciona a cidade, as ofertas e o gargalo)", async () => {
    const r = await validarFixture("canvas");
    expect(r.ok).toBe(true);
    if (!r.ok || r.conteudo.tipo !== "documento") return;
    const texto = JSON.stringify(r.conteudo);
    for (const termo of ["Mendes", "Corte feminino", "Hidratação profunda", "demora", "Perfil da Empresa no Google"]) expect(texto, termo).toContain(termo);
    expect(texto).not.toMatch(/\br\$ \d/); // o "r$" em minúscula do material de regras não volta
  });

  it("o material de regras não tem mais o 'r$' em minúscula nem o custo de pessoal repetido", async () => {
    const info = await contextoDoTenant(repo, tenantId, "canvas", new Date());
    if (!info) throw new Error("sem contexto");
    const texto = JSON.stringify(baselineDe("canvas", info.ctx).documento);
    expect(texto).not.toMatch(/r\$ \d/);
    const custos = /"custos":\[(.*?)\]/.exec(texto)?.[1] ?? "";
    expect((custos.match(/[Ss]alários/g) ?? []).length).toBe(1);
  });
});
