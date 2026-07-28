/**
 * Junta classes condicionalmente (sem dependências extras).
 * Mantido simples para portar facilmente ao React Native/NativeWind.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
