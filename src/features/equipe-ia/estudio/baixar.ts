/**
 * Utilitários do navegador para baixar e copiar. Ficam fora dos componentes
 * para serem testáveis e para o editor e o visualizador usarem o mesmo código.
 */

/** Nome do arquivo no cabeçalho `Content-Disposition` da resposta (o servidor garante ASCII). */
export function nomeDoCabecalho(resposta: Response): string | null {
  const m = /filename="([^"]+)"/.exec(resposta.headers.get("Content-Disposition") ?? "");
  return m ? m[1] : null;
}

/** Dispara o download de um arquivo em memória. */
export function salvarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // dá tempo ao navegador de iniciar o download antes de liberar a memória
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Copia texto para a área de transferência, com alternativa para navegadores sem a API moderna. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}

/** Mensagem de erro de uma resposta da rota (`{ erro }`), ou uma padrão. */
export async function erroDaResposta(resposta: Response, padrao: string): Promise<string> {
  try {
    const corpo: unknown = await resposta.json();
    if (typeof corpo === "object" && corpo !== null && "erro" in corpo && typeof corpo.erro === "string") {
      return corpo.erro;
    }
  } catch {
    // corpo que não é JSON: cai na mensagem padrão
  }
  return padrao;
}
