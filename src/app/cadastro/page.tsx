import Link from "next/link";
import { Wizard } from "@/features/onboarding/Wizard";
import { lerTokenConvite } from "@/features/growth/convite";
import { getRepository } from "@/lib/db";

export const metadata = { title: "Cadastro · labdatadev gamehub" };

interface PageProps {
  searchParams: Promise<{ convite?: string }>;
}

/** Só para MOSTRAR o contexto do convite (nome de quem convidou, bairro).
 *  Nunca autoritativo — o resgate de verdade re-verifica o token dentro de
 *  `cadastrar()` (GH-GROW-02). */
async function contextoConvite(token: string | undefined) {
  if (!token) return null;
  const dados = lerTokenConvite(token);
  if (!dados) return null;
  const convidante = await getRepository().lerNegocio(dados.tenantId);
  if (!convidante) return null;
  return {
    token,
    convidanteNome: convidante.nome,
    cidadeNome: dados.cidadeNome,
    bairroNome: dados.bairroNome,
  };
}

export default async function CadastroPage({ searchParams }: PageProps) {
  const { convite } = await searchParams;
  const contexto = await contextoConvite(convite);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <h1 className="mb-1 text-center text-xl font-extrabold text-white">
        Coloque seu negócio no mapa da região
      </h1>
      {contexto ? (
        <p className="mb-5 rounded-md bg-teal/15 px-3 py-2 text-center text-xs font-bold text-teal">
          Convite de {contexto.convidanteNome} — junte-se ao {contexto.bairroNome},{" "}
          {contexto.cidadeNome}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <Wizard convite={contexto} />
      <p className="mt-5 text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-bold text-teal underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
