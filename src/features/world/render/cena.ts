import { Application, Container, type Ticker } from "pixi.js";
import {
  celulaNoPonto,
  gridParaTela,
  medidasDaSala,
  TILE_H,
  type Celula,
} from "../engine/iso";
import { acharCaminho, bloqueiosDeMobilia } from "../engine/caminho";
import { estaProximo } from "../engine/proximidade";
import type { GeometriaSala } from "../engine/sala";
import {
  ALTURA_PAREDE,
  desenharAvatar,
  desenharBalao,
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
  /** dá para conversar com ele? (GH-WORLD-07 — falso para o próprio jogador) */
  interagivel: boolean;
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
  /**
   * Posição FRACIONÁRIA no grid — igual a `atual` quando parado, e interpolada
   * no meio de um passo. É o que a proximidade lê: arredondar aqui faria o
   * balão piscar durante a caminhada.
   */
  cxF: number;
  cyF: number;
  interagivel: boolean;
  /**
   * Referência direta ao balão, resolvida UMA vez na criação.
   * `getChildByLabel` é busca linear nos filhos; chamá-la por avatar a cada
   * frame seria trabalho recorrente à toa — o mesmo motivo pelo qual a
   * mobília é reconciliada por id em vez de redesenhada.
   */
  balao: Container;
}

/** Velocidade do avatar em células por segundo. */
const CELULAS_POR_SEGUNDO = 2.6;

/** Pulso do balão: amplitude e velocidade do "zoom in / zoom out". */
const BALAO_AMPLITUDE = 0.1;
const BALAO_VELOCIDADE = 3.2;
/** Duração de um ciclo completo do pulso, em segundos. */
const BALAO_PERIODO = (2 * Math.PI) / BALAO_VELOCIDADE;

export interface OpcoesCena {
  aoClicarCelula: (celula: Celula) => void;
  /** clique num NPC/jogador com balão aceso (GH-WORLD-07) */
  aoInteragir?: (avatarId: string) => void;
  /** id do avatar que o jogador controla — a origem da proximidade */
  avatarControladoId: string;
}

/**
 * O jogador pediu menos movimento? Então o balão aparece parado.
 *
 * Espelha o `prefers-reduced-motion` que `globals.css` já respeita no DOM — o
 * canvas não herda media query nenhuma, então a checagem é explícita aqui.
 */
function movimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  /** tempo acumulado em segundos — só alimenta o pulso do balão */
  private tempo = 0;
  private readonly semMovimento = movimentoReduzido();

  constructor(
    private readonly app: Application,
    private readonly opcoes: OpcoesCena,
  ) {
    this.camadaDinamica.sortableChildren = true;
    this.raiz.addChild(this.camadaCenario, this.camadaDestaque, this.camadaDinamica);
    this.app.stage.addChild(this.raiz);

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointertap", (e) => {
      if (this.destruida) return;
      const local = this.raiz.toLocal(e.global);
      this.opcoes.aoClicarCelula(celulaNoPonto(local.x, local.y));
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
      const existente = this.andarilhos.get(a.id);

      // Já está na cena: MUTA (nunca recria — o boneco perderia a posição no
      // meio de um passo). Antes daqui havia um `continue` que ignorava toda
      // mudança em avatar existente; com `interagivel` isso viraria bug —
      // contratar um Funcionário de IA não acenderia o balão dele até um
      // remonte de cena.
      if (existente) {
        existente.interagivel = a.interagivel;
        if (!a.interagivel) this.apagarBalao(existente);
        continue;
      }

      const vista = desenharAvatar({ cor: a.cor, nome: a.nome, dono: a.dono });
      const p = gridParaTela(a.cx, a.cy);
      vista.position.set(p.x, p.y);
      vista.zIndex = (a.cx + a.cy) * 100 + 50;
      vista.label = `avatar:${a.id}`;

      // Clique por ENTIDADE (o único do projeto — todo o resto resolve por
      // célula). `stopPropagation` é obrigatório: o evento borbulha até o
      // `stage`, que tem o handler de "andar até a célula"; sem isso o boneco
      // sairia andando por baixo do painel que acabou de abrir.
      vista.on("pointertap", (e) => {
        if (this.destruida) return;
        const alvo = this.andarilhos.get(a.id);
        // só conversa quem está interagível E com o balão aceso: sem a segunda
        // condição daria para clicar num NPC do outro lado da sala
        if (!alvo?.interagivel || !alvo.balao.visible) return;
        e.stopPropagation();
        this.opcoes.aoInteragir?.(a.id);
      });

      // O balão é criado JUNTO com o avatar e só alternado por
      // `visible`/`scale` depois — mesmo idioma do "realce" da mobília.
      // Instanciá-lo no momento em que o jogador chega perto alocaria
      // `Graphics` dentro do ticker, exatamente o que a reconciliação por id
      // existe para evitar. Fica por último para desenhar sobre a etiqueta.
      const balao = desenharBalao();
      balao.label = "balao"; // só para inspeção manual da cena; nada depende
      balao.visible = false;
      vista.addChild(balao);

      this.camadaDinamica.addChild(vista);

      this.andarilhos.set(a.id, {
        atual: { cx: a.cx, cy: a.cy },
        caminho: [],
        passo: 0,
        progresso: 0,
        vista,
        cxF: a.cx,
        cyF: a.cy,
        interagivel: a.interagivel,
        balao,
      });
    }
  }

  /** Apaga o balão e devolve o avatar ao estado não-clicável. */
  private apagarBalao(a: Andarilho): void {
    a.balao.visible = false;
    a.vista.eventMode = "none";
    a.vista.cursor = "default";
  }

  /**
   * Acende/apaga o balão de cada NPC conforme a distância até o avatar
   * controlado, e pulsa quem está aceso.
   *
   * A REGRA (quem está perto) mora em `engine/proximidade.ts` — aqui só se
   * desenha o resultado. É a mesma fronteira do resto do arquivo: o `render/`
   * não decide nada.
   */
  private atualizarBaloes(dt: number): void {
    const jogador = this.andarilhos.get(this.opcoes.avatarControladoId);

    // O acumulador é enrolado no período do seno em vez de crescer para sempre:
    // numa aba aberta o dia inteiro, um float grande faz `Math.sin` perder
    // precisão e o pulso começa a tremer. `% PERIODO` mantém a fase idêntica.
    this.tempo = (this.tempo + dt) % BALAO_PERIODO;

    const escala = this.semMovimento
      ? 1
      : 1 + BALAO_AMPLITUDE * Math.sin(this.tempo * BALAO_VELOCIDADE);

    for (const [id, a] of this.andarilhos) {
      if (!a.interagivel || id === this.opcoes.avatarControladoId) {
        this.apagarBalao(a);
        continue;
      }

      const perto =
        jogador !== undefined &&
        estaProximo({ cx: jogador.cxF, cy: jogador.cyF }, { cx: a.cxF, cy: a.cyF });

      if (!perto) {
        this.apagarBalao(a);
        continue;
      }

      a.balao.visible = true;
      a.balao.scale.set(escala);
      a.vista.eventMode = "static";
      a.vista.cursor = "pointer";
    }
  }

  /**
   * Loop de animação: interpola a posição de quem está caminhando e depois
   * resolve os balões.
   *
   * Duas passadas de propósito: a primeira sai cedo (`continue`) para quem está
   * parado, que é a maioria dos frames. Pendurar o balão nela deixaria os NPCs
   * — que nunca caminham — de fora justamente do efeito que é deles.
   */
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
      a.cxF = cxF;
      a.cyF = cyF;
    }

    this.atualizarBaloes(dt);
  };
}
