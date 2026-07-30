import { createHmac, timingSafeEqual } from "node:crypto";
import type { Sessao } from "@/lib/db/types";

/**
 * Assinatura/verificação do token de sessão — PURO, sem `next/headers`.
 *
 * `sessao.ts` é a casca fina (lê `process.env`, fala com o `cookies()` jar);
 * este módulo é o miolo criptográfico, testável sem mockar Next.js. Mesmo
 * padrão do resto do projeto: relógio SEMPRE explícito (`agoraMs`), nunca
 * `Date.now()` escondido dentro da função — é o que permite testar "daqui a 8
 * dias" em 1ms (mesmo princípio de `equipe-ia/senioridade.ts` e
 * `lib/disponibilidade.ts`).
 *
 * `exp` DENTRO do payload assinado (GH-OPS M-6) é o que impede reproduzir um
 * cookie capturado depois que ele deveria ter expirado: o `maxAge` do cookie
 * é só uma instrução para o BROWSER apagar o cookie, nada impede reenviar o
 * mesmo valor manualmente. Colocar `exp` na parte assinada faz `verificarToken`
 * recusar o token vencido mesmo fora do fluxo normal do navegador. Ainda não é
 * revogação — logout continua sendo só apagar o cookie do lado do cliente —
 * mas fecha o gap mais barato: validade limitada de verdade.
 */

interface Envelope {
  sessao: Sessao;
  /** epoch ms */
  exp: number;
}

function assinar(payload: string, segredo: string): string {
  return createHmac("sha256", segredo).update(payload).digest("hex");
}

/** Gera `<payload base64url>.<hmac hex>` com `exp = agoraMs + ttlMs`. */
export function assinarToken(
  sessao: Sessao,
  segredo: string,
  agoraMs: number,
  ttlMs: number,
): string {
  const envelope: Envelope = { sessao, exp: agoraMs + ttlMs };
  const payload = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  return `${payload}.${assinar(payload, segredo)}`;
}

/**
 * Verifica assinatura e validade. `null` em qualquer falha — token ausente,
 * malformado, assinatura errada ou vencido — nunca lança, porque toda chamada
 * é "existe sessão válida ou não" e o chamador não precisa distinguir o motivo.
 */
export function verificarToken(
  token: string,
  segredo: string,
  agoraMs: number,
): Sessao | null {
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assinar(payload, segredo), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  if (esperada.length !== recebida.length) return null;
  if (!timingSafeEqual(esperada, recebida)) return null;

  try {
    const envelope = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Envelope;
    if (typeof envelope.exp !== "number" || agoraMs >= envelope.exp) return null;
    return envelope.sessao;
  } catch {
    return null;
  }
}
