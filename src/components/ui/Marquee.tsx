import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Faixa de rolagem infinita (padrão skiper-ui/aceternity): duplica o
// conteúdo lado a lado e anima uma translação de -100% em loop — a
// duplicata garante que a faixa nunca mostra um "buraco" no fim do ciclo.
// Pausa no hover e respeita `prefers-reduced-motion` globalmente (ver
// `globals.css`).
interface MarqueeProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  speedSeconds?: number;
}

export function Marquee({ children, className, reverse = false, speedSeconds = 26 }: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden [--gap:2.5rem] gap-[var(--gap)]",
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            "flex shrink-0 items-center justify-around gap-[var(--gap)] animate-marquee",
            reverse ? "animation-direction-reverse" : "",
          )}
          style={{ animationDuration: `${speedSeconds}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
