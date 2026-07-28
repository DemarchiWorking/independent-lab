"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { EVENTOS, type EventoKey } from "@/features/gamificacao/engine";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import type { AtributoChave } from "@tokens";
import { criarEventoGlobal } from "./actions";

const OBJETIVOS = Object.keys(EVENTOS) as EventoKey[];
const ATRIBUTOS = Object.keys(ATRIBUTO_LABEL) as AtributoChave[];

/** `datetime-local` não tem timezone — o browser interpreta como hora
 *  local, então `new Date(valor).toISOString()` já dá o instante certo
 *  (mesmo runtime, mesma conversão em toda a stack). */
function paraIso(valorDatetimeLocal: string): string {
  return new Date(valorDatetimeLocal).toISOString();
}

/** Formulário de admin: cria um evento global a partir dos parâmetros
 *  possíveis (gatilho por janela de tempo, objetivo, meta, recompensa) —
 *  Épico 11. Gated no servidor (`criarEventoGlobal` rejeita quem não está
 *  na allowlist), nunca só escondido aqui. */
export function AdminEventoForm() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [comAtributo, setComAtributo] = useState(false);

  function onSubmit(formData: FormData) {
    setErro(null);
    setSucesso(null);
    const titulo = String(formData.get("titulo") ?? "");
    const descricao = String(formData.get("descricao") ?? "");
    const objetivo = String(formData.get("objetivo") ?? "") as EventoKey;
    const meta = Number(formData.get("meta"));
    const inicioEm = paraIso(String(formData.get("inicio") ?? ""));
    const fimEm = paraIso(String(formData.get("fim") ?? ""));
    const xp = Number(formData.get("xp") ?? 0);
    const moeda = Number(formData.get("moeda") ?? 0);
    const atributoChave = formData.get("atributoChave") as AtributoChave | null;
    const atributoGanho = Number(formData.get("atributoGanho") ?? 0);

    iniciar(async () => {
      const r = await criarEventoGlobal({
        titulo,
        descricao,
        objetivo,
        meta,
        inicioEm,
        fimEm,
        recompensa: {
          xp,
          moeda,
          atributo:
            comAtributo && atributoChave ? { chave: atributoChave, ganho: atributoGanho } : undefined,
        },
      });
      if (r.ok) {
        setSucesso(`Evento "${r.evento?.titulo}" criado — já visível para os jogadores dentro da janela.`);
        router.refresh();
      } else {
        setErro(r.erro ?? "Não foi possível criar o evento.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-3 rounded-md bg-panel p-4 text-ink sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2">
        Título
        <input name="titulo" required maxLength={80} className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2">
        Descrição
        <textarea name="descricao" required maxLength={280} rows={2} className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Objetivo
        <select name="objetivo" required className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm">
          {OBJETIVOS.map((chave) => (
            <option key={chave} value={chave}>
              {EVENTOS[chave].label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Meta (quantas vezes)
        <input name="meta" type="number" min={1} defaultValue={3} required className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Início
        <input name="inicio" type="datetime-local" required className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Fim
        <input name="fim" type="datetime-local" required className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Recompensa · XP
        <input name="xp" type="number" min={0} defaultValue={100} className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold">
        Recompensa · Moeda 🪙
        <input name="moeda" type="number" min={0} defaultValue={0} className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
      </label>

      <label className="flex items-center gap-2 text-xs font-bold sm:col-span-2">
        <input type="checkbox" checked={comAtributo} onChange={(e) => setComAtributo(e.target.checked)} />
        Também dar bônus de atributo
      </label>

      {comAtributo ? (
        <>
          <label className="flex flex-col gap-1 text-xs font-bold">
            Eixo
            <select name="atributoChave" className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm">
              {ATRIBUTOS.map((chave) => (
                <option key={chave} value={chave}>
                  {ATRIBUTO_LABEL[chave]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            Ganho
            <input name="atributoGanho" type="number" min={1} defaultValue={1} className="rounded-sm border border-[#c7cedb] px-2 py-1.5 text-sm" />
          </label>
        </>
      ) : null}

      {erro ? <p className="rounded-sm bg-coral/15 px-2 py-1.5 text-[11px] font-bold text-coral-dark sm:col-span-2">{erro}</p> : null}
      {sucesso ? <p className="rounded-sm bg-teal/15 px-2 py-1.5 text-[11px] font-bold text-teal sm:col-span-2">{sucesso}</p> : null}

      <div className="sm:col-span-2">
        <ActionButton type="submit" icon="star" disabled={pendente}>
          {pendente ? "Criando…" : "Criar evento"}
        </ActionButton>
      </div>
    </form>
  );
}
