/**
 * Escritor mínimo de ZIP (método "store", sem compressão), sem dependência.
 *
 * Existe para empacotar os slides de um carrossel (PNG, que já é comprimido,
 * então comprimir de novo não ganha nada) com a legenda e o calendário em um
 * único download. Escrito à mão em vez de puxar uma biblioteca porque o
 * formato é pequeno, fixo e o que entra é todo gerado pelo próprio servidor.
 *
 * Segurança do nome dos arquivos: só caracteres ASCII simples e `/`, sem
 * `..` e sem barra inicial. O nome nunca vem do usuário (é gerado pelo
 * servidor), mas a validação fica aqui para que ninguém use este módulo para
 * criar um arquivo com caminho que escape da pasta ao descompactar ("zip slip").
 */

export interface ArquivoZip {
  nome: string;
  dados: Uint8Array;
}

const NOME_VALIDO = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

let tabela: Uint32Array | null = null;

function tabelaCrc(): Uint32Array {
  if (tabela) return tabela;
  tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
}

export function crc32(dados: Uint8Array): number {
  const t = tabelaCrc();
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = t[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dataDos(quando: Date): { hora: number; data: number } {
  const ano = Math.max(1980, quando.getUTCFullYear());
  return {
    hora: (quando.getUTCHours() << 11) | (quando.getUTCMinutes() << 5) | (quando.getUTCSeconds() >> 1),
    data: ((ano - 1980) << 9) | ((quando.getUTCMonth() + 1) << 5) | quando.getUTCDate(),
  };
}

export function criarZip(arquivos: readonly ArquivoZip[], quando: Date): Uint8Array {
  if (arquivos.length > 0xffff) throw new Error("Arquivos demais para um ZIP simples.");
  const codificador = new TextEncoder();
  const { hora, data } = dataDos(quando);

  const locais: Uint8Array[] = [];
  const centrais: Uint8Array[] = [];
  let deslocamento = 0;

  for (const arquivo of arquivos) {
    if (!NOME_VALIDO.test(arquivo.nome) || arquivo.nome.includes("..")) {
      throw new Error(`Nome de arquivo inválido no ZIP: ${arquivo.nome}`);
    }
    const nome = codificador.encode(arquivo.nome);
    const crc = crc32(arquivo.dados);
    const tamanho = arquivo.dados.length;

    const local = new Uint8Array(30 + nome.length + tamanho);
    const v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true); // versão necessária
    v.setUint16(6, 0x0800, true); // nomes em UTF-8
    v.setUint16(8, 0, true); // sem compressão
    v.setUint16(10, hora, true);
    v.setUint16(12, data, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, tamanho, true);
    v.setUint32(22, tamanho, true);
    v.setUint16(26, nome.length, true);
    v.setUint16(28, 0, true);
    local.set(nome, 30);
    local.set(arquivo.dados, 30 + nome.length);
    locais.push(local);

    const central = new Uint8Array(46 + nome.length);
    const c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, hora, true);
    c.setUint16(14, data, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, tamanho, true);
    c.setUint32(24, tamanho, true);
    c.setUint16(28, nome.length, true);
    c.setUint32(42, deslocamento, true);
    central.set(nome, 46);
    centrais.push(central);

    deslocamento += local.length;
  }

  const tamanhoCentral = centrais.reduce((s, c) => s + c.length, 0);
  const fim = new Uint8Array(22);
  const f = new DataView(fim.buffer);
  f.setUint32(0, 0x06054b50, true);
  f.setUint16(8, arquivos.length, true);
  f.setUint16(10, arquivos.length, true);
  f.setUint32(12, tamanhoCentral, true);
  f.setUint32(16, deslocamento, true);

  const saida = new Uint8Array(deslocamento + tamanhoCentral + fim.length);
  let pos = 0;
  for (const parte of [...locais, ...centrais, fim]) {
    saida.set(parte, pos);
    pos += parte.length;
  }
  return saida;
}
