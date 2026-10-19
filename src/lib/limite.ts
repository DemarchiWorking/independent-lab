/**
 * Limite de tentativas em memória, por chave (IP, e-mail, IP+negócio...).
 *
 * O app roda num único processo (exigência do modo arquivo), então um Map
 * local cobre o caso real; com várias instâncias, isto viraria Redis.
 * Diferente da versão anterior, o Map não cresce para sempre: chaves sem
 * tentativas na janela são removidas, e há um teto de chaves.
 */
export class Limitador {
  private readonly tentativas = new Map<string, number[]>();
  private ultimaLimpeza = 0;

  constructor(
    private readonly janelaMs: number,
    private readonly maximo: number,
    private readonly maxChaves = 20_000,
  ) {}

  private recentes(chave: string, agora: number): number[] {
    const lista = (this.tentativas.get(chave) ?? []).filter((t) => agora - t < this.janelaMs);
    if (lista.length === 0) this.tentativas.delete(chave);
    else this.tentativas.set(chave, lista);
    return lista;
  }

  private limpar(agora: number): void {
    if (agora - this.ultimaLimpeza < 60_000 && this.tentativas.size < this.maxChaves) return;
    this.ultimaLimpeza = agora;
    for (const chave of [...this.tentativas.keys()]) this.recentes(chave, agora);
    // Ainda acima do teto (ataque com muitas chaves): descarta as mais antigas.
    for (const chave of this.tentativas.keys()) {
      if (this.tentativas.size <= this.maxChaves) break;
      this.tentativas.delete(chave);
    }
  }

  /** `true` se a chave já esgotou as tentativas da janela. Não conta nada. */
  bloqueado(chave: string, agora = Date.now()): boolean {
    this.limpar(agora);
    return this.recentes(chave, agora).length >= this.maximo;
  }

  /** Registra uma tentativa. */
  registrar(chave: string, agora = Date.now()): void {
    const lista = this.recentes(chave, agora);
    lista.push(agora);
    this.tentativas.set(chave, lista);
  }

  /** Verifica e, se ainda houver margem, registra. `false` = bloqueado. */
  consumir(chave: string, agora = Date.now()): boolean {
    if (this.bloqueado(chave, agora)) return false;
    this.registrar(chave, agora);
    return true;
  }

  /** Esquece a chave (ex.: login certo zera as falhas daquele e-mail). */
  limparChave(chave: string): void {
    this.tentativas.delete(chave);
  }

  get tamanho(): number {
    return this.tentativas.size;
  }
}
