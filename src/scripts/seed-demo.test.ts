import { describe, it } from "vitest";
import { getRepository, type GameRepository } from "@/lib/db";
import { getAuthProvider } from "@/lib/auth";
import { atributosVazios, aplicarGanhos } from "@/lib/atributos";
import { POLITICA_PRIVACIDADE_VERSAO } from "@/features/auth/politica";
import { cargoPorId, GANHO_ATRIBUTO_CONTRATACAO } from "@/features/equipe-ia/catalogo";
import type { Atributos, Negocio, Segmento } from "@/lib/db/types";
import type { AtributoChave } from "@tokens";

/**
 * Seed de demo para o pitch Sebrae (GH-PITCH-01) — NÃO é um teste, é um
 * script disfarçado de teste vitest pra reusar o alias `@/` e o path
 * resolution já configurados em `vitest.config.ts`, sem precisar instalar
 * `tsx`/`ts-node` só pra isto (o repositório não usa nenhum dos dois hoje).
 *
 * No-op em `npm test` normal (early return sem `SEED_DEMO=1`) — só semeia
 * de verdade quando chamado explicitamente:
 *
 *   SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts
 *
 * Usa `GAMEHUB_DB=file` implicitamente (`getRepository()` lê a env var; sem
 * ela, cai em file por padrão — ver `src/lib/db/index.ts`). Roda direto
 * contra `GameRepository`, não contra as Server Actions — as Actions
 * dependem de `headers()`/`cookies()`/`redirect()` do Next.js (contexto de
 * requisição HTTP que não existe aqui); o repositório é puro I/O, sem essa
 * dependência.
 *
 * Os 6 negócios reusam os mesmos nomes fictícios já usados como decoração
 * em `HubScreen.tsx` (`rooms`) — mesma "vitrine" em todo o app, não um
 * elenco paralelo. 5 deles não têm conta de login (são vizinhos/contexto
 * do mapa, não personagens jogáveis) — o roteiro de demo faz o cadastro
 * REAL, ao vivo, como uma conta nova; estes só povoam o bairro para o mapa
 * não parecer vazio e para a Árvore/Parcerias terem vizinho de verdade.
 * A exceção é a Radiz Engenharia (o "herói" da demo, ver
 * `docs/pitch/ROTEIRO-DEMO.md`): ganha conta de login própria para o
 * apresentador poder logar direto nela e mostrar o painel já rico
 * (conquistas, sede evoluída, equipe) sem precisar montar esse estado ao
 * vivo — credenciais fixas, documentadas no roteiro, nunca usadas em
 * produção com dado real.
 */

const CREDENCIAL_DEMO = {
  email: "radiz@demo.labdatadev.local",
  senha: "SebraeDemo2026!",
};

function atributos(vals: Partial<Record<AtributoChave, number>>): Atributos {
  return aplicarGanhos(atributosVazios(), vals);
}

interface PerfilSeed {
  nome: string;
  segmento: Segmento;
  degrauAlvo: number;
  xpInicial: number;
  moedaVirtual: number;
  atributosIniciais: Atributos;
}

const NEGOCIOS_SEED: PerfilSeed[] = [
  {
    nome: "Radiz Engenharia",
    segmento: "engenharia",
    degrauAlvo: 4,
    xpInicial: 900,
    moedaVirtual: 2200,
    atributosIniciais: atributos({ tecnologia: 14, processo: 12, presenca: 8, aquisicao: 10, capacidade: 10 }),
  },
  {
    nome: "Contabilizy",
    segmento: "contabilidade",
    degrauAlvo: 3,
    xpInicial: 320,
    moedaVirtual: 900,
    atributosIniciais: atributos({ tecnologia: 8, processo: 10, presenca: 6, aquisicao: 6, capacidade: 8 }),
  },
  {
    nome: "Vitalys Saúde",
    segmento: "saude",
    degrauAlvo: 3,
    xpInicial: 260,
    moedaVirtual: 750,
    atributosIniciais: atributos({ tecnologia: 6, processo: 8, presenca: 10, aquisicao: 8, capacidade: 6 }),
  },
  {
    nome: "TecNorte TI",
    segmento: "tecnologia",
    degrauAlvo: 5,
    xpInicial: 1800,
    moedaVirtual: 4200,
    atributosIniciais: atributos({ tecnologia: 24, processo: 18, presenca: 16, aquisicao: 14, capacidade: 16 }),
  },
  {
    nome: "Sabor & Cia Alimentos",
    segmento: "alimentacao",
    degrauAlvo: 2,
    xpInicial: 40,
    moedaVirtual: 500,
    atributosIniciais: atributos({ tecnologia: 2, processo: 3, presenca: 4, aquisicao: 2, capacidade: 3 }),
  },
  {
    nome: "Mercado Fiel",
    segmento: "comercio",
    degrauAlvo: 3,
    xpInicial: 280,
    moedaVirtual: 820,
    atributosIniciais: atributos({ tecnologia: 6, processo: 6, presenca: 9, aquisicao: 10, capacidade: 5 }),
  },
];

const CIDADE = { slug: "mendes", nome: "Mendes" };
const BAIRRO = "Centro";

/**
 * Contrata E aplica a mesma recompensa que `recompensar("funcionario_ia_contratado", cargoId)`
 * aplicaria pela UI (`features/gamificacao/actions.ts`) — chamar só
 * `repo.contratarFuncionario` (como uma primeira versão deste script fazia)
 * deixa o negócio com equipe contratada mas sem o XP/moeda/degrau/atributo
 * que a contratação real sempre concede, o que é inconsistente com o resto
 * do estado semeado.
 */
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

async function semear(): Promise<void> {
  const repo = getRepository();
  const criados: Negocio[] = [];

  for (const perfil of NEGOCIOS_SEED) {
    const negocio = await repo.criarNegocio({
      nome: perfil.nome,
      segmento: perfil.segmento,
      cidadeSlug: CIDADE.slug,
      cidadeNome: CIDADE.nome,
      bairroNome: BAIRRO,
      degrauAlvo: perfil.degrauAlvo,
      xpInicial: perfil.xpInicial,
      moedaVirtual: perfil.moedaVirtual,
      atributosIniciais: perfil.atributosIniciais,
      perfilPublico: true,
      consentimentoVersao: POLITICA_PRIVACIDADE_VERSAO,
    });
    criados.push(negocio);
    console.log(`[seed] negócio criado: ${negocio.nome} (${negocio.id})`);
  }

  const porNome = (nome: string) => criados.find((n) => n.nome === nome)!;

  // Radiz (hero da demo): 3 dos 4 cargos de IA — ordem importa, cada
  // contratação sobe 1 degrau (funcionario_ia_contratado tem subeDegrau:true)
  // e "comercial" exige degrauMinimo 3, por isso vem por último (só alcança
  // o requisito depois das duas primeiras contratações, igual aconteceria
  // pela UI real — o repositório sozinho não checa esse gate, quem checa é
  // o dispatcher; a ordem aqui já respeita o que ele exigiria).
  const radiz = porNome("Radiz Engenharia");
  await contratarComRecompensa(repo, radiz.id, "documentador");
  await contratarComRecompensa(repo, radiz.id, "social-media");
  await contratarComRecompensa(repo, radiz.id, "comercial");
  await repo.lerSede(radiz.id); // garante a sede nível 1 antes de evoluir
  await repo.evoluirSede(radiz.id, 1, 2, 1500, 150);
  await repo.concluirLicao(radiz.id, "por-que-diagnostico", 40, { processo: 1 });
  await repo.criarOferta({
    tenantId: radiz.id,
    titulo: "Projeto estrutural para licitação pública",
    descricao: "Levantamento, memorial de cálculo e ART prontos para edital.",
    preco: "sob consulta",
    criadaEm: new Date().toISOString(),
  });

  // Conta de login só para a Radiz (a "herói" da demo) — ver comentário no
  // topo do arquivo. As outras 5 ficam sem conta, de propósito.
  const auth = getAuthProvider();
  if (!(await auth.emailExiste(CREDENCIAL_DEMO.email))) {
    const identidade = await auth.registrar(
      "Demo Radiz",
      CREDENCIAL_DEMO.email,
      CREDENCIAL_DEMO.senha,
    );
    await repo.vincularMembro({
      id: identidade.usuarioId,
      tenantId: radiz.id,
      nome: "Demo Radiz",
      email: CREDENCIAL_DEMO.email,
      papel: "dono",
      criadoEm: new Date().toISOString(),
    });
    console.log(`[seed] login de demo: ${CREDENCIAL_DEMO.email} / ${CREDENCIAL_DEMO.senha}`);
  }

  // Contabilizy: 1 funcionário de IA
  const contabilizy = porNome("Contabilizy");
  await contratarComRecompensa(repo, contabilizy.id, "documentador");

  // Vitalys: parceria formada com a Radiz (mesmo quarteirão, garantido pela
  // ordem de criação sequencial acima — mesmo bairro, lotes consecutivos)
  const vitalys = porNome("Vitalys Saúde");
  await repo.formarParceria(radiz.id, vitalys.id, 150, 120, { aquisicao: 2 });

  // TecNorte: o mais evoluído — desbloqueia nós da árvore
  const tecnorte = porNome("TecNorte TI");
  await repo.desbloquearNo(tecnorte.id, "web", 300, 30, { tecnologia: 1 });
  await repo.desbloquearNo(tecnorte.id, "automacao", 500, 30, { processo: 1 });

  // Mercado Fiel: publica uma oferta (aparece na vitrine pública)
  const mercadoFiel = porNome("Mercado Fiel");
  await repo.criarOferta({
    tenantId: mercadoFiel.id,
    titulo: "Fornecimento de material de limpeza e higiene",
    descricao: "Atende contratos de merenda escolar e órgãos públicos.",
    preco: "sob consulta",
    criadaEm: new Date().toISOString(),
  });

  console.log(
    `[seed] pronto — ${criados.length} negócios em ${BAIRRO}, ${CIDADE.nome}. ` +
      "Sabor & Cia Alimentos fica deliberadamente cru (negócio recém-cadastrado).",
  );
}

describe("seed de demo (GH-PITCH-01)", () => {
  it("semeia o bairro de demonstração quando SEED_DEMO=1", async () => {
    if (!process.env.SEED_DEMO) return;
    await semear();
  });
});
