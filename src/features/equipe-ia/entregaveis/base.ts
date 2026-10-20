import type { GameRepository } from "@/lib/db";
import type { TipoEntregavel } from "../habilidades";
import { gerarCanvas } from "./canvas";
import { carrosselParaDocumento, gerarCarrosseis } from "./carrossel";
import { gerarKitComercial } from "./comercial";
import { montarContexto } from "./contexto";
import { gerarManualProcessos } from "./pop";
import { gerarReel, reelParaDocumento } from "./reel";
import type { ContextoNegocio, Documento } from "./tipos";

/**
 * A parte de `servico.ts` que não depende de imagem nem de HTTP: carregar o
 * contexto do negócio e gerar o material de regras. Fica à parte para que a
 * camada de IA (que roda no boot do servidor, fora de qualquer rota) não
 * precise carregar o gerador de PNG só para montar contexto.
 */

/**
 * Carrega o contexto do negócio da SESSÃO (nunca de parâmetro do cliente).
 * Parceiros só entram se a parceria foi formada E o parceiro aceitou perfil
 * público.
 */
export async function carregarContexto(
  repo: GameRepository,
  tenantId: string,
  nivelAgente: number,
  agora: Date = new Date(),
): Promise<ContextoNegocio | null> {
  const [negocio, onboarding, ofertas, vizinhos, parcerias] = await Promise.all([
    repo.lerNegocio(tenantId),
    repo.lerOnboarding(tenantId),
    repo.listarOfertas(tenantId),
    repo.listarVizinhos(tenantId),
    repo.listarParceriasFormadas(tenantId),
  ]);
  if (!negocio) return null;

  const idsParceiros = new Set(parcerias.map((p) => p.vizinhoTenantId));
  const parceiros = vizinhos.filter((v) => idsParceiros.has(v.id) && v.perfilPublico);

  return montarContexto({
    negocio,
    onboarding,
    ofertas,
    parceiros,
    nivelAgente,
    agora: agora.toISOString(),
  });
}

export function documentoDoEntregavel(tipo: TipoEntregavel, ctx: ContextoNegocio): Documento {
  switch (tipo) {
    case "canvas":
      return gerarCanvas(ctx);
    case "pop":
      return gerarManualProcessos(ctx);
    case "comercial":
      return gerarKitComercial(ctx);
    case "reel":
      return reelParaDocumento(gerarReel(ctx));
    case "carrossel":
      return carrosselParaDocumento(gerarCarrosseis(ctx));
  }
}
