import Link from "next/link";
import { Wizard } from "@/features/onboarding/Wizard";

export const metadata = { title: "Cadastro · labdatadev gamehub" };

export default function CadastroPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <h1 className="mb-6 text-center text-xl font-extrabold text-white">
        Coloque seu negócio no mapa da região
      </h1>
      <Wizard />
      <p className="mt-5 text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-bold text-teal underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
