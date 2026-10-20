import { NextResponse } from "next/server";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Limitador } from "@/lib/limite";
import { mesmaOrigem } from "@/lib/origem";
import { cargoDoEntregavel, type TipoEntregavel } from "@/features/equipe-ia/habilidades";
import { nomeDeArquivo } from "@/features/equipe-ia/entregaveis/linguagem";
import { auditarDocumento, resumirProblemas } from "@/features/equipe-ia/entregaveis/qualidade";
import { documentoParaHtml } from "@/features/equipe-ia/entregaveis/render/html";
import { documentoParaMarkdown } from "@/features/equipe-ia/entregaveis/render/markdown";
import {
  carregarContexto,
  imagemDoSlide,
  lerPedidoImagem,
  prepararPauta,
  SAIDAS_POR_TIPO,
  zipDoCarrossel,
  type SaidaEntregavel,
} from "@/features/equipe-ia/entregaveis/servico";
import type { Documento } from "@/features/equipe-ia/entregaveis/tipos";
import { coletarSePreciso, entregavelEfetivo } from "@/features/equipe-ia/ia/servico-ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = Object.keys(SAIDAS_POR_TIPO) as TipoEntregavel[];

/** Por negócio: pedidos de qualquer tipo, e imagens (que custam CPU) à parte. */
const limiteGeral = new Limitador(60_000, 40);
const limiteImagens = new Limitador(60_000, 24);

/** O corpo de um POST de edição tem poucos KB; acima disso é abuso. */
const CORPO_MAX_BYTES = 24_000;

/**
 * Entregáveis dos Funcionários de IA (GH-EQP-04).
 *
 * 🔒 REGRAS DESTA ROTA — leia antes de mexer:
 *
 * 1. O tenant vem SEMPRE da sessão assinada (`lerSessao()`), nunca de query
 *    param, path ou corpo. O documento carrega respostas de cadastro (gargalo,
 *    orçamento, equipe): aceitar um `tenantId` do cliente vazaria o
 *    diagnóstico comercial de qualquer negócio.
 * 2. O entregável só existe se o cargo que o produz estiver contratado; o nível
 *    do funcionário (que define a profundidade) vem do banco, não do cliente.
 * 3. Toda entrada é validada contra lista; o que não bate vira 400, nunca um
 *    valor "corrigido" em silêncio.
 * 4. POST (edição de carrossel) só aceita a mesma origem: um site de terceiros
 *    não consegue fazer o navegador do usuário gerar imagens em nome dele.
 * 5. Limite de uso por negócio: gerar PNG consome CPU do servidor compartilhado.
 * 6. Resposta nunca vai para cache de proxy (`private, no-store`) e o log não
 *    leva dado pessoal — só tipo, saída, nível e tempo.
 *
 * Saídas: `html` (imprimir ou salvar em PDF), `md`, `json` (integração e
 * estúdio) e, para carrossel, `png` (um slide) e `zip` (todos os slides).
 */

function resposta(corpo: BodyInit, tipo: string, extra: Record<string, string> = {}): Response {
  return new Response(corpo, {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": "private, no-store",
      ...extra,
    },
  });
}

function erro(status: number, mensagem: string, extra: Record<string, string> = {}): Response {
  return NextResponse.json({ erro: mensagem }, { status, headers: { "Cache-Control": "private, no-store", ...extra } });
}

/** Nome do arquivo no `Content-Disposition`: ASCII garantido por `nomeDeArquivo`. */
function anexo(nome: string, baixar: boolean): Record<string, string> {
  return { "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"` };
}

function saidaValida(tipo: TipoEntregavel, valor: unknown, padrao: SaidaEntregavel): SaidaEntregavel | null {
  const saida = (typeof valor === "string" && valor ? valor : padrao) as SaidaEntregavel;
  return SAIDAS_POR_TIPO[tipo].includes(saida) ? saida : null;
}

async function tratar(
  request: Request,
  params: Promise<{ tipo: string }>,
  corpo: Record<string, unknown> | null,
): Promise<Response> {
  const inicio = Date.now();
  const { tipo } = await params;
  if (!TIPOS.includes(tipo as TipoEntregavel)) return erro(404, "Entregável desconhecido.");
  const tipoEntregavel = tipo as TipoEntregavel;

  if (corpo !== null && !mesmaOrigem(request)) return erro(403, "Origem não permitida.");

  const sessao = await lerSessao();
  if (!sessao) return erro(401, "Faça login para gerar este material.");

  if (!limiteGeral.consumir(sessao.tenantId)) {
    return erro(429, "Muitos pedidos em pouco tempo. Aguarde um minuto e tente de novo.", { "Retry-After": "60" });
  }

  const origem = corpo ?? Object.fromEntries(new URL(request.url).searchParams);
  const saida = saidaValida(tipoEntregavel, origem.saida, corpo ? "png" : "html");
  if (!saida) return erro(400, "Formato de saída inválido para este material.");
  const baixar = origem.baixar === "1" || origem.baixar === 1 || origem.baixar === true;

  const repo = getRepository();
  const funcionarios = await repo.listarFuncionarios(sessao.tenantId);
  const cargoId = cargoDoEntregavel(tipoEntregavel);
  const funcionario = funcionarios.find((f) => f.cargoId === cargoId);
  if (!funcionario) {
    return erro(403, "Contrate o Funcionário de IA responsável para gerar este material.");
  }

  const agora = new Date();
  const ctx = await carregarContexto(repo, sessao.tenantId, funcionario.nivel, agora);
  if (!ctx) return erro(404, "Negócio não encontrado.");
  // O que a IA terminou aparece na hora, sem esperar o próximo passo do agendador.
  await coletarSePreciso(repo);
  // A versão de IA (se existe e vale para os dados de hoje) ou o material de regras.
  const efetivo = await entregavelEfetivo(sessao.tenantId, tipoEntregavel, ctx);
  const base = nomeDeArquivo(ctx.nome);

  const registrar = () =>
    console.info(
      JSON.stringify({ evento: "entregavel", tipo, saida, nivel: ctx.nivel, ia: efetivo.versao?.n ?? 0, tenant: sessao.tenantId, ms: Date.now() - inicio }),
    );

  // ---- imagens do carrossel (PNG de um slide ou ZIP de todos)
  if (saida === "png" || saida === "zip") {
    const lido = lerPedidoImagem(origem);
    if (!lido.ok) return erro(lido.status, lido.erro);
    const pedido = lido.valor;
    if (saida === "png" && pedido.slide === null) return erro(400, "Informe qual slide baixar.");

    const pacote = efetivo.pacote;
    if (!pacote) return erro(404, "Material não encontrado.");
    const pauta = prepararPauta(pacote, pedido);
    if (!pauta.ok) return erro(pauta.status, pauta.erro);

    const custo = saida === "png" ? 1 : pauta.valor.slides.length;
    for (let i = 0; i < custo; i++) {
      if (!limiteImagens.consumir(sessao.tenantId)) {
        return erro(429, "Muitas imagens em pouco tempo. Aguarde um minuto e tente de novo.", { "Retry-After": "60" });
      }
    }

    if (saida === "png") {
      const bytes = await imagemDoSlide(pacote, pauta.valor, pedido, pedido.slide ?? 1);
      registrar();
      const nome = `${base}-${pedido.pautaId}-${String(pedido.slide).padStart(2, "0")}.png`;
      return resposta(bytes as BodyInit, "image/png", anexo(nome, baixar));
    }
    const zip = await zipDoCarrossel(pacote, pauta.valor, pedido, agora);
    registrar();
    return resposta(zip as BodyInit, "application/zip", anexo(`${base}-${pedido.pautaId}.zip`, true));
  }

  // ---- documentos (HTML, Markdown e JSON)
  const documento: Documento = efetivo.documento;
  const extra: Record<string, unknown> | null = efetivo.pacote ? { pacote: efetivo.pacote } : null;

  // Alarme de regressão: o linter olha o RESULTADO. Se algum material sair com
  // "undefined", campo solto ou dado privado em texto público, o log mostra o
  // código do problema (nunca o conteúdo) e a regressão aparece em produção.
  const problemas = auditarDocumento(documento, {
    nomeNegocio: ctx.nome,
    publico: documento.meta.circulacao === "publico",
    permitirColchetes: tipoEntregavel === "carrossel",
  });
  if (problemas.length > 0) {
    console.warn(JSON.stringify({ evento: "entregavel-qualidade", tipo, problemas: resumirProblemas(problemas) }));
  }

  registrar();

  if (saida === "json") {
    const dados = extra ? { ...extra, documento } : documento;
    return resposta(JSON.stringify(dados), "application/json; charset=utf-8", anexo(`${tipo}-${base}.json`, baixar));
  }
  if (saida === "md") {
    return resposta(documentoParaMarkdown(documento), "text/markdown; charset=utf-8", anexo(`${tipo}-${base}.md`, true));
  }
  // Por padrão o HTML é baixado (o link do app); `ver=1` abre no navegador, para imprimir.
  const ver = origem.ver === "1";
  return resposta(documentoParaHtml(documento), "text/html; charset=utf-8", anexo(`${tipo}-${base}.html`, !ver));
}

export async function GET(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  return tratar(request, params, null);
}

export async function POST(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > CORPO_MAX_BYTES) return erro(413, "Pedido grande demais.");
  let corpo: unknown;
  try {
    const texto = await request.text();
    if (texto.length > CORPO_MAX_BYTES) return erro(413, "Pedido grande demais.");
    corpo = JSON.parse(texto);
  } catch {
    return erro(400, "Corpo do pedido inválido.");
  }
  if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) return erro(400, "Corpo do pedido inválido.");
  return tratar(request, params, corpo as Record<string, unknown>);
}
