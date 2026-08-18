import Link from "next/link";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { NAV } from "../content";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line/60 bg-night/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Um único ponto de corte (`sm`, 640px) pros dois ajustes de
            mobile — testado com Playwright que dois breakpoints
            independentes (brand abreviada + "Entrar") na mesma faixa
            estreita (~400px) colidiam sem espaço entre si. Abaixo de `sm`:
            marca abreviada pra "gamehub" (nunca `truncate` cortando no
            meio) e "Entrar" escondido (continua acessível em /entrar). */}
        <span className="shrink-0 font-pixel text-[9px] uppercase tracking-[1.5px] text-teal sm:text-[11px] sm:tracking-[3px]">
          <span className="sm:hidden">gamehub</span>
          <span className="hidden sm:inline">{NAV.marca}</span>
        </span>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/entrar"
            className="hidden text-sm font-bold text-muted transition-colors hover:text-white sm:inline"
          >
            {NAV.entrar}
          </Link>
          <LandingLinkButton href="/cadastro" icon="arrow" size="sm">
            {NAV.cta}
          </LandingLinkButton>
        </div>
      </div>
    </nav>
  );
}
