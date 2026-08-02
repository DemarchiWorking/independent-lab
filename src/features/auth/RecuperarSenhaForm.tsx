"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  solicitarRecuperacao,
  confirmarRecuperacao,
  type EstadoForm,
} from "./actions";

/**
 * Recuperação de senha (GH-SEC-03) — de propósito simples: 1 e-mail, 1
 * código de 6 dígitos, 2 etapas. `email` some do controle da Server Action
 * quando a etapa muda (cada `useActionState` tem seu próprio estado), então
 * fica em state local aqui pra viajar como campo oculto na etapa 2.
 */
export function RecuperarSenhaForm() {
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");

  const [estadoPedido, acaoPedido, pendentePedido] = useActionState<
    EstadoForm,
    FormData
  >(solicitarRecuperacao, {});
  const [estadoConfirma, acaoConfirma, pendenteConfirma] = useActionState<
    EstadoForm,
    FormData
  >(confirmarRecuperacao, {});

  // só avança pra etapa 2 depois que a Server Action confirmou o envio
  useEffect(() => {
    if (estadoPedido.sucesso) setEtapa("codigo");
  }, [estadoPedido.sucesso]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSnappy}
      className="w-full max-w-sm rounded-md bg-panel p-5 text-ink shadow-modal"
    >
      {etapa === "email" ? (
        <form
          action={(fd) => {
            setEmail(String(fd.get("email") ?? "").toLowerCase());
            acaoPedido(fd);
          }}
        >
          <h2 className="text-lg font-extrabold">Recuperar senha</h2>
          <p className="mt-1 text-xs text-[#5b6b86]">
            Informe o e-mail da sua conta — enviamos um código de 6 dígitos.
          </p>

          <div className="mt-4">
            <input
              name="email"
              type="email"
              required
              placeholder="voce@empresa.com.br"
              autoComplete="email"
              className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </div>

          {estadoPedido.erro ? (
            <p className="mt-3 rounded-sm bg-coral/15 px-3 py-2 text-xs font-bold text-coral-dark">
              {estadoPedido.erro}
            </p>
          ) : null}

          <div className="mt-4">
            <ActionButton type="submit" disabled={pendentePedido} icon="arrow">
              {pendentePedido ? "Enviando…" : "Enviar código"}
            </ActionButton>
          </div>
        </form>
      ) : (
        <form action={acaoConfirma}>
          <input type="hidden" name="email" value={email} />
          <h2 className="text-lg font-extrabold">Digite o código</h2>
          <p className="mt-1 text-xs text-[#5b6b86]">
            Enviamos um código de 6 dígitos para <b>{email}</b>. Ele vale por
            15 minutos.
          </p>

          <div className="mt-4 space-y-2.5">
            <input
              name="codigo"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="000000"
              className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-center text-lg tracking-[6px] outline-none focus:border-teal"
            />
            <input
              name="novaSenha"
              type="password"
              required
              minLength={8}
              placeholder="Nova senha (mín. 8 caracteres)"
              autoComplete="new-password"
              className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </div>

          {estadoConfirma.erro ? (
            <p className="mt-3 rounded-sm bg-coral/15 px-3 py-2 text-xs font-bold text-coral-dark">
              {estadoConfirma.erro}
            </p>
          ) : null}

          <div className="mt-4">
            <ActionButton type="submit" disabled={pendenteConfirma} icon="arrow">
              {pendenteConfirma ? "Confirmando…" : "Trocar senha"}
            </ActionButton>
          </div>

          <button
            type="button"
            onClick={() => setEtapa("email")}
            className="mt-3 w-full text-center text-xs font-bold text-teal underline"
          >
            Pedir um código novo
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-[#5b6b86]">
        <Link href="/entrar" className="font-bold text-teal underline">
          Voltar para o login
        </Link>
      </p>
    </motion.div>
  );
}
