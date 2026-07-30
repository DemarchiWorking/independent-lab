"use client";

import { useEffect, useRef, useState } from "react";
import { assinarPresenca, type VisitantePresente } from "./canal";

export interface UsePresencaResultado {
  /** quem mais está na sala agora, ao vivo — nunca inclui você mesmo */
  visitantes: VisitantePresente[];
  /** `false` = presença ao vivo indisponível agora (degradado). A sala
   *  continua funcionando normalmente — isto é só para a UI decidir se
   *  mostra "N online" ou nada. */
  aoVivo: boolean;
}

/**
 * Hook de presença ao vivo para uma sede (GH-OPS Bloco 5).
 *
 * `eu` precisa ser referencialmente estável entre renders (memoize no
 * chamador, ou passe primitivos) — o efeito reconecta sempre que
 * `salaTenantId`/`eu.tenantId`/`eu.nome` mudam, nunca a cada render.
 */
export function usePresenca(
  salaTenantId: string,
  eu: { tenantId: string; nome: string },
): UsePresencaResultado {
  const [visitantes, setVisitantes] = useState<VisitantePresente[]>([]);
  const [aoVivo, setAoVivo] = useState(false);
  // guarda a versão mais recente do callback sem recriar o efeito a cada render
  const aoMudarRef = useRef(setVisitantes);
  aoMudarRef.current = setVisitantes;

  useEffect(() => {
    let cancelou = false;
    let cancelarPresenca: (() => void) | null = null;

    assinarPresenca(
      salaTenantId,
      { tenantId: eu.tenantId, nome: eu.nome, entrouEm: new Date().toISOString() },
      (novos) => aoMudarRef.current(novos),
    ).then((cancelar) => {
      if (cancelou) {
        // já desmontou enquanto a conexão estava em andamento
        cancelar?.();
        return;
      }
      cancelarPresenca = cancelar;
      setAoVivo(cancelar !== null);
    });

    return () => {
      cancelou = true;
      cancelarPresenca?.();
      setVisitantes([]);
      setAoVivo(false);
    };
  }, [salaTenantId, eu.tenantId, eu.nome]);

  return { visitantes, aoVivo };
}
