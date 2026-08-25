import type { Variants } from "framer-motion";

/** Mesmas variantes da landing (`features/landing/motion.ts`) — duplicado
 *  de propósito pra manter `features/pitch/` self-contained, mesmo padrão
 *  que a landing já usa (`fadeUp`/`stagger` centralizados por feature). */
export const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
export const stagger: Variants = { visible: { transition: { staggerChildren: 0.09 } } };
