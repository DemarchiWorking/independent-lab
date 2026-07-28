"use client";

import { Icon } from "@/components/ui/Icon";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { nivelSede } from "@/features/sede/niveis";
import { alertaDeSaldo, resumoFinanceiro } from "./calculo";
import type { FuncionarioContratado, ItemMobiliaColocado } from "@/lib/db/types";

interface FinancasScreenProps {
  moedaVirtual: number;
  nivelSedeAtual: number;
  mobilia: ItemMobiliaColocado[];
  funcionarios: FuncionarioContratado[];
}

/**
 * Finanças (GH-FIN-01) — simulador educativo, nunca operação real.
 *
 * A tela é dividida em DOIS blocos que nunca se somam: economia do jogo
 * (🪙) e compromissos reais (R$). Essa separação é regra de produto, não
 * escolha de layout — ver `calculo.ts`.
 */
export function FinancasScreen({
  moedaVirtual,
  nivelSedeAtual,
  mobilia,
  funcionarios,
}: FinancasScreenProps) {
  const r = resumoFinanceiro(moedaVirtual, nivelSedeAtual, mobilia, funcionarios);
  const alerta = alertaDeSaldo(r);
  const sede = nivelSede(nivelSedeAtual);

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto text-ink">
      {alerta ? (
        <p className="flex items-center gap-2 rounded-sm bg-orange/20 px-2.5 py-1.5 text-[11px] font-bold text-[#7a4a12]">
          <Icon name="bolt" size={13} />
          {alerta}
        </p>
      ) : null}

      {/* ECONOMIA DO JOGO — moeda virtual */}
      <section className="rounded-md bg-[#f7f9fc] p-3">
        <h3 className="mb-0.5 flex items-center gap-1.5 text-sm font-extrabold text-teal">
          <Icon name="coin" size={15} />
          Economia do jogo (🪙)
        </h3>
        <p className="mb-2.5 text-[11px] text-[#5b6b86]">
          Moeda virtual do gamehub. Não vira dinheiro real, e nada aqui é cobrado.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metrica rotulo="Saldo" valor={`🪙 ${r.saldoVirtual.toLocaleString("pt-BR")}`} />
          <Metrica
            rotulo="Custo da sede/mês"
            valor={r.custoMensalVirtual > 0 ? `🪙 ${r.custoMensalVirtual}` : "—"}
            nota={sede.nome}
          />
          <Metrica
            rotulo="Cobertura"
            valor={r.runwayMeses === null ? "sem custo fixo" : `${r.runwayMeses} ${r.runwayMeses === 1 ? "mês" : "meses"}`}
          />
          <Metrica
            rotulo="Em equipamentos"
            valor={`🪙 ${r.patrimonioEquipamentos.toLocaleString("pt-BR")}`}
            nota={`${mobilia.length} ${mobilia.length === 1 ? "item" : "itens"}`}
          />
        </div>
        <p className="mt-2 text-[10px] text-[#94a3b8]">
          Projeção a partir do estado atual — o jogo não guarda extrato de
          transações, então isto não é um relatório contábil.
        </p>
      </section>

      {/* COMPROMISSOS REAIS — R$ */}
      <section className="rounded-md bg-[#f7f9fc] p-3">
        <h3 className="mb-0.5 flex items-center gap-1.5 text-sm font-extrabold text-green">
          <Icon name="file" size={15} />
          Compromissos reais (R$)
        </h3>
        <p className="mb-2.5 text-[11px] text-[#5b6b86]">
          Assinatura dos Funcionários de IA que você contratou. Dinheiro de
          verdade, combinado fora do jogo — nunca debitado automaticamente.
        </p>

        {funcionarios.length > 0 ? (
          <>
            <ul className="space-y-1.5">
              {funcionarios.map((f) => {
                const cargo = cargoPorId(f.cargoId);
                if (!cargo) return null;
                return (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-sm bg-white px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon name={cargo.icon} size={13} />
                      <b>{cargo.nome}</b>
                      <span className="text-[10px] text-[#5b6b86]">Nv {f.nivel}</span>
                    </span>
                    <b className="text-green">R$ {cargo.precoMensal}/mês</b>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-center justify-between rounded-sm bg-green/10 px-2.5 py-2 text-xs">
              <b>Total mensal</b>
              <b className="text-green">
                R$ {r.compromissoMensalReal.toLocaleString("pt-BR")}/mês
              </b>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-[#5b6b86]">
            Nenhum Funcionário de IA contratado — nenhum compromisso real ativo.
          </p>
        )}
      </section>
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  nota,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="rounded-sm bg-white p-2.5">
      <small className="block font-pixel text-[7px] uppercase tracking-wide text-[#5b6b86]">
        {rotulo}
      </small>
      <b className="block text-sm tabular-nums">{valor}</b>
      {nota ? <small className="text-[10px] text-[#94a3b8]">{nota}</small> : null}
    </div>
  );
}
