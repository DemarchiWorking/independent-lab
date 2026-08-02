"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { entrar, type EstadoForm } from "./actions";

export function LoginForm() {
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    entrar,
    {},
  );

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSnappy}
      className="w-full max-w-sm rounded-md bg-panel p-5 text-ink shadow-modal"
    >
      <h2 className="text-lg font-extrabold">Entrar</h2>
      <p className="mt-1 text-xs text-[#5b6b86]">
        Acesse o painel do seu negócio.
      </p>

      <div className="mt-4 space-y-2.5">
        <input
          name="email"
          type="email"
          placeholder="voce@empresa.com.br"
          autoComplete="email"
          className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
        />
        <input
          name="senha"
          type="password"
          placeholder="Sua senha"
          autoComplete="current-password"
          className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
        />
      </div>

      <p className="mt-2 text-right text-[11px]">
        <Link href="/recuperar-senha" className="font-bold text-teal underline">
          Esqueci minha senha
        </Link>
      </p>

      {estado.erro ? (
        <p className="mt-3 rounded-sm bg-coral/15 px-3 py-2 text-xs font-bold text-coral-dark">
          {estado.erro}
        </p>
      ) : null}

      <div className="mt-4">
        <ActionButton type="submit" disabled={pendente} icon="arrow">
          {pendente ? "Entrando…" : "Entrar"}
        </ActionButton>
      </div>

      <p className="mt-4 text-center text-xs text-[#5b6b86]">
        Ainda não tem negócio no mapa?{" "}
        <Link href="/cadastro" className="font-bold text-teal underline">
          Cadastre em 10 passos
        </Link>
      </p>
    </motion.form>
  );
}
