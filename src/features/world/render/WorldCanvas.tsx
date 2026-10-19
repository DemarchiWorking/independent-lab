"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { Celula } from "../engine/iso";
import { CenaWorld, type EstadoCena } from "./cena";

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
    let desligar: (() => void) | null = null;

    async function montar() {
      const hospedeiro = hospedeiroRef.current;
      if (!hospedeiro) return;

      // Variante do Pixi sem `new Function`: a CSP do app não libera eval.
      await import("pixi.js/unsafe-eval");
      const { Application } = await import("pixi.js");
      const { CenaWorld: Cena } = await import("./cena");

      if (cancelado) return;

      // As etiquetas só saem nítidas se a fonte já estiver carregada quando o
      // texto é rasterizado. Falha aqui (navegador sem a API) não pode travar a cena.
      await document.fonts?.ready.catch(() => undefined);

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
      );
      cena.definirFonte(getComputedStyle(hospedeiro).fontFamily);
      cena.definirFoco(donoRef.current);
      cena.sincronizar(estadoRef.current);
      cena.ajustarTamanho(hospedeiro.clientWidth);
      cenaRef.current = cena;

      let ultimaLargura = hospedeiro.clientWidth;

      // A sala acompanha a largura do container (janela, painel lateral,
      // rotação do celular) e a densidade de pixels (zoom, trocar de monitor).
      const observador = new ResizeObserver(([entrada]) => {
        const largura = Math.round(entrada.contentRect.width);
        if (largura !== ultimaLargura) {
          ultimaLargura = largura;
          cena.ajustarTamanho(largura);
        }
      });
      observador.observe(hospedeiro);

      const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
      const aoMudarMovimento = () => cena.definirMovimentoReduzido(semMovimento.matches);
      aoMudarMovimento();
      semMovimento.addEventListener("change", aoMudarMovimento);

      let densidade: MediaQueryList | null = null;
      const aoMudarDensidade = () => {
        cena.ajustarTamanho(hospedeiro.clientWidth);
        ouvirDensidade();
      };
      const ouvirDensidade = () => {
        densidade?.removeEventListener("change", aoMudarDensidade);
        densidade = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        densidade.addEventListener("change", aoMudarDensidade, { once: true });
      };
      ouvirDensidade();

      desligar = () => {
        observador.disconnect();
        semMovimento.removeEventListener("change", aoMudarMovimento);
        densidade?.removeEventListener("change", aoMudarDensidade);
      };

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
      desligar?.();
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

  // o boneco que o jogador controla pode mudar entre telas (dono × visitante)
  useEffect(() => {
    if (pronto) cenaRef.current?.definirFoco(avatarDonoId);
  }, [avatarDonoId, pronto]);

  return (
    <div
      ref={hospedeiroRef}
      data-testid="world-canvas"
      data-pronto={pronto ? "1" : "0"}
      className="w-full min-w-0 touch-manipulation select-none"
      // Canvas é opaco para leitor de tela. O `img` + descrição textual garante
      // ao menos que a cena seja anunciada; a operação real da sede continua
      // possível 100% por teclado pelos botões do painel lateral (loja,
      // melhorar sede) — o canvas é a camada de deleite, nunca a única via.
      role="img"
      aria-label={descricaoAcessivel}
    />
  );
}
