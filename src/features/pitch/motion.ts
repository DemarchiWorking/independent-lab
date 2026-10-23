import type { Variants } from "framer-motion";

/** Variantes do `/pitch` — mais "premium" que a landing de propósito
 *  (blur + leve escala junto do fade/translate): é uma apresentação pra
 *  banca, não o produto em si, então a entrada pode ser mais cinematográfica
 *  sem contradizer o resto do design system do jogo. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
};
export const stagger: Variants = { visible: { transition: { staggerChildren: 0.09 } } };

/** Escala de entrada, sem translate — para elementos que já nascem
 *  centralizados (cards de destaque, diagramas). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};
