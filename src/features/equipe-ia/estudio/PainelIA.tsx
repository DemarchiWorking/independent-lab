"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TipoEntregavel } from "../habilidades";
import { dataPt } from "../entregaveis/linguagem";
import type { EstadoIA } from "../ia/servico-ia";
import { erroDaResposta } from "./baixar";

/**
 * Refinamento por IA, dentro do estúdio de cada material. Mostra o que a IA
 * está fazendo, deixa o dono pedir um refino e, antes de qualquer envio,
 * obtém a autorização para que os dados do negócio sigam para a Anthropic.
 *
 * Nada aqui é obrigatório: o material de regras sempre funciona sozinho.
 */

const INTERVALO_MS = 5_000;

type Acao = "pedir" | "autorizar" | "revogar";

interface Props {
  tipo: TipoEntregavel;
  /** chamado quando surge uma versão nova de IA: o estúdio recarrega o material */
  aoNovaVersao: () => void;
}

const botao =
  "inline-flex min-h-11 items-center rounded-sm px-3 py-1.5 text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal disabled:opacity-50";

function nomeDoModelo(id: string): string {
  const m = /^claude-(haiku|sonnet|opus)-(\d+)-(\d+)$/.exec(id);
  return m ? `Claude ${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}.${m[3]}` : "modelo de IA";
}

export function PainelIA({ tipo, aoNovaVersao }: Props) {
  const [estado, setEstado] = useState<EstadoIA | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const versaoVista = useRef<number | null>(null);
  const url = `/api/ia/${tipo}`;

  const carregar = useCallback(
    async (sinal?: AbortSignal) => {
      try {
        const r = await fetch(url, { cache: "no-store", signal: sinal });
        if (!r.ok) {
          // 403: funcionário não contratado; a tela do estúdio já nem abre. Qualquer outro erro: some em silêncio.
          setEstado(null);
          return;
        }
        const novo = (await r.json()) as EstadoIA;
        setEstado(novo);
        const n = novo.versao?.n ?? null;
        if (versaoVista.current !== null && n !== null && n > versaoVista.current) aoNovaVersao();
        if (versaoVista.current === null || (n !== null && n > versaoVista.current)) versaoVista.current = n ?? versaoVista.current;
        if (versaoVista.current === null && n === null) versaoVista.current = 0;
      } catch {
        /* sem rede: tenta de novo no próximo intervalo */
      }
    },
    [url, aoNovaVersao],
  );

  useEffect(() => {
    const controle = new AbortController();
    void carregar(controle.signal);
    return () => controle.abort();
  }, [carregar]);

  // Enquanto há pedido na fila, acompanha de perto; fora disso, não consulta à toa.
  const acompanhando = estado?.fila.estado !== undefined && estado.fila.estado !== "nenhum";
  useEffect(() => {
    if (!acompanhando) return;
    const id = setInterval(() => void carregar(), INTERVALO_MS);
    return () => clearInterval(id);
  }, [acompanhando, carregar]);

  async function enviar(acao: Acao) {
    setOcupado(true);
    setErro(null);
    setMensagem(null);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      if (!r.ok) {
        setErro(await erroDaResposta(r, "Não foi possível concluir agora. Tente de novo em instantes."));
        await carregar();
        return;
      }
      const corpo = (await r.json()) as EstadoIA | { estado: EstadoIA; jaEstava: boolean };
      const novo = "estado" in corpo ? corpo.estado : corpo;
      setEstado(novo);
      if (acao === "pedir") setMensagem("Pedido enviado. Você pode continuar usando o material enquanto a IA trabalha.");
      if (acao === "autorizar") setMensagem("Autorizado. Agora você pode pedir o refinamento.");
      if (acao === "revogar") {
        setMensagem("Autorização revogada e o que a IA gerou foi apagado. O material de regras continua disponível.");
        versaoVista.current = 0;
        aoNovaVersao();
      }
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  if (!estado) return null;

  const limiteAtingido = estado.pedidosHoje >= estado.limiteDia;
  const naFila = estado.fila.estado === "na-fila";
  const processando = estado.fila.estado === "processando";

  return (
    <section aria-label="Refinamento por IA" className="space-y-2 rounded-md border-2 border-hairline bg-panel p-3 text-[12px] leading-relaxed">
      <h3 className="text-[11px] font-extrabold uppercase tracking-wide">Refinamento por IA</h3>
      <p className="text-soft">
        A IA revisa este material com os dados do seu negócio, deixa mais específico para a sua cidade e confere com boas práticas. Leia e ajuste antes de usar: quem decide é você.
      </p>

      {!estado.ligada ? (
        <p>O refinamento por IA está desligado no momento. O seu material continua disponível normalmente.</p>
      ) : !estado.consentido ? (
        <div className="space-y-2">
          <p className="rounded-sm border-l-4 border-orange bg-light p-2">
            Para refinar, enviamos à <b>Anthropic</b> (empresa de IA, nos Estados Unidos) o nome, a cidade, as ofertas e as parcerias públicas do seu negócio e, nos materiais internos, as respostas do seu cadastro. <b>Não enviamos</b> e-mail, senha nem dados de clientes. Você pode revogar quando quiser e apagamos o que a IA gerou. Veja a{" "}
            <Link href="/privacidade" target="_blank" className="underline">
              política de privacidade
            </Link>
            .
          </p>
          <button type="button" onClick={() => void enviar("autorizar")} disabled={ocupado} className={`${botao} bg-orange text-ink`}>
            Autorizar o uso de IA no meu negócio
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p role="status" aria-live="polite">
            {processando ? (
              <>A IA está trabalhando no seu material… costuma levar alguns minutos.</>
            ) : naFila ? (
              <>
                Na fila{estado.fila.posicao ? ` (posição ${estado.fila.posicao})` : ""}. Costuma levar alguns minutos.
                {!estado.workerVivo ? " O processamento está temporariamente indisponível; o seu pedido continua na fila." : ""}
              </>
            ) : estado.versao ? (
              <>
                <b>Versão {estado.versao.n + 1}.0</b>, refinada por IA ({nomeDoModelo(estado.versao.modelo)}) em {dataPt(estado.versao.geradoEm)}.
                {estado.completo ? " Este material já recebeu todos os refinos automáticos para os dados atuais." : " A IA continua melhorando automaticamente quando está livre."}
              </>
            ) : (
              <>Este material ainda está na versão de regras. Peça o refinamento ou deixe a melhoria automática cuidar disso.</>
            )}
          </p>

          {estado.ultimaFalha && !naFila && !processando ? (
            <p className="text-soft">A última tentativa não passou na nossa verificação de qualidade, então mantivemos o material atual. Tentaremos de novo automaticamente.</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void enviar("pedir")} disabled={ocupado || naFila || processando || limiteAtingido} className={`${botao} bg-teal text-ink`}>
              {estado.versao ? "Pedir novo refinamento" : "Pedir refinamento por IA"}
            </button>
            <span className="text-soft">
              {estado.pedidosHoje} de {estado.limiteDia} pedidos hoje
            </span>
          </div>
          {limiteAtingido ? <p className="text-soft">Você usou os pedidos de hoje. A melhoria automática continua rodando.</p> : null}

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Parar de usar IA neste negócio e apagar o que ela gerou? O material de regras continua.")) void enviar("revogar");
            }}
            disabled={ocupado}
            className="text-[11px] text-soft underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            Parar de usar IA e apagar o que ela gerou
          </button>
        </div>
      )}

      {mensagem ? (
        <p role="status" className="rounded-sm bg-teal/15 px-2 py-1.5 font-bold">
          {mensagem}
        </p>
      ) : null}
      {erro ? (
        <p role="alert" className="rounded-sm bg-coral/15 px-2 py-1.5 font-bold text-coral-dark">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
