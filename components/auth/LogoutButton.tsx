"use client";

import { LogOut } from "lucide-react";

export function LogoutButton({ endpoint = "/api/auth/logout-re" }: { endpoint?: string }) {
  return (
    <button
      onClick={async () => {
        await fetch(endpoint, { method: "POST" });
        window.location.href = "/inmobiliaria/admin";
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-foreground/20 px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/5"
    >
      <LogOut size={15} aria-hidden /> Cerrar sesión
    </button>
  );
}
