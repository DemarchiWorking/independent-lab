"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface IsoRoomProps {
  children?: React.ReactNode;
  className?: string;
}

/** Cena isométrica de fundo (paredes teal + piso de madeira + grid), estilo
 *  escritório do Startup Panic. Presentational — recebe móveis/avatares como
 *  children posicionados em absoluto. */
export function IsoRoom({ children, className }: IsoRoomProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        "bg-gradient-to-b from-[#3a938a] via-[#2e7d74] to-[#c79b6e]",
        className,
      )}
    >
      {/* piso quadriculado em perspectiva */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2">
        <motion.div
          className="iso-grid absolute -inset-x-10 bottom-0 top-[-40%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      </div>
      {children}
    </div>
  );
}
