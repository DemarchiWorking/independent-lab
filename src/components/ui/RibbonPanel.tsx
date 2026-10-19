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

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal-base do jogo: painel branco + ribbon coral em ângulo + X vermelho.
 *  Entra com "pop" (overshoot). Base de todas as janelas do gamehub.
 *
 *  Teclado e leitor de tela: o foco entra no painel ao abrir, fica preso nele
 *  (Tab e Shift+Tab dão a volta), Esc fecha, e ao fechar o foco volta para o
 *  botão que abriu. Sem isso, quem navega por teclado continuava "atrás" do
 *  modal, clicando em botões que nem via. */
export function RibbonPanel({
  title,
  open,
  onClose,
  children,
  className,
}: RibbonPanelProps) {
  const painelRef = useRef<HTMLDivElement | null>(null);
  // `onClose` costuma ser uma arrow nova a cada render do pai: guardá-la numa
  // ref evita refazer o efeito (e roubar o foco) a cada re-render.
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const abridor = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const painel = painelRef.current;
    const focaveis = () =>
      painel ? Array.from(painel.querySelectorAll<HTMLElement>(FOCAVEIS)) : [];

    (focaveis()[0] ?? painel)?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fecharRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const itens = focaveis();
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const dentro = painel?.contains(document.activeElement) ?? false;
      if (!dentro || (e.shiftKey && document.activeElement === primeiro)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      abridor?.focus();
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
              className="absolute -top-3 right-2.5 grid h-7 w-7 place-items-center rounded-sm bg-coral text-white shadow-[0_3px_0] shadow-coral-dark after:absolute after:-inset-2 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
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
