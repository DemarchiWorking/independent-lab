import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Sessao } from "@/lib/db/types";
import { abrir, selar, textoValido } from "./assinatura";

const COOKIE = "gamehub_sessao";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

/**
 * Monta o token da sessão. A expiração vai DENTRO do payload assinado: o
 * `maxAge` do cookie só vale no navegador, e um cookie copiado continuaria
 * válido para sempre sem isso.
 */
export function selarSessao(sessao: Sessao, agora = Date.now()): string {
  return selar("sessao", {
    typ: "sessao",
    usuarioId: sessao.usuarioId,
    tenantId: sessao.tenantId,
    nome: sessao.nome,
    email: sessao.email,
    iat: agora,
    exp: agora + MAX_AGE * 1000,
  });
}

/** Valida assinatura, propósito, campos e expiração. `null` em qualquer falha. */
export function abrirSessao(token: string, agora = Date.now()): Sessao | null {
  const dados = abrir("sessao", token);
  if (!dados || dados.typ !== "sessao") return null;
  if (typeof dados.exp !== "number" || dados.exp <= agora) return null;
  if (!textoValido(dados.usuarioId, 64) || !textoValido(dados.tenantId, 64)) return null;
  if (!textoValido(dados.email) || typeof dados.nome !== "string") return null;
  return {
    usuarioId: dados.usuarioId,
    tenantId: dados.tenantId,
    nome: dados.nome,
    email: dados.email,
  };
}

/** Cookie httpOnly com o token assinado. */
export async function criarSessao(sessao: Sessao): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, selarSessao(sessao), {
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
  return abrirSessao(token);
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export function novoId(): string {
  return randomBytes(12).toString("hex");
}
