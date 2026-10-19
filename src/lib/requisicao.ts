import { headers } from "next/headers";

/**
 * IP do cliente para limite de tentativas e logs.
 *
 * Em produção o app não publica porta: só o Caddy da borda alcança o
 * container, e o Caddy não confia no `X-Forwarded-For` que o cliente manda,
 * ele grava o IP real da conexão. Mesmo assim lemos a ÚLTIMA entrada da
 * lista (a acrescentada pelo proxy mais próximo): a primeira é a que um
 * atacante controla quando há um proxy que só acrescenta.
 */
export async function ipDoCliente(): Promise<string> {
  const h = await headers();
  const lista = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = lista.at(-1) ?? h.get("x-real-ip")?.trim() ?? "";
  return ip.slice(0, 64) || "desconhecido";
}
