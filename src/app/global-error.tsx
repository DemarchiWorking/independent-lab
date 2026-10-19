"use client";

/** Último recurso: falha no próprio layout raiz. Precisa trazer <html> e <body>. */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#080e1d", color: "#eaf2ff", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center", padding: 16 }} role="alert">
          <div>
            <h1 style={{ fontSize: 22 }}>O gamehub não conseguiu carregar</h1>
            <p style={{ opacity: 0.8 }}>Tente de novo em instantes.</p>
            {error.digest ? <p style={{ opacity: 0.6, fontSize: 12 }}>Código: {error.digest}</p> : null}
            <button type="button" onClick={reset} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 6 }}>
              Recarregar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
