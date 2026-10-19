import { CAMPOS_DAS_MENSAGENS } from "./comercial";
import { EQUIPE, GARGALOS, INVESTIMENTO, PLANOS, PRESENCA_DIGITAL } from "./mercado/planos";
import type { Bloco, Documento } from "./tipos";

/**
 * Linter de conteúdo dos entregáveis.
 *
 * Os geradores montam texto por concatenação, e texto montado por código
 * erra de jeitos que o compilador não vê: "undefined" no meio de uma frase,
 * um campo `{valor}` esquecido, "A Mercado Fiel", uma promessa que o negócio
 * nunca fez, o gargalo declarado em segredo aparecendo num post público.
 *
 * Este módulo olha o RESULTADO. É usado de dois jeitos:
 * - nos testes, em todas as combinações de mercado, nível e respostas;
 * - na rota, como alarme: se um material sair com problema, o servidor registra
 *   o código do problema no log (sem o conteúdo) para a regressão aparecer.
 *
 * Cada problema tem um `codigo` estável e o `onde` (seção) para achar rápido.
 */

export interface Problema {
  codigo:
    | "valor-invalido"
    | "espaco-duplo"
    | "espaco-nas-pontas"
    | "espaco-antes-de-pontuacao"
    | "campo-desconhecido"
    | "campo-pendente"
    | "artigo-antes-do-nome"
    | "promessa-inventada"
    | "dado-privado-em-material-publico";
  onde: string;
  trecho: string;
}

/** Frases que prometem o que a IA não sabe se o negócio cumpre. */
const PROMESSAS = [
  /garantimos/i,
  /garantid[oa]/i,
  /sem risco/i,
  /resultado garantido/i,
  /100\s?%/,
  /\bn[úu]mero\s?1\b/i,
  /\bl[ií]der\b/i,
  /o melhor d[aeo]/i,
  /(resposta|respondemos|or[çc]amento|atendimento|entrega)\s+(no mesmo dia|em \d+ minutos)/i,
  /h[áa] mais de \d+ anos/i,
  /o dobro de/i,
];

/** Textos que só existem nas respostas privadas do cadastro. */
export function frasesPrivadas(): string[] {
  return [
    ...Object.values(GARGALOS).flatMap((g) => [g.diagnostico, g.acao, g.sinal]),
    ...Object.values(PLANOS).flatMap((p) => [p.rotulo, p.foco]),
    ...Object.values(INVESTIMENTO).flatMap((i) => [i.rotulo, i.orientacao]),
    ...Object.values(PRESENCA_DIGITAL).flatMap((p) => [p.leitura, p.canal]),
    ...Object.values(EQUIPE).map((e) => e.leitura),
  ];
}

const CAMPO_CHAVES = /\{([^}]*)\}/g;
const CAMPO_COLCHETES = /\[[^\]\n]+\]/;

/** Percorre todo texto do documento, devolvendo `[onde, texto]`. */
export function textosDoDocumento(doc: Documento): Array<[string, string]> {
  const saida: Array<[string, string]> = [
    ["titulo", doc.titulo],
    ["subtitulo", doc.subtitulo],
  ];
  const bloco = (onde: string, b: Bloco) => {
    switch (b.tipo) {
      case "paragrafo":
        saida.push([onde, b.texto]);
        break;
      case "destaque":
        if (b.titulo) saida.push([onde, b.titulo]);
        saida.push([onde, b.texto]);
        break;
      case "lista":
      case "checklist":
        for (const i of b.itens) saida.push([onde, i]);
        break;
      case "passos":
        for (const p of b.passos) {
          saida.push([onde, p.titulo]);
          if (p.detalhe) saida.push([onde, p.detalhe]);
        }
        break;
      case "mensagem":
        saida.push([`${onde}/${b.rotulo}`, b.texto]);
        if (b.quando) saida.push([onde, b.quando]);
        break;
      case "tabela":
        for (const l of b.linhas) for (const c of l) saida.push([onde, c]);
        break;
      case "canvas":
        for (const itens of Object.values(b.celulas)) for (const i of itens) saida.push([onde, i]);
        break;
      case "cartoes":
        for (const c of b.cartoes) {
          saida.push([onde, c.titulo]);
          for (const i of c.itens) saida.push([onde, i]);
        }
        break;
      case "cena":
        saida.push([onde, b.fala], [onde, b.imagem], [onde, b.legenda]);
        break;
    }
  };
  for (const s of doc.secoes) {
    if (s.intro) saida.push([s.id, s.intro]);
    for (const b of s.blocos) bloco(s.id, b);
  }
  return saida;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`);
}

export interface OpcoesAuditoria {
  nomeNegocio: string;
  /** material voltado ao cliente: confere vazamento de dado privado e promessas */
  publico: boolean;
  /** pautas marcadas como rascunho podem ter `[campo]` */
  permitirColchetes?: boolean;
}

export function auditarDocumento(doc: Documento, opcoes: OpcoesAuditoria): Problema[] {
  const problemas: Problema[] = [];
  // `\b` do JavaScript só conhece ASCII: "Conheça Mercado Fiel" casaria "a Mercado
  // Fiel" porque o "ç" conta como fronteira. O lookbehind com \p{L} é Unicode.
  const nomeRegex = new RegExp(
    `(?<![\\p{L}\\p{N}])(a|o|as|os|na|no|nas|nos|da|do|das|dos|pela|pelo|à|ao)\\s+${escaparRegex(opcoes.nomeNegocio)}`,
    "iu",
  );
  const privadas = opcoes.publico ? frasesPrivadas() : [];
  const camposOk = new Set<string>(CAMPOS_DAS_MENSAGENS);

  for (const [onde, texto] of textosDoDocumento(doc)) {
    const trecho = texto.slice(0, 80);
    const registrar = (codigo: Problema["codigo"]) => problemas.push({ codigo, onde, trecho });

    if (/undefined|\bnull\b|NaN|\[object/.test(texto)) registrar("valor-invalido");
    if (/[ \t]{2,}/.test(texto)) registrar("espaco-duplo");
    if (texto !== texto.trim() && texto.trim() !== "") registrar("espaco-nas-pontas");
    if (/[ \t][,.;:!?]/.test(texto)) registrar("espaco-antes-de-pontuacao");

    for (const m of texto.matchAll(CAMPO_CHAVES)) {
      if (!camposOk.has(m[1])) registrar("campo-desconhecido");
    }
    if (!opcoes.permitirColchetes && CAMPO_COLCHETES.test(texto)) registrar("campo-pendente");
    if (nomeRegex.test(texto)) registrar("artigo-antes-do-nome");

    if (opcoes.publico) {
      if (PROMESSAS.some((r) => r.test(texto))) registrar("promessa-inventada");
      if (privadas.some((f) => f.length > 12 && texto.includes(f))) registrar("dado-privado-em-material-publico");
    }
  }
  return problemas;
}

/** Só os códigos, sem o conteúdo, para o log do servidor. */
export function resumirProblemas(problemas: readonly Problema[]): string[] {
  return [...new Set(problemas.map((p) => `${p.codigo}@${p.onde}`))];
}
