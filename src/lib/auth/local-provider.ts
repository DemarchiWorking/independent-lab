import { promises as fs } from "node:fs";
import path from "node:path";
import { emailAdminBootstrapLocal } from "@/lib/admin";
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
  /** Bootstrap local de role — ver `lib/admin.ts` (`emailAdminBootstrapLocal`). */
  role?: "admin";
  recuperacao?: { codigo: string; expiraEm: string };
}

const RECUPERACAO_VALIDADE_MS = 15 * 60 * 1000; // 15 min

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
    const role = emailAdminBootstrapLocal(normalizado) ? "admin" : undefined;
    lista.push({
      email: normalizado,
      usuarioId,
      hash: await hashSenha(senha),
      ...(role ? { role } : {}),
    });
    await escrever(lista);
    return { usuarioId, ...(role ? { role } : {}) };
  }

  async autenticar(email: string, senha: string): Promise<Identidade | null> {
    const lista = await ler();
    const cred = lista.find((c) => c.email === email.toLowerCase());
    if (!cred) return null;
    if (!(await verificarSenha(senha, cred.hash))) return null;
    return { usuarioId: cred.usuarioId, ...(cred.role ? { role: cred.role } : {}) };
  }

  async removerConta(usuarioId: string): Promise<void> {
    const lista = await ler();
    await escrever(lista.filter((c) => c.usuarioId !== usuarioId));
  }

  /**
   * Modo arquivo não tem infraestrutura de e-mail (é smoke-test local, ver
   * `AGENTS.md`) — o código vai pro log do servidor em vez de uma caixa de
   * entrada real, pra quem estiver testando localmente conseguir seguir o
   * fluxo inteiro sem depender de Resend/SMTP.
   */
  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    const lista = await ler();
    const normalizado = email.toLowerCase();
    const idx = lista.findIndex((c) => c.email === normalizado);
    if (idx === -1) return; // silencioso — nunca revela se o e-mail existe

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    lista[idx] = {
      ...lista[idx],
      recuperacao: {
        codigo,
        expiraEm: new Date(Date.now() + RECUPERACAO_VALIDADE_MS).toISOString(),
      },
    };
    await escrever(lista);
    console.log(`[recuperação-senha DEV] código para ${email}: ${codigo}`);
  }

  async confirmarRecuperacaoSenha(
    email: string,
    codigo: string,
    novaSenha: string,
  ): Promise<boolean> {
    const lista = await ler();
    const normalizado = email.toLowerCase();
    const idx = lista.findIndex((c) => c.email === normalizado);
    if (idx === -1) return false;

    const rec = lista[idx].recuperacao;
    if (!rec || rec.codigo !== codigo || new Date(rec.expiraEm) < new Date()) {
      return false;
    }

    lista[idx] = { ...lista[idx], hash: await hashSenha(novaSenha), recuperacao: undefined };
    await escrever(lista);
    return true;
  }
}
