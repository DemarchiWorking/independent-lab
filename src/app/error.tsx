"use client";

/**
 * Erro de uma página. Mostra mensagem amigável e nunca o texto do erro: ele
 * pode conter caminho de arquivo ou dado interno. O `digest` ajuda a achar a
 * linha correspondente no log do servidor.
 */
export default function ErroDePagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
      <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">labdatadev · gamehub</p>
      <h1 className="text-xl font-extrabold text-white">Algo deu errado</h1>
      <p className="text-sm text-muted">Não foi possível carregar esta tela. Tente de novo em instantes.</p>
      {error.digest ? <p className="text-xs text-muted">Código: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-card2 px-4 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
      >
        Tentar de novo
      </button>
    </main>
  );
}
