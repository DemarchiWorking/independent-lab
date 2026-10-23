/**
 * Envio de e-mail transacional via Resend (HTTPS, sem SMTP) — mesmo
 * provedor já usado em `/opt/labdatadev` (`send-welcome-email`). Server-only.
 *
 * Degrada em silêncio sem `RESEND_API_KEY` (log de aviso, nunca lança) —
 * mesmo princípio de `lib/localizacao/cep.ts`: uma dependência externa
 * ausente nunca pode travar um fluxo do produto. Quem chama decide se a
 * ausência de envio muda a resposta ao usuário (recuperação de senha, por
 * exemplo, continua "sucesso" genérico mesmo sem chave configurada — nunca
 * revela se o e-mail existe).
 */
export async function enviarEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.GAMEHUB_FROM_EMAIL ?? "gamehub@labdatadev.com.br";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY ausente — e-mail não enviado ("${params.subject}" para ${params.to})`,
    );
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      console.error("[email] Resend recusou:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[email] falha de rede ao chamar Resend:", erro);
    return false;
  }
}
