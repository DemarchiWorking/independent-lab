import type { Transition, Variants } from "framer-motion";

/**
 * Variantes de animação compartilhadas — dão o "toque de movimento" a cada
 * troca de tela e à entrada de componentes, no espírito dos simuladores 2000s
 * (com um leve overshoot elástico, não corporativo).
 */

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 26,
  mass: 0.8,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
};

/** Transição de tela: desliza + fade (usada pelo AnimatePresence das rotas). */
export const screenVariants: Variants = {
  initial: { opacity: 0, x: 40, scale: 0.98 },
  enter: { opacity: 1, x: 0, scale: 1, transition: springSnappy },
  exit: { opacity: 0, x: -40, scale: 0.98, transition: { duration: 0.2 } },
};

/** Modal com ribbon: sobe com overshoot (efeito "pop" retrô). */
export const modalVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.94 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.15 } },
};

/** Lista com stagger — cards entram em cascata.
 *  `initial` declarado explicitamente para que ambos os labels existam no
 *  container e a propagação aos filhos fique previsível. */
export const listContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: springSnappy },
};

/** Feedback tátil de botão/hex (hover/tap). */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { y: 1, scale: 0.98 },
  transition: springSnappy,
} as const;
