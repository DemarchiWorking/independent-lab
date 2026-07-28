"use client";

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
            role="dialog"
            aria-label={title}
            variants={modalVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-xl rounded-md bg-panel p-4 pt-5 text-ink shadow-modal",
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
