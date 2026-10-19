import path from "node:path";
import { escreverJson, lerJson, pastaDados, travaDados } from "@/lib/db/arquivo";
import { hashSenha, precisaRehash, verificarSemConta, verificarSenha } from "./password";
import { novoId } from "./sessao";
import type { AuthProvider, Identidade } from "./provider";

/**
 * Autenticação local (protótipo): scrypt + salt em `data/auth/credenciais.json`.
 * O arquivo é propriedade DESTE provider — o repositório de domínio não o toca.
 *
 * Usa a mesma escrita atômica e a mesma trava do repositório em arquivo
 * (`lib/db/arquivo.ts`): dois cadastros simultâneos não se apagam mais, e um
 * arquivo corrompido falha alto em vez de virar uma lista vazia.
 */

const arquivo = () => path.join(pastaDados(), "auth", "credenciais.json");

interface Credencial {
  email: string;
  usuarioId: string;
  hash: string;
}

const ler = () => lerJson<Credencial[]>(arquivo(), []);

export class LocalAuthProvider implements AuthProvider {
  async emailExiste(email: string): Promise<boolean> {
    const lista = await ler();
    return lista.some((c) => c.email === email.toLowerCase());
  }

  async registrar(_nome: string, email: string, senha: string): Promise<Identidade> {
    const normalizado = email.toLowerCase();
    // O hash é caro: calcula fora da trava para não segurar as outras escritas.
    const hash = await hashSenha(senha);
    return travaDados.exclusivo(async () => {
      const lista = await ler();
      if (lista.some((c) => c.email === normalizado)) {
        throw new Error("E-mail já cadastrado");
      }
      const usuarioId = novoId();
      lista.push({ email: normalizado, usuarioId, hash });
      await escreverJson(arquivo(), lista);
      return { usuarioId };
    });
  }

  async autenticar(email: string, senha: string): Promise<Identidade | null> {
    const normalizado = email.toLowerCase();
    const cred = (await ler()).find((c) => c.email === normalizado);
    if (!cred) {
      await verificarSemConta(senha);
      return null;
    }
    if (!(await verificarSenha(senha, cred.hash))) return null;

    if (precisaRehash(cred.hash)) {
      // Senha certa e hash antigo: troca pelo formato atual, aproveitando o login.
      const novoHash = await hashSenha(senha);
      await travaDados.exclusivo(async () => {
        const lista = await ler();
        const alvo = lista.find((c) => c.usuarioId === cred.usuarioId);
        if (alvo && alvo.hash === cred.hash) {
          alvo.hash = novoHash;
          await escreverJson(arquivo(), lista);
        }
      });
    }
    return { usuarioId: cred.usuarioId };
  }

  async remover(usuarioId: string): Promise<void> {
    await travaDados.exclusivo(async () => {
      const lista = await ler();
      const restante = lista.filter((c) => c.usuarioId !== usuarioId);
      if (restante.length !== lista.length) await escreverJson(arquivo(), restante);
    });
  }
}
