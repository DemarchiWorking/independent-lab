import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Sessao } from "@/lib/db/types";
import { assinarToken, verificarToken } from "./token";

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

/**
 * Cookie httpOnly assinado: <base64(json)>.<hmac>. A criptografia (e o `exp`
 * dentro do payload assinado — GH-OPS M-6) mora em `token.ts`, testável sem
 * `next/headers`; aqui é só a ponte com o cookie jar do Next.
 */
export async function criarSessao(sessao: Sessao): Promise<void> {
  const token = assinarToken(sessao, segredo(), Date.now(), MAX_AGE * 1000);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Requisito funcional, não enfeite: em produção sem HTTPS este cookie
    // nunca é enviado de volta pelo browser e ninguém consegue logar — é
    // por isso que o domínio + certbot (deploy/vps-setup.sh) não são
    // opcionais no runbook de VPS (GH-OPS).
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return verificarToken(token, segredo(), Date.now());
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export function novoId(): string {
  return randomBytes(12).toString("hex");
}
