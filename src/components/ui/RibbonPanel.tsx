"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { modalVariants } from "@/lib/motion";
import { Icon } from "./Icon";

interface RibbonPanelProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** largura máxima do painel */
  className?: string;
}

/** Modal-base do jogo: painel branco + ribbon coral em ângulo + X vermelho.
 *  Entra com "pop" (overshoot). Base de todas as janelas do gamehub. */
export function RibbonPanel({
  title,
  open,
  onClose,
  children,
  className,
}: RibbonPanelProps) {
  const painelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Comportamento de diálogo de verdade: `Esc` fecha e o foco entra no painel
   * ao abrir, voltando para quem o abriu ao fechar.
   *
   * Sem isso, quem navega por teclado abria a janela e continuava com o foco
   * lá atrás, no botão da tela — tabulando por baixo do overlay, sem saída a
   * não ser achar o X no meio da ordem de tabulação.
   *
   * `onClose` é lido por ref, NUNCA declarado como dependência: as telas
   * passam arrow inline (`onClose={() => setX(false)}`), então uma nova
   * identidade a cada render faria o efeito re-rodar e roubar o foco de volta
   * para o painel a cada tecla digitada dentro dele.
   */
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const anterior = document.activeElement;
    painelRef.current?.focus({ preventScroll: true });

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharRef.current();
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      if (anterior instanceof HTMLElement) anterior.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/55" />
          <motion.div
            ref={painelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            // recebe foco por programa (não entra na ordem de tabulação)
            tabIndex={-1}
            variants={modalVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-xl rounded-md bg-panel p-4 pt-5 text-ink shadow-modal outline-none",
              className,
            )}
          >
            <span className="clip-ribbon absolute -left-1.5 -top-3.5 rounded-sm bg-coral px-4 py-1.5 text-[13px] font-extrabold text-white shadow-[0_3px_0] shadow-coral-dark">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute -top-3 right-2.5 grid h-7 w-7 place-items-center rounded-sm bg-coral text-white shadow-[0_3px_0] shadow-coral-dark"
            >
              <Icon name="close" size={16} />
            </button>
            <div className="mt-3">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
