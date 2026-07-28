import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { CIDADES_REGIAO } from "@/lib/regiao";
import { nivelPorXp, NIVEL_MAX } from "@/lib/gamificacao";
import { aplicarGanhos } from "@/lib/atributos";
import { alocacoesAtivasEm, disponibilidadeDe } from "@/lib/disponibilidade";
import type { AtributoChave } from "@tokens";
import type { DeltaProgresso, GameRepository, NovoNegocio } from "./repository";
import type {
  Alocacao,
  Bairro,
  CapituloEntregue,
  Cidade,
  Endereco,
  FuncionarioContratado,
  ItemMobiliaColocado,
  Mapa,
  MapaView,
  Negocio,
  NegocioResumo,
  NoDesbloqueado,
  Oferta,
  Onboarding,
  Quarteirao,
  Sede,
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
  async lerMapa(): Promise<Mapa> {
    return lerJson<Mapa>(MAPA, mapaInicial());
  }

  async lerMapaView(): Promise<MapaView> {
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
          quarteiroes: b.quarteiroes.map((q) => ({
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
    };
    atuais.push(novo);
    await escreverJson(arquivo, atuais);
    // contratação recém-criada nunca tem alocação — livre por construção
    return { ...novo, disponibilidade: { estado: "livre" } };
  }

  /** Enriquece o registro armazenado com `disponibilidade`, derivada das
   *  alocações ATIVAS — nunca persistida junto do funcionário (GH-EQP-01). */
  private async enriquecerDisponibilidade(
    tenantId: string,
    funcionarios: FuncionarioArmazenado[],
  ): Promise<FuncionarioContratado[]> {
    const ativas = await this.listarAlocacoesAtivas(tenantId);
    return funcionarios.map((f) => ({
      ...f,
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

  async aceitarTrabalho(tenantId: string, jobId: string): Promise<TrabalhoAceito> {
    const arquivo = path.join(tenantDir(tenantId), "trabalhos.json");
    const atuais = await lerJson<TrabalhoAceito[]>(arquivo, []);
    const existente = atuais.find((t) => t.jobId === jobId);
    if (existente) return existente;

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
  ): Promise<{ no: NoDesbloqueado; negocio: Negocio }> {
    const arquivo = path.join(tenantDir(tenantId), "nos.json");
    const atuais = await lerJson<NoDesbloqueado[]>(arquivo, []);
    if (atuais.some((n) => n.noId === noId)) {
      throw new Error("no_ja_desbloqueado");
    }
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
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
    return lerJson<ItemMobiliaColocado[]>(
      path.join(tenantDir(tenantId), "mobilia.json"),
      [],
    );
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
    };
    atuais.push(item);

    await escreverJson(path.join(tenantDir(tenantId), "negocio.json"), negocio);
    await escreverJson(arquivo, atuais);
    return { item, negocio };
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
}
