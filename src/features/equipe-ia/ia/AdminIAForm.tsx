"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import type { ConfigIA, ModoIA } from "./contrato";
import { rodarMelhoriaAgora, salvarConfigIA } from "./actions";

/**
 * Formulário da configuração da IA. Só quem é admin da IA chega aqui, mas a
 * checagem que vale é a das ações no servidor (`actions.ts`): esconder um
 * botão não protege nada.
 */

export interface OpcaoDeModelo {
  id: string;
  nome: string;
  precos: string;
}

interface Props {
  config: ConfigIA;
  modelos: OpcaoDeModelo[];
  /** modos que o worker diz que consegue usar agora */
  modosDisponiveis: ModoIA[];
}

const campo = "rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm";
const rotulo = "flex flex-col gap-1 text-xs font-bold";

export function AdminIAForm({ config, modelos, modosDisponiveis }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoIA>(config.modo);

  const assinaturaDisponivel = modosDisponiveis.includes("assinatura") || config.modo === "assinatura";

  function salvar(fd: FormData) {
    setErro(null);
    setAviso(null);
    const n = (nome: string) => Number(fd.get(nome));
    const entrada = {
      ativa: fd.get("ativa") === "on",
      modo,
      melhoriaContinua: fd.get("melhoriaContinua") === "on",
      modeloUsuario: String(fd.get("modeloUsuario") ?? ""),
      modeloLote: String(fd.get("modeloLote") ?? ""),
      maxTokensSaida: n("maxTokensSaida"),
      intervaloVarreduraMin: n("intervaloVarreduraMin"),
      limites: {
        pedidosPorNegocioDia: n("pedidosPorNegocioDia"),
        melhoriasPorVarredura: n("melhoriasPorVarredura"),
        jobsPorDia: n("jobsPorDia"),
        gastoMaxUsdDia: n("gastoMaxUsdDia"),
        refinosPorDocumento: n("refinosPorDocumento"),
      },
    };
    iniciar(async () => {
      const r = await salvarConfigIA(entrada);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      setAviso(r.mudancas && r.mudancas.length > 0 ? `Salvo: ${r.mudancas.join("; ")}.` : "Nada mudou.");
      router.refresh();
    });
  }

  function rodarAgora() {
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const r = await rodarMelhoriaAgora();
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível rodar.");
        return;
      }
      const v = r.varredura;
      const c = r.coleta;
      setAviso(
        `Coleta: ${c?.aceitos ?? 0} aceitos, ${c?.rejeitados ?? 0} rejeitados, ${c?.obsoletos ?? 0} obsoletos. ` +
          (v?.pulou ? `Varredura pulada (${v.pulou}).` : `Varredura: ${v?.enfileirados ?? 0} enfileirados de ${v?.candidatos ?? 0} candidatos.`),
      );
      router.refresh();
    });
  }

  return (
    <form action={salvar} className="grid grid-cols-1 gap-4 rounded-md bg-panel p-4 text-ink sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input type="checkbox" name="ativa" defaultChecked={config.ativa} className="h-5 w-5" />
        IA ligada (chave geral)
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-xs font-bold">Como a IA se autentica na Anthropic</legend>
        <div className="space-y-2">
          <label className="flex items-start gap-2 rounded-sm border border-[#c7cedb] p-2 text-sm">
            <input type="radio" name="modo-visivel" checked={modo === "api"} onChange={() => setModo("api")} className="mt-1 h-4 w-4" />
            <span>
              <b>API com créditos (padrão, recomendado)</b>
              <small className="block text-[11px] text-soft">Chave do Console da Anthropic, só no worker. Segue os termos da Anthropic e aceita teto mensal de gasto no Console.</small>
            </span>
          </label>
          <label className={`flex items-start gap-2 rounded-sm border p-2 text-sm ${assinaturaDisponivel ? "border-[#c7cedb]" : "border-[#e0e5ee] opacity-60"}`}>
            <input
              type="radio"
              name="modo-visivel"
              checked={modo === "assinatura"}
              disabled={!assinaturaDisponivel}
              onChange={() => setModo("assinatura")}
              className="mt-1 h-4 w-4"
            />
            <span>
              <b>Assinatura Claude Pro/Max (por sua conta e risco)</b>
              <small className="block text-[11px] text-soft">
                {assinaturaDisponivel
                  ? "Disponível neste worker."
                  : "Indisponível: o worker precisa de CLAUDE_CODE_OAUTH_TOKEN, do claude instalado e de IA_PERMITIR_ASSINATURA=1."}
              </small>
              <small className="mt-1 block rounded-sm bg-orange/20 px-1.5 py-1 text-[11px] font-bold text-ink">
                A Anthropic não permite rotear requisições dos usuários de um produto por credencial Pro/Max e pode agir sem aviso.
                O limite do plano também é pensado para uso individual. Os dados dos seus clientes passariam por uma conta de consumidor.{" "}
                <a href="https://code.claude.com/docs/en/legal-and-compliance" target="_blank" rel="noopener noreferrer" className="underline">
                  Ver os termos
                </a>
                .
              </small>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-sm border border-[#e0e5ee] p-2 text-sm opacity-60">
            <input type="checkbox" disabled checked={false} readOnly className="mt-1 h-4 w-4" />
            <span>
              <b>Créditos extra e cobrança por requisição</b>
              <small className="block text-[11px] text-soft">
                Desativado por enquanto. O uso de cada negócio já é registrado (tokens e custo estimado), pronto para uma cobrança futura.
              </small>
            </span>
          </label>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input type="checkbox" name="melhoriaContinua" defaultChecked={config.melhoriaContinua} className="h-5 w-5" />
        Melhoria contínua (quando a fila está vazia, a IA melhora os materiais dos negócios que autorizaram)
      </label>

      <label className={rotulo}>
        Modelo dos pedidos de usuário
        <select name="modeloUsuario" defaultValue={config.modeloUsuario} className={campo}>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} · {m.precos}
            </option>
          ))}
        </select>
      </label>

      <label className={rotulo}>
        Modelo da melhoria contínua
        <select name="modeloLote" defaultValue={config.modeloLote} className={campo}>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} · {m.precos}
            </option>
          ))}
        </select>
      </label>

      <label className={rotulo}>
        Tokens máximos por resposta
        <input name="maxTokensSaida" type="number" min={2000} max={32000} step={500} defaultValue={config.maxTokensSaida} required className={campo} />
      </label>

      <label className={rotulo}>
        Varredura a cada (minutos)
        <input name="intervaloVarreduraMin" type="number" min={15} max={1440} defaultValue={config.intervaloVarreduraMin} required className={campo} />
      </label>

      <label className={rotulo}>
        Pedidos por negócio por dia
        <input name="pedidosPorNegocioDia" type="number" min={0} max={100} defaultValue={config.limites.pedidosPorNegocioDia} required className={campo} />
      </label>

      <label className={rotulo}>
        Melhorias por varredura
        <input name="melhoriasPorVarredura" type="number" min={0} max={200} defaultValue={config.limites.melhoriasPorVarredura} required className={campo} />
      </label>

      <label className={rotulo}>
        Pedidos por dia (total)
        <input name="jobsPorDia" type="number" min={0} max={5000} defaultValue={config.limites.jobsPorDia} required className={campo} />
      </label>

      <label className={rotulo}>
        Teto de gasto por dia (US$, estimado)
        <input name="gastoMaxUsdDia" type="number" min={0} max={1000} step="0.5" defaultValue={config.limites.gastoMaxUsdDia} required className={campo} />
      </label>

      <label className={rotulo}>
        Refinos automáticos por documento
        <input name="refinosPorDocumento" type="number" min={0} max={5} defaultValue={config.limites.refinosPorDocumento} required className={campo} />
      </label>

      {erro ? (
        <p role="alert" className="rounded-sm bg-coral/15 px-2 py-1.5 text-[12px] font-bold text-coral-dark sm:col-span-2">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p role="status" className="rounded-sm bg-teal/15 px-2 py-1.5 text-[12px] font-bold text-ink sm:col-span-2">
          {aviso}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <div className="min-w-[180px] flex-1">
          <ActionButton type="submit" icon="star" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar configuração"}
          </ActionButton>
        </div>
        <div className="min-w-[180px] flex-1">
          <ActionButton variant="ghost" onClick={rodarAgora} disabled={pendente}>
            Rodar a melhoria agora
          </ActionButton>
        </div>
      </div>
    </form>
  );
}
