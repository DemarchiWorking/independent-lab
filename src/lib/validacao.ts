/**
 * Validadores pequenos para entradas de formulário e server actions.
 * Server actions recebem dados de qualquer cliente, não só da nossa UI:
 * todo texto tem teto de tamanho e toda opção é conferida contra a lista.
 */

/** Texto de um FormData, sem espaços nas pontas e cortado no limite. */
export function textoDoForm(fd: FormData, campo: string, max: number): string {
  const valor = fd.get(campo);
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

/** Texto já recebido como argumento: `null` se não for string ou passar do limite. */
export function textoLimitado(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo.length <= max ? limpo : null;
}

export const EMAIL_MAX = 254;

export function emailValido(email: string): boolean {
  return email.length <= EMAIL_MAX && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** O valor se estiver na lista de permitidos; senão, o padrão. */
export function opcaoValida<T extends string>(valor: string, permitidos: readonly string[], padrao: T): T {
  return (permitidos.includes(valor) ? valor : padrao) as T;
}

/** Inteiro dentro do intervalo, ou `null`. */
export function inteiroEntre(valor: unknown, min: number, max: number): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= min && valor <= max ? valor : null;
}
