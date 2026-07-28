"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { enviarSolicitacaoContato } from "./actions";

/** Formulário de contato intermediado da página pública (GH-GROW-01) — o
 *  visitante deixa o PRÓPRIO contato, nunca vê o e-mail/telefone do dono. */
export function ContatoForm({ tenantId }: { tenantId: string }) {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const enviar = () => {
    setResultado(null);
    iniciar(async () => {
      const r = await enviarSolicitacaoContato(tenantId, nome, contato, mensagem);
      if (r.ok) {
        setResultado({ ok: true, texto: "Mensagem enviada! O negócio vai te responder pelo contato informado." });
        setNome("");
        setContato("");
        setMensagem("");
      } else {
        setResultado({ ok: false, texto: r.erro ?? "Não foi possível enviar." });
      }
    });
  };

  return (
    <div className="space-y-2.5 rounded-md bg-card2/60 p-4">
      <h2 className="text-sm font-extrabold text-teal">Entrar em contato</h2>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
      />
      <input
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        placeholder="Seu e-mail ou WhatsApp"
        className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
      />
      <textarea
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="Sua mensagem"
        rows={3}
        className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
      />
      {resultado ? (
        <p className={resultado.ok ? "text-xs font-bold text-teal" : "text-xs font-bold text-coral-dark"}>
          {resultado.texto}
        </p>
      ) : null}
      <ActionButton onClick={enviar} disabled={pendente}>
        {pendente ? "Enviando…" : "Enviar mensagem"}
      </ActionButton>
    </div>
  );
}
