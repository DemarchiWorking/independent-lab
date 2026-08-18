import Link from "next/link";
import { GameShell } from "@/features/shell/GameShell";

export const metadata = { title: "Demo ao vivo · labdatadev gamehub" };

// Antes vivia em `/` (era a página inicial inteira). Realocado pro GH-MKT-01
// — `/` virou a landing de marketing (`LandingPage`), e este demo
// interativo (sem cadastro, dados fictícios) passa a ser um destino
// explícito linkado de lá, não mais a porta de entrada padrão.
export default function DemoPage() {
  return (
    <>
      <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 border-b border-line/60 bg-night/95 px-4 py-2.5 backdrop-blur-xl">
        <p className="text-xs text-muted">
          Isto é uma <b className="text-white">demonstração</b> — dados fictícios, nada é salvo.
        </p>
        <Link
          href="/cadastro"
          className="shrink-0 rounded-md bg-orange px-3 py-1.5 text-xs font-extrabold text-ink shadow-[0_2px_0] shadow-orange-dark"
        >
          Cadastrar meu negócio de verdade
        </Link>
      </div>
      <GameShell initialView="hub" />
    </>
  );
}
