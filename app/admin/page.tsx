import { redirect } from "next/navigation";

// Dirección corta y fácil de recordar para el panel.
export default function AdminShortcut() {
  redirect("/inmobiliaria/admin");
}
