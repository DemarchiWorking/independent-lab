"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AlertBannerProps {
  message: string;
  show?: boolean;
}

/** Faixa de aviso/prazo (estilo "Você tem X dias para pagar sua dívida"). */
export function AlertBanner({ message, show = true }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          role="status"
          className="inline-flex items-center gap-2 rounded-sm bg-alert px-3 py-1 text-[11px] font-bold text-white shadow-hard"
        >
          <span aria-hidden>⚠</span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
