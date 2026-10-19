import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hash de senha com scrypt + salt aleatório. Nunca guardamos a senha em texto.
 *
 * Parâmetros atuais: N=2^15, r=8, p=3 — uma das combinações equivalentes que
 * a OWASP recomenda para scrypt, escolhida por usar 32 MiB por hash (a de
 * N=2^17 usa 128 MiB e, com 4 logins simultâneos, estouraria o limite de
 * memória do container).
 *
 * Formatos armazenados:
 * - atual:  `scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>`
 * - legado: `<saltHex>:<hashHex>` (N=2^14, r=8, p=1, padrão do Node). Ainda é
 *   aceito no login e trocado pelo atual na hora (ver `precisaRehash`).
 */

const KEYLEN = 64;
const ATUAL = { N: 2 ** 15, r: 8, p: 3 } as const;
const LEGADO = { N: 2 ** 14, r: 8, p: 1 } as const;
const MAXMEM = 96 * 1024 * 1024;

/** Senhas maiores que isso são recusadas: scrypt de texto gigante é DoS barato. */
export const SENHA_MAX = 128;

interface Parametros {
  N: number;
  r: number;
  p: number;
}

function derivar(senha: string, salt: Buffer, params: Parametros): Promise<Buffer> {
  const opcoes: ScryptOptions = { N: params.N, r: params.r, p: params.p, maxmem: MAXMEM };
  return new Promise((resolver, rejeitar) => {
    scrypt(senha, salt, KEYLEN, opcoes, (erro, chave) => (erro ? rejeitar(erro) : resolver(chave)));
  });
}

export async function hashSenha(senha: string): Promise<string> {
  if (senha.length > SENHA_MAX) throw new Error("Senha longa demais.");
  const salt = randomBytes(16);
  const derivada = await derivar(senha, salt, ATUAL);
  return `scrypt$${ATUAL.N}$${ATUAL.r}$${ATUAL.p}$${salt.toString("hex")}$${derivada.toString("hex")}`;
}

function ler(armazenado: string): { params: Parametros; salt: Buffer; hash: Buffer } | null {
  if (armazenado.startsWith("scrypt$")) {
    const [, n, r, p, saltHex, hashHex] = armazenado.split("$");
    const params = { N: Number(n), r: Number(r), p: Number(p) };
    if (![params.N, params.r, params.p].every(Number.isInteger) || !saltHex || !hashHex) return null;
    if (params.N > 2 ** 17 || params.r > 16 || params.p > 16) return null;
    return { params, salt: Buffer.from(saltHex, "hex"), hash: Buffer.from(hashHex, "hex") };
  }
  const [saltHex, hashHex] = armazenado.split(":");
  if (!saltHex || !hashHex) return null;
  return { params: LEGADO, salt: Buffer.from(saltHex, "hex"), hash: Buffer.from(hashHex, "hex") };
}

/** Comparação em tempo constante (evita timing attack). */
export async function verificarSenha(senha: string, armazenado: string): Promise<boolean> {
  if (senha.length > SENHA_MAX) return false;
  const dados = ler(armazenado);
  if (!dados) return false;
  const derivada = await derivar(senha, dados.salt, dados.params);
  if (dados.hash.length !== derivada.length) return false;
  return timingSafeEqual(dados.hash, derivada);
}

/** `true` se o hash foi gerado com parâmetros diferentes dos atuais. */
export function precisaRehash(armazenado: string): boolean {
  const dados = ler(armazenado);
  if (!dados) return true;
  const { N, r, p } = dados.params;
  return N !== ATUAL.N || r !== ATUAL.r || p !== ATUAL.p;
}

/**
 * Gasta o mesmo tempo de uma verificação real quando o e-mail não existe:
 * sem isso, a resposta rápida para e-mail desconhecido revela quais
 * e-mails têm conta.
 */
let hashSemConta: Promise<string> | null = null;
export async function verificarSemConta(senha: string): Promise<false> {
  hashSemConta ??= hashSenha(randomBytes(16).toString("hex"));
  await verificarSenha(senha.slice(0, SENHA_MAX), await hashSemConta);
  return false;
}
