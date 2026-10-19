import { abrir, selar, textoValido } from "@/lib/auth/assinatura";

/**
 * Token de convite de vizinho (GH-GROW-02) — assinado (HMAC), não guardado
 * no banco: o próprio token carrega tudo que precisa. Usa a chave de
 * propósito "convite" de `lib/auth/assinatura.ts`, diferente da chave da
 * sessão: um link de convite nunca serve de cookie de login.
 *
 * Só o RESGATE (quando o convidado completa o cadastro) é persistido —
 * ver `ConviteResgatado`/`resgatarConvite` — para nunca recompensar duas
 * vezes e para aplicar o teto anti-abuso por período.
 */

const VALIDADE_MS = 30 * 24 * 60 * 60_000; // 30 dias

/** Recompensa mútua ao resgatar (GH-GROW-02) — mesma ordem de grandeza de
 *  `parceria_formada` (150/120): formar rede regional tem valor parecido,
 *  seja via Mapa ou via convite direto. */
export const XP_CONVITE = 150;
export const MOEDA_CONVITE = 120;

/** Teto anti-abuso: convites recompensados por convidante numa janela de
 *  tempo (não um limite vitalício — permite crescimento orgânico contínuo,
 *  só evita rajada). Acima disso, o CONVIDANTE deixa de ganhar (o convidado
 *  sempre ganha — nunca penaliza quem está entrando por causa do limite de
 *  outra pessoa). */
export const LIMITE_CONVITES_POR_JANELA = 5;
export const JANELA_CONVITES_MS = 30 * 24 * 60 * 60_000; // 30 dias

export interface PayloadConvite {
  tenantId: string;
  cidadeNome: string;
  bairroNome: string;
  /** ISO — usado só para calcular expiração, nunca confiar em "agora" do client */
  criadoEm: string;
}

export function gerarTokenConvite(dados: PayloadConvite): string {
  return selar("convite", { typ: "convite", ...dados });
}

/** `null` se a assinatura não bater, o propósito for outro ou o convite tiver expirado. */
export function lerTokenConvite(token: string): PayloadConvite | null {
  const dados = abrir("convite", token);
  if (!dados || dados.typ !== "convite") return null;
  const { tenantId, cidadeNome, bairroNome, criadoEm } = dados;
  if (!textoValido(tenantId, 64) || !textoValido(cidadeNome, 120) || !textoValido(bairroNome, 120)) {
    return null;
  }
  if (!textoValido(criadoEm, 40)) return null;
  const criado = new Date(criadoEm).getTime();
  if (Number.isNaN(criado) || Date.now() > criado + VALIDADE_MS) return null;
  return { tenantId, cidadeNome, bairroNome, criadoEm };
}
