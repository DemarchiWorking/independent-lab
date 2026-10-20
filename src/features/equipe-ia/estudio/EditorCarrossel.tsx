"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { aplicarEdicoes, CAMPO_PENDENTE, LIMITE_LEGENDA, LIMITES_EDICAO, slidesPendentes, type EdicaoSlide } from "../entregaveis/edicao";
import { FORMATOS_SLIDE, margensDoFormato, TEMAS_SLIDE, type FormatoSlide, type TemaSlide } from "../entregaveis/render/formatos";
import { medidasDoSlide } from "../entregaveis/render/medidas";
import type { PacoteCarrossel, PautaCarrossel, SlideCarrossel } from "../entregaveis/tipos";
import { copiarTexto, erroDaResposta, nomeDoCabecalho, salvarBlob } from "./baixar";

/**
 * Editor de publicações: escolhe a pauta, edita o texto de cada slide, vê a
 * pré-visualização no formato e no tema escolhidos e baixa o PNG ou o ZIP.
 *
 * Fronteira de confiança: este componente só ajuda. O bloqueio de download
 * enquanto houver `[campo]` por preencher, o teto de tamanho do texto e a
 * limpeza são repetidos pela rota, que nunca confia no que o navegador diz
 * ter validado. A pré-visualização usa as mesmas medidas (`medidasDoSlide`) e
 * as mesmas cores (`TEMAS_SLIDE`) da imagem, para a tela mostrar o que sai.
 */

type Edicoes = Record<string, EdicaoSlide[]>;

const BASE = 1080;

/** Converte px da base de 1080 em unidade de container (`cqw`), que escala com a largura da prévia. */
const cq = (px: number) => `${(px / BASE) * 100}cqw`;

function Previa({
  slide,
  posicao,
  total,
  assinatura,
  formato,
  tema,
}: {
  slide: SlideCarrossel;
  posicao: number;
  total: number;
  assinatura: string;
  formato: FormatoSlide;
  tema: TemaSlide;
}) {
  const t = TEMAS_SLIDE[tema];
  const { largura, altura } = FORMATOS_SLIDE[formato];
  const m = margensDoFormato(formato);
  const { tamanhoTitulo, tamanhoTexto } = medidasDoSlide({ papel: slide.papel, titulo: slide.titulo, texto: slide.texto, formato });
  const capa = slide.papel === "capa";
  const convite = slide.papel === "cta";

  return (
    <div
      role="img"
      aria-label={`Pré-visualização do slide ${posicao} de ${total}: ${slide.titulo}. ${slide.texto}`}
      className="w-full overflow-hidden rounded-md font-ui shadow-modal"
      style={{
        containerType: "inline-size",
        aspectRatio: `${largura} / ${altura}`,
        backgroundColor: t.fundo,
        color: t.texto,
      }}
    >
      <div
        className="flex h-full flex-col justify-between"
        style={{ padding: `${cq(m.topo)} ${cq(m.lado)} ${cq(m.base)}` }}
        aria-hidden
      >
        <div className="flex items-center justify-between">
          <div style={{ width: cq(140), height: cq(14), borderRadius: cq(7), backgroundColor: t.acento }} />
          <div style={{ fontSize: cq(32), fontWeight: 700, color: t.suave }}>{`${posicao}/${total}`}</div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div style={{ fontSize: cq(tamanhoTitulo), fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.01em", whiteSpace: "pre-wrap" }}>
            {slide.titulo}
          </div>
          {convite ? (
            <div
              style={{
                marginTop: cq(48),
                padding: `${cq(28)} ${cq(36)}`,
                borderRadius: cq(24),
                backgroundColor: t.botao,
                color: t.textoBotao,
                fontSize: cq(tamanhoTexto),
                fontWeight: 700,
                lineHeight: 1.25,
                whiteSpace: "pre-wrap",
              }}
            >
              {slide.texto}
            </div>
          ) : (
            <div
              style={{
                marginTop: cq(40),
                fontSize: cq(tamanhoTexto),
                lineHeight: 1.3,
                color: capa ? t.suave : t.texto,
                whiteSpace: "pre-wrap",
              }}
            >
              {slide.texto}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between" style={{ fontSize: cq(30), fontWeight: 700, color: t.suave }}>
          <span>{assinatura}</span>
          {posicao < total ? <span style={{ color: t.acento }}>Deslize</span> : null}
        </div>
      </div>
    </div>
  );
}

function Contador({ atual, limite }: { atual: string; limite: number }) {
  const n = Array.from(atual).length;
  return (
    <span className={cn("text-[10px] tabular-nums", n >= limite ? "font-bold text-coral-dark" : "text-soft")}>
      {n}/{limite}
    </span>
  );
}

export function EditorCarrossel({ pacote }: { pacote: PacoteCarrossel }) {
  const [pautaId, setPautaId] = useState(pacote.pautas[0]?.id ?? "");
  const [indice, setIndice] = useState(0);
  const [formato, setFormato] = useState<FormatoSlide>("quadrado");
  const [tema, setTema] = useState<TemaSlide>("escuro");
  const [edicoes, setEdicoes] = useState<Edicoes>({});
  const [legendas, setLegendas] = useState<Record<string, string>>({});
  const [baixando, setBaixando] = useState<"png" | "zip" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const base: PautaCarrossel | undefined = pacote.pautas.find((p) => p.id === pautaId);

  /** A pauta com as edições aplicadas — o que a imagem e a prévia vão mostrar. */
  const pauta = useMemo(() => (base ? aplicarEdicoes(base, edicoes[base.id] ?? null) : null), [base, edicoes]);

  if (!base || !pauta) {
    return <p className="text-[12px]">Nenhuma pauta disponível para o seu nível.</p>;
  }

  const slide = pauta.slides[Math.min(indice, pauta.slides.length - 1)];
  const numero = Math.min(indice, pauta.slides.length - 1) + 1;
  const pendentesDoSlide = slidesPendentes(pauta, numero).length > 0;
  const pendentesDaPauta = slidesPendentes(pauta, null);
  const legenda = legendas[pauta.id] ?? pauta.legenda;

  /** Edita um campo do slide atual, partindo do texto gerado na primeira edição. */
  function editar(campo: keyof EdicaoSlide, valor: string) {
    if (!base) return;
    setEdicoes((atual) => {
      const partida = atual[base.id] ?? base.slides.map((s) => ({ titulo: s.titulo, texto: s.texto }));
      const proxima = partida.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e));
      return { ...atual, [base.id]: proxima };
    });
  }

  function escolherPauta(id: string) {
    setPautaId(id);
    setIndice(0);
    setErro(null);
    setAviso(null);
  }

  async function copiar(texto: string, rotulo: string) {
    setAviso((await copiarTexto(texto)) ? `${rotulo} copiado.` : "Não foi possível copiar neste navegador.");
  }

  async function baixar(saida: "png" | "zip") {
    if (!pauta) return;
    setErro(null);
    setAviso(null);
    setBaixando(saida);
    try {
      const corpo = {
        saida,
        pauta: pauta.id,
        slide: saida === "png" ? numero : undefined,
        formato,
        tema,
        slides: pauta.slides.map((s) => ({ titulo: s.titulo, texto: s.texto })),
        legenda,
        baixar: 1,
      };
      const resposta = await fetch("/api/entregavel/carrossel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) {
        setErro(await erroDaResposta(resposta, "Não foi possível gerar a imagem. Tente de novo em instantes."));
        return;
      }
      const blob = await resposta.blob();
      salvarBlob(blob, nomeDoCabecalho(resposta) ?? (saida === "png" ? "slide.png" : "carrossel.zip"));
      setAviso(saida === "png" ? "Imagem baixada." : "Pacote baixado.");
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div className="space-y-4 text-ink">
      {/* pautas */}
      <div role="tablist" aria-label="Pautas de carrossel" className="flex flex-wrap gap-1.5">
        {pacote.pautas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === pautaId}
            onClick={() => escolherPauta(p.id)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-pill px-3 py-1.5 text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal",
              p.id === pautaId ? "bg-ink text-panel" : "bg-hairline text-ink hover:bg-[#d3dbe8]",
            )}
          >
            {p.rotulo}
            {p.rascunho ? <span className="ml-1 rounded-pill bg-orange px-1.5 text-[9px] text-ink">completar</span> : null}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-soft">Objetivo: {pauta.objetivo}.</p>

      {pauta.rascunho ? (
        <aside className="rounded-sm border-l-4 border-orange bg-panel px-3 py-2 text-[12px] leading-relaxed">
          <b className="block">Complete antes de publicar</b>
          Esta pauta tem campos entre colchetes que só você sabe. Troque pelo que realmente acontece no seu negócio. O download só libera quando
          não restar nenhum colchete.
        </aside>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* prévia e navegação de slides */}
        <div className="space-y-2">
          <div className={cn("mx-auto", formato === "story" ? "max-w-[220px]" : "max-w-[320px]")}>
            <Previa slide={slide} posicao={numero} total={pauta.slides.length} assinatura={pacote.assinatura} formato={formato} tema={tema} />
          </div>
          <ol className="flex flex-wrap justify-center gap-1" aria-label="Slides">
            {pauta.slides.map((s, i) => {
              const pendente = slidesPendentes(pauta, i + 1).length > 0;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setIndice(i)}
                    aria-current={i === indice ? "true" : undefined}
                    aria-label={`Slide ${i + 1}: ${s.titulo}${pendente ? " (falta completar)" : ""}`}
                    className={cn(
                      "relative h-11 w-11 rounded-sm text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal",
                      i === indice ? "bg-teal text-ink" : "bg-hairline text-ink hover:bg-[#d3dbe8]",
                    )}
                  >
                    {i + 1}
                    {pendente ? <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange" /> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* campos */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="slide-titulo" className="text-[11px] font-extrabold">
                Título do slide {numero}
              </label>
              <Contador atual={slide.titulo} limite={LIMITES_EDICAO.titulo} />
            </div>
            <input
              id="slide-titulo"
              value={slide.titulo}
              maxLength={LIMITES_EDICAO.titulo}
              onChange={(e) => editar("titulo", e.target.value)}
              className="mt-1 w-full rounded-sm border-2 border-hairline bg-panel px-2.5 py-2 text-[13px] focus-visible:border-teal focus-visible:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="slide-texto" className="text-[11px] font-extrabold">
                Texto
              </label>
              <Contador atual={slide.texto} limite={LIMITES_EDICAO.texto} />
            </div>
            <textarea
              id="slide-texto"
              value={slide.texto}
              maxLength={LIMITES_EDICAO.texto}
              rows={4}
              onChange={(e) => editar("texto", e.target.value)}
              className="mt-1 w-full resize-y rounded-sm border-2 border-hairline bg-panel px-2.5 py-2 text-[13px] focus-visible:border-teal focus-visible:outline-none"
            />
          </div>
          {pendentesDoSlide || CAMPO_PENDENTE.test(slide.titulo + slide.texto) ? (
            <p className="text-[11px] font-bold text-coral-dark">Este slide ainda tem campo entre colchetes.</p>
          ) : null}

          <fieldset className="space-y-1">
            <legend className="text-[11px] font-extrabold">Formato da imagem</legend>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FORMATOS_SLIDE) as FormatoSlide[]).map((f) => (
                <label
                  key={f}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-pill px-3 py-1.5 text-[11px] font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal",
                    formato === f ? "bg-ink text-panel" : "bg-hairline text-ink",
                  )}
                >
                  <input type="radio" name="formato" value={f} checked={formato === f} onChange={() => setFormato(f)} className="sr-only" />
                  {FORMATOS_SLIDE[f].rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-[11px] font-extrabold">Tema</legend>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TEMAS_SLIDE) as TemaSlide[]).map((tm) => (
                <label
                  key={tm}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal",
                    tema === tm ? "bg-ink text-panel" : "bg-hairline text-ink",
                  )}
                >
                  <input type="radio" name="tema" value={tm} checked={tema === tm} onChange={() => setTema(tm)} className="sr-only" />
                  <span aria-hidden className="h-3 w-3 rounded-full border border-soft" style={{ backgroundColor: TEMAS_SLIDE[tm].fundo }} />
                  {TEMAS_SLIDE[tm].rotulo}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* downloads */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={baixando !== null || pendentesDoSlide}
          onClick={() => baixar("png")}
          className="min-h-11 rounded-md bg-teal px-4 py-2.5 text-[12px] font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {baixando === "png" ? "Gerando…" : `Baixar slide ${numero} (PNG)`}
        </button>
        <button
          type="button"
          disabled={baixando !== null || pendentesDaPauta.length > 0}
          onClick={() => baixar("zip")}
          className="min-h-11 rounded-md bg-orange px-4 py-2.5 text-[12px] font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {baixando === "zip" ? "Gerando…" : "Baixar todos (ZIP)"}
        </button>
        {pendentesDaPauta.length > 0 ? (
          <span className="text-[11px] text-soft">Complete os slides {pendentesDaPauta.join(", ")} para liberar o pacote.</span>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="min-h-[1rem] text-[11px] font-bold text-soft">
        {aviso}
      </p>
      {erro ? (
        <p role="alert" className="rounded-sm bg-coral/15 px-2.5 py-1.5 text-[12px] font-bold text-coral-dark">
          {erro}
        </p>
      ) : null}

      {/* legenda, hashtags e texto alternativo */}
      <div className="space-y-3 border-t border-hairline pt-3">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="legenda" className="text-[11px] font-extrabold">
              Legenda da publicação
            </label>
            <Contador atual={legenda} limite={LIMITE_LEGENDA} />
          </div>
          <textarea
            id="legenda"
            value={legenda}
            rows={6}
            maxLength={LIMITE_LEGENDA}
            onChange={(e) => setLegendas((atual) => ({ ...atual, [pauta.id]: e.target.value }))}
            className="mt-1 w-full resize-y rounded-sm border-2 border-hairline bg-panel px-2.5 py-2 text-[13px] focus-visible:border-teal focus-visible:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => copiar(legenda, "Legenda")} className="min-h-11 rounded-sm bg-orange px-3 py-1.5 text-[11px] font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
              Copiar legenda
            </button>
            <button type="button" onClick={() => copiar(pauta.hashtags.join(" "), "Hashtags")} className="min-h-11 rounded-sm bg-hairline px-3 py-1.5 text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
              Copiar hashtags
            </button>
            <button type="button" onClick={() => copiar(pauta.textoAlternativo, "Texto alternativo")} className="min-h-11 rounded-sm bg-hairline px-3 py-1.5 text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
              Copiar texto alternativo
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-soft">{pauta.hashtags.join("  ")}</p>
        </div>

        <aside className="rounded-sm border-l-4 border-teal bg-panel px-3 py-2 text-[12px] leading-relaxed">
          <b className="block">Direção de imagem</b>
          {pauta.orientacaoVisual}
        </aside>

        <details className="rounded-md border-2 border-hairline bg-panel p-3 text-[12px]">
          <summary className="cursor-pointer font-extrabold">Calendário de publicação</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Quando", "Formato", "O que fazer"].map((c) => (
                    <th key={c} scope="col" className="border border-hairline bg-light px-2 py-1.5 text-left text-[10px] uppercase tracking-wide">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacote.calendario.map((d, i) => (
                  <tr key={i}>
                    <td className="border border-hairline px-2 py-1.5 align-top">{d.quando}</td>
                    <td className="border border-hairline px-2 py-1.5 align-top">{d.formato}</td>
                    <td className="border border-hairline px-2 py-1.5 align-top">{d.tarefa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className="rounded-md border-2 border-hairline bg-panel p-3 text-[12px]">
          <summary className="cursor-pointer font-extrabold">Boas práticas e o que acompanhar</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            {[...pacote.boasPraticas, ...pacote.metricas].map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
