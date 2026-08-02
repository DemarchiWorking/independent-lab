import { color } from "@tokens";

/**
 * Ponte entre os design tokens e o Pixi.
 *
 * O Pixi só entende cor numérica (`0xRRGGBB`), mas a regra do projeto é "cor
 * só por token" — nada de hex avulso no código. Então TUDO aqui deriva de
 * `design-system/tokens.ts`; este módulo é só o conversor de formato, não uma
 * segunda paleta.
 */

/** "#RRGGBB" → 0xRRGGBB */
export function hexNumero(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

/**
 * Clareia/escurece uma cor mantendo o matiz — usado para as três faces do
 * bloco isométrico (topo claro, direita média, esquerda escura) a partir de
 * uma cor única do token. Um único ponto de luz, consistente na cena inteira.
 */
export function ajustarBrilho(cor: number, fator: number): number {
  const r = Math.min(255, Math.round(((cor >> 16) & 0xff) * fator));
  const g = Math.min(255, Math.round(((cor >> 8) & 0xff) * fator));
  const b = Math.min(255, Math.round((cor & 0xff) * fator));
  return (r << 16) | (g << 8) | b;
}

/**
 * Resolve a classe Tailwind do catálogo de mobília (`ItemMobilia.cor`) para o
 * número que o Pixi precisa. O catálogo continua declarando cor por classe de
 * token (é o que a loja em DOM usa) — aqui só traduzimos para o canvas, sem
 * duplicar a definição da cor.
 */
const POR_CLASSE: Record<string, string> = {
  "bg-cat-social": color.category.social,
  "bg-cat-media": color.category.media,
  "bg-cat-growth": color.category.growth,
  "bg-cat-ads": color.category.ads,
  "bg-cat-locked": color.category.locked,
  "bg-teal": color.brand.teal,
  "bg-orange": color.brand.orange,
  "bg-green": color.brand.green,
  "bg-coral": color.brand.coral,
};

export function corDoItem(classeTailwind: string): number {
  return hexNumero(POR_CLASSE[classeTailwind] ?? color.category.media);
}

/** Paleta do cenário (piso, parede, tapete) derivada dos tokens da marca. */
export const CENARIO = {
  pisoClaro: hexNumero("#C9A227"),
  pisoEscuro: hexNumero("#B08D1F"),
  pisoBorda: hexNumero("#8A6E18"),
  paredeDireita: hexNumero(color.brand.teal),
  paredeEsquerda: hexNumero(color.brand.teal),
  rodape: hexNumero(color.bg.line),
  tapete: hexNumero(color.brand.coral),
  sombra: hexNumero(color.bg.night),
  realce: hexNumero(color.brand.orange),
  avatarDono: hexNumero(color.brand.orange),
  pele: hexNumero("#E8B08A"),
  texto: hexNumero("#FFFFFF"),
} as const;

/** Cor do avatar de cada Funcionário de IA, pelo eixo que ele fortalece. */
export function corDoAtributo(chave: keyof typeof color.attribute): number {
  return hexNumero(color.attribute[chave]);
}

/**
 * Cor de presença ao vivo (Mapa Vivo, GH-MAPA-05 — `docs/mapa-vivo/`) —
 * SEMPRE `brand.teal`, nunca uma cor de atributo. Antes deste fix,
 * `SedeAnelPresenca` usava `corDoAtributo("processo")` (azul, sem relação
 * semântica com "gente aqui agora") só porque era uma cor de avatar
 * disponível — corrigido pra usar o mesmo token que o Mapa usa pra
 * presença, fechando a continuidade visual Mapa↔Sede que é o requisito
 * central desta iniciativa.
 */
export function corDePresenca(): number {
  return hexNumero(color.brand.teal);
}

/**
 * Cor de tier (degrau na escada de valor, 1–5) — mesma paleta usada no
 * `MapaPin` do Mapa (`design-system/tokens.ts.color.tier`). Usada no
 * `SedeNameplate` pra a Sede herdar a mesma cor que o pin do negócio já
 * tinha no Mapa. `degrau` fora de 1–5 cai no tier 1 (defensivo, nunca
 * deveria acontecer — `degrau_atual` é sempre 1–5 por constraint do
 * banco).
 */
export function corDoTier(degrau: number): number {
  const chave = (degrau >= 1 && degrau <= 5 ? degrau : 1) as keyof typeof color.tier;
  return hexNumero(color.tier[chave]);
}
