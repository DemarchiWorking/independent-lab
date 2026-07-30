"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable } from "@/lib/motion";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ATRIBUTO_BG_CLASS } from "@/lib/atributos";
import type { AtributoChave } from "@tokens";

/**
 * "Quem está na sala" — a mesma conversa do balão, por botão de verdade.
 *
 * Não é um extra: o canvas é `role="img"` e o balão só existe em pixels, então
 * sem esta lista a feature seria inacessível por teclado e leitor de tela. É a
 * mesma regra que a própria `WorldCanvas` já documenta ("o canvas é a camada de
 * deleite, nunca a única via"), e de quebra é o caminho confiável de validação
 * em navegador headless, onde o hit-test do Pixi depende de frames renderizados.
 */

export interface PessoaNaSala {
  avatarId: string;
  nome: string;
  papel: string;
  icon: IconName;
  /** eixo que tinge o chip — ausente para o dono/visitante */
  eixo?: AtributoChave;
  /** o jogador pode conversar com esta pessoa? */
  conversavel: boolean;
}

interface ListaNaSalaProps {
  pessoas: readonly PessoaNaSala[];
  onConversar: (avatarId: string) => void;
  /** mostrado quando não há NINGUÉM com quem conversar (sala só com o jogador) */
  dicaVazia?: React.ReactNode;
}

export function ListaNaSala({ pessoas, onConversar, dicaVazia }: ListaNaSalaProps) {
  const alguemParaConversar = pessoas.some((p) => p.conversavel);

  return (
    <div>
      <b className="mb-1.5 block text-[11px] text-[#5b6b86]">Quem está na sala</b>
      <motion.ul
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="flex flex-col gap-1.5"
      >
        {pessoas.map((p) => {
          const conteudo = (
            <>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-sm text-white",
                  p.eixo ? ATRIBUTO_BG_CLASS[p.eixo] : "bg-orange text-ink",
                )}
              >
                <Icon name={p.icon} size={14} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <b className="block truncate text-[11px]">{p.nome}</b>
                <span className="block truncate text-[10px] text-[#5b6b86]">
                  {p.papel}
                </span>
              </span>
            </>
          );

          return (
            <motion.li key={p.avatarId} variants={listItem}>
              {p.conversavel ? (
                <motion.button
                  type="button"
                  {...pressable}
                  data-testid={`conversar-${p.avatarId}`}
                  onClick={() => onConversar(p.avatarId)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-sm bg-[#f1f4f9] p-1.5 text-left transition-colors hover:bg-[#e6edf7]"
                >
                  {conteudo}
                  <Icon
                    name="chevron"
                    size={13}
                    className="-rotate-90 shrink-0 text-[#5b6b86]"
                  />
                </motion.button>
              ) : (
                <div className="flex w-full items-center gap-2 rounded-sm p-1.5 opacity-70">
                  {conteudo}
                </div>
              )}
            </motion.li>
          );
        })}
      </motion.ul>

      {/* A dica só faz sentido se existe alguém para conversar. Numa sala
          recém-criada o jogador está sozinho, e mandá-lo "chegar perto de
          alguém" seria instrução para uma ação impossível — o pior tipo de
          texto de UI. */}
      {alguemParaConversar ? (
        <p className="mt-1.5 text-[10px] leading-snug text-[#8494ad]">
          Chegue perto de alguém na sala e clique no balão — ou use esta lista.
        </p>
      ) : (
        (dicaVazia ?? null)
      )}
    </div>
  );
}
