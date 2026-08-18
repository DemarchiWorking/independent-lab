"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocumentoGerado } from "@/lib/db/types";
import { solicitarGeracaoDocumentos } from "./actions";

const TITULO_TIPO: Record<DocumentoGerado["tipo"], string> = {
  canvas: "Business Model Canvas",
  "modelo-negocio": "Modelo de Negócio",
  swot: "Análise SWOT Estratégica",
  "resumo-executivo": "Resumo Executivo",
  "roadmap-melhoria-continua": "Roadmap de Melhoria Contínua",
  "proposta-comercial": "Proposta Comercial",
  "analise-concorrencia": "Análise de Concorrência",
};

/**
 * Documentação de negócio gerada por IA (GH-DOC-01) — o dono pede aqui, a
 * fila (`fila_geracao_documentos`) guarda o pedido, e o motor headless
 * (`document-engine/`, cron horário) entrega o resultado nesta mesma
 * lista na próxima rodada. Nunca é síncrono: não existe "aguarde" que
 * trava a tela — o pedido pode levar até 1h para aparecer.
 */
export function DocumentosPainel({ documentos }: { documentos: DocumentoGerado[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const solicitar = () => {
    setErro(null);
    setMensagem(null);
    iniciar(async () => {
      const r = await solicitarGeracaoDocumentos();
      if (r.ok) {
        setMensagem(
          "Pedido registrado — o motor de documentação roda a cada hora, o resultado aparece aqui automaticamente.",
        );
        router.refresh();
      } else {
        setErro(r.erro ?? "Não foi possível enfileirar a geração.");
      }
    });
  };

  return (
    <section className="rounded-md bg-card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-white">
          Documentação de negócio (IA)
        </h2>
        <button
          type="button"
          onClick={solicitar}
          disabled={pendente}
          className="shrink-0 rounded-md bg-teal px-3 py-2 text-xs font-extrabold text-ink disabled:opacity-50"
        >
          {pendente ? "Enviando…" : "Gerar / atualizar"}
        </button>
      </div>
      <p className="mb-3 text-xs text-muted">
        7 documentos gerados pela IA a partir da sua ficha (cadastro,
        onboarding, vitrine, equipe e sede): Canvas, Modelo de Negócio, SWOT,
        Resumo Executivo, Roadmap de Melhoria Contínua, Proposta Comercial e
        Análise de Concorrência — a cada rodada uma versão nova é
        adicionada, o histórico nunca é apagado.
      </p>

      {mensagem ? <p className="mb-3 text-xs font-bold text-teal">{mensagem}</p> : null}
      {erro ? <p className="mb-3 text-xs font-bold text-coral">{erro}</p> : null}

      {documentos.length > 0 ? (
        <ul className="max-h-72 space-y-2 overflow-auto">
          {documentos.map((d) => (
            <li key={d.id} className="rounded-md bg-card2 p-3 text-sm text-white">
              <div className="flex items-center justify-between gap-2">
                <b>{TITULO_TIPO[d.tipo] ?? d.titulo}</b>
                <span className="text-xs text-muted">
                  {new Date(d.geradoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-teal">
                  Ver conteúdo
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted">
                  {d.conteudoMarkdown}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Nenhum documento gerado ainda — peça acima.
        </p>
      )}
    </section>
  );
}
