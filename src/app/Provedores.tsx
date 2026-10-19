"use client";

import { MotionConfig } from "framer-motion";

/**
 * Provedores globais de cliente. `reducedMotion="user"` faz toda animação do
 * Framer Motion respeitar a preferência "reduzir movimento" do sistema; antes
 * só a media query do CSS respeitava, e as molas e pulsos continuavam.
 */
export function Provedores({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
