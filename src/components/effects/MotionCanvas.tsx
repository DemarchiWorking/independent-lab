"use client";

// Guarda de acessibilidade + performance para qualquer efeito WebGL pesado:
// só monta o Canvas three.js no client, depois de confirmar no
// `matchMedia` que o visitante não pediu `prefers-reduced-motion`. O resto
// do site já respeita isso via CSS global (`globals.css`), mas WebGL roda
// fora do alcance do CSS.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ParticleField = dynamic(
  () => import("./ParticleField").then((m) => m.ParticleField),
  { ssr: false },
);

export function MotionCanvas({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(!query.matches);
    const listener = (e: MediaQueryListEvent) => setEnabled(!e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  if (!enabled) return null;

  return (
    <div className={className} aria-hidden="true">
      <ParticleField />
    </div>
  );
}
