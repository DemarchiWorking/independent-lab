"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publicarOferta } from "./actions";
import type { Oferta } from "@/lib/db/types";

/** Gestão de ofertas (vitrine) — o dono publica aqui, a página pública
 *  `/n/[slug]` (GH-GROW-01) só lê. Primeiro produtor de `Oferta` no app. */
export function OfertasPainel({ ofertas }: { ofertas: Oferta[] }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const publicar = () => {
    setErro(null);
    iniciar(async () => {
      const r = await publicarOferta(titulo, descricao, preco);
      if (r.ok) {
        setTitulo("");
        setDescricao("");
        setPreco("");
        router.refresh();
      } else {
        setErro(r.erro ?? "Não foi possível publicar.");
      }
    });
  };

  return (
    <section className="rounded-md bg-card p-5">
      <h2 className="mb-1 text-base font-extrabold text-white">
        Serviços na sua vitrine
      </h2>
      <p className="mb-3 text-xs text-muted">
        Aparecem na sua página pública — visível a quem chega pelo Google.
      </p>

      {ofertas.length > 0 ? (
        <ul className="mb-4 space-y-1.5">
          {ofertas.map((o) => (
            <li key={o.id} className="rounded-md bg-card2 p-3 text-sm text-white">
              <b>{o.titulo}</b>
              {o.preco ? <span className="float-right text-teal">{o.preco}</span> : null}
              {o.descricao ? <p className="mt-1 text-xs text-muted">{o.descricao}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted">Nenhuma oferta publicada ainda.</p>
      )}

      <div className="space-y-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ex.: Consultoria em automação)"
          className="w-full rounded-md border-2 border-card2 bg-night px-3 py-2 text-sm text-white outline-none focus:border-teal"
        />
        <div className="flex gap-2">
          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço (ex.: R$ 1.500)"
            className="w-32 rounded-md border-2 border-card2 bg-night px-3 py-2 text-sm text-white outline-none focus:border-teal"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="flex-1 rounded-md border-2 border-card2 bg-night px-3 py-2 text-sm text-white outline-none focus:border-teal"
          />
        </div>
        {erro ? <p className="text-xs font-bold text-coral">{erro}</p> : null}
        <button
          type="button"
          onClick={publicar}
          disabled={pendente}
          className="rounded-md bg-orange px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-50"
        >
          {pendente ? "Publicando…" : "Publicar oferta"}
        </button>
      </div>
    </section>
  );
}
