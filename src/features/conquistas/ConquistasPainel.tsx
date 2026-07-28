import { CATALOGO_CONQUISTAS, type ContextoConquistas } from "./catalogo";

/**
 * Lista de conquistas (GH-GROW-03) — server-rendered, sem JS de cliente
 * necessário: compartilhar é abrir/baixar a imagem OG, não precisa de
 * estado. `tenantId` só entra na URL da imagem (não é dado sensível).
 */
export function ConquistasPainel({
  ctx,
  tenantId,
}: {
  ctx: ContextoConquistas;
  tenantId: string;
}) {
  const avaliadas = CATALOGO_CONQUISTAS.map((c) => ({
    conquista: c,
    desbloqueada: c.condicao(ctx),
    progresso: c.progresso(ctx),
  }));
  const concluidas = avaliadas.filter((a) => a.desbloqueada);
  const emAndamento = avaliadas.filter((a) => !a.desbloqueada);

  return (
    <section className="rounded-md bg-card p-5">
      <h2 className="mb-1 text-base font-extrabold text-white">Conquistas</h2>
      <p className="mb-3 text-xs text-muted">
        Compartilhar é sempre com você — o app nunca posta nada sozinho.
      </p>

      {concluidas.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {concluidas.map(({ conquista }) => (
            <li
              key={conquista.id}
              className="flex items-center justify-between gap-2 rounded-md bg-teal/10 p-3"
            >
              <div>
                <b className="block text-sm text-teal">{conquista.nome}</b>
                <span className="text-xs text-muted">{conquista.descricao}</span>
              </div>
              <a
                href={`/api/og/conquista?tenantId=${tenantId}&conquistaId=${conquista.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md bg-teal px-3 py-2 text-xs font-extrabold text-ink"
              >
                Compartilhar
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {emAndamento.length > 0 ? (
        <ul className="space-y-2">
          {emAndamento.map(({ conquista, progresso }) => (
            <li key={conquista.id} className="rounded-md bg-card2 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <b className="text-sm text-white">{conquista.nome}</b>
                <span className="text-xs text-muted">{progresso}%</span>
              </div>
              <span className="mb-1.5 block text-xs text-muted">{conquista.descricao}</span>
              <div className="h-1.5 w-full overflow-hidden rounded-pill bg-night">
                <div
                  className="h-full bg-teal"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
