import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EMPRESA } from "../content";

export function PitchFooter() {
  const { contato } = EMPRESA;
  return (
    <footer className="border-t border-line/60 px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <p className="font-pixel text-[10px] uppercase tracking-[2px] text-teal">
          labdatadev · gamehub — Laboratório Demarchi
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="home" size={14} /> {contato.endereco}
          </span>
          <a href={`mailto:${contato.email}`} className="inline-flex items-center gap-1.5 hover:text-white">
            <Icon name="check" size={14} /> {contato.email}
          </a>
          <a href={`tel:+55${contato.telefone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white">
            <Icon name="bolt" size={14} /> {contato.telefone}
          </a>
          <a href={contato.linkedinHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <Icon name="network" size={14} /> {contato.linkedin}
          </a>
          <a href={contato.portfolioHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <Icon name="globe" size={14} /> {contato.portfolio}
          </a>
        </div>
        <p className="text-xs text-muted/60">
          {EMPRESA.cnpj} ·{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-white">
            ver o produto
          </Link>
        </p>
      </div>
    </footer>
  );
}
