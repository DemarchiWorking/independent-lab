/**
 * Fonte ÚNICA de verdade da região atendida (Vale do Café / Sul-RJ).
 *
 * Antes esta lista vivia duplicada em 4 lugares (file-adapter, seed.sql,
 * perguntas do onboarding e scoring) — adicionar uma cidade exigia lembrar
 * dos 4, e esquecer o `scoring` fazia a cidade não pontuar no fit comercial.
 * Agora só o seed SQL precisa ser espelhado manualmente (é outro runtime).
 *
 * Ancorada no ICP real do labdatadev — ver
 * labdatadev-context/03-market/icp_definition.md
 */

export interface CidadeRegiao {
  nome: string;
  /** cidade prioritária no ICP (pontua fit comercial no onboarding) */
  prioritaria: boolean;
}

export const CIDADES_REGIAO: readonly CidadeRegiao[] = [
  { nome: "Mendes", prioritaria: true },
  { nome: "Vassouras", prioritaria: true },
  { nome: "Barra do Piraí", prioritaria: true },
  { nome: "Piraí", prioritaria: true },
  { nome: "Volta Redonda", prioritaria: true },
  { nome: "Resende", prioritaria: true },
  { nome: "Outra", prioritaria: false },
] as const;

/** Normaliza para comparação tolerante a acento/caixa. Exportada porque a
 *  resolução de CEP (`lib/localizacao/cep.ts`) precisa da mesma tolerância
 *  para casar `localidade` do ViaCEP contra `CIDADES_REGIAO` — reaproveitar
 *  evita duas implementações do mesmo normalizador divergindo. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** `true` se a cidade informada é prioritária no ICP (aceita com/sem acento). */
export function ehCidadePrioritaria(cidade: string): boolean {
  const alvo = normalizar(cidade);
  return CIDADES_REGIAO.some(
    (c) => c.prioritaria && normalizar(c.nome) === alvo,
  );
}

/** Acha a entrada de `CIDADES_REGIAO` cujo nome bate com `cidade` (tolerante
 *  a acento/caixa), ou `undefined` se for uma cidade fora do ICP conhecido —
 *  usado pela resolução de CEP para decidir se a cidade real do ViaCEP é uma
 *  das já modeladas ou uma cidade nova (fora do piloto). */
export function encontrarCidadeRegiao(
  cidade: string,
): CidadeRegiao | undefined {
  const alvo = normalizar(cidade);
  return CIDADES_REGIAO.find((c) => normalizar(c.nome) === alvo);
}
