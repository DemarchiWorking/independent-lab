import { NextResponse } from "next/server";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Limitador } from "@/lib/limite";
import { mesmaOrigem } from "@/lib/origem";
import { CATALOGO_HABILIDADES, type TipoEntregavel } from "@/features/equipe-ia/habilidades";
import { autorizarIA, coletarSePreciso, contextoDoTenant, estadoIA, revogarIA, solicitarRefino } from "@/features/equipe-ia/ia/servico-ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = [...new Set(CATALOGO_HABILIDADES.flatMap((h) => (h.entregavel ? [h.entregavel] : [])))] as TipoEntregavel[];

/** Por negócio: consultas de estado e pedidos juntos. */
const limite = new Limitador(60_000, 60);

const CORPO_MAX_BYTES = 1_000;

/**
 * Estado e pedidos de IA de um entregável (GH-EQP-04).
 *
 * 🔒 Mesmas regras da rota de entregáveis: o negócio vem SEMPRE da sessão, o
 * funcionário responsável precisa estar contratado, POST só da mesma origem,
 * resposta nunca em cache. Aqui há mais uma: cada pedido custa dinheiro, então
 * o teto diário por negócio e a chave geral vivem em `solicitarRefino`, não
 * aqui, e valem também para a melhoria automática.
 */

function resposta(corpo: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return NextResponse.json(corpo, { status, headers: { "Cache-Control": "private, no-store", ...extra } });
}

const erro = (status: number, mensagem: string, extra: Record<string, string> = {}): Response => resposta({ erro: mensagem }, status, extra);

const STATUS_DO_MOTIVO = {
  desativada: 503,
  "sem-funcionario": 403,
  "sem-consentimento": 409,
  "limite-diario": 429,
  "entrada-grande": 422,
} as const;

async function tratar(request: Request, params: Promise<{ tipo: string }>, corpo: Record<string, unknown> | null): Promise<Response> {
  const { tipo } = await params;
  if (!TIPOS.includes(tipo as TipoEntregavel)) return erro(404, "Material desconhecido.");
  const tipoEntregavel = tipo as TipoEntregavel;

  if (corpo !== null && !mesmaOrigem(request)) return erro(403, "Origem não permitida.");

  const sessao = await lerSessao();
  if (!sessao) return erro(401, "Faça login para usar este recurso.");
  if (!limite.consumir(sessao.tenantId)) return erro(429, "Muitos pedidos em pouco tempo. Aguarde um minuto.", { "Retry-After": "60" });

  const repo = getRepository();
  const agora = new Date();
  const info = await contextoDoTenant(repo, sessao.tenantId, tipoEntregavel, agora);
  if (!info) return erro(403, "Contrate o Funcionário de IA responsável para usar este recurso.");

  if (corpo === null) {
    await coletarSePreciso(repo);
    return resposta(await estadoIA(repo, sessao.tenantId, tipoEntregavel, info.ctx, agora));
  }

  switch (corpo.acao) {
    case "pedir": {
      const r = await solicitarRefino(repo, sessao.tenantId, tipoEntregavel, "usuario", agora);
      console.info(JSON.stringify({ evento: "ia-pedido", tipo, ok: r.ok, ...(r.ok ? { estado: r.estado } : { motivo: r.motivo }) }));
      if (!r.ok) return erro(STATUS_DO_MOTIVO[r.motivo], r.mensagem, { "X-Motivo": r.motivo });
      return resposta({ estado: await estadoIA(repo, sessao.tenantId, tipoEntregavel, info.ctx, agora), jaEstava: r.jaEstava });
    }
    case "autorizar":
      await autorizarIA(sessao.tenantId, sessao.usuarioId, agora);
      return resposta(await estadoIA(repo, sessao.tenantId, tipoEntregavel, info.ctx, agora));
    case "revogar":
      await revogarIA(sessao.tenantId);
      return resposta(await estadoIA(repo, sessao.tenantId, tipoEntregavel, info.ctx, agora));
    default:
      return erro(400, "Ação inválida.");
  }
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
