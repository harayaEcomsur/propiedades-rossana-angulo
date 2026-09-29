import { Inter, Poppins, Lora, Work_Sans, Quicksand, Nunito } from "next/font/google";

const interFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const poppinsFont = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });

const loraFont = Lora({ subsets: ["latin"], variable: "--font-heading" });
const workSansFont = Work_Sans({ subsets: ["latin"], variable: "--font-body" });

const quicksandFont = Quicksand({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });
const nunitoFont = Nunito({ subsets: ["latin"], variable: "--font-body" });

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
