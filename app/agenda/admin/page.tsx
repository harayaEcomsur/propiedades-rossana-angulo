import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clientConfig } from "@/config/client.config";
import { Header } from "@/components/layout/Header";
import { AdminAgenda } from "@/components/agenda/AdminAgenda";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { currentAgendaUser, googleLoginEnabled, claveLoginEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Panel de agenda — ${clientConfig.meta.businessName}`,
  robots: { index: false, follow: false },
};

// Panel del negocio — admin y staff (ej. cada barbero/peluquera), ver
// lib/auth.ts. Dos formas de entrar, ambas opcionales: (1) cuenta de Google,
// autorizada contra config.admin.users; (2) el link con clave heredado
// (?clave=…, siempre admin), mientras AGENDA_ADMIN_KEY exista. Qué puede tocar
// cada rol se resuelve adentro de AdminAgenda según lo que devuelva la API.
export default async function AgendaAdminPage({ searchParams }: { searchParams: { clave?: string } }) {
  if (!clientConfig.modules.agenda) notFound();
  const adminKey = process.env.AGENDA_ADMIN_KEY;
  const user = await currentAgendaUser(searchParams.clave ?? null);
  const authorized = Boolean(user);
  const claveMatched = Boolean(adminKey && searchParams.clave === adminKey);
  const googleEnabled = googleLoginEnabled();
  const claveEnabled = claveLoginEnabled();

  return (
    <>
      <Header config={clientConfig} />
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Panel del negocio</p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">Administrar agenda</h1>
          {!authorized ? (
            <div className="mt-8 flex flex-col gap-6 rounded-xl border border-foreground/15 p-6">
              <p className="text-foreground/70">
                Este panel administra tus reservas: confirmar, cancelar, bloquear horarios y configurar avisos — no es
                un módulo de pago.
              </p>
              {googleEnabled && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">Entra con tu cuenta de Google</p>
                  <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!} />
                </div>
              )}
              {claveEnabled && (
                <p className="text-foreground/70">
                  {googleEnabled ? "También puedes entrar" : "Ingresa"} con tu link de administración{" "}
                  <code className="rounded bg-foreground/10 px-1.5 py-0.5 text-sm">/agenda/admin?clave=…</code>.
                </p>
              )}
              {!googleEnabled && !claveEnabled && (
                <p className="text-foreground/70">
                  El acceso al panel no está configurado todavía — contacta a HarayaDev para activarlo.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-8">
              <AdminAgenda
                adminKey={claveMatched ? adminKey : undefined}
                notifyEmail={process.env.BOOKINGS_NOTIFY_EMAIL ?? null}
                businessName={clientConfig.meta.businessName}
                services={clientConfig.services.map((s) => ({ title: s.title, durationMinutes: s.durationMinutes, price: s.price }))}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
