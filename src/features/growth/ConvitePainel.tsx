"use client";

import { useState, useTransition } from "react";
import { gerarLinkConvite } from "./actions";

/** Gera e copia o link de convite de vizinho (GH-GROW-02) — o dono decide
 *  quando e onde compartilhar; o app nunca envia nada sozinho. */
export function ConvitePainel() {
  const [url, setUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const gerar = () => {
    setErro(null);
    iniciar(async () => {
      const r = await gerarLinkConvite();
      if (r.ok && r.url) {
        setUrl(`${window.location.origin}${r.url}`);
      } else {
        setErro(r.erro ?? "Não foi possível gerar o link.");
      }
    });
  };

  const copiar = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <section className="rounded-md bg-card p-5">
      <h2 className="mb-1 text-base font-extrabold text-white">
        Convide um vizinho
      </h2>
      <p className="mb-3 text-xs text-muted">
        Ambos ganham moeda e XP quando o convidado completa o cadastro —
        nunca dinheiro real.
      </p>
      {url ? (
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-md border-2 border-card2 bg-night px-3 py-2 text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={copiar}
            className="shrink-0 rounded-md bg-teal px-3 py-2 text-xs font-extrabold text-ink"
          >
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={gerar}
          disabled={pendente}
          className="rounded-md bg-orange px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-50"
        >
          {pendente ? "Gerando…" : "Gerar link de convite"}
        </button>
      )}
      {erro ? <p className="mt-2 text-xs font-bold text-coral">{erro}</p> : null}
    </section>
  );
}
