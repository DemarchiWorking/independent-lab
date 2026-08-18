"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface LandingLinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  className?: string;
}

const styles: Record<Variant, string> = {
  primary: "bg-orange text-ink shadow-[0_3px_0] shadow-orange-dark",
  ghost: "bg-[#e6eaf1] text-[#33415c] shadow-[0_3px_0] shadow-[#c7cedb]",
  outline: "border-2 border-teal/40 text-teal hover:border-teal/70",
};

// "sm" existe pra caber no nav mobile sem quebrar layout; "lg" é o CTA
// principal (hero + CTA final) — pedido explícito de "botão maior" pra
// leitura fácil em celular na mão de um jurado.
const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs gap-1.5 [&_svg]:size-4",
  md: "px-6 py-3 text-sm gap-2 [&_svg]:size-[18px]",
  lg: "px-8 py-4 text-base sm:text-lg gap-2.5 [&_svg]:size-5",
};

// Mesmo estilo visual do `ActionButton` (CTA em jogo), mas para navegação
// (`<Link>`) em vez de ação (`onClick`) — usado na landing (GH-MKT-01).
// Isolado do ActionButton de propósito: aquele é onClick-only e usado em
// dezenas de telas do jogo, misturar href ali arriscaria quebrar chamadas
// existentes.
export function LandingLinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
}: LandingLinkButtonProps) {
  return (
    <motion.div {...pressable} className="inline-block">
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-ui font-extrabold",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
          styles[variant],
          sizes[size],
          className || "",
        )}
      >
        {icon ? <Icon name={icon} /> : null}
        <span>{children}</span>
      </Link>
    </motion.div>
  );
}
