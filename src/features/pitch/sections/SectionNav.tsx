"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const SECOES = [
  { id: "hero", label: "Início" },
  { id: "problema", label: "Problema" },
  { id: "solucao", label: "Solução" },
  { id: "mercado", label: "Mercado" },
  { id: "tecnico", label: "Tecnologia" },
  { id: "agentes", label: "Agentes de IA" },
  { id: "gamificacao", label: "Gamificação" },
  { id: "equipe", label: "Equipe" },
  { id: "pitch-script", label: "O pitch" },
  { id: "cta", label: "Contato" },
] as const;

/** Navegação por dots (desktop only — mapa mental do deck inteiro cabe na
 *  lateral sem competir com o conteúdo). Ativa via `IntersectionObserver`,
 *  não scroll listener: mais barato e não dispara em cada pixel de scroll. */
export function SectionNav() {
  const [ativo, setAtivo] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setAtivo(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const { id } of SECOES) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Navegação da apresentação"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
    >
      {SECOES.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex items-center gap-2.5"
          aria-current={ativo === s.id ? "true" : undefined}
        >
          <span
            className={cn(
              "pointer-events-none whitespace-nowrap rounded-md bg-card2 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-hard transition-opacity duration-150 group-hover:opacity-100",
            )}
          >
            {s.label}
          </span>
          <motion.span
            animate={{
              scale: ativo === s.id ? 1.35 : 1,
              backgroundColor: ativo === s.id ? "#00D4C8" : "rgba(234,242,255,0.25)",
            }}
            transition={{ duration: 0.2 }}
            className="size-2 rounded-full"
          />
        </a>
      ))}
    </nav>
  );
}
