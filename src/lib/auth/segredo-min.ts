/**
 * Tamanho mínimo do `GAMEHUB_SECRET` (`openssl rand -hex 32` gera 64).
 *
 * Mora sozinha, sem nenhum import, de propósito: `instrumentation.ts` é
 * compilado também para o runtime Edge, e puxar `assinatura.ts` (que usa
 * `node:crypto`) só por esta constante quebrava o `next dev` com
 * "UnhandledSchemeError" e deixava toda página em erro 500.
 */
export const SEGREDO_MIN = 32;
