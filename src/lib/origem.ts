/**
 * A requisição veio de uma página deste mesmo site?
 *
 * Rotas que mudam estado ou gastam recurso (POST) só aceitam a mesma origem:
 * um site de terceiros não consegue fazer o navegador do usuário disparar o
 * pedido em nome dele. `Sec-Fetch-Site` é o sinal mais forte (o navegador
 * define e a página não consegue forjar); `Origin` é a checagem de reserva
 * para navegadores que não o enviam.
 */
export function mesmaOrigem(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origem = request.headers.get("origin");
  if (!origem) return true;
  try {
    return new URL(origem).host === request.headers.get("host");
  } catch {
    return false;
  }
}
