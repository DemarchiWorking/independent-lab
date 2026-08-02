import { RecuperarSenhaForm } from "@/features/auth/RecuperarSenhaForm";

export const metadata = { title: "Recuperar senha · labdatadev gamehub" };

export default function RecuperarSenhaPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <h1 className="mb-6 text-center text-xl font-extrabold text-white">
        Esqueceu sua senha?
      </h1>
      <RecuperarSenhaForm />
    </main>
  );
}
