"use client";

import { Icon } from "@/components/ui/Icon";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { PITCH_NAV } from "../content";

export function PitchNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line/60 bg-night/85 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 font-pixel text-[9px] uppercase tracking-[1.5px] text-teal sm:text-[11px] sm:tracking-[3px]">
            <span className="sm:hidden">gamehub</span>
            <span className="hidden sm:inline">{PITCH_NAV.marca}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-1 font-pixel text-[8px] uppercase tracking-[1px] text-orange md:inline-flex">
            <Icon name="star" size={10} /> {PITCH_NAV.badge}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            title="Salvar apresentação em PDF (A4)"
            className="hidden items-center gap-1.5 rounded-md border-2 border-line px-3 py-1.5 text-xs font-extrabold text-muted transition-colors hover:border-teal/50 hover:text-white sm:inline-flex"
          >
            <Icon name="file" size={14} /> Salvar em PDF
          </button>
          <LandingLinkButton href="/" variant="outline" size="sm">
            {PITCH_NAV.voltar}
          </LandingLinkButton>
        </div>
      </div>
    </nav>
  );
}
