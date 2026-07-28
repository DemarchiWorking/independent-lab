import { promises as fs } from "node:fs";
import path from "node:path";
import { hashSenha, verificarSenha } from "./password";
import { novoId } from "./sessao";
import type { AuthProvider, Identidade } from "./provider";

/**
 * Autenticação local (protótipo): scrypt + salt em `data/auth/credenciais.json`.
 * O arquivo é propriedade DESTE provider — o repositório de domínio não o toca.
 */

const ARQUIVO = path.join(process.cwd(), "data", "auth", "credenciais.json");

interface Credencial {
  email: string;
  usuarioId: string;
  hash: string;
}

async function ler(): Promise<Credencial[]> {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO, "utf8")) as Credencial[];
  } catch {
    return [];
  }
}

async function escrever(lista: Credencial[]): Promise<void> {
  await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
  await fs.writeFile(ARQUIVO, JSON.stringify(lista, null, 2), "utf8");
}

export class LocalAuthProvider implements AuthProvider {
  async emailExiste(email: string): Promise<boolean> {
    const lista = await ler();
    return lista.some((c) => c.email === email.toLowerCase());
  }

  async registrar(
    _nome: string,
    email: string,
    senha: string,
  ): Promise<Identidade> {
    const lista = await ler();
    const normalizado = email.toLowerCase();
    if (lista.some((c) => c.email === normalizado)) {
      throw new Error("E-mail já cadastrado");
    }
    const usuarioId = novoId();
    lista.push({
      email: normalizado,
      usuarioId,
      hash: await hashSenha(senha),
    });
    await escrever(lista);
    return { usuarioId };
  }

  async autenticar(email: string, senha: string): Promise<Identidade | null> {
    const lista = await ler();
    const cred = lista.find((c) => c.email === email.toLowerCase());
    if (!cred) return null;
    if (!(await verificarSenha(senha, cred.hash))) return null;
    return { usuarioId: cred.usuarioId };
  }
}
