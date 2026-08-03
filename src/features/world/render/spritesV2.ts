import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import { TILE_H, TILE_W } from "../engine/iso";
import { sombraNoChao } from "./desenho";
import { CENARIO } from "./cores";
import {
  desenharMovelV2,
  SILHUETA_POR_ITEM_ID,
  type OpcoesMovelV2,
  type SilhuetaMovel,
} from "./desenhoV2";
import type { Desenhadores } from "./cena";

/**
 * Degrau B — sprites de verdade (§4 Fase 2 de
 * `docs/architecture/ARQUITETURA-VISUAL-ITENS-SEDE.md`).
 *
 * Origem e licença dos PNGs: `public/sprites/sede/CREDITS.txt` (Kenney
 * Furniture Kit, CC0 — recortados/recompostos, não usados como baixados).
 *
 * Contrato inegociável (o mesmo que o documento de arquitetura já exigia):
 * item sem sprite mapeado, ou cujo `Assets.load()` falhar, cai no desenho
 * procedural de `desenhoV2.ts` — nunca uma silhueta ausente/vazia. É por
 * isso que este módulo nunca é importado direto por `WorldScreenV2`/
 * `VisitaScreenV2` — só por `WorldCanvas.tsx`, dentro do mesmo efeito
 * assíncrono que já carrega o resto do Pixi (ver comentário lá).
 */

/**
 * `"quadro-metas"` fica de fora de propósito: o pack de origem não tem um
 * quadro/whiteboard equivalente. Continua 100% procedural — a demonstração
 * viva de que o fallback funciona item a item, não é só teoria.
 */
export const SPRITE_POR_SILHUETA: Partial<Record<SilhuetaMovel, string>> = {
  "mesa-trabalho": "/sprites/sede/mesa-trabalho.png",
  "estacao-dupla": "/sprites/sede/estacao-dupla.png",
  "servidor-local": "/sprites/sede/servidor-local.png",
  "sofa-recepcao": "/sprites/sede/sofa-recepcao.png",
  "estante-executiva": "/sprites/sede/estante-executiva.png",
  "planta-tropical": "/sprites/sede/planta-tropical.png",
};

/**
 * Carrega as texturas uma vez. Falha de UM item nunca derruba os outros —
 * cada `Assets.load` é isolado no próprio `catch`, e o item que falhar
 * simplesmente não entra no mapa devolvido (fica undefined → procedural).
 */
export async function carregarTexturasMovel(): Promise<
  Partial<Record<SilhuetaMovel, Texture>>
> {
  const entradas = await Promise.all(
    (Object.entries(SPRITE_POR_SILHUETA) as Array<[SilhuetaMovel, string]>).map(
      async ([silhueta, url]) => {
        try {
          const textura = (await Assets.load(url)) as Texture;
          return [silhueta, textura] as const;
        } catch (erro) {
          console.warn(`[world] sprite "${silhueta}" (${url}) falhou ao carregar, caindo no procedural:`, erro);
          return [silhueta, undefined] as const;
        }
      },
    ),
  );
  return Object.fromEntries(entradas.filter(([, textura]) => textura !== undefined));
}

/**
 * Constrói o desenhador de móvel do Degrau B: Sprite quando a textura da
 * silhueta carregou, `desenharMovelV2` (procedural) quando não — resolvido
 * por item, não por carregamento global. `sombra` e `realce` (contorno de
 * seleção) são os MESMOS de `desenho.ts`/`desenhoV2.ts`, para o objeto com
 * sprite e o objeto procedural nunca destoarem nesses dois detalhes.
 *
 * Âncora do sprite: `(0.5, 1)` — base centralizada, o ponto mais baixo do
 * PNG (já recortado à silhueta) encosta no chão, mesmo critério que
 * `sombraNoChao()` já assume para todo o resto da cena.
 */
export function criarDesenhadorMovelComSprites(
  texturas: Partial<Record<SilhuetaMovel, Texture>>,
): Desenhadores["movel"] {
  return (opcoes: OpcoesMovelV2) => {
    const silhueta = opcoes.itemId ? SILHUETA_POR_ITEM_ID[opcoes.itemId] : undefined;
    const textura = silhueta ? texturas[silhueta] : undefined;
    if (!textura) return desenharMovelV2(opcoes);

    const grupo = new Container();
    grupo.addChild(sombraNoChao());

    const sprite = new Sprite(textura);
    sprite.anchor.set(0.5, 1);
    grupo.addChild(sprite);

    const realce = new Graphics()
      .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
      .stroke({ width: 3, color: CENARIO.realce, alpha: 0.95 });
    realce.label = "realce";
    realce.visible = opcoes.selecionado;
    grupo.addChild(realce);

    return grupo;
  };
}
