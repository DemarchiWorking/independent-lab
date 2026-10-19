import Link from "next/link";

export const metadata = { title: "Página não encontrada · labdatadev gamehub" };

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">labdatadev · gamehub</p>
      <h1 className="text-xl font-extrabold text-white">Essa página não existe</h1>
      <p className="text-sm text-muted">O endereço pode ter mudado ou ter sido digitado errado.</p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-card2 px-4 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
