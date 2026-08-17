import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { CIDADES_REGIAO } from "@/lib/regiao";
import { nivelPorXp, NIVEL_MAX } from "@/lib/gamificacao";
import { aplicarGanhos, atributosFaltantes } from "@/lib/atributos";
import { alocacoesAtivasEm, disponibilidadeDe } from "@/lib/disponibilidade";
import { eventoAtivoEm } from "@/lib/eventos-globais";
import type { AtributoChave } from "@tokens";
import type { DeltaProgresso, GameRepository, NovaSolicitacao, NovoNegocio } from "./repository";
import type {
  Alocacao,
  Bairro,
  BairroResumo,
  BenchmarkBairro,
  CapituloEntregue,
  Cidade,
  ClienteAdmin,
  ConviteResgatado,
  DestaqueBairro,
  Endereco,
  EscopoMapa,
  EventoGlobal,
  FuncionarioContratado,
  ItemMobiliaColocado,
  LicaoConcluida,
  Mapa,
  MapaResumo,
  MapaView,
  Negocio,
  NegocioResumo,
  NoDesbloqueado,
  Oferta,
  Onboarding,
  ParceriaFormada,
  ProgressoEventoGlobal,
  Quarteirao,
  Sede,
  SolicitacaoContato,
  SolicitacaoServico,
  TrabalhoAceito,
  Usuario,
} from "./types";

/**
 * Persistência em arquivos JSON (protótipo). Mesma semântica do Postgres:
 * geografia global + dados isolados por tenant (aqui, uma pasta por tenant).
 */

const ROOT = path.join(process.cwd(), "data");
const MAPA = path.join(ROOT, "geografia", "mapa.json");
const INDEX_MEMBROS = path.join(ROOT, "index", "membros.json");
/** Global (não por tenant) — mesmo "cartaz" para todo mundo, ver MAPA acima. */
const EVENTOS_GLOBAIS = path.join(ROOT, "eventos-globais.json");
/** Global também: o painel admin (labdatadev) precisa ler TODAS as
 *  solicitações de todos os tenants; um arquivo único é o que torna o
 *  "listar tudo" trivial no modo file (dev/demo, escritor único). */
const SOLICITACOES = path.join(ROOT, "solicitacoes-servico.json");
export const LOTES_POR_QUARTEIRAO = 8;

/** Cidades do ICP primário — fonte única em lib/regiao.ts (espelhada em
 *  supabase/seed.sql, que roda noutro runtime). */
const CIDADES_BASE = CIDADES_REGIAO;

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function lerJson<T>(arquivo: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(arquivo, "utf8")) as T;
  } catch {
    return padrao;
  }
}

async function escreverJson(arquivo: string, dados: unknown): Promise<void> {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  await fs.writeFile(arquivo, JSON.stringify(dados, null, 2), "utf8");
}

function tenantDir(tenantId: string): string {
  return path.join(ROOT, "tenants", tenantId);
}

function mapaInicial(): Mapa {
  return {
    cidades: CIDADES_BASE.map((c) => ({
      slug: slugify(c.nome),
      nome: c.nome,
      prioritaria: c.prioritaria,
      bairros: [],
    })),
  };
}

function novoQuarteirao(indice: number): Quarteirao {
  return {
    id: `q${indice}`,
    nome: `Quarteirão ${indice}`,
    lotes: Array.from({ length: LOTES_POR_QUARTEIRAO }, (_, i) => ({
      numero: i + 1,
      tenantId: null,
    })),
  };
}

/** Formato persistido de `FuncionarioContratado` — sem `disponibilidade`,
 *  que é sempre derivada na leitura (ver `enriquecerDisponibilidade`). */
type FuncionarioArmazenado = Omit<FuncionarioContratado, "disponibilidade">;

export class FileRepository implements GameRepository {
  async pingDb(): Promise<boolean> {
    // Adapter de arquivo não tem banco a pingar — se o processo Node está de
    // pé, o "banco" (JSON em disco) está acessível. Sempre saudável.
    return true;
  }

  async lerMapa(): Promise<Mapa> {
    return lerJson<Mapa>(MAPA, mapaInicial());
  }

  async lerMapaView(escopo?: EscopoMapa): Promise<MapaView> {
    const mapa = await this.lerMapa();

    // coleta todos os tenants ocupantes e lê os resumos em paralelo (sem N+1 serial)
    const ids = new Set<string>();
    for (const c of mapa.cidades)
      for (const b of c.bairros)
        for (const q of b.quarteiroes)
          for (const l of q.lotes) if (l.tenantId) ids.add(l.tenantId);

    const negocios = await Promise.all(
      [...ids].map((id) => this.lerNegocio(id)),
    );
    const resumo = new Map<string, NegocioResumo>();
    for (const n of negocios) {
      if (n)
        resumo.set(n.id, {
          id: n.id,
          nome: n.nome,
          segmento: n.segmento,
          nivel: n.nivel,
          degrauAtual: n.degrauAtual,
        });
    }

    return {
      cidades: mapa.cidades.map((c) => ({
        slug: c.slug,
        nome: c.nome,
        prioritaria: c.prioritaria,
        bairros: c.bairros.map((b) => ({
          slug: b.slug,
          nome: b.nome,
          // escopo (GH-MAPA-01): fora do bairro pedido, não populamos
          // quarteirões — o shape inteiro do mundo continua no retorno, só
          // o conteúdo pesado (lotes/negócios) é que fica de fora.
          quarteiroes:
            escopo && (c.slug !== escopo.cidadeSlug || b.slug !== escopo.bairroSlug)
              ? []
              : b.quarteiroes.map((q) => ({
                  id: q.id,
                  nome: q.nome,
                  lotes: q.lotes.map((l) => ({
                    numero: l.numero,
                    negocio: l.tenantId ? (resumo.get(l.tenantId) ?? null) : null,
                  })),
                })),
        })),
      })),
    };
  }

  async lerMapaResumo(): Promise<MapaResumo> {
    const mapa = await this.lerMapa();
    return {
      cidades: mapa.cidades.map((c) => ({
        slug: c.slug,
        nome: c.nome,
        totalBairros: c.bairros.length,
        totalNegocios: c.bairros.reduce(
          (total, b) =>
            total +
            b.quarteiroes.reduce(
              (subtotal, q) => subtotal + q.lotes.filter((l) => l.tenantId !== null).length,
              0,
            ),
          0,
        ),
      })),
    };
  }

  async lerBairroResumo(cidadeSlug: string): Promise<BairroResumo[]> {
    const mapa = await this.lerMapa();
    const cidade = mapa.cidades.find((c) => c.slug === cidadeSlug);
    if (!cidade) return [];
    return cidade.bairros.map((b) => ({
      slug: b.slug,
      nome: b.nome,
      totalNegocios: b.quarteiroes.reduce(
        (total, q) => total + q.lotes.filter((l) => l.tenantId !== null).length,
        0,
      ),
    }));
  }

  async lerBenchmarkBairro(cidadeSlug: string, bairroSlug: string): Promise<BenchmarkBairro> {
    const mapa = await this.lerMapa();
    const bairro = mapa.cidades
      .find((c) => c.slug === cidadeSlug)
      ?.bairros.find((b) => b.slug === bairroSlug);
    const vazio: BenchmarkBairro = {
      totalNegocios: 0,
      medias: { tecnologia: 0, processo: 0, presenca: 0, aquisicao: 0, capacidade: 0 },
    };
    if (!bairro) return vazio;

    const ids = bairro.quarteiroes.flatMap((q) =>
      q.lotes.map((l) => l.tenantId).filter((id): id is string => id !== null),
    );
    if (ids.length === 0) return vazio;

    const negocios = (await Promise.all(ids.map((id) => this.lerNegocio(id)))).filter(
      (n): n is Negocio => n !== null,
    );
    if (negocios.length === 0) return vazio;

    const somar = (chave: AtributoChave) =>
      negocios.reduce((soma, n) => soma + n.atributos[chave].valor, 0) / negocios.length;

    return {
      totalNegocios: negocios.length,
      medias: {
        tecnologia: somar("tecnologia"),
        processo: somar("processo"),
        presenca: somar("presenca"),
        aquisicao: somar("aquisicao"),
        capacidade: somar("capacidade"),
      },
    };
  }

  async lerDestaqueBairro(
    cidadeSlug: string,
    bairroSlug: string,
    diasJanela: number,
  ): Promise<DestaqueBairro | null> {
    const mapa = await this.lerMapa();
    const bairro = mapa.cidades
      .find((c) => c.slug === cidadeSlug)
      ?.bairros.find((b) => b.slug === bairroSlug);
    if (!bairro) return null;

    const ids = bairro.quarteiroes.flatMap((q) =>
      q.lotes.map((l) => l.tenantId).filter((id): id is string => id !== null),
    );
    if (ids.length === 0) return null;

    const desde = new Date(Date.now() - diasJanela * 86_400_000).toISOString();
    let melhor: DestaqueBairro | null = null;

    for (const id of ids) {
      const negocio = await this.lerNegocio(id);
      if (!negocio || !negocio.perfilPublico) continue;

      const [licoes, parcerias, nos, funcionarios] = await Promise.all([
        this.listarLicoesConcluidas(id),
        this.listarParceriasFormadas(id),
        this.listarNosDesbloqueados(id),
        this.listarFuncionarios(id),
      ]);
      const eventosRecentes =
        licoes.filter((l) => l.concluidaEm >= desde).length +
        parcerias.filter((p) => p.formadaEm >= desde).length +
        nos.filter((n) => n.desbloqueadoEm >= desde).length +
        funcionarios.filter((f) => f.contratadoEm >= desde).length;

      if (eventosRecentes > 0 && (!melhor || eventosRecentes > melhor.eventosRecentes)) {
        melhor = { tenantId: id, nome: negocio.nome, segmento: negocio.segmento, eventosRecentes };
      }
    }
    return melhor;
  }

  /** Aloca o primeiro lote livre e grava o mapa. Single-process: sem corrida. */
  private async alocarLote(
    cidadeSlug: string,
    cidadeNome: string,
    bairroNome: string,
    tenantId: string,
  ): Promise<Endereco> {
    const mapa = await this.lerMapa();

    let cidade: Cidade | undefined = mapa.cidades.find(
      (c) => c.slug === cidadeSlug,
    );
    if (!cidade) {
      cidade = {
        slug: cidadeSlug,
        nome: cidadeNome,
        prioritaria: false,
        bairros: [],
      };
      mapa.cidades.push(cidade);
    }

    const bairroSlug = slugify(bairroNome) || "centro";
    let bairro: Bairro | undefined = cidade.bairros.find(
      (b) => b.slug === bairroSlug,
    );
    if (!bairro) {
      bairro = { slug: bairroSlug, nome: bairroNome, quarteiroes: [] };
      cidade.bairros.push(bairro);
    }

    let alvo = bairro.quarteiroes.find((q) =>
      q.lotes.some((l) => l.tenantId === null),
    );
    if (!alvo) {
      alvo = novoQuarteirao(bairro.quarteiroes.length + 1);
      bairro.quarteiroes.push(alvo);
    }
    const lote = alvo.lotes.find((l) => l.tenantId === null);
    if (!lote) throw new Error("Quarteirão sem lote livre após expansão");
    lote.tenantId = tenantId;

    await escreverJson(MAPA, mapa);
    return {
      cidadeSlug: cidade.slug,
      bairroSlug: bairro.slug,
      quarteiraoId: alvo.id,
      lote: lote.numero,
    };
  }

  async criarNegocio(dados: NovoNegocio): Promise<Negocio> {
    const id = randomBytes(12).toString("hex");
    const endereco = await this.alocarLote(
      dados.cidadeSlug,
      dados.cidadeNome,
      dados.bairroNome,
      id,
    );

    const negocio: Negocio = {
      id,
      nome: dados.nome,
      segmento: dados.segmento,
      endereco,
      criadoEm: new Date().toISOString(),
      degrauAtual: 1,
      degrauAlvo: dados.degrauAlvo,
      xp: dados.xpInicial,
      nivel: nivelPorXp(dados.xpInicial),
      moedaVirtual: dados.moedaVirtual,
      atributos: dados.atributosIniciais,
      perfilPublico: dados.perfilPublico,
      consentimentoEm: new Date().toISOString(),
      consentimentoVersao: dados.consentimentoVersao,
      cep: dados.cep,
    };
    await escreverJson(path.join(tenantDir(id), "negocio.json"), negocio);
    return negocio;
  }

  async lerNegocio(tenantId: string): Promise<Negocio | null> {
    return lerJson<Negocio | null>(
      path.join(tenantDir(tenantId), "negocio.json"),
      null,
    );
  }

  async excluirNegocio(tenantId: string): Promise<void> {
    const mapa = await this.lerMapa();
    for (const cidade of mapa.cidades) {
      for (const bairro of cidade.bairros) {
        for (const quarteirao of bairro.quarteiroes) {
          for (const lote of quarteirao.lotes) {
            if (lote.tenantId === tenantId) lote.tenantId = null;
          }
        }
      }
    }
    await escreverJson(MAPA, mapa);
    await fs.rm(tenantDir(tenantId), { recursive: true, force: true });
  }

  async listarNegociosPublicos(): Promise<Negocio[]> {
    const raiz = path.join(ROOT, "tenants");
    let pastas: string[];
    try {
      pastas = await fs.readdir(raiz);
    } catch {
      return [];
    }
    const negocios = await Promise.all(pastas.map((id) => this.lerNegocio(id)));
    return negocios.filter((n): n is Negocio => n !== null && n.perfilPublico);
  }

  async vincularMembro(usuario: Usuario): Promise<void> {
    await escreverJson(
      path.join(tenantDir(usuario.tenantId), "membros", `${usuario.id}.json`),
      usuario,
    );
    const indice = await lerJson<Record<string, string>>(INDEX_MEMBROS, {});
    indice[usuario.id] = usuario.tenantId;
    await escreverJson(INDEX_MEMBROS, indice);
  }

  async lerMembroPorUsuario(usuarioId: string): Promise<Usuario | null> {
    const indice = await lerJson<Record<string, string>>(INDEX_MEMBROS, {});
    const tenantId = indice[usuarioId];
    if (!tenantId) return null;
    return lerJson<Usuario | null>(
      path.join(tenantDir(tenantId), "membros", `${usuarioId}.json`),
      null,
    );
  }

  async salvarOnboarding(onboarding: Onboarding): Promise<void> {
    await escreverJson(
      path.join(tenantDir(onboarding.tenantId), "onboarding.json"),
      onboarding,
    );
  }

  async lerOnboarding(tenantId: string): Promise<Onboarding | null> {
    return lerJson<Onboarding | null>(
      path.join(tenantDir(tenantId), "onboarding.json"),
      null,
    );
  }

  async listarOfertas(tenantId: string): Promise<Oferta[]> {
    return lerJson<Oferta[]>(path.join(tenantDir(tenantId), "ofertas.json"), []);
  }

  async criarOferta(oferta: Omit<Oferta, "id">): Promise<void> {
    const arquivo = path.join(tenantDir(oferta.tenantId), "ofertas.json");
    const atuais = await lerJson<Oferta[]>(arquivo, []);
    atuais.push({ ...oferta, id: randomBytes(8).toString("hex") });
    await escreverJson(arquivo, atuais);
  }

  async listarLicoesConcluidas(tenantId: string): Promise<LicaoConcluida[]> {
    return lerJson<LicaoConcluida[]>(
      path.join(tenantDir(tenantId), "licoes.json"),
      [],
    );
  }

  async concluirLicao(
    tenantId: string,
    licaoId: string,
    xp: number,
    atributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<LicaoConcluida> {
    const arquivo = path.join(tenantDir(tenantId), "licoes.json");
    const atuais = await lerJson<LicaoConcluida[]>(arquivo, []);
    const existente = atuais.find((l) => l.licaoId === licaoId);
    if (existente) return existente;

    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    negocio.xp += xp;
    negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
    if (atributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, atributos);
    }

    const nova: LicaoConcluida = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      licaoId,
      concluidaEm: new Date().toISOString(),
    };
    atuais.push(nova);

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return nova;
  }

  async listarConvitesResgatados(tenantIdConvidante: string): Promise<ConviteResgatado[]> {
    return lerJson<ConviteResgatado[]>(
      path.join(tenantDir(tenantIdConvidante), "convites-enviados.json"),
      [],
    );
  }

  async resgatarConvite(
    tenantIdConvidante: string,
    tenantIdConvidado: string,
    xpConvidante: number,
    moedaConvidante: number,
    xpConvidado: number,
    moedaConvidado: number,
  ): Promise<ConviteResgatado> {
    // registro mora do lado do CONVIDANTE (é quem consulta o teto por
    // período); o convidado não precisa listar os próprios resgates.
    const arquivo = path.join(tenantDir(tenantIdConvidante), "convites-enviados.json");
    const atuais = await lerJson<ConviteResgatado[]>(arquivo, []);
    if (atuais.some((c) => c.tenantIdConvidado === tenantIdConvidado)) {
      throw new Error("convite_ja_resgatado");
    }

    if (xpConvidante !== 0 || moedaConvidante !== 0) {
      const convidante = await this.lerNegocio(tenantIdConvidante);
      if (convidante) {
        convidante.xp += xpConvidante;
        convidante.moedaVirtual += moedaConvidante;
        convidante.nivel = Math.min(NIVEL_MAX, nivelPorXp(convidante.xp));
        await escreverJson(
          path.join(tenantDir(tenantIdConvidante), "negocio.json"),
          convidante,
        );
      }
    }

    const convidado = await this.lerNegocio(tenantIdConvidado);
    if (convidado) {
      convidado.xp += xpConvidado;
      convidado.moedaVirtual += moedaConvidado;
      convidado.nivel = Math.min(NIVEL_MAX, nivelPorXp(convidado.xp));
      await escreverJson(path.join(tenantDir(tenantIdConvidado), "negocio.json"), convidado);
    }

    const resgate: ConviteResgatado = {
      id: randomBytes(8).toString("hex"),
      tenantIdConvidante,
      tenantIdConvidado,
      resgatadoEm: new Date().toISOString(),
    };
    atuais.push(resgate);
    await escreverJson(arquivo, atuais);
    return resgate;
  }

  async listarSolicitacoesContato(tenantId: string): Promise<SolicitacaoContato[]> {
    return lerJson<SolicitacaoContato[]>(
      path.join(tenantDir(tenantId), "contatos.json"),
      [],
    );
  }

  async criarSolicitacaoContato(
    input: Omit<SolicitacaoContato, "id" | "criadaEm">,
  ): Promise<SolicitacaoContato> {
    const arquivo = path.join(tenantDir(input.tenantId), "contatos.json");
    const atuais = await lerJson<SolicitacaoContato[]>(arquivo, []);
    const nova: SolicitacaoContato = {
      ...input,
      id: randomBytes(8).toString("hex"),
      criadaEm: new Date().toISOString(),
    };
    atuais.push(nova);
    await escreverJson(arquivo, atuais);
    return nova;
  }

  async listarVizinhos(tenantId: string): Promise<Negocio[]> {
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) return [];
    const mapa = await this.lerMapa();
    const { cidadeSlug, bairroSlug, quarteiraoId } = negocio.endereco;
    const quarteirao = mapa.cidades
      .find((c) => c.slug === cidadeSlug)
      ?.bairros.find((b) => b.slug === bairroSlug)
      ?.quarteiroes.find((q) => q.id === quarteiraoId);
    if (!quarteirao) return [];

    const ids = quarteirao.lotes
      .map((l) => l.tenantId)
      .filter((id): id is string => id !== null && id !== tenantId);

    const vizinhos = await Promise.all(ids.map((id) => this.lerNegocio(id)));
    return vizinhos.filter((n): n is Negocio => n !== null);
  }

  async aplicarProgresso(
    tenantId: string,
    delta: DeltaProgresso,
  ): Promise<Negocio> {
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);

    negocio.xp = Math.max(0, negocio.xp + delta.xp);
    negocio.moedaVirtual = Math.max(0, negocio.moedaVirtual + delta.moeda);
    negocio.degrauAtual = Math.max(
      1,
      Math.min(5, negocio.degrauAtual + delta.degraus),
    );
    negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
    if (delta.atributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, delta.atributos);
    }

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    return negocio;
  }

  async listarFuncionarios(tenantId: string): Promise<FuncionarioContratado[]> {
    const armazenados = await lerJson<FuncionarioArmazenado[]>(
      path.join(tenantDir(tenantId), "funcionarios.json"),
      [],
    );
    return this.enriquecerDisponibilidade(tenantId, armazenados);
  }

  async contratarFuncionario(
    tenantId: string,
    cargoId: string,
  ): Promise<FuncionarioContratado> {
    const arquivo = path.join(tenantDir(tenantId), "funcionarios.json");
    const atuais = await lerJson<FuncionarioArmazenado[]>(arquivo, []);
    const existente = atuais.find((f) => f.cargoId === cargoId);
    if (existente) {
      const [enriquecido] = await this.enriquecerDisponibilidade(tenantId, [existente]);
      return enriquecido;
    }

    const novo: FuncionarioArmazenado = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      cargoId,
      contratadoEm: new Date().toISOString(),
      nivel: 1,
    };
    atuais.push(novo);
    await escreverJson(arquivo, atuais);
    // contratação recém-criada nunca tem alocação — livre por construção
    return { ...novo, disponibilidade: { estado: "livre" } };
  }

  async evoluirFuncionario(
    tenantId: string,
    funcionarioId: string,
    novoNivel: number,
    custoMoeda: number,
  ): Promise<FuncionarioContratado> {
    const arquivo = path.join(tenantDir(tenantId), "funcionarios.json");
    const atuais = await lerJson<FuncionarioArmazenado[]>(arquivo, []);
    const alvo = atuais.find((f) => f.id === funcionarioId);
    if (!alvo) throw new Error("funcionario_nao_encontrado");
    if (novoNivel !== (alvo.nivel ?? 1) + 1) throw new Error("nivel_invalido");

    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    if (negocio.moedaVirtual < custoMoeda) throw new Error("saldo_insuficiente");

    negocio.moedaVirtual -= custoMoeda;
    alvo.nivel = novoNivel;

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    const [enriquecido] = await this.enriquecerDisponibilidade(tenantId, [alvo]);
    return enriquecido;
  }

  /** Enriquece o registro armazenado com `disponibilidade`, derivada das
   *  alocações ATIVAS — nunca persistida junto do funcionário (GH-EQP-01).
   *  `nivel` cai em 1 quando ausente: registros gravados antes de
   *  `0024_funcionario_nivel` não têm o campo. */
  private async enriquecerDisponibilidade(
    tenantId: string,
    funcionarios: FuncionarioArmazenado[],
  ): Promise<FuncionarioContratado[]> {
    const ativas = await this.listarAlocacoesAtivas(tenantId);
    return funcionarios.map((f) => ({
      ...f,
      nivel: f.nivel ?? 1,
      disponibilidade: disponibilidadeDe(ativas, f.id),
    }));
  }

  async listarAlocacoesAtivas(tenantId: string): Promise<Alocacao[]> {
    const todas = await lerJson<Alocacao[]>(
      path.join(tenantDir(tenantId), "alocacoes.json"),
      [],
    );
    // expiradas continuam no arquivo (última alocação daquele recurso) mas
    // não contam como "ocupado" — é o que dá a liberação automática sem cron
    return alocacoesAtivasEm(todas, new Date().toISOString());
  }

  async alocarFuncionario(
    tenantId: string,
    funcionarioId: string,
    jobId: string,
    prazoDias: number,
  ): Promise<Alocacao> {
    const arquivo = path.join(tenantDir(tenantId), "alocacoes.json");
    const todas = await lerJson<Alocacao[]>(arquivo, []);
    const agora = new Date();
    const existente = todas.find((a) => a.funcionarioId === funcionarioId);
    if (existente && existente.expiraEm > agora.toISOString()) {
      throw new Error("funcionario_ocupado");
    }

    const nova: Alocacao = {
      funcionarioId,
      tenantId,
      jobId,
      alocadoEm: agora.toISOString(),
      expiraEm: new Date(agora.getTime() + prazoDias * 86_400_000).toISOString(),
    };

    const restantes = todas.filter((a) => a.funcionarioId !== funcionarioId);
    restantes.push(nova);
    await escreverJson(arquivo, restantes);
    return nova;
  }

  async listarTrabalhosAceitos(tenantId: string): Promise<TrabalhoAceito[]> {
    return lerJson<TrabalhoAceito[]>(
      path.join(tenantDir(tenantId), "trabalhos.json"),
      [],
    );
  }

  async aceitarTrabalho(
    tenantId: string,
    jobId: string,
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<TrabalhoAceito> {
    const arquivo = path.join(tenantDir(tenantId), "trabalhos.json");
    const atuais = await lerJson<TrabalhoAceito[]>(arquivo, []);
    const existente = atuais.find((t) => t.jobId === jobId);
    if (existente) return existente; // idempotente: já concedido, não reavalia requisito

    if (requisitos) {
      const negocio = await this.lerNegocio(tenantId);
      if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
      if (atributosFaltantes(negocio.atributos, requisitos).length > 0) {
        throw new Error("atributo_insuficiente");
      }
    }

    const novo: TrabalhoAceito = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      jobId,
      aceitoEm: new Date().toISOString(),
    };
    atuais.push(novo);
    await escreverJson(arquivo, atuais);
    return novo;
  }

  async listarNosDesbloqueados(tenantId: string): Promise<NoDesbloqueado[]> {
    return lerJson<NoDesbloqueado[]>(
      path.join(tenantDir(tenantId), "nos.json"),
      [],
    );
  }

  async desbloquearNo(
    tenantId: string,
    noId: string,
    custoMoeda: number,
    xp: number,
    atributos?: Partial<Record<AtributoChave, number>>,
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ no: NoDesbloqueado; negocio: Negocio }> {
    const arquivo = path.join(tenantDir(tenantId), "nos.json");
    const atuais = await lerJson<NoDesbloqueado[]>(arquivo, []);
    if (atuais.some((n) => n.noId === noId)) {
      throw new Error("no_ja_desbloqueado");
    }
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    if (requisitos && atributosFaltantes(negocio.atributos, requisitos).length > 0) {
      throw new Error("atributo_insuficiente");
    }
    if (negocio.moedaVirtual < custoMoeda) {
      throw new Error("saldo_insuficiente");
    }

    negocio.moedaVirtual -= custoMoeda;
    negocio.xp += xp;
    negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
    if (atributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, atributos);
    }

    const no: NoDesbloqueado = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      noId,
      desbloqueadoEm: new Date().toISOString(),
    };
    atuais.push(no);

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return { no, negocio };
  }

  async listarParceriasFormadas(tenantId: string): Promise<ParceriaFormada[]> {
    return lerJson<ParceriaFormada[]>(
      path.join(tenantDir(tenantId), "parcerias.json"),
      [],
    );
  }

  async formarParceria(
    tenantId: string,
    vizinhoTenantId: string,
    xp: number,
    moeda: number,
    atributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ parceria: ParceriaFormada; negocio: Negocio }> {
    if (vizinhoTenantId === tenantId) throw new Error("vizinho_invalido");

    // garantia real de segurança deste card: nunca confiar que o vizinho
    // informado é de fato vizinho de quarteirão (mesmo motivo do join em
    // formar_parceria/0014 no adapter Supabase).
    const vizinhos = await this.listarVizinhos(tenantId);
    if (!vizinhos.some((v) => v.id === vizinhoTenantId)) {
      throw new Error("vizinho_invalido");
    }

    const arquivo = path.join(tenantDir(tenantId), "parcerias.json");
    const atuais = await lerJson<ParceriaFormada[]>(arquivo, []);
    if (atuais.some((p) => p.vizinhoTenantId === vizinhoTenantId)) {
      throw new Error("parceria_ja_formada");
    }

    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);

    negocio.moedaVirtual += moeda;
    negocio.xp += xp;
    negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
    if (atributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, atributos);
    }

    const parceria: ParceriaFormada = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      vizinhoTenantId,
      formadaEm: new Date().toISOString(),
    };
    atuais.push(parceria);

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return { parceria, negocio };
  }

  async lerSede(tenantId: string): Promise<Sede> {
    const arquivo = path.join(tenantDir(tenantId), "sede.json");
    const existente = await lerJson<Sede | null>(arquivo, null);
    if (existente) return existente;

    const agora = new Date().toISOString();
    const nova: Sede = { tenantId, nivel: 1, criadaEm: agora, atualizadaEm: agora };
    await escreverJson(arquivo, nova);
    return nova;
  }

  async evoluirSede(
    tenantId: string,
    nivelEsperadoAtual: number,
    novoNivel: number,
    custoMoeda: number,
    xp: number,
  ): Promise<{ sede: Sede; negocio: Negocio }> {
    const sede = await this.lerSede(tenantId);
    if (sede.nivel !== nivelEsperadoAtual) {
      throw new Error("A sede já mudou de nível — atualize a página.");
    }
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    if (negocio.moedaVirtual < custoMoeda) {
      throw new Error("Saldo de moeda insuficiente.");
    }

    negocio.moedaVirtual -= custoMoeda;
    negocio.xp += xp;
    negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
    sede.nivel = novoNivel;
    sede.atualizadaEm = new Date().toISOString();

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(path.join(tenantDir(tenantId), "sede.json"), sede);
    return { sede, negocio };
  }

  async listarCapitulosEntregues(tenantId: string): Promise<CapituloEntregue[]> {
    return lerJson<CapituloEntregue[]>(
      path.join(tenantDir(tenantId), "historia.json"),
      [],
    );
  }

  async entregarCapitulo(
    tenantId: string,
    capituloId: string,
  ): Promise<CapituloEntregue> {
    const arquivo = path.join(tenantDir(tenantId), "historia.json");
    const atuais = await lerJson<CapituloEntregue[]>(arquivo, []);
    const existente = atuais.find((c) => c.capituloId === capituloId);
    if (existente) return existente; // idempotente

    const novo: CapituloEntregue = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      capituloId,
      entregueEm: new Date().toISOString(),
      escolhaId: null,
      resolvidoEm: null,
    };
    atuais.push(novo);
    await escreverJson(arquivo, atuais);
    return novo;
  }

  async resolverCapitulo(
    tenantId: string,
    capituloId: string,
    escolhaId: string,
    delta: DeltaProgresso,
  ): Promise<{ capitulo: CapituloEntregue; negocio: Negocio }> {
    const arquivo = path.join(tenantDir(tenantId), "historia.json");
    const atuais = await lerJson<CapituloEntregue[]>(arquivo, []);
    const alvo = atuais.find((c) => c.capituloId === capituloId);
    if (!alvo) throw new Error("capitulo_nao_entregue");
    if (alvo.escolhaId) throw new Error("capitulo_ja_resolvido");

    alvo.escolhaId = escolhaId;
    alvo.resolvidoEm = new Date().toISOString();
    await escreverJson(arquivo, atuais);

    const negocio = await this.aplicarProgresso(tenantId, delta);
    return { capitulo: alvo, negocio };
  }

  async listarMobiliaColocada(tenantId: string): Promise<ItemMobiliaColocado[]> {
    const itens = await lerJson<ItemMobiliaColocado[]>(
      path.join(tenantDir(tenantId), "mobilia.json"),
      [],
    );
    // `nivel` cai em 1 quando ausente: itens gravados antes de
    // `0025_mobilia_nivel` não têm o campo no JSON.
    return itens.map((i) => ({ ...i, nivel: i.nivel ?? 1 }));
  }

  async comprarMobilia(
    tenantId: string,
    itemId: string,
    slot: number,
    custoMoeda: number,
    bonusAtributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ item: ItemMobiliaColocado; negocio: Negocio }> {
    const arquivo = path.join(tenantDir(tenantId), "mobilia.json");
    const atuais = await lerJson<ItemMobiliaColocado[]>(arquivo, []);
    if (atuais.some((m) => m.slot === slot)) {
      throw new Error("Esse espaço da sala já está ocupado.");
    }
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    if (negocio.moedaVirtual < custoMoeda) {
      throw new Error("Saldo de moeda insuficiente.");
    }

    negocio.moedaVirtual -= custoMoeda;
    if (bonusAtributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, bonusAtributos);
    }
    const item: ItemMobiliaColocado = {
      id: randomBytes(8).toString("hex"),
      tenantId,
      itemId,
      slot,
      colocadoEm: new Date().toISOString(),
      nivel: 1,
    };
    atuais.push(item);

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return { item, negocio };
  }

  async evoluirMobilia(
    tenantId: string,
    itemColocadoId: string,
    novoNivel: number,
    custoMoeda: number,
    bonusAtributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<ItemMobiliaColocado> {
    const arquivo = path.join(tenantDir(tenantId), "mobilia.json");
    const atuais = await lerJson<ItemMobiliaColocado[]>(arquivo, []);
    const item = atuais.find((m) => m.id === itemColocadoId);
    if (!item) throw new Error("item_nao_encontrado");
    if (novoNivel !== (item.nivel ?? 1) + 1) throw new Error("nivel_invalido");

    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    if (negocio.moedaVirtual < custoMoeda) throw new Error("saldo_insuficiente");

    negocio.moedaVirtual -= custoMoeda;
    if (bonusAtributos) {
      negocio.atributos = aplicarGanhos(negocio.atributos, bonusAtributos);
    }
    item.nivel = novoNivel;

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return item;
  }

  async moverMobilia(
    tenantId: string,
    itemColocadoId: string,
    novoSlot: number,
  ): Promise<ItemMobiliaColocado> {
    const arquivo = path.join(tenantDir(tenantId), "mobilia.json");
    const atuais = await lerJson<ItemMobiliaColocado[]>(arquivo, []);
    if (atuais.some((m) => m.slot === novoSlot && m.id !== itemColocadoId)) {
      throw new Error("Esse espaço da sala já está ocupado.");
    }
    const item = atuais.find((m) => m.id === itemColocadoId);
    if (!item) throw new Error("Móvel não encontrado.");

    item.slot = novoSlot;
    await escreverJson(arquivo, atuais);
    return item;
  }

  async listarEventosGlobais(): Promise<EventoGlobal[]> {
    return lerJson<EventoGlobal[]>(EVENTOS_GLOBAIS, []);
  }

  async criarEventoGlobal(
    evento: Omit<EventoGlobal, "criadoEm">,
  ): Promise<EventoGlobal> {
    const atuais = await lerJson<EventoGlobal[]>(EVENTOS_GLOBAIS, []);
    const novo: EventoGlobal = { ...evento, criadoEm: new Date().toISOString() };
    atuais.push(novo);
    await escreverJson(EVENTOS_GLOBAIS, atuais);
    return novo;
  }

  async listarProgressoEventos(tenantId: string): Promise<ProgressoEventoGlobal[]> {
    return lerJson<ProgressoEventoGlobal[]>(
      path.join(tenantDir(tenantId), "progresso-eventos.json"),
      [],
    );
  }

  async incrementarProgressoEventos(
    tenantId: string,
    eventoKey: string,
  ): Promise<ProgressoEventoGlobal[]> {
    const agora = new Date().toISOString();
    const eventos = await this.listarEventosGlobais();
    const relevantes = eventos.filter(
      (e) => e.objetivo === eventoKey && eventoAtivoEm(e, agora),
    );
    if (relevantes.length === 0) return this.listarProgressoEventos(tenantId);

    const arquivo = path.join(tenantDir(tenantId), "progresso-eventos.json");
    const progresso = await lerJson<ProgressoEventoGlobal[]>(arquivo, []);
    let negocio: Negocio | null = null;

    for (const evento of relevantes) {
      let linha = progresso.find((p) => p.eventoId === evento.id);
      if (!linha) {
        linha = { eventoId: evento.id, tenantId, contagem: 0, completoEm: null };
        progresso.push(linha);
      }
      linha.contagem += 1;

      if (linha.contagem >= evento.meta && linha.completoEm === null) {
        linha.completoEm = agora;
        negocio ??= await this.lerNegocio(tenantId);
        if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
        negocio.xp += evento.recompensa.xp;
        negocio.moedaVirtual += evento.recompensa.moeda;
        negocio.nivel = Math.min(NIVEL_MAX, nivelPorXp(negocio.xp));
        if (evento.recompensa.atributo) {
          const { chave, ganho } = evento.recompensa.atributo;
          negocio.atributos = aplicarGanhos(negocio.atributos, { [chave]: ganho });
        }
      }
    }

    await escreverJson(arquivo, progresso);
    if (negocio) {
      await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    }
    return progresso;
  }

  // ---- Solicitações de serviço (labdatadev) ----

  async criarSolicitacao(input: NovaSolicitacao): Promise<SolicitacaoServico> {
    const atuais = await lerJson<SolicitacaoServico[]>(SOLICITACOES, []);
    const agora = new Date().toISOString();
    const nova: SolicitacaoServico = {
      id: randomBytes(8).toString("hex"),
      tenantId: input.tenantId,
      tipo: input.tipo,
      titulo: input.titulo,
      descricao: input.descricao,
      status: "recebida",
      criadoEm: agora,
      atualizadoEm: agora,
    };
    atuais.push(nova);
    await escreverJson(SOLICITACOES, atuais);
    return nova;
  }

  async listarSolicitacoesDoTenant(tenantId: string): Promise<SolicitacaoServico[]> {
    const atuais = await lerJson<SolicitacaoServico[]>(SOLICITACOES, []);
    return atuais.filter((s) => s.tenantId === tenantId);
  }

  async listarTodasSolicitacoes(): Promise<SolicitacaoServico[]> {
    return lerJson<SolicitacaoServico[]>(SOLICITACOES, []);
  }

  async atualizarStatusSolicitacao(
    id: string,
    status: string,
  ): Promise<SolicitacaoServico> {
    const atuais = await lerJson<SolicitacaoServico[]>(SOLICITACOES, []);
    const alvo = atuais.find((s) => s.id === id);
    if (!alvo) throw new Error(`Solicitação ${id} não encontrada.`);
    alvo.status = status;
    alvo.atualizadoEm = new Date().toISOString();
    await escreverJson(SOLICITACOES, atuais);
    return alvo;
  }

  async listarClientesAdmin(): Promise<ClienteAdmin[]> {
    const raiz = path.join(ROOT, "tenants");
    let pastas: string[];
    try {
      pastas = await fs.readdir(raiz);
    } catch {
      return [];
    }

    const mapa = await this.lerMapa();
    const nomeCidade = new Map(mapa.cidades.map((c) => [c.slug, c.nome]));
    const nomeBairro = new Map(
      mapa.cidades.flatMap((c) => c.bairros.map((b) => [`${c.slug}/${b.slug}`, b.nome])),
    );

    const negocios = await Promise.all(pastas.map((id) => this.lerNegocio(id)));
    return Promise.all(
      negocios
        .filter((n): n is Negocio => n !== null)
        .map(async (n): Promise<ClienteAdmin> => {
          const onboarding = await this.lerOnboarding(n.id);
          return {
            id: n.id,
            nome: n.nome,
            segmento: n.segmento,
            cidadeNome: nomeCidade.get(n.endereco.cidadeSlug) ?? n.endereco.cidadeSlug,
            bairroNome:
              nomeBairro.get(`${n.endereco.cidadeSlug}/${n.endereco.bairroSlug}`) ??
              n.endereco.bairroSlug,
            degrauAtual: n.degrauAtual,
            degrauAlvo: n.degrauAlvo,
            nivel: n.nivel,
            xp: n.xp,
            criadoEm: n.criadoEm,
            onboarding: onboarding
              ? {
                  scoreFit: onboarding.scoreFit,
                  degrauAlvo: onboarding.degrauAlvo,
                  servicosRecomendados: onboarding.servicosRecomendados,
                  respondidoEm: onboarding.respondidoEm,
                }
              : null,
            // Billing (assinaturas) só existe no driver Supabase hoje.
            assinaturas: [],
          };
        }),
    );
  }
}
