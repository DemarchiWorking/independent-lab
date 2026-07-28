import { ImageResponse } from "next/og";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { color } from "@tokens";
import { cargoDoEntregavel, type TipoEntregavel } from "@/features/equipe-ia/habilidades";
import { gerarCanvas } from "@/features/equipe-ia/entregaveis/canvas";
import { gerarPost } from "@/features/equipe-ia/entregaveis/post";
import { gerarScript } from "@/features/equipe-ia/entregaveis/script";
import { canvasParaHtml, scriptParaHtml } from "@/features/equipe-ia/entregaveis/render";
import { perfilDoNegocio } from "@/features/equipe-ia/entregaveis/tipos";
import { vocabulario } from "@/features/equipe-ia/entregaveis/vocabulario";

export const runtime = "nodejs";

const TIPOS: readonly TipoEntregavel[] = ["canvas", "post", "script"];

/**
 * Download dos entregáveis dos Funcionários de IA (GH-EQP-04).
 *
 * 🔒 REGRA DE MULTI-TENANCY DESTA ROTA: o tenant vem SEMPRE da sessão
 * assinada (`lerSessao()`), **nunca** de query param ou path. Diferente de
 * `/api/og/conquista` (que é público de propósito e recebe `tenantId`
 * porque só mostra fachada pública), aqui o canvas carrega dados de
 * onboarding — faixa de investimento, gargalo declarado. Esse é o dado
 * mais sensível do sistema (ver `GH-GROW-05` no backlog). Aceitar um
 * `tenantId` do cliente aqui seria vazar o diagnóstico comercial de
 * qualquer negócio para qualquer visitante.
 *
 * Uma rota só para os 3 tipos de propósito: um único ponto de
 * autenticação para auditar, em vez de três que podem divergir.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const { tipo } = await params;
  if (!TIPOS.includes(tipo as TipoEntregavel)) {
    return new Response("Entregável desconhecido.", { status: 404 });
  }
  const tipoEntregavel = tipo as TipoEntregavel;

  const sessao = await lerSessao();
  if (!sessao) return new Response("Não autenticado.", { status: 401 });

  const repo = getRepository();
  const [negocio, onboarding, funcionarios] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.lerOnboarding(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
  ]);
  if (!negocio) return new Response("Negócio não encontrado.", { status: 404 });

  // o entregável só existe se o cargo que o produz estiver contratado —
  // mesma regra do jogo, checada no servidor e não só escondendo o botão
  const cargoId = cargoDoEntregavel(tipoEntregavel);
  const funcionario = funcionarios.find((f) => f.cargoId === cargoId);
  if (!funcionario) {
    return new Response(
      "Contrate o Funcionário de IA responsável para gerar este material.",
      { status: 403 },
    );
  }

  const perfil = perfilDoNegocio(negocio, onboarding, funcionario.nivel);
  const nomeArquivo = arquivoSeguro(negocio.nome);

  if (tipoEntregavel === "post") {
    const post = gerarPost(perfil);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: color.bg.night,
            padding: 72,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 24,
                color: color.brand.teal,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {negocio.nome}
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "white",
                marginTop: 24,
                lineHeight: 1.15,
              }}
            >
              {post.headline}
            </div>
            <div
              style={{
                fontSize: 30,
                color: color.text.muted,
                marginTop: 28,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
              }}
            >
              {post.corpo}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: color.text.ink,
                backgroundColor: color.brand.orange,
                padding: "16px 28px",
                borderRadius: 12,
                alignSelf: "flex-start",
              }}
            >
              {post.cta}
            </div>
            <div style={{ fontSize: 24, color: color.brand.teal, marginTop: 24 }}>
              {post.hashtags.join("  ")}
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
        headers: {
          "Content-Disposition": `attachment; filename="post-${nomeArquivo}.png"`,
        },
      },
    );
  }

  const html =
    tipoEntregavel === "canvas"
      ? canvasParaHtml(gerarCanvas(perfil))
      : scriptParaHtml(
          gerarScript(perfil),
          `${vocabulario(perfil.segmento).oQueVende} · ${perfil.cidade}`,
        );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipoEntregavel}-${nomeArquivo}.html"`,
      // material do próprio tenant: nunca deve ser guardado por proxy/CDN
      "Cache-Control": "private, no-store",
    },
  });
}

/** Nome de arquivo seguro a partir do nome do negócio — evita quebrar o
 *  header `Content-Disposition` com aspas/acento/barra. */
function arquivoSeguro(nome: string): string {
  return (
    nome
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "negocio"
  );
}
