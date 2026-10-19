import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Base do modo `GAMEHUB_DB=file`: onde os dados ficam, como se lê e grava
 * JSON sem perder dado, e a trava que serializa as escritas.
 *
 * Antes desta camada, três defeitos somados podiam apagar todas as contas:
 * leitura devolvia o valor padrão em QUALQUER erro (inclusive JSON
 * corrompido), a escrita não era atômica, e não havia trava entre
 * requisições simultâneas. Uma escrita interrompida deixava o arquivo
 * ilegível, a leitura seguinte devolvia `[]` e a escrita seguinte gravava
 * essa lista vazia por cima de tudo.
 */

/** Pasta de dados. Em produção fica fora da release (volume do container). */
export function pastaDados(): string {
  const configurada = process.env.GAMEHUB_DATA_DIR;
  return configurada ? path.resolve(configurada) : path.join(process.cwd(), "data");
}

function codigoErro(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : undefined;
}

/**
 * Lê um JSON. Só devolve `padrao` quando o arquivo NÃO EXISTE. Arquivo
 * corrompido lança erro: é melhor a requisição falhar do que o app gravar
 * uma coleção vazia por cima dos dados de verdade.
 */
export async function lerJson<T>(arquivo: string, padrao: T): Promise<T> {
  let texto: string;
  try {
    texto = await fs.readFile(arquivo, "utf8");
  } catch (e) {
    if (codigoErro(e) === "ENOENT") return padrao;
    throw e;
  }
  try {
    return JSON.parse(texto) as T;
  } catch {
    console.error(`[dados] arquivo corrompido, nada foi sobrescrito: ${arquivo}`);
    throw new Error(
      `Arquivo de dados corrompido: ${path.basename(arquivo)}. Restaure a cópia ${path.basename(arquivo)}.bak ou o backup.`,
    );
  }
}

async function renomear(origem: string, destino: string): Promise<void> {
  // No Windows (dev), antivírus ou um leitor aberto podem segurar o arquivo
  // por instantes; algumas tentativas resolvem. No Linux o rename é atômico.
  for (let tentativa = 0; ; tentativa++) {
    try {
      await fs.rename(origem, destino);
      return;
    } catch (e) {
      const codigo = codigoErro(e);
      if (tentativa >= 5 || (codigo !== "EPERM" && codigo !== "EBUSY" && codigo !== "EACCES")) throw e;
      await new Promise((r) => setTimeout(r, 20 * (tentativa + 1)));
    }
  }
}

/**
 * Grava de forma atômica: escreve num arquivo temporário, força o disco
 * (`fsync`) e só então troca pelo definitivo com `rename`. Quem lê vê a
 * versão antiga inteira ou a nova inteira, nunca metade. A versão anterior
 * fica em `<arquivo>.bak`. Permissão 0600: só o dono do processo lê.
 */
export async function escreverJson(arquivo: string, dados: unknown): Promise<void> {
  await fs.mkdir(path.dirname(arquivo), { recursive: true, mode: 0o700 });
  const temporario = `${arquivo}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  const handle = await fs.open(temporario, "w", 0o600);
  try {
    await handle.writeFile(JSON.stringify(dados, null, 2), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.copyFile(arquivo, `${arquivo}.bak`);
  } catch (e) {
    if (codigoErro(e) !== "ENOENT") {
      await fs.rm(temporario, { force: true });
      throw e;
    }
  }
  await renomear(temporario, arquivo);
}

/**
 * Trava assíncrona e reentrante. Toda operação que lê-modifica-grava roda
 * dentro de `exclusivo`, uma de cada vez. É reentrante (via
 * AsyncLocalStorage) porque operações chamam outras: a interna roda direto,
 * sem esperar a si mesma.
 *
 * Vale para UM processo Node. O modo arquivo exige uma única instância do
 * app; com mais de uma, use o modo Supabase.
 */
export class Trava {
  private fila: Promise<void> = Promise.resolve();
  private readonly dentro = new AsyncLocalStorage<true>();

  async exclusivo<T>(fn: () => Promise<T>): Promise<T> {
    if (this.dentro.getStore()) return fn();
    let liberar!: () => void;
    const anterior = this.fila;
    this.fila = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    await anterior;
    try {
      return await this.dentro.run(true, fn);
    } finally {
      liberar();
    }
  }
}

/** Trava única dos dados em arquivo: domínio (`file-adapter`) e credenciais (`local-provider`). */
export const travaDados = new Trava();

/** Ids de tenant do modo arquivo: 12 bytes aleatórios em hex. */
const ID_TENANT = /^[0-9a-f]{24}$/;

/**
 * Pasta de um tenant. O id vem de URL e de parâmetros de server action, e
 * entra num caminho de arquivo: sem validação, `../` sairia da pasta de dados.
 */
export function pastaTenant(tenantId: string): string {
  if (!ID_TENANT.test(tenantId)) {
    throw new Error("Identificador de negócio inválido.");
  }
  return path.join(pastaDados(), "tenants", tenantId);
}

export function tenantIdValido(tenantId: string): boolean {
  return ID_TENANT.test(tenantId);
}
