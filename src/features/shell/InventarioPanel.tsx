"use client";

import { cn } from "@/lib/cn";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { Icon } from "@/components/ui/Icon";
import { itemMobilia } from "@/features/sede/catalogo";
import { bonusTotalNoNivel } from "@/features/sede/upgrade";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { noPorId } from "@/features/parcerias/data";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import type { AtributoChave } from "@tokens";
import type { FuncionarioContratado, ItemMobiliaColocado } from "@/lib/db/types";

interface InventarioPanelProps {
  open: boolean;
  onClose: () => void;
  mobilia: ItemMobiliaColocado[];
  funcionarios: FuncionarioContratado[];
  nosDesbloqueados: string[];
}

/**
 * Inventário do jogador — tudo que o tenant possui, num lugar só.
 *
 * Projeção pura do que já está persistido (equipamentos, agentes, nós da
 * árvore): nenhuma tabela nova, mesma decisão de `GH-GROW-03`
 * (conquistas) — inventário é uma VISÃO, não um estado próprio.
 */
export function InventarioPanel({
  open,
  onClose,
  mobilia,
  funcionarios,
  nosDesbloqueados,
}: InventarioPanelProps) {
  const vazio =
    mobilia.length === 0 && funcionarios.length === 0 && nosDesbloqueados.length === 0;

  return (
    <RibbonPanel title="Inventário" open={open} onClose={onClose}>
      <div className="max-h-[320px] space-y-3 overflow-auto">
        {vazio ? (
          <p className="px-2 py-6 text-center text-[11px] text-[#5b6b86]">
            Seu inventário está vazio. Compre um equipamento na Sede ou
            contrate um Funcionário de IA para começar.
          </p>
        ) : null}

        {funcionarios.length > 0 ? (
          <Secao titulo="Equipe de IA" contagem={funcionarios.length}>
            {funcionarios.map((f) => {
              const cargo = cargoPorId(f.cargoId);
              if (!cargo) return null;
              return (
                <Linha
                  key={f.id}
                  icon={cargo.icon}
                  cor="bg-teal/20"
                  nome={cargo.nome}
                  nivel={f.nivel}
                  detalhe={
                    f.disponibilidade.estado === "livre"
                      ? "Livre"
                      : "Alocado num trabalho"
                  }
                />
              );
            })}
          </Secao>
        ) : null}

        {mobilia.length > 0 ? (
          <Secao titulo="Equipamentos" contagem={mobilia.length}>
            {mobilia.map((m) => {
              const item = itemMobilia(m.itemId);
              if (!item) return null;
              const bonus = bonusTotalNoNivel(item, m.nivel);
              const detalhe =
                Object.entries(bonus)
                  .map(
                    ([chave, valor]) =>
                      `+${valor} ${ATRIBUTO_LABEL[chave as AtributoChave]}`,
                  )
                  .join(" · ") || "sem bônus";
              return (
                <Linha
                  key={m.id}
                  icon={item.icon}
                  cor={item.cor}
                  nome={item.nome}
                  nivel={m.nivel}
                  detalhe={detalhe}
                />
              );
            })}
          </Secao>
        ) : null}

        {nosDesbloqueados.length > 0 ? (
          <Secao titulo="Serviços desbloqueados" contagem={nosDesbloqueados.length}>
            {nosDesbloqueados.map((noId) => {
              const no = noPorId(noId);
              return (
                <Linha
                  key={noId}
                  icon="network"
                  cor="bg-orange/20"
                  nome={no?.label ?? noId}
                  detalhe="Árvore de parcerias"
                />
              );
            })}
          </Secao>
        ) : null}
      </div>
    </RibbonPanel>
  );
}

function Secao({
  titulo,
  contagem,
  children,
}: {
  titulo: string;
  contagem: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
          {titulo}
        </span>
        <span className="rounded-sm bg-[#e6eaf1] px-1.5 py-0.5 font-pixel text-[7px] text-[#5b6b86]">
          {contagem}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Linha({
  icon,
  cor,
  nome,
  nivel,
  detalhe,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  cor: string;
  nome: string;
  nivel?: number;
  detalhe: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-[#f1f4f9] p-2">
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-sm text-ink", cor)}>
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <b className="block truncate text-[11px] text-ink">
          {nome}
          {nivel !== undefined ? <span className="ml-1 text-teal">Nv {nivel}</span> : null}
        </b>
        <small className="text-[10px] text-[#5b6b86]">{detalhe}</small>
      </div>
    </div>
  );
}
