import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Padrão "text shimmer" (cult-ui/aceternity): faixa de brilho varrendo o
// texto em loop — ver `.text-shimmer` em `globals.css`. Puro CSS (sem JS),
// já herda o `prefers-reduced-motion` global do projeto.
export function TextShimmer({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-shimmer", className)}>{children}</span>;
}
