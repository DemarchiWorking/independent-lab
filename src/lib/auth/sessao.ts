import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Sessao } from "@/lib/db/types";

const COOKIE = "gamehub_sessao";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

/** Segredo de assinatura. Em produção vem do ambiente. */
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

/** Cookie httpOnly assinado: <base64(json)>.<hmac> */
export async function criarSessao(sessao: Sessao): Promise<void> {
  const payload = Buffer.from(JSON.stringify(sessao)).toString("base64url");
  const token = `${payload}.${assinar(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assinar(payload), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  if (esperada.length !== recebida.length) return null;
  if (!timingSafeEqual(esperada, recebida)) return null;

  let sessao: Sessao;
  try {
    sessao = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Sessao;
  } catch {
    return null;
  }

  // `tenantId` vira `negocios.id` (bigint) em toda leitura do repositório
  // Supabase. Um cookie assinado mas com `tenantId` não-numérico — sobra de
  // uma sessão criada em modo `GAMEHUB_DB=file` (onde o id é hex, ver
  // `novoId()`) e ainda válida pela mesma `GAMEHUB_SECRET` — não é
  // falsificação, mas também não é utilizável: sem esta checagem, cada
  // página autenticada quebra com "invalid input syntax for type bigint:
  // NaN" em vez de simplesmente mandar logar de novo.
  if (!/^\d+$/.test(sessao.tenantId)) return null;

  return sessao;
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export function novoId(): string {
  return randomBytes(12).toString("hex");
}
