/**
 * Ficha do tenant (GH-DOC-01) — junta tudo que o jogo já sabe sobre o
 * negócio (perfil multi-tenant: cadastro, onboarding, vitrine, equipe de
 * IA, sede, parcerias) num único markdown. É este texto que vira
 * `contexto_snapshot` na fila (`enfileirar_geracao_documento`) e que o
 * motor headless (`document-engine/`) lê para gerar Canvas + Modelo de
 * Negócio — nunca lemos o banco de novo a partir do motor: a ficha É a
 * fonte da verdade da rodada, versionada por hash.
 */
import { createHash } from "node:crypto";
import type {
  FuncionarioContratado,
  Negocio,
  Oferta,
  Onboarding,
  ParceriaFormada,
  Sede,
} from "@/lib/db/types";
import { ATRIBUTO_CHAVES } from "@/lib/atributos";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { SEGMENTOS } from "@/features/mapa/segmentos";
import { CARGOS_IA } from "@/features/equipe-ia/catalogo";
import { NIVEIS_SEDE } from "@/features/sede/niveis";

const ROTULOS_ATRIBUTO: Record<(typeof ATRIBUTO_CHAVES)[number], string> = {
  tecnologia: "Tecnologia",
  processo: "Processo",
  presenca: "Presença",
  aquisicao: "Aquisição",
  capacidade: "Capacidade",
};

export interface ContextoNegocio {
  negocio: Negocio;
  onboarding: Onboarding | null;
  ofertas: Oferta[];
  funcionarios: FuncionarioContratado[];
  parcerias: ParceriaFormada[];
  sede: Sede | null;
}

export function construirFichaMarkdown(ctx: ContextoNegocio): string {
  const { negocio, onboarding, ofertas, funcionarios, parcerias, sede } = ctx;
  const linhas: string[] = [];

  linhas.push(`# Ficha do negócio — ${negocio.nome}`);
  linhas.push("");
  linhas.push(
    `_Snapshot gerado em ${new Date().toISOString()} a partir do perfil multi-tenant do labdatadev-gamehub (tenant ${negocio.id}). Toda a documentação deve se basear SÓ nestes dados — nunca em generalidades de mercado._`,
  );
  linhas.push("");

  linhas.push("## 1. Identidade");
  linhas.push(`- Nome: ${negocio.nome}`);
  linhas.push(`- Segmento: ${SEGMENTOS[negocio.segmento]?.label ?? negocio.segmento}`);
  linhas.push(
    `- Localização: ${negocio.endereco.bairroSlug} / ${negocio.endereco.cidadeSlug} (quarteirão ${negocio.endereco.quarteiraoId}, lote ${negocio.endereco.lote})`,
  );
  linhas.push(`- No jogo desde: ${negocio.criadoEm}`);
  linhas.push("");

  linhas.push("## 2. Escada de valor (posição comercial)");
  const atual = DEGRAUS[negocio.degrauAtual];
  const alvo = DEGRAUS[negocio.degrauAlvo];
  linhas.push(
    `- Degrau atual: ${negocio.degrauAtual} — ${atual?.nome ?? "?"} (${atual?.preco ?? "?"})`,
  );
  linhas.push(
    `- Degrau alvo: ${negocio.degrauAlvo} — ${alvo?.nome ?? "?"} (${alvo?.preco ?? "?"})`,
  );
  linhas.push(`- Nível de jogo: ${negocio.nivel} (XP ${negocio.xp})`);
  linhas.push("");

  linhas.push("## 3. Economia de atributos (0–40, eixo de maturidade operacional)");
  for (const chave of ATRIBUTO_CHAVES) {
    linhas.push(`- ${ROTULOS_ATRIBUTO[chave]}: ${negocio.atributos[chave]}/40`);
  }
  linhas.push("");

  linhas.push("## 4. Diagnóstico de onboarding (respostas do dono)");
  if (onboarding) {
    const r = onboarding.respostas;
    linhas.push(`- Fit comercial (score): ${onboarding.scoreFit}/100`);
    linhas.push(`- Tamanho da equipe: ${r.equipe}`);
    linhas.push(`- Presença digital hoje: ${r.presencaDigital}`);
    linhas.push(`- Canais de captação usados: ${r.captacao.join(", ") || "nenhum informado"}`);
    linhas.push(`- Objetivo principal: ${r.objetivo}`);
    linhas.push(`- Maior gargalo: ${r.gargalo}`);
    linhas.push(`- Faixa de investimento disponível: ${r.investimento}`);
    linhas.push(
      `- Serviços recomendados pelo motor de scoring: ${onboarding.servicosRecomendados.join(", ") || "nenhum"}`,
    );
    linhas.push(`- Respondido em: ${onboarding.respondidoEm}`);
  } else {
    linhas.push("_Onboarding ainda não respondido — nenhum dado disponível._");
  }
  linhas.push("");

  linhas.push("## 5. Vitrine pública (ofertas divulgadas)");
  if (ofertas.length > 0) {
    for (const o of ofertas) {
      linhas.push(`- **${o.titulo}** — ${o.preco || "preço sob consulta"}. ${o.descricao}`);
    }
  } else {
    linhas.push("_Nenhuma oferta publicada ainda._");
  }
  linhas.push("");

  linhas.push("## 6. Equipe de IA contratada (Funcionários de IA)");
  if (funcionarios.length > 0) {
    for (const f of funcionarios) {
      const cargo = CARGOS_IA.find((c) => c.id === f.cargoId);
      linhas.push(
        `- ${cargo?.nome ?? f.cargoId} (nível ${f.nivel}) — contratado em ${f.contratadoEm}`,
      );
    }
  } else {
    linhas.push("_Nenhum Funcionário de IA contratado ainda._");
  }
  linhas.push("");

  linhas.push("## 7. Sede");
  if (sede) {
    linhas.push(`- Nível: ${sede.nivel} — ${NIVEIS_SEDE[sede.nivel]?.nome ?? "?"}`);
  } else {
    linhas.push("_Sede ainda não criada._");
  }
  linhas.push("");

  linhas.push("## 8. Parcerias regionais");
  linhas.push(
    parcerias.length > 0
      ? `- ${parcerias.length} parceria(s) formada(s) com vizinhos do quarteirão.`
      : "_Nenhuma parceria formada ainda._",
  );

  return linhas.join("\n");
}

/** Hash estável do conteúdo — usado pela RPC pra não reenfileirar sem
 *  mudança real desde a última geração concluída (ver migration 0037). */
export function hashFicha(markdown: string): string {
  return createHash("sha256").update(markdown).digest("hex");
}
