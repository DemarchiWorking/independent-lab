/** Versão da política de privacidade vigente (GH-OPS-04) — muda quando o
 *  texto de `/privacidade` mudar de forma relevante; o consentimento
 *  registrado no cadastro (`Negocio.consentimentoVersao`) referencia isto,
 *  nunca o texto em si (o texto pode mudar, o registro do que foi aceito
 *  não pode).
 *
 *  Vive num módulo próprio (não em `actions.ts`) porque um arquivo
 *  `"use server"` só pode exportar funções async — uma constante ali
 *  quebra o build. */
export const POLITICA_PRIVACIDADE_VERSAO = "2026-07-28";
