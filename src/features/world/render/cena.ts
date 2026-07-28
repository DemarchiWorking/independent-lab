import { Application, Container, type Ticker } from "pixi.js";
import {
  celulaNoPonto,
  gridParaTela,
  medidasDaSala,
  TILE_H,
  type Celula,
} from "../engine/iso";
import { acharCaminho, bloqueiosDeMobilia } from "../engine/caminho";
import type { GeometriaSala } from "../engine/sala";
import {
  ALTURA_PAREDE,
  desenharAvatar,
  desenharMarcadorTile,
  desenharMovel,
  desenharParedes,
  desenharPiso,
  desenharTapete,
  type CategoriaMovel,
} from "./desenho";
import { CENARIO } from "./cores";

/**
 * Gerência da cena Pixi: monta o palco, mantém o depth-sort correto e anima o
 * caminhar dos avatares.
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
  categoria: CategoriaMovel;
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
  atual: Celula;
  caminho: Celula[];
  passo: number;
  progresso: number;
  vista: Container;
}

/** Velocidade do avatar em células por segundo. */
const CELULAS_POR_SEGUNDO = 2.6;

/**
 * Faz o canvas caber na largura do container preservando a proporção.
 * O tamanho INTERNO é o nativo da sala (nitidez); o CSS só ajusta a exibição.
 */
export function aplicarEstiloResponsivo(canvas: HTMLCanvasElement): void {
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.display = "block";
}

export class CenaWorld {
  private readonly raiz = new Container();
  private readonly camadaCenario = new Container();
  private readonly camadaDestaque = new Container();
  private readonly camadaDinamica = new Container();

  private geo: GeometriaSala | null = null;
  private bloqueadas = new Set<string>();
  private andarilhos = new Map<string, Andarilho>();
  private vistasMovel = new Map<string, Container>();
  private destruida = false;

  constructor(
    private readonly app: Application,
    private readonly aoClicarCelula: (celula: Celula) => void,
  ) {
    this.camadaDinamica.sortableChildren = true;
    this.raiz.addChild(this.camadaCenario, this.camadaDestaque, this.camadaDinamica);
    this.app.stage.addChild(this.raiz);

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointertap", (e) => {
      if (this.destruida) return;
      const local = this.raiz.toLocal(e.global);
      this.aoClicarCelula(celulaNoPonto(local.x, local.y));
    });

    this.app.ticker.add(this.avancar);
  }

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
  }

  /** Manda um avatar caminhar até uma célula. `false` se não há trajeto. */
  andarPara(avatarId: string, destino: Celula): boolean {
    const a = this.andarilhos.get(avatarId);
    if (!a || !this.geo) return false;

    const caminho = acharCaminho(a.atual, destino, {
      geo: this.geo,
      bloqueadas: this.bloqueadas,
    });
    if (!caminho || caminho.length < 2) return false;

    a.caminho = caminho;
    a.passo = 0;
    a.progresso = 0;
    return true;
  }

  /** Dimensões que o canvas precisa ter para esta sala, sem escala. */
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

  /**
   * (Re)monta o cenário e **redimensiona o canvas para o tamanho nativo da
   * sala**.
   *
   * O canvas é a única autoridade de tamanho, e a raiz nunca é escalada. Havia
   * dois mecanismos de escala competindo — `raiz.scale` e o `width:100%` do
   * CSS — e eles se multiplicavam: numa sede 8×8 no celular a sala saía a 209px
   * em vez dos 327px disponíveis. Além disso, o canvas era dimensionado só na
   * montagem, então evoluir a sede recortava a sala. Resolver os dois é a mesma
   * coisa: redimensionar aqui, e deixar o ajuste à tela por conta do CSS.
   */
  private montarCenario(geo: GeometriaSala): void {
    this.camadaCenario.removeChildren().forEach((c) => c.destroy({ children: true }));

    const { largura, altura } = CenaWorld.tamanhoCanvas(geo);
    this.app.renderer.resize(largura, altura);
    this.app.stage.hitArea = this.app.screen;
    // `autoDensity` reescreve o style do canvas a cada resize, sobrescrevendo o
    // ajuste responsivo — daí reaplicar aqui, e não uma vez na montagem.
    aplicarEstiloResponsivo(this.app.canvas);

    const m = medidasDaSala(geo.cols, geo.rows);
    this.raiz.position.set(m.offsetX, ALTURA_PAREDE + TILE_H);

    this.camadaCenario.addChild(
      desenharParedes(geo.cols, geo.rows),
      desenharPiso(geo.cols, geo.rows),
      desenharTapete(geo.cols, geo.rows),
    );
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
   */
  private desenharMoveis(moveis: MovelNaCena[]): void {
    const vistos = new Set<string>();

    for (const m of moveis) {
      vistos.add(m.id);
      let vista = this.vistasMovel.get(m.id);

      if (!vista) {
        vista = desenharMovel({
          cor: m.cor,
          categoria: m.categoria,
          selecionado: m.selecionado,
        });
        vista.label = `movel:${m.id}`;
        this.vistasMovel.set(m.id, vista);
        this.camadaDinamica.addChild(vista);
      }

      const p = gridParaTela(m.cx, m.cy);
      vista.position.set(p.x, p.y);
      vista.zIndex = (m.cx + m.cy) * 100;

      const realce = vista.getChildByLabel("realce");
      if (realce) realce.visible = m.selecionado;
    }

    for (const [id, vista] of this.vistasMovel) {
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
      }
    }

    for (const a of avatares) {
      if (this.andarilhos.has(a.id)) continue;

      const vista = desenharAvatar({ cor: a.cor, nome: a.nome, dono: a.dono });
      const p = gridParaTela(a.cx, a.cy);
      vista.position.set(p.x, p.y);
      vista.zIndex = (a.cx + a.cy) * 100 + 50;
      vista.label = `avatar:${a.id}`;
      this.camadaDinamica.addChild(vista);

      this.andarilhos.set(a.id, {
        atual: { cx: a.cx, cy: a.cy },
        caminho: [],
        passo: 0,
        progresso: 0,
        vista,
      });
    }
  }

  /** Loop de animação: interpola a posição de quem está caminhando. */
  private readonly avancar = (ticker: Ticker): void => {
    if (this.destruida) return;
    const dt = ticker.deltaMS / 1000;

    for (const a of this.andarilhos.values()) {
      if (a.caminho.length < 2 || a.passo >= a.caminho.length - 1) continue;

      a.progresso += dt * CELULAS_POR_SEGUNDO;

      while (a.progresso >= 1 && a.passo < a.caminho.length - 1) {
        a.progresso -= 1;
        a.passo += 1;
        a.atual = a.caminho[a.passo];
      }

      const chegou = a.passo >= a.caminho.length - 1;
      if (chegou) {
        a.progresso = 0;
        a.caminho = [];
      }

      const de = a.caminho[a.passo] ?? a.atual;
      const para = a.caminho[a.passo + 1] ?? a.atual;
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
  };
}
