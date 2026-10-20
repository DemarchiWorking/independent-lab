"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /**
   * Abre sobre a PÁGINA inteira (portal no `body`), em vez de dentro do palco
   * do jogo. Para telas grandes, como um editor: dentro do palco o painel fica
   * espremido na moldura pequena do jogo.
   */
  tela?: boolean;
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
  tela = false,
}: RibbonPanelProps) {
  const painelRef = useRef<HTMLDivElement | null>(null);
  // O portal só existe no navegador: habilita depois de montar, para o HTML do
  // servidor e a primeira renderização do cliente serem iguais.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
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

  const conteudo = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            "inset-0 flex items-center justify-center",
            tela ? "fixed z-[70] p-3 sm:p-6" : "absolute z-30 p-6",
          )}
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
            // `cn` só junta classes (não resolve conflito): se o chamador define a
            // própria largura máxima, a padrão (max-w-xl) não pode vir junto, senão
            // a que aparecer depois no CSS vence, e "max-w-md" nunca valia nada.
            className={cn(
              "relative w-full rounded-md bg-panel p-4 pt-5 text-ink shadow-modal outline-none",
              className?.includes("max-w-") ? null : "max-w-xl",
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

  if (!tela) return conteudo;
  return montado ? createPortal(conteudo, document.body) : null;
}
