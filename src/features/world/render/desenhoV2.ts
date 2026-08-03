import { Container, Graphics, Text } from "pixi.js";
import { gridParaTela, TILE_H, TILE_W } from "../engine/iso";
import {
  ALTURA_PAREDE,
  BRILHO_DIREITA,
  BRILHO_ESQUERDA,
  BRILHO_TOPO,
  caixaIso,
  losango,
  sombraNoChao,
  type CategoriaMovel,
  type OpcoesAvatar,
  type OpcoesMovel,
} from "./desenho";
import { ajustarBrilho, CENARIO } from "./cores";
import type { Desenhadores } from "./cena";

/**
 * Camada visual V2 — "Degrau A+" (Fase 1 de
 * `docs/architecture/ARQUITETURA-VISUAL-ITENS-SEDE.md`).
 *
 * Continua 100% procedural (Pixi `Graphics`, zero asset de imagem, zero
 * dependência nova) — o ganho aqui é VARIEDADE DE FORMA por item de catálogo
 * e por cargo, não uma técnica de desenho nova. Reusa as mesmas primitivas e
 * a mesma convenção de luz de `desenho.ts` (nunca duplica um número de brilho)
 * para as duas camadas nunca divergirem visualmente entre si.
 *
 * Usado só pelas rotas `/world/v2` e `/world/visitar/[tenantId]/v2`
 * (`WorldScreenV2`/`VisitaScreenV2`, via `render/cena.ts.Desenhadores`).
 * `desenho.ts` e as rotas originais (`/world`, `/world/visitar/[tenantId]`)
 * continuam absolutamente intocados — nada aqui é importado por eles.
 */

/** As 7 silhuetas do catálogo de mobília (`features/sede/catalogo.ts`). */
export type SilhuetaMovel =
  | "mesa-trabalho"
  | "estacao-dupla"
  | "servidor-local"
  | "sofa-recepcao"
  | "estante-executiva"
  | "planta-tropical"
  | "quadro-metas";

/** As 4 silhuetas dos cargos de IA (`features/equipe-ia/catalogo.ts`). */
export type SilhuetaAvatar = "documentador" | "social-media" | "editor-video" | "comercial";

/**
 * Blend em direção ao cinza médio das 3 componentes — reduz SATURAÇÃO
 * mantendo a luminância aproximada (diferente de `ajustarBrilho`, que só
 * escala as 3 componentes juntas, preservando saturação). `quantidade` 0 =
 * cor original, 1 = cinza puro.
 *
 * Existe para resolver um achado específico da arquitetura: o piso
 * dourado/mostarda de `CENARIO` tem saturação alta demais para a regra
 * "silhueta antes de detalhe" — uma silhueta só lê bem contra um fundo que
 * não compete com ela (ver `ARQUITETURA-VISUAL-ITENS-SEDE.md` §4, Fase 1,
 * item 2). Não introduz hex novo: parte sempre de uma cor já derivada de
 * token em `cores.ts`.
 */
function dessaturar(cor: number, quantidade: number): number {
  const r = (cor >> 16) & 0xff;
  const g = (cor >> 8) & 0xff;
  const b = cor & 0xff;
  const media = (r + g + b) / 3;
  const mix = (canal: number) => Math.round(canal + (media - canal) * quantidade);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

const PISO_CLARO_V2 = dessaturar(CENARIO.pisoClaro, 0.45);
const PISO_ESCURO_V2 = dessaturar(CENARIO.pisoEscuro, 0.45);
const PISO_BORDA_V2 = dessaturar(CENARIO.pisoBorda, 0.3);

/**
 * Piso com textura de tábua corrida (linhas de junção deslocadas por fileira,
 * "brick pattern") em vez do xadrez 2-tons original — e com a saturação
 * calibrada (ver `dessaturar` acima). Mesma geometria de tile de
 * `desenho.ts.desenharPiso`, só a textura muda.
 */
export function desenharPisoV2(cols: number, rows: number): Container {
  const camada = new Container();

  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const { x, y } = gridParaTela(cx, cy);
      // desloca a tábua a cada fileira (cy) — quebra a leitura de "tabuleiro
      // quadriculado" sem introduzir gradiente contínuo (regra de DESIGN.md:
      // terreno nunca em gradiente contínuo).
      const tabua = (cx + Math.floor(cy / 2)) % 2 === 0;
      const g = new Graphics();
      losango(g, tabua ? PISO_CLARO_V2 : PISO_ESCURO_V2);
      g.poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0]).stroke({
        width: 1,
        color: PISO_BORDA_V2,
        alpha: 0.4,
      });
      // linha de veio da madeira — um traço sutil no meio do tile, sempre no
      // mesmo eixo, reforça "tábua" em vez de "azulejo"
      g.moveTo(-TILE_W / 4, -TILE_H / 8)
        .lineTo(TILE_W / 4, TILE_H / 8)
        .stroke({ width: 1, color: PISO_BORDA_V2, alpha: 0.18 });
      g.position.set(x, y);
      camada.addChild(g);
    }
  }

  return camada;
}

/** Tapete — mesma área/cor de `desenho.ts`, com uma borda contornando a
 *  franja (detalhe barato que ajuda a ler "tecido", não "bloco de cor"). */
export function desenharTapeteV2(cols: number, rows: number): Container {
  const camada = new Container();
  const de = { cx: 1, cy: 1 };
  const ate = { cx: Math.max(1, cols - 2), cy: Math.max(1, rows - 2) };

  for (let cx = de.cx; cx <= ate.cx; cx++) {
    for (let cy = de.cy; cy <= ate.cy; cy++) {
      const { x, y } = gridParaTela(cx, cy);
      const naBorda = cx === de.cx || cx === ate.cx || cy === de.cy || cy === ate.cy;
      const g = new Graphics();
      losango(g, CENARIO.tapete, naBorda ? 0.26 : 0.16);
      g.position.set(x, y);
      camada.addChild(g);
    }
  }

  return camada;
}

/** Paredes — mesma geometria/emenda de `desenho.ts`, com um rodapé mais
 *  destacado (faixa dupla) para dar mais leitura de acabamento. */
export function desenharParedesV2(cols: number, rows: number): Container {
  const camada = new Container();
  const H = ALTURA_PAREDE;

  for (let cx = 0; cx < cols; cx++) {
    const base = gridParaTela(cx, 0);
    const g = new Graphics();
    g.poly([0, -TILE_H / 2, TILE_W / 2, 0, TILE_W / 2, -H, 0, -TILE_H / 2 - H]).fill({
      color: ajustarBrilho(CENARIO.paredeDireita, BRILHO_DIREITA),
    });
    g.poly([0, -TILE_H / 2, TILE_W / 2, 0, TILE_W / 2, -9, 0, -TILE_H / 2 - 9]).fill({
      color: CENARIO.rodape,
      alpha: 0.6,
    });
    g.poly([0, -TILE_H / 2, TILE_W / 2, 0, TILE_W / 2, -4, 0, -TILE_H / 2 - 4]).fill({
      color: ajustarBrilho(CENARIO.paredeDireita, BRILHO_TOPO),
      alpha: 0.5,
    });
    g.position.set(base.x, base.y);
    camada.addChild(g);
  }

  for (let cy = 0; cy < rows; cy++) {
    const base = gridParaTela(0, cy);
    const g = new Graphics();
    g.poly([-TILE_W / 2, 0, 0, -TILE_H / 2, 0, -TILE_H / 2 - H, -TILE_W / 2, -H]).fill({
      color: ajustarBrilho(CENARIO.paredeEsquerda, BRILHO_ESQUERDA),
    });
    g.poly([-TILE_W / 2, 0, 0, -TILE_H / 2, 0, -TILE_H / 2 - 9, -TILE_W / 2, -9]).fill({
      color: CENARIO.rodape,
      alpha: 0.6,
    });
    g.poly([-TILE_W / 2, 0, 0, -TILE_H / 2, 0, -TILE_H / 2 - 4, -TILE_W / 2, -4]).fill({
      color: ajustarBrilho(CENARIO.paredeEsquerda, BRILHO_TOPO),
      alpha: 0.5,
    });
    g.position.set(base.x, base.y);
    camada.addChild(g);
  }

  return camada;
}

export interface OpcoesMovelV2 extends OpcoesMovel {
  itemId?: string;
}

/**
 * Um móvel com silhueta ÚNICA por item de catálogo (não por categoria).
 *
 * `itemId` reconhecido → forma dedicada abaixo. `itemId` ausente ou
 * desconhecido (item novo no catálogo que ainda não ganhou silhueta própria)
 * → cai na forma genérica por `categoria`, igual a `desenho.ts` — nunca deixa
 * de desenhar nada. É a mesma doutrina de "silhueta antes de detalhe" e de
 * degradação limpa já usada no resto do World.
 */
export function desenharMovelV2({ cor, categoria, selecionado, itemId }: OpcoesMovelV2): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao());

  const g = new Graphics();

  switch (itemId) {
    case "mesa-trabalho": {
      caixaIso(g, cor, 0.85, 13);
      // teclado: placa fina à frente do tampo
      caixaIso(g, ajustarBrilho(cor, 0.7), 0.32, 2, 9);
      // monitor único, centrado
      const tela = ajustarBrilho(CENARIO.sombra, 3.2);
      caixaIso(g, tela, 0.3, 16, -13);
      g.poly([0, -21, 8, -26, 8, -35, 0, -30]).fill({
        color: CENARIO.paredeDireita,
        alpha: 0.85,
      });
      break;
    }
    case "estacao-dupla": {
      caixaIso(g, cor, 1.05, 15);
      const tela = ajustarBrilho(CENARIO.sombra, 3.2);
      caixaIso(g, tela, 0.26, 15, -15, -11);
      caixaIso(g, tela, 0.26, 15, -15, 11);
      g.poly([-15, -20, -9, -24, -9, -32, -15, -28]).fill({
        color: CENARIO.paredeDireita,
        alpha: 0.85,
      });
      g.poly([9, -20, 15, -24, 15, -32, 9, -28]).fill({
        color: CENARIO.paredeDireita,
        alpha: 0.85,
      });
      break;
    }
    case "servidor-local": {
      caixaIso(g, cor, 0.58, 46);
      for (let i = 0; i < 5; i++) {
        const y = -9 - i * 8;
        g.rect(1, y - 2.5, 15, 2.5).fill({
          color: CENARIO.realce,
          alpha: i % 2 === 0 ? 0.85 : 0.4,
        });
      }
      // grade de ventilação no topo
      caixaIso(g, ajustarBrilho(cor, 0.6), 0.6, 3, -46);
      break;
    }
    case "sofa-recepcao": {
      // assento largo e baixo
      caixaIso(g, cor, 1.1, 11);
      // encosto alto ao fundo
      caixaIso(g, ajustarBrilho(cor, 0.88), 0.98, 20, -11);
      // braços nas duas pontas
      caixaIso(g, ajustarBrilho(cor, 0.82), 0.22, 15, -2, -19);
      caixaIso(g, ajustarBrilho(cor, 0.82), 0.22, 15, -2, 19);
      break;
    }
    case "estante-executiva": {
      caixaIso(g, cor, 0.66, 40);
      // prateleiras + "livros" (só variação de brilho da MESMA cor — sem
      // hex novo, respeita a regra "cor só por token")
      for (let i = 0; i < 3; i++) {
        const y = -6 - i * 12;
        g.rect(-9, y - 9, 18, 1.4).fill({ color: ajustarBrilho(cor, 0.5), alpha: 0.8 });
        for (let l = 0; l < 4; l++) {
          g.rect(-8 + l * 4.2, y - 8, 3, 7).fill({
            color: ajustarBrilho(cor, 0.55 + (l % 3) * 0.18),
          });
        }
      }
      break;
    }
    case "planta-tropical": {
      caixaIso(g, ajustarBrilho(cor, 0.55), 0.32, 12);
      const folha = ajustarBrilho(cor, 1.05);
      g.circle(0, -22, 10).fill({ color: folha });
      g.circle(-9, -30, 8.5).fill({ color: ajustarBrilho(cor, 0.82) });
      g.circle(9, -31, 7.5).fill({ color: ajustarBrilho(cor, 1.18) });
      g.circle(2, -38, 6.5).fill({ color: folha });
      g.circle(-5, -42, 5).fill({ color: ajustarBrilho(cor, 0.95) });
      break;
    }
    case "quadro-metas": {
      // placa vertical numa base fina — "quadro de pé", não pendurado, pra
      // não exigir geometria de parede nova
      caixaIso(g, ajustarBrilho(cor, 0.6), 0.5, 3);
      const painel = ajustarBrilho(cor, 0.5);
      g.rect(-11, -44, 22, 30).fill({ color: painel });
      g.rect(-11, -44, 22, 30).stroke({ width: 1.5, color: ajustarBrilho(cor, 0.35) });
      // barrinhas de "gráfico" dentro do quadro
      const alturas = [6, 11, 8, 14];
      alturas.forEach((h, i) => {
        g.rect(-8 + i * 5, -16 - h, 3.2, h).fill({ color: CENARIO.realce, alpha: 0.9 });
      });
      break;
    }
    default: {
      // fallback defensivo: item novo/desconhecido cai na forma genérica por
      // categoria, igual a `desenho.ts` — nunca renderiza "nada".
      switch (categoria) {
        case "trabalho":
          caixaIso(g, cor, 0.92, 16);
          break;
        case "tecnologia":
          caixaIso(g, cor, 0.62, 44);
          break;
        case "conforto":
          caixaIso(g, cor, 0.95, 12);
          break;
        case "decoracao":
          caixaIso(g, ajustarBrilho(cor, 0.55), 0.32, 12);
          g.circle(0, -24, 11).fill({ color: ajustarBrilho(cor, 1.05) });
          break;
      }
    }
  }

  grupo.addChild(g);

  const realce = new Graphics()
    .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
    .stroke({ width: 3, color: CENARIO.realce, alpha: 0.95 });
  realce.label = "realce";
  realce.visible = selecionado;
  grupo.addChild(realce);

  return grupo;
}

export interface OpcoesAvatarV2 extends OpcoesAvatar {
  cargoId?: string;
}

/**
 * Avatar com um ADORNO distinto por cargo, sobre o corpo base já existente
 * (mesma silhueta "chibi" de `desenho.ts.desenharAvatar`, mesma proporção).
 *
 * Antes desta camada, dois cargos com o mesmo `eixoFortalecido` (ex.:
 * Social Media e Editor de Vídeo, ambos "presenca") geravam avatares
 * pixel-a-pixel idênticos — achado da arquitetura (§1). O adorno resolve
 * isso sem depender de cor: por `AGENTS.md`/`DESIGN-SYSTEM.md`, nunca
 * comunicar só por cor.
 */
export function desenharAvatarV2({ cor, nome, dono, cargoId }: OpcoesAvatarV2): Container {
  const grupo = new Container();
  grupo.addChild(sombraNoChao(TILE_W * 0.24, TILE_H * 0.24));

  const corpo = new Graphics();

  corpo.poly([-7, -4, 7, -4, 5, -26, -5, -26]).fill({ color: ajustarBrilho(cor, 0.9) });
  corpo.rect(-10, -24, 3, 13).fill({ color: ajustarBrilho(cor, 0.7) });
  corpo.rect(7, -24, 3, 13).fill({ color: ajustarBrilho(cor, 0.7) });
  corpo.circle(0, -34, 8.5).fill({ color: CENARIO.pele });
  corpo.poly([-8.5, -36, 8.5, -36, 7, -42, -7, -42]).fill({ color: ajustarBrilho(cor, 0.65) });

  if (dono) {
    corpo.circle(0, -47, 3).fill({ color: CENARIO.realce });
  }

  switch (cargoId) {
    case "documentador": {
      // livro fechado, flutuando ao lado da cabeça
      corpo.rect(10, -42, 8, 6).fill({ color: ajustarBrilho(cor, 0.5) });
      corpo.moveTo(14, -42).lineTo(14, -36).stroke({ width: 0.8, color: CENARIO.pele, alpha: 0.7 });
      break;
    }
    case "social-media": {
      // celular com "lente" de câmera
      corpo.roundRect(9, -46, 6, 10, 1.5).fill({ color: ajustarBrilho(cor, 0.45) });
      corpo.circle(12, -41, 1.6).fill({ color: CENARIO.realce });
      break;
    }
    case "editor-video": {
      // claquete de cinema
      corpo.rect(9, -44, 10, 7).fill({ color: ajustarBrilho(cor, 0.4) });
      corpo.rect(9, -47, 10, 3).fill({ color: ajustarBrilho(cor, 0.75) });
      for (let i = 0; i < 3; i++) {
        corpo.rect(9 + i * 3.4, -47, 1.7, 3).fill({ color: ajustarBrilho(cor, 0.4) });
      }
      break;
    }
    case "comercial": {
      // headset: arco fino + microfone
      corpo
        .moveTo(6, -43)
        .arcTo(13, -43, 13, -36, 6)
        .stroke({ width: 1.6, color: ajustarBrilho(cor, 0.45) });
      corpo.circle(12, -37, 2).fill({ color: ajustarBrilho(cor, 0.45) });
      corpo.moveTo(12, -37).lineTo(9, -33).stroke({ width: 1.2, color: ajustarBrilho(cor, 0.45) });
      break;
    }
    default:
      break;
  }

  grupo.addChild(corpo);

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

  return grupo;
}

/** Mapeia `ItemMobilia.id` (catálogo) → `SilhuetaMovel` reconhecida acima.
 *  Único ponto que precisa mudar quando um item novo entrar na loja. */
export const SILHUETA_POR_ITEM_ID: Record<string, SilhuetaMovel> = {
  "mesa-trabalho": "mesa-trabalho",
  "estacao-dupla": "estacao-dupla",
  "servidor-local": "servidor-local",
  "sofa-recepcao": "sofa-recepcao",
  "estante-executiva": "estante-executiva",
  "planta-tropical": "planta-tropical",
  "quadro-metas": "quadro-metas",
};

/** Mapeia `CargoIA.id` (catálogo) → `SilhuetaAvatar` reconhecida acima. */
export const SILHUETA_POR_CARGO_ID: Record<string, SilhuetaAvatar> = {
  documentador: "documentador",
  "social-media": "social-media",
  "editor-video": "editor-video",
  comercial: "comercial",
};

export type { CategoriaMovel };

/**
 * Objeto pronto para injetar em `WorldCanvas`/`CenaWorld` (ver
 * `render/cena.ts.Desenhadores`). É tudo que `WorldScreenV2`/`VisitaScreenV2`
 * precisam importar desta camada — mantém as duas telas desacopladas dos
 * nomes de função individuais.
 */
export const DESENHADORES_V2: Desenhadores = {
  piso: desenharPisoV2,
  tapete: desenharTapeteV2,
  paredes: desenharParedesV2,
  movel: desenharMovelV2,
  avatar: desenharAvatarV2,
};
