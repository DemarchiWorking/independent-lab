import type { PerfilNegocio, ScriptComercial } from "./tipos";
import { GARGALO_TEXTO, OBJETIVO_TEXTO, vocabulario } from "./vocabulario";

/**
 * Script comercial + estratégia de vendas a partir do perfil (entregável
 * do Comercial/SDR de IA). Puro — ver cabeçalho de `canvas.ts`.
 *
 * As perguntas de descoberta seguem BANT adaptado (o método comercial já
 * usado pelo labdatadev — ver docs/CONTEXTO-NEGOCIO.md §3), mas escritas
 * em linguagem de conversa, não de formulário: um dono de PME desliga na
 * hora que percebe que está sendo qualificado por checklist.
 */
export function gerarScript(perfil: PerfilNegocio): ScriptComercial {
  const v = vocabulario(perfil.segmento);
  const { respostas, nivelAgente } = perfil;
  const nivel2 = nivelAgente >= 2;
  const nivel3 = nivelAgente >= 3;

  const abertura =
    `Oi, aqui é da ${perfil.nomeNegocio}. A gente trabalha com ${v.oQueVende} ` +
    `aqui em ${perfil.cidade}. Não vou tomar seu tempo: em 30 segundos eu te ` +
    `digo por que liguei, e se não fizer sentido a gente encerra na hora.`;

  const descoberta = [
    `Hoje, como vocês resolvem ${v.oQueVende}? É interno ou terceirizado?`,
    `O que mais te incomoda nesse processo hoje?`,
    "Quem além de você participa dessa decisão?",
    ...(nivel2
      ? [
          "Isso é uma prioridade para agora ou para os próximos meses?",
          "Já existe verba prevista para resolver isso, ou ainda é uma conversa aberta?",
        ]
      : []),
  ];

  const argumentos = [
    `${capitalizar(v.argumentoChave)}.`,
    `A dor mais comum nesse segmento é ${v.dorTipica} — e é justamente o que a gente ataca primeiro.`,
    ...(nivel2
      ? [`Nosso foco combina com o que você busca: ${OBJETIVO_TEXTO[respostas.objetivo]}.`]
      : []),
  ];

  const objecoes = [
    {
      objecao: "Está caro.",
      resposta:
        "Entendo. Só pra eu comparar direito: caro em relação a quê? Se for ao custo de continuar como está hoje, vale a gente colocar os dois lados no papel.",
    },
    {
      objecao: "Vou pensar / me manda por e-mail.",
      resposta:
        "Claro, mando sim. Só pra eu mandar a coisa certa: o que exatamente você quer avaliar com mais calma? Assim eu mando só isso, e não um catálogo inteiro.",
    },
    ...(nivel2
      ? [
          {
            objecao: "Já tenho fornecedor.",
            resposta:
              "Ótimo, isso até facilita — significa que você já sabe o que é bom e o que incomoda. O que o atual faz muito bem, e o que você gostaria que fosse diferente?",
          },
        ]
      : []),
    ...(nivel3
      ? [
          {
            objecao: "Agora não é o momento.",
            resposta:
              "Justo. Só pra eu não te procurar na hora errada de novo: o que precisaria acontecer aí pra virar o momento certo?",
          },
        ]
      : []),
  ];

  const fechamento = nivel2
    ? "Pelo que você me contou, faz sentido a gente marcar 20 minutos pra eu te mostrar como ficaria no seu caso. Terça de manhã ou quinta à tarde funciona melhor?"
    : "Faz sentido a gente conversar com mais calma? Consigo te mostrar como funciona na prática.";

  const cadencia: string[] = [];
  if (nivel2) {
    cadencia.push(
      "Dia 1 — Primeiro contato (WhatsApp ou ligação). Objetivo: agendar, não vender.",
      "Dia 3 — Follow-up com material curto e específico do que ele pediu.",
      "Dia 7 — Segundo follow-up com um caso parecido da região.",
      "Dia 14 — Última tentativa da rodada: pergunta direta se faz sentido seguir.",
    );
  }
  if (nivel3) {
    cadencia.push(
      "Dia 45 — Reativação leve (conteúdo útil, sem pedir nada).",
      `Gatilho de retomada: quando o gargalo dele (${GARGALO_TEXTO[respostas.gargalo]}) aparecer numa conversa.`,
    );
  }

  return {
    titulo: `Script Comercial — ${perfil.nomeNegocio}`,
    abertura,
    descoberta,
    argumentos,
    objecoes,
    fechamento,
    cadencia,
  };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
