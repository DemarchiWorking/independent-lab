/**
 * URL que o QR Code da apresentação (`/apresentacao`) aponta. Configurável
 * por env var — nunca hardcoded direto no componente — pra trocar pra um
 * domínio real (quando existir) sem precisar editar código, só o `.env` da
 * VPS.
 *
 * Default: IP:porta público desta VPS (não há domínio apontando pro
 * gamehub hoje — ver docs/deploy/README.md). HTTP puro, porta não-padrão:
 * troque para HTTPS num domínio assim que possível, redes de evento
 * costumam ser mais restritivas que uma rede doméstica.
 */
export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "http://2.25.146.39:3006";
