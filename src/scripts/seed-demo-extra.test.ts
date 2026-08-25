import { describe, it } from "vitest";
import { getRepository, type GameRepository } from "@/lib/db";
import { calcular } from "@/features/onboarding/scoring";
import { POLITICA_PRIVACIDADE_VERSAO } from "@/features/auth/politica";
import { cargoPorId, GANHO_ATRIBUTO_CONTRATACAO } from "@/features/equipe-ia/catalogo";
import type { Negocio, Respostas } from "@/lib/db/types";

/**
 * Extensão do seed de demo (GH-PITCH-01) — pedida pelo usuário em 2026-08-25
 * pra apresentação do mesmo dia: preenche mais meio quarteirão de vizinhos
 * (6 negócios novos, além dos 6 originais de `seed-demo.test.ts`) e dá a
 * TODOS os 12 (novos + originais) uma ficha de onboarding real — sem isso
 * o document-engine (Canvas, SWOT, Proposta Comercial etc.) gera documentos
 * pobres, porque `construirFichaMarkdown` só inclui a seção "Diagnóstico de
 * onboarding" quando existe uma linha em `onboardings`.
 *
 * Reusa `calcular()` (o mesmo motor de scoring que a Server Action
 * `cadastrar()` chama de verdade) para que score_fit/degrau_alvo/serviços
 * recomendados dos novos negócios sejam consistentes com o resto do jogo —
 * nunca dado inventado à mão.
 *
 *   SEED_EXTRA=1 npx vitest run src/scripts/seed-demo-extra.test.ts
 */

const CIDADE = { slug: "mendes", nome: "Mendes" };
const BAIRRO = "Centro";

interface PerfilNovo {
  nome: string;
  respostas: Omit<Respostas, "nomeNegocio" | "cidade" | "bairro">;
}

const NOVOS: PerfilNovo[] = [
  {
    nome: "Amora Doces & Bolos",
    respostas: {
      segmento: "alimentacao",
      problemaPrincipal: "Encomendas de bolos e doces para festas e empresas na região.",
      equipe: "2-5",
      presencaDigital: "social",
      captacao: ["indicacao", "social"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "venda-produto",
      ticketMedio: "500-2000",
      clientesPagantes: "6-20",
      faturamentoFaixa: "10-30k",
      diferencial: "Receitas próprias sem conservantes, entrega no mesmo dia.",
      provaSocial: "Fornece doces para 3 buffets de festas em Mendes.",
      concorrentesConhecidos: "Padarias locais, mas nenhuma foca em encomenda personalizada.",
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "500-1500",
    },
  },
  {
    nome: "ConstruFácil Materiais",
    respostas: {
      segmento: "comercio",
      problemaPrincipal: "Venda de material de construção com entrega rápida para obras pequenas e médias.",
      equipe: "6-15",
      presencaDigital: "site-desatualizado",
      captacao: ["indicacao", "porta-a-porta"],
      licitacaoPublico: "ja-vendeu",
      modeloReceita: "venda-produto",
      ticketMedio: "2000-10000",
      clientesPagantes: "21-50",
      faturamentoFaixa: "100-300k",
      diferencial: "Estoque próprio grande, entrega em até 24h na região.",
      provaSocial: "Fornecedor de 2 construtoras locais há mais de 3 anos.",
      concorrentesConhecidos: "Duas outras lojas de material na cidade, preço mais alto.",
      objetivo: "vender-mais",
      gargalo: "imagem-fraca",
      investimento: "1500-3500",
    },
  },
  {
    nome: "Pixel Studio Design",
    respostas: {
      segmento: "servico",
      problemaPrincipal: "Identidade visual e social media para pequenos negócios locais.",
      equipe: "so-eu",
      presencaDigital: "social",
      captacao: ["social", "indicacao"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "projeto-unico",
      ticketMedio: "500-2000",
      clientesPagantes: "1-5",
      faturamentoFaixa: "ate-10k",
      diferencial: "Entrega rápida (até 5 dias) e preço acessível para MEI.",
      provaSocial: "Ainda não tenho — comecei há 4 meses.",
      concorrentesConhecidos: "Freelancers de outras cidades, sem presença local.",
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "ate-500",
    },
  },
  {
    nome: "AgroVale Insumos",
    respostas: {
      segmento: "comercio",
      problemaPrincipal: "Insumos agrícolas e ferramentas para produtores rurais do Vale do Café.",
      equipe: "2-5",
      presencaDigital: "nada",
      captacao: ["indicacao", "porta-a-porta"],
      licitacaoPublico: "tem-interesse",
      modeloReceita: "venda-produto",
      ticketMedio: "500-2000",
      clientesPagantes: "21-50",
      faturamentoFaixa: "30-100k",
      diferencial: "Único fornecedor de insumos a menos de 20km de vários sítios da região.",
      provaSocial: "Atende produtores rurais há mais de 8 anos, boca a boca.",
      concorrentesConhecidos: "Só em cidades vizinhas, mais longe.",
      objetivo: "aparecer",
      gargalo: "sem-dados",
      investimento: "nao-sei",
    },
  },
  {
    nome: "ClinExpress Fisioterapia",
    respostas: {
      segmento: "saude",
      problemaPrincipal: "Fisioterapia e reabilitação com horário flexível para quem trabalha o dia todo.",
      equipe: "2-5",
      presencaDigital: "portais",
      captacao: ["portais", "indicacao"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "assinatura-recorrente",
      ticketMedio: "500-2000",
      clientesPagantes: "21-50",
      faturamentoFaixa: "30-100k",
      diferencial: "Atendimento até às 21h e pacote mensal com desconto.",
      provaSocial: "Convênio informal com 2 academias da região.",
      concorrentesConhecidos: "Clínicas maiores no centro, preço mais alto.",
      objetivo: "organizar",
      gargalo: "sem-processo",
      investimento: "500-1500",
    },
  },
  {
    nome: "Estrutura Firme Engenharia",
    respostas: {
      segmento: "engenharia",
      problemaPrincipal: "Projetos estruturais e laudos técnicos para reformas e pequenas construções.",
      equipe: "so-eu",
      presencaDigital: "site-desatualizado",
      captacao: ["indicacao"],
      licitacaoPublico: "tem-interesse",
      modeloReceita: "projeto-unico",
      ticketMedio: "2000-10000",
      clientesPagantes: "6-20",
      faturamentoFaixa: "10-30k",
      diferencial: "Engenheiro com 12 anos de experiência em obras públicas antes de abrir o próprio negócio.",
      provaSocial: "3 laudos entregues para a prefeitura de Mendes em 2025.",
      concorrentesConhecidos: "Poucos engenheiros autônomos na região com foco em licitação.",
      objetivo: "mais-leads",
      gargalo: "imagem-fraca",
      investimento: "ate-500",
    },
  },
];

/** Onboarding retroativo pros 6 negócios originais (`seed-demo.test.ts`) —
 *  mesmos nomes/segmentos, resposta plausível pro perfil que cada um já tem
 *  (ver comentário de cada `PerfilSeed` no seed original). Não mexe em
 *  XP/atributos/degrau já semeados — só adiciona a ficha de onboarding. */
const ORIGINAIS: PerfilNovo[] = [
  {
    nome: "Radiz Engenharia",
    respostas: {
      segmento: "engenharia",
      problemaPrincipal: "Projetos estruturais e ART para obras que precisam de licitação pública.",
      equipe: "6-15",
      presencaDigital: "site-portais",
      captacao: ["indicacao", "portais"],
      licitacaoPublico: "vende-regularmente",
      modeloReceita: "projeto-unico",
      ticketMedio: "10000-50000",
      clientesPagantes: "6-20",
      faturamentoFaixa: "100-300k",
      diferencial: "Único escritório da região com equipe própria de licitação pública.",
      provaSocial: "Venceu 4 editais municipais nos últimos 2 anos.",
      concorrentesConhecidos: "Escritórios de fora da região, sem presença local.",
      objetivo: "vender-mais",
      gargalo: "sem-dados",
      investimento: "3500+",
    },
  },
  {
    nome: "Contabilizy",
    respostas: {
      segmento: "contabilidade",
      problemaPrincipal: "Contabilidade e regularização fiscal para MEI e pequenas empresas locais.",
      equipe: "2-5",
      presencaDigital: "site-desatualizado",
      captacao: ["indicacao"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "assinatura-recorrente",
      ticketMedio: "500-2000",
      clientesPagantes: "21-50",
      faturamentoFaixa: "30-100k",
      diferencial: "Atendimento humano, sem call center — mesma pessoa do início ao fim.",
      provaSocial: "Atende mais de 40 MEIs na região há 5 anos.",
      concorrentesConhecidos: "Escritórios grandes de fora, atendimento mais frio.",
      objetivo: "automatizar",
      gargalo: "manual",
      investimento: "500-1500",
    },
  },
  {
    nome: "Vitalys Saúde",
    respostas: {
      segmento: "saude",
      problemaPrincipal: "Clínica multidisciplinar de saúde para famílias da região.",
      equipe: "6-15",
      presencaDigital: "portais",
      captacao: ["portais", "indicacao"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "combinacao",
      ticketMedio: "500-2000",
      clientesPagantes: "mais-50",
      faturamentoFaixa: "30-100k",
      diferencial: "Único ponto com 4 especialidades sob o mesmo teto na cidade.",
      provaSocial: "Mais de 500 atendimentos por mês.",
      concorrentesConhecidos: "Consultórios isolados, sem estrutura multidisciplinar.",
      objetivo: "organizar",
      gargalo: "sem-processo",
      investimento: "1500-3500",
    },
  },
  {
    nome: "TecNorte TI",
    respostas: {
      segmento: "tecnologia",
      problemaPrincipal: "Suporte de TI e infraestrutura para empresas que não têm equipe própria.",
      equipe: "6-15",
      presencaDigital: "site-portais",
      captacao: ["indicacao", "ads", "social"],
      licitacaoPublico: "ja-vendeu",
      modeloReceita: "assinatura-recorrente",
      ticketMedio: "2000-10000",
      clientesPagantes: "21-50",
      faturamentoFaixa: "100-300k",
      diferencial: "SLA de atendimento em até 2h, raro na região.",
      provaSocial: "Contrato ativo com 3 empresas de médio porte.",
      concorrentesConhecidos: "Freelancers avulsos, sem contrato de SLA.",
      objetivo: "vender-mais",
      gargalo: "sem-dados",
      investimento: "3500+",
    },
  },
  {
    nome: "Sabor & Cia Alimentos",
    respostas: {
      segmento: "alimentacao",
      problemaPrincipal: "Marmitas fitness e refeições prontas para entrega.",
      equipe: "so-eu",
      presencaDigital: "nada",
      captacao: ["indicacao"],
      licitacaoPublico: "nao-e-foco",
      modeloReceita: "venda-produto",
      ticketMedio: "ate-500",
      clientesPagantes: "1-5",
      faturamentoFaixa: "ate-10k",
      diferencial: "Cardápio fitness personalizado, poucos concorrentes diretos.",
      provaSocial: "Ainda não tenho — negócio recém-aberto.",
      concorrentesConhecidos: "Não sei.",
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "nao-sei",
    },
  },
  {
    nome: "Mercado Fiel",
    respostas: {
      segmento: "comercio",
      problemaPrincipal: "Mercearia de bairro com fornecimento para merenda escolar e órgãos públicos.",
      equipe: "6-15",
      presencaDigital: "social",
      captacao: ["indicacao", "porta-a-porta"],
      licitacaoPublico: "ja-vendeu",
      modeloReceita: "venda-produto",
      ticketMedio: "500-2000",
      clientesPagantes: "mais-50",
      faturamentoFaixa: "100-300k",
      diferencial: "Fornecedor cadastrado para merenda escolar há 2 anos.",
      provaSocial: "Contrato ativo com a prefeitura de Mendes.",
      concorrentesConhecidos: "Outros mercados locais, sem cadastro para licitação.",
      objetivo: "vender-mais",
      gargalo: "sem-dados",
      investimento: "500-1500",
    },
  },
];

async function contratarComRecompensa(
  repo: GameRepository,
  tenantId: string,
  cargoId: string,
): Promise<void> {
  const cargo = cargoPorId(cargoId);
  if (!cargo) throw new Error(`cargo desconhecido no seed: ${cargoId}`);
  await repo.contratarFuncionario(tenantId, cargoId);
  await repo.aplicarProgresso(tenantId, {
    xp: 260,
    moeda: 200,
    degraus: 1,
    atributos: { [cargo.eixoFortalecido]: GANHO_ATRIBUTO_CONTRATACAO },
  });
}

async function salvarOnboardingDe(repo: GameRepository, tenantId: string, perfil: PerfilNovo): Promise<void> {
  const respostasCompletas: Respostas = {
    ...perfil.respostas,
    nomeNegocio: perfil.nome,
    cidade: CIDADE.nome,
    bairro: BAIRRO,
  };
  const resultado = calcular(respostasCompletas);
  await repo.salvarOnboarding({
    tenantId,
    respostas: respostasCompletas,
    scoreFit: resultado.scoreFit,
    degrauAlvo: resultado.degrauAlvo,
    servicosRecomendados: resultado.servicosRecomendados,
    respondidoEm: new Date().toISOString(),
  });
}

async function semearExtra(): Promise<void> {
  const repo = getRepository();

  // 1) Onboarding retroativo pros 6 negócios originais.
  const todos = await repo.listarNegociosPublicos();
  for (const perfil of ORIGINAIS) {
    const negocio = todos.find((n) => n.nome === perfil.nome);
    if (!negocio) {
      console.log(`[seed-extra] aviso: original "${perfil.nome}" não encontrado, pulando onboarding retroativo`);
      continue;
    }
    await salvarOnboardingDe(repo, negocio.id, perfil);
    console.log(`[seed-extra] onboarding retroativo: ${perfil.nome} (${negocio.id})`);
  }

  // 2) 6 negócios novos, com onboarding completo desde o início.
  const criados: Negocio[] = [];
  for (const perfil of NOVOS) {
    const respostasCompletas: Respostas = {
      ...perfil.respostas,
      nomeNegocio: perfil.nome,
      cidade: CIDADE.nome,
      bairro: BAIRRO,
    };
    const resultado = calcular(respostasCompletas);

    const negocio = await repo.criarNegocio({
      nome: perfil.nome,
      segmento: perfil.respostas.segmento,
      cidadeSlug: CIDADE.slug,
      cidadeNome: CIDADE.nome,
      bairroNome: BAIRRO,
      degrauAlvo: resultado.degrauAlvo,
      xpInicial: resultado.xpInicial,
      moedaVirtual: 300 + resultado.xpInicial,
      atributosIniciais: resultado.atributosIniciais,
      perfilPublico: true,
      consentimentoVersao: POLITICA_PRIVACIDADE_VERSAO,
    });
    criados.push(negocio);
    await salvarOnboardingDe(repo, negocio.id, perfil);
    console.log(`[seed-extra] negócio criado: ${negocio.nome} (${negocio.id})`);
  }

  const porNome = (nome: string) => criados.find((n) => n.nome === nome)!;

  // Alguns toques de "vida real" pra não ficar tudo no zero-a-zero.
  await contratarComRecompensa(repo, porNome("Amora Doces & Bolos").id, "social-media");
  await repo.criarOferta({
    tenantId: porNome("Amora Doces & Bolos").id,
    titulo: "Bolos e doces personalizados para festas",
    descricao: "Encomendas com até 48h de antecedência, entrega em Mendes e região.",
    preco: "a partir de R$ 80",
    criadaEm: new Date().toISOString(),
  });

  await contratarComRecompensa(repo, porNome("ConstruFácil Materiais").id, "documentador");

  await repo.criarOferta({
    tenantId: porNome("ClinExpress Fisioterapia").id,
    titulo: "Pacote mensal de fisioterapia",
    descricao: "4 sessões por mês, horário flexível até às 21h.",
    preco: "R$ 320/mês",
    criadaEm: new Date().toISOString(),
  });

  console.log(
    `[seed-extra] pronto — ${criados.length} negócios novos + onboarding em ${criados.length + ORIGINAIS.length - criados.length} originais atualizados.`,
  );
}

describe("seed extra de demo (pedido 2026-08-25)", () => {
  it("adiciona mais meio quarteirão de negócios + onboarding real em todos", async () => {
    if (!process.env.SEED_EXTRA) return;
    await semearExtra();
  });
});
