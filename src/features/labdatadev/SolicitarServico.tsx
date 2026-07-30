"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { CATALOGO_SERVICOS } from "./catalogo";
import { TIPOS_SERVICO, type TipoServico } from "./tipos";
import { criarSolicitacaoServico } from "./actions";

/**
 * "Loja de serviços" do escritório: o cliente escolhe um dos 4 serviços do
 * Laboratório Demarchi e descreve o que precisa. Gated no servidor
 * (`criarSolicitacaoServico`), nunca só no client.
 */
export function SolicitarServico() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [tipo, setTipo] = useState<TipoServico>("site");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const info = CATALOGO_SERVICOS[tipo];

  function onSubmit(formData: FormData) {
    setErro(null);
    setSucesso(null);
    const titulo = String(formData.get("titulo") ?? "");
    const descricao = String(formData.get("descricao") ?? "");

    iniciar(async () => {
      const r = await criarSolicitacaoServico({ tipo, titulo, descricao });
      if (r.ok) {
        setSucesso("Pedido enviado! Você acompanha o andamento aqui embaixo.");
        router.refresh();
      } else {
        setErro(r.erro ?? "Não foi possível enviar o pedido.");
      }
    });
  }

  return (
    <section className="rounded-md bg-panel p-4">
      <h2 className="mb-1 text-sm font-extrabold text-ink">O que você precisa construir?</h2>
      <p className="mb-3 text-xs text-muted">
        Escolha um serviço e conte o que você quer. A equipe do Laboratório Demarchi
        recebe o pedido e acompanha com você por aqui.
      </p>

      {/* seletor de tipo — cards clicáveis, estilo "app na tela" */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIPOS_SERVICO.map((t) => {
          const c = CATALOGO_SERVICOS[t];
          const ativo = t === tipo;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={ativo}
              className={`flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition ${
                ativo
                  ? "border-teal bg-teal/10"
                  : "border-[#c7cedb] bg-white hover:border-teal/50"
              }`}
            >
              <span className="text-xl" aria-hidden>{c.icone}</span>
              <span className="text-xs font-bold text-ink">{c.nome}</span>
            </button>
          );
        })}
      </div>

      <form action={onSubmit} className="flex flex-col gap-3">
        <p className="rounded-sm bg-teal/10 px-2 py-1.5 text-[11px] text-ink">{info.resumo}</p>

        <label className="flex flex-col gap-1 text-xs font-bold text-ink">
          Título do pedido
          <input
            name="titulo"
            required
            minLength={3}
            maxLength={120}
            placeholder={`${info.nome} para o meu negócio`}
            className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-bold text-ink">
          Descreva o que você quer
          <textarea
            name="descricao"
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            placeholder={info.exemplo}
            className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm"
          />
        </label>

        {erro ? (
          <p className="rounded-sm bg-coral/15 px-2 py-1.5 text-[11px] font-bold text-coral-dark">{erro}</p>
        ) : null}
        {sucesso ? (
          <p className="rounded-sm bg-teal/15 px-2 py-1.5 text-[11px] font-bold text-teal">{sucesso}</p>
        ) : null}

        <ActionButton type="submit" icon="bolt" disabled={pendente}>
          {pendente ? "Enviando…" : "Enviar pedido"}
        </ActionButton>
      </form>
    </section>
  );
}
