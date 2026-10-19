import {
  Application,
  Container,
  type FederatedPointerEvent,
  type Text,
  type Ticker,
} from "pixi.js";
import {
  celulaNoPonto,
  gridParaTela,
  medidasDaSala,
  TILE_H,
  type Celula,
} from "../engine/iso";
import { acharCaminho, bloqueiosDeMobilia } from "../engine/caminho";
import { dentroDaSala, orientacaoDaCelula, type GeometriaSala } from "../engine/sala";
import type { FormaMovel } from "@/features/sede/catalogo";
import {
  ALTURA_PAREDE,
  animarAvatar,
  desenharAvatar,
  desenharMarcadorTile,
  desenharMovel,
  desenharParedes,
  desenharPiso,
  desenharTapete,
} from "./desenho";
import { CENARIO, hashTexto } from "./cores";

/**
 * Gerência da cena Pixi: monta o palco, mantém o depth-sort correto, anima o
 * caminhar dos avatares e dá o retorno visual do que o jogador faz.
 *
 * Fronteira de responsabilidade: esta classe NÃO decide regra de jogo. Ela
 * recebe estado pronto (`sincronizar`) e avisa cliques (`aoClicarCelula`); quem
 * decide se um clique vira "andar" ou "mover móvel" é o React, que por sua vez
 * chama as Server Actions atômicas já existentes em `features/sede/actions.ts`.
 * Por isso todo o miolo de regra é testável sem browser (`../engine/`).
 */

export interface MovelNaCena {
  id: string;
  cx: number;
  cy: number;
  cor: number;
  forma: FormaMovel;
  /** 1–3: níveis 2 e 3 ganham marcadores na peça */
  nivel: number;
  selecionado: boolean;
}

export interface AvatarNaCena {
  id: string;
  cx: number;
  cy: number;
  cor: number;
  nome: string;
  dono: boolean;
}

export interface EstadoCena {
  geo: GeometriaSala;
  moveis: MovelNaCena[];
  avatares: AvatarNaCena[];
  /** células a destacar no piso (destinos válidos no modo mover) */
  destaques: Celula[];
}

/** Posição animada de um avatar caminhando entre células. */
interface Andarilho {
  id: string;
  dono: boolean;
  atual: Celula;
  caminho: Celula[];
  passo: number;
  progresso: number;
  vista: Container;
  /** direção do olhar na tela e se está de costas para o observador */
  dirX: -1 | 1;
  deCostas: boolean;
  /** passos acumulados — alimenta o balanço do caminhar */
  fase: number;
  /** 1 → 0 logo depois de parar */
  assentar: number;
  semente: number;
}

/** Velocidade do avatar em células por segundo. */
const CELULAS_POR_SEGUNDO = 2.6;

/** Limites da escala da sala em relação ao tamanho nativo. */
const ESCALA_MIN = 0.45;
const ESCALA_MAX = 2.6;

/** Quadros por segundo quando só há movimento ambiente (respirar, piscar). */
const FPS_AMBIENTE = 20;

/** Quanto tempo a piscada vermelha de "não dá para ir aí" fica na tela. */
const DURACAO_RECUSA = 0.55;

/** Abaixo desta escala (celular), só os nomes de quem está perto aparecem. */
const ESCALA_ROTULOS_COMPLETOS = 0.8;

/** Tamanho da etiqueta NA TELA, em px, qualquer que seja a escala da sala. */
const ROTULO_PX_NA_TELA = 12;
/** Tamanho da fonte da etiqueta em `desenho.ts` (unidades locais). */
const ROTULO_FONTE_LOCAL = 11;
/** Onde a etiqueta fica sobre o boneco (px locais, acima dos pés) e seu respiro. */
const ROTULO_Y_LOCAL = -52;
const ROTULO_ALTURA_TELA = 16;
const ROTULO_MARGEM_TELA = 2;

const FONTE_PADRAO = "Trebuchet MS, Verdana, sans-serif";

export class CenaWorld {
  private readonly raiz = new Container();
  private readonly camadaCenario = new Container();
  private readonly camadaDestaque = new Container();
  private readonly camadaFeedback = new Container();
  private readonly camadaDinamica = new Container();

  private readonly marcadorHover = desenharMarcadorTile(CENARIO.hover, 0.8);
  private readonly marcadorDestino = desenharMarcadorTile(CENARIO.realce, 1);
  private readonly marcadorRecusa = desenharMarcadorTile(CENARIO.invalido, 1);

  private geo: GeometriaSala | null = null;
  private bloqueadas = new Set<string>();
  private andarilhos = new Map<string, Andarilho>();
  private vistasMovel = new Map<string, { vista: Container; chave: string }>();
  private destruida = false;

  /** largura (px CSS) que o container oferece; `null` = tamanho nativo */
  private larguraDisponivel: number | null = null;
  private escala = 1;
  private resolucao = 1;
  private reduzir = false;
  private fonte = FONTE_PADRAO;
  private foco: string | null = null;
  private tempo = 0;

  private destino: { avatarId: string } | null = null;
  private recusa: { restante: number } | null = null;

  constructor(
    private readonly app: Application,
    private readonly aoClicarCelula: (celula: Celula) => void,
    /** Avisa que um avatar TERMINOU de andar e parou nesta célula.
     *  Só reporta posição — quem decide o que isso significa (está perto
     *  de alguém? dá para interagir?) é `engine/proximidade.ts`. Regra
     *  nunca mora no `render/`. */
    private readonly aoParar?: (avatarId: string, celula: Celula) => void,
  ) {
    this.camadaDinamica.sortableChildren = true;
    for (const marcador of [this.marcadorHover, this.marcadorDestino, this.marcadorRecusa]) {
      marcador.visible = false;
      this.camadaFeedback.addChild(marcador);
    }
    this.raiz.addChild(
      this.camadaCenario,
      this.camadaDestaque,
      this.camadaFeedback,
      this.camadaDinamica,
    );
    this.app.stage.addChild(this.raiz);

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointertap", (e: FederatedPointerEvent) => {
      if (this.destruida) return;
      this.aoClicarCelula(this.celulaDoEvento(e));
    });
    this.app.stage.on("pointermove", (e: FederatedPointerEvent) => {
      // Toque não tem "passar o mouse": o marcador ficaria preso na última célula.
      if (this.destruida || e.pointerType !== "mouse") return;
      this.mostrarHover(this.celulaDoEvento(e));
    });
    const saiu = () => this.mostrarHover(null);
    this.app.stage.on("pointerleave", saiu);
    this.app.stage.on("pointerout", saiu);

    this.app.ticker.add(this.avancar);
  }

  // ------------------------------------------------------------ API pública

  /** Reconstrói o palco a partir do estado. Chamado quando os dados mudam. */
  sincronizar(estado: EstadoCena): void {
    if (this.destruida) return;

    const geoMudou =
      !this.geo ||
      this.geo.cols !== estado.geo.cols ||
      this.geo.rows !== estado.geo.rows;

    if (geoMudou) {
      this.geo = estado.geo;
      this.montarCenario(estado.geo);
    }

    this.bloqueadas = bloqueiosDeMobilia(estado.moveis);
    this.desenharDestaques(estado.destaques);
    this.desenharMoveis(estado.moveis);
    this.desenharAvatares(estado.avatares);
    this.atualizarEtiquetas();
    this.acordar();
  }

  /**
   * Manda um avatar caminhar até uma célula. `false` se não há trajeto.
   * Quando há, marca o destino no piso até o boneco chegar; quando não há
   * (móvel no caminho), pisca a célula em vermelho.
   */
  andarPara(avatarId: string, destino: Celula): boolean {
    const a = this.andarilhos.get(avatarId);
    if (!a || !this.geo) return false;
    if (!dentroDaSala(destino.cx, destino.cy, this.geo)) return false;

    // Clicar onde já está não é erro, é só nada a fazer.
    if (a.atual.cx === destino.cx && a.atual.cy === destino.cy) return true;

    const caminho = acharCaminho(a.atual, destino, {
      geo: this.geo,
      bloqueadas: this.bloqueadas,
    });
    if (!caminho || caminho.length < 2) {
      this.recusar(destino);
      return false;
    }

    a.caminho = caminho;
    a.passo = 0;
    a.progresso = 0;
    this.mostrarDestino(avatarId, destino);
    this.acordar();
    return true;
  }

  /**
   * Ajusta o tamanho da sala à largura que o container oferece.
   *
   * O canvas passa a ter EXATAMENTE a largura do container e a raiz é que
   * escala, então o Pixi rasteriza o vetor no tamanho final: nítido em qualquer
   * tela. Antes o canvas tinha o tamanho nativo da sala e o CSS esticava o
   * bitmap — borrado no desktop e com nomes ilegíveis no celular.
   */
  ajustarTamanho(larguraDisponivel: number | null): void {
    this.larguraDisponivel =
      larguraDisponivel !== null && larguraDisponivel > 0 ? larguraDisponivel : null;
    this.aplicarTamanho();
  }

  /** Avatar que o jogador controla — âncora de quem "está perto" no celular. */
  definirFoco(avatarId: string | null): void {
    this.foco = avatarId;
    this.atualizarEtiquetas();
    this.acordar();
  }

  /** Respeita `prefers-reduced-motion`: sem balanço, respiro, piscada nem pulso. */
  definirMovimentoReduzido(reduzir: boolean): void {
    this.reduzir = reduzir;
    this.acordar();
  }

  /** Aplica a família tipográfica real (a do `next/font`) nas etiquetas. */
  definirFonte(familia: string): void {
    this.fonte = familia;
    for (const a of this.andarilhos.values()) {
      const etiqueta = this.etiquetaDe(a);
      if (etiqueta) etiqueta.style.fontFamily = familia;
    }
    this.acordar();
  }

  /** Dimensões nativas do canvas para esta sala (escala 1). */
  static tamanhoCanvas(geo: GeometriaSala): { largura: number; altura: number } {
    const m = medidasDaSala(geo.cols, geo.rows);
    return {
      largura: m.largura,
      altura: m.altura + ALTURA_PAREDE + TILE_H,
    };
  }

  destruir(): void {
    this.destruida = true;
    this.app.ticker.remove(this.avancar);
    this.app.stage.removeAllListeners();
    this.andarilhos.clear();
    this.vistasMovel.clear();
  }

  // ---------------------------------------------------------------- interno

  /** (Re)monta o cenário e ajusta o tamanho do canvas. */
  private montarCenario(geo: GeometriaSala): void {
    this.camadaCenario.removeChildren().forEach((c) => c.destroy({ children: true }));

    this.camadaCenario.addChild(
      desenharParedes(geo.cols, geo.rows),
      desenharPiso(geo.cols, geo.rows),
      desenharTapete(geo.cols, geo.rows),
    );
    this.aplicarTamanho();
  }

  private aplicarTamanho(): void {
    if (!this.geo || this.destruida) return;

    const nativo = CenaWorld.tamanhoCanvas(this.geo);
    const largura = this.larguraDisponivel ?? nativo.largura;
    this.escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, largura / nativo.largura));
    this.resolucao = Math.min(2, window.devicePixelRatio || 1);

    this.app.renderer.resize(
      Math.round(nativo.largura * this.escala),
      Math.round(nativo.altura * this.escala),
      this.resolucao,
    );
    this.app.stage.hitArea = this.app.screen;
    // `autoDensity` já grava width/height exatos em px no style; só centraliza
    // quando o container é mais largo que o teto de escala.
    this.app.canvas.style.display = "block";
    this.app.canvas.style.margin = "0 auto";

    const m = medidasDaSala(this.geo.cols, this.geo.rows);
    this.raiz.scale.set(this.escala);
    this.raiz.position.set(m.offsetX * this.escala, (ALTURA_PAREDE + TILE_H) * this.escala);

    this.atualizarEtiquetas();
    this.acordar();
  }

  private celulaDoEvento(e: FederatedPointerEvent): Celula {
    const local = this.raiz.toLocal(e.global);
    return celulaNoPonto(local.x, local.y);
  }

  private dentro(c: Celula): boolean {
    return !!this.geo && dentroDaSala(c.cx, c.cy, this.geo);
  }

  private colocarMarcador(marcador: Container, c: Celula): void {
    const p = gridParaTela(c.cx, c.cy);
    marcador.position.set(p.x, p.y);
  }

  private mostrarHover(c: Celula | null): void {
    const valida = c !== null && this.dentro(c);
    this.marcadorHover.visible = valida;
    this.app.stage.cursor = valida ? "pointer" : "default";
    if (valida) this.colocarMarcador(this.marcadorHover, c);
    this.acordar();
  }

  private mostrarDestino(avatarId: string, c: Celula): void {
    this.destino = { avatarId };
    this.colocarMarcador(this.marcadorDestino, c);
    this.marcadorDestino.visible = true;
    this.marcadorDestino.scale.set(1);
    this.marcadorDestino.alpha = 1;
  }

  private esconderDestino(): void {
    this.destino = null;
    this.marcadorDestino.visible = false;
  }

  private recusar(c: Celula): void {
    this.colocarMarcador(this.marcadorRecusa, c);
    this.marcadorRecusa.visible = true;
    this.marcadorRecusa.alpha = 1;
    this.recusa = { restante: DURACAO_RECUSA };
    this.acordar();
  }

  /** Religa o ticker (parado quando a cena está em repouso) e o libera ao máximo. */
  private acordar(): void {
    if (this.destruida) return;
    this.app.ticker.maxFPS = 0;
    if (!this.app.ticker.started) this.app.ticker.start();
  }

  private etiquetaDe(a: Andarilho): Text | null {
    return a.vista.getChildByLabel("etiqueta") as Text | null;
  }

  /**
   * Etiquetas legíveis em qualquer escala:
   * - a sala escala com a largura do container (de 0,45× a 2,6×), então a
   *   etiqueta é contra-escalada para ter sempre ~12 px na tela: nem
   *   ilegível no celular, nem gigante no desktop;
   * - nessa escala só aparecem o dono, o boneco do jogador e quem está a até
   *   2 células dele — todos os nomes juntos virariam uma mancha;
   * - a resolução do texto acompanha a escala × densidade de pixels, senão a
   *   etiqueta é rasterizada pequena e esticada (borrada).
   */
  private atualizarEtiquetas(): void {
    const foco = this.foco ? this.andarilhos.get(this.foco) : undefined;
    const compacto = this.escala < ESCALA_ROTULOS_COMPLETOS;
    const k = ROTULO_PX_NA_TELA / ROTULO_FONTE_LOCAL / this.escala;

    for (const a of this.andarilhos.values()) {
      const etiqueta = this.etiquetaDe(a);
      if (!etiqueta) continue;

      const perto =
        !!foco &&
        Math.max(Math.abs(a.atual.cx - foco.atual.cx), Math.abs(a.atual.cy - foco.atual.cy)) <= 2;
      etiqueta.visible = !compacto || a.id === this.foco || a.dono || perto;
      etiqueta.scale.set(k);

      const resolucao = Math.min(4, Math.max(1, Math.ceil(this.resolucao * this.escala * k)));
      if (etiqueta.resolution !== resolucao) etiqueta.resolution = resolucao;
    }
  }

  /**
   * Mantém cada etiqueta inteira dentro do quadro e sem cobrir as vizinhas.
   *
   * Bonecos juntos (a equipe inteira no centro da sala) empilhariam os nomes
   * uns sobre os outros, e quem está perto da borda teria o nome cortado. Aqui
   * cada etiqueta é empurrada para dentro do canvas e, se bater numa já
   * colocada, sobe uma linha por vez. Os de baixo (mais à frente) ficam no
   * lugar natural; os de trás é que sobem.
   */
  private posicionarEtiquetas(): void {
    if (!this.geo) return;
    const larguraTela = this.app.screen.width;
    const k = this.escala;

    const itens: Array<{ etiqueta: Text; cx: number; base: number; metade: number }> = [];
    for (const a of this.andarilhos.values()) {
      const etiqueta = this.etiquetaDe(a);
      if (!etiqueta || !etiqueta.visible) continue;
      itens.push({
        etiqueta,
        cx: this.raiz.x + a.vista.x * k,
        base: this.raiz.y + a.vista.y * k + ROTULO_Y_LOCAL * k,
        metade: (etiqueta.width * k) / 2,
      });
    }
    // de baixo para cima: quem está à frente mantém o lugar natural
    itens.sort((a, b) => b.base - a.base);

    const colocados: Array<{ x0: number; x1: number; y0: number; y1: number }> = [];
    for (const it of itens) {
      const x = Math.min(
        Math.max(it.cx, it.metade + ROTULO_MARGEM_TELA),
        Math.max(it.metade + ROTULO_MARGEM_TELA, larguraTela - it.metade - ROTULO_MARGEM_TELA),
      );
      let base = it.base;
      for (let tentativa = 0; tentativa < 8; tentativa++) {
        const bate = colocados.some(
          (r) =>
            x - it.metade < r.x1 &&
            x + it.metade > r.x0 &&
            base - ROTULO_ALTURA_TELA < r.y1 &&
            base > r.y0,
        );
        if (!bate) break;
        base -= ROTULO_ALTURA_TELA;
      }
      colocados.push({
        x0: x - it.metade,
        x1: x + it.metade,
        y0: base - ROTULO_ALTURA_TELA,
        y1: base,
      });
      // de volta para o espaço local do boneco
      it.etiqueta.x = (x - it.cx) / k;
      it.etiqueta.y = ROTULO_Y_LOCAL + (base - it.base) / k;
    }
  }

  private desenharDestaques(celulas: Celula[]): void {
    this.camadaDestaque.removeChildren().forEach((c) => c.destroy({ children: true }));

    for (const c of celulas) {
      const marcador = desenharMarcadorTile(CENARIO.realce, 0.85);
      const p = gridParaTela(c.cx, c.cy);
      marcador.position.set(p.x, p.y);
      this.camadaDestaque.addChild(marcador);
    }
  }

  /**
   * Reconciliação por `id`: cria a vista quando o móvel aparece, só MUTA
   * enquanto ele existir, e destrói quando some.
   *
   * Reconstruir tudo a cada sincronização seria mais simples, mas
   * `sincronizar` roda a cada clique (entrar no modo mover muda o estado), e
   * recriar `Graphics` realoca buffer de GPU à toa. O realce de seleção é um
   * filho com `visible` alternável justamente para não exigir redesenho.
   *
   * A exceção é quando a PEÇA muda de verdade (forma, nível, cor ou a
   * orientação, que depende da parede onde o móvel foi parar): aí o desenho é
   * refeito, identificado por uma chave.
   */
  private desenharMoveis(moveis: MovelNaCena[]): void {
    const vistos = new Set<string>();

    for (const m of moveis) {
      vistos.add(m.id);
      const orientacao = orientacaoDaCelula(m);
      const chave = `${m.forma}|${orientacao}|${m.nivel}|${m.cor}`;
      let registro = this.vistasMovel.get(m.id);

      if (registro && registro.chave !== chave) {
        this.camadaDinamica.removeChild(registro.vista);
        registro.vista.destroy({ children: true });
        registro = undefined;
      }

      if (!registro) {
        const vista = desenharMovel({
          cor: m.cor,
          forma: m.forma,
          orientacao,
          nivel: m.nivel,
          selecionado: m.selecionado,
        });
        vista.label = `movel:${m.id}`;
        registro = { vista, chave };
        this.vistasMovel.set(m.id, registro);
        this.camadaDinamica.addChild(vista);
      }

      const { vista } = registro;
      const p = gridParaTela(m.cx, m.cy);
      vista.position.set(p.x, p.y);
      vista.zIndex = (m.cx + m.cy) * 100;

      const realce = vista.getChildByLabel("realce");
      if (realce) realce.visible = m.selecionado;
    }

    for (const [id, { vista }] of this.vistasMovel) {
      if (vistos.has(id)) continue;
      this.camadaDinamica.removeChild(vista);
      vista.destroy({ children: true });
      this.vistasMovel.delete(id);
    }
  }

  private desenharAvatares(avatares: AvatarNaCena[]): void {
    const vistos = new Set(avatares.map((a) => a.id));

    // remove quem saiu (ex.: cargo de IA que deixou de existir)
    for (const [id, a] of this.andarilhos) {
      if (!vistos.has(id)) {
        this.camadaDinamica.removeChild(a.vista);
        a.vista.destroy({ children: true });
        this.andarilhos.delete(id);
        if (this.destino?.avatarId === id) this.esconderDestino();
      }
    }

    for (const a of avatares) {
      if (this.andarilhos.has(a.id)) continue;

      const vista = desenharAvatar({
        id: a.id,
        cor: a.cor,
        nome: a.nome,
        dono: a.dono,
        fonte: this.fonte,
      });
      const p = gridParaTela(a.cx, a.cy);
      vista.position.set(p.x, p.y);
      vista.zIndex = (a.cx + a.cy) * 100 + 50;
      vista.label = `avatar:${a.id}`;
      this.camadaDinamica.addChild(vista);

      this.andarilhos.set(a.id, {
        id: a.id,
        dono: a.dono,
        atual: { cx: a.cx, cy: a.cy },
        caminho: [],
        passo: 0,
        progresso: 0,
        vista,
        dirX: 1,
        deCostas: false,
        fase: 0,
        assentar: 0,
        semente: (hashTexto(a.id) % 1000) / 1000,
      });
    }
  }

  /** Avança um avatar que está caminhando e avisa quando ele chega. */
  private caminhar(id: string, a: Andarilho, dt: number): void {
    a.progresso += dt * CELULAS_POR_SEGUNDO;
    a.fase += dt * CELULAS_POR_SEGUNDO * 0.5;

    while (a.progresso >= 1 && a.passo < a.caminho.length - 1) {
      a.progresso -= 1;
      a.passo += 1;
      a.atual = a.caminho[a.passo];
    }

    const chegou = a.passo >= a.caminho.length - 1;
    const de = a.caminho[Math.min(a.passo, a.caminho.length - 1)] ?? a.atual;
    const para = a.caminho[a.passo + 1] ?? a.atual;

    // Para onde o boneco olha. Na projeção 2:1, o deslocamento horizontal da
    // tela é (cx − cy) e o vertical é (cx + cy): vertical negativo = de costas.
    const dx = para.cx - de.cx - (para.cy - de.cy);
    const dy = para.cx - de.cx + (para.cy - de.cy);
    if (dx !== 0) a.dirX = dx > 0 ? 1 : -1;
    if (dx !== 0 || dy !== 0) a.deCostas = dy < 0;

    if (chegou) {
      a.progresso = 0;
      a.caminho = [];
      a.assentar = 1;
      if (this.destino?.avatarId === id) this.esconderDestino();
      this.aoParar?.(id, a.atual);
      if (id === this.foco) this.atualizarEtiquetas();
    }

    const t = chegou ? 0 : a.progresso;
    const pDe = gridParaTela(de.cx, de.cy);
    const pPara = gridParaTela(para.cx, para.cy);
    a.vista.position.set(
      pDe.x + (pPara.x - pDe.x) * t,
      pDe.y + (pPara.y - pDe.y) * t,
    );

    // profundidade fracionária: o boneco passa corretamente atrás/na frente
    // dos móveis mesmo no meio de um passo
    const cxF = de.cx + (para.cx - de.cx) * t;
    const cyF = de.cy + (para.cy - de.cy) * t;
    a.vista.zIndex = (cxF + cyF) * 100 + 50;
  }

  /** Pulso do destino e fade da recusa. Devolve `true` se ainda anima. */
  private animarFeedback(dt: number): boolean {
    let animando = false;

    if (this.destino) {
      const pulso = this.reduzir ? 0 : Math.sin(this.tempo * 7);
      this.marcadorDestino.scale.set(1 + 0.08 * pulso);
      this.marcadorDestino.alpha = 0.85 + 0.15 * pulso;
      animando = !this.reduzir;
    }

    if (this.recusa) {
      this.recusa.restante -= dt;
      if (this.recusa.restante <= 0) {
        this.recusa = null;
        this.marcadorRecusa.visible = false;
      } else {
        // Sem movimento reduzido, a piscada some suavemente; com ele, fica
        // fixa pelo mesmo tempo e some de uma vez.
        this.marcadorRecusa.alpha = this.reduzir ? 1 : this.recusa.restante / DURACAO_RECUSA;
        animando = true;
      }
    }

    return animando;
  }

  /** Loop de animação. Também decide quando o ticker pode descansar. */
  private readonly avancar = (ticker: Ticker): void => {
    if (this.destruida) return;
    // teto no dt: voltar de uma aba oculta não pode teletransportar ninguém
    const dt = Math.min(ticker.deltaMS, 100) / 1000;
    this.tempo += dt;

    let animando = false;

    for (const [id, a] of this.andarilhos) {
      if (a.caminho.length >= 2 && a.passo < a.caminho.length - 1) {
        this.caminhar(id, a, dt);
      }
      const andando = a.caminho.length >= 2;

      if (a.assentar > 0) a.assentar = Math.max(0, a.assentar - dt * 6);
      if (andando || a.assentar > 0) animando = true;

      animarAvatar(a.vista, {
        andando,
        fase: a.fase,
        tempo: this.tempo,
        assentar: a.assentar,
        dirX: a.dirX,
        deCostas: a.deCostas,
        semente: a.semente,
        reduzir: this.reduzir,
      });
    }

    if (this.animarFeedback(dt)) animando = true;
    this.posicionarEtiquetas();

    // Economia de bateria: a 60 fps só enquanto algo se move de verdade; com
    // gente parada (respirar, piscar) 20 fps bastam; e quem pediu movimento
    // reduzido recebe o ticker parado em repouso (religa em `acordar`).
    const relogio = this.app.ticker;
    if (animando) relogio.maxFPS = 0;
    else if (!this.reduzir && this.andarilhos.size > 0) relogio.maxFPS = FPS_AMBIENTE;
    else relogio.stop();
  };
}
