"use client";

import { useCallback, useEffect, useState } from "react";
import type { TipoEntregavel } from "../habilidades";
import type { Documento, PacoteCarrossel } from "../entregaveis/tipos";
import { EditorCarrossel } from "./EditorCarrossel";
import { erroDaResposta } from "./baixar";
import { PainelIA } from "./PainelIA";
import { INFO_ENTREGAVEL } from "./rotulos";
import { VisualizadorDocumento } from "./VisualizadorDocumento";

/**
 * O estúdio de um entregável: busca o material do negócio LOGADO (a rota lê o
 * negócio da sessão, nunca de parâmetro) e mostra no visualizador ou, para
 * carrosséis, no editor de publicações.
 */

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "pronto"; documento: Documento; pacote: PacoteCarrossel | null };

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function ehDocumento(v: unknown): v is Documento {
  return ehObjeto(v) && Array.isArray(v.secoes) && ehObjeto(v.meta) && typeof v.titulo === "string";
}

function ehPacote(v: unknown): v is PacoteCarrossel {
  return ehObjeto(v) && Array.isArray(v.pautas) && Array.isArray(v.calendario) && typeof v.assinatura === "string";
}

export function EstudioEntregavel({ tipo }: { tipo: TipoEntregavel }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  // Sobe quando a IA entrega uma versão nova: o material é buscado de novo, sem piscar a tela.
  const [recarga, setRecarga] = useState(0);
  const aoNovaVersao = useCallback(() => setRecarga((n) => n + 1), []);
  const info = INFO_ENTREGAVEL[tipo];

  useEffect(() => {
    const controle = new AbortController();
    (async () => {
      try {
        const resposta = await fetch(`/api/entregavel/${tipo}?saida=json`, { cache: "no-store", signal: controle.signal });
        if (!resposta.ok) {
          setEstado({ fase: "erro", mensagem: await erroDaResposta(resposta, "Não foi possível montar o material agora.") });
          return;
        }
        const corpo: unknown = await resposta.json();
        if (tipo === "carrossel" && ehObjeto(corpo) && ehPacote(corpo.pacote) && ehDocumento(corpo.documento)) {
          setEstado({ fase: "pronto", documento: corpo.documento, pacote: corpo.pacote });
        } else if (ehDocumento(corpo)) {
          setEstado({ fase: "pronto", documento: corpo, pacote: null });
        } else {
          setEstado({ fase: "erro", mensagem: "O servidor devolveu um material em formato inesperado." });
        }
      } catch (e) {
        if (controle.signal.aborted) return;
        setEstado({ fase: "erro", mensagem: "Sem conexão com o servidor. Verifique a internet e tente de novo." });
      }
    })();
    return () => controle.abort();
  }, [tipo, recarga]);

  const base = `/api/entregavel/${tipo}`;
  const acao =
    "inline-flex min-h-11 items-center rounded-sm bg-hairline px-3 py-1.5 text-[11px] font-extrabold text-ink hover:bg-[#d3dbe8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal";

  return (
    <div className="max-h-[calc(100dvh-8.5rem)] space-y-3 overflow-y-auto pr-1 text-ink">
      <div className="flex flex-wrap items-center gap-1.5">
        <a href={`${base}?saida=html&ver=1`} target="_blank" rel="noopener noreferrer" className={acao}>
          Imprimir ou salvar em PDF
        </a>
        <a href={`${base}?saida=html`} className={acao}>
          Baixar HTML
        </a>
        <a href={`${base}?saida=md`} className={acao}>
          Baixar Markdown
        </a>
        <a href={`${base}?saida=json&baixar=1`} className={acao}>
          Baixar JSON
        </a>
      </div>

      <PainelIA tipo={tipo} aoNovaVersao={aoNovaVersao} />

      {estado.fase === "carregando" ? (
        <p role="status" className="py-8 text-center text-[12px] text-soft">
          Montando o seu material a partir dos dados do seu negócio…
        </p>
      ) : null}

      {estado.fase === "erro" ? (
        <p role="alert" className="rounded-sm bg-coral/15 px-3 py-2 text-[12px] font-bold text-coral-dark">
          {estado.mensagem}
        </p>
      ) : null}

      {estado.fase === "pronto" ? (
        <>
          <p className="text-[12px] text-soft">{info.descricao}</p>
          {estado.pacote ? (
            <>
              <EditorCarrossel key={estado.pacote.meta.versao} pacote={estado.pacote} />
            </>
          ) : (
            <VisualizadorDocumento documento={estado.documento} prefixo={`doc-${tipo}`} />
          )}
        </>
      ) : null}
    </div>
  );
}
