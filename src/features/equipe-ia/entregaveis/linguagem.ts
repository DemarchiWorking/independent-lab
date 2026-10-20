/**
 * Utilitários de texto em português para os geradores de entregável.
 *
 * Tudo aqui é puro e sem relógio: as datas entram como parâmetro. Os
 * geradores só montam frases por estas funções (e por `Intl`, que o Node
 * 24 traz completo), nunca concatenando à mão pontuação, artigo ou data.
 */

/** Primeira letra maiúscula, sem mexer no resto (siglas e nomes próprios ficam). */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Primeira letra minúscula — para encaixar uma frase no meio de outra. */
export function minusculaInicial(texto: string): string {
  // "R$ 500", "CNPJ" e "MEI" não perdem a maiúscula: virar "r$ 500" é erro, não estilo.
  if (/^(R\$|[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})/.test(texto)) return texto;
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Texto → hashtag sem acento, espaço ou hífen ("Barra do Piraí" →
 * `#barradopirai`). Hashtag com hífen ou ponto quebra em quase toda rede.
 * Devolve `""` se não sobrar nenhum caractere válido.
 */
export function hashtag(texto: string): string {
  const base = semAcento(texto).toLowerCase().replace(/[^a-z0-9]/g, "");
  return base ? `#${base}` : "";
}

/** Tira o ponto final (e só ele), para itens de lista saírem com pontuação uniforme. */
export function semPontoFinal(texto: string): string {
  return texto.replace(/\.$/, "");
}

/** Junta em português: `a`, `a e b`, `a, b e c`. */
export function listaPt(itens: readonly string[]): string {
  const lista = itens.filter(Boolean);
  if (lista.length <= 1) return lista[0] ?? "";
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

/** "1 cena" / "3 cenas". */
export function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Colapsa qualquer espaço (inclusive quebra de linha) em um espaço só. */
export function umaLinha(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Limpa texto digitado pelo usuário antes de ele entrar num entregável:
 * tira caractere de controle (menos quebra de linha e tab), normaliza os
 * espaços e corta no limite. Não escapa HTML — quem escapa é o renderer, no
 * ponto de saída, que é onde o contexto (HTML, Markdown, imagem) é conhecido.
 */
export function textoLivre(texto: string, max: number): string {
  const semControle = texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  const linhas = semControle
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return truncar(linhas, max);
}

/**
 * Corta em `max` caracteres sem quebrar palavra, terminando com reticências.
 * Conta por pontos de código (um emoji conta 1), não por unidades UTF-16.
 */
export function truncar(texto: string, max: number): string {
  const pontos = Array.from(texto);
  if (pontos.length <= max) return texto;
  const corte = pontos.slice(0, Math.max(0, max - 1)).join("");
  const ultimoEspaco = corte.lastIndexOf(" ");
  const base = ultimoEspaco > max * 0.6 ? corte.slice(0, ultimoEspaco) : corte;
  return `${base.replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/** Garante pontuação final (. ! ? …) sem duplicar a que já existe. */
export function fecharFrase(texto: string): string {
  const t = texto.trim();
  if (!t) return t;
  return /[.!?…:]$/.test(t) ? t : `${t}.`;
}

/** Nome do negócio como entra em texto: sem quebra de linha e com tamanho limitado. */
export function nomeParaTexto(nome: string): string {
  return truncar(umaLinha(nome), 80);
}

/** 19/10/2026 */
export function dataPt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(d);
}

/** Soma dias a uma data ISO e devolve outra data ISO (UTC, sem depender do fuso local). */
export function somarDias(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString();
}

/** "R$ 1.500" — sem centavos; para faixas, não para preço de oferta. */
export function reais(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Nome de arquivo seguro (ASCII, minúsculo, hífens) para `Content-Disposition`. */
export function nomeDeArquivo(texto: string, reserva = "negocio"): string {
  const base = semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || reserva;
}
