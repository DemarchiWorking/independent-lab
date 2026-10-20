import { CAMPOS_DAS_MENSAGENS } from "../entregaveis/comercial";
import { carrosselParaDocumento, LIMITE_LEGENDA, LIMITE_TEXTO_SLIDE, LIMITE_TITULO_SLIDE } from "../entregaveis/carrossel";
import { auditarDocumento, textosDoDocumento } from "../entregaveis/qualidade";
import type { Bloco, CelulaCanvas, Documento, PacoteCarrossel, PautaCarrossel, PapelSlide, Secao, SlideCarrossel } from "../entregaveis/tipos";
import type { TipoEntregavel } from "../habilidades";
import { BLOCOS_POR_TIPO } from "./prompt";
import type { ConteudoDocumento, ConteudoIA, ConteudoPacote } from "./versoes";

/**
 * Validação da resposta do modelo.
 *
 * A saída da IA é DADO NÃO CONFIÁVEL: foi escrita por um modelo que leu texto
 * digitado por usuários (nome de negócio, ofertas). Nada dela vai para a tela
 * nem para o banco sem passar por aqui, e o que passa é reconstruído campo a
 * campo, nunca copiado: campo desconhecido some, tipo errado reprova.
 *
 * O que se confere, em ordem:
 *  1. forma: tipos, tamanhos, quantidades, ids, valores permitidos;
 *  2. dado novo: URL, e-mail, telefone, CNPJ, @perfil, percentual e valor em
 *     reais que NÃO estavam no que o modelo recebeu (é a assinatura de
 *     invenção, e de texto plantado por prompt injection);
 *  3. regressão: o resultado não pode ser menor nem mais pobre que a versão
 *     de regras que ele deveria melhorar;
 *  4. o mesmo linter dos geradores (`auditarDocumento`): promessa inventada,
 *     campo solto, dado privado em material público.
 */

export interface Problema {
  codigo: string;
  onde: string;
  detalhe?: string;
}

export type ResultadoValidacao = { ok: true; conteudo: ConteudoIA } | { ok: false; problemas: Problema[] };

const MAX_PROBLEMAS = 25;

/**
 * `artigo-antes-do-nome` existe para pegar o chute de gênero do GERADOR de regras ("a Mercado
 * Fiel"). Um modelo decide pelo contexto, e "O Studio Bela Cabelos atende..." é português
 * natural: reprovar por isso só geraria recusa desnecessária. O prompt pede para evitar o artigo.
 */
const CODIGO_DO_GERADOR = "artigo-antes-do-nome";

/** Para o log: só códigos, nunca o conteúdo. */
export const problemasParaLog = (ps: readonly Problema[]): string[] => [...new Set(ps.map((p) => `${p.codigo}@${p.onde}`))].slice(0, MAX_PROBLEMAS);

const EXPLICACAO: Record<string, string> = {
  "forma-invalida": "estrutura fora do esquema",
  "texto-vazio": "texto vazio",
  "texto-longo": "texto acima do tamanho máximo",
  "quantidade-invalida": "quantidade de itens fora do permitido",
  "id-invalido": "id inválido ou repetido",
  "secao-faltando": "seção do documento base removida",
  "secao-nova-invalida": "seção nova sem o prefixo ia- ou além do limite",
  "bloco-nao-permitido": "tipo de bloco não permitido neste material",
  "html": "HTML ou imagem no texto",
  "link": "link ou endereço de site",
  "email": "e-mail",
  "telefone": "telefone",
  "documento-pessoal": "CNPJ ou CPF",
  "perfil-rede": "perfil de rede social (@usuario)",
  "percentual-novo": "percentual que não está nos dados",
  "valor-novo": "valor em reais que não está nos dados",
  "regressao": "menos conteúdo que o documento base",
  "pauta-faltando": "pauta do documento base removida ou id novo",
  "slide-invalido": "slide fora das regras (capa primeiro, convite por último, tamanhos)",
  "hashtag-invalida": "hashtag fora do formato (#semacento)",
  "valor-invalido": "valor inválido",
  "espaco-duplo": "espaço duplo",
  "espaco-nas-pontas": "espaço no começo ou fim",
  "espaco-antes-de-pontuacao": "espaço antes de pontuação",
  "campo-desconhecido": "campo {entre chaves} que não existe",
  "campo-pendente": "campo [entre colchetes] sem preencher em material interno",
  "artigo-antes-do-nome": "artigo antes do nome do negócio",
  "promessa-inventada": "promessa de resultado",
  "dado-privado-em-material-publico": "dado privado em material público",
};

/** Texto para devolver ao modelo, sem repetir o conteúdo ofensivo inteiro. */
export function problemasParaFeedback(ps: readonly Problema[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const p of ps) {
    const texto = `${EXPLICACAO[p.codigo] ?? p.codigo} (${p.onde}${p.detalhe ? `: ${p.detalhe.slice(0, 40)}` : ""})`;
    if (!vistos.has(texto)) {
      vistos.add(texto);
      saida.push(texto);
    }
  }
  return saida.slice(0, 10);
}

class Coletor {
  readonly lista: Problema[] = [];
  add(codigo: string, onde: string, detalhe?: string): void {
    if (this.lista.length < MAX_PROBLEMAS) this.lista.push({ codigo, onde, detalhe });
  }
  get vazio(): boolean {
    return this.lista.length === 0;
  }
}

// ------------------------------------------------------------------ primitivas

function objeto(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029]/g;

/** Texto do modelo, limpo: sem caractere de controle, espaços normalizados, no tamanho. */
function texto(v: unknown, max: number, onde: string, c: Coletor, o: { vazioOk?: boolean; multilinha?: boolean } = {}): string {
  if (typeof v !== "string") {
    c.add("forma-invalida", onde);
    return "";
  }
  const limpo = v.replace(CONTROLE, "");
  const normal = o.multilinha
    ? limpo
        .split(/\r?\n/)
        .map((l) => l.replace(/[ \t]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    : limpo.replace(/\s+/g, " ").trim();
  if (normal === "" && !o.vazioOk) c.add("texto-vazio", onde);
  if (Array.from(normal).length > max) c.add("texto-longo", onde);
  return normal;
}

function lista(v: unknown, min: number, max: number, onde: string, c: Coletor): unknown[] {
  if (!Array.isArray(v)) {
    c.add("forma-invalida", onde);
    return [];
  }
  if (v.length < min || v.length > max) c.add("quantidade-invalida", onde, `${v.length}`);
  return v.slice(0, max);
}

function textos(v: unknown, min: number, max: number, maxChars: number, onde: string, c: Coletor): string[] {
  return lista(v, min, max, onde, c).map((t) => texto(t, maxChars, onde, c));
}

// --------------------------------------------------------------- dado novo

const REGEX_PERCENTUAL = /\d+(?:[.,]\d+)?\s?%/g;
const REGEX_REAIS = /R\$\s?\d[\d.,]*/g;
const REGEX_TELEFONE = /(?<![\d.])\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}(?![\d.])/;
const REGEX_DOC = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/;
const REGEX_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const REGEX_LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|gov|edu)(\.br)?\b/i;
const REGEX_PERFIL = /(^|[\s(])@[\p{L}\p{N}_.]{2,}/u;
const REGEX_HTML = /<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\]\([^)]*\)/i;

const semEspacos = (s: string): string => s.replace(/\s+/g, "");

/** Confere um texto da resposta contra o que o modelo recebeu: nada de dado novo. */
function conferirDadoNovo(t: string, onde: string, visto: string, vistoSemEspacos: string, c: Coletor): void {
  if (REGEX_HTML.test(t)) c.add("html", onde);
  if (REGEX_LINK.test(t) && !REGEX_LINK.test(visto)) c.add("link", onde);
  if (REGEX_EMAIL.test(t) && !REGEX_EMAIL.test(visto)) c.add("email", onde);
  if (REGEX_TELEFONE.test(t) && !REGEX_TELEFONE.test(visto)) c.add("telefone", onde);
  if (REGEX_DOC.test(t)) c.add("documento-pessoal", onde);
  if (REGEX_PERFIL.test(t) && !REGEX_PERFIL.test(visto)) c.add("perfil-rede", onde);
  for (const m of t.matchAll(REGEX_PERCENTUAL)) {
    if (!vistoSemEspacos.includes(semEspacos(m[0]))) c.add("percentual-novo", onde, m[0]);
  }
  for (const m of t.matchAll(REGEX_REAIS)) {
    if (!vistoSemEspacos.includes(semEspacos(m[0]).replace(/[.,]+$/, ""))) c.add("valor-novo", onde, m[0]);
  }
}

// ------------------------------------------------------------------ documento

const TONS = ["info", "atencao", "sucesso"] as const;
const CELULAS: readonly CelulaCanvas[] = ["parcerias", "atividades", "recursos", "proposta", "relacionamento", "canais", "segmentos", "custos", "receitas"];
const ID_SECAO = /^[a-z0-9][a-z0-9-]{0,59}$/;

function bloco(b: unknown, onde: string, c: Coletor, permitidos: ReadonlySet<string>): Bloco | null {
  const o = objeto(b);
  if (!o || typeof o.tipo !== "string") {
    c.add("forma-invalida", onde);
    return null;
  }
  if (!permitidos.has(o.tipo)) {
    c.add("bloco-nao-permitido", onde, o.tipo.slice(0, 20));
    return null;
  }
  switch (o.tipo) {
    case "paragrafo":
      return { tipo: "paragrafo", texto: texto(o.texto, 1500, onde, c) };
    case "destaque": {
      const titulo = texto(o.titulo, 140, onde, c, { vazioOk: true });
      const tom = TONS.find((t) => t === o.tom);
      if (!tom) c.add("forma-invalida", `${onde}/tom`);
      return { tipo: "destaque", ...(titulo ? { titulo } : {}), texto: texto(o.texto, 1000, onde, c), tom: tom ?? "info" };
    }
    case "lista":
      return { tipo: "lista", itens: textos(o.itens, 1, 30, 500, onde, c), ...(o.ordenada === true ? { ordenada: true } : {}) };
    case "checklist":
      return { tipo: "checklist", itens: textos(o.itens, 1, 30, 400, onde, c) };
    case "passos":
      return {
        tipo: "passos",
        passos: lista(o.passos, 1, 25, onde, c).map((p) => {
          const po = objeto(p);
          if (!po) {
            c.add("forma-invalida", onde);
            return { titulo: "" };
          }
          const detalhe = texto(po.detalhe, 600, onde, c, { vazioOk: true });
          return { titulo: texto(po.titulo, 300, onde, c), ...(detalhe ? { detalhe } : {}) };
        }),
      };
    case "mensagem": {
      const quando = texto(o.quando, 200, onde, c, { vazioOk: true });
      return {
        tipo: "mensagem",
        rotulo: texto(o.rotulo, 100, onde, c),
        ...(quando ? { quando } : {}),
        texto: texto(o.texto, 1500, onde, c, { multilinha: true }),
      };
    }
    case "tabela": {
      const colunas = textos(o.colunas, 1, 12, 80, onde, c);
      // Tabelas-modelo (planilha de leads, registro) têm células em branco para o dono preencher.
      const linhas = lista(o.linhas, 1, 40, onde, c).map((l) =>
        lista(l, colunas.length, colunas.length, onde, c).map((cel) => texto(cel, 600, onde, c, { vazioOk: true })),
      );
      return { tipo: "tabela", colunas, linhas };
    }
    case "canvas": {
      const cel = objeto(o.celulas);
      if (!cel) {
        c.add("forma-invalida", onde);
        return null;
      }
      const celulas = {} as Record<CelulaCanvas, string[]>;
      for (const k of CELULAS) celulas[k] = textos(cel[k], 1, 8, 300, `${onde}/${k}`, c);
      return { tipo: "canvas", celulas };
    }
    case "cartoes":
      return {
        tipo: "cartoes",
        cartoes: lista(o.cartoes, 1, 12, onde, c).map((x) => {
          const xo = objeto(x);
          if (!xo) {
            c.add("forma-invalida", onde);
            return { titulo: "", itens: [] };
          }
          return { titulo: texto(xo.titulo, 140, onde, c), itens: textos(xo.itens, 1, 15, 500, onde, c) };
        }),
      };
    case "cena":
      return {
        tipo: "cena",
        tempo: texto(o.tempo, 20, onde, c),
        papel: texto(o.papel, 60, onde, c),
        fala: texto(o.fala, 400, onde, c),
        imagem: texto(o.imagem, 400, onde, c),
        legenda: texto(o.legenda, 60, onde, c),
      };
    default:
      c.add("bloco-nao-permitido", onde);
      return null;
  }
}

function contarBlocos(secoes: readonly Secao[], tipo: Bloco["tipo"]): number {
  return secoes.reduce((n, s) => n + s.blocos.filter((b) => b.tipo === tipo).length, 0);
}

function tamanhoDoTexto(doc: Documento): number {
  return textosDoDocumento(doc).reduce((n, [, t]) => n + t.length, 0);
}

export interface OpcoesValidacao {
  tipo: TipoEntregavel;
  nomeNegocio: string;
  /** tudo que o modelo recebeu, para conferir que a resposta não trouxe dado novo */
  textoVisto: string;
  baseline: Documento;
  pacoteBase: PacoteCarrossel | null;
}

function validarDocumento(saida: unknown, o: OpcoesValidacao): ResultadoValidacao {
  const c = new Coletor();
  const raiz = objeto(saida);
  if (!raiz || o.tipo === "carrossel") return { ok: false, problemas: [{ codigo: "forma-invalida", onde: "raiz" }] };

  const permitidos = new Set<string>([...BLOCOS_POR_TIPO[o.tipo], ...o.baseline.secoes.flatMap((s) => s.blocos.map((b) => b.tipo))]);
  const titulo = texto(raiz.titulo, 120, "titulo", c);
  const subtitulo = texto(raiz.subtitulo, 240, "subtitulo", c);

  const idsBase = new Set(o.baseline.secoes.map((s) => s.id));
  const vistos = new Set<string>();
  let novas = 0;
  let totalBlocos = 0;
  const secoes: Secao[] = lista(raiz.secoes, 1, 30, "secoes", c).map((s, i) => {
    const so = objeto(s);
    if (!so) {
      c.add("forma-invalida", `secao-${i}`);
      return { id: `secao-${i}`, titulo: "", blocos: [] };
    }
    const id = typeof so.id === "string" ? so.id : "";
    const onde = id || `secao-${i}`;
    if (!ID_SECAO.test(id) || vistos.has(id)) c.add("id-invalido", onde);
    vistos.add(id);
    if (!idsBase.has(id)) {
      novas += 1;
      if (!id.startsWith("ia-") || novas > 4) c.add("secao-nova-invalida", onde);
    }
    const intro = texto(so.intro, 500, onde, c, { vazioOk: true });
    const blocos = lista(so.blocos, 1, 40, onde, c)
      .map((b) => bloco(b, onde, c, permitidos))
      .filter((b): b is Bloco => b !== null);
    totalBlocos += blocos.length;
    return { id, titulo: texto(so.titulo, 140, onde, c), ...(intro ? { intro } : {}), blocos };
  });
  if (totalBlocos > 300) c.add("quantidade-invalida", "blocos", `${totalBlocos}`);
  for (const id of idsBase) if (!vistos.has(id)) c.add("secao-faltando", id);

  if (!c.vazio) return { ok: false, problemas: c.lista };

  const doc: Documento = { ...o.baseline, titulo, subtitulo, secoes };

  // dado novo, texto a texto
  const visto = o.textoVisto;
  const vistoSE = semEspacos(visto);
  for (const [onde, t] of textosDoDocumento(doc)) conferirDadoNovo(t, onde, visto, vistoSE, c);

  // regressão: não pode ser mais pobre que a versão de regras
  const base = o.baseline;
  if (tamanhoDoTexto(doc) < tamanhoDoTexto(base) * 0.7) c.add("regressao", "texto-total");
  for (const t of ["canvas", "cena", "mensagem", "passos"] as const) {
    if (contarBlocos(secoes, t) < contarBlocos(base.secoes, t)) c.add("regressao", `blocos-${t}`);
  }
  if (contarBlocos(secoes, "tabela") < Math.floor(contarBlocos(base.secoes, "tabela") * 0.7)) c.add("regressao", "blocos-tabela");

  // mesmo linter dos geradores
  const publico = base.meta.circulacao === "publico";
  for (const p of auditarDocumento(doc, { nomeNegocio: o.nomeNegocio, publico, permitirColchetes: false })) {
    if (p.codigo === CODIGO_DO_GERADOR) continue;
    c.add(p.codigo, p.onde, p.trecho);
  }

  if (!c.vazio) return { ok: false, problemas: c.lista };
  const conteudo: ConteudoDocumento = { tipo: "documento", titulo, subtitulo, secoes };
  return { ok: true, conteudo };
}

// -------------------------------------------------------------------- pacote

const PAPEIS: readonly PapelSlide[] = ["capa", "conteudo", "prova", "cta"];
const HASHTAG = /^#[a-z0-9_]{2,40}$/;
const COLCHETES = /\[[^\]\n]+\]/;

function validarPacote(saida: unknown, o: OpcoesValidacao): ResultadoValidacao {
  const c = new Coletor();
  const raiz = objeto(saida);
  const base = o.pacoteBase;
  if (!raiz || !base || o.tipo !== "carrossel") return { ok: false, problemas: [{ codigo: "forma-invalida", onde: "raiz" }] };

  const baseId = new Map(base.pautas.map((p) => [p.id, p]));
  const vistos = new Set<string>();
  const pautas: PautaCarrossel[] = lista(raiz.pautas, base.pautas.length, base.pautas.length, "pautas", c).map((p, i) => {
    const po = objeto(p);
    const id = po && typeof po.id === "string" ? po.id : "";
    const original = baseId.get(id);
    const onde = id || `pauta-${i}`;
    if (!po || !original || vistos.has(id)) {
      c.add("pauta-faltando", onde);
      return base.pautas[Math.min(i, base.pautas.length - 1)];
    }
    vistos.add(id);

    const slides: SlideCarrossel[] = lista(po.slides, 4, 10, `${onde}/slides`, c).map((s, n) => {
      const so = objeto(s);
      const ondeSlide = `${onde}/slide-${n + 1}`;
      if (!so) {
        c.add("forma-invalida", ondeSlide);
        return { papel: "conteudo" as PapelSlide, titulo: "", texto: "" };
      }
      const papel = PAPEIS.find((x) => x === so.papel);
      if (!papel) c.add("slide-invalido", ondeSlide, "papel");
      const titulo = texto(so.titulo, LIMITE_TITULO_SLIDE, ondeSlide, c);
      const txt = texto(so.texto, LIMITE_TEXTO_SLIDE, ondeSlide, c);
      return { papel: papel ?? "conteudo", titulo, texto: txt };
    });
    if (slides.length > 0 && (slides[0].papel !== "capa" || slides[slides.length - 1].papel !== "cta")) c.add("slide-invalido", onde, "capa primeiro e convite por último");

    const hashtags = textos(po.hashtags, 3, 15, 41, `${onde}/hashtags`, c);
    for (const h of hashtags) if (!HASHTAG.test(h)) c.add("hashtag-invalida", onde, h);
    const legenda = texto(po.legenda, LIMITE_LEGENDA, `${onde}/legenda`, c, { multilinha: true });
    const textoAlternativo = texto(po.textoAlternativo, 500, `${onde}/alt`, c);
    const orientacaoVisual = texto(po.orientacaoVisual, 500, `${onde}/visual`, c);
    const rascunho = slides.some((s) => COLCHETES.test(s.titulo) || COLCHETES.test(s.texto)) || COLCHETES.test(legenda);

    return {
      id,
      angulo: original.angulo,
      rotulo: texto(po.rotulo, 80, `${onde}/rotulo`, c),
      objetivo: texto(po.objetivo, 160, `${onde}/objetivo`, c),
      slides,
      legenda,
      hashtags,
      textoAlternativo,
      orientacaoVisual,
      rascunho,
    };
  });
  for (const id of baseId.keys()) if (!vistos.has(id)) c.add("pauta-faltando", id);

  const boasPraticas = textos(raiz.boasPraticas, 3, 12, 300, "boasPraticas", c);
  const reaproveitamento = textos(raiz.reaproveitamento, 0, 8, 300, "reaproveitamento", c);
  const metricas = textos(raiz.metricas, 2, 10, 300, "metricas", c);
  if (!c.vazio) return { ok: false, problemas: c.lista };

  const montado: PacoteCarrossel = { ...base, pautas, boasPraticas, reaproveitamento, metricas };
  const doc = carrosselParaDocumento(montado);

  const visto = o.textoVisto;
  const vistoSE = semEspacos(visto);
  for (const [onde, t] of textosDoDocumento(doc)) conferirDadoNovo(t, onde, visto, vistoSE, c);

  const tamanhoBase = tamanhoDoTexto(carrosselParaDocumento(base));
  if (tamanhoDoTexto(doc) < tamanhoBase * 0.6) c.add("regressao", "texto-total");

  // Rascunhos (com [campos]) são permitidos nas pautas; o resto vale como em qualquer material público.
  for (const p of auditarDocumento(doc, { nomeNegocio: o.nomeNegocio, publico: true, permitirColchetes: true })) {
    if (p.codigo === CODIGO_DO_GERADOR) continue;
    c.add(p.codigo, p.onde, p.trecho);
  }

  if (!c.vazio) return { ok: false, problemas: c.lista };
  const conteudo: ConteudoPacote = { tipo: "pacote", pautas, boasPraticas, reaproveitamento, metricas };
  return { ok: true, conteudo };
}

export function validarSaidaIA(saida: unknown, o: OpcoesValidacao): ResultadoValidacao {
  return o.tipo === "carrossel" ? validarPacote(saida, o) : validarDocumento(saida, o);
}

/** Campos {entre chaves} que as mensagens podem usar (para os testes e a tela). */
export const CAMPOS_PERMITIDOS: readonly string[] = CAMPOS_DAS_MENSAGENS;
