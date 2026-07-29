import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { WorldScreen } from "@/features/world/WorldScreen";
import { capituloAtual } from "@/features/historia/actions";
import { CapituloGate } from "@/features/historia/CapituloGate";

export const metadata = { title: "Minha sede · World · labdatadev gamehub" };

/**
 * O World tem URL própria (`/world`), fora do `GameShell`, porque é a única
 * tela do produto que precisa da largura inteira e de um canvas com ciclo de
 * vida próprio — espremê-la no palco do shell brigaria com o HUD e com as
 * transições do `AnimatePresence`.
 */
export default async function WorldPage() {
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

  // Relógio *lazy*: a narrativa é avaliada aqui, na leitura da página. Não há
  // cron nem processo de fundo — ver docs/world/EVOLUCAO-MOTOR-2026.md §5.2.
  const capitulo = await capituloAtual();

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">
            labdatadev · world
          </p>
          <h1 className="text-lg font-extrabold text-white">Minha sede</h1>
        </div>
        <Link
          href="/hub"
          className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
        >
          <Icon name="grid" size={14} />
          Voltar ao hub
        </Link>
      </div>

      {/* SEMPRE montado — ver comentário em CapituloGate.tsx sobre por que
          um `if` aqui derrubaria o card no meio da leitura do jogador. */}
      <CapituloGate inicial={capitulo} className="mb-4" />

      <WorldScreen
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
