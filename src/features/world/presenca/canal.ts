import { supabaseAnon } from "@/lib/supabase/client";
import {
  nomeCanal,
  presentesDe,
  supabaseConfigurado,
  type EstadoPresenca,
  type VisitantePresente,
} from "./canalUtil";

export type { VisitantePresente } from "./canalUtil";

/**
 * Presença ao vivo numa sala (GH-MULTI-02) — Supabase Realtime Presence.
 *
 * Decisão de arquitetura em `docs/architecture/BMAD-MULTIPLAYER-VPS.md`
 * (§3.1): Presence, não Broadcast nem Postgres Changes — "quem está aqui
 * agora" é exatamente o caso de uso que essa API resolve, e o estado é
 * efêmero por construção (nunca vira linha de tabela, nunca sobrevive a
 * um refresh — mesma decisão já tomada para conquistas em `GH-GROW-03` e
 * para a posição do avatar em `GH-WORLD-05`).
 *
 * ⚠️ SEGURANÇA — este é o PRIMEIRO código deste projeto que chama
 * `supabaseAnon()` do lado do cliente. A partir do momento em que ele
 * roda num browser, a anon key fica extraível do bundle e a API REST do
 * Supabase passa a ser alcançável por fora do app. Por isso `GH-MULTI-00`
 * (endurecer a RLS de `negocios`) é BLOQUEANTE e precisa estar aplicado e
 * verificado contra Postgres real antes de qualquer tela chamar
 * `entrarNaSala` em produção. Ver `docs/GAPS-DE-INTEGRACAO.md` (🔴).
 *
 * Hoje nenhuma tela chama esta função — a integração é `GH-MULTI-03`.
 */

/**
 * Entra na sala de presença de `salaTenantId`, anuncia `eu` como presente
 * e chama `aoMudar` com a lista completa de presentes a cada mudança.
 * Devolve a função de saída (chamar no cleanup do `useEffect`).
 *
 * `subscribe` + `track` acontecem no MESMO canal, com o `track` dentro do
 * callback de status: `track()` só tem efeito depois que o canal está de
 * fato inscrito, e `supabase.channel(nome)` devolve uma instância NOVA a
 * cada chamada — separar isso em duas funções que criam canais próprios
 * (como um rascunho anterior deste módulo fazia) produz um `track` que
 * nunca chega a ninguém.
 *
 * No-op silencioso quando não há Supabase configurado: em
 * `GAMEHUB_DB=file` a tela de visita continua funcionando normalmente,
 * só sem presença — degradação limpa, nunca exceção.
 */
export function entrarNaSala(
  salaTenantId: string,
  eu: VisitantePresente,
  aoMudar: (presentes: VisitantePresente[]) => void,
): () => void {
  if (!supabaseConfigurado()) return () => {};

  const canal = supabaseAnon().channel(nomeCanal(salaTenantId));

  canal.on("presence", { event: "sync" }, () => {
    aoMudar(presentesDe(canal.presenceState<VisitantePresente>() as EstadoPresenca));
  });

  canal.subscribe((status: string) => {
    if (status === "SUBSCRIBED") void canal.track(eu);
  });

  return () => {
    void canal.unsubscribe();
  };
}
