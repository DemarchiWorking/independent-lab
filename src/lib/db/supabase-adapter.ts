import type { SupabaseClient } from "@supabase/supabase-js";
import type { AtributoChave } from "@tokens";
import { supabaseAdmin } from "@/lib/supabase/client";
import { TETO_ATRIBUTO } from "@/lib/atributos";
import { disponibilidadeDe } from "@/lib/disponibilidade";
import { slugify } from "./file-adapter";
import type { DeltaProgresso, GameRepository, NovoNegocio } from "./repository";
import type {
  Alocacao,
  CapituloEntregue,
  EventoGlobal,
  FuncionarioContratado,
  ItemMobiliaColocado,
  Mapa,
  MapaView,
  Negocio,
  NoDesbloqueado,
  Oferta,
  Onboarding,
  ParceriaFormada,
  ProgressoEventoGlobal,
  Sede,
  Segmento,
  TrabalhoAceito,
  Usuario,
} from "./types";

/**
 * Adapter Postgres/Supabase. O schema, as policies de RLS e as funções estão
 * em `supabase/migrations/0001_init.sql`.
 *
 * Nota de segurança: usamos o cliente admin (service_role) porque estas
 * chamadas rodam apenas no servidor, dentro de Server Actions que já
 * autenticaram o usuário e passam o `tenantId` da sessão. A RLS continua sendo
 * a defesa para qualquer acesso vindo do browser com a chave anon.
 */

/** Linha de `public.negocios` (snake_case, como no banco). */
interface LinhaNegocio {
  id: number;
  nome: string;
  segmento: Segmento;
  quarteirao_id: number;
  lote: number;
  degrau_atual: number;
  degrau_alvo: number;
  nivel: number;
  xp: number;
  moeda_virtual: number;
  criado_em: string;
  tecnologia: number;
  processo: number;
  presenca: number;
  aquisicao: number;
  capacidade: number;
}

interface LinhaLocal {
  quarteirao_numero: number;
  bairro_slug: string;
  cidade_slug: string;
}

export class SupabaseRepository implements GameRepository {
  private get db(): SupabaseClient {
    return supabaseAdmin();
  }

  /** Resolve cidade/bairro/quarteirão de um negócio (1 query com joins). */
  private async local(quarteiraoId: number): Promise<LinhaLocal> {
    const { data, error } = await this.db
      .from("quarteiroes")
      .select("numero, bairros!inner(slug, cidades!inner(slug))")
      .eq("id", quarteiraoId)
      .single();

    if (error || !data) {
      throw new Error(`Local do quarteirão ${quarteiraoId}: ${error?.message}`);
    }
    const linha = data as unknown as {
      numero: number;
      bairros: { slug: string; cidades: { slug: string } };
    };
    return {
      quarteirao_numero: linha.numero,
      bairro_slug: linha.bairros.slug,
      cidade_slug: linha.bairros.cidades.slug,
    };
  }

  private async paraDominio(linha: LinhaNegocio): Promise<Negocio> {
    const loc = await this.local(linha.quarteirao_id);
    return {
      id: String(linha.id),
      nome: linha.nome,
      segmento: linha.segmento,
      endereco: {
        cidadeSlug: loc.cidade_slug,
        bairroSlug: loc.bairro_slug,
        quarteiraoId: `q${loc.quarteirao_numero}`,
        lote: linha.lote,
      },
      criadoEm: linha.criado_em,
      degrauAtual: linha.degrau_atual,
      degrauAlvo: linha.degrau_alvo,
      nivel: linha.nivel,
      xp: linha.xp,
      moedaVirtual: linha.moeda_virtual,
      atributos: {
        tecnologia: { valor: linha.tecnologia, teto: TETO_ATRIBUTO },
        processo: { valor: linha.processo, teto: TETO_ATRIBUTO },
        presenca: { valor: linha.presenca, teto: TETO_ATRIBUTO },
        aquisicao: { valor: linha.aquisicao, teto: TETO_ATRIBUTO },
        capacidade: { valor: linha.capacidade, teto: TETO_ATRIBUTO },
      },
    };
  }

  async lerMapa(): Promise<Mapa> {
    const { data, error } = await this.db
      .from("cidades")
      .select(
        `slug, nome, prioritaria,
         bairros ( slug, nome,
           quarteiroes ( numero,
             negocios ( id, lote ) ) )`,
      )
      .order("nome");

    if (error) throw new Error(`lerMapa: ${error.message}`);

    type Bruto = {
      slug: string;
      nome: string;
      prioritaria: boolean;
      bairros: Array<{
        slug: string;
        nome: string;
        quarteiroes: Array<{
          numero: number;
          negocios: Array<{ id: number; lote: number }>;
        }>;
      }>;
    };

    return {
      cidades: ((data ?? []) as unknown as Bruto[]).map((c) => ({
        slug: c.slug,
        nome: c.nome,
        prioritaria: c.prioritaria,
        bairros: c.bairros.map((b) => ({
          slug: b.slug,
          nome: b.nome,
          quarteiroes: b.quarteiroes.map((q) => ({
            id: `q${q.numero}`,
            nome: `Quarteirão ${q.numero}`,
            lotes: Array.from({ length: 8 }, (_, i) => {
              const ocupante = q.negocios.find((n) => n.lote === i + 1);
              return {
                numero: i + 1,
                tenantId: ocupante ? String(ocupante.id) : null,
              };
            }),
          })),
        })),
      })),
    };
  }

  async lerMapaView(): Promise<MapaView> {
    const { data, error } = await this.db
      .from("cidades")
      .select(
        `slug, nome, prioritaria,
         bairros ( slug, nome,
           quarteiroes ( numero,
             negocios ( id, lote, nome, segmento, nivel, degrau_atual ) ) )`,
      )
      .order("nome");

    if (error) throw new Error(`lerMapaView: ${error.message}`);

    type Bruto = {
      slug: string;
      nome: string;
      prioritaria: boolean;
      bairros: Array<{
        slug: string;
        nome: string;
        quarteiroes: Array<{
          numero: number;
          negocios: Array<{
            id: number;
            lote: number;
            nome: string;
            segmento: Segmento;
            nivel: number;
            degrau_atual: number;
          }>;
        }>;
      }>;
    };

    return {
      cidades: ((data ?? []) as unknown as Bruto[]).map((c) => ({
        slug: c.slug,
        nome: c.nome,
        prioritaria: c.prioritaria,
        bairros: c.bairros.map((b) => ({
          slug: b.slug,
          nome: b.nome,
          quarteiroes: b.quarteiroes.map((q) => ({
            id: `q${q.numero}`,
            nome: `Quarteirão ${q.numero}`,
            lotes: Array.from({ length: 8 }, (_, i) => {
              const n = q.negocios.find((x) => x.lote === i + 1);
              return {
                numero: i + 1,
                negocio: n
                  ? {
                      id: String(n.id),
                      nome: n.nome,
                      segmento: n.segmento,
                      nivel: n.nivel,
                      degrauAtual: n.degrau_atual,
                    }
                  : null,
              };
            }),
          })),
        })),
      })),
    };
  }

  /** Cadastro atômico: a RPC cria cidade/bairro/quarteirão e reserva o lote. */
  async criarNegocio(dados: NovoNegocio): Promise<Negocio> {
    const { data, error } = await this.db
      .rpc("criar_negocio_com_lote", {
        p_cidade_slug: dados.cidadeSlug,
        p_cidade_nome: dados.cidadeNome,
        p_bairro_nome: dados.bairroNome,
        p_bairro_slug: slugify(dados.bairroNome) || "centro",
        p_nome: dados.nome,
        p_segmento: dados.segmento,
        p_degrau_alvo: dados.degrauAlvo,
        p_xp: dados.xpInicial,
        p_moeda: dados.moedaVirtual,
        p_tecnologia: dados.atributosIniciais.tecnologia.valor,
        p_processo: dados.atributosIniciais.processo.valor,
        p_presenca: dados.atributosIniciais.presenca.valor,
        p_aquisicao: dados.atributosIniciais.aquisicao.valor,
        p_capacidade: dados.atributosIniciais.capacidade.valor,
      })
      .single();

    if (error || !data) {
      throw new Error(`criar_negocio_com_lote: ${error?.message}`);
    }
    return this.paraDominio(data as LinhaNegocio);
  }

  async lerNegocio(tenantId: string): Promise<Negocio | null> {
    const { data, error } = await this.db
      .from("negocios")
      .select("*")
      .eq("id", Number(tenantId))
      .maybeSingle();

    if (error) throw new Error(`lerNegocio: ${error.message}`);
    return data ? this.paraDominio(data as LinhaNegocio) : null;
  }

  async vincularMembro(usuario: Usuario): Promise<void> {
    const { error } = await this.db.from("membros").insert({
      user_id: usuario.id,
      tenant_id: Number(usuario.tenantId),
      nome: usuario.nome,
      papel: usuario.papel,
    });
    if (error) throw new Error(`vincularMembro: ${error.message}`);
  }

  async lerMembroPorUsuario(usuarioId: string): Promise<Usuario | null> {
    const { data, error } = await this.db
      .from("membros")
      .select("user_id, tenant_id, nome, papel, criado_em")
      .eq("user_id", usuarioId)
      .maybeSingle();

    if (error) throw new Error(`lerMembroPorUsuario: ${error.message}`);
    if (!data) return null;

    const linha = data as {
      user_id: string;
      tenant_id: number;
      nome: string;
      papel: Usuario["papel"];
      criado_em: string;
    };
    return {
      id: linha.user_id,
      tenantId: String(linha.tenant_id),
      nome: linha.nome,
      // e-mail é propriedade do Supabase Auth, não duplicamos na tabela
      email: "",
      papel: linha.papel,
      criadoEm: linha.criado_em,
    };
  }

  async salvarOnboarding(onboarding: Onboarding): Promise<void> {
    const { error } = await this.db.from("onboardings").upsert({
      tenant_id: Number(onboarding.tenantId),
      respostas: onboarding.respostas,
      score_fit: onboarding.scoreFit,
      degrau_alvo: onboarding.degrauAlvo,
      servicos_recomendados: onboarding.servicosRecomendados,
    });
    if (error) throw new Error(`salvarOnboarding: ${error.message}`);
  }

  async lerOnboarding(tenantId: string): Promise<Onboarding | null> {
    const { data, error } = await this.db
      .from("onboardings")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .maybeSingle();

    if (error) throw new Error(`lerOnboarding: ${error.message}`);
    if (!data) return null;

    const linha = data as {
      tenant_id: number;
      respostas: Onboarding["respostas"];
      score_fit: number;
      degrau_alvo: number;
      servicos_recomendados: string[];
      respondido_em: string;
    };
    return {
      tenantId: String(linha.tenant_id),
      respostas: linha.respostas,
      scoreFit: linha.score_fit,
      degrauAlvo: linha.degrau_alvo,
      servicosRecomendados: linha.servicos_recomendados,
      respondidoEm: linha.respondido_em,
    };
  }

  async listarOfertas(tenantId: string): Promise<Oferta[]> {
    const { data, error } = await this.db
      .from("ofertas")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("criada_em", { ascending: false });

    if (error) throw new Error(`listarOfertas: ${error.message}`);
    return ((data ?? []) as Array<{
      id: number;
      tenant_id: number;
      titulo: string;
      descricao: string;
      preco: string;
      criada_em: string;
    }>).map((o) => ({
      id: String(o.id),
      tenantId: String(o.tenant_id),
      titulo: o.titulo,
      descricao: o.descricao,
      preco: o.preco,
      criadaEm: o.criada_em,
    }));
  }

  async criarOferta(oferta: Omit<Oferta, "id">): Promise<void> {
    const { error } = await this.db.from("ofertas").insert({
      tenant_id: Number(oferta.tenantId),
      titulo: oferta.titulo,
      descricao: oferta.descricao,
      preco: oferta.preco,
    });
    if (error) throw new Error(`criarOferta: ${error.message}`);
  }

  /** Uma única chamada — a função SQL faz o join do quarteirão (sem N+1). */
  async listarVizinhos(tenantId: string): Promise<Negocio[]> {
    const { data, error } = await this.db.rpc("vizinhos_do_tenant", {
      p_tenant_id: Number(tenantId),
    });
    if (error) throw new Error(`vizinhos_do_tenant: ${error.message}`);

    const linhas = (data ?? []) as LinhaNegocio[];
    if (linhas.length === 0) return [];

    // todos estão no mesmo quarteirão: resolve o local uma vez só
    const loc = await this.local(linhas[0].quarteirao_id);
    return linhas.map((l) => ({
      id: String(l.id),
      nome: l.nome,
      segmento: l.segmento,
      endereco: {
        cidadeSlug: loc.cidade_slug,
        bairroSlug: loc.bairro_slug,
        quarteiraoId: `q${loc.quarteirao_numero}`,
        lote: l.lote,
      },
      criadoEm: l.criado_em,
      degrauAtual: l.degrau_atual,
      degrauAlvo: l.degrau_alvo,
      nivel: l.nivel,
      xp: l.xp,
      moedaVirtual: l.moeda_virtual,
      atributos: {
        tecnologia: { valor: l.tecnologia, teto: TETO_ATRIBUTO },
        processo: { valor: l.processo, teto: TETO_ATRIBUTO },
        presenca: { valor: l.presenca, teto: TETO_ATRIBUTO },
        aquisicao: { valor: l.aquisicao, teto: TETO_ATRIBUTO },
        capacidade: { valor: l.capacidade, teto: TETO_ATRIBUTO },
      },
    }));
  }

  async aplicarProgresso(
    tenantId: string,
    delta: DeltaProgresso,
  ): Promise<Negocio> {
    const a = delta.atributos ?? {};
    const { data, error } = await this.db
      .rpc("aplicar_progresso", {
        p_tenant_id: Number(tenantId),
        p_xp: delta.xp,
        p_moeda: delta.moeda,
        p_degraus: delta.degraus,
        p_tecnologia: a.tecnologia ?? 0,
        p_processo: a.processo ?? 0,
        p_presenca: a.presenca ?? 0,
        p_aquisicao: a.aquisicao ?? 0,
        p_capacidade: a.capacidade ?? 0,
      })
      .single();

    if (error || !data) {
      throw new Error(`aplicar_progresso: ${error?.message}`);
    }
    return this.paraDominio(data as LinhaNegocio);
  }

  private paraFuncionario(l: {
    id: number;
    tenant_id: number;
    cargo_id: string;
    contratado_em: string;
  }): Omit<FuncionarioContratado, "disponibilidade"> {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      cargoId: l.cargo_id,
      contratadoEm: l.contratado_em,
    };
  }

  /** Enriquece com `disponibilidade`, derivada das alocações ATIVAS — nunca
   *  persistida junto do funcionário (GH-EQP-01), mesma lógica do file-adapter. */
  private async enriquecerDisponibilidade(
    tenantId: string,
    funcionarios: Array<Omit<FuncionarioContratado, "disponibilidade">>,
  ): Promise<FuncionarioContratado[]> {
    const ativas = await this.listarAlocacoesAtivas(tenantId);
    return funcionarios.map((f) => ({
      ...f,
      disponibilidade: disponibilidadeDe(ativas, f.id),
    }));
  }

  async listarFuncionarios(tenantId: string): Promise<FuncionarioContratado[]> {
    const { data, error } = await this.db
      .from("funcionarios_contratados")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("contratado_em", { ascending: true });

    if (error) throw new Error(`listarFuncionarios: ${error.message}`);
    const brutos = ((data ?? []) as Array<{
      id: number;
      tenant_id: number;
      cargo_id: string;
      contratado_em: string;
    }>).map((l) => this.paraFuncionario(l));
    return this.enriquecerDisponibilidade(tenantId, brutos);
  }

  /**
   * Idempotente via `upsert` com `onConflict` na unique (tenant_id, cargo_id) —
   * depois um select garante retornar a linha certa tanto no caso novo quanto
   * no já-existente (mais simples e explícito que confiar no retorno do upsert).
   */
  async contratarFuncionario(
    tenantId: string,
    cargoId: string,
  ): Promise<FuncionarioContratado> {
    const { error: upsertError } = await this.db
      .from("funcionarios_contratados")
      .upsert(
        { tenant_id: Number(tenantId), cargo_id: cargoId },
        { onConflict: "tenant_id,cargo_id", ignoreDuplicates: true },
      );
    if (upsertError) {
      throw new Error(`contratarFuncionario (upsert): ${upsertError.message}`);
    }

    const { data, error } = await this.db
      .from("funcionarios_contratados")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .eq("cargo_id", cargoId)
      .single();

    if (error || !data) {
      throw new Error(`contratarFuncionario (select): ${error?.message}`);
    }
    const bruto = this.paraFuncionario(
      data as { id: number; tenant_id: number; cargo_id: string; contratado_em: string },
    );
    // contratação recém-criada/existente: enriquece antes de devolver
    const [enriquecido] = await this.enriquecerDisponibilidade(tenantId, [bruto]);
    return enriquecido;
  }

  private paraAlocacao(l: {
    funcionario_id: number;
    tenant_id: number;
    job_id: string;
    alocado_em: string;
    expira_em: string;
  }): Alocacao {
    return {
      funcionarioId: String(l.funcionario_id),
      tenantId: String(l.tenant_id),
      jobId: l.job_id,
      alocadoEm: l.alocado_em,
      expiraEm: l.expira_em,
    };
  }

  async listarAlocacoesAtivas(tenantId: string): Promise<Alocacao[]> {
    const { data, error } = await this.db
      .from("alocacoes")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .gt("expira_em", new Date().toISOString());

    if (error) throw new Error(`listarAlocacoesAtivas: ${error.message}`);
    return ((data ?? []) as Array<{
      funcionario_id: number;
      tenant_id: number;
      job_id: string;
      alocado_em: string;
      expira_em: string;
    }>).map((l) => this.paraAlocacao(l));
  }

  /** Atômica via RPC `alocar_funcionario` — advisory lock por funcionário +
   *  upsert na mesma transação (ver `0010_alocacao_equipe.sql`). */
  async alocarFuncionario(
    tenantId: string,
    funcionarioId: string,
    jobId: string,
    prazoDias: number,
  ): Promise<Alocacao> {
    const { data, error } = await this.db
      .rpc("alocar_funcionario", {
        p_tenant_id: Number(tenantId),
        p_funcionario_id: Number(funcionarioId),
        p_job_id: jobId,
        p_dias: prazoDias,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "alocar_funcionario: sem retorno");
    }
    return this.paraAlocacao(
      data as {
        funcionario_id: number;
        tenant_id: number;
        job_id: string;
        alocado_em: string;
        expira_em: string;
      },
    );
  }

  private paraTrabalho(l: {
    id: number;
    tenant_id: number;
    job_id: string;
    aceito_em: string;
  }): TrabalhoAceito {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      jobId: l.job_id,
      aceitoEm: l.aceito_em,
    };
  }

  async listarTrabalhosAceitos(tenantId: string): Promise<TrabalhoAceito[]> {
    const { data, error } = await this.db
      .from("trabalhos_aceitos")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("aceito_em", { ascending: true });

    if (error) throw new Error(`listarTrabalhosAceitos: ${error.message}`);
    return ((data ?? []) as Array<{
      id: number;
      tenant_id: number;
      job_id: string;
      aceito_em: string;
    }>).map((l) => this.paraTrabalho(l));
  }

  /** Atômica via RPC `aceitar_trabalho` — idempotência + piso de atributos
   *  (GH-ATR-03) checados na mesma transação (ver `0012_atr_requisitos.sql`). */
  async aceitarTrabalho(
    tenantId: string,
    jobId: string,
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<TrabalhoAceito> {
    const r = requisitos ?? {};
    const { data, error } = await this.db
      .rpc("aceitar_trabalho", {
        p_tenant_id: Number(tenantId),
        p_job_id: jobId,
        p_min_tecnologia: r.tecnologia ?? 0,
        p_min_processo: r.processo ?? 0,
        p_min_presenca: r.presenca ?? 0,
        p_min_aquisicao: r.aquisicao ?? 0,
        p_min_capacidade: r.capacidade ?? 0,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "aceitar_trabalho: sem retorno");
    }
    return this.paraTrabalho(
      data as { id: number; tenant_id: number; job_id: string; aceito_em: string },
    );
  }

  private paraNo(l: {
    id: number;
    tenant_id: number;
    no_id: string;
    desbloqueado_em: string;
  }): NoDesbloqueado {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      noId: l.no_id,
      desbloqueadoEm: l.desbloqueado_em,
    };
  }

  async listarNosDesbloqueados(tenantId: string): Promise<NoDesbloqueado[]> {
    const { data, error } = await this.db
      .from("nos_desbloqueados")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("desbloqueado_em", { ascending: true });

    if (error) throw new Error(`listarNosDesbloqueados: ${error.message}`);
    return ((data ?? []) as Array<{
      id: number;
      tenant_id: number;
      no_id: string;
      desbloqueado_em: string;
    }>).map((l) => this.paraNo(l));
  }

  /** Idempotente — mesmo padrão de `contratarFuncionario`/`aceitarTrabalho`
   *  (upsert + ignoreDuplicates na unique(tenant_id, no_id), depois select). */
  /** Atômica via RPC `desbloquear_no` — saldo + débito + XP/atributo na
   *  mesma transação (ver `0011_arv_custo.sql`). */
  async desbloquearNo(
    tenantId: string,
    noId: string,
    custoMoeda: number,
    xp: number,
    atributos?: Partial<Record<AtributoChave, number>>,
    requisitos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ no: NoDesbloqueado; negocio: Negocio }> {
    const a = atributos ?? {};
    const q = requisitos ?? {};
    const { data, error } = await this.db
      .rpc("desbloquear_no", {
        p_tenant_id: Number(tenantId),
        p_no_id: noId,
        p_custo: custoMoeda,
        p_xp: xp,
        p_tecnologia: a.tecnologia ?? 0,
        p_processo: a.processo ?? 0,
        p_presenca: a.presenca ?? 0,
        p_aquisicao: a.aquisicao ?? 0,
        p_capacidade: a.capacidade ?? 0,
        p_min_tecnologia: q.tecnologia ?? 0,
        p_min_processo: q.processo ?? 0,
        p_min_presenca: q.presenca ?? 0,
        p_min_aquisicao: q.aquisicao ?? 0,
        p_min_capacidade: q.capacidade ?? 0,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "desbloquear_no: sem retorno");
    }
    const no = this.paraNo(
      data as { id: number; tenant_id: number; no_id: string; desbloqueado_em: string },
    );
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    return { no, negocio };
  }

  private paraParceria(l: {
    id: number;
    tenant_id: number;
    vizinho_tenant_id: number;
    formada_em: string;
  }): ParceriaFormada {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      vizinhoTenantId: String(l.vizinho_tenant_id),
      formadaEm: l.formada_em,
    };
  }

  async listarParceriasFormadas(tenantId: string): Promise<ParceriaFormada[]> {
    const { data, error } = await this.db
      .from("parcerias_formadas")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("formada_em", { ascending: true });

    if (error) throw new Error(`listarParceriasFormadas: ${error.message}`);
    return ((data ?? []) as Array<{
      id: number;
      tenant_id: number;
      vizinho_tenant_id: number;
      formada_em: string;
    }>).map((l) => this.paraParceria(l));
  }

  /** Atômica via RPC `formar_parceria` (`0014_parcerias_mapa.sql`) — valida
   *  que o vizinho é real (join de quarteirão) antes de aplicar XP/moeda/
   *  atributo e inserir. */
  async formarParceria(
    tenantId: string,
    vizinhoTenantId: string,
    xp: number,
    moeda: number,
    atributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ parceria: ParceriaFormada; negocio: Negocio }> {
    const a = atributos ?? {};
    const { data, error } = await this.db
      .rpc("formar_parceria", {
        p_tenant_id: Number(tenantId),
        p_vizinho_tenant_id: Number(vizinhoTenantId),
        p_xp: xp,
        p_moeda: moeda,
        p_aquisicao: a.aquisicao ?? 0,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "formar_parceria: sem retorno");
    }
    const parceria = this.paraParceria(
      data as { id: number; tenant_id: number; vizinho_tenant_id: number; formada_em: string },
    );
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    return { parceria, negocio };
  }

  private paraSede(l: {
    tenant_id: number;
    nivel: number;
    criada_em: string;
    atualizada_em: string;
  }): Sede {
    return {
      tenantId: String(l.tenant_id),
      nivel: l.nivel,
      criadaEm: l.criada_em,
      atualizadaEm: l.atualizada_em,
    };
  }

  private paraItemColocado(l: {
    id: number;
    tenant_id: number;
    item_id: string;
    slot: number;
    colocado_em: string;
  }): ItemMobiliaColocado {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      itemId: l.item_id,
      slot: l.slot,
      colocadoEm: l.colocado_em,
    };
  }

  async lerSede(tenantId: string): Promise<Sede> {
    const { data, error } = await this.db
      .from("sedes")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .maybeSingle();
    if (error) throw new Error(`lerSede: ${error.message}`);
    if (data) return this.paraSede(data as Parameters<typeof this.paraSede>[0]);

    // primeiro acesso: cria a sede nível 1 (idempotente via upsert)
    const { data: criada, error: erroCriar } = await this.db
      .from("sedes")
      .upsert({ tenant_id: Number(tenantId), nivel: 1 }, { onConflict: "tenant_id" })
      .select("*")
      .single();
    if (erroCriar || !criada) {
      throw new Error(`lerSede (criar): ${erroCriar?.message}`);
    }
    return this.paraSede(criada as Parameters<typeof this.paraSede>[0]);
  }

  async evoluirSede(
    tenantId: string,
    nivelEsperadoAtual: number,
    novoNivel: number,
    custoMoeda: number,
    xp: number,
  ): Promise<{ sede: Sede; negocio: Negocio }> {
    const { data, error } = await this.db
      .rpc("evoluir_sede", {
        p_tenant_id: Number(tenantId),
        p_nivel_esperado: nivelEsperadoAtual,
        p_novo_nivel: novoNivel,
        p_custo: custoMoeda,
        p_xp: xp,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "evoluir_sede: sem retorno");
    }
    const sede = this.paraSede(data as Parameters<typeof this.paraSede>[0]);
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    return { sede, negocio };
  }

  private paraCapitulo(l: {
    id: number;
    tenant_id: number;
    capitulo_id: string;
    entregue_em: string;
    escolha_id: string | null;
    resolvido_em: string | null;
  }): CapituloEntregue {
    return {
      id: String(l.id),
      tenantId: String(l.tenant_id),
      capituloId: l.capitulo_id,
      entregueEm: l.entregue_em,
      escolhaId: l.escolha_id,
      resolvidoEm: l.resolvido_em,
    };
  }

  async listarCapitulosEntregues(tenantId: string): Promise<CapituloEntregue[]> {
    const { data, error } = await this.db
      .from("capitulos_entregues")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("entregue_em", { ascending: true });
    if (error) throw new Error(`listarCapitulosEntregues: ${error.message}`);
    return ((data ?? []) as Array<Parameters<typeof this.paraCapitulo>[0]>).map((l) =>
      this.paraCapitulo(l),
    );
  }

  async entregarCapitulo(
    tenantId: string,
    capituloId: string,
  ): Promise<CapituloEntregue> {
    const { data, error } = await this.db
      .rpc("entregar_capitulo", {
        p_tenant_id: Number(tenantId),
        p_capitulo_id: capituloId,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "entregar_capitulo: sem retorno");
    }
    return this.paraCapitulo(data as Parameters<typeof this.paraCapitulo>[0]);
  }

  async resolverCapitulo(
    tenantId: string,
    capituloId: string,
    escolhaId: string,
    delta: DeltaProgresso,
  ): Promise<{ capitulo: CapituloEntregue; negocio: Negocio }> {
    const a = delta.atributos ?? {};
    const { data, error } = await this.db
      .rpc("resolver_capitulo", {
        p_tenant_id: Number(tenantId),
        p_capitulo_id: capituloId,
        p_escolha_id: escolhaId,
        p_xp: delta.xp,
        p_moeda: delta.moeda,
        p_tecnologia: a.tecnologia ?? 0,
        p_processo: a.processo ?? 0,
        p_presenca: a.presenca ?? 0,
        p_aquisicao: a.aquisicao ?? 0,
        p_capacidade: a.capacidade ?? 0,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "resolver_capitulo: sem retorno");
    }
    const capitulo = this.paraCapitulo(data as Parameters<typeof this.paraCapitulo>[0]);
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    return { capitulo, negocio };
  }

  async listarMobiliaColocada(tenantId: string): Promise<ItemMobiliaColocado[]> {
    const { data, error } = await this.db
      .from("itens_mobilia_colocados")
      .select("*")
      .eq("tenant_id", Number(tenantId))
      .order("slot", { ascending: true });
    if (error) throw new Error(`listarMobiliaColocada: ${error.message}`);
    return ((data ?? []) as Array<Parameters<typeof this.paraItemColocado>[0]>).map(
      (l) => this.paraItemColocado(l),
    );
  }

  async comprarMobilia(
    tenantId: string,
    itemId: string,
    slot: number,
    custoMoeda: number,
    bonusAtributos?: Partial<Record<AtributoChave, number>>,
  ): Promise<{ item: ItemMobiliaColocado; negocio: Negocio }> {
    const b = bonusAtributos ?? {};
    const { data, error } = await this.db
      .rpc("comprar_mobilia", {
        p_tenant_id: Number(tenantId),
        p_item_id: itemId,
        p_slot: slot,
        p_custo: custoMoeda,
        p_tecnologia: b.tecnologia ?? 0,
        p_processo: b.processo ?? 0,
        p_presenca: b.presenca ?? 0,
        p_aquisicao: b.aquisicao ?? 0,
        p_capacidade: b.capacidade ?? 0,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "comprar_mobilia: sem retorno");
    }
    const item = this.paraItemColocado(
      data as Parameters<typeof this.paraItemColocado>[0],
    );
    const negocio = await this.lerNegocio(tenantId);
    if (!negocio) throw new Error(`Negócio ${tenantId} não encontrado`);
    return { item, negocio };
  }

  async moverMobilia(
    tenantId: string,
    itemColocadoId: string,
    novoSlot: number,
  ): Promise<ItemMobiliaColocado> {
    const { data, error } = await this.db
      .rpc("mover_mobilia", {
        p_tenant_id: Number(tenantId),
        p_item_colocado_id: Number(itemColocadoId),
        p_novo_slot: novoSlot,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "mover_mobilia: sem retorno");
    }
    return this.paraItemColocado(
      data as Parameters<typeof this.paraItemColocado>[0],
    );
  }

  private paraEventoGlobal(l: {
    id: string;
    titulo: string;
    descricao: string;
    objetivo: string;
    meta: number;
    inicio_em: string;
    fim_em: string;
    recompensa_xp: number;
    recompensa_moeda: number;
    recompensa_atributo_chave: AtributoChave | null;
    recompensa_atributo_ganho: number | null;
    criado_por: string;
    criado_em: string;
  }): EventoGlobal {
    return {
      id: l.id,
      titulo: l.titulo,
      descricao: l.descricao,
      objetivo: l.objetivo,
      meta: l.meta,
      inicioEm: l.inicio_em,
      fimEm: l.fim_em,
      recompensa: {
        xp: l.recompensa_xp,
        moeda: l.recompensa_moeda,
        atributo:
          l.recompensa_atributo_chave && l.recompensa_atributo_ganho != null
            ? { chave: l.recompensa_atributo_chave, ganho: l.recompensa_atributo_ganho }
            : undefined,
      },
      criadoPor: l.criado_por,
      criadoEm: l.criado_em,
    };
  }

  async listarEventosGlobais(): Promise<EventoGlobal[]> {
    const { data, error } = await this.db
      .from("eventos_globais")
      .select("*")
      .order("inicio_em", { ascending: true });
    if (error) throw new Error(`listarEventosGlobais: ${error.message}`);
    return ((data ?? []) as Array<Parameters<typeof this.paraEventoGlobal>[0]>).map(
      (l) => this.paraEventoGlobal(l),
    );
  }

  async criarEventoGlobal(
    evento: Omit<EventoGlobal, "criadoEm">,
  ): Promise<EventoGlobal> {
    const { data, error } = await this.db
      .rpc("criar_evento_global", {
        p_id: evento.id,
        p_titulo: evento.titulo,
        p_descricao: evento.descricao,
        p_objetivo: evento.objetivo,
        p_meta: evento.meta,
        p_inicio_em: evento.inicioEm,
        p_fim_em: evento.fimEm,
        p_recompensa_xp: evento.recompensa.xp,
        p_recompensa_moeda: evento.recompensa.moeda,
        p_criado_por: evento.criadoPor,
        p_atributo_chave: evento.recompensa.atributo?.chave ?? null,
        p_atributo_ganho: evento.recompensa.atributo?.ganho ?? null,
      })
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "criar_evento_global: sem retorno");
    }
    return this.paraEventoGlobal(data as Parameters<typeof this.paraEventoGlobal>[0]);
  }

  private paraProgresso(l: {
    evento_id: string;
    tenant_id: number;
    contagem: number;
    completo_em: string | null;
  }): ProgressoEventoGlobal {
    return {
      eventoId: l.evento_id,
      tenantId: String(l.tenant_id),
      contagem: l.contagem,
      completoEm: l.completo_em,
    };
  }

  async listarProgressoEventos(tenantId: string): Promise<ProgressoEventoGlobal[]> {
    const { data, error } = await this.db
      .from("progresso_eventos_globais")
      .select("*")
      .eq("tenant_id", Number(tenantId));
    if (error) throw new Error(`listarProgressoEventos: ${error.message}`);
    return ((data ?? []) as Array<Parameters<typeof this.paraProgresso>[0]>).map((l) =>
      this.paraProgresso(l),
    );
  }

  /** Atômica via RPC `incrementar_progresso_eventos` — soma 1 em todo
   *  evento ativo com esse objetivo e, na primeira vez que bate a meta,
   *  aplica a recompensa na mesma transação (ver `0013_eventos_globais.sql`). */
  async incrementarProgressoEventos(
    tenantId: string,
    eventoKey: string,
  ): Promise<ProgressoEventoGlobal[]> {
    const { data, error } = await this.db.rpc("incrementar_progresso_eventos", {
      p_tenant_id: Number(tenantId),
      p_evento_key: eventoKey,
    });
    if (error) {
      throw new Error(error.message ?? "incrementar_progresso_eventos: erro");
    }
    return ((data ?? []) as Array<Parameters<typeof this.paraProgresso>[0]>).map((l) =>
      this.paraProgresso(l),
    );
  }
}
