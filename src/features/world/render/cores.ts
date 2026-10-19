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
 *
 * Opera na luminosidade (HSL) em vez de multiplicar cada canal. Multiplicar
 * canais com teto em 255 achata as cores claras (um amarelo ×1.3 vira branco
 * puro e perde o matiz); em HSL o matiz e a saturação ficam, e o escurecido
 * ganha um pouco de saturação, que é como uma sombra se comporta na pintura.
 */
export function ajustarBrilho(cor: number, fator: number): number {
  const r = ((cor >> 16) & 0xff) / 255;
  const g = ((cor >> 8) & 0xff) / 255;
  const b = (cor & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }

  const l2 = Math.min(0.96, Math.max(0, l * fator));
  const s2 = Math.min(1, fator < 1 ? s * (1 + (1 - fator) * 0.25) : s);

  const c = (1 - Math.abs(2 * l2 - 1)) * s2;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l2 - c / 2;
  const sextante = Math.floor(h * 6) % 6;
  const [r1, g1, b1] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sextante];

  const canal = (v: number) => Math.round((v + m) * 255);
  return (canal(r1) << 16) | (canal(g1) << 8) | canal(b1);
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

/** Paleta do cenário (piso, parede, tapete) — tudo derivado dos tokens. */
export const CENARIO = {
  pisoClaro: hexNumero(color.world.pisoClaro),
  pisoEscuro: hexNumero(color.world.pisoEscuro),
  pisoBorda: hexNumero(color.world.pisoBorda),
  paredeDireita: hexNumero(color.world.paredeDireita),
  paredeEsquerda: hexNumero(color.world.paredeEsquerda),
  rodape: hexNumero(color.bg.line),
  tapete: hexNumero(color.brand.coral),
  sombra: hexNumero(color.bg.night),
  realce: hexNumero(color.brand.orange),
  hover: hexNumero(color.brand.teal),
  invalido: hexNumero(color.brand.coral),
  led: hexNumero(color.brand.teal),
  avatarDono: hexNumero(color.brand.orange),
  texto: hexNumero(color.bg.panel),
  /** Lombadas da estante: sempre as cores da marca, nunca uma paleta nova. */
  lombadas: [
    hexNumero(color.brand.orange),
    hexNumero(color.brand.teal),
    hexNumero(color.brand.coral),
    hexNumero(color.brand.green),
  ],
} as const;

/** Tons de pele disponíveis para os bonecos (tokens). */
const PELES = color.world.pele.map(hexNumero);

/**
 * Hash estável de um texto → inteiro não negativo. Serve para que o mesmo
 * boneco tenha sempre o mesmo tom de pele e a mesma "fase" de animação, sem
 * sorteio (o render não pode mudar de aparência a cada re-render).
 */
export function hashTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function peleDoId(id: string): number {
  return PELES[hashTexto(id) % PELES.length];
}

/** Cor do avatar de cada Funcionário de IA, pelo eixo que ele fortalece. */
export function corDoAtributo(chave: keyof typeof color.attribute): number {
  return hexNumero(color.attribute[chave]);
}
