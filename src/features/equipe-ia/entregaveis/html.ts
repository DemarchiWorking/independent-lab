/**
 * Escapa conteúdo vindo do usuário antes de entrar no HTML.
 *
 * NÃO é paranoia: `nomeNegocio` é digitado no cadastro e vai para dentro
 * do documento. Sem escapar, um negócio chamado `<script>…` viraria script
 * executável no momento em que o dono abrisse o arquivo baixado.
 *
 * Vive num módulo próprio porque todo renderizador de entregável (canvas,
 * script, reel) depende dela — e nenhum deve depender de outro renderizador.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
