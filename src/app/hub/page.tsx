import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { progresso } from "@/lib/gamificacao";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { missaoAtual } from "@/features/gamificacao/missoes";
import { GameShell } from "@/features/shell/GameShell";
import { capituloAtual } from "@/features/historia/actions";
import { CapituloGate } from "@/features/historia/CapituloGate";
import type { HudData } from "@/components/ui/HudBar";

export const metadata = { title: "Hub · labdatadev gamehub" };

export default async function HubPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const repo = getRepository();
  const [negocio, onboarding, vizinhos, mapa, funcionarios, sede, mobilia, trabalhos, nos] =
    await Promise.all([
      repo.lerNegocio(sessao.tenantId),
      repo.lerOnboarding(sessao.tenantId),
      repo.listarVizinhos(sessao.tenantId),
      repo.lerMapaView(),
      repo.listarFuncionarios(sessao.tenantId),
      repo.lerSede(sessao.tenantId),
      repo.listarMobiliaColocada(sessao.tenantId),
      repo.listarTrabalhosAceitos(sessao.tenantId),
      repo.listarNosDesbloqueados(sessao.tenantId),
    ]);
  if (!negocio) redirect("/cadastro");

  const prog = progresso(negocio.xp);
  const missao = missaoAtual(negocio, onboarding);

  // Relógio *lazy*: avaliado na leitura do hub, a tela que todo mundo vê
  // primeiro após entrar — é onde o capítulo do dia 0 precisa aparecer, não
  // só em quem clica em World por conta própria.
  const capitulo = await capituloAtual();

  const hud: HudData = {
    coins: negocio.moedaVirtual.toLocaleString("pt-BR"),
    network: String(vizinhos.length),
    cycleLabel: `Nv ${prog.nivel}`,
    cycleProgress: prog.pct,
    objective: missao.titulo,
    balance: DEGRAUS[negocio.degrauAtual].nome,
    alert:
      negocio.degrauAtual < negocio.degrauAlvo
        ? `Próximo alvo: ${DEGRAUS[negocio.degrauAlvo].nome}`
        : undefined,
  };

  return (
    <>
      {/* SEMPRE montado (nunca `{capitulo ? ... : null}` aqui): o próprio
          `CapituloGate` decide se mostra algo, a partir do PRIMEIRO valor de
          `capitulo` que recebeu — se este `if` externo existisse, um
          `revalidatePath` de fundo (disparado por `escolherNoCapitulo`)
          derrubaria o card no meio da leitura do jogador. */}
      <CapituloGate inicial={capitulo} />
      <GameShell
        initialView="hub"
        hud={hud}
        missao={missao}
        mapa={mapa}
        endereco={negocio.endereco}
        meuTenantId={negocio.id}
        funcionariosContratados={funcionarios.map((f) => f.cargoId)}
        degrauAtual={negocio.degrauAtual}
        sede={sede}
        mobilia={mobilia}
        moedaVirtual={negocio.moedaVirtual}
        atributos={negocio.atributos}
        trabalhosAceitos={trabalhos.map((t) => t.jobId)}
        nosDesbloqueados={nos.map((n) => n.noId)}
      />
    </>
  );
}
