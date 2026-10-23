"use client";

import { useState } from "react";
import { CapituloCard } from "./CapituloCard";
import { capituloAtual, type CapituloAberto } from "./actions";

/**
 * Ponte cliente entre o dado do servidor e o card de história.
 *
 * Necessária porque `escolherNoCapitulo` chama `revalidatePath("/hub")` (e
 * `/world`, `/painel`) — o Next.js refaz o Server Component da rota assim
 * que a Server Action resolve, e nesse instante `capituloAtual()` já devolve
 * `null` (o capítulo acabou de ser marcado como resolvido). Sem esta ponte,
 * o React desmontaria o `CapituloCard` — e o `desfecho` da escolha — antes
 * do jogador chegar a ler.
 *
 * A correção: capturar o capítulo inicial em estado do CLIENTE, que não
 * resincroniza com a prop em re-renders subsequentes — só fecha quando o
 * jogador confirma (`aoFechar`), nunca por um refresh alheio de fundo.
 *
 * Ao confirmar, o gate pergunta ao servidor pelo PRÓXIMO capítulo em vez de
 * simplesmente sumir. No dia 0 vêm duas cartas seguidas (a chegada e a
 * parceria do Laboratório, que traz a moeda do Canvas); sem isso, a segunda
 * só apareceria depois de recarregar a página — e o jogador novo, sem saber
 * que existe, ficaria com 🪙 100 olhando para um botão que custa 300.
 */
export function CapituloGate({
  inicial,
}: {
  inicial: CapituloAberto | null;
}) {
  const [capitulo, setCapitulo] = useState(inicial);
  if (!capitulo) return null;
  return (
    // A carta é um overlay (não um bloco acima do jogo): inline ela empurrava a
    // cena para fora da primeira tela — no HD e no celular o jogador via só a
    // carta e precisava rolar para descobrir que existia um jogo embaixo. Como
    // overlay rola sozinha quando é maior que a janela.
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-3 sm:p-6"
    >
      <div className="mx-auto w-full max-w-xl py-4">
      <CapituloCard
        key={capitulo.capitulo.id}
        capitulo={capitulo.capitulo}
        diaDoNegocio={capitulo.diaDoNegocio}
        moedaVirtual={capitulo.moedaVirtual}
        aoFechar={async () => {
          setCapitulo(null);
          try {
            setCapitulo(await capituloAtual());
          } catch {
            // sem rede: a próxima carta aparece no próximo carregamento
          }
        }}
      />
      </div>
    </div>
  );
}
