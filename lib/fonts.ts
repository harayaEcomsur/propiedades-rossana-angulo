import { Inter, Poppins, Lora, Work_Sans, Quicksand, Nunito } from "next/font/google";

// next/font precarga (<link rel="preload">) toda fuente declarada aquí, se use
// o no: con los tres pares eran 8 archivos (~300 KB) compitiendo con la foto
// principal. Solo el par en uso (branding.fontPairing = "elegante") se
// precarga; las opciones de next/font tienen que ser literales, así que al
// cambiar de par hay que mover `preload: true` al par nuevo.

const interFont = Inter({ subsets: ["latin"], preload: false, variable: "--font-body" });
const poppinsFont = Poppins({ subsets: ["latin"], preload: false, weight: ["500", "600", "700"], variable: "--font-heading" });

const loraFont = Lora({ subsets: ["latin"], variable: "--font-heading" });
const workSansFont = Work_Sans({ subsets: ["latin"], variable: "--font-body" });

const quicksandFont = Quicksand({ subsets: ["latin"], preload: false, weight: ["500", "600", "700"], variable: "--font-heading" });
const nunitoFont = Nunito({ subsets: ["latin"], preload: false, variable: "--font-body" });

export const fontPairings = {
  modern: { heading: poppinsFont, body: interFont },
  elegante: { heading: loraFont, body: workSansFont },
  amigable: { heading: quicksandFont, body: nunitoFont },
} as const;

export type FontPairingKey = keyof typeof fontPairings;

export function getFontVariables(key: FontPairingKey): string {
  const pair = fontPairings[key];
  return `${pair.heading.variable} ${pair.body.variable}`;
}
