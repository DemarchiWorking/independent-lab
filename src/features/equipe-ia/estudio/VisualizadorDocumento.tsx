"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/cn";
import { dataPt } from "../entregaveis/linguagem";
import type { Bloco, CelulaCanvas, Documento, Secao } from "../entregaveis/tipos";
import { copiarTexto } from "./baixar";

/**
 * Mostra um `Documento` dentro do app: o mesmo conteúdo do arquivo baixado,
 * agora com navegação por seção e botão de copiar em cada mensagem pronta.
 *
 * React escapa todo texto por padrão (não usamos `dangerouslySetInnerHTML`),
 * então um nome de negócio com HTML aparece como texto.
 */

const CAMPO = /(\{[a-z_]+\}|\[[^\]\n]+\])/;

/** Texto com os campos `{assim}` e `[assim]` destacados. */
function TextoComCampos({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(CAMPO).map((parte, i) =>
        CAMPO.test(parte) ? (
          <mark key={i} className="rounded-sm bg-orange/30 px-0.5 text-ink">
            {parte}
          </mark>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}

function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copiarTexto(texto)) {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        }
      }}
      className="rounded-sm bg-orange px-3 py-1.5 text-[11px] font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
    </button>
  );
}

const ORDEM_CANVAS: Array<{ chave: CelulaCanvas; titulo: string; classes: string }> = [
  { chave: "parcerias", titulo: "Parcerias principais", classes: "order-8 md:order-none md:col-span-2 md:row-span-2" },
  { chave: "atividades", titulo: "Atividades-chave", classes: "order-7 md:order-none md:col-span-2" },
  { chave: "proposta", titulo: "Proposta de valor", classes: "order-2 md:order-none md:col-span-2 md:row-span-2" },
  { chave: "relacionamento", titulo: "Relacionamento com clientes", classes: "order-4 md:order-none md:col-span-2" },
  { chave: "segmentos", titulo: "Segmentos de clientes", classes: "order-1 md:order-none md:col-span-2 md:row-span-2" },
  { chave: "recursos", titulo: "Recursos principais", classes: "order-6 md:order-none md:col-span-2" },
  { chave: "canais", titulo: "Canais", classes: "order-3 md:order-none md:col-span-2" },
  { chave: "custos", titulo: "Estrutura de custos", classes: "order-9 md:order-none md:col-span-5" },
  { chave: "receitas", titulo: "Fontes de receita", classes: "order-5 md:order-none md:col-span-5" },
];

const TOM: Record<"info" | "atencao" | "sucesso", string> = {
  info: "border-teal",
  atencao: "border-orange",
  sucesso: "border-green",
};

function Lista({ itens, classe }: { itens: readonly string[]; classe?: string }) {
  return (
    <ul className={cn("list-disc space-y-1 pl-5 text-[12px] leading-relaxed", classe)}>
      {itens.map((i, n) => (
        <li key={n}>{i}</li>
      ))}
    </ul>
  );
}

function BlocoView({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case "paragrafo":
      return <p className="text-[12px] leading-relaxed">{bloco.texto}</p>;
    case "destaque":
      return (
        <aside className={cn("rounded-sm border-l-4 bg-panel px-3 py-2 text-[12px] leading-relaxed", TOM[bloco.tom])}>
          {bloco.titulo ? <b className="block">{bloco.titulo}</b> : null}
          {bloco.texto}
        </aside>
      );
    case "lista":
      return bloco.ordenada ? (
        <ol className="list-decimal space-y-1 pl-5 text-[12px] leading-relaxed">
          {bloco.itens.map((i, n) => (
            <li key={n}>{i}</li>
          ))}
        </ol>
      ) : (
        <Lista itens={bloco.itens} />
      );
    case "checklist":
      return (
        <ul className="space-y-1 text-[12px] leading-relaxed">
          {bloco.itens.map((i, n) => (
            <li key={n} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[4px] border-2 border-ink bg-panel" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      );
    case "passos":
      return (
        <ol className="space-y-1.5">
          {bloco.passos.map((p, n) => (
            <li key={n} className="flex gap-2.5 rounded-sm border border-hairline bg-panel p-2 text-[12px] leading-relaxed">
              <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal text-[11px] font-extrabold text-ink">
                {n + 1}
              </span>
              <span>
                <b className="block">{p.titulo}</b>
                {p.detalhe ? <span className="text-soft">{p.detalhe}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      );
    case "mensagem":
      return (
        <figure className="rounded-md border-2 border-hairline bg-panel p-3">
          <figcaption className="mb-1 text-[12px] font-extrabold">
            {bloco.rotulo}
            {bloco.quando ? <small className="block font-normal text-soft">{bloco.quando}</small> : null}
          </figcaption>
          <pre className="mb-2 whitespace-pre-wrap break-words rounded-sm border-l-4 border-teal bg-light p-2.5 font-ui text-[12px] leading-relaxed">
            <TextoComCampos texto={bloco.texto} />
          </pre>
          <BotaoCopiar texto={bloco.texto} />
        </figure>
      );
    case "tabela":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-panel text-[12px]">
            <thead>
              <tr>
                {bloco.colunas.map((c, i) => (
                  <th key={i} scope="col" className="border border-hairline bg-light px-2 py-1.5 text-left text-[10px] uppercase tracking-wide">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((celula, j) => (
                    <td key={j} className="border border-hairline px-2 py-1.5 align-top">
                      <TextoComCampos texto={celula} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "canvas":
      return (
        <div role="group" aria-label="Modelo de Negócio (Canvas)" className="grid gap-2 md:grid-cols-10">
          {ORDEM_CANVAS.map((c) => (
            <div key={c.chave} className={cn("rounded-md border-2 border-hairline bg-panel p-2.5", c.classes)}>
              <h4 className="mb-1.5 border-b-[3px] border-teal pb-1 text-[10px] font-extrabold uppercase tracking-wide">{c.titulo}</h4>
              <Lista itens={bloco.celulas[c.chave]} classe="text-[11px]" />
            </div>
          ))}
        </div>
      );
    case "cartoes":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {bloco.cartoes.map((c, i) => (
            <div key={i} className="rounded-md border-2 border-hairline bg-panel p-2.5">
              <h4 className="mb-1 text-[10px] font-extrabold uppercase tracking-wide">{c.titulo}</h4>
              <Lista itens={c.itens} />
            </div>
          ))}
        </div>
      );
    case "cena":
      return (
        <div className="grid gap-2 rounded-md border-2 border-hairline bg-panel p-2.5 sm:grid-cols-[96px_1fr]">
          <div>
            <b className="block text-[12px]">{bloco.tempo}</b>
            <span className="mt-1 inline-block rounded-pill bg-orange px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink">{bloco.papel}</span>
          </div>
          <div className="space-y-1.5 text-[12px] leading-relaxed">
            <p className="rounded-sm border-l-4 border-teal bg-light p-2">{bloco.fala}</p>
            <p className="text-soft">
              <b className="text-ink">Mostrar:</b> {bloco.imagem}
            </p>
            <p className="text-soft">
              <b className="text-ink">Texto na tela:</b> {bloco.legenda}
            </p>
          </div>
        </div>
      );
  }
}

function SecaoView({ secao, prefixo }: { secao: Secao; prefixo: string }) {
  return (
    <section id={`${prefixo}-${secao.id}`} aria-labelledby={`${prefixo}-t-${secao.id}`} className="scroll-mt-2 space-y-2.5">
      <h3 id={`${prefixo}-t-${secao.id}`} className="border-l-[6px] border-orange pl-2 text-sm font-extrabold">
        {secao.titulo}
      </h3>
      {secao.intro ? <p className="text-[12px] text-soft">{secao.intro}</p> : null}
      {secao.blocos.map((b, i) => (
        <BlocoView key={i} bloco={b} />
      ))}
    </section>
  );
}

export function VisualizadorDocumento({ documento, prefixo }: { documento: Documento; prefixo: string }) {
  const interno = documento.meta.circulacao === "interno";

  const irPara = (id: string) => {
    const alvo = document.getElementById(`${prefixo}-${id}`);
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="grid gap-4 md:grid-cols-[190px_1fr]">
      <nav aria-label="Seções do documento" className="hidden self-start md:sticky md:top-0 md:block">
        <ol className="space-y-0.5 text-[11px]">
          {documento.secoes.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => irPara(s.id)}
                className="w-full rounded-sm px-2 py-1 text-left text-soft hover:bg-hairline hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
              >
                {s.titulo}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0 space-y-5">
        <header className="space-y-1 border-b-4 border-teal pb-3">
          <p className="text-[12px] text-soft">{documento.subtitulo}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-soft">
            <span className={cn("rounded-pill px-2.5 py-0.5 text-[10px] font-extrabold text-ink", interno ? "bg-orange" : "bg-green")}>
              {interno ? "Uso interno, não publique" : "Material para publicar"}
            </span>
            <span>
              <b className="text-ink">Versão</b> {documento.meta.versao}
            </span>
            <span>
              <b className="text-ink">Gerado em</b> {dataPt(documento.meta.geradoEm)}
            </span>
            <span>
              <b className="text-ink">Próxima revisão</b> {dataPt(documento.meta.proximaRevisao)}
            </span>
            <span>
              <b className="text-ink">Autor</b> {documento.meta.autor} (nível {documento.meta.nivelAgente})
            </span>
          </div>
        </header>

        {documento.secoes.map((s) => (
          <SecaoView key={s.id} secao={s} prefixo={prefixo} />
        ))}

        <details className="rounded-md border-2 border-hairline bg-panel p-3 text-[12px]">
          <summary className="cursor-pointer font-extrabold">De onde saíram os dados deste documento</summary>
          <Lista itens={documento.meta.baseadoEm} classe="mt-2" />
          <p className="mt-2 text-soft">Revise tudo antes de usar. Quem decide é você: este material é uma base de trabalho.</p>
        </details>
      </div>
    </div>
  );
}
