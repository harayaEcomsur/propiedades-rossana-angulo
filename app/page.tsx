import { HomeContent } from "@/components/HomeContent";

// Las propiedades y el feed de Instagram cambian sin redeploy: la home se
// regenera al guardar en el panel (revalidatePath) y, de resguardo, cada 5 min.
export const revalidate = 300;

export default function HomePage() {
  return <HomeContent />;
}
