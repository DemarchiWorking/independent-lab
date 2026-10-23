import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import { TILE_H, TILE_W } from "../engine/iso";
import { sombraNoChao } from "./desenho";
import { CENARIO } from "./cores";
import {
  desenharMovelV2,
  LARGURA_ALVO_PX,
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
 * Âncora horizontal (fração 0–1 da largura do PNG) do pé de apoio real de
 * cada móvel — NÃO é sempre 0.5. Achado ao validar visualmente esta fase:
 * `sofa-recepcao.png` e os dois compostos de mesa (`mesa-trabalho.png`,
 * `estacao-dupla.png`) têm o pé/base bem fora do centro geométrico da
 * imagem (ex.: 0.30 e 0.74), porque o Kenney Furniture Kit já entrega cada
 * PNG recortado rente ao próprio desenho — o recorte apaga qualquer
 * referência de "origem da tile" que existisse numa folha maior, e um
 * objeto assimétrico (sofá com um braço, mesa composta com monitor
 * deslocado) não fica com o pé no centro do retângulo resultante. Usar
 * `anchor.x = 0.5` (padrão do Pixi) nesses casos ancora o CENTRO DA IMAGEM
 * no centro do tile em vez do PÉ REAL — o objeto aparece deslocado do
 * próprio tapete de sombra (`sombraNoChao`, sempre centrado em `(0,0)`).
 *
 * Valores medidos programaticamente (não chutados): para cada PNG, pega os
 * últimos ~5% de linhas com pixel opaco (a banda de contato com o chão) e
 * calcula o centro de massa horizontal dela, como fração da largura total.
 * Itens ausentes daqui (ex. `servidor-local`, já ~0.5 por ser simétrico)
 * usam o fallback padrão em `criarDesenhadorMovelComSprites`.
 */
const ANCORA_X_POR_SILHUETA: Partial<Record<SilhuetaMovel, number>> = {
  "mesa-trabalho": 0.656,
  "estacao-dupla": 0.297,
  "sofa-recepcao": 0.743,
  "estante-executiva": 0.622,
  "planta-tropical": 0.453,
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
 *
 * Escala do sprite: cada PNG do pack de origem vem num tamanho de pixel
 * bruto próprio (ex.: sofá 86px, servidor 17px de largura — nada relacionado
 * à grade de 64×32 deste jogo). Sem normalizar, o sprite renderiza no
 * tamanho nativo do arquivo — o bug real encontrado ao validar visualmente
 * esta fase: móveis ocupando 2-3 células ou flutuando menores que a sombra.
 * A correção aplica um fator ÚNICO (mesmo em x e y, nunca esticar só um
 * eixo — distorceria o ângulo isométrico já desenhado na arte) que leva a
 * largura do PNG para `LARGURA_ALVO_PX[silhueta]`, a mesma largura que o
 * procedural (`desenharMovelV2`) já usa — ver o comentário de
 * `LARGURA_ALVO_PX` em `desenhoV2.ts` para por que é a mesma e não um
 * número novo.
 */
export function criarDesenhadorMovelComSprites(
  texturas: Partial<Record<SilhuetaMovel, Texture>>,
): Desenhadores["movel"] {
  return (opcoes: OpcoesMovelV2) => {
    const silhueta = opcoes.itemId ? SILHUETA_POR_ITEM_ID[opcoes.itemId] : undefined;
    const textura = silhueta ? texturas[silhueta] : undefined;
    if (!textura || !silhueta) return desenharMovelV2(opcoes);

    const grupo = new Container();
    grupo.addChild(sombraNoChao());

    const sprite = new Sprite(textura);
    sprite.anchor.set(ANCORA_X_POR_SILHUETA[silhueta] ?? 0.5, 1);
    const escala = LARGURA_ALVO_PX[silhueta] / textura.width;
    sprite.scale.set(escala);
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
