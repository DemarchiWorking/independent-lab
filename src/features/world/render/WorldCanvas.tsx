"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { Celula } from "../engine/iso";
import { CenaWorld, DESENHADORES_PADRAO, type EstadoCena } from "./cena";

/**
 * Ponte React ↔ Pixi.
 *
 * Três armadilhas reais tratadas aqui, todas conhecidas de integrar canvas em
 * Next.js + React 19:
 *
 * 1. `Application.init()` é assíncrono no Pixi v8 e o StrictMode do React 19
 *    monta/desmonta o efeito duas vezes em dev. Sem uma flag de cancelamento,
 *    sobra uma segunda `Application` órfã segurando um contexto WebGL.
 * 2. O Pixi toca em `window`, então o componente é carregado com
 *    `ssr: false` por quem o consome (`WorldScreen`) — nunca importado direto
 *    numa árvore renderizada no servidor.
 * 3. O import do Pixi é dinâmico DENTRO do efeito: mantém as ~400kB do
 *    renderer fora do bundle inicial de quem nunca abre o World.
 */

export interface WorldCanvasHandle {
  /** Manda o avatar do dono caminhar até a célula. `false` se não há trajeto. */
  andarPara: (celula: Celula) => boolean;
}

interface WorldCanvasProps {
  estado: EstadoCena;
  /** id do avatar controlado pelo jogador */
  avatarDonoId: string;
  onCliqueCelula: (celula: Celula) => void;
  /** Avisa que o avatar do jogador parou numa célula (GH-WORLD-08). */
  onAvatarParou?: (celula: Celula) => void;
  /**
   * Camada visual da sala — default (`undefined`) preserva o desenho de
   * sempre (`desenho.ts`). `"v2"` carrega `render/desenhoV2.ts` (silhueta
   * por item, `WorldScreenV2`/`VisitaScreenV2`).
   *
   * De propósito uma STRING, não o objeto `Desenhadores` em si: quem chama
   * este componente (`WorldScreenV2.tsx`) nunca importa `desenhoV2.ts` (que
   * toca `pixi.js`) no próprio módulo — só este arquivo, que já é
   * `dynamic(..., { ssr: false })` e já carrega Pixi dentro do efeito.
   * Passar o objeto resolvido pelo chamador furaria exatamente a garantia
   * do item 3 do comentário acima (manter Pixi fora do bundle inicial).
   */
  variante?: "v2";
  ref?: Ref<WorldCanvasHandle>;
}

/** Descreve a cena em texto para quem usa leitor de tela. */
function descrever(estado: EstadoCena): string {
  const { cols, rows } = estado.geo;
  const moveis = estado.moveis.length;
  const pessoas = estado.avatares.length;
  return (
    `Sala isométrica da sede, ${cols} por ${rows} espaços. ` +
    `${moveis === 0 ? "Nenhum móvel colocado" : `${moveis} ${moveis === 1 ? "móvel colocado" : "móveis colocados"}`}. ` +
    `${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"} na sala.`
  );
}

export function WorldCanvas({
  estado,
  avatarDonoId,
  onCliqueCelula,
  onAvatarParou,
  variante,
  ref,
}: WorldCanvasProps) {
  const descricaoAcessivel = descrever(estado);
  const hospedeiroRef = useRef<HTMLDivElement | null>(null);
  const cenaRef = useRef<CenaWorld | null>(null);
  const [pronto, setPronto] = useState(false);

  // callbacks/estado mais recentes sem re-montar a cena a cada render
  const cliqueRef = useRef(onCliqueCelula);
  cliqueRef.current = onCliqueCelula;
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const pararRef = useRef(onAvatarParou);
  pararRef.current = onAvatarParou;
  const donoRef = useRef(avatarDonoId);
  donoRef.current = avatarDonoId;
  // lido só na montagem (abaixo) — trocar a variante em runtime não é um
  // caso de uso real hoje, então não entra nas deps do efeito de montagem
  const varianteRef = useRef(variante);
  varianteRef.current = variante;

  useImperativeHandle(
    ref,
    () => ({
      andarPara: (celula) => cenaRef.current?.andarPara(avatarDonoId, celula) ?? false,
    }),
    [avatarDonoId],
  );

  // monta a Application uma única vez
  useEffect(() => {
    let cancelado = false;
    let appLocal: import("pixi.js").Application | null = null;

    async function montar() {
      const hospedeiro = hospedeiroRef.current;
      if (!hospedeiro) return;

      const { Application } = await import("pixi.js");
      const { CenaWorld: Cena } = await import("./cena");
      // desenhoV2.ts importa pixi.js — só carrega quando a variante pedir,
      // dentro do mesmo efeito assíncrono que já carrega o resto do Pixi.
      let desenhadores = DESENHADORES_PADRAO;
      if (varianteRef.current === "v2") {
        desenhadores = (await import("./desenhoV2")).DESENHADORES_V2;
        // Degrau B — sprites de verdade, por cima do procedural V2. Qualquer
        // falha aqui (rede, 404, import) é pega e IGNORADA: a variante "v2"
        // continua funcionando 100% procedural, exatamente como antes desta
        // camada existir. Nunca deixamos uma falha de asset derrubar a cena.
        try {
          const { carregarTexturasMovel, criarDesenhadorMovelComSprites } = await import(
            "./spritesV2"
          );
          const texturas = await carregarTexturasMovel();
          desenhadores = { ...desenhadores, movel: criarDesenhadorMovelComSprites(texturas) };
        } catch (erro) {
          console.warn("[world] sprites do Degrau B indisponíveis, seguindo 100% procedural:", erro);
        }
      }

      if (cancelado) return;

      const geo = estadoRef.current.geo;
      const { largura, altura } = Cena.tamanhoCanvas(geo);

      const app = new Application();
      await app.init({
        width: largura,
        height: altura,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      });

      // O StrictMode pode ter desmontado enquanto o init assíncrono corria.
      if (cancelado) {
        app.destroy(true, { children: true });
        return;
      }

      appLocal = app;
      hospedeiro.appendChild(app.canvas);

      const cena = new Cena(
        app,
        (celula) => cliqueRef.current(celula),
        // só interessa a parada do avatar controlado pelo jogador
        (avatarId, celula) => {
          if (avatarId === donoRef.current) pararRef.current?.(celula);
        },
        desenhadores,
      );
      cena.sincronizar(estadoRef.current);
      cenaRef.current = cena;
      setPronto(true);

      // Gancho de depuração (nunca em produção): o Ticker do Pixi depende de
      // requestAnimationFrame, que o navegador congela quando a aba está
      // oculta. Isto permite forçar um frame e inspecionar a cena em
      // automação headless, onde `document.visibilityState` é "hidden".
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__world = {
          app,
          cena,
          desenharUmFrame: () => app.renderer.render(app.stage),
        };
      }
    }

    void montar();

    return () => {
      cancelado = true;
      cenaRef.current?.destruir();
      cenaRef.current = null;
      appLocal?.destroy(true, { children: true });
      appLocal = null;
      setPronto(false);
    };
    // monta uma vez: mudanças de dados entram por `sincronizar` no efeito abaixo

  }, []);

  // repassa mudanças de estado para a cena já montada
  useEffect(() => {
    if (!pronto) return;
    cenaRef.current?.sincronizar(estado);
  }, [estado, pronto]);

  // Sem ResizeObserver de propósito: o canvas tem o tamanho nativo da sala e o
  // CSS (`width:100%` + `height:auto`) faz o ajuste à tela preservando a
  // proporção. Escalar também pela raiz do Pixi multiplicava as duas reduções.

  return (
    <div
      ref={hospedeiroRef}
      data-testid="world-canvas"
      data-pronto={pronto ? "1" : "0"}
      className="w-full touch-manipulation select-none"
      // Canvas é opaco para leitor de tela. O `img` + descrição textual garante
      // ao menos que a cena seja anunciada; a operação real da sede continua
      // possível 100% por teclado pelos botões do painel lateral (loja,
      // melhorar sede) — o canvas é a camada de deleite, nunca a única via.
      role="img"
      aria-label={descricaoAcessivel}
    />
  );
}
