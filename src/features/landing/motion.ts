import type { Variants } from "framer-motion";

/** Variantes de entrada compartilhadas por todas as seções da landing —
 *  centralizadas aqui pra evitar duplicar o mesmo objeto em cada arquivo de
 *  seção (ver `sections/`). */
export const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
export const stagger: Variants = { visible: { transition: { staggerChildren: 0.09 } } };
