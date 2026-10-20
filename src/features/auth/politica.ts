/** Versão da política de privacidade vigente (GH-OPS-04) — muda quando o
 *  texto de `/privacidade` mudar de forma relevante; o consentimento
 *  registrado no cadastro (`Negocio.consentimentoVersao`) referencia isto,
 *  nunca o texto em si (o texto pode mudar, o registro do que foi aceito
 *  não pode).
 *
 *  Vive num módulo próprio (não em `actions.ts`) porque um arquivo
 *  `"use server"` só pode exportar funções async — uma constante ali
 *  quebra o build. */
export const POLITICA_PRIVACIDADE_VERSAO = "2026-10-20";

/** Primeira versão do texto que informa o tratamento por IA (Anthropic como operadora).
 *  Quem consentiu numa versão anterior precisa autorizar a IA à parte, no estúdio:
 *  o consentimento de 2026-07-28 dizia que os dados nunca iam a terceiros. */
export const POLITICA_IA_VERSAO = "2026-10-20";
