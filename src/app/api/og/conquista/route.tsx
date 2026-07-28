import { ImageResponse } from "next/og";
import { getRepository } from "@/lib/db";
import { conquistaPorId } from "@/features/conquistas/catalogo";
import type { ContextoConquistas } from "@/features/conquistas/catalogo";

export const runtime = "nodejs";

/**
 * Imagem OG dinâmica de uma conquista (GH-GROW-03) — o dono decide quando
 * compartilhar (link gerado só a partir do painel, nunca postado sozinho
 * pelo app). Whitelist idêntica à página pública (GH-GROW-01): só nome do
 * negócio e o texto da conquista — nunca XP/moeda/atributos brutos.
 *
 * Pública de propósito (sem sessão): é assim que redes sociais conseguem
 * buscar a imagem ao gerar o preview do link compartilhado.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const conquistaId = searchParams.get("conquistaId");

  const conquista = conquistaId ? conquistaPorId(conquistaId) : undefined;
  const negocio = tenantId ? await getRepository().lerNegocio(tenantId) : null;

  if (!conquista || !negocio) {
    return new ImageResponse(<Moldura>Conquista não encontrada</Moldura>, {
      width: 1200,
      height: 630,
    });
  }

  const repo = getRepository();
  const [funcionarios, parcerias, nos, sede] = await Promise.all([
    repo.listarFuncionarios(negocio.id),
    repo.listarParceriasFormadas(negocio.id),
    repo.listarNosDesbloqueados(negocio.id),
    repo.lerSede(negocio.id),
  ]);
  const ctx: ContextoConquistas = {
    negocio,
    totalFuncionarios: funcionarios.length,
    totalParcerias: parcerias.length,
    totalNosDesbloqueados: nos.length,
    nivelSede: sede.nivel,
  };

  if (!conquista.condicao(ctx)) {
    return new ImageResponse(<Moldura>Conquista ainda não desbloqueada</Moldura>, {
      width: 1200,
      height: 630,
    });
  }

  return new ImageResponse(
    (
      <Moldura>
        <div style={{ fontSize: 28, color: "#00D4C8", letterSpacing: 4, textTransform: "uppercase" }}>
          Conquista desbloqueada
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "white", marginTop: 16 }}>
          {conquista.nome}
        </div>
        <div style={{ fontSize: 28, color: "#94A3B8", marginTop: 12, maxWidth: 900 }}>
          {conquista.descricao}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#F59E0B", marginTop: 40 }}>
          {negocio.nome}
        </div>
      </Moldura>
    ),
    { width: 1200, height: 630 },
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#080E1D",
        padding: 60,
        textAlign: "center",
      }}
    >
      {children}
      <div style={{ position: "absolute", bottom: 32, fontSize: 22, color: "#5B6B86" }}>
        labdatadev · gamehub
      </div>
    </div>
  );
}
