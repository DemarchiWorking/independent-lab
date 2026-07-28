import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/**
 * Hash de senha com scrypt + salt aleatório. Nunca guardamos a senha em texto.
 * Formato armazenado: "<saltHex>:<hashHex>".
 *
 * ⚠️ Adequado ao protótipo. Em produção, migrar para Supabase Auth
 * (ver docs/ARQUITETURA-MULTITENANT.md §5).
 */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derivada = (await scryptAsync(senha, salt, KEYLEN)) as Buffer;
  return `${salt.toString("hex")}:${derivada.toString("hex")}`;
}

/** Comparação em tempo constante (evita timing attack). */
export async function verificarSenha(
  senha: string,
  armazenado: string,
): Promise<boolean> {
  const [saltHex, hashHex] = armazenado.split(":");
  if (!saltHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, "hex");
  const derivada = (await scryptAsync(
    senha,
    Buffer.from(saltHex, "hex"),
    KEYLEN,
  )) as Buffer;

  if (esperado.length !== derivada.length) return false;
  return timingSafeEqual(esperado, derivada);
}
