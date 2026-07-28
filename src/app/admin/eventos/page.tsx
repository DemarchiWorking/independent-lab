import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth/sessao";
import { souAdmin } from "@/lib/admin";
import { listarTodosEventos } from "@/features/eventos-globais/actions";
import { statusDe } from "@/features/eventos-globais/motor";
import { AdminEventoForm } from "@/features/eventos-globais/AdminEventoForm";
import { agoraGlobal } from "@/features/historia/relogio";

export const metadata = { title: "Admin · Eventos globais" };

/** Tela de admin do Épico 11 — mensagem neutra para quem não está na
 *  allowlist (`GAMEHUB_ADMIN_EMAILS`), nunca um erro técnico que revele
 *  que a rota existe/o motivo exato da recusa. */
export default async function AdminEventosPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  if (!souAdmin(sessao.email)) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">
        Página não encontrada.
      </main>
    );
  }

  const eventos = await listarTodosEventos();
  const agora = agoraGlobal();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub · admin
      </p>
      <h1 className="mb-4 text-xl font-extrabold text-ink">Eventos globais</h1>

      <AdminEventoForm />

      <h2 className="mb-2 mt-8 text-sm font-extrabold uppercase tracking-wide text-ink">
        Já criados ({eventos.length})
      </h2>
      {eventos.length === 0 ? (
        <p className="text-xs text-muted">Nenhum evento criado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {eventos
            .slice()
            .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
            .map((e) => (
              <li key={e.id} className="rounded-md bg-panel p-3 text-xs text-ink">
                <b>{e.titulo}</b> · {statusDe(e, agora)} · meta {e.meta} · {e.recompensa.xp} XP
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
