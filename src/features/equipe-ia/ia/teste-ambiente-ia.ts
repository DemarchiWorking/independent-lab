import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { ciclo, criarEstado } from "../../../../ia-worker/worker.mjs";
import { atributosVazios } from "@/lib/atributos";
import { FileRepository } from "@/lib/db/file-adapter";
import type { NovoNegocio } from "@/lib/db/repository";
import type { Documento } from "../entregaveis/tipos";
import { pastaIA } from "./fila";
import { documentoComoSaida, secaoExtra } from "./teste-util-ia";

/**
 * Cenário compartilhado dos testes de ponta a ponta da IA: negócio real em
 * arquivos, o worker de verdade e um servidor HTTP local no lugar da API da
 * Anthropic. Só testes importam este arquivo.
 */

export const POLITICA_NOVA = "2026-10-20";
export const POLITICA_ANTIGA = "2026-07-28";

export function novoNegocio(nome: string, consentimentoVersao: string): NovoNegocio {
  return {
    nome,
    segmento: "servico",
    cidadeSlug: "mendes",
    cidadeNome: "Mendes",
    bairroNome: "Centro",
    degrauAlvo: 2,
    xpInicial: 0,
    moedaVirtual: 500,
    atributosIniciais: atributosVazios(),
    perfilPublico: true,
    consentimentoVersao,
  };
}

export async function criarTenant(nome = "Studio Bela Cabelos", opcoes: { politica?: string; cargos?: string[] } = {}) {
  const repo = new FileRepository();
  const negocio = await repo.criarNegocio(novoNegocio(nome, opcoes.politica ?? POLITICA_NOVA));
  for (const cargo of opcoes.cargos ?? ["documentador", "social-media"]) await repo.contratarFuncionario(negocio.id, cargo);
  await repo.criarOferta({
    tenantId: negocio.id,
    titulo: "Corte feminino",
    descricao: "Corte com lavagem. Pacote com 20% de desconto na 3ª visita.",
    preco: "R$ 80",
    criadaEm: new Date().toISOString(),
  });
  return { repo, tenantId: negocio.id };
}

// ------------------------------------------------------------------ API falsa

export interface Servidor {
  url: string;
  entradas: string[];
  fechar: () => Promise<void>;
}

export type Modelo = (tipo: "documento" | "pacote", base: Record<string, unknown>) => unknown;

/** Reflete o `documento_base` que recebeu, como um modelo bem comportado que só acrescenta uma seção. */
export const bemComportado: Modelo = (tipo, base) => {
  if (tipo === "pacote") return base;
  const saida = documentoComoSaida(base as unknown as Documento);
  saida.secoes.push(secaoExtra());
  return saida;
};

export async function servidorApi(modelo: Modelo): Promise<Servidor> {
  const entradas: string[] = [];
  const srv = createServer((req, res) => {
    let texto = "";
    req.on("data", (d: Buffer) => (texto += d.toString()));
    req.on("end", () => {
      const corpo = JSON.parse(texto) as { messages: Array<{ content: string }> };
      const entrada = corpo.messages[0].content;
      entradas.push(entrada);
      const m = /<documento_base>\n([\s\S]*?)\n<\/documento_base>/.exec(entrada);
      const base = JSON.parse(m?.[1] ?? "{}") as Record<string, unknown>;
      const saida = modelo("pautas" in base ? "pacote" : "documento", base);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(saida) }], stop_reason: "end_turn", usage: { input_tokens: 8000, output_tokens: 6000 } }));
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", ok));
  const porta = (srv.address() as AddressInfo).port;
  return { url: `http://127.0.0.1:${porta}`, entradas, fechar: () => new Promise<void>((ok) => srv.close(() => ok())) };
}

export function worker(url: string, relogio?: () => Date) {
  return criarEstado({ pasta: pastaIA(), env: { ANTHROPIC_API_KEY: "sk-ant-teste", ANTHROPIC_BASE_URL: url }, ...(relogio ? { relogio } : {}) });
}

export async function esvaziarFila(est: ReturnType<typeof worker>): Promise<number> {
  let n = 0;
  while ((await ciclo(est)).acao === "processou") n++;
  return n;
}
