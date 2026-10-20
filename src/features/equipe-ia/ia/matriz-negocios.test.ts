import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { atributosVazios } from "@/lib/atributos";
import { FileRepository } from "@/lib/db/file-adapter";
import type { Segmento } from "@/lib/db/types";
import type { Bloco } from "../entregaveis/tipos";
import type { TipoEntregavel } from "../habilidades";
import { montarPedido } from "./prompt";
import { baselineDe, contextoDoTenant } from "./servico-ia";
import { validarSaidaIA } from "./validar";

/**
 * Matriz de negócios: a IA recebe o contexto CERTO para cada tipo de microempreendedor?
 *
 * Não chama modelo nenhum. Confere o que o app controla e que decide a qualidade e o custo:
 *  1. o pedido contém o nome, a cidade e as ofertas daquele negócio (e só dele);
 *  2. nada de um negócio aparece no pedido de outro (isolamento entre contas);
 *  3. o nicho certo é reconhecido (a IA fala com o cliente daquele ramo);
 *  4. uma "melhoria" sem mudanças (devolver o material de regras) é aceita pelo validador,
 *     ou seja, o material de regras sempre serve de rede de segurança;
 *  5. o tamanho do pedido cabe num orçamento de tokens, com custo estimado por refino.
 */

interface Perfil {
  nome: string;
  segmento: Segmento;
  cidade: string;
  bairro: string;
  ofertas: [string, string, string][];
  respostas: Record<string, unknown>;
}

const PERFIS: Perfil[] = [
  { nome: "Studio Bela Cabelos", segmento: "servico", cidade: "Mendes", bairro: "Centro", ofertas: [["Corte feminino", "Corte com lavagem e finalização.", "R$ 80"], ["Hidratação profunda", "Tratamento para cabelos ressecados.", "R$ 120"]], respostas: { equipe: "2-5", presencaDigital: "social", captacao: ["indicacao", "social"], objetivo: "mais-leads", gargalo: "perco-leads", investimento: "500-1500" } },
  { nome: "Padaria Pão Quente", segmento: "alimentacao", cidade: "Vassouras", bairro: "Centro", ofertas: [["Pão francês", "Fornadas de hora em hora.", "R$ 14 o quilo"], ["Encomenda de bolos", "Bolos para festa com 3 dias de antecedência.", "a partir de R$ 90"]], respostas: { equipe: "6-15", presencaDigital: "nada", captacao: ["porta-a-porta"], objetivo: "aparecer", gargalo: "sem-dados", investimento: "ate-500" } },
  { nome: "Elétrica Faísca", segmento: "servico", cidade: "Paraíba do Sul", bairro: "Salutaris", ofertas: [["Instalação de chuveiro", "Instalação com aterramento.", "R$ 150"], ["Quadro de luz", "Troca e organização do quadro.", "sob orçamento"]], respostas: { equipe: "so-eu", presencaDigital: "social", captacao: ["indicacao"], objetivo: "organizar", gargalo: "manual", investimento: "nao-sei" } },
  { nome: "Clínica Sorriso Vivo", segmento: "saude", cidade: "Barra do Piraí", bairro: "Centro", ofertas: [["Limpeza dental", "Profilaxia com avaliação.", "R$ 180"], ["Clareamento", "Clareamento supervisionado.", "R$ 600"]], respostas: { equipe: "6-15", presencaDigital: "site-desatualizado", captacao: ["indicacao", "ads"], objetivo: "vender-mais", gargalo: "imagem-fraca", investimento: "1500-3500" } },
  { nome: "Contábil Prumo", segmento: "contabilidade", cidade: "Volta Redonda", bairro: "Aterrado", ofertas: [["Abertura de MEI", "Abertura e orientação inicial.", "R$ 120"], ["Contabilidade mensal", "Escrituração e impostos.", "a partir de R$ 250 por mês"]], respostas: { equipe: "2-5", presencaDigital: "site-portais", captacao: ["indicacao"], objetivo: "mais-leads", gargalo: "sem-processo", investimento: "500-1500" } },
  { nome: "Loja Mundo Pet", segmento: "comercio", cidade: "Valença", bairro: "Centro", ofertas: [["Ração premium", "Ração para cães e gatos.", "R$ 189"], ["Banho e tosa", "Banho com agendamento.", "R$ 60"]], respostas: { equipe: "2-5", presencaDigital: "social", captacao: ["social", "porta-a-porta"], objetivo: "vender-mais", gargalo: "perco-leads", investimento: "ate-500" } },
  { nome: "Construtora Alicerce", segmento: "engenharia", cidade: "Resende", bairro: "Jardim Jalisco", ofertas: [["Reforma residencial", "Reformas com projeto e acompanhamento.", "sob orçamento"]], respostas: { equipe: "16-30", presencaDigital: "portais", captacao: ["portais", "indicacao"], objetivo: "mais-leads", gargalo: "sem-dados", investimento: "3500+" } },
  { nome: "Byte Certo Suporte", segmento: "tecnologia", cidade: "Barra Mansa", bairro: "Vila Maria", ofertas: [["Suporte mensal de TI", "Atendimento remoto e presencial.", "R$ 390 por mês"], ["Rede e Wi-Fi", "Projeto e instalação.", "R$ 450"]], respostas: { equipe: "so-eu", presencaDigital: "site-portais", captacao: ["indicacao", "ads"], objetivo: "automatizar", gargalo: "manual", investimento: "500-1500" } },
  { nome: "Marmitaria da Dona Lúcia", segmento: "alimentacao", cidade: "Mendes", bairro: "Sossego", ofertas: [["Marmita do dia", "Prato feito com salada.", "R$ 22"]], respostas: { equipe: "2-5", presencaDigital: "social", captacao: ["social"], objetivo: "aparecer", gargalo: "perco-leads", investimento: "ate-500" } },
  { nome: "Ateliê Mãos de Fada", segmento: "outro", cidade: "Miguel Pereira", bairro: "Centro", ofertas: [["Bolsas artesanais", "Bolsas de crochê feitas à mão.", "R$ 95"]], respostas: { equipe: "so-eu", presencaDigital: "nada", captacao: ["sem-processo"], objetivo: "mais-leads", gargalo: "imagem-fraca", investimento: "nao-sei" } },
];

const TIPOS: TipoEntregavel[] = ["canvas", "pop", "comercial", "reel", "carrossel"];
const CARGOS = ["documentador", "social-media", "editor-video", "comercial"];
/** Tokens de entrada que um pedido não deve passar (folga larga sobre o que se mede hoje). */
const TETO_ENTRADA_TOKENS = 9000;
/** Estimativa conservadora para português em JSON: 1 token ≈ 3 caracteres. */
const tokens = (texto: string) => Math.ceil(texto.length / 3);

let pasta = "";
let repo: FileRepository;
const ids = new Map<string, string>();
const anterior = process.env.GAMEHUB_DATA_DIR;

beforeAll(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "independent-lab-matriz-"));
  process.env.GAMEHUB_DATA_DIR = pasta;
  repo = new FileRepository();
  for (const p of PERFIS) {
    const negocio = await repo.criarNegocio({
      nome: p.nome,
      segmento: p.segmento,
      cidadeSlug: p.cidade.toLowerCase().replace(/[^a-z]/g, ""),
      cidadeNome: p.cidade,
      bairroNome: p.bairro,
      degrauAlvo: 2,
      xpInicial: 0,
      moedaVirtual: 500,
      atributosIniciais: atributosVazios(),
      perfilPublico: true,
      consentimentoVersao: "2026-10-20",
    });
    ids.set(p.nome, negocio.id);
    await repo.salvarOnboarding({
      tenantId: negocio.id,
      respostas: { nomeNegocio: p.nome, segmento: p.segmento, cidade: p.cidade, bairro: p.bairro, ...p.respostas } as never,
      scoreFit: 60,
      degrauAlvo: 2,
      servicosRecomendados: [],
      respondidoEm: new Date().toISOString(),
    });
    for (const [titulo, descricao, preco] of p.ofertas) await repo.criarOferta({ tenantId: negocio.id, titulo, descricao, preco, criadaEm: new Date().toISOString() });
    for (const cargo of CARGOS) await repo.contratarFuncionario(negocio.id, cargo);
  }
});

afterAll(async () => {
  process.env.GAMEHUB_DATA_DIR = anterior;
  await rm(pasta, { recursive: true, force: true });
});

/** O esquema do modelo não tem campo opcional: o que o material de regras omite, o modelo manda vazio. */
function comoModelo(b: Bloco): unknown {
  switch (b.tipo) {
    case "destaque":
      return { ...b, titulo: b.titulo ?? "", tom: b.tom ?? "info" };
    case "lista":
      return { ...b, ordenada: b.ordenada ?? false };
    case "passos":
      return { ...b, passos: b.passos.map((p) => ({ titulo: p.titulo, detalhe: p.detalhe ?? "" })) };
    case "mensagem":
      return { ...b, quando: b.quando ?? "" };
    default:
      return b;
  }
}

async function montar(p: Perfil, tipo: TipoEntregavel) {
  const info = await contextoDoTenant(repo, ids.get(p.nome) as string, tipo, new Date());
  if (!info) throw new Error(`sem contexto para ${p.nome}/${tipo}`);
  const base = baselineDe(tipo, info.ctx);
  const m = montarPedido({ tipo, ctx: info.ctx, baseline: base.documento, pacoteBase: base.pacote, anterior: null, rodada: 1, feedback: null });
  return { info, base, m };
}

describe.each(PERFIS)("negócio: $nome ($segmento)", (p) => {
  it.each(TIPOS)("%s: o pedido leva o contexto certo e nada de outro negócio", async (tipo) => {
    const { m } = await montar(p, tipo);
    const visto = m.entrada;
    expect(visto).toContain(p.nome);
    expect(visto).toContain(p.cidade);
    for (const [titulo] of p.ofertas) expect(visto, `oferta ${titulo}`).toContain(titulo);
    for (const outro of PERFIS) {
      if (outro.nome === p.nome) continue;
      expect(visto, `vazou ${outro.nome}`).not.toContain(outro.nome);
      for (const [titulo] of outro.ofertas) {
        if (!p.ofertas.some(([t]) => t === titulo)) expect(visto, `vazou oferta ${titulo}`).not.toContain(titulo);
      }
    }
    // o sistema (regras fixas) nunca carrega dado de cliente
    expect(m.sistema).not.toContain(p.nome);
  });

  it.each(TIPOS)("%s: o material de regras devolvido como melhoria é aceito (rede de segurança)", async (tipo) => {
    const { info, base, m } = await montar(p, tipo);
    const saida: unknown = tipo === "carrossel" ? base.pacote : { titulo: base.documento.titulo, subtitulo: base.documento.subtitulo, secoes: base.documento.secoes.map((s) => ({ ...s, intro: s.intro ?? "", blocos: s.blocos.map(comoModelo) })) };
    const r = validarSaidaIA(JSON.parse(JSON.stringify(saida)) as unknown, {
      tipo,
      nomeNegocio: info.ctx.nome,
      textoVisto: m.textoVisto,
      baseline: base.documento,
      pacoteBase: base.pacote,
    });
    expect(r.ok ? [] : r.problemas.map((x) => `${x.codigo}@${x.onde}`)).toEqual([]);
  });

  it("o pedido mais pesado cabe no orçamento de tokens e o custo por refino é baixo", async () => {
    let maior = 0;
    for (const tipo of TIPOS) {
      const { m } = await montar(p, tipo);
      maior = Math.max(maior, tokens(m.sistema) + tokens(m.entrada));
    }
    if (process.env.MATRIZ_RELATORIO) process.stdout.write(`MEDIDA ${p.nome}: ${maior} tokens de entrada, ~US$ ${((maior * 2 + 12000 * 10) / 1_000_000).toFixed(3)} no teto (Sonnet)
`);
    expect(maior).toBeLessThan(TETO_ENTRADA_TOKENS);
    // Sonnet 5.5 (US$ 2 / US$ 10 por 1M) com a saída no teto de 12 mil tokens
    const custo = (maior * 2 + 12000 * 10) / 1_000_000;
    expect(custo).toBeLessThan(0.2);
  });
});

describe("reconhecimento do ramo", () => {
  it("o salão é reconhecido como beleza", async () => {
    const { info } = await montar(PERFIS[0] as Perfil, "canvas");
    expect(JSON.stringify(info.ctx)).toContain("beleza");
  });

  it("negócios de ramos diferentes recebem pedidos diferentes, cada um com os seus dados", async () => {
    const textos = new Set<string>();
    for (const p of PERFIS) textos.add((await montar(p, "canvas")).m.entrada);
    expect(textos.size).toBe(PERFIS.length);
  });
});
