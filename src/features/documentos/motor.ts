import { ATRIBUTO_CHAVES, ATRIBUTO_LABEL } from "@/lib/atributos";
import { CARGOS_IA } from "@/features/equipe-ia/catalogo";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { slugify } from "@/lib/db/file-adapter";
import { CIDADES_REGIAO } from "@/lib/regiao";
import type { AtributoChave } from "@tokens";
import type { Negocio, Onboarding, Respostas, Segmento } from "@/lib/db/types";
import type { Capitulo, Escolha } from "@/features/historia/tipos";

/**
 * Nome legível da cidade a partir do slug persistido — mesma correspondência
 * que `file-adapter.ts`/`seed.sql` usam para CRIAR o slug (`slugify(nome)`),
 * aqui invertida por busca. Cai para o próprio slug só se a cidade não
 * estiver na lista oficial (ex.: alguém digitou uma cidade fora do Vale do
 * Café no cadastro) — nunca quebra o documento por causa disso.
 */
function nomeDaCidade(cidadeSlug: string): string {
  const cidade = CIDADES_REGIAO.find((c) => slugify(c.nome) === cidadeSlug);
  return cidade?.nome ?? cidadeSlug;
}

/**
 * O motor do Diagnóstico de Maturidade Digital (GH-OPS Bloco 4) — PURO,
 * testado, sem `next/*`, sem banco. É aqui que mora a metodologia; a página
 * (`src/app/documentos/[docId]/page.tsx`) só formata o que este arquivo
 * decide.
 *
 * Zero dado inventado: cada campo do documento vem de algo que já existe no
 * negócio (atributos, degrau, resposta do onboarding) ou do catálogo real de
 * Funcionários de IA. Nenhuma nota, nenhum texto, é gerado por IA generativa
 * na hora — é sempre a mesma função determinística para o mesmo dado, o que é
 * o que torna o documento AUDITÁVEL (mesmo negócio, mesmo diagnóstico, sempre).
 */

/** Sobe quando a metodologia muda (peso dos eixos, texto dos movimentos...).
 *  Gravado junto do documento emitido — ver `tipos.ts` `DocumentoEmitido`. */
export const VERSAO_METODOLOGIA = "1.0.0";

export interface EixoDiagnostico {
  chave: AtributoChave;
  label: string;
  valor: number;
  teto: number;
  /** 0–100, arredondado — o que aparece como barra/nota no documento */
  percentual: number;
}

export interface MovimentoRecomendado {
  eixo: AtributoChave;
  eixoLabel: string;
  titulo: string;
  descricao: string;
  /** presente quando existe um Funcionário de IA real que ataca este eixo */
  cargo?: {
    id: string;
    nome: string;
    precoMensal: number;
    /** `false` = existe, mas só libera num degrau acima do atual */
    disponivelAgora: boolean;
    degrauMinimo: number;
  };
}

export interface Diagnostico {
  geradoEm: string;
  versaoMetodologia: string;
  negocio: {
    nome: string;
    segmento: Segmento;
    cidade: string;
    criadoEm: string;
  };
  /** os 5 eixos, do MAIS FRACO para o mais forte — é a ordem de leitura do documento */
  eixos: EixoDiagnostico[];
  eixoMaisFraco: EixoDiagnostico;
  degrau: {
    atual: number;
    atualNome: string;
    alvo: number;
    alvoNome: string;
  };
  gargalo: {
    /** o que o próprio dono apontou nas 10 perguntas — `null` se nunca respondeu */
    declarado: string | null;
    /** leitura objetiva a partir do eixo mais fraco — pode confirmar ou contrastar com o declarado */
    observado: string;
  };
  /** até 3, um por eixo fraco — nunca mais eixos do que os que existem */
  movimentos: MovimentoRecomendado[];
}

const LABEL_GARGALO: Record<Respostas["gargalo"], string> = {
  "perco-leads": "Perde lead por demora na resposta",
  manual: "Processo manual, sem automação",
  "sem-dados": "Decide sem dado — não sabe o que está funcionando",
  "imagem-fraca": "Imagem/presença digital fraca para o porte do negócio",
  "sem-processo": "Sem processo definido — cada atendimento é do zero",
};

/** Leitura objetiva do eixo mais fraco — o "observado" que confirma ou
 *  contrasta com o que o dono declarou. Uma frase por eixo, escrita para
 *  fazer sentido tanto sozinha quanto ao lado do gargalo declarado. */
const OBSERVADO_POR_EIXO: Record<AtributoChave, string> = {
  tecnologia:
    "A operação ainda depende pouco de automação/dados — é o eixo com mais ganho rápido disponível.",
  processo:
    "A rotina do negócio não está documentada nem repetível — depende de quem está presente no dia.",
  presenca:
    "A presença digital não reflete o tamanho real do negócio — quem procura não encontra com facilidade.",
  aquisicao:
    "A geração e conversão de novos clientes é o gargalo mais visível hoje.",
  capacidade:
    "A equipe está no limite do que consegue sustentar sem apoio adicional.",
};

/** Recomendação genérica quando NENHUM Funcionário de IA ataca o eixo
 *  diretamente (hoje: tecnologia e capacidade) — real, só não tem um produto
 *  específico do catálogo por trás ainda. */
const MOVIMENTO_GENERICO: Record<AtributoChave, { titulo: string; descricao: string }> = {
  tecnologia: {
    titulo: "Mapear os 3 processos mais manuais",
    descricao:
      "Antes de automatizar, listar o que hoje é feito na mão — é o primeiro passo para qualquer ganho real de tecnologia.",
  },
  processo: {
    titulo: "Escrever o passo a passo do atendimento",
    descricao:
      "Documentar como o negócio funciona hoje, mesmo informalmente — é o que permite delegar sem perder qualidade.",
  },
  presenca: {
    titulo: "Publicar com regularidade, não perfeição",
    descricao:
      "Presença consistente vale mais que presença bonita e esporádica — o primeiro objetivo é aparecer toda semana.",
  },
  aquisicao: {
    titulo: "Definir um único canal principal de entrada de lead",
    descricao:
      "Concentrar esforço num canal só até ele funcionar bem, em vez de estar mal em vários ao mesmo tempo.",
  },
  capacidade: {
    titulo: "Priorizar 1 apoio antes de contratar mais gente",
    descricao:
      "Antes de aumentar a equipe, testar se um Funcionário de IA absorve a tarefa que mais consome tempo hoje.",
  },
};

/** Os 5 eixos com valor/percentual, ordenados do mais fraco pro mais forte.
 *  Desempate estável por ordem alfabética da chave — determinístico. */
function ordenarEixos(negocio: Negocio): EixoDiagnostico[] {
  return ATRIBUTO_CHAVES.map((chave) => {
    const { valor, teto } = negocio.atributos[chave];
    return {
      chave,
      label: ATRIBUTO_LABEL[chave],
      valor,
      teto,
      percentual: teto > 0 ? Math.round((valor / teto) * 100) : 0,
    };
  }).sort((a, b) => a.percentual - b.percentual || (a.chave < b.chave ? -1 : 1));
}

/** O melhor Funcionário de IA para um eixo: entre os que o fortalecem, o de
 *  menor `degrauMinimo` (o mais acessível primeiro). */
function cargoParaEixo(eixo: AtributoChave) {
  const candidatos = CARGOS_IA.filter((c) => c.eixoFortalecido === eixo);
  if (candidatos.length === 0) return undefined;
  return candidatos.reduce((a, b) => (a.degrauMinimo <= b.degrauMinimo ? a : b));
}

function movimentosPara(eixosFracos: EixoDiagnostico[], degrauAtual: number): MovimentoRecomendado[] {
  return eixosFracos.map((eixo) => {
    const cargo = cargoParaEixo(eixo.chave);
    if (!cargo) {
      const generico = MOVIMENTO_GENERICO[eixo.chave];
      return { eixo: eixo.chave, eixoLabel: eixo.label, ...generico };
    }
    return {
      eixo: eixo.chave,
      eixoLabel: eixo.label,
      titulo: `Contratar ${cargo.nome}`,
      descricao: cargo.entrega,
      cargo: {
        id: cargo.id,
        nome: cargo.nome,
        precoMensal: cargo.precoMensal,
        disponivelAgora: degrauAtual >= cargo.degrauMinimo,
        degrauMinimo: cargo.degrauMinimo,
      },
    };
  });
}

/**
 * Gera o Diagnóstico — determinístico: mesmo `negocio`/`onboarding`/`agoraIso`,
 * sempre o mesmo resultado. `agoraIso` é sempre explícito (mesmo princípio de
 * `equipe-ia/senioridade.ts`) — nunca `new Date()` escondido aqui dentro.
 */
export function gerarDiagnostico(
  negocio: Negocio,
  onboarding: Onboarding | null,
  agoraIso: string,
): Diagnostico {
  const eixos = ordenarEixos(negocio);
  const eixoMaisFraco = eixos[0];
  const eixosFracos = eixos.slice(0, Math.min(3, eixos.length));

  const atual = DEGRAUS[negocio.degrauAtual];
  const alvo = DEGRAUS[negocio.degrauAlvo];

  return {
    geradoEm: agoraIso,
    versaoMetodologia: VERSAO_METODOLOGIA,
    negocio: {
      nome: negocio.nome,
      segmento: negocio.segmento,
      cidade: nomeDaCidade(negocio.endereco.cidadeSlug),
      criadoEm: negocio.criadoEm,
    },
    eixos,
    eixoMaisFraco,
    degrau: {
      atual: negocio.degrauAtual,
      atualNome: atual?.nome ?? `Degrau ${negocio.degrauAtual}`,
      alvo: negocio.degrauAlvo,
      alvoNome: alvo?.nome ?? `Degrau ${negocio.degrauAlvo}`,
    },
    gargalo: {
      declarado: onboarding ? LABEL_GARGALO[onboarding.respostas.gargalo] : null,
      observado: OBSERVADO_POR_EIXO[eixoMaisFraco.chave],
    },
    movimentos: movimentosPara(eixosFracos, negocio.degrauAtual),
  };
}

// ---------------------------------------------------------------------------
// Documentos narrativos — conteúdo real, puxado do capítulo/escolha que o
// jogador de fato viveu (nunca texto inventado fora da história).
// ---------------------------------------------------------------------------

export interface DocumentoNarrativo {
  capituloTitulo: string;
  situacao: string;
  escolhaFeita: string;
  desfecho: string;
}

export function gerarDocumentoNarrativo(
  capitulo: Capitulo,
  escolha: Escolha,
): DocumentoNarrativo {
  return {
    capituloTitulo: capitulo.titulo,
    situacao: capitulo.narrativa,
    escolhaFeita: escolha.rotulo,
    desfecho: escolha.desfecho,
  };
}
