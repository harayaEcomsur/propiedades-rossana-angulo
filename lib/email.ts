// Envío de correos del sitio vía Resend (remitente EMAIL_FROM con el dominio
// verificado). Devuelve false en vez de lanzar si falta configuración o
// Resend falla: un aviso que no sale nunca debe romper la acción que lo pidió.
export async function sendEmail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string; cc?: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Sitio web <onboarding@resend.dev>",
        to: opts.to,
        ...(opts.cc ? { cc: opts.cc } : {}),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) console.error("[email] Resend respondió", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (error) {
    console.error("[email] no se pudo enviar:", error);
    return false;
  }
}
