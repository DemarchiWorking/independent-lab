import { Container, Graphics, Text } from "pixi.js";
import { gridParaTela, TILE_H, TILE_W, type Ponto } from "../engine/iso";
import type { Orientacao } from "../engine/sala";
import type { FormaMovel } from "@/features/sede/catalogo";
import { ajustarBrilho, CENARIO, peleDoId } from "./cores";

/**
 * Desenho procedural da cena — sem nenhum asset de imagem.
 *
 * Tudo é vetor (Pixi `Graphics`) derivado dos tokens: não temos sprite sheet
 * de pixel art, e depender de arte externa travaria a entrega. A contrapartida
 * é boa: a cena escala em qualquer resolução sem blur, muda de cor por token,
 * e o bundle não carrega imagem nenhuma.
 *
 * Convenção de luz (constante na cena inteira): topo claro → face direita
 * média → face esquerda escura. É o que dá leitura de volume ao bloco iso.
 */

const BRILHO_TOPO = 1.0;
const BRILHO_DIREITA = 0.78;
const BRILHO_ESQUERDA = 0.58;
const BRILHO_PAREDE_DIREITA = 0.85;
const BRILHO_PAREDE_ESQUERDA = 0.68;

/** Altura visual de uma parede, em px. */
export const ALTURA_PAREDE = 58;

const LOSANGO = [0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0];

/** Losango do tile centrado em (0,0) — a unidade visual de todo o palco. */
function losango(g: Graphics, cor: number, alpha = 1): Graphics {
  return g.poly(LOSANGO).fill({ color: cor, alpha });
}

/** Piso de tábuas: dois tons alternados, com borda sutil para marcar a grade. */
export function desenharPiso(cols: number, rows: number): Container {
  const camada = new Container();

  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const { x, y } = gridParaTela(cx, cy);
      const claro = (cx + cy) % 2 === 0;
      const g = new Graphics();
      losango(g, claro ? CENARIO.pisoClaro : CENARIO.pisoEscuro);
      g.poly(LOSANGO).stroke({
        width: 1,
        color: CENARIO.pisoBorda,
        alpha: 0.35,
      });
      g.position.set(x, y);
      camada.addChild(g);
    }
  }

  return camada;
}

/** Tapete central — o "ponto quente" da sala, como no print do Startup Panic. */
export function desenharTapete(cols: number, rows: number): Container {
  const camada = new Container();
  const de = { cx: 1, cy: 1 };
  const ate = { cx: Math.max(1, cols - 2), cy: Math.max(1, rows - 2) };

  for (let cx = de.cx; cx <= ate.cx; cx++) {
    for (let cy = de.cy; cy <= ate.cy; cy++) {
      const { x, y } = gridParaTela(cx, cy);
      const g = new Graphics();
      losango(g, CENARIO.tapete, 0.18);
      g.position.set(x, y);
      camada.addChild(g);
    }
  }

  return camada;
}

/**
 * As duas paredes do fundo, erguidas sobre as arestas externas das fileiras de
 * borda da própria sala.
 *
 * O detalhe que faz a parede ficar contínua (e não um serrote): cada segmento
 * nasce NAS ARESTAS do tile de borda, não num tile fantasma fora da sala.
 * Tiles isométricos vizinhos compartilham vértices — ancorando aí, o vértice
 * direito de um segmento é exatamente o vértice superior do seguinte, e as
 * faces se emendam sem costura.
 *
 * - parede direita: sobe da aresta superior-direita de cada tile (cx, 0)
 * - parede esquerda: sobe da aresta superior-esquerda de cada tile (0, cy)
 */
export function desenharParedes(cols: number, rows: number): Container {
  const camada = new Container();
  const H = ALTURA_PAREDE;

  // parede do fundo-direita — acompanha o eixo cx, na fileira cy = 0
  for (let cx = 0; cx < cols; cx++) {
    const base = gridParaTela(cx, 0);
    const g = new Graphics();
    g.poly([
      0, -TILE_H / 2,
      TILE_W / 2, 0,
      TILE_W / 2, -H,
      0, -TILE_H / 2 - H,
    ]).fill({ color: ajustarBrilho(CENARIO.paredeDireita, BRILHO_PAREDE_DIREITA) });
    // rodapé, para a parede não "flutuar" sobre o piso
    g.poly([
      0, -TILE_H / 2,
      TILE_W / 2, 0,
      TILE_W / 2, -6,
      0, -TILE_H / 2 - 6,
    ]).fill({ color: CENARIO.rodape, alpha: 0.55 });
    g.position.set(base.x, base.y);
    camada.addChild(g);
  }

  // parede do fundo-esquerda — acompanha o eixo cy, na coluna cx = 0
  for (let cy = 0; cy < rows; cy++) {
    const base = gridParaTela(0, cy);
    const g = new Graphics();
    g.poly([
      -TILE_W / 2, 0,
      0, -TILE_H / 2,
      0, -TILE_H / 2 - H,
      -TILE_W / 2, -H,
    ]).fill({ color: ajustarBrilho(CENARIO.paredeEsquerda, BRILHO_PAREDE_ESQUERDA) });
    g.poly([
      -TILE_W / 2, 0,
      0, -TILE_H / 2,
      0, -TILE_H / 2 - 6,
      -TILE_W / 2, -6,
    ]).fill({ color: CENARIO.rodape, alpha: 0.55 });
    g.position.set(base.x, base.y);
    camada.addChild(g);
  }

  return camada;
}

/** Sombra elíptica no chão — cola o objeto no piso em vez de flutuar. */
function sombraNoChao(largura = TILE_W * 0.42, altura = TILE_H * 0.38): Graphics {
  const sombra = new Graphics()
    .ellipse(0, 0, largura, altura)
    .fill({ color: CENARIO.sombra, alpha: 0.22 });
  sombra.label = "sombra";
  return sombra;
}

// ----------------------------------------------------------------- volumes

/**
 * Caixa isométrica. `ox/oy` deslocam o centro (em fração de tile, eixos cx/cy),
 * `sx/sy` são o tamanho da pegada (1 = tile inteiro), `altura` e `base` em px.
 * Pegadas diferentes em cada eixo são o que permite uma tábua fina (quadro,
 * encosto do sofá) em vez de só cubos.
 */
interface Caixa {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  altura: number;
  base: number;
}

/** Ponto de tela de um ponto do grid (em fração de tile) a `up` px do chão. */
function ponto(gx: number, gy: number, base: number, up: number): Ponto {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2) + base - up,
  };
}

function poligono(g: Graphics, pts: Ponto[], cor: number, alpha = 1): void {
  g.poly(pts.flatMap((p) => [p.x, p.y])).fill({ color: cor, alpha });
}

function caixa(g: Graphics, cor: number, c: Caixa): void {
  const x0 = c.ox - c.sx / 2;
  const x1 = c.ox + c.sx / 2;
  const y0 = c.oy - c.sy / 2;
  const y1 = c.oy + c.sy / 2;
  const P = (gx: number, gy: number, up: number) => ponto(gx, gy, c.base, up);

  // face esquerda (y máximo)
  poligono(
    g,
    [P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, c.altura), P(x0, y1, c.altura)],
    ajustarBrilho(cor, BRILHO_ESQUERDA),
  );
  // face direita (x máximo)
  poligono(
    g,
    [P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, c.altura), P(x1, y0, c.altura)],
    ajustarBrilho(cor, BRILHO_DIREITA),
  );
  // topo
  poligono(
    g,
    [
      P(x0, y0, c.altura),
      P(x1, y0, c.altura),
      P(x1, y1, c.altura),
      P(x0, y1, c.altura),
    ],
    ajustarBrilho(cor, BRILHO_TOPO),
  );
}

/**
 * Mapeia (u, v) na face da frente da caixa para um ponto de tela.
 * `u` vai de 0 a 1 ao longo da face; `v` é a altura em px acima da base.
 * Orientação `cx` mostra a face de x máximo (a da direita); `cy` mostra a de
 * y máximo (a da esquerda).
 */
function faceDaFrente(c: Caixa, o: Orientacao): (u: number, v: number) => Ponto {
  const x0 = c.ox - c.sx / 2;
  const x1 = c.ox + c.sx / 2;
  const y0 = c.oy - c.sy / 2;
  const y1 = c.oy + c.sy / 2;
  if (o === "cx") {
    return (u, v) => ponto(x1, y0 + u * (y1 - y0), c.base, v);
  }
  return (u, v) => ponto(x0 + u * (x1 - x0), y1, c.base, v);
}

/** Retângulo desenhado SOBRE a face da frente (tela, LED, lombada, gráfico). */
function naFace(
  g: Graphics,
  face: (u: number, v: number) => Ponto,
  [u0, u1]: [number, number],
  [v0, v1]: [number, number],
  cor: number,
  alpha = 1,
): void {
  poligono(g, [face(u0, v0), face(u1, v0), face(u1, v1), face(u0, v1)], cor, alpha);
}

/**
 * Atalho: monta uma `Caixa` a partir de eixos "frente/lado" em vez de cx/cy.
 * `f` é o deslocamento no eixo para onde o móvel olha (negativo = encostado na
 * parede) e `l` o deslocamento lateral. Assim cada forma é escrita uma vez e
 * serve para as duas orientações.
 */
function emOrientacao(
  o: Orientacao,
  f: number,
  l: number,
  sf: number,
  sl: number,
  altura: number,
  base = 0,
): Caixa {
  return o === "cx"
    ? { ox: f, oy: l, sx: sf, sy: sl, altura, base }
    : { ox: l, oy: f, sx: sl, sy: sf, altura, base };
}

/** Altura total de cada forma — onde pousam os indicadores de nível. */
const ALTURA_DA_FORMA: Record<FormaMovel, number> = {
  mesa: 33,
  "estacao-dupla": 34,
  rack: 44,
  sofa: 26,
  planta: 46,
  quadro: 42,
  estante: 50,
};

export interface OpcoesMovel {
  cor: number;
  forma: FormaMovel;
  orientacao: Orientacao;
  /** 1–3 (GH-WORLD-07): níveis 2 e 3 ganham marcadores dourados. */
  nivel: number;
  selecionado: boolean;
}

function monitor(
  g: Graphics,
  o: Orientacao,
  l: number,
  baseMesa: number,
  largura: number,
): void {
  const caixaTela = emOrientacao(o, -0.18, l, 0.1, largura, 15, -baseMesa);
  caixa(g, ajustarBrilho(CENARIO.sombra, 3.2), caixaTela);
  // brilho da tela, virado para a frente
  naFace(g, faceDaFrente(caixaTela, o), [0.1, 0.9], [3, 13], CENARIO.led, 0.85);
}

/**
 * Um móvel com silhueta própria por forma.
 *
 * Sem sprite sheet, o que diferencia uma mesa de um servidor é a FORMA: altura,
 * pegada no tile e os detalhes empilhados por cima. Um cubo genérico por item
 * deixaria a sala ilegível — é a silhueta que faz o jogador reconhecer o
 * escritório de relance, que é exatamente a leitura de Habbo/The Sims.
 */
export function desenharMovel({
  cor,
  forma,
  orientacao: o,
  nivel,
  selecionado,
}: OpcoesMovel): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao());

  const g = new Graphics();

  switch (forma) {
    case "mesa": {
      caixa(g, cor, emOrientacao(o, 0, 0, 0.8, 0.92, 16));
      monitor(g, o, 0, 16, 0.42);
      // teclado
      caixa(g, ajustarBrilho(cor, 1.35), emOrientacao(o, 0.2, 0, 0.16, 0.36, 2, -16));
      break;
    }
    case "estacao-dupla": {
      caixa(g, cor, emOrientacao(o, 0, 0, 0.82, 0.98, 16));
      monitor(g, o, -0.24, 16, 0.36);
      monitor(g, o, 0.24, 16, 0.36);
      caixa(g, ajustarBrilho(cor, 1.35), emOrientacao(o, 0.22, 0, 0.14, 0.62, 2, -16));
      break;
    }
    case "rack": {
      // rack alto e estreito, com "unidades" acesas na face da frente
      const rack = emOrientacao(o, 0, 0, 0.62, 0.62, 44);
      caixa(g, cor, rack);
      const frente = faceDaFrente(rack, o);
      for (let i = 0; i < 4; i++) {
        naFace(g, frente, [0.14, 0.86], [6 + i * 9, 9 + i * 9], CENARIO.realce, 0.75);
        naFace(g, frente, [0.7, 0.8], [6 + i * 9, 9 + i * 9], CENARIO.led, 0.95);
      }
      break;
    }
    case "sofa": {
      caixa(g, cor, emOrientacao(o, 0.04, 0, 0.74, 0.96, 11));
      // encosto na aresta do fundo e braços nas laterais
      caixa(g, ajustarBrilho(cor, 0.88), emOrientacao(o, -0.3, 0, 0.2, 0.96, 24));
      caixa(g, ajustarBrilho(cor, 0.8), emOrientacao(o, 0.04, -0.43, 0.74, 0.12, 17));
      caixa(g, ajustarBrilho(cor, 0.8), emOrientacao(o, 0.04, 0.43, 0.74, 0.12, 17));
      break;
    }
    case "planta": {
      // vaso pequeno + folhagem em círculos sobrepostos
      caixa(g, ajustarBrilho(cor, 0.55), emOrientacao(o, 0, 0, 0.32, 0.32, 12));
      const folha = ajustarBrilho(cor, 1.05);
      g.circle(0, -24, 11).fill({ color: folha });
      g.circle(-8, -32, 8).fill({ color: ajustarBrilho(cor, 0.85) });
      g.circle(8, -33, 7).fill({ color: ajustarBrilho(cor, 1.15) });
      g.circle(1, -40, 6).fill({ color: folha });
      break;
    }
    case "quadro": {
      // cavalete: duas pernas e uma prancha com um gráfico de barras
      caixa(g, ajustarBrilho(cor, 0.5), emOrientacao(o, -0.05, -0.32, 0.07, 0.07, 10));
      caixa(g, ajustarBrilho(cor, 0.5), emOrientacao(o, -0.05, 0.32, 0.07, 0.07, 10));
      const prancha = emOrientacao(o, -0.05, 0, 0.1, 0.86, 32, -10);
      caixa(g, ajustarBrilho(cor, 0.9), prancha);
      const frente = faceDaFrente(prancha, o);
      naFace(g, frente, [0.07, 0.93], [3, 29], CENARIO.texto, 0.92);
      naFace(g, frente, [0.16, 0.3], [5, 12], CENARIO.led);
      naFace(g, frente, [0.4, 0.54], [5, 18], CENARIO.realce);
      naFace(g, frente, [0.64, 0.78], [5, 25], CENARIO.lombadas[3]);
      break;
    }
    case "estante": {
      // estante alta com três prateleiras de livros
      const estante = emOrientacao(o, -0.12, 0, 0.36, 0.9, 50);
      caixa(g, ajustarBrilho(cor, 0.85), estante);
      const frente = faceDaFrente(estante, o);
      for (let prateleira = 0; prateleira < 3; prateleira++) {
        const v0 = 3 + prateleira * 16;
        naFace(g, frente, [0.05, 0.95], [v0, v0 + 13], CENARIO.sombra, 0.55);
        for (let livro = 0; livro < 6; livro++) {
          const u0 = 0.09 + livro * 0.14;
          const alto = 8 + ((livro + prateleira) % 3) * 2;
          naFace(
            g,
            frente,
            [u0, u0 + 0.1],
            [v0, v0 + alto],
            CENARIO.lombadas[(livro + prateleira) % CENARIO.lombadas.length],
          );
        }
      }
      break;
    }
  }

  grupo.addChild(g);

  // Nível do móvel (1–3): marcadores dourados acima da peça. Nível 1 é o
  // padrão e não ganha marcador, para a sala não ficar poluída.
  if (nivel >= 2) {
    const marcas = new Graphics();
    const topo = -(ALTURA_DA_FORMA[forma] + 9);
    for (let i = 0; i < nivel; i++) {
      const x = (i - (nivel - 1) / 2) * 8;
      marcas
        .poly([x, topo - 4, x + 3.5, topo, x, topo + 4, x - 3.5, topo])
        .fill({ color: CENARIO.realce })
        .stroke({ width: 1, color: CENARIO.sombra, alpha: 0.6 });
    }
    marcas.label = "nivel";
    grupo.addChild(marcas);
  }

  // O realce é sempre criado e apenas alternado por `visible`. Isso permite ao
  // renderer reconciliar o móvel (criar 1×, depois só mutar) em vez de
  // redesenhar tudo quando o jogador entra no modo mover — ver `cena.ts`.
  const realce = new Graphics()
    .poly(LOSANGO)
    .stroke({ width: 3, color: CENARIO.realce, alpha: 0.95 });
  realce.label = "realce";
  realce.visible = selecionado;
  grupo.addChild(realce);

  return grupo;
}

/** Losango de destaque no piso (tile válido de destino / hover). */
export function desenharMarcadorTile(cor: number, alpha = 0.5): Graphics {
  const g = new Graphics();
  g.poly(LOSANGO).fill({ color: cor, alpha: alpha * 0.35 });
  g.poly(LOSANGO).stroke({ width: 2, color: cor, alpha });
  return g;
}

// ----------------------------------------------------------------- avatares

export interface OpcoesAvatar {
  id: string;
  cor: number;
  nome: string;
  /** dono do negócio ganha um selo diferente dos Funcionários de IA */
  dono: boolean;
  /** família tipográfica já resolvida (a do `next/font`) para a etiqueta */
  fonte: string;
}

/**
 * Personagem: sombra + corpo + cabeça + etiqueta com o nome.
 * Proporção "chibi" (cabeça grande) — a mesma leitura de Habbo/The Sims em
 * tamanho pequeno, que mantém o boneco legível a 64px de tile.
 *
 * A anatomia é dividida em partes nomeadas (`bracoE`, `pernaD`, `olhos`...)
 * para `animarAvatar` mexer só no que precisa, sem redesenhar.
 */
export function desenharAvatar({ id, cor, nome, dono, fonte }: OpcoesAvatar): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao(TILE_W * 0.24, TILE_H * 0.24));

  const personagem = new Container();
  personagem.label = "personagem";

  const roupa = ajustarBrilho(cor, 0.9);
  const manga = ajustarBrilho(cor, 0.7);

  // pernas (pivô no quadril, para balançar)
  for (const [rotulo, x] of [["pernaE", -3.2], ["pernaD", 3.2]] as const) {
    const perna = new Graphics()
      .rect(-2.2, 0, 4.4, 8)
      .fill({ color: ajustarBrilho(CENARIO.sombra, 2.4) });
    perna.label = rotulo;
    perna.position.set(x, -8);
    personagem.addChild(perna);
  }

  // braços (pivô no ombro)
  for (const [rotulo, x] of [["bracoE", -8.4], ["bracoD", 8.4]] as const) {
    const braco = new Graphics().rect(-1.6, 0, 3.2, 13).fill({ color: manga });
    braco.label = rotulo;
    braco.position.set(x, -25);
    personagem.addChild(braco);
  }

  // tronco levemente trapezoidal
  personagem.addChild(
    new Graphics().poly([-7, -6, 7, -6, 5, -27, -5, -27]).fill({ color: roupa }),
  );

  // cabeça: centro em y = -34
  const cabeca = new Container();
  cabeca.label = "cabeca";
  cabeca.position.set(0, -34);
  cabeca.addChild(new Graphics().circle(0, 0, 8.5).fill({ color: peleDoId(id) }));
  // cabelo / capacete na cor do cargo
  cabeca.addChild(
    new Graphics()
      .poly([-8.5, -2, 8.5, -2, 7, -8, -7, -8])
      .fill({ color: ajustarBrilho(cor, 0.65) }),
  );
  // olhos: ficam do lado para onde o boneco olha (ver `animarAvatar`)
  const olhos = new Container();
  olhos.label = "olhos";
  olhos.position.set(2.2, 1.2);
  for (const x of [-2.6, 2.6]) {
    olhos.addChild(new Graphics().circle(x, 0, 1.25).fill({ color: CENARIO.sombra }));
  }
  cabeca.addChild(olhos);
  personagem.addChild(cabeca);

  // selo do dono: pequeno ponto laranja acima da cabeça
  if (dono) {
    personagem.addChild(new Graphics().circle(0, -47, 3).fill({ color: CENARIO.realce }));
  }

  grupo.addChild(personagem);

  // Etiqueta: fica fora do `personagem` para não balançar junto com o passo.
  // Tamanho e resolução são ajustados por `cena.ts` conforme a escala da sala.
  const etiqueta = new Text({
    text: nome,
    style: {
      fontFamily: fonte,
      fontSize: 11,
      fontWeight: "800",
      fill: CENARIO.texto,
      stroke: { color: CENARIO.sombra, width: 3 },
    },
  });
  etiqueta.label = "etiqueta";
  etiqueta.anchor.set(0.5, 1);
  etiqueta.position.set(0, -52);
  etiqueta.alpha = dono ? 1 : 0.9;
  grupo.addChild(etiqueta);

  return grupo;
}

export interface QuadroAnimacao {
  andando: boolean;
  /** passos acumulados (1 = um passo completo de uma perna) */
  fase: number;
  /** tempo total da cena em segundos */
  tempo: number;
  /** 1 → 0 logo depois de parar; dá o "assentar" do boneco */
  assentar: number;
  /** -1 olha para a esquerda da tela, +1 para a direita */
  dirX: -1 | 1;
  /** verdadeiro se o boneco anda de costas para o observador */
  deCostas: boolean;
  /** semente estável por boneco, para os bonecos não piscarem juntos */
  semente: number;
  reduzir: boolean;
}

/**
 * Anima o boneco a partir do estado do quadro. É chamada a cada frame, então
 * só ajusta propriedades (posição, rotação, escala) — nunca cria objetos.
 */
export function animarAvatar(vista: Container, q: QuadroAnimacao): void {
  const personagem = vista.getChildByLabel("personagem");
  if (!personagem) return;
  const olhos = vista.getChildByLabel("olhos", true);
  const bracoE = vista.getChildByLabel("bracoE", true);
  const bracoD = vista.getChildByLabel("bracoD", true);
  const pernaE = vista.getChildByLabel("pernaE", true);
  const pernaD = vista.getChildByLabel("pernaD", true);

  if (olhos) {
    olhos.visible = !q.deCostas;
    olhos.x = 2.2;
  }

  // Quem pediu menos movimento recebe o boneco parado e virado para o lado
  // certo — a informação (direção) fica, a animação some.
  if (q.reduzir) {
    personagem.scale.set(q.dirX, 1);
    personagem.position.set(0, 0);
    personagem.rotation = 0;
    for (const parte of [bracoE, bracoD, pernaE, pernaD]) if (parte) parte.rotation = 0;
    if (olhos) olhos.scale.y = 1;
    return;
  }

  if (q.andando) {
    const ciclo = Math.sin(q.fase * Math.PI * 2);
    personagem.position.set(0, -Math.abs(ciclo) * 2.4);
    personagem.rotation = ciclo * 0.05 * q.dirX;
    personagem.scale.set(q.dirX, 1);
    if (bracoE) bracoE.rotation = ciclo * 0.7;
    if (bracoD) bracoD.rotation = -ciclo * 0.7;
    if (pernaE) pernaE.rotation = -ciclo * 0.55;
    if (pernaD) pernaD.rotation = ciclo * 0.55;
  } else {
    // parado: respira devagar; logo depois de parar, "assenta" (amassa e volta)
    const respiro = 1 + 0.018 * Math.sin(q.tempo * 2.2 + q.semente * 6.28);
    const amassa = 1 - 0.08 * q.assentar;
    personagem.position.set(0, 0);
    personagem.rotation = 0;
    personagem.scale.set(q.dirX * (1 + 0.05 * q.assentar), respiro * amassa);
    for (const parte of [bracoE, bracoD, pernaE, pernaD]) if (parte) parte.rotation = 0;
  }

  // pisca a cada ~4,5 s, em fase diferente para cada boneco
  if (olhos) {
    const volta = (q.tempo + q.semente * 4.5) % 4.5;
    olhos.scale.y = volta < 0.12 ? 0.15 : 1;
  }
}
