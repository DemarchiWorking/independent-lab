import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de convite de vizinho (GH-GROW-02) — assinado (HMAC), não guardado
 * no banco: o próprio token carrega tudo que precisa. Mesma técnica de
 * `lib/auth/sessao.ts` (que não exporta seus helpers, por isso duplicada
 * aqui em vez de importada — são dois segredos de propósitos diferentes,
 * mesmo reusando `GAMEHUB_SECRET`).
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

function segredo(): string {
  const s = process.env.GAMEHUB_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("GAMEHUB_SECRET obrigatório em produção (mín. 16 chars).");
  }
  return "dev-only-secret-labdatadev-gamehub";
}

function assinar(payload: string): string {
  return createHmac("sha256", segredo()).update(payload).digest("hex");
}

export function gerarTokenConvite(dados: PayloadConvite): string {
  const payload = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${payload}.${assinar(payload)}`;
}

/** `null` se a assinatura não bater OU o convite tiver expirado. */
export function lerTokenConvite(token: string): PayloadConvite | null {
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assinar(payload), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  if (esperada.length !== recebida.length) return null;
  if (!timingSafeEqual(esperada, recebida)) return null;

  try {
    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as PayloadConvite;
    const expiraEm = new Date(dados.criadoEm).getTime() + VALIDADE_MS;
    if (Date.now() > expiraEm) return null;
    return dados;
  } catch {
    return null;
  }
}
