import { Container, Graphics, Text } from "pixi.js";
import { gridParaTela, TILE_H, TILE_W } from "../engine/iso";
import { ajustarBrilho, CENARIO } from "./cores";

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

/** Altura visual de uma parede, em px. */
export const ALTURA_PAREDE = 58;

/** Losango do tile centrado em (0,0) — a unidade visual de todo o palco. */
function losango(g: Graphics, cor: number, alpha = 1): Graphics {
  return g
    .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
    .fill({ color: cor, alpha });
}

/** Piso xadrez: dois tons alternados, com borda sutil para marcar a grade. */
export function desenharPiso(cols: number, rows: number): Container {
  const camada = new Container();

  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const { x, y } = gridParaTela(cx, cy);
      const claro = (cx + cy) % 2 === 0;
      const g = new Graphics();
      losango(g, claro ? CENARIO.pisoClaro : CENARIO.pisoEscuro);
      g.poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0]).stroke({
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
    ]).fill({ color: ajustarBrilho(CENARIO.paredeDireita, BRILHO_DIREITA) });
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
    ]).fill({ color: ajustarBrilho(CENARIO.paredeEsquerda, BRILHO_ESQUERDA) });
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
  return new Graphics()
    .ellipse(0, 0, largura, altura)
    .fill({ color: CENARIO.sombra, alpha: 0.22 });
}

/**
 * Caixa isométrica genérica — a primitiva de volume de toda a cena.
 * `escala` encolhe a pegada no tile (1 = tile inteiro); `baseY` empilha uma
 * caixa em cima de outra.
 */
function caixaIso(
  g: Graphics,
  cor: number,
  escala: number,
  altura: number,
  baseY = 0,
): void {
  const w = (TILE_W / 2) * escala;
  const h = (TILE_H / 2) * escala;

  // face esquerda
  g.poly([-w, baseY, 0, baseY + h, 0, baseY + h - altura, -w, baseY - altura]).fill({
    color: ajustarBrilho(cor, BRILHO_ESQUERDA),
  });
  // face direita
  g.poly([0, baseY + h, w, baseY, w, baseY - altura, 0, baseY + h - altura]).fill({
    color: ajustarBrilho(cor, BRILHO_DIREITA),
  });
  // topo
  g.poly([
    0, baseY - h - altura,
    w, baseY - altura,
    0, baseY + h - altura,
    -w, baseY - altura,
  ]).fill({ color: ajustarBrilho(cor, BRILHO_TOPO) });
}

export type CategoriaMovel = "trabalho" | "tecnologia" | "conforto" | "decoracao";

export interface OpcoesMovel {
  cor: number;
  categoria: CategoriaMovel;
  selecionado: boolean;
}

/**
 * Um móvel com silhueta própria por categoria.
 *
 * Sem sprite sheet, o que diferencia uma mesa de um servidor é a FORMA: altura,
 * pegada no tile e os detalhes empilhados por cima. Um cubo genérico por item
 * deixaria a sala ilegível — é a silhueta que faz o jogador reconhecer o
 * escritório de relance, que é exatamente a leitura de Habbo/The Sims.
 */
export function desenharMovel({ cor, categoria, selecionado }: OpcoesMovel): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao());

  const g = new Graphics();

  switch (categoria) {
    case "trabalho": {
      // mesa baixa e larga + monitor em cima
      caixaIso(g, cor, 0.92, 16);
      const tela = ajustarBrilho(CENARIO.sombra, 3.2);
      caixaIso(g, tela, 0.34, 15, -16);
      // brilho da tela, virado para o observador
      g.poly([0, -20, 9, -25, 9, -34, 0, -29]).fill({
        color: CENARIO.paredeDireita,
        alpha: 0.85,
      });
      break;
    }
    case "tecnologia": {
      // rack alto e estreito, com "unidades" acesas na face direita
      caixaIso(g, cor, 0.62, 44);
      for (let i = 0; i < 4; i++) {
        const y = -8 - i * 9;
        g.rect(2, y - 3, 16, 3).fill({ color: CENARIO.realce, alpha: 0.75 });
      }
      break;
    }
    case "conforto": {
      // assento baixo + encosto na aresta do fundo
      caixaIso(g, cor, 0.95, 12);
      caixaIso(g, ajustarBrilho(cor, 0.85), 0.42, 16, -12);
      break;
    }
    case "decoracao": {
      // vaso pequeno + folhagem em círculos sobrepostos
      caixaIso(g, ajustarBrilho(cor, 0.55), 0.32, 12);
      const folha = ajustarBrilho(cor, 1.05);
      g.circle(0, -24, 11).fill({ color: folha });
      g.circle(-8, -32, 8).fill({ color: ajustarBrilho(cor, 0.85) });
      g.circle(8, -33, 7).fill({ color: ajustarBrilho(cor, 1.15) });
      g.circle(1, -40, 6).fill({ color: folha });
      break;
    }
  }

  grupo.addChild(g);

  // O realce é sempre criado e apenas alternado por `visible`. Isso permite ao
  // renderer reconciliar o móvel (criar 1×, depois só mutar) em vez de
  // redesenhar tudo quando o jogador entra no modo mover — ver `cena.ts`.
  const realce = new Graphics()
    .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
    .stroke({ width: 3, color: CENARIO.realce, alpha: 0.95 });
  realce.label = "realce";
  realce.visible = selecionado;
  grupo.addChild(realce);

  return grupo;
}

/** Losango de destaque no piso (tile válido de destino / hover). */
export function desenharMarcadorTile(cor: number, alpha = 0.5): Graphics {
  const g = new Graphics();
  g.poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0]).fill({
    color: cor,
    alpha: alpha * 0.35,
  });
  g.poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0]).stroke({
    width: 2,
    color: cor,
    alpha,
  });
  return g;
}

/**
 * Altura (local) onde o balão de conversa flutua sobre o avatar.
 *
 * Fica acima da etiqueta de nome (que ocupa até ~y = -58) e ainda dentro do
 * headroom do canvas (`ALTURA_PAREDE + TILE_H` = 90px acima da fileira do
 * fundo) — se descer, colide com o nome; se subir, corta no topo da sala.
 */
const BALAO_Y = -78;

/**
 * Balão de HQ com "…" — o convite a conversar com um NPC (GH-WORLD-07).
 *
 * Desenhado com a origem no CENTRO do balão de propósito: a cena pulsa o balão
 * via `scale`, e escalar em torno do centro dá "respiração"; em torno de um
 * canto daria a impressão de o balão escorregar para o lado.
 */
export function desenharBalao(): Container {
  const grupo = new Container();
  const g = new Graphics();

  // corpo + rabicho apontando para a cabeça
  g.roundRect(-16, -10, 32, 20, 7).fill({ color: CENARIO.balao });
  g.poly([-4, 9, 4, 9, 0, 17]).fill({ color: CENARIO.balao });
  g.roundRect(-16, -10, 32, 20, 7).stroke({
    width: 1.5,
    color: CENARIO.balaoBorda,
    alpha: 0.45,
  });

  // as reticências
  for (const x of [-6, 0, 6]) {
    g.circle(x, 0, 2.1).fill({ color: CENARIO.balaoPonto, alpha: 0.75 });
  }

  grupo.addChild(g);
  grupo.position.set(0, BALAO_Y);
  return grupo;
}

export interface OpcoesAvatar {
  cor: number;
  nome: string;
  /** dono do negócio ganha um selo diferente dos Funcionários de IA */
  dono: boolean;
}

/**
 * Personagem: sombra + corpo trapezoidal + cabeça + etiqueta com o nome.
 * Proporção "chibi" (cabeça grande) — a mesma leitura de Habbo/The Sims em
 * tamanho pequeno, que mantém o boneco legível a 64px de tile.
 */
export function desenharAvatar({ cor, nome, dono }: OpcoesAvatar): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao(TILE_W * 0.24, TILE_H * 0.24));

  const corpo = new Graphics();

  // corpo (tronco levemente trapezoidal)
  corpo
    .poly([-7, -4, 7, -4, 5, -26, -5, -26])
    .fill({ color: ajustarBrilho(cor, 0.9) });

  // braços insinuados nas laterais
  corpo.rect(-10, -24, 3, 13).fill({ color: ajustarBrilho(cor, 0.7) });
  corpo.rect(7, -24, 3, 13).fill({ color: ajustarBrilho(cor, 0.7) });

  // cabeça
  corpo.circle(0, -34, 8.5).fill({ color: CENARIO.pele });

  // cabelo / capacete de cor do cargo
  corpo
    .poly([-8.5, -36, 8.5, -36, 7, -42, -7, -42])
    .fill({ color: ajustarBrilho(cor, 0.65) });

  // selo do dono: pequena coroa/ponto laranja acima da cabeça
  if (dono) {
    corpo.circle(0, -47, 3).fill({ color: CENARIO.realce });
  }

  grupo.addChild(corpo);

  // etiqueta discreta: a sala é o protagonista, o nome é apoio
  const etiqueta = new Text({
    text: nome,
    style: {
      fontFamily: "Trebuchet MS, Verdana, sans-serif",
      fontSize: 8,
      fontWeight: "bold",
      fill: CENARIO.texto,
      stroke: { color: CENARIO.sombra, width: 2.5 },
    },
  });
  etiqueta.anchor.set(0.5, 1);
  etiqueta.position.set(0, -50);
  etiqueta.alpha = dono ? 0.95 : 0.7;
  etiqueta.scale.set(0.9);
  grupo.addChild(etiqueta);

  // O balão de conversa NÃO nasce aqui: quem o cria e o guarda é a cena
  // (`cena.ts`), que é quem sabe se aquele avatar é interagível. Esta função
  // desenha um personagem, e só. Ver `desenharBalao` acima.
  return grupo;
}
