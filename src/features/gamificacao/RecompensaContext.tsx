"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { ATRIBUTO_TEXT_CLASS } from "@/lib/atributos";
import { recompensar, type ResultadoRecompensa } from "./actions";
import { EVENTOS, type EventoKey } from "./engine";

interface RecompensaCtx {
  /** `contextoId` identifica a entidade do evento (cargo contratado, job
   *  aceito) — usado por `funcionario_ia_contratado` e `servico_contratado`,
   *  ver actions.ts. */
  disparar: (evento: EventoKey, contextoId?: string) => void;
  pendente: boolean;
}

const Ctx = createContext<RecompensaCtx | null>(null);

export function useRecompensa(): RecompensaCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecompensa fora de <RecompensaProvider>");
  return ctx;
}

type Toast =
  | { tipo: "demo" }
  | { tipo: "erro"; msg: string }
  | { tipo: "ok"; evento: EventoKey; r: ResultadoRecompensa };

/**
 * Único caminho de recompensa: dispara o evento, mostra um toast celebratório e
 * atualiza os dados do servidor (HUD, missão, mapa) via router.refresh().
 * Em modo demo (sem sessão) apenas convida a entrar.
 */
export function RecompensaProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);

  const disparar = useCallback(
    (evento: EventoKey, contextoId?: string) => {
      if (demo) {
        setToast({ tipo: "demo" });
        return;
      }
      iniciar(async () => {
        const r = await recompensar(evento, contextoId);
        if (r.ok) {
          setToast({ tipo: "ok", evento, r });
          router.refresh();
        } else {
          setToast({ tipo: "erro", msg: r.erro ?? "Não foi possível concluir." });
        }
      });
    },
    [demo, router],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Ctx.Provider value={{ disparar, pendente }}>
      {children}
      <ToastView toast={toast} onFechar={() => setToast(null)} />
    </Ctx.Provider>
  );
}

function ToastView({
  toast,
  onFechar,
}: {
  toast: Toast | null;
  onFechar: () => void;
}) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute bottom-16 left-1/2 z-40 -translate-x-1/2"
          onClick={onFechar}
        >
          <div className="flex items-center gap-2.5 rounded-md bg-panel px-4 py-2.5 text-ink shadow-modal">
            {toast.tipo === "ok" ? (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-sm bg-green text-ink">
                  <Icon name="check" size={18} />
                </span>
                <div className="leading-tight">
                  <b className="block text-sm">{EVENTOS[toast.evento].label}</b>
                  <span className="text-xs font-bold tabular-nums text-[#166534]">
                    +{toast.r.ganhoXp} XP
                    {toast.r.ganhoMoeda
                      ? ` · +🪙 ${toast.r.ganhoMoeda}`
                      : ""}
                  </span>
                  {toast.r.subiuNivel ? (
                    <span className="ml-1 text-xs font-bold text-teal">
                      Nível {toast.r.nivel}!
                    </span>
                  ) : null}
                  {toast.r.subiuDegrau ? (
                    <span className="ml-1 text-xs font-bold text-orange">
                      Degrau {toast.r.degrauAtual}!
                    </span>
                  ) : null}
                  {toast.r.atributoGanho ? (
                    <span
                      className={`ml-1 text-xs font-bold ${ATRIBUTO_TEXT_CLASS[toast.r.atributoGanho.chave]}`}
                    >
                      +{toast.r.atributoGanho.ganho} {toast.r.atributoGanho.label}
                    </span>
                  ) : null}
                </div>
              </>
            ) : toast.tipo === "demo" ? (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-sm bg-teal text-ink">
                  <Icon name="lock" size={16} />
                </span>
                <b className="text-sm">
                  Entre na sua conta para completar de verdade.
                </b>
              </>
            ) : (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-sm bg-coral text-white">
                  <Icon name="close" size={16} />
                </span>
                <b className="text-sm text-coral-dark">{toast.msg}</b>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
