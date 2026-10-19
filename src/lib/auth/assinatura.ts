import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tokens assinados (HMAC-SHA256) usados pelo app: cookie de sessão e link de
 * convite. Formato: `<base64url(json)>.<base64url(mac)>`.
 *
 * Cada propósito tem a SUA chave, derivada de `GAMEHUB_SECRET` com um rótulo
 * fixo. Antes, sessão e convite eram assinados com a mesma chave e o mesmo
 * formato, e um link de convite (que circula por WhatsApp) era aceito como
 * cookie de sessão do negócio que convidou. Com chaves separadas, um token de
 * um propósito nunca valida no outro, mesmo que o payload seja parecido.
 */

export type Proposito = "sessao" | "convite";

/** Tamanho mínimo do segredo. `openssl rand -hex 32` gera 64 caracteres. */
export const SEGREDO_MIN = 32;

/** Teto de tamanho do token: evita gastar HMAC e JSON.parse com lixo enorme. */
const TOKEN_MAX = 4096;

/**
 * Lê o segredo do ambiente. Não existe segredo padrão em nenhum modo: um
 * fallback escrito no repositório deixa qualquer pessoa forjar sessões numa
 * máquina de demonstração. O `iniciar.bat`/`iniciar.sh` gera um para o dev.
 */
export function segredo(): string {
  const s = process.env.GAMEHUB_SECRET ?? "";
  if (s.length < SEGREDO_MIN) {
    throw new Error(
      `GAMEHUB_SECRET ausente ou curto (mín. ${SEGREDO_MIN} caracteres). Gere com: openssl rand -hex 32`,
    );
  }
  return s;
}

function chave(proposito: Proposito): Buffer {
  return createHmac("sha256", segredo()).update(`independent-lab:${proposito}`).digest();
}

function mac(proposito: Proposito, payload: string): Buffer {
  return createHmac("sha256", chave(proposito)).update(payload).digest();
}

export function selar(proposito: Proposito, dados: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${payload}.${mac(proposito, payload).toString("base64url")}`;
}

/**
 * Devolve o objeto assinado, ou `null` se o token for de outro propósito,
 * adulterado ou malformado. Quem chama ainda valida os campos e a expiração.
 */
export function abrir(proposito: Proposito, token: string): Record<string, unknown> | null {
  if (!token || token.length > TOKEN_MAX) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [payload, assinatura] = partes;
  if (!payload || !assinatura) return null;

  const esperada = mac(proposito, payload);
  const recebida = Buffer.from(assinatura, "base64url");
  if (esperada.length !== recebida.length) return null;
  if (!timingSafeEqual(esperada, recebida)) return null;

  try {
    const dados: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return null;
    return dados as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** String não vazia e de tamanho razoável. */
export function textoValido(v: unknown, max = 320): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}
