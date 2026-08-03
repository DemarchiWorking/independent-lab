import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { WorldScreenV2 } from "@/features/world/WorldScreenV2";
import { capituloAtual } from "@/features/historia/actions";
import { CapituloGate } from "@/features/historia/CapituloGate";

export const metadata = { title: "Minha sede (preview visual) · World · labdatadev gamehub" };

/**
 * Rota irmã de `/world` (`src/app/world/page.tsx`), NÃO uma substituição —
 * ver `docs/architecture/ARQUITETURA-VISUAL-ITENS-SEDE.md`. Mesma leitura de
 * dados, mesmo Server Component; a única diferença é renderizar
 * `WorldScreenV2` (silhueta por item, `render/desenhoV2.ts`) em vez de
 * `WorldScreen`. `/world` continua exatamente como estava — esta rota existe
 * pra comparar/validar o visual novo sem risco pro que já funciona.
 */
export default async function WorldV2Page() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const repo = getRepository();
  const [negocio, sede, mobilia, funcionarios] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.lerSede(sessao.tenantId),
    repo.listarMobiliaColocada(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
  ]);
  if (!negocio) redirect("/cadastro");

  const capitulo = await capituloAtual();

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">
            labdatadev · world · preview visual
          </p>
          <h1 className="text-lg font-extrabold text-white">Minha sede</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/world"
            className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
          >
            <Icon name="grid" size={14} />
            Ver versão atual
          </Link>
          <Link
            href="/hub"
            className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
          >
            <Icon name="grid" size={14} />
            Voltar ao hub
          </Link>
        </div>
      </div>

      <CapituloGate inicial={capitulo} className="mb-4" />

      <WorldScreenV2
        sede={sede}
        mobilia={mobilia}
        moedaVirtual={negocio.moedaVirtual}
        atributos={negocio.atributos}
        funcionarios={funcionarios.map((f) => f.cargoId)}
        nivelPorCargo={Object.fromEntries(funcionarios.map((f) => [f.cargoId, f.nivel]))}
        nomeNegocio={negocio.nome}
      />
    </main>
  );
}
