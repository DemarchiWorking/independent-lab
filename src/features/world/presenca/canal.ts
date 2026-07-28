/**
 * Contrato futuro de presença ao vivo (roadmap G4, ver
 * docs/world/EVOLUCAO-MOTOR-2026.md §5.1/§10 e docs/world/VISITAR-VIZINHO.md §6).
 *
 * Este arquivo é DELIBERADAMENTE inerte — só documenta a costura, não
 * implementa nada. Não existe projeto Supabase real hoje (`GAMEHUB_DB=file`
 * local, `.env` sem `NEXT_PUBLIC_SUPABASE_URL`), então não há `.channel()`,
 * nenhuma dependência nova, e nada aqui é importado por `VisitaScreen.tsx`
 * ou qualquer outro código em produção.
 *
 * Quando um projeto Supabase real existir, a implementação prevista (ver
 * EVOLUCAO-MOTOR-2026.md §3.5) usa Supabase Realtime Presence — não
 * Broadcast nem Postgres Changes — porque presença é exatamente o caso de
 * uso que a API foi desenhada para resolver (lista de quem está "aqui
 * agora", sincronizada automaticamente entre clientes conectados ao mesmo
 * canal, sem precisar modelar isso como linha de tabela).
 */

export interface VisitantePresente {
  tenantId: string;
  nome: string;
  entrouEm: string;
}

/**
 * Assina o canal de presença de UMA sala (a sede de `salaTenantId`) e
 * mantém `aoEntrar`/`aoSair` chamados conforme visitantes entram/saem.
 * Retorna a função de cancelamento da assinatura.
 *
 * Não implementado — assinatura de tipo apenas, para o contrato existir no
 * lugar certo quando a implementação real chegar.
 */
export declare function assinarPresenca(
  salaTenantId: string,
  aoEntrar: (visitante: VisitantePresente) => void,
  aoSair: (visitanteTenantId: string) => void,
): () => void;

/**
 * Anuncia que o tenant logado entrou/saiu da sala de `salaTenantId`. Chamado
 * pela tela de visita quando ela montar/desmontar, uma vez que a
 * implementação real existir.
 */
export declare function publicarPresenca(
  salaTenantId: string,
  presente: boolean,
): Promise<void>;
