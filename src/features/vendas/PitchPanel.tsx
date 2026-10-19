"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { PitchIA } from "./pitchVisita";

/**
 * Painel de proposta comercial mostrado durante a visita (Épico World —
 * ver docs/world/VISITAR-VIZINHO.md e docs/vendas/PITCH-VISITA-FUNCIONARIOS-IA.md).
 * O pitch é escolhido no SERVIDOR (ele lê os atributos do vizinho, que
 * são privados) e só o texto pronto chega ao browser. O CTA sempre leva ao fluxo de
 * contratação já existente em `/hub` → "Equipe de IA", nunca uma mutação
 * nova a partir da tela de visita.
 */
export function PitchPanel({ pitch }: { pitch: PitchIA }) {

  return (
    <div className="flex flex-col gap-2">
      <span className="flex w-fit items-center gap-1.5 rounded-pill bg-orange/20 px-2 py-0.5 font-pixel text-[8px] uppercase tracking-wide text-orange">
        <Icon name="bolt" size={10} />
        Funcionário de IA
      </span>
      <h3 className="text-sm font-extrabold leading-snug text-coral-dark">
        {pitch.headline}
      </h3>
      <p className="text-[11px] leading-relaxed text-[#33415c]">{pitch.corpo}</p>
      <Link
        href="/hub"
        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-orange px-3 py-2.5 text-xs font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
      >
        <Icon name="arrow" size={14} />
        {pitch.ctaLabel}
      </Link>
    </div>
  );
}
