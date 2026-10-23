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
  className = "mx-auto w-full max-w-6xl px-3 pt-6",
}: {
  inicial: CapituloAberto | null;
  /** classe do wrapper — ajuste por página para não duplicar padding de um
   *  `<main>` que já centraliza (ex.: `/world` já tem `px-3`) */
  className?: string;
}) {
  const [capitulo, setCapitulo] = useState(inicial);
  if (!capitulo) return null;
  return (
    <div className={className}>
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
  );
}
