/**
 * Design tokens — labdatadev-gamehub
 * Ponte: Startup Panic (gamificação anos 2000) × marca Laboratório Demarchi.
 * Fonte de verdade de cor/tipografia/espaçamento. Nunca use hex avulso no código.
 * Doc: docs/design/DESIGN-SYSTEM.md
 */

export const color = {
  brand: {
    orange: "#F59E0B", // CTA primário (= laranja do Startup Panic)
    orangeDark: "#B4720A", // sombra dura do CTA (efeito retrô)
    teal: "#00D4C8", // marca / moeda virtual / ativo
    green: "#22C55E", // dinheiro real / sucesso / progresso
    coral: "#EF5350", // ribbon de modal / alerta
    coralDark: "#B23732", // sombra dura da ribbon
  },
  bg: {
    night: "#080E1D", // fundo escuro
    card: "#0F1A2E", // cartão no dark
    card2: "#132241", // cartão elevado no dark
    light: "#F8FAFC", // fundo claro (árvore/grid iso)
    panel: "#FFFFFF", // painel de modal
    line: "#22345C", // hairline no dark
    lineLight: "#E2E8F0", // hairline em documento claro
  },
  text: {
    ink: "#0A1628", // texto principal
    muted: "#94A3B8", // texto secundário (sobre fundo escuro)
    mutedOnLight: "#475569", // texto secundário sobre fundo claro (contraste AA)
    onOrange: "#0A1628", // texto sobre laranja (contraste AA)
  },
  alert: {
    bannerBg: "#8B2E2E", // faixa de aviso/prazo
    bannerText: "#FFFFFF",
  },
  /** Categorias da árvore de hexágonos (parceiros/serviços). Cor + ícone + nota. */
  category: {
    social: "#8BC34A",
    media: "#5B9BD5",
    growth: "#F4C430",
    ads: "#B15FC4",
    locked: "#E86A6A",
  },
  /**
   * Cenário do World (sala isométrica): madeira do piso, as duas paredes do
   * fundo e os tons de pele dos bonecos. O renderer só converte para número
   * (`render/cores.ts`) — esta é a única definição dessas cores.
   */
  world: {
    pisoClaro: "#B98B5A",
    pisoEscuro: "#A87A4A",
    pisoBorda: "#7A5530",
    paredeDireita: "#2FA7A2",
    paredeEsquerda: "#23838A",
    pele: ["#F1C7A1", "#E8B08A", "#C98B5E", "#9A6A44", "#6B4428"],
  },
  /**
   * Os 5 eixos da economia de atributos do negócio (ver
   * docs/analise-prints/telas/economia-de-atributos.md) — o sistema que
   * amarra marketplace, árvore, mobília e Funcionários de IA. Cores
   * deliberadamente distintas de `brand.orange` (CTA) e `brand.green`
   * (dinheiro real) para nunca serem confundidas em tela.
   */
  attribute: {
    tecnologia: "#8B5CF6", // roxo
    processo: "#3B82F6", // azul
    presenca: "#EA580C", // laranja profundo
    aquisicao: "#16A34A", // verde
    capacidade: "#DC2626", // vermelho
  },
} as const;

export const font = {
  ui: '"Nunito", "Fredoka", ui-sans-serif, system-ui, sans-serif',
  body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  pixel: '"Press Start 2P", "VT323", monospace',
} as const;

/** Escala tipográfica mobile-first (px). */
export const fontSize = [12, 14, 16, 20, 24, 32, 40] as const;

/** Grid base 4px. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const;

export const radius = {
  sm: 6,
  md: 12,
  pill: 999,
} as const;

export const shadow = {
  card: "0 4px 16px rgba(8, 14, 29, 0.12)",
  modal: "0 12px 40px rgba(8, 14, 29, 0.28)",
} as const;

/** Moeda: separação rígida virtual × real (ver DESIGN-SYSTEM §6). */
export const currency = {
  virtual: { key: "coin", label: "🪙", color: color.brand.teal },
  real: { key: "brl", label: "R$", color: color.brand.green },
} as const;

export type CategoryKey = keyof typeof color.category;
export type AtributoChave = keyof typeof color.attribute;
