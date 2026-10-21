import { Archivo, Newsreader } from "next/font/google";

/** Display, headings, labels, data and UI. Variable width (wdth 62–125) and weight. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Story body text, with optical sizing. */
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
