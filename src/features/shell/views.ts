import type { View } from "./GameShell";

/**
 * Deep-link para uma aba do `GameShell` (`/hub?ver=marketplace`).
 *
 * O shell navega por `useState`, não por rota — foi uma escolha deliberada
 * (transição animada sem remontar o HUD). O efeito colateral é que, de fora
 * dele, não havia como pedir "abre já na aba X". Sem isto, os atalhos da
 * conversa com os NPCs (GH-WORLD-07) largariam o jogador no Hub genérico e ele
 * teria que caçar a aba na mão — promessa vazia.
 *
 * É uma WHITELIST, não um cast: `?ver=` vem da URL, ou seja, do usuário. Só
 * passam as abas que fazem sentido como ponto de entrada; qualquer outra coisa
 * (inclusive um `ModuleKey` de roadmap, que é tela-stub) cai no Hub.
 */
const VIEWS_POR_PARAMETRO: Record<string, View> = {
  hub: "hub",
  sede: "sede",
  mapa: "mapa",
  "equipe-ia": "equipe-ia",
  marketplace: "marketplace",
  parcerias: "parcerias",
  eventos: "eventos",
};

/** View pedida na URL, ou `"hub"` se o parâmetro não for reconhecido. */
export function viewDeParam(valor: string | string[] | undefined): View {
  // `?ver=a&ver=b` chega como array — não é uso legítimo, cai no padrão
  if (typeof valor !== "string") return "hub";

  // `Object.hasOwn`, não `?? "hub"`: indexar um objeto literal com
  // `"__proto__"` ou `"constructor"` devolve membro HERDADO de
  // `Object.prototype` — um valor truthy que passaria pelo `??` e viraria
  // `initialView` inválido. A chave aqui vem da query string, então é entrada
  // do usuário. Travado por teste.
  if (!Object.hasOwn(VIEWS_POR_PARAMETRO, valor)) return "hub";
  return VIEWS_POR_PARAMETRO[valor];
}

/** Os valores aceitos em `?ver=` — usado pelos testes e por quem monta links. */
export function parametrosDeViewValidos(): string[] {
  return Object.keys(VIEWS_POR_PARAMETRO);
}
